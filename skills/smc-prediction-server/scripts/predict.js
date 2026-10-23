#!/usr/bin/env node
'use strict';
// predict.js — given a draft message an agent is about to send, look up the
// most similar past agent messages in the local pair index (built by
// extract-pairs.js) and show how the person actually replied to those.
// Lightweight keyword overlap, not a neural embedding model — no Python, no
// model download, works the moment extract-pairs.js has run once. If you
// want true semantic similarity later, that's a documented optional upgrade
// in SKILL.md; this is the always-works default.
//
// Usage: node predict.js "draft agent message" [--limit 3] [--min-score 2]

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const draft = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).join(' ');
const limit = Number(opt('limit', 3));
const minScore = Number(opt('min-score', 2));

if (!draft.trim()) {
  console.error('Usage: node predict.js "draft agent message" [--limit 3] [--min-score 2]');
  process.exit(1);
}

const STOP = new Set('the a an and or but to of in on for with is are was were be been it this that these those i you we they me my your our please can could would should will just about into from at by as do does did not no yes so if then than there here what which who how why when where'.split(' '));

function terms(text) {
  return [...new Set((text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || []).filter((t) => !STOP.has(t)))];
}

function indexDir() {
  try {
    const out = execFileSync('alignment-harness', ['records', 'reaction-predictor'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* fall through */ }
  return path.join(process.cwd(), '.alignment-harness', 'records', 'reaction-predictor');
}

const file = path.join(indexDir(), 'pairs.jsonl');
let lines = [];
try { lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); } catch { /* none yet */ }

if (!lines.length) {
  console.log(`No history indexed yet (${file} doesn't exist or is empty).`);
  console.log('Run extract-pairs.js first to build the index from your own past sessions.');
  process.exit(0);
}

const draftTerms = terms(draft);
const scored = [];
for (const line of lines) {
  let pair;
  try { pair = JSON.parse(line); } catch { continue; }
  const pairTerms = new Set(terms(pair.agentMessage || ''));
  let overlap = 0;
  for (const t of draftTerms) if (pairTerms.has(t)) overlap += 1;
  if (overlap > 0) scored.push({ overlap, pair });
}

scored.sort((a, b) => b.overlap - a.overlap);
const total = lines.length;
const top = scored.slice(0, limit);

if (!top.length || top[0].overlap < minScore) {
  console.log(`No close precedent in your history for this draft (${total} pairs indexed, best overlap ${top[0] ? top[0].overlap : 0}).`);
  console.log('Treat this as unpredicted — don\'t infer a reaction from a weak or absent match.');
  process.exit(0);
}

console.log(`Top ${top.length} similar past moments (of ${total} indexed):`);
for (const { overlap, pair } of top) {
  console.log('');
  console.log(`  overlap score: ${overlap}  (session ${pair.session}${pair.timestamp ? ', ' + pair.timestamp.slice(0, 10) : ''})`);
  console.log(`  agent said:  ${pair.agentMessage.slice(0, 160)}${pair.agentMessage.length > 160 ? '…' : ''}`);
  console.log(`  they replied: ${pair.personReply.slice(0, 200)}${pair.personReply.length > 200 ? '…' : ''}`);
}

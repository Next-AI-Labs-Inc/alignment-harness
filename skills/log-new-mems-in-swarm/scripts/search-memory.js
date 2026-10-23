#!/usr/bin/env node
'use strict';
// search-memory.js — search the local memory store this skill's
// save-memory.js writes to, so you can check for duplicates before adding
// a new one, and confirm a memory you just wrote is actually findable.
//
// Usage: node search-memory.js "query text" [--repo NAME] [--limit 5]

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const query = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).join(' ');
const repoFilter = opt('repo', null);
const limit = Number(opt('limit', 5));

function resolveMemoryDir() {
  try {
    const out = execFileSync('alignment-harness', ['records', 'memory'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* fall through */ }
  return path.join(process.cwd(), '.alignment-harness', 'records', 'memory');
}

const dir = resolveMemoryDir();
if (!fs.existsSync(dir)) {
  console.log(`No memories logged yet (${dir} doesn't exist). Nothing to search.`);
  process.exit(0);
}

const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
if (!files.length) {
  console.log('No memories logged yet. Nothing to search.');
  process.exit(0);
}

const hits = [];
for (const f of files) {
  const repo = f.replace(/\.jsonl$/, '');
  if (repoFilter && repo !== repoFilter) continue;
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const haystack = `${entry.context || ''} ${entry.lesson || ''} ${(entry.tags || []).join(' ')}`.toLowerCase();
    let score = 0;
    for (const t of terms) if (haystack.includes(t)) score += 1;
    if (score > 0 || !terms.length) hits.push({ score, entry });
  }
}

hits.sort((a, b) => b.score - a.score);
if (!hits.length) {
  console.log(`No memories matched "${query}".`);
  process.exit(0);
}

for (const { entry } of hits.slice(0, limit)) {
  console.log(`[${entry.repo}] ${entry.event_type} (confidence ${entry.confidence ?? '?'}) — ${entry.timestamp}`);
  console.log(`  ${entry.context}`);
  console.log(`  ${entry.lesson}`);
  console.log(`  tags: ${(entry.tags || []).join(', ')}`);
  console.log('');
}

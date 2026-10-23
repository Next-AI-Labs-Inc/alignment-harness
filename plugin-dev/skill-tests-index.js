#!/usr/bin/env node
'use strict';
// Build plugin-dev/skill-tests/README.md: one row per skill test record, the ones that need
// calibration first. Run after any skill test run:  node plugin-dev/skill-tests-index.js

const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'skill-tests');
const manifest = require('../skills-manifest.json').skills.filter((s) => s.status === 'include').map((s) => s.id);

function front(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return out;
}

const FUNCTION_ORDER = ['broken', 'fails-silently', 'needs-setup-no-offer', 'could-not-run', 'asks-to-configure', 'works'];
const SETUP_ORDER = ['dead-end', 'asks-for-material', 'mixed', 'unavoidable-ask', 'delegates', 'no-setup-path'];
const rank = (order, v) => { const i = order.indexOf(v); return i < 0 ? -1 : i; };

const rows = [];
const untested = [];
for (const id of manifest) {
  const f = path.join(DIR, `${id}.md`);
  if (!fs.existsSync(f)) { untested.push(id); continue; }
  const text = fs.readFileSync(f, 'utf8');
  const fm = front(text);
  const fix = (text.split('## Proposed fix')[1] || '').trim();
  rows.push({ id, fm, needsFix: fix && !/^none\.?$/i.test(fix) });
}
rows.sort((a, b) => rank(FUNCTION_ORDER, a.fm.function) - rank(FUNCTION_ORDER, b.fm.function)
  || rank(SETUP_ORDER, a.fm['setup-path']) - rank(SETUP_ORDER, b.fm['setup-path']) || a.id.localeCompare(b.id));

const count = (key, v) => rows.filter((r) => r.fm[key] === v).length;
const humanTested = rows.filter((r) => r.fm['human-tested'] && r.fm['human-tested'] !== 'no').length;
const lines = [
  '# Skill test records',
  '',
  'Every shipped skill gets a record here saying whether it looked like it did its job for a brand-new user, and whether its setup path does the setup work itself (see `../audits/agent-does-the-setup-work.md`). Records are written by a Sonnet agent that runs the skill in the sealed sandbox (`../skill-test-run.sh`) as "Dana", a new user with none of the author\'s data, then reads the transcript and the skill file. Transcripts stay outside the plugin, in `~/.cache/alignment-harness/skill-runs`.',
  '',
  `A person can confirm a record by changing \`human-tested: no\` to \`human-tested: <name>, <date>\` in its frontmatter. ${humanTested} of ${rows.length} are human-tested so far.`,
  '',
  '## Totals',
  '',
  `Shipped skills: ${manifest.length}. Records: ${rows.length}. No record yet: ${untested.length}${untested.length ? ` (${untested.join(', ')})` : ''}.`,
  '',
  '| Did its job for a new user | Skills |',
  '|---|---|',
  ...FUNCTION_ORDER.map((v) => `| ${v} | ${count('function', v)} |`),
  '',
  '| Setup path (agent does the work?) | Skills |',
  '|---|---|',
  ...SETUP_ORDER.map((v) => `| ${v} | ${count('setup-path', v)} |`),
  '',
  '## Every skill, calibration needs first',
  '',
  '| Skill | Did its job | Setup path | Fix proposed | Tested | Human-tested |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| [${r.id}](${r.id}.md) | ${r.fm.function || '?'} | ${r.fm['setup-path'] || '?'} | ${r.needsFix ? 'yes' : '—'} | ${r.fm['tested-on'] || '?'} | ${r.fm['human-tested'] || '?'} |`),
  '',
];
fs.writeFileSync(path.join(DIR, 'README.md'), lines.join('\n'));
console.log(`index: ${rows.length} records, ${untested.length} untested → ${path.join(DIR, 'README.md')}`);

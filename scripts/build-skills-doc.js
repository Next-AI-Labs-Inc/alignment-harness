#!/usr/bin/env node
'use strict';
// Writes docs/skills.md from skills-manifest.json and each skill's own
// description, so the list of shipped skills can never drift from what ships.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(root, 'skills-manifest.json'), 'utf8'));

function description(id) {
  try {
    const t = fs.readFileSync(path.join(root, 'skills', id, 'SKILL.md'), 'utf8');
    const fm = t.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return '';
    const d = fm[1].match(/^description:\s*(.*)$/m);
    let s = d ? d[1].trim() : '';
    if (s === '>' || s === '|' || s === '>-' || s === '|-') {
      const after = fm[1].split(/^description:.*$/m)[1] || '';
      s = after.split('\n').filter((l) => /^\s+\S/.test(l)).map((l) => l.trim()).join(' ');
    }
    s = s.replace(/^["']|["']$/g, '');
    return s.length > 220 ? `${s.slice(0, 217)}…` : s;
  } catch (_) { return '(missing)'; }
}

const included = m.skills.filter((s) => s.status === 'include');
const counts = included.reduce((a, s) => { a[s.scrub] = (a[s.scrub] || 0) + 1; return a; }, {});
const lines = [
  '# Skills that ship with the harness',
  '',
  '## What this is for',
  'The harness ships the author\'s alignment skills — the ones approved for the harness — made to work on anyone\'s machine. Invoke them as `/alignment-harness:<name>` (for example `/alignment-harness:reflect`).',
  '',
  '## How they were made safe to share',
  'Skills are copied in by an explicit list (`skills-manifest.json`), never by folder. Each copy first gets a mechanical scrub (home paths, ids, keys, emails and the author\'s private server address replaced by placeholders, `scripts/import-skills.js`), then a read-through: steps that depended on the author\'s private services now say what they are for, use your setup if you have one (`/alignment-harness:harness-setup`), and otherwise do a local equivalent; the author\'s personal material is removed or kept only as a clearly labelled opt-in example. The private-data scanner must pass on every file.',
  '',
  'Names were kept as they are in the author\'s setup, even where they name him (`jonathan-check*`, `*-founder`, `founder-*`). Other skills and hooks call them by those names, and a working harness matters more than tidier names. Inside, "the founder" and "Jonathan" mean the person you\'re working with, which is you.',
  '',
  `## Is it set up?`,
  `As of ${new Date().toLocaleDateString('sv-SE')}: ${included.length} skills ship. Review state: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}. ("reviewed" = read and fixed by hand; "mechanical" = placeholders applied, read-through not recorded yet.)`,
  '',
  '## Is it working?',
  'In Claude Code, type `/alignment-harness:` and the list appears. `claude plugin details alignment-harness` shows the inventory and its token cost.',
  '',
  '| Skill | Review | What it does |',
  '|---|---|---|',
  ...included.sort((a, b) => a.id.localeCompare(b.id)).map((s) => `| \`${s.id}\` | ${s.scrub} | ${description(s.id).replace(/\|/g, '\\|')} |`),
  '',
];
fs.writeFileSync(path.join(root, 'docs', 'skills.md'), lines.join('\n'));
console.log(`docs/skills.md: ${included.length} skills`);

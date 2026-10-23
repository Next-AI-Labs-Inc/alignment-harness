#!/usr/bin/env node
'use strict';
// Step 4 of instinct-harvest: regenerate the ledger's README.md from item
// frontmatter, grouped by situation. Never hand-edit the README — fix the
// item and regenerate.
//
// Usage: node build-instinct-index.js --domain <id>

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { const k = t.slice(2); const n = argv[i + 1]; if (n && !n.startsWith('--')) { a[k] = n; i++; } else a[k] = true; }
    else a._.push(t);
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const domain = args.domain || 'general';
const ledgerDir = path.join(lib.homeDir('instincts-ledger'), domain);
const itemsDir = path.join(ledgerDir, 'items');
fs.mkdirSync(itemsDir, { recursive: true });

const itemFiles = lib.walk(itemsDir, (p) => p.endsWith('.md'));
const items = [];
for (const f of itemFiles) {
  const raw = fs.readFileSync(f, 'utf8');
  const { data, body } = lib.parseFrontmatter(raw);
  const headlineMatch = body.match(/^#\s+(.+)$/m);
  items.push({
    file: path.relative(ledgerDir, f),
    id: data['instinct-id'] || path.basename(f, '.md'),
    situation: data.situation || 'unclassified',
    strength: data.strength || '',
    captured: data.captured || '',
    status: data.status || 'proposed',
    headline: headlineMatch ? headlineMatch[1] : path.basename(f, '.md'),
  });
}

const bySituation = {};
for (const it of items) { (bySituation[it.situation] = bySituation[it.situation] || []).push(it); }
for (const sit of Object.keys(bySituation)) bySituation[sit].sort((a, b) => String(b.captured).localeCompare(String(a.captured)));

// Health line — read the flag file extract-check-pairs.js --write-health writes,
// if it's there and current enough that its own age doesn't make the header lie.
let healthLine = '';
const inbox = lib.homeDir('instincts-harvest');
const healthFile = path.join(inbox, '_health.txt');
if (fs.existsSync(healthFile)) {
  const txt = fs.readFileSync(healthFile, 'utf8').trim();
  if (txt && !/^instinct loop healthy$/.test(txt)) healthLine = `⚠️ ${txt}\n\n`;
}

const lines = [`# Instinct Ledger — ${domain}`, '', healthLine.trimEnd(), '', `${items.length} instinct(s), regenerated ${new Date().toISOString().slice(0, 10)}.`, ''];
for (const sit of Object.keys(bySituation).sort()) {
  lines.push(`## ${sit}`, '');
  for (const it of bySituation[sit]) {
    lines.push(`- **${it.headline}** — ${it.strength || 'unrated'} — captured ${it.captured || 'unknown'} — [${it.id}](${it.file}) — ${it.status}`);
  }
  lines.push('');
}

fs.writeFileSync(path.join(ledgerDir, 'README.md'), lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n'));
process.stdout.write(`Wrote ${path.join(ledgerDir, 'README.md')} (${items.length} item(s), ${Object.keys(bySituation).length} situation(s)).\n`);

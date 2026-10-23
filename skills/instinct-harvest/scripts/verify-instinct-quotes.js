#!/usr/bin/env node
'use strict';
// Step 3b of instinct-harvest: every quoted span in a ledger item's "Where
// it came from" section must match the person's actual words, in order,
// from that item's own source transcript pair. This is the mandatory guard
// that keeps the ledger trustworthy — an item whose quotes cannot be
// verified is worse than a missing item, because nothing marks it as
// suspect otherwise.
//
// Usage: node verify-instinct-quotes.js --domain <id> [--quarantine]

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
const quarantineDir = path.join(ledgerDir, 'quarantine');
const inbox = lib.homeDir('instincts-harvest');

const itemFiles = lib.walk(itemsDir, (p) => p.endsWith('.md'));
let failures = 0;

for (const file of itemFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = lib.parseFrontmatter(raw);
  const sourcePair = data['source-pair'];
  if (!sourcePair) { process.stdout.write(`SKIP  ${path.basename(file)}: no source-pair in frontmatter, cannot verify\n`); continue; }
  const sourceFile = path.join(inbox, sourcePair);
  if (!fs.existsSync(sourceFile)) { process.stdout.write(`SKIP  ${path.basename(file)}: source pair file missing (${sourcePair})\n`); continue; }
  const sourceText = fs.readFileSync(sourceFile, 'utf8');
  const sourceWords = lib.normalizeWords(sourceText);

  const quotes = [...body.matchAll(/"([^"]{6,})"/g)].map((m) => m[1]);
  const bad = [];
  for (const q of quotes) {
    const needle = lib.normalizeWords(q);
    if (!lib.containsWordSequence(sourceWords, needle)) bad.push(q);
  }

  if (bad.length === 0) {
    process.stdout.write(`OK    ${path.basename(file)} (${quotes.length} quote(s) checked)\n`);
    continue;
  }

  failures++;
  process.stdout.write(`FAIL  ${path.basename(file)}: ${bad.length} quote(s) do not match the source transcript:\n`);
  for (const q of bad) process.stdout.write(`        "${q.slice(0, 80)}${q.length > 80 ? '…' : ''}"\n`);

  if (args.quarantine) {
    fs.mkdirSync(quarantineDir, { recursive: true });
    const dest = path.join(quarantineDir, path.basename(file));
    fs.renameSync(file, dest);
    const readme = path.join(quarantineDir, 'README.md');
    const line = `- ${new Date().toISOString().slice(0, 10)} — ${path.basename(file)}: quote(s) did not match ${sourcePair}. Re-mine that session.\n`;
    fs.appendFileSync(readme, line);
    process.stdout.write(`        moved to quarantine: ${dest}\n`);
  }
}

process.stdout.write(failures ? `\n${failures} item(s) failed quote verification.\n` : '\nAll items verified.\n');
process.exitCode = failures ? 1 : 0;

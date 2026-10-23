#!/usr/bin/env node
'use strict';
// Step 0 of instinct-harvest: report what's already harvested, what's
// already mined into the ledger, what's waiting on a reply, and the next
// free instinct id — so a mining pass never re-mines a session or collides
// ids with a parallel run.
//
// Usage: node mining-status.js --domain <id> [--session-filter <substring>]

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

const inbox = lib.homeDir('instincts-harvest');
const indexFile = path.join(inbox, 'harvest.jsonl');
const pairs = fs.existsSync(indexFile)
  ? fs.readFileSync(indexFile, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean)
  : [];

const ledgerDir = path.join(lib.homeDir('instincts-ledger'), domain);
const itemsDir = path.join(ledgerDir, 'items');
fs.mkdirSync(itemsDir, { recursive: true });
const itemFiles = lib.walk(itemsDir, (p) => p.endsWith('.md'));
const minedSourcePairs = new Set();
let maxId = 0;
for (const f of itemFiles) {
  const { data } = lib.parseFrontmatter(fs.readFileSync(f, 'utf8'));
  if (data['source-pair']) minedSourcePairs.add(data['source-pair']);
  const m = String(data['instinct-id'] || '').match(/-(\d+)$/);
  if (m) maxId = Math.max(maxId, Number(m[1]));
}

const filter = args['session-filter'];
let toMine = 0, mined = 0, unanswered = 0, otherDomain = 0;
for (const p of pairs) {
  if (filter && !(p.project || '').includes(filter) && !(p.session || '').includes(filter)) { otherDomain++; continue; }
  if (minedSourcePairs.has(p.file)) { mined++; continue; }
  if (p.verdict === 'unanswered') { unanswered++; continue; }
  toMine++;
}

process.stdout.write(`Domain: ${domain}\n`);
process.stdout.write(`Ledger: ${ledgerDir}\n`);
process.stdout.write(`Harvested pairs: ${pairs.length}\n`);
process.stdout.write(`  TO MINE:      ${toMine}\n`);
process.stdout.write(`  MINED:        ${mined}\n`);
process.stdout.write(`  UNANSWERED:   ${unanswered} (no reply yet — do not mine)\n`);
if (filter) process.stdout.write(`  other domain: ${otherDomain} (excluded by --session-filter)\n`);
process.stdout.write(`Next free id: INST-${domain.toUpperCase()}-${String(maxId + 1).padStart(4, '0')}\n`);
process.stdout.write('\nRows marked TO MINE, one per line (id, session, file):\n');
for (const p of pairs) {
  if (filter && !(p.project || '').includes(filter) && !(p.session || '').includes(filter)) continue;
  if (minedSourcePairs.has(p.file) || p.verdict === 'unanswered') continue;
  process.stdout.write(`  ${p.id}  ${p.session}  ${p.file}\n`);
}

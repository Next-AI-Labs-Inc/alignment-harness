#!/usr/bin/env node
'use strict';
// Build-time tool: copies approved skills into the plugin, by EXPLICIT
// manifest (skills-manifest.json), never by glob, and applies the mechanical
// part of the scrub. The judgement part of the scrub (rewording steps that
// depend on someone else's private services, removing personal material) is
// done by hand afterwards and recorded in the manifest's "scrub" field.
//
// It only ever READS the source folder and only WRITES inside this plugin.
//
// Usage:
//   node scripts/import-skills.js --source <skills folder> [--only id,id] [--force] [--overwrite]
//
// What it protects against. The mechanical scrub below only catches PATTERNS (home
// paths, ids, keys, emails). It cannot see a real story, quote or incident whose
// names were changed, and that is how real material got into shipped skills before.
// So an import never silently replaces a skill that is already in the plugin:
//   - a skill with "scrub": "reviewed" is skipped unless --force is given, so hand
//     edits survive re-imports;
//   - for any skill whose files already exist here and would change, the script
//     shows a unified diff and does NOT write, unless --overwrite is also given;
//   - every run ends with a reminder that worked examples must be re-read by a
//     person or a model for real material before anything ships.
// Exit code 2 means at least one change was refused and needs a decision.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN = path.resolve(__dirname, '..');
const MANIFEST = path.join(PLUGIN, 'skills-manifest.json');

function args() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { o[a[i].slice(2)] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; }
  return o;
}

// Mechanical scrub. Each rule keeps the sentence readable and makes the
// dependency visible as something the person configures.
function scrub(text) {
  const home = ['/Users/', 'je', 'di'].join('');
  let t = text;
  t = t.replace(new RegExp(`${home}/react_projects/ix/`, 'g'), '<project>/');
  t = t.replace(new RegExp(`${home}/react_projects/`, 'g'), '<projects>/');
  t = t.replace(new RegExp(`${home}/`, 'g'), '~/');
  t = t.replace(new RegExp(home, 'g'), '~');
  t = t.replace(/(x-api-key:\s*)[A-Za-z0-9][A-Za-z0-9-]{15,}/gi, '$1$YOUR_API_KEY');
  t = t.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<id>');
  t = t.replace(/\b[A-Za-z0-9._%+-]+@(?!example\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, 'person@example.com');
  t = t.replace(new RegExp(['localhost', '3002'].join(':'), 'g'), '<your-api-server>');
  return t;
}

// Show what would change in `destFile` if `newText` were written. Uses the system `diff`
// (no shell); if it is missing, says so instead of hiding the change.
function showDiff(destFile, newText, label) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'import-skills-'));
  const next = path.join(tmp, 'incoming');
  try {
    fs.writeFileSync(next, newText);
    const r = spawnSync('diff', ['-u', '-L', `${label} (in the plugin now)`, '-L', `${label} (would be imported)`, destFile, next], { encoding: 'utf8' });
    if (r.error) console.log(`  ${label}: differs (the diff command is not available here, compare the files by hand)`);
    else console.log(r.stdout.replace(/\n$/, ''));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const REREAD_WARNING = [
  '',
  'CHECK WORKED EXAMPLES BY HAND: the scrub only fixes patterns. It cannot see a real story,',
  'quote, incident, person or product detail that has merely been reworded, and neither can',
  'scripts/scan-private.js. Before anything imported here ships, a person or a model must read',
  'every worked example, anecdote and "from a real project" passage and confirm it is invented',
  'or neutral. Do not label anything "invented" unless it is.',
].join('\n');

function main() {
  const o = args();
  if (!o.source) { console.error('need --source <skills folder>'); process.exit(1); }
  const src = path.resolve(String(o.source).replace(/^~(?=\/)/, require('os').homedir()));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const only = o.only ? new Set(String(o.only).split(',')) : null;
  let copied = 0; let skipped = 0; let missing = 0; let refused = 0; let unchanged = 0;
  for (const entry of manifest.skills) {
    if (only && !only.has(entry.id)) continue;
    if (entry.status !== 'include') continue;
    if (entry.scrub === 'reviewed' && !o.force) { skipped++; continue; }
    if (entry.source === 'plugin') { skipped++; continue; } // written for the plugin, not copied
    const files = ['SKILL.md', ...(entry.extraFiles || [])];
    const destDir = path.join(PLUGIN, 'skills', entry.id);
    let wroteAny = false; let replacedExisting = false;
    for (const f of files) {
      const from = path.join(src, entry.sourceId || entry.id, f);
      if (!fs.existsSync(from)) { if (f === 'SKILL.md') { missing++; console.error(`missing: ${entry.sourceId || entry.id}/${f}`); } continue; }
      const dest = path.join(destDir, f);
      const incoming = scrub(fs.readFileSync(from, 'utf8'));
      if (fs.existsSync(dest)) {
        if (fs.readFileSync(dest, 'utf8') === incoming) { unchanged++; continue; }
        console.log(`\n--- ${entry.id}/${f} would change:`);
        showDiff(dest, incoming, `${entry.id}/${f}`);
        if (!o.overwrite) { refused++; console.log(`  NOT written. Read the diff, then re-run with --overwrite to accept it.`); continue; }
        replacedExisting = true;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, incoming);
      wroteAny = true;
    }
    if (!wroteAny) continue;
    // Replaced text has not been read by anyone yet, so a replaced skill is no longer "reviewed".
    if (replacedExisting || entry.scrub !== 'reviewed') entry.scrub = 'mechanical';
    copied++;
  }
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\ncopied ${copied}, kept hand-reviewed ${skipped}, unchanged ${unchanged}, refused ${refused}, missing ${missing}`);
  if (refused) console.log(`${refused} file(s) differ from what is in the plugin and were NOT overwritten. Re-run with --overwrite after reading the diffs above.`);
  console.log(REREAD_WARNING);
  if (refused) process.exitCode = 2;
}

main();

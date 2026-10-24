#!/usr/bin/env node
/**
 * Intent Alignment Audit — cross-references your local Intent DB (see the
 * /intent-db skill) against code and test references, so you can see which
 * recorded UX decisions are actually built and tested, which are only one
 * or the other, and which code comments point at a decision that was never
 * recorded (or was recorded under a different slug).
 *
 * Reads the same local file store /intent-db writes to (one JSON file per
 * intent, in the folder `alignment-harness records intents` prints). If
 * you've pointed intent-db at your own database instead, this script won't
 * see it yet — point STORE below (or the intent-db CLI's resolveStoreDir)
 * at the same place.
 *
 * Usage:
 *   node intent-alignment-audit.js --staged
 *   node intent-alignment-audit.js --commit <sha>
 *   node intent-alignment-audit.js --last <days>
 *   node intent-alignment-audit.js --all [--area <tag>] [--max N] [--json]
 *   node intent-alignment-audit.js --all --repo <path> --repo <path2>   # scan more than one repo
 *   node intent-alignment-audit.js --all --include-company              # also merge the company-intent store
 *
 * Tag conventions scanned for in your own code:
 *   @intent: <slug>                 in code comments
 *   @intents-covered: <slug>, ...   in test file headers
 *   intentSlug: '<slug>'            in logger/console calls
 *
 * "Uncovered" only means something when every non-deprecated intent in
 * scope gets loaded and checked — not just the ones already mentioned in
 * code. --all and --area both do that; a truthful zero means every
 * recorded intent has at least a code or test reference, not "nothing was
 * checked."
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

// The harness's own command, found from where this file sits inside the plugin, so the
// records land in the person's own data folder (where agent_find searches) whether or
// not `alignment-harness` is on the PATH of the shell the agent runs.
function harnessCommand() {
  const roots = [process.env.CLAUDE_PLUGIN_ROOT, path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..', '..', '..')];
  for (const root of roots) {
    if (!root) continue;
    const bin = path.join(root, 'bin', 'alignment-harness');
    if (fs.existsSync(bin)) return { file: process.execPath, pre: [bin] };
  }
  return { file: 'alignment-harness', pre: [] };
}

function storeDir(kind) {
  try {
    const out = execFileSync(harnessCommand().file, [...harnessCommand().pre, 'records', kind], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (_) { /* CLI not on PATH — fall through to a local default */ }
  const dir = path.join(process.cwd(), '.alignment-harness', kind === 'intents' ? 'intent-db' : kind);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadIntents(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (_) { return null; }
  }).filter(Boolean);
}

const SKIP_DIRS = new Set(['node_modules', 'build', 'dist', '.next', '.git', 'coverage', 'public', '.claude', '.worktrees', 'worktrees']);

function listWorktrees(root) {
  try {
    return execSync('git worktree list --porcelain', { cwd: root, encoding: 'utf8' })
      .split('\n').filter((l) => l.startsWith('worktree ')).map((l) => path.resolve(l.slice('worktree '.length).trim()));
  } catch (_) { return []; }
}

function walk(dir, worktrees, files) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return files; }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (worktrees.includes(path.resolve(p))) continue; // never descend into a nested worktree checkout
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(p, worktrees, files);
    } else if (/\.(js|jsx|ts|tsx|mjs|cjs|py|rb|go|java)$/.test(ent.name)) {
      files.push(p);
    }
  }
  return files;
}

function scanFile(file, refs) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return; }
  const codeRe = /@intent:\s*([A-Za-z0-9._-]+)/g;
  const testRe = /@intents-covered:\s*([A-Za-z0-9._,\s-]+)/g;
  const loggerRe = /intentSlug:\s*['"]([A-Za-z0-9._-]+)['"]/g;
  let m;
  while ((m = codeRe.exec(text))) addRef(refs, m[1], file, 'code');
  while ((m = loggerRe.exec(text))) addRef(refs, m[1], file, 'code');
  while ((m = testRe.exec(text))) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((slug) => addRef(refs, slug, file, 'test'));
  }
}

function addRef(refs, slug, file, kind) {
  if (!refs.has(slug)) refs.set(slug, { code: new Set(), test: new Set() });
  refs.get(slug)[kind].add(file);
}

function changedFiles(root, cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
      .map((f) => path.join(root, f)).filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  } catch (_) { return []; }
}

function selectFiles(root, args) {
  if (args.staged) return changedFiles(root, 'git diff --cached --name-only --diff-filter=ACM');
  if (args.commit) return changedFiles(root, `git show --name-only --diff-filter=ACM --pretty=format: ${args.commit}`);
  if (args.last) return changedFiles(root, `git log --since="${args.last} days ago" --name-only --diff-filter=ACM --pretty=format:`);
  return walk(root, listWorktrees(root), []);
}

function parseArgs(argv) {
  const out = { repos: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--staged') out.staged = true;
    else if (a === '--all') out.all = true;
    else if (a === '--json') out.json = true;
    else if (a === '--include-company') out.includeCompany = true;
    else if (a === '--commit') out.commit = argv[++i];
    else if (a === '--last') out.last = Number(argv[++i]);
    else if (a === '--area') out.area = argv[++i];
    else if (a === '--max') out.max = Number(argv[++i]);
    else if (a === '--repo') out.repos.push(argv[++i]);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repos = args.repos.length ? args.repos : [process.cwd()];

  let intents = loadIntents(storeDir('intents'));
  if (args.includeCompany) intents = intents.concat(loadIntents(storeDir('company-intents')));
  if (args.area) intents = intents.filter((i) => (i.tags || []).includes(args.area));
  intents = intents.filter((i) => i.status !== 'deprecated');

  // De-dupe by slug and flag any real duplicate records instead of silently
  // folding them into the total.
  const bySlug = new Map();
  const duplicates = new Set();
  for (const i of intents) {
    if (bySlug.has(i.slug)) duplicates.add(i.slug);
    bySlug.set(i.slug, i);
  }
  intents = [...bySlug.values()];

  const refs = new Map(); // slug -> { code: Set<file>, test: Set<file> }
  for (const root of repos) {
    for (const f of selectFiles(root, args)) scanFile(f, refs);
  }

  if (!intents.length) {
    const message = 'You have no recorded intents yet (or none matching --area), so there is nothing to compare code against. See /intent-db to record your first one.';
    const orphaned = [...refs.keys()];
    if (args.json) { console.log(JSON.stringify({ totalIntents: 0, message, orphanedSlugs: orphaned }, null, 2)); return; }
    console.log(message);
    if (orphaned.length) console.log(`Code already tags these slugs, though — worth recording them as intents: ${orphaned.join(', ')}`);
    return;
  }

  const known = new Set(intents.map((i) => i.slug));
  const rows = intents.map((i) => {
    const r = refs.get(i.slug) || { code: new Set(), test: new Set() };
    const hasCode = r.code.size > 0, hasTest = r.test.size > 0;
    const category = hasCode && hasTest ? 'COVERED' : hasCode ? 'CODE_ONLY' : hasTest ? 'TEST_ONLY' : 'UNCOVERED';
    return { slug: i.slug, title: i.title, category, codeFiles: [...r.code], testFiles: [...r.test], hasPlaybook: !!i.resolutionPlaybook };
  });
  const orphaned = [...refs.keys()].filter((slug) => !known.has(slug));

  const summary = {
    covered: rows.filter((r) => r.category === 'COVERED').length,
    codeOnly: rows.filter((r) => r.category === 'CODE_ONLY').length,
    testOnly: rows.filter((r) => r.category === 'TEST_ONLY').length,
    uncovered: rows.filter((r) => r.category === 'UNCOVERED').length,
    orphaned: orphaned.length,
    totalIntents: intents.length,
    duplicateSlugsFound: [...duplicates],
    playbooks: `${rows.filter((r) => r.hasPlaybook).length}/${intents.length}`,
  };

  const shown = args.max ? rows.slice(0, args.max) : rows;
  if (args.json) { console.log(JSON.stringify({ summary, rows: shown, orphanedSlugs: orphaned }, null, 2)); return; }

  console.log(`Covered: ${summary.covered} | Code-only: ${summary.codeOnly} | Test-only: ${summary.testOnly} | Uncovered: ${summary.uncovered} | Orphaned: ${summary.orphaned}`);
  console.log(`Playbooks: ${summary.playbooks}`);
  if (summary.duplicateSlugsFound.length) console.log(`Duplicate intent records found for: ${summary.duplicateSlugsFound.join(', ')} — one store file has more than one entry for the same slug.`);
  for (const r of shown) {
    const sym = { COVERED: '+', CODE_ONLY: '~', TEST_ONLY: '?', UNCOVERED: 'X' }[r.category];
    console.log(`${sym} ${r.slug} — ${r.title || '(no title)'}`);
  }
  if (orphaned.length) console.log(`Orphaned references (code points at a slug with no recorded intent): ${orphaned.join(', ')}`);
}

main();

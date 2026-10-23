#!/usr/bin/env node
'use strict';
// Step 1 of instinct-harvest: capture check-and-reply pairs verbatim from
// Claude Code session transcripts, with no summarization and no judgment.
//
// Usage:
//   node extract-check-pairs.js [--since <days>] [--project <dir>] [--rebuild]
//   node extract-check-pairs.js --health [--write-health]
//
// A "pair" is: an assistant message containing a check heading (SANITY_CHECK,
// COHERENCE_CHECK, AGENT_REFLECTION, SCOPE_DECLARATION or GAP_ANALYSIS —
// with or without a leading "## "), the human message that came right
// before it (the task context), and the next real human reply after it (the
// verdict). Idempotent: a pair already captured (same content hash) is
// skipped, so re-running is always safe.
//
// Output: one markdown file per pair under the harvest inbox
// (`alignment-harness records instincts-harvest`, or ./.instinct-harvest/instincts-harvest
// if that CLI isn't installed), plus an append-only harvest.jsonl index there.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const key = t.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { a[key] = next; i++; } else { a[key] = true; }
    } else a._.push(t);
  }
  return a;
}

function heuristicVerdict(replyText) {
  const t = (replyText || '').toLowerCase().trim();
  if (!t) return 'unanswered';
  if (/^(yes|yep|yeah|correct|right|exactly|confirmed|good|approved|go ahead|do it|sounds right)\b/.test(t)) return 'confirmed-ish';
  if (/\b(no,|actually|instead|i meant|not quite|that's not|wrong)\b/.test(t)) return 'corrected-ish';
  if (t.length < 6) return 'ambiguous';
  return 'ambiguous';
}

function extract(args) {
  const inbox = lib.homeDir('instincts-harvest');
  const indexFile = path.join(inbox, 'harvest.jsonl');
  const seen = new Set();
  if (fs.existsSync(indexFile) && !args.rebuild) {
    for (const line of fs.readFileSync(indexFile, 'utf8').split('\n')) {
      if (!line) continue;
      try { seen.add(JSON.parse(line).id); } catch (_) { /* skip bad line */ }
    }
  } else if (args.rebuild && fs.existsSync(indexFile)) {
    fs.copyFileSync(indexFile, `${indexFile}.bak`);
  }

  const sinceDays = args.since ? Number(args.since) : undefined;
  const files = args.project
    ? lib.listSessionFiles({ sinceDays }).filter((f) => f.path.startsWith(path.resolve(args.project)))
    : lib.listSessionFiles({ sinceDays });

  let newPairs = 0;
  let sessionsWithChecks = 0;
  const appendLines = [];

  for (const f of files) {
    const entries = lib.readSessionEntries(f.path);
    let hadCheck = false;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.role !== 'assistant') continue;
      const blocks = lib.findCheckBlocks(e.text);
      if (!blocks.length) continue;
      hadCheck = true;
      // Task context: nearest human message before this assistant turn.
      let context = '';
      for (let j = i - 1; j >= 0; j--) { if (entries[j].role === 'user') { context = entries[j].text; break; } }
      // Reply: nearest human message after this assistant turn.
      let reply = '';
      for (let j = i + 1; j < entries.length; j++) { if (entries[j].role === 'user') { reply = entries[j].text; break; } }

      for (const block of blocks) {
        const id = lib.shortHash(`${f.path}::${i}::${block.type}::${block.body}`);
        if (seen.has(id)) continue;
        seen.add(id);
        const sessionShort = path.basename(f.path, '.jsonl').slice(0, 8);
        const dir = path.join(inbox, sessionShort);
        fs.mkdirSync(dir, { recursive: true });
        const n = fs.readdirSync(dir).filter((x) => x.endsWith('.md')).length + 1;
        const slug = block.type.toLowerCase().replace(/_/g, '-');
        const outFile = path.join(dir, `${String(n).padStart(3, '0')}-${slug}.md`);
        const verdict = heuristicVerdict(reply);
        const md = [
          '---',
          `id: ${id}`,
          `session: ${sessionShort}`,
          `session-file: ${path.relative(process.cwd(), f.path)}`,
          `project: ${f.project}`,
          `check-type: ${block.type}`,
          `timestamp: ${e.timestamp}`,
          `cwd: ${e.cwd || ''}`,
          `git-branch: ${e.gitBranch || ''}`,
          `verdict-heuristic: ${verdict}`,
          '---',
          '',
          '## Task context (preceding human message, verbatim)',
          '',
          context || '_(none found)_',
          '',
          '## Check (assistant message, verbatim)',
          '',
          block.body,
          '',
          '## Reply (next human message, verbatim)',
          '',
          reply || '_(no reply yet — unanswered)_',
          '',
        ].join('\n');
        fs.writeFileSync(outFile, md);
        appendLines.push(JSON.stringify({ id, session: sessionShort, project: f.project, type: block.type, timestamp: e.timestamp, verdict, file: path.relative(inbox, outFile) }));
        newPairs++;
      }
    }
    if (hadCheck) sessionsWithChecks++;
  }

  if (appendLines.length) fs.appendFileSync(indexFile, `${appendLines.join('\n')}\n`);
  process.stdout.write(`Scanned ${files.length} session file(s), ${sessionsWithChecks} contained a check. Captured ${newPairs} new pair(s). Inbox: ${inbox}\n`);
}

function health(args) {
  const inbox = lib.homeDir('instincts-harvest');
  const indexFile = path.join(inbox, 'harvest.jsonl');
  const lines = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, 'utf8').split('\n').filter(Boolean) : [];
  const pairs = lines.map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);

  const checks = [];
  // Sessions with checks in the last 7 days vs harvested.
  const recentSessionsWithChecks = lib.listSessionFiles({ sinceDays: 7 }).filter((f) => {
    const entries = lib.readSessionEntries(f.path);
    return entries.some((e) => e.role === 'assistant' && lib.findCheckBlocks(e.text).length);
  });
  const harvestedRecent = new Set(pairs.map((p) => p.session));
  const unharvested = recentSessionsWithChecks.filter((f) => !harvestedRecent.has(path.basename(f.path, '.jsonl').slice(0, 8)));
  checks.push({ name: 'sessions-with-checks-vs-harvested', ok: unharvested.length === 0, detail: `${unharvested.length} recent session(s) with checks not yet harvested` });

  // Inbox age.
  const newest = pairs.length ? Math.max(...pairs.map((p) => new Date(p.timestamp || 0).getTime() || 0)) : 0;
  const ageDays = newest ? (Date.now() - newest) / 86400000 : Infinity;
  checks.push({ name: 'inbox-age', ok: ageDays <= 7, detail: `newest captured pair is ${Number.isFinite(ageDays) ? ageDays.toFixed(1) : 'never'} day(s) old` });

  // Awaiting-verdict backlog.
  const awaiting = pairs.filter((p) => p.verdict === 'unanswered').length;
  checks.push({ name: 'awaiting-verdict', ok: awaiting <= 20, detail: `${awaiting} pair(s) with no reply yet` });

  // Capture integrity — a captured check body under 400 chars is probably truncated.
  let short = 0;
  for (const p of pairs) {
    const f = path.join(inbox, p.file || '');
    if (!fs.existsSync(f)) continue;
    const body = fs.readFileSync(f, 'utf8');
    const m = body.match(/## Check \(assistant message, verbatim\)\n\n([\s\S]*?)\n\n## Reply/);
    if (m && m[1].trim().length < 400) short++;
  }
  checks.push({ name: 'capture-integrity', ok: short === 0, detail: `${short} captured check(s) under 400 chars — possible truncation` });

  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) process.stdout.write(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}: ${c.detail}\n`);
  process.stdout.write(failed.length ? `\n${failed.length} check(s) failed.\n` : '\nAll checks passed.\n');
  if (args['write-health']) {
    const summary = failed.length ? `INSTINCT LOOP UNHEALTHY: ${failed.map((c) => c.name).join(', ')}` : 'instinct loop healthy';
    fs.writeFileSync(path.join(inbox, '_health.txt'), `${summary}\n`);
  }
  process.exitCode = failed.length ? 2 : 0;
}

const args = parseArgs(process.argv.slice(2));
if (args.health) health(args); else extract(args);

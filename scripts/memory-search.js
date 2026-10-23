#!/usr/bin/env node
'use strict';
// A simple, local "institutional memory" search — no services, no index.
// Searches, for the words in the query:
//   1. the person's past Claude Code conversations for THIS project
//      (~/.claude/projects/<project>/*.jsonl — only the human's and the
//       agent's text, never tool output),
//   2. markdown files in the current repository (docs, notes, READMEs).
// Prints the best few matching snippets with where they came from.
//
// It is OFF by default. /harness-setup offers to switch it on by setting
//   "understanding": { "memorySearchCommand": "node <plugin>/scripts/memory-search.js" }
// It stops after ~3 seconds and never writes anything.
//
// Usage: node scripts/memory-search.js "<query>" [--project-dir <dir>] [--limit 5]

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEADLINE = Date.now() + 3000;
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const query = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))).join(' ');
const limit = Number(opt('limit', 5));
const cwd = opt('project-dir', process.cwd());

const STOP = new Set('the a an and or but to of in on for with is are was were be been it this that these those i you we they me my your our please can could would should will just about into from at by as do does did not no yes so if then than there here what which who how why when where'.split(' '));
const terms = [...new Set(query.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || [])].filter((t) => !STOP.has(t)).slice(0, 12);
if (!terms.length) process.exit(0);

function scoreText(text) {
  const low = text.toLowerCase();
  let s = 0;
  for (const t of terms) if (low.includes(t)) s += 1;
  return s;
}

function snippet(text) {
  const low = text.toLowerCase();
  let at = -1;
  for (const t of terms) { at = low.indexOf(t); if (at >= 0) break; }
  const start = Math.max(0, at - 160);
  return text.slice(start, start + 420).replace(/\s+/g, ' ').trim();
}

const hits = [];

// 1. Past conversations for this project.
const configHome = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const slug = cwd.replace(/[^A-Za-z0-9]/g, '-');
const projDir = path.join(configHome, 'projects', slug);
try {
  const files = fs.readdirSync(projDir).filter((f) => f.endsWith('.jsonl'))
    .map((f) => path.join(projDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    .slice(0, 60);
  for (const f of files) {
    if (Date.now() > DEADLINE) break;
    let raw;
    try { raw = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    for (const line of raw.split('\n')) {
      if (!line || line.length > 200000) continue;
      if (!terms.some((t) => line.toLowerCase().includes(t))) continue;
      let e; try { e = JSON.parse(line); } catch (_) { continue; }
      const m = e.message;
      if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
      const text = typeof m.content === 'string' ? m.content
        : Array.isArray(m.content) ? m.content.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n') : '';
      if (!text || text.includes('<hook-injected-context')) continue;
      const s = scoreText(text);
      if (s >= Math.min(2, terms.length)) hits.push({ s, where: `past session ${path.basename(f, '.jsonl').slice(0, 8)} (${m.role}, ${String(e.timestamp || '').slice(0, 10)})`, text: snippet(text) });
    }
  }
} catch (_) { /* no history for this project */ }

// 2. Markdown in the repository.
function walk(dir, depth) {
  if (depth > 4 || Date.now() > DEADLINE) return;
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const d of ents) {
    if (d.name.startsWith('.') || d.name === 'node_modules' || d.name === 'dist' || d.name === 'build') continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, depth + 1);
    else if (/\.md$/i.test(d.name)) {
      let t; try { t = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }
      const s = scoreText(t);
      if (s >= Math.min(2, terms.length)) hits.push({ s: s - 0.5, where: path.relative(cwd, p), text: snippet(t) });
    }
  }
}
walk(cwd, 0);

hits.sort((a, b) => b.s - a.s);
for (const h of hits.slice(0, limit)) process.stdout.write(`- ${h.where}: ${h.text}\n`);

'use strict';
// Shared helpers for the instinct-harvest scripts. Self-contained (no npm
// dependencies, no dependency on the rest of the plugin) so this skill's
// scripts folder works even if copied out on its own.

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

// --- Where things live ---------------------------------------------------

// The base folder this skill reads and writes under. Prefers the harness's
// own local-records CLI (so everything the harness writes lives in one
// place); falls back to a plain folder in the current working directory so
// these scripts still work with no other part of the harness installed.
function homeDir(kind) {
  try {
    const out = execSync(`alignment-harness records ${kind}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (out) { fs.mkdirSync(out, { recursive: true }); return out; }
  } catch (_) { /* CLI not installed or not on PATH — use the local fallback below */ }
  const fallback = path.join(process.cwd(), '.instinct-harvest', kind);
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function projectsDir() {
  const configHome = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return process.env.INSTINCT_PROJECTS_DIR || path.join(configHome, 'projects');
}

// --- Reading Claude Code transcripts (~/.claude/projects/*/*.jsonl) ------

function listSessionFiles({ sinceDays } = {}) {
  const root = projectsDir();
  let projectDirs;
  try { projectDirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()); }
  catch (_) { return []; }
  const cutoff = sinceDays ? Date.now() - sinceDays * 86400000 : 0;
  const files = [];
  for (const d of projectDirs) {
    const dir = path.join(root, d.name);
    let entries;
    try { entries = fs.readdirSync(dir); } catch (_) { continue; }
    for (const f of entries) {
      if (!f.endsWith('.jsonl')) continue;
      const full = path.join(dir, f);
      let st; try { st = fs.statSync(full); } catch (_) { continue; }
      if (st.mtimeMs >= cutoff) files.push({ path: full, project: d.name, mtime: st.mtimeMs });
    }
  }
  files.sort((a, b) => b.mtime - a.mtime);
  return files;
}

// Extract the plain text of one transcript line's message, the same shape
// memory-search.js already uses elsewhere in this plugin: content is either
// a string or an array of blocks, only {type:"text"} blocks count.
function messageText(entry) {
  const m = entry && entry.message;
  if (!m) return '';
  if (typeof m.content === 'string') return m.content;
  if (Array.isArray(m.content)) return m.content.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n');
  return '';
}

function readSessionEntries(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line || line.length > 500000) continue;
    let e; try { e = JSON.parse(line); } catch (_) { continue; }
    const m = e.message;
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = messageText(e);
    if (!text || text.includes('<hook-injected-context')) continue;
    out.push({ role: m.role, text, timestamp: e.timestamp || '', cwd: e.cwd || '', gitBranch: e.gitBranch || '' });
  }
  return out;
}

// --- Check headings --------------------------------------------------------

// Accept both "## SANITY_CHECK" and a bare "SANITY_CHECK" at the start of a
// line — the coherence ritual in this plugin prints checks bare.
const CHECK_TYPES = ['SANITY_CHECK', 'COHERENCE_CHECK', 'AGENT_REFLECTION', 'SCOPE_DECLARATION', 'GAP_ANALYSIS'];
const CHECK_HEADING_RE = new RegExp(`^#{0,2}\\s*(${CHECK_TYPES.join('|')})\\b.*$`, 'm');
const CHECK_HEADING_RE_G = new RegExp(`^#{0,2}\\s*(${CHECK_TYPES.join('|')})\\b.*$`, 'mg');

function findCheckBlocks(text) {
  const blocks = [];
  const matches = [...text.matchAll(CHECK_HEADING_RE_G)];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    blocks.push({ type: matches[i][1], body: text.slice(start, end).trim() });
  }
  return blocks;
}

// --- Hashing / ids ---------------------------------------------------------

function shortHash(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
}

// --- Normalizing quoted text for comparison --------------------------------

function normalizeWords(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function containsWordSequence(haystackWords, needleWords) {
  if (!needleWords.length) return true;
  for (let i = 0; i + needleWords.length <= haystackWords.length; i++) {
    let ok = true;
    for (let j = 0; j < needleWords.length; j++) {
      if (haystackWords[i + j] !== needleWords[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// --- Frontmatter (minimal YAML-ish, no dependency) -------------------------

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/\s+#.*$/, '').trim();
      val = val.replace(/^["']|["']$/g, '');
    }
    data[kv[1]] = val;
  }
  return { data, body: m[2] };
}

function walk(dir, filterFn, depth) {
  const out = [];
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if ((depth || 0) < 6) out.push(...walk(p, filterFn, (depth || 0) + 1)); }
    else if (!filterFn || filterFn(p)) out.push(p);
  }
  return out;
}

module.exports = {
  homeDir, projectsDir, listSessionFiles, messageText, readSessionEntries,
  CHECK_TYPES, findCheckBlocks, shortHash, normalizeWords, containsWordSequence,
  parseFrontmatter, walk,
};

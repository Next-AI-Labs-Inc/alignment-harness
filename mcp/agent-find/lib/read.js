'use strict';
// agent_read — open, in full, the thing agent_find pointed at.
//
// agent_find prints a reference beside every result ("ref:record:compactions/…",
// "ref:doc:my-repo/docs/plan.md", "ref:session:<id>", "ref:git:my-repo:1a2b3c4d5",
// "ref:/some-skill"). agent_read takes that reference, with or without the "ref:"
// in front, and returns the whole thing, a page of lines at a time.
//
// It only ever reads the person's own material, the same places agent_find
// searches: the harness's records folder, the configured repos' markdown docs,
// this project's past Claude Code sessions, those repos' git history, and this
// plugin's skills. A reference can never reach outside those places (no "..",
// no absolute paths, no symlink out), and nothing here runs a shell.
//
// Fails open like the rest of the server: a reference that cannot be opened
// comes back as a plain sentence saying why, never a thrown error.

const fs = require('fs');
const path = require('path');
const config = require('./config');
const { execFileSafe } = require('./util');

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
const MAX_BYTES = 2 * 1024 * 1024;
const TEXT_EXT = /\.(md|mdx|txt|json|jsonl|yaml|yml)$/i;
const DOC_EXT = /\.mdx?$/i;
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function realInside(root, target) {
  // True only when `target` really lives under `root` once symlinks are resolved.
  try {
    const r = fs.realpathSync(root);
    const t = fs.realpathSync(target);
    const rel = path.relative(r, t);
    return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  } catch (_) { return false; }
}

function readTextFile(file) {
  const stat = fs.statSync(file);
  if (!stat.isFile()) throw new Error('that is not a file');
  if (stat.size > MAX_BYTES) throw new Error(`that file is ${Math.round(stat.size / 1024)} KB, larger than the ${MAX_BYTES / 1024} KB this tool opens`);
  return fs.readFileSync(file, 'utf8');
}

// A record is JSON. Print it so a person (or an agent) can read the whole thing:
// each field under its own heading, long text kept as written, not as one \n-escaped line.
function renderRecord(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) { return text; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return JSON.stringify(parsed, null, 2);
  const out = [];
  for (const [k, v] of Object.entries(parsed)) {
    out.push(`## ${k}`);
    out.push(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
    out.push('');
  }
  return out.join('\n').trim();
}

function sessionText(raw) {
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let evt;
    try { evt = JSON.parse(line); } catch (_) { continue; }
    const m = evt && evt.message;
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const c = m.content;
    const text = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n') : '';
    if (!text || text.includes('<hook-injected-context') || text.includes('<system-reminder>')) continue;
    out.push(`[${m.role}${evt.timestamp ? ` ${String(evt.timestamp).slice(0, 19)}` : ''}]`);
    out.push(text.trim());
    out.push('');
  }
  return out.join('\n').trim();
}

function normalizeRef(input) {
  let ref = String(input === undefined || input === null ? '' : input).trim();
  ref = ref.replace(/^ref:/i, '');
  if (/^\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(ref)) ref = `skill:${ref.slice(1)}`; // how agent_find prints a skill
  return ref;
}

async function load(ref) {
  const colon = ref.indexOf(':');
  const kind = colon === -1 ? '' : ref.slice(0, colon);
  const rest = colon === -1 ? '' : ref.slice(colon + 1);

  if (kind === 'record') {
    const dir = config.getRecordsDir();
    const file = path.resolve(dir, rest);
    if (!rest || !TEXT_EXT.test(rest) || !fs.existsSync(file) || !realInside(dir, file)) {
      return { error: `No record at "${rest}" in your records folder. Use the ref exactly as agent_find printed it.` };
    }
    const text = readTextFile(file);
    return { title: `record ${rest}`, text: /\.json$/i.test(file) ? renderRecord(text) : text };
  }

  if (kind === 'doc') {
    const slash = rest.indexOf('/');
    const repoName = slash === -1 ? rest : rest.slice(0, slash);
    const rel = slash === -1 ? '' : rest.slice(slash + 1);
    const repo = config.loadRepos().find((r) => path.basename(r) === repoName);
    const file = repo && rel ? path.resolve(repo, rel) : '';
    if (!repo || !rel || !DOC_EXT.test(rel) || !fs.existsSync(file) || !realInside(repo, file)) {
      return { error: `No markdown doc "${rest}" in the repos agent_find searches. Use the ref exactly as agent_find printed it.` };
    }
    return { title: `doc ${rest}`, text: readTextFile(file) };
  }

  if (kind === 'skill') {
    const root = path.join(config.getPluginRoot(), 'skills');
    const file = path.join(root, rest, 'SKILL.md');
    if (!NAME.test(rest) || !fs.existsSync(file) || !realInside(root, file)) {
      return { error: `No skill named "${rest}" in this plugin.` };
    }
    return { title: `skill /${rest}`, text: readTextFile(file) };
  }

  if (kind === 'session') {
    const dir = config.getSessionsDir();
    const file = path.join(dir, `${rest}.jsonl`);
    if (!NAME.test(rest) || !fs.existsSync(file) || !realInside(dir, file)) {
      return { error: `No past session "${rest}" for this project.` };
    }
    return { title: `past session ${rest}`, text: sessionText(fs.readFileSync(file, 'utf8')) };
  }

  if (kind === 'git') {
    const c = rest.lastIndexOf(':');
    const repoName = c === -1 ? '' : rest.slice(0, c);
    const hash = c === -1 ? '' : rest.slice(c + 1);
    const repo = config.loadRepos().find((r) => path.basename(r) === repoName);
    if (!repo || !/^[0-9a-f]{4,40}$/i.test(hash)) {
      return { error: `No commit "${rest}" in the repos agent_find searches.` };
    }
    // `hash` is hex only (checked above), so it can never be read as an option.
    const text = await execFileSafe('git', ['show', '--no-color', '--format=fuller', '--stat', '--patch', hash, '--'], { cwd: repo, timeout: 4000, maxBuffer: 16 * 1024 * 1024 });
    if (!text.trim()) return { error: `Git has no commit ${hash} in ${repoName}.` };
    return { title: `commit ${hash} in ${repoName}`, text };
  }

  return { error: 'That is not a reference agent_find gave out. Pass the ref printed beside a result, for example record:compactions/session-….json, doc:my-repo/docs/plan.md, session:<id>, git:my-repo:<hash> or /skill-name.' };
}

async function agentRead(input, options = {}) {
  const ref = normalizeRef(input);
  if (!ref) return { ok: false, ref, message: 'agent_read: no reference given. Pass the ref that agent_find printed beside a result.' };
  if (/^\d+$/.test(ref)) {
    return { ok: false, ref, message: `agent_read: "${ref}" is a numeric id, and this install keeps no numbered artifact cache. Run agent_find, then pass the ref printed beside the result you want (for example record:compactions/session-….json).` };
  }
  const offset = Math.max(0, Math.floor(Number(options.offset)) || 0);
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(Number(options.limit)) || DEFAULT_LIMIT));
  let loaded;
  try { loaded = await load(ref); } catch (err) { loaded = { error: `Could not open it: ${err && err.message ? err.message : 'unknown error'}.` }; }
  if (loaded.error) return { ok: false, ref, message: `agent_read: ${loaded.error}` };

  const lines = String(loaded.text).split('\n');
  const total = lines.length;
  if (offset >= total && total > 0) return { ok: false, ref, message: `agent_read: ${ref} has only ${total} lines; offset ${offset} is past the end.` };
  const page = lines.slice(offset, offset + limit);
  const end = offset + page.length;
  return { ok: true, ref, title: loaded.title, total, offset, end, more: end < total, text: page.join('\n') };
}

function formatRead(result) {
  if (!result) return 'agent_read: no result (internal error).';
  if (!result.ok) return result.message;
  const head = `${result.title} — lines ${result.total ? result.offset + 1 : 0}-${result.end} of ${result.total}`;
  const tail = result.more ? `\n\n[more: agent_read({ ref: "${result.ref}", offset: ${result.end} })]` : '';
  return `${head}\n\n${result.text}${tail}`;
}

module.exports = { agentRead, formatRead, normalizeRef };

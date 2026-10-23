'use strict';
// First-session calibration: the harness starts with no understanding of a new
// person, so on their first session it offers (once) to build some from what is
// already on their machine.
//
//   1. Pick the past Claude Code sessions most likely to teach something about
//      the person (cheap scoring, no model): recent, long enough, and holding
//      corrections, decisions or stated preferences.
//   2. For each, pull out the person's own words verbatim (a script, no model,
//      never a summary) and have a low-cost model (Haiku) write one structured
//      /reflect-style note: what they were after, corrections, leans, decisions,
//      their words for things — every quote checked against what they really said.
//   3. Synthesize those notes into one map the agent reads at session start.
//   4. Separately, with its own yes: index the plans and notes already written
//      on the machine (no model, free).
//
// Everything is written inside the harness's own data folder
// (<data>/records/calibration/), which the built-in memory search already reads.
// Nothing here ever blocks a session: every caller wraps it and carries on.

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const core = require('./core');

// ── Where things live ──────────────────────────────────────────────────────
function dirs() {
  const base = path.join(core.P.data, 'records', 'calibration');
  return {
    base,
    sessions: path.join(base, 'sessions'),
    plans: path.join(base, 'plans'),
    map: path.join(base, 'understanding-map.md'),
    state: path.join(core.P.data, 'state', 'calibration.json'),
    cwd: path.join(core.P.data, 'state', 'calibration-workdir'),
  };
}

function readState() { return core.readJson(dirs().state, {}) || {}; }
function writeState(patch) {
  const next = { ...readState(), ...patch, updatedAt: core.nowIso() };
  fs.mkdirSync(path.dirname(dirs().state), { recursive: true });
  core.writeJsonAtomic(dirs().state, next);
  return next;
}

function projectsDir() { return path.join(core.configHome(), 'projects'); }

// Claude Code deletes session transcripts older than cleanupPeriodDays (30 by
// default) when it starts, so that is how far back anyone's history can go.
const DEFAULT_RETENTION_DAYS = 30;
function claudeSettingsFile() { return path.join(core.configHome(), 'settings.json'); }
function retention() {
  const j = core.readJson(claudeSettingsFile(), null);
  const v = j && Number(j.cleanupPeriodDays);
  if (j && Number.isFinite(v) && v > 0) return { days: v, fromSettings: true };
  return { days: DEFAULT_RETENTION_DAYS, fromSettings: false };
}
function calibrationSwitches() {
  try { return core.loadSwitches().switches.calibration || {}; } catch (_) { return {}; }
}

// ── Prices (USD per million tokens, Anthropic API list prices, as of 2026-10) ─
// Which Haiku runs depends on the person's Claude Code version ("haiku" is an
// alias), so estimates are shown as a range across the two current ones.
const PRICES = {
  'claude-haiku-5-5': { in: 0.10, out: 0.50, label: 'Haiku 5.5' },
  'claude-haiku-4-5': { in: 1.00, out: 5.00, label: 'Haiku 4.5' },
};
const SIGNAL_BUDGET = 16000;          // characters of a session sent to the model
const PROMPT_OVERHEAD_TOKENS = 1200;  // the instructions + run overhead, per call
const OUTPUT_TOKENS_PER_SESSION = 1000;

function costRange(inputTokens, outputTokens) {
  const v = Object.values(PRICES).map((p) => (inputTokens * p.in + outputTokens * p.out) / 1e6);
  return { low: Math.min(...v), high: Math.max(...v) };
}
function cents(n) { const c = Math.max(1, Math.round(n * 100)); return `${c} cent${c === 1 ? '' : 's'}`; }
function money(n) {
  const v = Number(n) || 0;
  if (v === 0) return 'nothing';
  if (v < 0.005) return 'under 1 cent';
  if (v < 0.995) return `about ${cents(v)}`;
  return `about $${v.toFixed(2)}`;
}
function bare(n) { return n < 0.995 ? cents(n) : `$${n.toFixed(2)}`; }
function moneyRange(r) {
  if (r.high < 0.01) return 'under 1 cent';
  if (r.low < 0.01) return `under ${bare(r.high)}`;
  return `between ${bare(r.low)} and ${bare(r.high)}`;
}

// ── Finding sessions ───────────────────────────────────────────────────────
// Top-level <project>/<session>.jsonl files only; subagent transcripts live in
// subfolders and are the agent talking to itself, not the person.
function listSessionFiles() {
  const root = projectsDir();
  const out = [];
  const cutoff = Date.now() - retention().days * 86400000;
  let projects = [];
  try { projects = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch (_) { return out; }
  for (const d of projects) {
    const dir = path.join(root, d.name);
    let names = [];
    try { names = fs.readdirSync(dir); } catch (_) { continue; }
    for (const n of names) {
      if (!n.endsWith('.jsonl')) continue;
      const file = path.join(dir, n);
      let st; try { st = fs.statSync(file); } catch (_) { continue; }
      if (!st.isFile() || st.size < 200) continue;
      if (st.mtimeMs < cutoff) continue; // past Claude Code's keep period: about to be deleted by it
      out.push({ file, project: d.name, sessionId: n.replace(/\.jsonl$/, ''), mtime: st.mtimeMs, size: st.size });
    }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

function inventory() {
  const files = listSessionFiles();
  return {
    sessions: files.length,
    projects: new Set(files.map((f) => f.project)).size,
    newest: files.length ? new Date(files[0].mtime) : null,
    oldest: files.length ? new Date(files[files.length - 1].mtime) : null,
    files,
  };
}

// ── Reading one transcript ─────────────────────────────────────────────────
const MAX_READ = 12 * 1024 * 1024;
function readCapped(file, size) {
  if (size <= MAX_READ) return fs.readFileSync(file, 'utf8');
  const half = MAX_READ / 2;
  const fd = fs.openSync(file, 'r');
  try {
    const a = Buffer.alloc(half); fs.readSync(fd, a, 0, half, 0);
    const b = Buffer.alloc(half); fs.readSync(fd, b, 0, half, size - half);
    const head = a.toString('utf8'); const tail = b.toString('utf8');
    return `${head.slice(0, head.lastIndexOf('\n'))}\n${tail.slice(tail.indexOf('\n') + 1)}`;
  } finally { fs.closeSync(fd); }
}

function blockText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  if (content.some((p) => p && p.type === 'tool_result')) return '';
  return content.filter((p) => p && p.type === 'text').map((p) => p.text || '').join('\n');
}

// Text Claude Code or a hook put into the person's turn — not their words.
const INJECTED_RE = /<system-reminder>[\s\S]*?<\/system-reminder>|<hook-injected-context[\s\S]*?<\/hook-injected-context>|<command-(name|message|args)>[\s\S]*?<\/command-\1>|<local-command-std(out|err)>[\s\S]*?<\/local-command-std\2>/g;
const NOT_THE_PERSON_RE = /^\s*(Caveat: The messages below|\[Request interrupted|This session is being continued from a previous conversation|<task-notification>|<user-prompt-submit-hook>)/;

function personText(entry) {
  if (!entry || entry.isMeta || entry.isSidechain || entry.isCompactSummary) return '';
  const m = entry.message;
  if (!m || m.role !== 'user') return '';
  const t = blockText(m.content).replace(INJECTED_RE, '').trim();
  if (!t || NOT_THE_PERSON_RE.test(t)) return '';
  return t;
}

function agentText(entry) {
  const m = entry && entry.message;
  if (!m || m.role !== 'assistant' || entry.isSidechain) return '';
  return blockText(m.content).trim();
}

function readTurns(fileInfo) {
  let raw = '';
  try { raw = readCapped(fileInfo.file, fileInfo.size); } catch (_) { return { turns: [], cwd: '', branch: '', entrypoint: '' }; }
  const turns = [];
  let cwd = ''; let branch = ''; let entrypoint = '';
  for (const line of raw.split('\n')) {
    if (!line || line.length > 400000) continue;
    let e; try { e = JSON.parse(line); } catch (_) { continue; }
    if (e.cwd && !cwd) cwd = e.cwd;
    if (e.gitBranch && !branch) branch = e.gitBranch;
    if (e.entrypoint && !entrypoint) entrypoint = String(e.entrypoint);
    const p = personText(e);
    if (p) { turns.push({ role: 'person', text: p, at: e.timestamp || '' }); continue; }
    const a = agentText(e);
    if (a) turns.push({ role: 'agent', text: a, at: e.timestamp || '' });
  }
  return { turns, cwd, branch, entrypoint };
}

// ── Cheap relevance scoring (no model) ─────────────────────────────────────
const CORRECTION_RE = /(^|[\s,.!?])(no[,.!]|nope\b|not what i|that'?s not|that is not|i meant|i said|actually[, ]|wrong\b|why did you|you didn'?t|you did not|undo\b|revert\b|i asked|stop\b|instead\b)/i;
const DECISION_RE = /\b(let'?s go with|go with|decided|decision|approved?\b|ship it|do it\b|go ahead|green ?light|we'?ll use|we will use|yes,? (do|go|please))/i;
const PREFERENCE_RE = /\b(i (want|prefer|like|need|hate|don'?t want)|from now on|always\b|never\b|please (don'?t|do not|always|never))/i;
const CHECK_RE = /^#{0,2}\s*(SANITY_CHECK|COHERENCE_CHECK|AGENT_REFLECTION|SCOPE_DECLARATION|GAP_ANALYSIS)\b/m;

function topicTerms(about) {
  return String(about || '').toLowerCase().split(/[,\s]+/).map((s) => s.trim()).filter((s) => s.length > 2);
}

function scoreSession(fileInfo, opts) {
  const o = opts || {};
  const { turns, cwd, branch, entrypoint } = readTurns(fileInfo);
  const person = turns.filter((t) => t.role === 'person');
  const res = { ...fileInfo, cwd, branch, personTurns: person.length, score: 0, reasons: [], excluded: null };
  // Sessions a script started (claude -p, the SDK) carry a program's prompt, not the person's words.
  if (/^sdk/i.test(entrypoint)) { res.excluded = 'started by a script, not typed by the person'; return res; }
  if (person.length < 2) { res.excluded = 'fewer than 2 messages from the person'; return res; }
  const chars = person.reduce((a, t) => a + t.text.length, 0);
  const corrections = person.filter((t) => CORRECTION_RE.test(t.text)).length;
  const decisions = person.filter((t) => DECISION_RE.test(t.text)).length;
  const prefs = person.filter((t) => PREFERENCE_RE.test(t.text)).length;
  const checks = turns.filter((t) => t.role === 'agent' && CHECK_RE.test(t.text)).length;
  const ageDays = Math.max(0, ((o.now || Date.now()) - fileInfo.mtime) / 86400000);
  const recency = Math.pow(0.5, ageDays / 45);
  const substance = Math.log2(1 + chars / 200);
  const signals = Math.min(20, 2 * corrections + 1.5 * decisions + prefs + 1.5 * Math.min(checks, 4));
  let score = recency * (1 + substance + signals);
  const terms = topicTerms(o.about);
  if (terms.length) {
    const hits = person.filter((t) => terms.some((w) => t.text.toLowerCase().includes(w))).length;
    if (!hits) { res.excluded = `not about "${o.about}"`; return res; }
    score *= (1 + hits);
    res.reasons.push(`${hits} of your messages mention "${o.about}"`);
  }
  if (corrections) res.reasons.push(`${corrections} correction${corrections === 1 ? '' : 's'}`);
  if (decisions) res.reasons.push(`${decisions} decision${decisions === 1 ? '' : 's'}`);
  if (prefs) res.reasons.push(`${prefs} stated preference${prefs === 1 ? '' : 's'}`);
  if (checks) res.reasons.push(`${checks} understanding check${checks === 1 ? '' : 's'}`);
  res.reasons.push(`${person.length} messages from you`, ageDays < 1 ? 'today' : `${Math.round(ageDays)} days ago`);
  res.score = Math.round(score * 1000) / 1000;
  res.counts = { corrections, decisions, prefs, checks, chars };
  return res;
}

// Scores the newest pool of sessions and returns the top N. Reading every
// transcript on a machine with years of history would be slow, so the pool is
// the newest max(3N, 300) — or 2000 when filtering by topic.
function pickSessions(opts) {
  const o = { sessions: 200, ...(opts || {}) };
  const n = Math.max(1, Number(o.sessions) || 200);
  const files = (o.files || listSessionFiles()).filter((f) => !(o.excludeSessionIds || []).includes(f.sessionId));
  const pool = files.slice(0, topicTerms(o.about).length ? 2000 : Math.max(3 * n, 300));
  const scored = pool.map((f) => scoreSession(f, o));
  const eligible = scored.filter((s) => !s.excluded).sort((a, b) => b.score - a.score);
  return { picked: eligible.slice(0, n), considered: pool.length, eligible: eligible.length, available: files.length, excluded: scored.filter((s) => s.excluded) };
}

// ── The person's words, verbatim, within a budget (no model) ───────────────
function extractSignal(fileInfo, opts) {
  const budget = (opts && opts.budget) || SIGNAL_BUDGET;
  const { turns } = readTurns(fileInfo);
  const persons = [];
  turns.forEach((t, i) => { if (t.role === 'person') persons.push({ ...t, idx: i, ref: `U${persons.length + 1}` }); });
  const weight = (t) => (CORRECTION_RE.test(t.text) ? 3 : 0) + (DECISION_RE.test(t.text) ? 2 : 0) + (PREFERENCE_RE.test(t.text) ? 2 : 0);
  const order = persons.map((p, k) => ({ p, k, w: weight(p) + (k < 3 || k >= persons.length - 3 ? 1 : 0) }))
    .sort((a, b) => b.w - a.w || a.k - b.k);
  const keep = new Set(); let used = 0; let cut = 0;
  for (const { p } of order) {
    const len = Math.min(p.text.length, 2000) + 40;
    if (used + len > budget * 0.8 && keep.size) { cut++; continue; }
    keep.add(p.ref); used += len;
  }
  const lines = [];
  const refs = {};
  const people = {};
  for (const p of persons) {
    if (!keep.has(p.ref)) continue;
    refs[p.ref] = p.at; people[p.ref] = p.text;
    // The agent's last words before this message, shortened — the context the reply answers.
    let before = '';
    for (let j = p.idx - 1; j >= 0; j--) { if (turns[j].role === 'agent') { before = turns[j].text; break; } if (turns[j].role === 'person') break; }
    if (before && used < budget) {
      const b = before.replace(/\s+/g, ' ');
      const piece = b.length > 400 ? `${b.slice(0, 200)} … ${b.slice(-180)}` : b;
      lines.push(`[agent, just before ${p.ref}]: ${piece}`);
      used += piece.length + 30;
    }
    const text = p.text.length > 2000 ? `${p.text.slice(0, 2000)} [message continues, cut here]` : p.text;
    lines.push(`[${p.ref} ${String(p.at).slice(0, 16)}] PERSON: ${text}`);
  }
  const first = persons[0] ? String(persons[0].at).slice(0, 10) : '';
  const last = persons.length ? String(persons[persons.length - 1].at).slice(0, 10) : '';
  const header = `SESSION ${fileInfo.sessionId.slice(0, 8)} · project folder ${fileInfo.project} · ${first}${last && last !== first ? ` to ${last}` : ''} · ${persons.length} messages from the person${cut ? ` (${cut} lower-signal messages left out to fit)` : ''}`;
  return { text: `${header}\n\n${lines.join('\n')}`, refs, people, personTurns: persons.length, firstAt: persons[0] ? persons[0].at : '', lastAt: persons.length ? persons[persons.length - 1].at : '' };
}

function estimate(picked) {
  let input = 0;
  for (const s of picked) {
    const chars = Math.min(SIGNAL_BUDGET, (s.counts ? s.counts.chars : 4000) * 1.4 + 1500);
    input += Math.ceil(chars / 4) + PROMPT_OVERHEAD_TOKENS;
  }
  const output = picked.length * OUTPUT_TOKENS_PER_SESSION;
  const mapIn = picked.length * 450 + 1000; const mapOut = 2500;
  const range = costRange(input + mapIn, output + mapOut);
  const minutes = Math.max(1, Math.round((picked.length * 20) / 3 / 60));
  return { inputTokens: input + mapIn, outputTokens: output + mapOut, range, text: moneyRange(range), minutes };
}

// Rough figure from the file count alone (used in the offer, where reading
// every transcript would slow session start).
function quickEstimate(n) {
  const input = n * (3000 + PROMPT_OVERHEAD_TOKENS) + n * 450 + 1000;
  const output = n * OUTPUT_TOKENS_PER_SESSION + 2500;
  const range = costRange(input, output);
  return { range, text: moneyRange(range), minutes: Math.max(1, Math.round((n * 20) / 3 / 60)) };
}

// ── Talking to the model ───────────────────────────────────────────────────
// Default: the person's own Claude Code, headless, on Haiku, with no tools, no
// hooks, no plugins, no saved transcript (so these calls never show up as past
// sessions later). ALIGNMENT_HARNESS_CALIBRATION_CMD swaps in any executable
// taking the same arguments — the tests use a fake one.
function modelCommand() {
  return process.env.ALIGNMENT_HARNESS_CALIBRATION_CMD || process.env.CLAUDE_BIN || 'claude';
}

function runOnce(cmd, args, input, timeoutMs) {
  return new Promise((resolve) => {
    let out = ''; let err = ''; let done = false;
    const wd = dirs().cwd;
    try { fs.mkdirSync(wd, { recursive: true }); } catch (_) { /* spawn falls back to tmp */ }
    let child;
    try {
      child = spawn(cmd, args, {
        cwd: fs.existsSync(wd) ? wd : os.tmpdir(),
        env: { ...process.env, ALIGNMENT_HARNESS_NESTED: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) { resolve({ code: -1, out: '', err: String(e.message || e) }); return; }
    const timer = setTimeout(() => { if (!done) { try { child.kill('SIGKILL'); } catch (_) { /* gone */ } } }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { if (done) return; done = true; clearTimeout(timer); resolve({ code: -1, out, err: String(e.message || e) }); });
    child.on('close', (code, signal) => { if (done) return; done = true; clearTimeout(timer); resolve({ code, out, err: signal === 'SIGKILL' ? `timed out after ${Math.round(timeoutMs / 1000)} s` : err }); });
    try { child.stdin.end(input); } catch (_) { /* reported via close */ }
  });
}

function parseCliResult(stdout) {
  let j = null;
  try { j = JSON.parse(stdout); } catch (_) {
    const lines = String(stdout).trim().split('\n');
    for (let i = lines.length - 1; i >= 0 && !j; i--) { try { j = JSON.parse(lines[i]); } catch (_) { /* keep looking */ } }
  }
  if (!j) return { ok: false, error: `the model's reply was not readable: ${String(stdout).slice(0, 200)}` };
  const events = Array.isArray(j) ? j : [j];
  const r = events.find((x) => x && x.type === 'result') || events[events.length - 1];
  const init = events.find((x) => x && x.type === 'system' && x.subtype === 'init');
  if (!r) return { ok: false, error: 'the model returned no result' };
  if (r.is_error) return { ok: false, error: String(r.result || r.subtype || 'the model reported an error').slice(0, 300) };
  return { ok: true, text: String(r.result || ''), costUsd: Number(r.total_cost_usd) || 0, model: (init && init.model) || null, usage: r.usage || null };
}

async function callModel(system, input, opts) {
  const o = opts || {};
  const cmd = modelCommand();
  const base = ['-p', '--model', o.model || 'haiku', '--tools', '', '--no-session-persistence', '--output-format', 'json', '--system-prompt', system];
  const extra = ['--safe-mode', '--strict-mcp-config', '--settings', '{"disableAllHooks":true}'];
  let r = await runOnce(cmd, [...base, ...extra], input, o.timeoutMs || 180000);
  // Older Claude Code without one of the isolation flags: retry with the core flags only.
  if (r.code !== 0 && /unknown option|unrecognized|unexpected argument/i.test(r.err)) {
    r = await runOnce(cmd, base, input, o.timeoutMs || 180000);
  }
  if (r.code === -1 && /ENOENT/.test(r.err)) return { ok: false, error: `could not find Claude Code (tried "${cmd}")` };
  if (!r.out.trim()) return { ok: false, error: (r.err || `exited with code ${r.code}`).trim().slice(0, 300) };
  return parseCliResult(r.out);
}

function parseJsonObject(text) {
  const t = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch (_) { /* fall through */ }
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (_) { return null; } }
  return null;
}

// ── Quotes: only the person's real words count as quotes ──────────────────
function words(s) {
  return String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
}
function containsWords(hay, needle) {
  if (!needle.length) return false;
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

function asText(v, max) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max || 600) : null;
}

// Checks one note from the model against the session it came from. Keeps an
// item only when it says something; a quote that is not the person's exact
// words (in order) is removed, and the item is marked as a paraphrase.
function validateNote(raw, signal) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'not a JSON object' };
  if (raw.empty) return { ok: true, empty: true, why: asText(raw.why, 300) };
  const people = signal.people || {};
  const hayByRef = {}; for (const [k, v] of Object.entries(people)) hayByRef[k] = words(v);
  const stats = { kept: 0, dropped: 0, unquoted: 0 };
  const checkQuote = (item) => {
    const q = asText(item.quote, 400);
    let ref = asText(item.ref, 10);
    if (!q) { item.quote = null; item.quoteVerified = false; stats.unquoted++; return item; }
    const n = words(q);
    let found = ref && hayByRef[ref] ? containsWords(hayByRef[ref], n) : false;
    if (!found) {
      const alt = Object.keys(hayByRef).find((k) => containsWords(hayByRef[k], n));
      if (alt) { found = true; ref = alt; }
    }
    if (found && n.length >= 2) { item.quote = q; item.ref = ref; item.quoteVerified = true; stats.kept++; } else { item.quote = null; item.quoteVerified = false; item.quoteRemoved = 'not the person\'s exact words'; stats.dropped++; }
    if (item.ref && signal.refs && signal.refs[item.ref]) item.at = signal.refs[item.ref];
    return item;
  };
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);
  const corrections = list(raw.corrections).map((c) => checkQuote({
    situation: asText(c.situation), agentBelieved: asText(c.agentBelieved), personMeant: asText(c.personMeant), lean: asText(c.lean), why: asText(c.why), quote: c.quote, ref: c.ref,
  })).filter((c) => c.personMeant || c.lean);
  const preferences = list(raw.preferences).map((p) => checkQuote({
    situation: asText(p.situation), lean: asText(p.lean), strength: ['hard-lean', 'lean', 'slight-lean'].includes(p.strength) ? p.strength : 'slight-lean', why: asText(p.why), mightNotApply: asText(p.mightNotApply), quote: p.quote, ref: p.ref,
  })).filter((p) => p.lean);
  const decisions = list(raw.decisions).map((d) => checkQuote({ decision: asText(d.decision), why: asText(d.why), quote: d.quote, ref: d.ref })).filter((d) => d.decision);
  const vocabulary = list(raw.vocabulary).map((v) => ({ term: asText(v.term, 80), means: asText(v.means, 300) })).filter((v) => v.term && v.means);
  const openQuestions = (Array.isArray(raw.openQuestions) ? raw.openQuestions : []).map((q) => asText(q, 300)).filter(Boolean).slice(0, 8);
  const target = asText(raw.target);
  if (!target && !corrections.length && !preferences.length && !decisions.length) return { ok: false, error: 'the note had nothing usable in it' };
  const confidence = Math.max(0, Math.min(100, Number(raw.confidence) || 0));
  return { ok: true, note: { target, initiative: asText(raw.initiative), location: asText(raw.location), gap: asText(raw.gap), corrections, preferences, decisions, vocabulary, openQuestions, confidence }, quoteCheck: stats };
}

function loadPrompt(name) { return fs.readFileSync(path.join(core.PLUGIN_ROOT, 'prompts', name), 'utf8'); }

// One session → one validated note (not saved; see runCalibration / sample).
async function noteForSession(pick, opts) {
  const signal = extractSignal(pick);
  const r = await callModel(loadPrompt('calibration-session.txt'), signal.text, opts);
  if (!r.ok) return { ok: false, error: r.error, signal };
  const parsed = parseJsonObject(r.text);
  if (!parsed) return { ok: false, error: 'the model did not reply with a JSON note', signal, costUsd: r.costUsd };
  const v = validateNote(parsed, signal);
  if (!v.ok) return { ok: false, error: v.error, signal, costUsd: r.costUsd };
  const record = {
    id: core.safeId(pick.sessionId),
    title: v.empty ? `Calibration note (nothing to learn): session ${pick.sessionId.slice(0, 8)}` : `Calibration note: ${v.note.target || `session ${pick.sessionId.slice(0, 8)}`}`.slice(0, 160),
    kind: 'calibration-session-note',
    status: 'unconfirmed',
    whatThisIs: 'What one past session suggests about how to understand this person, written by a low-cost model and not yet confirmed by them. Leans to weigh, not rules.',
    sessionId: pick.sessionId,
    project: pick.project,
    cwd: pick.cwd || null,
    gitBranch: pick.branch || null,
    sessionFrom: signal.firstAt || null,
    sessionTo: signal.lastAt || null,
    personTurns: signal.personTurns,
    pickedBecause: pick.reasons || [],
    selectionScore: pick.score,
    ...(v.empty ? { empty: true, why: v.why } : v.note),
    quoteCheck: v.quoteCheck || null,
    source: { transcript: pick.file, messageTimes: signal.refs },
    model: r.model || (opts && opts.model) || 'haiku',
    costUsd: r.costUsd || 0,
    generatedAt: core.nowIso(),
  };
  return { ok: true, record, signal, costUsd: r.costUsd || 0 };
}

// A note as a person reads it: sentences, their own words in quotes, no field names.
function sentence(t) {
  const x = String(t || '').trim().replace(/\s+/g, ' ');
  if (!x) return '';
  return /[.!?]$/.test(x) ? x : `${x}.`;
}
function lowerFirst(t) { const x = String(t || '').trim(); return x ? x[0].toLowerCase() + x.slice(1) : x; }
function upperFirst(t) { const x = String(t || '').trim(); return x ? x[0].toUpperCase() + x.slice(1) : x; }
function whenClause(situation) {
  const x = String(situation || '').trim().replace(/[.,;:]+$/, '');
  if (!x) return '';
  return /^(when|whenever|if|before|after|while)\b/i.test(x) ? upperFirst(x) : `When ${lowerFirst(x)}`;
}
function leanPhrase(lean, strength) {
  let x = String(lean || '').trim().replace(/[.]+$/, '');
  x = x.replace(/^(you\s+)?(lean(s)?\s+(strongly\s+|slightly\s+)?toward(s)?\s+)/i, '');
  const how = strength === 'hard-lean' ? 'lean strongly toward' : strength === 'slight-lean' ? 'lean slightly toward' : 'lean toward';
  return `you ${how} ${lowerFirst(x)}`;
}
function said(item) { return item && item.quote && item.quoteVerified ? ` You said: "${item.quote}"` : ''; }

function describeNote(n) {
  if (!n) return '';
  if (n.empty) return `There was nothing to learn about you from this session (${lowerFirst(n.why || 'too short') .replace(/[.]+$/, '')}).`;
  const out = [];
  if (n.target) out.push(`What you seemed to be after: ${sentence(lowerFirst(n.target))}${n.initiative ? ` It looked like part of a bigger aim: ${sentence(lowerFirst(n.initiative))}` : ''}`);
  if (n.gap) out.push(`Still open when the session ended: ${sentence(lowerFirst(n.gap))}`);
  if ((n.corrections || []).length) {
    out.push('', 'Where you had to correct the agent:');
    for (const c of n.corrections) {
      const w = whenClause(c.situation);
      const believed = c.agentBelieved ? `the agent assumed ${lowerFirst(c.agentBelieved).replace(/[.]+$/, '')}` : '';
      const meant = c.personMeant ? `you meant ${lowerFirst(c.personMeant).replace(/[.]+$/, '')}` : (c.lean ? leanPhrase(c.lean) : '');
      out.push(`- ${w ? `${w}, ` : ''}${[believed, meant].filter(Boolean).join(', but ')}.${c.why ? ` ${sentence(upperFirst(c.why))}` : ''}${said(c)}`);
    }
  }
  if ((n.preferences || []).length) {
    out.push('', 'What you lean toward:');
    for (const p of n.preferences) {
      const w = whenClause(p.situation);
      out.push(`- ${w ? `${w}, ${leanPhrase(p.lean, p.strength)}` : upperFirst(leanPhrase(p.lean, p.strength))}${p.why ? `, because ${lowerFirst(p.why).replace(/[.]+$/, '')}` : ''}.${p.mightNotApply ? ` That may not hold ${lowerFirst(p.mightNotApply).replace(/^(it )?(may not hold |might not apply )?/i, '').replace(/[.]+$/, '')}.` : ''}${said(p)}`);
    }
  }
  if ((n.decisions || []).length) {
    out.push('', 'What you decided:');
    for (const d of n.decisions) out.push(`- ${sentence(upperFirst(d.decision)).replace(/[.]$/, '')}${d.why ? `, because ${lowerFirst(d.why).replace(/[.]+$/, '')}` : ''}.${said(d)}`);
  }
  if ((n.vocabulary || []).length) {
    out.push('', 'Your words for things:');
    for (const v of n.vocabulary) out.push(`- By "${v.term}" you mean ${lowerFirst(v.means).replace(/[.]+$/, '')}.`);
  }
  if ((n.openQuestions || []).length) {
    out.push('', 'What this session left unclear:');
    for (const q of n.openQuestions) out.push(`- ${sentence(upperFirst(q))}`);
  }
  const conf = Number(n.confidence);
  if (Number.isFinite(conf) && conf > 0) out.push('', `How sure the model is that this is right about you: ${conf} out of 100. Anything above is a guess you can correct.`);
  return out.join('\n');
}

function saveSample(record) {
  const file = path.join(core.P.data, 'state', 'calibration-sample.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  core.writeJsonAtomic(file, record);
  return file;
}

function addCost(kind, usd) {
  const st = readState();
  const costs = { ...(st.costs || {}) };
  costs[kind] = (Number(costs[kind]) || 0) + (Number(usd) || 0);
  costs.total = (Number(costs.total) || 0) + (Number(usd) || 0);
  const costCounts = { ...(st.costCounts || {}) };
  costCounts[kind] = (Number(costCounts[kind]) || 0) + 1;
  writeState({ costs, costCounts });
  return costs;
}

function existingNoteIds() {
  try { return new Set(fs.readdirSync(dirs().sessions).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))); } catch (_) { return new Set(); }
}

function saveNote(record) {
  fs.mkdirSync(dirs().sessions, { recursive: true });
  const file = path.join(dirs().sessions, `${record.id}.json`);
  core.writeJsonAtomic(file, record);
  return file;
}

async function pool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.max(1, size) }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); }
  });
  await Promise.all(workers);
}

// The light self-priming. Resumable: sessions that already have a note are
// skipped unless redo is set. Stops early (and says why) when the model can't
// be reached, or spending passes maxUsd.
async function runCalibration(opts) {
  const o = { sessions: 200, concurrency: 3, maxUsd: 5, ...(opts || {}) };
  const log = o.log || (() => {});
  const have = o.redo ? new Set() : existingNoteIds();
  const sel = pickSessions(o);
  const todo = sel.picked.filter((p) => !have.has(core.safeId(p.sessionId)));
  const est = estimate(todo);
  const run = { startedAt: core.nowIso(), requested: Number(o.sessions), about: o.about || null, picked: sel.picked.length, alreadyHad: sel.picked.length - todo.length, todo: todo.length, done: 0, empty: 0, failed: 0, costUsd: 0, errors: [] };
  if (o.dryRun) return { dryRun: true, selection: sel, todo, estimate: est, run };
  writeState({ lastRun: run });
  log(`Calibrating from ${todo.length} session${todo.length === 1 ? '' : 's'}${run.alreadyHad ? ` (${run.alreadyHad} already done earlier)` : ''}. Estimated cost ${est.text}; about ${est.minutes} min.`);
  let consecutiveFails = 0; let stopped = null;
  await pool(todo, o.concurrency, async (pick, k) => {
    if (stopped) return;
    const r = await noteForSession(pick, o);
    run.costUsd += r.costUsd || 0;
    if (r.ok) {
      consecutiveFails = 0;
      saveNote(r.record);
      if (r.record.empty) run.empty++; else run.done++;
      log(`  [${k + 1}/${todo.length}] ${r.record.empty ? 'nothing to learn' : 'noted'} — ${pick.sessionId.slice(0, 8)} (${(pick.reasons || []).slice(0, 2).join(', ')})`);
    } else {
      run.failed++; consecutiveFails++;
      if (run.errors.length < 10) run.errors.push({ session: pick.sessionId.slice(0, 8), error: r.error });
      log(`  [${k + 1}/${todo.length}] skipped ${pick.sessionId.slice(0, 8)}: ${r.error}`);
      if (consecutiveFails >= 3 && run.done + run.empty === 0) stopped = `the model could not be reached (${r.error})`;
    }
    if (run.costUsd > o.maxUsd) stopped = `spending reached the ${money(o.maxUsd)} limit`;
    if ((k + 1) % 10 === 0) writeState({ lastRun: run });
  });
  run.stopped = stopped;
  // Rebuild the map only when there is something new for it (a model call costs money).
  if ((!stopped || run.done) && (run.done > 0 || !fs.existsSync(dirs().map))) {
    const m = await buildMap(o);
    run.map = m.ok ? (m.synthesized ? 'written' : 'written (plain list; the summary step failed)') : `not written: ${m.error}`;
    run.costUsd += m.costUsd || 0;
    run.mapCostUsd = m.costUsd || 0;
  } else if (fs.existsSync(dirs().map)) {
    run.map = 'unchanged (nothing new to add to it)';
  }
  run.finishedAt = core.nowIso();
  addCost('sessionNotes', run.costUsd - (run.mapCostUsd || 0));
  writeState({ lastRun: run, decision: readState().decision || 'yes', calibratedAt: run.done ? run.finishedAt : readState().calibratedAt });
  return { run, selection: sel, estimate: est };
}

function loadNotes() {
  let files = [];
  try { files = fs.readdirSync(dirs().sessions).filter((f) => f.endsWith('.json')); } catch (_) { return []; }
  return files.map((f) => core.readJson(path.join(dirs().sessions, f), null)).filter((r) => r && !r.empty)
    .sort((a, b) => String(b.sessionTo || '').localeCompare(String(a.sessionTo || '')));
}

function compactNote(n) {
  const pick = (arr, keys) => (arr || []).map((x) => Object.fromEntries(keys.filter((k) => x[k]).map((k) => [k, x[k]])));
  return {
    s: String(n.sessionId).slice(0, 8), date: String(n.sessionTo || n.sessionFrom || '').slice(0, 10), target: n.target, initiative: n.initiative,
    corrections: pick(n.corrections, ['situation', 'agentBelieved', 'personMeant', 'lean', 'why', 'quote']),
    preferences: pick(n.preferences, ['situation', 'lean', 'strength', 'why', 'mightNotApply', 'quote']),
    decisions: pick(n.decisions, ['decision', 'why', 'quote']),
    vocabulary: n.vocabulary, openQuestions: n.openQuestions,
  };
}

const MAP_HEADER = (count, from, to) => `# Calibration map: how to orient to this person

Drawn on ${core.nowIso().slice(0, 10)} from ${count} of their past Claude Code sessions (${from} to ${to}) by a low-cost model. These are leans to weigh, not rules, and the person has not confirmed them yet. When one shapes what you do, say so, so they can correct it. Each [s:xxxxxxxx] is a session; its full note is in sessions/<id>.json next to this file.
`;

// Quotation marks in the map are allowed only around words that really are the
// person's (a verified quote in some note). Anything else loses its quote marks.
function scrubMapQuotes(md, notes) {
  const hay = [];
  for (const n of notes) for (const k of ['corrections', 'preferences', 'decisions']) for (const it of n[k] || []) if (it.quote && it.quoteVerified) hay.push(words(it.quote));
  let removed = 0;
  const out = md.replace(/"([^"\n]{3,300})"|“([^”\n]{3,300})”/g, (whole, a, b) => {
    const w = words(a || b);
    if (w.length < 3) return whole;
    if (hay.some((h) => containsWords(h, w))) return whole;
    removed++;
    return a || b;
  });
  return { md: out, removed };
}

function fallbackMap(notes) {
  const lines = ['## Leans to weigh (plain list, newest first)', ''];
  for (const n of notes.slice(0, 60)) {
    for (const p of n.preferences || []) lines.push(`- ${p.situation ? `${p.situation}: ` : ''}${p.lean} (${p.strength}) [s:${String(n.sessionId).slice(0, 8)}]`);
  }
  lines.push('', '## Corrections they have had to make', '');
  for (const n of notes.slice(0, 60)) {
    for (const c of n.corrections || []) lines.push(`- ${c.agentBelieved ? `Agent assumed ${c.agentBelieved}; ` : ''}they meant ${c.personMeant || c.lean} [s:${String(n.sessionId).slice(0, 8)}]`);
  }
  return lines.join('\n');
}

async function buildMap(opts) {
  const notes = loadNotes();
  if (!notes.length) return { ok: false, error: 'no session notes to build it from yet' };
  const dates = notes.map((n) => String(n.sessionTo || n.sessionFrom || '').slice(0, 10)).filter(Boolean).sort();
  const header = MAP_HEADER(notes.length, dates[0] || '?', dates[dates.length - 1] || '?');
  let body = null; let costUsd = 0; let synthesized = false;
  let input = JSON.stringify(notes.map(compactNote));
  if (input.length > 360000) input = JSON.stringify(notes.slice(0, Math.floor(notes.length * 360000 / input.length)).map(compactNote));
  const r = await callModel(loadPrompt('calibration-map.txt'), input, { ...(opts || {}), timeoutMs: 300000 });
  if (r.ok && /##\s/.test(r.text)) {
    body = r.text.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '').replace(/^#\s[^\n]*\n/, '').trim();
    costUsd = r.costUsd || 0; synthesized = true;
  } else {
    body = fallbackMap(notes);
  }
  const s = scrubMapQuotes(body, notes);
  const md = `${header}\n${s.md}\n${s.removed ? `\n_(${s.removed} phrase${s.removed === 1 ? '' : 's'} that looked like quotes but were not the person's exact words had their quotation marks removed.)_\n` : ''}`;
  fs.mkdirSync(dirs().base, { recursive: true });
  fs.writeFileSync(dirs().map, md);
  writeState({ mapAt: core.nowIso(), mapNotes: notes.length, lastMap: { at: core.nowIso(), notes: notes.length, synthesized, costUsd } });
  addCost('map', costUsd);
  return { ok: true, file: dirs().map, synthesized, costUsd, error: r.ok ? null : r.error };
}

// ── Plans and notes already written down (no model) ────────────────────────
function walkMd(dir, out, depth, max) {
  if (depth > 5 || out.length >= max) return;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of ents) {
    if (out.length >= max) return;
    if (e.name.startsWith('.') && depth > 0 && e.name !== '.claude') continue;
    if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(full, out, depth + 1, max);
    else if (/\.mdx?$/i.test(e.name)) out.push(full);
  }
}

function repoRoots() {
  const roots = new Set([process.cwd()]);
  const cfg = core.readJson(path.join(core.P.data, 'agent-find.json'), null);
  if (cfg && Array.isArray(cfg.repos)) for (const r of cfg.repos) if (typeof r === 'string' && r.trim()) roots.add(path.resolve(r));
  return [...roots];
}

function findWrittenDown() {
  const found = [];
  const add = (file, kind, from) => { if (!found.some((f) => f.file === file)) found.push({ file, kind, from }); };
  const plansHome = path.join(core.configHome(), 'plans');
  const a = []; walkMd(plansHome, a, 0, 3000); a.forEach((f) => add(f, 'plan', '~/.claude/plans'));
  for (const root of repoRoots()) {
    for (const rel of ['docs/plans', 'docs/superpowers/plans', 'docs/specs', 'plans', '.claude/plans']) {
      const b = []; walkMd(path.join(root, rel), b, 0, 2000);
      b.forEach((f) => add(f, 'plan', path.join(path.basename(root), rel)));
    }
  }
  // Claude Code's own memory notes, one folder per project.
  let projects = [];
  try { projects = fs.readdirSync(projectsDir(), { withFileTypes: true }).filter((d) => d.isDirectory()); } catch (_) { /* none */ }
  for (const d of projects) {
    const c = []; walkMd(path.join(projectsDir(), d.name, 'memory'), c, 0, 500);
    c.forEach((f) => add(f, 'memory-note', `memory of ${d.name}`));
  }
  return found.map((f) => { let st = null; try { st = fs.statSync(f.file); } catch (_) { /* gone */ } return st ? { ...f, mtime: st.mtimeMs, size: st.size } : null; }).filter(Boolean);
}

function writtenDownSummary(found) {
  const f = found || findWrittenDown();
  const plans = f.filter((x) => x.kind === 'plan').length;
  const notes = f.filter((x) => x.kind === 'memory-note').length;
  const folders = {};
  for (const x of f) folders[x.from] = (folders[x.from] || 0) + 1;
  return { plans, notes, total: f.length, folders, items: f };
}

function indexWrittenDown(opts) {
  const o = opts || {};
  const sum = writtenDownSummary();
  if (o.dryRun) return { dryRun: true, ...sum };
  fs.mkdirSync(dirs().plans, { recursive: true });
  let written = 0; let unchanged = 0; let skipped = 0;
  for (const it of sum.items) {
    const id = crypto.createHash('sha1').update(it.file).digest('hex').slice(0, 16);
    const file = path.join(dirs().plans, `${id}.json`);
    const cur = core.readJson(file, null);
    if (cur && cur.sourceModifiedAt === new Date(it.mtime).toISOString()) { unchanged++; continue; }
    let text = '';
    try { text = fs.readFileSync(it.file, 'utf8'); } catch (_) { skipped++; continue; }
    if (text.length > 400000) text = text.slice(0, 400000);
    const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
    const fm = (text.match(/^---\n[\s\S]*?\nname:\s*(.+)\n/) || [])[1];
    core.writeJsonAtomic(file, {
      id, kind: it.kind === 'plan' ? 'indexed-plan' : 'indexed-memory-note',
      title: `${it.kind === 'plan' ? 'Plan' : 'Memory note'}: ${(heading || fm || path.basename(it.file)).trim()}`.slice(0, 160),
      whatThisIs: 'An index entry for something the person (or an agent working with them) already wrote down on this machine. The file itself is the source; this entry only makes it findable.',
      path: it.file, from: it.from,
      sourceModifiedAt: new Date(it.mtime).toISOString(),
      headings: (text.match(/^#{1,3}\s+.+$/gm) || []).slice(0, 15).map((h) => h.replace(/^#+\s+/, '')),
      excerpt: text.slice(0, 6000),
      indexedAt: core.nowIso(),
    });
    written++;
  }
  writeState({ plansIndexedAt: core.nowIso(), plansIndexed: written + unchanged, plansDecision: 'yes' });
  return { ...sum, written, unchanged, skipped, folder: dirs().plans };
}

// ── What the person sees, and what the agent is told at session start ──────
// Name Claude Code's keep period only when it is what limits the history: the
// oldest session is within ~10% of it. Otherwise the history simply starts later.
function retentionSentence(inv, ret) {
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const oldestDays = inv.oldest ? (Date.now() - inv.oldest.getTime()) / 86400000 : 0;
  if (oldestDays < 0.9 * ret.days) return `I found ${plural(inv.sessions, 'past session')} across ${plural(inv.projects, 'project')}, going back to ${fmt(inv.oldest)}.`;
  return ret.fromSettings
    ? `Your Claude Code settings keep sessions for ${plural(ret.days, 'day')}, so that is as far back as your history goes here: I found ${plural(inv.sessions, 'past session')} across ${plural(inv.projects, 'project')}, going back to ${fmt(inv.oldest)}.`
    : `Claude Code keeps sessions for ${ret.days} days by default, so I found ${inv.sessions} from the last month, across ${plural(inv.projects, 'project')}, going back to ${fmt(inv.oldest)}.`;
}

// On by default; asked only while calibration.offerLongerHistory is true (false never asks).
// Self-contained: it names the setting itself, whether or not the history sentence did.
function keepTarget() { return Number(calibrationSwitches().longerHistoryDays) || 365; }
function keepApplies(ret) {
  const r = ret || retention();
  return calibrationSwitches().offerLongerHistory === true && r.days < keepTarget();
}
function longerHistoryOffer(ret) {
  const r = ret || retention();
  if (!keepApplies(r)) return '';
  const now = r.fromSettings ? `Your Claude Code settings delete sessions older than ${r.days} day${r.days === 1 ? '' : 's'}.` : `Claude Code deletes sessions older than ${r.days} days by default.`;
  return `${now} If you'd like more to calibrate from later on, I can change that so it keeps them for ${keepTarget()} days. I'll only change it if you say yes, and you can change it back any time.`;
}

const CLOSING_LINE = 'Say yes, ask for a sample first, or no to skip it.';

function offerFacts(inv) {
  const parts = [];
  const ret = retention();
  const n = Math.min(200, inv.sessions);
  if (inv.sessions) {
    const q = quickEstimate(n);
    parts.push(`What I found on this machine: ${retentionSentence(inv, ret)} Priming from ${inv.sessions <= 200 ? `all ${n}` : `the ${n} that look most useful`} would cost ${q.text} at Haiku's API prices${/^between /.test(q.text) ? ' (the range is because different Claude Code versions use different Haiku models)' : ''}; on a Claude subscription it counts toward your plan's usage instead. It takes about ${q.minutes} minute${q.minutes === 1 ? '' : 's'} in the background, and you can keep working. Say a different number if you want more or fewer.`);
    parts.push('Haiku reads the text of those sessions the same way Claude reads your conversations now. What it writes about you is saved only on this machine, in the harness\'s own folder, and you can read, correct or delete any of it.');
  }
  return parts.join('\n\n');
}

// Where a top-level key's value sits in JSON text: { valueStart, valueEnd } or null.
// Walks the text tracking strings and depth, so a same-named key inside a nested
// object is never touched.
function topLevelValueSpan(text, key) {
  let depth = 0; let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const str = text.slice(i + 1, j);
      let k = j + 1;
      while (k < n && /\s/.test(text[k])) k++;
      if (depth === 1 && text[k] === ':' && JSON.parse(`"${str}"`) === key) {
        let v = k + 1;
        while (v < n && /\s/.test(text[v])) v++;
        let e = v;
        while (e < n && !/[,}\s]/.test(text[e])) e++;
        return { valueStart: v, valueEnd: e };
      }
      i = j + 1; continue;
    }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    i++;
  }
  return null;
}

// The settings text with cleanupPeriodDays set to `days`, changing nothing else:
// an existing top-level value is replaced in place; otherwise one line is
// inserted as the first key, with the file's own indentation.
function withCleanupPeriodDays(raw, days) {
  const text = raw === null || !raw.trim() ? '{}\n' : raw;
  const span = topLevelValueSpan(text, 'cleanupPeriodDays');
  if (span) return text.slice(0, span.valueStart) + String(days) + text.slice(span.valueEnd);
  const open = text.indexOf('{');
  const after = text.slice(open + 1);
  const firstKey = after.search(/\S/);
  const empty = firstKey < 0 || after[firstKey] === '}';
  const lead = after.slice(0, Math.max(0, firstKey));
  const nl = lead.lastIndexOf('\n');
  if (nl >= 0 && !empty) {
    const indent = lead.slice(nl + 1);
    return `${text.slice(0, open + 1)}\n${indent}"cleanupPeriodDays": ${days},${after}`;
  }
  if (empty) {
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    return `${text.slice(0, open + 1)}${eol}  "cleanupPeriodDays": ${days}${eol}${after.replace(/^\s*/, '')}`;
  }
  return `${text.slice(0, open + 1)}${lead}"cleanupPeriodDays": ${days},${lead ? lead : ''}${after.slice(firstKey)}`;
}

// Raises Claude Code's cleanupPeriodDays — only when the switch is on, the keep-sessions question
// is the open question AND the harness has confirmed the person was shown it, and they said yes
// (answer() calls this; the CLI's keep-history goes through answer()). Whatever calls it, a setting
// of the person's own is never changed without a question they actually saw. Refuses a settings
// file that isn't valid JSON, backs the file up, and changes only that one value in its text.
function keepHistory(days) {
  const sw = calibrationSwitches();
  if (sw.offerLongerHistory !== true) return { ok: false, error: 'this offer is switched off (calibration.offerLongerHistory in the switches file)' };
  const oq = readState().openQuestion;
  if (!oq || oq.id !== 'keep') return { ok: false, error: 'the keep-sessions question is not the open question, so the person has not been asked it and nothing was changed' };
  if (!oq.shownConfirmed) return { ok: false, error: 'the harness has not confirmed that the person saw the keep-sessions question word for word in your previous reply, so nothing was changed' };
  const d = Math.round(Number(days) || keepTarget());
  if (d < 1) return { ok: false, error: 'give a number of days, 1 or more' };
  const file = claudeSettingsFile();
  let raw = null;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (_) { raw = null; }
  let j = {};
  if (raw !== null && raw.trim()) { try { j = JSON.parse(raw); } catch (e) { return { ok: false, error: `your Claude Code settings file could not be read (${e.message}), so nothing was changed: ${file}` }; } }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false, error: `your Claude Code settings file is not a settings object, so nothing was changed: ${file}` };
  const before = j.cleanupPeriodDays !== undefined && Number.isFinite(Number(j.cleanupPeriodDays)) ? Number(j.cleanupPeriodDays) : null;
  const next = withCleanupPeriodDays(raw, d);
  // The new text must parse to exactly the old settings plus this one value.
  let check = null;
  try { check = JSON.parse(next); } catch (_) { check = null; }
  const expected = { ...j, cleanupPeriodDays: d };
  const same = check && JSON.stringify(Object.keys(expected).sort().map((k) => [k, expected[k]])) === JSON.stringify(Object.keys(check).sort().map((k) => [k, check[k]]));
  if (!same) return { ok: false, error: `the setting could not be added without changing anything else, so nothing was changed: ${file}` };
  let backup = null;
  if (raw !== null) {
    backup = path.join(core.P.data, 'state', `claude-settings-backup-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, raw);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.harness-tmp-${process.pid}`;
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, file);
  writeState({ historyDaysChangedAt: core.nowIso(), historyDaysBefore: before, historyDaysAfter: d, keepDecision: 'yes' });
  return { ok: true, file, before, after: d, backup };
}

function offerText() {
  const inv = inventory();
  const wd = writtenDownSummary();
  const facts = offerFacts(inv);
  const closing = inv.sessions ? `\n\n${CLOSING_LINE}` : '';
  return { text: `${loadPrompt('calibration-offer.txt').trim()}${facts ? `\n\n${facts}` : ''}${closing}`, inventory: { sessions: inv.sessions, projects: inv.projects }, writtenDown: { plans: wd.plans, notes: wd.notes } };
}

const OFFER_LIMIT = 2; // the first session, and once more if it never got answered

function primeText() {
  let map = '';
  try { map = fs.readFileSync(dirs().map, 'utf8'); } catch (_) { return ''; }
  const cap = 2600;
  const body = map.length > cap ? `${map.slice(0, cap)}\n… [the rest is in the file]` : map;
  return `<calibration-understanding file="${dirs().map}">
This is what the harness has learned so far about how to understand this person, from their past sessions. Read it before your first understanding check this session. Weigh these leans against what they actually say now; never treat them as rules, and when one shapes what you do, say so in a few words so they can correct it. Their own words this session always win. More detail, with the source of every lean: the session notes in ${dirs().sessions}/ (the memory search finds them too).

${body}
</calibration-understanding>`;
}

// ── One open question at a time ───────────────────────────────────────────
// The person is asked at most one of these per reply, in this order, each only
// if it applies: calibrate → index plans and notes → keep sessions longer. The
// open one is recorded, so their next answer is attributed to it and nothing
// else; a bare "yes" can only ever mean the one open question. Each is asked
// once (calibrate: once more in the next session if it got no answer).
const QUESTION_ORDER = ['calibrate', 'plans', 'keep'];
const UNANSWERED_AFTER = 3; // person messages after it was shown, then it is closed as unanswered

function plansQuestion(inv, wd) {
  const what = `${wd.plans ? `${wd.plans} plan${wd.plans === 1 ? '' : 's'}` : ''}${wd.plans && wd.notes ? ' and ' : ''}${wd.notes ? `${wd.notes} memory note${wd.notes === 1 ? '' : 's'}` : ''}`;
  const ret = retention();
  const none = inv.sessions ? '' : `${ret.fromSettings ? `Your Claude Code settings keep sessions for ${ret.days} days` : `Claude Code keeps sessions for ${ret.days} days by default`}, and there are none from that time on this machine, so there is nothing to learn from there yet. `;
  return `${none}I found ${what} already written on this machine. May I index ${wd.total === 1 ? 'it' : 'them'}, so I start from what you've already written down? That's free, uses no model, and stays on this machine.`;
}

function pendingQuestions(st, opts) {
  const o = opts || {};
  const out = [];
  const offered = Array.isArray(st.offeredIn) ? st.offeredIn : [];
  let inv = null; let wd = null;
  const getInv = () => { if (!inv) inv = inventory(); return inv; };
  const getWd = () => { if (!wd) wd = writtenDownSummary(); return wd; };
  if (!st.decision && offered.length < OFFER_LIMIT && !(o.sessionId && offered.includes(o.sessionId)) && getInv().sessions) out.push('calibrate');
  if (!st.plansDecision && !st.plansAsked && getWd().total) out.push('plans');
  if (!st.keepDecision && !st.keepAsked && keepApplies()) out.push('keep');
  return { ids: out, inv: getInv, wd: getWd };
}

const BARE_ANSWER_RULE = 'If the person later says a bare "yes" or "no" while no harness question is open, do not guess what it answers and do not run any calibration command for it: ask them plainly, in one short sentence, what they are saying yes (or no) to.';
const BARE_RE = /^\s*(yes|yeah|yep|yup|sure|ok|okay|go|go ahead|do it|y|no|nope|nah|n|skip)\s*[.!]?\s*$/i;
const LAST_IN_REPLY = 'Make this question the very last thing in your reply, as its own last paragraph, after everything else (including any summary of work you did this turn). Nothing may come after it: no other offer, question, open item, list or sign-off.';
const ENVELOPE_RULE = 'The words to show are inside <offer-text>. Write them exactly as they are, as your own message: do not paraphrase, summarize, shorten or reword them, never write the tags, and never add a heading, label, divider or marker line of your own around them.';

function questionText(id, p) {
  if (id === 'calibrate') return offerText().text;
  if (id === 'plans') return plansQuestion(p.inv(), p.wd());
  return longerHistoryOffer();
}

function answerHelp(id) {
  if (id === 'calibrate') {
    return `How to record their answer (it can only be an answer to this question):
- Yes, or a number: alignment-harness calibration answer yes, then start alignment-harness calibration run --sessions <their number, default 200> in the background and keep working; tell them when it finishes and what it found.
- No, or skip: alignment-harness calibration answer no. Say it's fine and carry on.
- "Show me a sample": alignment-harness calibration sample (one session, one small model call); show what it prints, as it prints it, then end that reply with the line "${CLOSING_LINE}". The question stays open.
- "Only conversations about x": add --about "x" to sample and run.
- "Later": alignment-harness calibration answer later.
- No answer, or they move on: do nothing.`;
  }
  if (id === 'plans') return 'How to record their answer (it can only be an answer to this question): yes → alignment-harness calibration answer yes (that indexes them and prints what it found; tell them in one or two sentences). No → alignment-harness calibration answer no. No answer: do nothing.';
  return 'How to record their answer (it can only be an answer to this question): yes → alignment-harness calibration answer yes (that changes this one Claude Code setting and says what it changed). No → alignment-harness calibration answer no. No answer: do nothing. Never change the setting any other way.';
}

// How the next question is handed over: as the setup the person started, to be asked, never acted on.
const ASK_PLAINLY = 'Ask it plainly; no commentary about commands or tool output is needed.';
const ASK_PLAINLY_NEXT = 'Ask it plainly. If it helps, say in a few words that it is the next setup question. No commentary about commands or tool output is needed.';

// Said ahead of time, in context the harness itself hands over (session start / the person's message), so the
// next question in the answer command's output is expected, not a surprise instruction from a tool.
function chainNotice(id) {
  if (id === 'keep') return '';
  const next = id === 'calibrate' ? 'indexing their plans and notes, then keeping their sessions longer' : 'keeping their sessions longer';
  return `Expected, and part of this same setup: after you record their answer with the calibration command, its output shows the next question of the setup (${next}), when one applies. The person is answering this setup, so show that question as written, as the last paragraph of that reply; saying in a few words that it is the next setup question is fine.`;
}

// The next question as it comes back in the answer command's output: a result the harness reports, already
// announced with the offer, in the same labelled envelope. The display requirement is stated once.
function reportedQuestion(id, text) {
  const how = id === 'plans'
    ? 'Recording their answer: "alignment-harness calibration answer yes" indexes the plans and notes and prints what it found; "alignment-harness calibration answer no" leaves them alone.'
    : 'Recording their answer: "alignment-harness calibration answer yes" changes that one Claude Code setting and says what it changed; "alignment-harness calibration answer no" leaves it alone.';
  return `<calibration-question id="${id}">
Next setup question, as announced when the offer was shown. It is the only open question.
Display: the words inside <offer-text>, word for word, as the last paragraph of the reply, alone, with no tags, heading or label around them.
<offer-text>
${text}
</offer-text>
${how} An answer is recorded only if these exact words were in the reply.
</calibration-question>`;
}

function openQuestion(id, p, ctx) {
  const st = readState();
  const text = questionText(id, p);
  const patch = { openQuestion: { id, text, openedAt: core.nowIso(), sessionId: ctx.sessionId || null, shownAtPrompt: (Number(st.promptCount) || 0) + (ctx.atNextPrompt ? 1 : 0), reoffered: !!ctx.reoffer } };
  if (id === 'calibrate' && !ctx.reoffer) patch.offeredIn = [...(Array.isArray(st.offeredIn) ? st.offeredIn : []), ctx.sessionId];
  if (id === 'plans') patch.plansAsked = core.nowIso();
  if (id === 'keep') patch.keepAsked = core.nowIso();
  writeState(patch);
  if (ctx.asReport) return reportedQuestion(id, text);
  // Only a person who was shown the calibration offer (or answered it) started this setup by answering it.
  // Someone with no past sessions never saw an offer, so the agent must not narrate or invent one: for them
  // this is plainly the first question of the setup (or the next one, when the plans question came first).
  const offerMade = !!st.decision || (Array.isArray(st.offeredIn) && st.offeredIn.length > 0);
  const step = offerMade
    ? 'This is the next question of the harness setup the person started when they answered the calibration offer. Their own answer led here, and your part is to ask it, not to act on it.'
    : (id === 'keep' && st.plansAsked)
      ? 'This is the next question of the harness setup. Your part is to ask it, not to act on it.'
      : 'This is the first question of the harness setup. Your part is to ask it, not to act on it.';
  const intro = ctx.reoffer
    ? `Your last reply did not show this question to the person, so their answer could not be recorded for it. Show it now, once more; this is the last time it is asked. ${id === 'calibrate' ? '' : step}`
    : id === 'calibrate'
      ? `The harness has no understanding of this person yet. ${ctx.again ? 'It offered to calibrate last session and got no answer, so offer it once more now; this is the last time.' : 'This is their first session with it, so offer to calibrate, once.'} Put the offer in your reply after you have handled anything urgent they asked for, and do not interrupt work in progress for it. The first paragraphs are the harness author's own words, and the rest are facts computed on this machine. Read none of their history before they say yes.`
      : id === 'plans'
        ? `${step} The question: whether to index the plans and notes already written on their machine. Ask it after you have dealt with whatever they said.`
        : `${step} The question: whether Claude Code should keep their sessions longer. It has nothing to do with any earlier answer. Ask it after you have dealt with whatever they said.`;
  return `<calibration-question id="${id}">
${intro}
${LAST_IN_REPLY}
${ENVELOPE_RULE}
<offer-text>
${text}
</offer-text>
${answerHelp(id)}${chainNotice(id) ? `\n${chainNotice(id)}` : ''}
An answer is only recorded if these exact words were in your reply, so show them in full. ${id === 'calibrate' ? ASK_PLAINLY : ASK_PLAINLY_NEXT}
This is the only open question; any other question from the harness waits for a later turn. ${BARE_ANSWER_RULE} If a command fails, say so in one sentence and carry on; nothing about this session depends on it.
</calibration-question>`;
}

// The agent's previous reply: its text after the person's last message before
// the current one. null when the transcript cannot be read.
//
// Claude Code may or may not have written the current message to the transcript
// by the time this hook runs, so the current message is found by position, not
// by its words: a person message that no assistant text follows is the current
// one (the previous message always got a reply). Going by the words alone took
// the person's previous "yes" for the current "yes" and read the reply before
// the one that held the question. Background-task notices and similar entries
// are not the person speaking and do not split a reply.
function previousReply(transcriptPath) {
  if (!transcriptPath) return null;
  let raw;
  try {
    const st = fs.statSync(transcriptPath);
    const start = Math.max(0, st.size - 3 * 1024 * 1024);
    const fd = fs.openSync(transcriptPath, 'r');
    try { const b = Buffer.alloc(st.size - start); fs.readSync(fd, b, 0, b.length, start); raw = b.toString('utf8'); } finally { fs.closeSync(fd); }
    if (start > 0) raw = raw.slice(raw.indexOf('\n') + 1);
  } catch (_) { return null; }
  const { isRealUserMessage, textOf } = require('./transcript');
  const entries = [];
  for (const line of raw.split('\n')) { if (!line.trim()) continue; try { entries.push(JSON.parse(line)); } catch (_) { /* skip */ } }
  const isAgentText = (e) => !!(e && e.message && e.message.role === 'assistant' && !e.isSidechain && textOf(e.message.content).trim());
  const personIdx = [];
  entries.forEach((e, i) => { if (isRealUserMessage(e) && !NOT_THE_PERSON_RE.test(textOf(e.message.content))) personIdx.push(i); });
  const last = personIdx[personIdx.length - 1];
  const currentWritten = last !== undefined && !entries.slice(last + 1).some(isAgentText);
  let from; let to = entries.length;
  if (currentWritten) {
    to = last; from = personIdx.length > 1 ? personIdx[personIdx.length - 2] + 1 : 0;
  } else from = last !== undefined ? last + 1 : 0;
  const parts = [];
  for (const e of entries.slice(from, to)) {
    if (isAgentText(e)) parts.push(textOf(e.message.content));
  }
  return parts.join('\n');
}

function questionWasShown(reply, text) {
  if (reply === null) return null;
  const want = words(text);
  return want.length > 0 && containsWords(words(reply), want);
}

function closeOpen(st, reason) {
  const oq = st.openQuestion;
  if (!oq) return st;
  return writeState({ openQuestion: null, lastClosed: { id: oq.id, reason, at: core.nowIso(), atPrompt: Number(st.promptCount) || 0 } });
}

// SessionStart. Returns text for the agent, or ''.
function sessionStartContext(input) {
  const src = (input && input.source) || 'startup';
  const sid = String((input && input.sessionId) || '');
  let st = readState();
  const out = [];
  if (st.prime !== false && fs.existsSync(dirs().map)) out.push(primeText());
  if (src !== 'startup' && src !== 'clear') return out.filter(Boolean).join('\n');
  // A question left open in an earlier session is closed now (asked once).
  if (st.openQuestion && st.openQuestion.sessionId !== sid) st = closeOpen(st, 'unanswered');
  if (st.openQuestion) return out.filter(Boolean).join('\n');
  const p = pendingQuestions(st, { sessionId: sid });
  if (!p.ids.length) {
    if (!st.decision && !p.inv().sessions && !p.wd().total) writeState({ decision: 'nothing-to-calibrate-from', decidedAt: core.nowIso() });
    return out.filter(Boolean).join('\n');
  }
  const id = p.ids[0];
  out.push(openQuestion(id, p, { sessionId: sid, atNextPrompt: true, again: id === 'calibrate' && (st.offeredIn || []).length > 0 }));
  return out.filter(Boolean).join('\n');
}

// UserPromptSubmit. Keeps the one open question attributed, and hands over the
// next one only on a turn after the previous one was answered.
function promptContext(input) {
  // A background-task notice or similar is not the person speaking: it is no answer, and it must not
  // count as one of their messages (it would shift when a question is checked against the reply).
  if (NOT_THE_PERSON_RE.test(String((input && input.prompt) || ''))) return '';
  let st = readState();
  const recently = (x) => x && (Number(st.promptCount) || 0) - (Number(x.atPrompt) || 0) < UNANSWERED_AFTER;
  if (st.questionsDone && !recently(st.lastClosed)) return '';
  const count = (Number(st.promptCount) || 0) + 1;
  st = writeState({ promptCount: count });
  const oq = st.openQuestion;
  if (oq) {
    if (count - (Number(oq.shownAtPrompt) || 0) > UNANSWERED_AFTER) { closeOpen(st, 'unanswered'); return ''; }
    if (count - (Number(oq.shownAtPrompt) || 0) <= 0) return ''; // the turn it is being shown in
    // The hard guard: an answer can only be recorded for a question the person was actually shown,
    // word for word, in the agent's previous reply.
    if (!oq.shownConfirmed && count - (Number(oq.shownAtPrompt) || 0) === 1) {
      const shown = questionWasShown(previousReply(input && input.transcriptPath), oq.text || '');
      if (shown === null) {
        writeState({ openQuestion: { ...oq, unverifiable: true } });
        return `<calibration-open-question id="${oq.id}">
The harness could not read your previous reply, so it cannot tell whether the person saw its question. Record nothing for it: do not run alignment-harness calibration answer for this message.
</calibration-open-question>`;
      }
      if (!shown) {
        closeOpen(st, 'not-shown');
        if (oq.reoffered) return '';
        return openQuestion(oq.id, { inv: () => inventory(), wd: () => writtenDownSummary() }, { sessionId: String((input && input.sessionId) || ''), reoffer: true });
      }
      st = writeState({ openQuestion: { ...oq, shownConfirmed: core.nowIso() } });
    }
    if (st.openQuestion && st.openQuestion.unverifiable) return '';
    return `<calibration-open-question id="${oq.id}">
The one open question from the harness is the ${oq.id === 'calibrate' ? 'calibration offer' : oq.id === 'plans' ? 'question about indexing their plans and notes' : 'question about keeping their sessions longer'}. If this message answers it (a bare "yes" or "no" included), record it with alignment-harness calibration answer yes|no — it can only be an answer to that question. If it doesn't, ignore this.${chainNotice(oq.id) ? `\n${chainNotice(oq.id)}` : ''}
</calibration-open-question>`;
  }
  // A bare yes/no right after the harness's questions, with none open: never let it be guessed at.
  if (BARE_RE.test(String((input && input.prompt) || '')) && st.lastClosed && count - (Number(st.lastClosed.atPrompt) || 0) <= UNANSWERED_AFTER) {
    return `<calibration-no-open-question>
Their message is a bare "${String(input.prompt).trim()}", and no question from the harness is open: the last one (${st.lastClosed.id === 'calibrate' ? 'calibrating' : st.lastClosed.id === 'plans' ? 'indexing their plans and notes' : 'keeping their sessions longer'}) is already ${st.lastClosed.reason === 'answered' ? 'answered' : 'closed'}. Do not guess what it answers, and do not run any calibration command for it. Ask them plainly, in one short sentence, what they are saying ${/^(no|nope|nah|n|skip)\b/i.test(String(input.prompt).trim()) ? 'no' : 'yes'} to.
</calibration-no-open-question>`;
  }
  if (st.questionsDone) return '';
  const last = st.lastClosed;
  if (!last || last.reason !== 'answered' || count <= (Number(last.atPrompt) || 0)) return '';
  const p = pendingQuestions(st, { sessionId: String((input && input.sessionId) || '') });
  const ids = p.ids.filter((x) => x !== 'calibrate');
  if (!ids.length) { if (!p.ids.length) writeState({ questionsDone: core.nowIso() }); return ''; }
  return openQuestion(ids[0], p, { sessionId: String((input && input.sessionId) || '') });
}

// Records the person's answer against the open question, and only that one.
function answer(choice, opts) {
  const o = opts || {};
  const st = readState();
  const oq = st.openQuestion;
  const c = String(choice || '').toLowerCase() === 'skip' ? 'no' : String(choice || '').toLowerCase();
  if (!oq) return { ok: false, error: 'no question from the harness is open right now, so nothing was recorded' };
  if (!oq.shownConfirmed) return { ok: false, error: `the harness has not confirmed that the person saw the ${oq.id === 'calibrate' ? 'calibration offer' : oq.id === 'plans' ? 'plans-and-notes question' : 'keep-sessions question'} word for word in your previous reply, so their answer cannot be recorded for it` };
  const done = (patch, message) => {
    const now = writeState({ ...patch, openQuestion: null, lastClosed: { id: oq.id, reason: 'answered', answer: c, at: core.nowIso(), atPrompt: Number(st.promptCount) || 0 } });
    // Hand over the next question in this same reply, so there is never a reply without one
    // while questions remain (a bare "yes" in between would answer nothing).
    const p = pendingQuestions(now, { sessionId: oq.sessionId || '' });
    const nextId = p.ids.find((x) => x !== 'calibrate');
    if (!nextId) {
      writeState({ questionsDone: core.nowIso() });
      return { ok: true, question: oq.id, answer: c, message: `${message}\nThat closes this question, and it was the last one from the harness. As announced with the offer, a later bare "yes" or "no" with no question open is not recorded.` };
    }
    const next = openQuestion(nextId, p, { sessionId: oq.sessionId || '', asReport: true });
    return { ok: true, question: oq.id, answer: c, next: nextId, message: `${message}\nThat closes this question.\n${next}` };
  };
  if (oq.id === 'calibrate') {
    if (c === 'yes') return done({ decision: 'yes', decidedAt: core.nowIso() }, 'Recorded: yes to calibrating. The run, as announced with the offer, is alignment-harness calibration run --sessions <their number, default 200>, in the background.');
    if (c === 'no') return done({ decision: 'no', decidedAt: core.nowIso() }, 'Recorded: no to calibrating. It will not be offered again.');
    if (c === 'later') {
      // "Later" means not now: no further setup question this session; calibrating is offered once more next session.
      writeState({ decision: null, lastAnswer: 'later', openQuestion: null, lastClosed: { id: oq.id, reason: 'later', answer: c, at: core.nowIso(), atPrompt: Number(st.promptCount) || 0 } });
      return { ok: true, question: oq.id, answer: c, message: 'Recorded: later. No further setup question this session; calibrating is offered once more in a later session. As announced with the offer, a later bare "yes" or "no" with no question open is not recorded.' };
    }
    return { ok: false, error: 'for the calibration offer the answer is yes, no (or skip) or later; a sample request leaves it open' };
  }
  if (oq.id === 'plans') {
    if (c === 'yes') {
      const r = indexWrittenDown({});
      return done({ plansDecision: 'yes' }, `Recorded: yes. Indexed ${r.plans} plan${r.plans === 1 ? '' : 's'} and ${r.notes} memory note${r.notes === 1 ? '' : 's'} (${r.written} new or changed); the memory search finds them now.`);
    }
    if (c === 'no') return done({ plansDecision: 'no' }, 'Recorded: no. Their plans and notes were not indexed.');
    return { ok: false, error: 'for this question the answer is yes or no' };
  }
  if (c === 'yes') {
    const r = keepHistory(o.days);
    if (!r.ok) return { ok: false, error: r.error };
    return done({ keepDecision: 'yes' }, `Recorded: yes. Claude Code will now keep sessions for ${r.after} days (it was ${r.before === null ? 'the default, 30' : r.before}). Only that one setting changed in ${r.file}.${r.backup ? ` The previous file is saved at ${r.backup}.` : ''}`);
  }
  if (c === 'no') return done({ keepDecision: 'no' }, 'Recorded: no. Claude Code\'s session setting was left as it is.');
  return { ok: false, error: 'for this question the answer is yes or no' };
}

function status() {
  const st = readState();
  const notes = existingNoteIds().size;
  let plans = 0; try { plans = fs.readdirSync(dirs().plans).filter((f) => f.endsWith('.json')).length; } catch (_) { /* none */ }
  return { state: st, notes, plansIndexed: plans, mapExists: fs.existsSync(dirs().map), folder: dirs().base };
}

function forget() {
  const d = dirs();
  const removed = [];
  for (const p of [d.sessions, d.plans, d.map]) {
    if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); removed.push(p); }
  }
  writeState({ forgottenAt: core.nowIso(), calibratedAt: null, mapAt: null, plansIndexedAt: null });
  return removed;
}

module.exports = {
  dirs, readState, writeState, PRICES, listSessionFiles, inventory, readTurns, personText, scoreSession, pickSessions,
  extractSignal, estimate, quickEstimate, callModel, parseCliResult, parseJsonObject, validateNote, noteForSession,
  saveNote, runCalibration, buildMap, loadNotes, scrubMapQuotes, findWrittenDown, writtenDownSummary, indexWrittenDown,
  offerText, primeText, sessionStartContext, status, forget, money, moneyRange,
  describeNote, saveSample, addCost, retention, keepHistory, withCleanupPeriodDays, longerHistoryOffer, CLOSING_LINE, promptContext, answer, pendingQuestions, QUESTION_ORDER, LAST_IN_REPLY,
};

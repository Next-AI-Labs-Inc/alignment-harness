'use strict';
// Shared plumbing for every hook and the CLI: where things live, the switches
// file, per-session state, and the local telemetry log.
//
// Design rule for this whole plugin: fail open. If anything here throws, the
// caller lets the person's work through. Nothing in this file ever blocks.

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const PLUGIN_NAME = 'alignment-harness';

// ── Where state lives ───────────────────────────────────────────────────────
// Claude Code gives hooks CLAUDE_PLUGIN_DATA (~/.claude/plugins/data/<id>/).
// It survives plugin updates and is removed on uninstall. The CLI, run by the
// agent through Bash, does not get that variable, so it looks for the folder.
function configHome() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function findDataDir() {
  if (process.env.CLAUDE_PLUGIN_DATA) return process.env.CLAUDE_PLUGIN_DATA;
  if (process.env.ALIGNMENT_HARNESS_DATA) return process.env.ALIGNMENT_HARNESS_DATA;
  const base = path.join(configHome(), 'plugins', 'data');
  try {
    const hits = fs.readdirSync(base)
      .filter((d) => d.startsWith(PLUGIN_NAME))
      .map((d) => path.join(base, d));
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) {
      // Prefer the one written to most recently.
      hits.sort((a, b) => mtime(b) - mtime(a));
      return hits[0];
    }
  } catch (_) { /* fall through */ }
  // Not found (running from a checkout, or before the first session created
  // the plugin's folder): use a temp folder so nothing is left in ~/.claude.
  // DATA_BOUND below says so, because the hooks will NOT read this folder: a
  // setting changed here would be silently lost (lib/settings.js refuses).
  return path.join(os.tmpdir(), `${PLUGIN_NAME}-unbound`);
}
const UNBOUND_DIR = () => path.join(os.tmpdir(), `${PLUGIN_NAME}-unbound`);

function mtime(p) {
  try { return fs.statSync(p).mtimeMs; } catch (_) { return 0; }
}

const DATA_DIR = findDataDir();
// false = no Claude Code session has created the harness's own data folder yet (see findDataDir).
const DATA_BOUND = DATA_DIR !== UNBOUND_DIR();
const P = {
  data: DATA_DIR,
  switchesUser: path.join(DATA_DIR, 'switches.jsonc'),
  switchesDefault: path.join(PLUGIN_ROOT, 'config', 'switches.default.jsonc'),
  riskUser: path.join(DATA_DIR, 'risk-table.json'),
  riskDefault: path.join(PLUGIN_ROOT, 'config', 'risk-table.default.json'),
  sessions: path.join(DATA_DIR, 'state', 'sessions'),
  coherence: path.join(DATA_DIR, 'state', 'coherence'),
  blocks: path.join(DATA_DIR, 'state', 'blocks'),
  verbatim: path.join(DATA_DIR, 'verbatim'),
  telemetry: path.join(DATA_DIR, 'telemetry.jsonl'),
  setup: path.join(DATA_DIR, 'setup.json'),
  prompts: path.join(PLUGIN_ROOT, 'prompts'),
  userPrompts: path.join(DATA_DIR, 'prompts'),
};

function ensureDirs() {
  for (const d of [P.data, P.sessions, P.coherence, P.blocks, P.verbatim]) {
    try { fs.mkdirSync(d, { recursive: true }); } catch (_) { /* ignore */ }
  }
}

// ── JSON with // comments ───────────────────────────────────────────────────
function stripJsonComments(text) {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  // tolerate trailing commas
  return out.replace(/,(\s*[}\]])/g, '$1');
}

function readJsonc(file) {
  return JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')));
}

function deepMerge(base, over) {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over === undefined ? base : over;
  const out = Array.isArray(base) ? [...base] : { ...(base || {}) };
  for (const k of Object.keys(over)) {
    const b = out[k];
    const o = over[k];
    out[k] = (b && typeof b === 'object' && !Array.isArray(b) && o && typeof o === 'object' && !Array.isArray(o))
      ? deepMerge(b, o) : o;
  }
  return out;
}

// The same values as config/switches.default.jsonc, kept in code so a missing or damaged defaults file
// (for example a plugin folder with config/ deleted) never leaves a gate reading "undefined" and
// quietly not working. A smoke test checks this stays identical to the file; change both together.
const BUILT_IN_SWITCHES = {
  "coherenceGate": {
    "enabled": true,
    "strength": "block",
    "maxBlocksPerMessage": 3,
    "variant": "control",
    "forceOnMidExecutionEvents": false,
    "injectFullRitualText": false,
    "requireRitualReadOncePerSession": true,
    "requirePrintedCheck": true,
    "requireScopeReflection": true,
    "highestLeverageWait": true,
    "blockRoundMs": 2000
  },
  "governer": {
    "enabled": true,
    "gateStrength": "block",
    "maxBlocksPerSession": 3,
    "criticalMassFloor": 80,
    "writeProvisionalBaseline": true,
    "injectScoreBanner": true,
    "applyToSubagents": true,
    "predictRequiredSkills": {
      "enabled": true,
      "oracleCommand": ""
    }
  },
  "evidenceGate": {
    "enabled": true,
    "strength": "block",
    "applyToSubagents": true,
    "editsNeedProofAtScore": 20,
    "contractsAtScore": 60,
    "maxBlocksPerSession": 6,
    "claimSensitivity": "strict"
  },
  "understanding": {
    "markHumanMessage": true,
    "calibrateOnConfusion": true,
    "injectAlignmentQuestions": true,
    "injectTaskTracking": true,
    "injectVerificationContract": true,
    "captureMessagesVerbatim": true,
    "rehydrateAfterCompaction": true,
    "memorySearchCommand": ""
  },
  "scope": {
    "showOnEveryMessage": true,
    "certaintyGate": 90
  },
  "subagents": {
    "injectAlignmentAtStart": true
  },
  "turnEnd": {
    "enabled": true,
    "strength": "remind",
    "scoreAbove": 40,
    "requirementCapture": true
  },
  "correctionPatterns": {
    "enabled": true,
    "activateAtEvidence": 3,
    "maxPerTurn": 3
  },
  "intentSearchGate": {
    "strength": "block-once"
  },
  "sessionEnd": {
    "autoCompaction": true,
    "collectCorrectionCandidates": true,
    "cleanUp": true
  },
  "calibration": {
    "offerLongerHistory": true,
    "longerHistoryDays": 365
  },
  "telemetry": {
    "enabled": true
  },
  "permissions": {
    "allowHarnessCommands": true
  }
};

// Returns { switches, problems[], usingBuiltInDefaults }. Never throws.
function loadSwitches() {
  const problems = [];
  let defaults = {};
  let usingBuiltInDefaults = false;
  try { defaults = readJsonc(P.switchesDefault); } catch (e) {
    defaults = JSON.parse(JSON.stringify(BUILT_IN_SWITCHES));
    usingBuiltInDefaults = true;
    problems.push(`the harness's own default switches file is missing or unreadable (${e.code || e.message}), so the built-in defaults are in use: ${P.switchesDefault}`);
  }
  let user = {};
  if (fs.existsSync(P.switchesUser)) {
    try { user = readJsonc(P.switchesUser); } catch (e) {
      problems.push(`your switches file could not be read (${e.message}); using defaults until it is fixed: ${P.switchesUser}`);
    }
  }
  return { switches: deepMerge(defaults, user), problems, usingBuiltInDefaults };
}

// Copy the commented default into the data folder the first time, so the
// person has one file to edit. Never overwrites their copy.
function seedUserFiles() {
  ensureDirs();
  try {
    if (!fs.existsSync(P.switchesUser)) fs.copyFileSync(P.switchesDefault, P.switchesUser);
  } catch (_) { /* ignore */ }
}

function loadRiskTable() {
  try {
    if (fs.existsSync(P.riskUser)) {
      const t = JSON.parse(fs.readFileSync(P.riskUser, 'utf8'));
      return { table: t, source: 'yours', calibrated: t.confirmed === true };
    }
  } catch (_) { /* fall back */ }
  try {
    const t = JSON.parse(fs.readFileSync(P.riskDefault, 'utf8'));
    return { table: t, source: 'default', calibrated: false };
  } catch (_) {
    return { table: { categories: {}, impactTierFloors: {} }, source: 'missing', calibrated: false };
  }
}

// ── Small helpers ───────────────────────────────────────────────────────────
function nowIso() { return new Date().toISOString(); }

function safeId(id) {
  return String(id || 'unknown-session').replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 120);
}

function writeJsonAtomic(file, obj) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}

function log(event, fields) {
  try {
    const { switches } = loadSwitchesCached();
    if (switches.telemetry && switches.telemetry.enabled === false) return;
    fs.mkdirSync(P.data, { recursive: true });
    fs.appendFileSync(P.telemetry, `${JSON.stringify({ ts: nowIso(), event, ...(fields || {}) })}\n`);
  } catch (_) { /* never matters */ }
}

let _cache = null;
function loadSwitchesCached() {
  if (!_cache) _cache = loadSwitches();
  return _cache;
}

// ── Per-session governer state ─────────────────────────────────────────────
function sessionFile(sessionId) { return path.join(P.sessions, `${safeId(sessionId)}.json`); }

function readSession(sessionId) {
  return readJson(sessionFile(sessionId), null);
}

function updateSession(sessionId, mutator) {
  const file = sessionFile(sessionId);
  const cur = readJson(file, null) || { sessionId: String(sessionId), createdAt: nowIso() };
  const next = mutator(cur) || cur;
  next.updatedAt = nowIso();
  writeJsonAtomic(file, next);
  return next;
}

// The one question every gate asks: is there a real score from the agent?
// Returns { scored, score, scoredBy, calibrated, state }.
function currentScore(sessionId) {
  const s = readSession(sessionId);
  if (!s) return { scored: false, score: null, scoredBy: 'unscored', calibrated: false, state: null };
  const g = s.governer || {};
  if (g.scoredBy === 'agent' && typeof g.overallGovernerScore === 'number') {
    return { scored: true, score: g.overallGovernerScore, scoredBy: 'agent', calibrated: !!g.calibrated, state: s };
  }
  return { scored: false, score: null, scoredBy: g.scoredBy || 'unscored', calibrated: false, state: s };
}

// ── Block counters (the "never trap the person" downgrade) ─────────────────
function blockFile(sessionId) { return path.join(P.blocks, `${safeId(sessionId)}.json`); }
function getBlocks(sessionId, key) {
  const b = readJson(blockFile(sessionId), {});
  return Number(b[key] || 0);
}
function bumpBlocks(sessionId, key) {
  try {
    const f = blockFile(sessionId);
    const b = readJson(f, {});
    b[key] = Number(b[key] || 0) + 1;
    writeJsonAtomic(f, b);
    return b[key];
  } catch (_) { return 0; }
}
// Like bumpBlocks, but calls that arrive within `windowMs` of the first block of a round count as that
// same round. An agent that fires several tool calls in one reply (they reach the hook within milliseconds)
// has been blocked once, not several times; without this, one parallel batch used up the whole allowance and
// the gate stepped back before the agent had a second chance to respond to it. windowMs 0 = every call counts.
// A round lasts at most windowMs, so rapid repetition still steps back (it never traps).
function bumpBlockRound(sessionId, key, windowMs) {
  try {
    const f = blockFile(sessionId);
    const b = readJson(f, {});
    const now = Date.now();
    const cur = Number(b[key] || 0);
    const win = Number.isFinite(Number(windowMs)) ? Number(windowMs) : 2000;
    if (win > 0 && cur > 0 && now - Number(b[`${key}RoundAt`] || 0) < win) return cur;
    b[key] = cur + 1;
    b[`${key}RoundAt`] = now;
    writeJsonAtomic(f, b);
    return b[key];
  } catch (_) { return 0; }
}
function resetBlocks(sessionId, key) {
  try {
    const f = blockFile(sessionId);
    const b = readJson(f, {});
    if (b[key]) { b[key] = 0; writeJsonAtomic(f, b); }
  } catch (_) { /* ignore */ }
}

// Can this process save state? If not (read-only disk, full disk, permissions),
// every gate must let the person through: a gate whose block counter or score
// can't be saved would otherwise block forever.
let _canPersist = null;
function canPersist() {
  if (_canPersist !== null) return _canPersist;
  try {
    fs.mkdirSync(P.blocks, { recursive: true });
    const probe = path.join(P.blocks, `.probe-${process.pid}`);
    fs.writeFileSync(probe, '1');
    fs.unlinkSync(probe);
    fs.mkdirSync(P.sessions, { recursive: true });
    fs.accessSync(P.sessions, fs.constants.W_OK);
    _canPersist = true;
  } catch (_) { _canPersist = false; }
  return _canPersist;
}

// How the agent should invoke the CLI (bin/ is on PATH in current Claude Code;
// the absolute path is the fallback).
function cliCommand() {
  return `node "${path.join(PLUGIN_ROOT, 'bin', 'alignment-harness')}"`;
}

// Prompt texts ship in prompts/. A file of the same name in the data folder's
// prompts/ directory replaces the shipped one, so wording can be tuned without
// editing the plugin.
function loadPrompt(name, vars) {
  let text = '';
  for (const dir of [P.userPrompts, P.prompts]) {
    try { text = fs.readFileSync(path.join(dir, name), 'utf8'); break; } catch (_) { /* next */ }
  }
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{{${k}}}`).join(String(v));
  return keepSwitchedParts(text);
}

// A prompt can tie a part of its text to a switch: {{#if understanding.injectTaskTracking}}…{{/if}}.
// The part is left out only when that switch is explicitly false; if the switches can't be read,
// or the name isn't a setting, the part stays (fail open, so the default text is always sent).
// A copy of a prompt without these markers behaves exactly as before.
function keepSwitchedParts(text) {
  if (!text.includes('{{#if ')) return text;
  let switches = null;
  try { switches = loadSwitches().switches; } catch (_) { switches = null; }
  const valueOf = (dotted) => dotted.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), switches);
  return text.replace(/\{\{#if ([A-Za-z][A-Za-z.]*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, name, body) => (switches && valueOf(name) === false ? '' : body));
}

// ── The end-of-turn hand-back reminder ─────────────────────────────────────
// Saved when a turn ends without the hand-back, taken (and deleted) the next time the user speaks, so the
// reminder reaches the agent at the start of its next turn instead of holding the user up at the end of this one.
function turnEndReminderFile(sessionId) { return path.join(P.coherence, `turn-end-reminder-${safeId(sessionId)}.txt`); }
function saveTurnEndReminder(sessionId, text) {
  try { fs.mkdirSync(P.coherence, { recursive: true }); fs.writeFileSync(turnEndReminderFile(sessionId), String(text)); return true; } catch (_) { return false; }
}
function takeTurnEndReminder(sessionId) {
  const f = turnEndReminderFile(sessionId);
  let text = '';
  try { text = fs.readFileSync(f, 'utf8'); } catch (_) { return ''; }
  try { fs.unlinkSync(f); } catch (_) { /* ignore */ }
  return text.trim();
}

// ── Proof-check changes the user has been told about ─────────────────────────
function markContractChangesTold(sessionId) {
  try {
    updateSession(sessionId, (s) => {
      for (const c of ((s.verificationContract && s.verificationContract.changes) || [])) c.toldUser = true;
      return s;
    });
  } catch (_) { /* a lost mark only means one more reminder */ }
}

// ── The top-band wait (governer score at or above 80) ────────────────────────
// After the agent prints HIGHEST_LEVERAGE_ACK it waits for the user's go: changing tools are held until the
// user speaks again. The user's next message deletes the file (hooks/user-prompt.js), so the wait never outlives it.
function highLeverageWaitFile(sessionId) { return path.join(P.coherence, `highest-leverage-wait-${safeId(sessionId)}`); }

module.exports = {
  loadPrompt,
  saveTurnEndReminder, takeTurnEndReminder, markContractChangesTold, highLeverageWaitFile,
  PLUGIN_ROOT, PLUGIN_NAME, P, DATA_BOUND, ensureDirs, seedUserFiles,
  stripJsonComments, readJsonc, deepMerge, BUILT_IN_SWITCHES, loadSwitches, loadSwitchesCached, loadRiskTable,
  nowIso, safeId, writeJsonAtomic, readJson, log,
  sessionFile, readSession, updateSession, currentScore,
  getBlocks, bumpBlocks, bumpBlockRound, resetBlocks, canPersist, cliCommand, configHome,
};

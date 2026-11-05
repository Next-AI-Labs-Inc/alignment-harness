'use strict';
// Helpers every hook uses. The contract with Claude Code:
//   exit 0 + stdout  → for SessionStart / UserPromptSubmit, stdout is added to
//                      the agent's context.
//   exit 2 + stderr  → for PreToolUse / Stop, blocks and shows stderr to the agent.
// Every hook wraps its body in run(): any exception → exit 0 (fail open).

const fs = require('fs');
const core = require('../lib/core');

// Synchronous writes: on macOS, process.stdout to a pipe is asynchronous and
// can be cut off by process.exit(). writeSync never is.
function writeFd(fd, text) {
  const buf = Buffer.from(String(text), 'utf8');
  let off = 0;
  let spins = 0;
  while (off < buf.length) {
    try { off += fs.writeSync(fd, buf, off, buf.length - off); } catch (e) {
      if (e.code === 'EAGAIN' && spins++ < 10000) continue;
      throw e;
    }
  }
}
function out(text) { writeFd(1, text); }
function err(text) { writeFd(2, text); }

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function sessionIdOf(input) {
  return String(input.session_id || process.env.CLAUDE_CODE_SESSION_ID || 'unknown-session');
}

// A subagent's hook payload carries its own transcript (a sidechain file) while
// session_id stays the parent's. Different → this call is from a subagent.
function isSubagent(input) {
  if (process.env.CLAUDE_IS_SUBAGENT === '1' || process.env.AGENT_ROLE === 'subagent') return true;
  const tp = input.transcript_path;
  const sid = input.session_id;
  if (!tp || !sid) return false;
  const base = String(tp).split(/[\\/]/).pop().replace(/\.jsonl$/, ''); // Windows paths use \
  return base !== String(sid);
}

// A usable session id is required before any gate may block. Without one the
// hooks can't tell sessions apart, so they let everything through.
function hasSessionId(input) {
  return typeof input.session_id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{7,}$/.test(input.session_id);
}

// Keep context output inline: Claude Code swaps large hook output for a short
// preview plus a file path. Anything over the cap is saved to a file in the
// data folder and the agent is told where it is.
// Same as contextOut, but also shows `message` to the person on screen (Claude Code displays a
// hook's systemMessage to the user; plain hook output only reaches the model). Used for the
// first-run welcome, so someone who just installed the harness can see what to do.
function contextOutWithMessage(text, name, message, eventName) {
  let captured = '';
  contextOut(text, name, (piece) => { captured += piece; });
  out(JSON.stringify({ systemMessage: message, hookSpecificOutput: { hookEventName: eventName, additionalContext: captured } }));
}

function contextOut(text, name, write = out) {
  const cap = 6000;
  let t = String(text);
  if (t.length > cap) {
    let where = '';
    try {
      const dir = require('path').join(core.P.data, 'context');
      fs.mkdirSync(dir, { recursive: true });
      where = require('path').join(dir, `${name || 'context'}-${Date.now()}.txt`);
      fs.writeFileSync(where, t);
    } catch (_) { where = ''; }
    // Cut at a line end, so the agent is never shown half of one of the author's sentences.
    const kept = t.slice(0, cap - 300);
    const lineEnd = kept.lastIndexOf('\n');
    t = `${lineEnd > cap - 2300 ? kept.slice(0, lineEnd) : kept}\n… [shortened to stay visible; ${where ? `the full text is in ${where} — Read it if you need the rest` : 'the rest could not be saved'}]\n`;
  }
  write(t);
}

function block(message) {
  err(`${message.trim()}\n`);
  process.exit(2);
}

// Non-blocking note to the agent before a tool runs. Deliberately never sets
// permissionDecision, so the person's own permission rules stay in charge.
function preToolNote(text) {
  out(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: text },
  }));
  process.exit(0);
}

function userNote(text) {
  out(JSON.stringify({ systemMessage: text }));
  process.exit(0);
}

function run(name, fn) {
  try {
    const input = readInput();
    fn(input);
    process.exit(0);
  } catch (e) {
    try { core.log('HookError', { hook: name, error: String(e && e.message || e) }); } catch (_) { /* ignore */ }
    process.exit(0);
  }
}

function writeLastSession(input) {
  try {
    core.writeJsonAtomic(require('path').join(core.P.data, 'state', 'last-session.json'), {
      sessionId: sessionIdOf(input), cwd: input.cwd || process.cwd(), at: core.nowIso(),
    });
  } catch (_) { /* ignore */ }
}

module.exports = { contextOut, contextOutWithMessage, hasSessionId, out, err, readInput, sessionIdOf, isSubagent, block, preToolNote, userNote, run, writeLastSession };

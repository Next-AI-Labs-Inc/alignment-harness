#!/usr/bin/env node
/**
 * track.js — the small, real tracker this skill used to only describe in prose.
 *
 * Stops a multi-item sweep (an audit, a triage, an alignment check) from being
 * redone from item one by a later agent or session. One JSON log file per work
 * type, in the folder `alignment-harness records track` prints. No database,
 * no server, no auth — this is deliberately the local default; if you later
 * connect your own admin API (see /alignment-harness:harness-setup), point
 * the same three operations at it instead and keep everything else the same.
 *
 * Usage:
 *   node track.js log <work-type> <item-id> <pass|fail|needs-fix> [--notes "..."] [--leverage N] [--session <id>]
 *   node track.js next <work-type> --items <path-to-json-array-of-{id,leverage}>
 *   node track.js status <work-type>
 *
 * "next" picks the highest-priority item to look at right now: never-audited
 * items first, then previously-audited items sorted by leverage x how long
 * it's been since they were last checked (so a high-leverage item that hasn't
 * been looked at in a while resurfaces before a low-leverage one that was
 * just checked).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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

function storeDir() {
  try {
    const out = execFileSync(harnessCommand().file, [...harnessCommand().pre, 'records', 'track'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (_) { /* CLI not on PATH — fall through to a local default */ }
  const dir = path.join(process.cwd(), '.alignment-harness', 'track');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function logFile(workType) {
  const safe = String(workType).replace(/[^A-Za-z0-9._-]/g, '_');
  return path.join(storeDir(), `${safe}.json`);
}

function loadLog(workType) {
  try { return JSON.parse(fs.readFileSync(logFile(workType), 'utf8')); } catch (_) { return []; }
}

function saveLog(workType, entries) {
  fs.mkdirSync(storeDir(), { recursive: true });
  fs.writeFileSync(logFile(workType), JSON.stringify(entries, null, 2));
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return out;
}

function cmdLog(args) {
  const [workType, itemId, outcome] = args;
  if (!workType || !itemId || !outcome) {
    console.log('usage: node track.js log <work-type> <item-id> <pass|fail|needs-fix> [--notes "..."] [--leverage N] [--session <id>]');
    process.exit(1);
  }
  const flags = parseFlags(args.slice(3));
  const entries = loadLog(workType);
  entries.push({
    itemId,
    outcome,
    notes: flags.notes || '',
    leverage: flags.leverage !== undefined ? Number(flags.leverage) : null,
    agentSessionId: flags.session || process.env.CLAUDE_CODE_SESSION_ID || null,
    timestamp: new Date().toISOString(),
  });
  saveLog(workType, entries);
  console.log(`Logged ${outcome} for "${itemId}" (${workType}) → ${logFile(workType)}`);
}

function lastAuditFor(entries, itemId) {
  const matches = entries.filter((e) => e.itemId === itemId);
  if (!matches.length) return null;
  return matches.reduce((a, b) => (new Date(a.timestamp) > new Date(b.timestamp) ? a : b));
}

function cmdNext(args) {
  const [workType] = args;
  const flags = parseFlags(args.slice(1));
  if (!workType || !flags.items) {
    console.log('usage: node track.js next <work-type> --items <path-to-json-array-of-{id,leverage}>');
    process.exit(1);
  }
  const candidates = JSON.parse(fs.readFileSync(flags.items, 'utf8'));
  const entries = loadLog(workType);
  const now = Date.now();

  const scored = candidates.map((c) => {
    const last = lastAuditFor(entries, c.id);
    const leverage = c.leverage !== undefined ? c.leverage : 50;
    if (!last) return { ...c, score: Number.MAX_SAFE_INTEGER, scoreLabel: 'never-audited (top priority)', lastAudit: null, lastOutcome: null };
    const daysSince = Math.max(1, (now - new Date(last.timestamp).getTime()) / 86400000);
    const score = leverage * daysSince;
    return { ...c, score, scoreLabel: `leverage ${leverage} × ${daysSince.toFixed(1)} days since last check`, lastAudit: last.timestamp, lastOutcome: last.outcome };
  });

  scored.sort((a, b) => b.score - a.score);
  const { score, ...top } = scored[0] || {};
  console.log(JSON.stringify(top, null, 2));
}

function cmdStatus(args) {
  const [workType] = args;
  if (!workType) { console.log('usage: node track.js status <work-type>'); process.exit(1); }
  const entries = loadLog(workType);
  const byItem = new Map();
  for (const e of entries) byItem.set(e.itemId, e); // last write wins per item, entries are appended in order
  const outcomes = {};
  for (const e of byItem.values()) outcomes[e.outcome] = (outcomes[e.outcome] || 0) + 1;
  console.log(`${workType}: ${byItem.size} distinct item(s) logged, ${entries.length} total log entries`);
  console.log(`By latest outcome: ${JSON.stringify(outcomes)}`);
  console.log(`Log file: ${logFile(workType)}`);
}

const [, , cmd, ...rest] = process.argv;
if (cmd === 'log') cmdLog(rest);
else if (cmd === 'next') cmdNext(rest);
else if (cmd === 'status') cmdStatus(rest);
else {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 24).map((l) => l.replace(/^\/\/ ?| \*\/?/, '')).join('\n'));
}

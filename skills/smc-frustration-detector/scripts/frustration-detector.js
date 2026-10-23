#!/usr/bin/env node
'use strict';
// frustration-detector.js — a reference implementation of the pattern this
// skill describes. It is NOT wired into any hook automatically by installing
// this skill; wire it into your own project's UserPromptSubmit hook (see
// SKILL.md) if you want it running on every message.
//
// Modes:
//   node frustration-detector.js check                 read a prompt from stdin as
//                                                       Claude Code's hook JSON
//                                                       ({"prompt": "...", "session_id": "..."}),
//                                                       update per-session state, print an
//                                                       alert line if this message pushes the
//                                                       session over threshold (fires once per session).
//   node frustration-detector.js calibrate [--project-dir <dir>]
//                                                       scan the person's own past sessions for
//                                                       this project and print a suggested
//                                                       baseline — does not write anything.
//   node frustration-detector.js set-baseline <rate>    write a confirmed baseline to config.
//   node frustration-detector.js show-config            print the current config.
//
// Never crashes the hook it's wired into: every mode fails open (prints
// nothing, exits 0) rather than blocking a message on a detector error.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// Default frustration markers — a starting point, not exhaustive. Not
// everyone shows frustration the same way; edit this list (or the config
// file it reads from) to match how you actually write when annoyed.
const DEFAULT_MARKERS = [
  /\bf+u+c+k+\w*/i,
  /\bshit\w*/i,
  /\bdamn\w*/i,
  /\bugh+\b/i,
  /\bagain\??!*\s*$/i,
  /\bi (already|just) (said|told you)\b/i,
  /\bthat'?s not (it|what i (said|meant))\b/i,
  /\bno[,.]? (that'?s|thats) wrong\b/i,
];

function configDir() {
  try {
    const out = execFileSync('alignment-harness', ['records', 'frustration-detector'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* fall through */ }
  const dir = path.join(process.cwd(), '.alignment-harness', 'records', 'frustration-detector');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadConfig() {
  const file = path.join(configDir(), 'config.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function saveConfig(cfg) {
  const file = path.join(configDir(), 'config.json');
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
  return file;
}

function countMarkers(text, markers) {
  let count = 0;
  for (const re of markers) if (re.test(text)) count += 1;
  return count;
}

function sessionStateFile(sessionId) {
  return path.join(os.tmpdir(), `frustration-detector-${sessionId}.json`);
}

function loadState(sessionId) {
  try { return JSON.parse(fs.readFileSync(sessionStateFile(sessionId), 'utf8')); }
  catch { return { session_id: sessionId, message_count: 0, marker_count: 0, spike_fired: false }; }
}

function saveState(sessionId, state) {
  try { fs.writeFileSync(sessionStateFile(sessionId), JSON.stringify(state)); } catch { /* non-fatal */ }
}

function logEvent(event) {
  try {
    const file = path.join(configDir(), 'events.jsonl');
    fs.appendFileSync(file, `${JSON.stringify(event)}\n`, 'utf8');
  } catch { /* fail open — never block the hook over a logging failure */ }
}

function cmdCheck() {
  let input = '';
  try { input = fs.readFileSync(0, 'utf8'); } catch { return; }
  let payload;
  try { payload = JSON.parse(input); } catch { return; }
  const prompt = payload.prompt || payload.text || '';
  const sessionId = payload.session_id || process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID || 'unknown-session';
  if (!prompt) return;

  const cfg = loadConfig();
  const markers = DEFAULT_MARKERS; // future: load a custom list from cfg.markers if provided
  const hits = countMarkers(prompt, markers);

  const state = loadState(sessionId);
  state.message_count += 1;
  state.marker_count += hits;
  saveState(sessionId, state);

  if (!cfg || !cfg.baseline) {
    // Uncalibrated: observe only, never fire a spike, say so once per session.
    if (state.message_count === 1) {
      console.error('[frustration-detector] uncalibrated — observing only. Run `frustration-detector.js calibrate` to set a real baseline.');
    }
    return;
  }

  if (state.spike_fired) return; // fire once per session

  const rate = state.marker_count / state.message_count;
  const threshold = cfg.baseline * (cfg.thresholdMultiplier || 1.5);
  const minSignal = cfg.minSignal || 5;

  if (rate > threshold && state.marker_count >= minSignal) {
    state.spike_fired = true;
    saveState(sessionId, state);
    const event = {
      type: 'FrustrationSpikeDetected',
      session_id: sessionId,
      marker_count: state.marker_count,
      marker_per_msg: Number(rate.toFixed(4)),
      baseline: cfg.baseline,
      pct_above_baseline: Math.round(((rate - cfg.baseline) / cfg.baseline) * 100),
      timestamp: new Date().toISOString(),
    };
    logEvent(event);
    console.error(`[frustration-detector] spike detected: ${JSON.stringify(event)}`);
  }
}

function cmdCalibrate(args) {
  const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
  const projectDir = opt('project-dir', process.cwd());
  const configHome = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const slug = projectDir.replace(/[^A-Za-z0-9]/g, '-');
  const sessionsDir = path.join(configHome, 'projects', slug);

  let files = [];
  try { files = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.jsonl')); } catch { /* none */ }
  if (!files.length) {
    console.log(`No past session history found at ${sessionsDir}. Nothing to calibrate from yet — this becomes possible once you have some real sessions on this project.`);
    return;
  }

  let messageCount = 0;
  let markerCount = 0;
  for (const f of files) {
    let lines = [];
    try { lines = fs.readFileSync(path.join(sessionsDir, f), 'utf8').split('\n').filter(Boolean); } catch { continue; }
    for (const line of lines) {
      let obj;
      try { obj = JSON.parse(line); } catch { continue; }
      const text = obj && obj.message && typeof obj.message.content === 'string' ? obj.message.content
        : (obj && obj.type === 'user' && obj.message && Array.isArray(obj.message.content)
          ? obj.message.content.map((c) => c.text || '').join(' ') : '');
      if (!text || (obj.type && obj.type !== 'user')) continue;
      messageCount += 1;
      markerCount += countMarkers(text, DEFAULT_MARKERS);
    }
  }

  if (!messageCount) {
    console.log('Found session files but no readable user messages in them. Nothing to calibrate from.');
    return;
  }

  const suggested = Number((markerCount / messageCount).toFixed(4));
  console.log(`Scanned ${messageCount} of your own past messages across ${files.length} session file(s).`);
  console.log(`Suggested baseline: ${suggested} frustration markers per message.`);
  console.log(`To confirm: node frustration-detector.js set-baseline ${suggested}`);
}

function cmdSetBaseline(args) {
  const rate = Number(args[0]);
  if (!Number.isFinite(rate) || rate < 0) {
    console.error('Usage: set-baseline <rate>  (a number, e.g. 0.02)');
    process.exit(1);
  }
  const cfg = loadConfig() || {};
  cfg.baseline = rate;
  cfg.thresholdMultiplier = cfg.thresholdMultiplier || 1.5;
  cfg.minSignal = cfg.minSignal || 5;
  cfg.calibratedAt = new Date().toISOString();
  const file = saveConfig(cfg);
  console.log(`Baseline set to ${rate} in ${file}`);
}

function cmdShowConfig() {
  const cfg = loadConfig();
  if (!cfg) {
    console.log('No config yet — uncalibrated. Run `calibrate` then `set-baseline <rate>`.');
    return;
  }
  console.log(JSON.stringify(cfg, null, 2));
}

const [mode, ...rest] = process.argv.slice(2);
try {
  if (mode === 'check') cmdCheck();
  else if (mode === 'calibrate') cmdCalibrate(rest);
  else if (mode === 'set-baseline') cmdSetBaseline(rest);
  else if (mode === 'show-config') cmdShowConfig();
  else {
    console.log('Usage: frustration-detector.js <check|calibrate|set-baseline|show-config>');
  }
} catch (err) {
  // Fail open — a detector error must never block the hook it's wired into.
  console.error(`[frustration-detector] error (ignored, failing open): ${err.message || err}`);
}

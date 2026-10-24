#!/usr/bin/env node
'use strict';
// extract-pairs.js — build a local, lightweight index of "what an agent said
// -> how you actually replied" from YOUR OWN past Claude Code sessions on
// THIS project. Nothing leaves your machine; nothing is sent anywhere.
//
// This is the safe-extraction step behind the reaction predictor: it walks
// ~/.claude/projects/<this-project>/*.jsonl, pairs each assistant turn with
// the person's own next reply, drops anything that's hook-injected context
// rather than something the person actually typed, and redacts anything
// that looks like a secret before it's ever written to disk.
//
// Usage: node extract-pairs.js [--project-dir <dir>] [--max-files 200]

const fs = require('fs');
const os = require('os');
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

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const projectDir = opt('project-dir', process.cwd());
const maxFiles = Number(opt('max-files', 200));

const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{16,}/g,
  /\bsk-(proj-)?[A-Za-z0-9]{24,}/g,
  /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

function redact(text) {
  let out = text;
  let redactedCount = 0;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, () => { redactedCount += 1; return '[redacted]'; });
  }
  return { text: out, redactedCount };
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n');
  }
  return '';
}

function isRealHumanText(text) {
  if (!text || !text.trim()) return false;
  // These markers mean the "user" turn is hook-injected context or a tool
  // result, not something the person actually typed — never treat this as
  // their reaction.
  if (/<hook-injected-context|<system-reminder|<command-name>|^\[Tool /.test(text)) return false;
  return true;
}

const configHome = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const slug = projectDir.replace(/[^A-Za-z0-9]/g, '-');
const sessionsDir = path.join(configHome, 'projects', slug);

let files = [];
try {
  files = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.jsonl'))
    .map((f) => path.join(sessionsDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    .slice(0, maxFiles);
} catch { /* no history */ }

if (!files.length) {
  console.log(`No session history found at ${sessionsDir}. Nothing to build yet — this becomes useful once you have real sessions on this project.`);
  process.exit(0);
}

const pairs = [];
let totalRedactions = 0;

for (const f of files) {
  let lines;
  try { lines = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean); } catch { continue; }
  let pendingAgentText = null;
  const sessionId = path.basename(f, '.jsonl').slice(0, 8);
  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const m = entry.message;
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = extractText(m.content);
    if (m.role === 'assistant') {
      if (text && text.trim()) pendingAgentText = text.trim().slice(0, 600);
      continue;
    }
    // m.role === 'user'
    if (!isRealHumanText(text)) continue; // hook context or tool result, not the person
    if (pendingAgentText) {
      const agent = redact(pendingAgentText);
      const reply = redact(text.trim().slice(0, 400));
      totalRedactions += agent.redactedCount + reply.redactedCount;
      pairs.push({
        session: sessionId,
        timestamp: entry.timestamp || null,
        agentMessage: agent.text,
        personReply: reply.text,
      });
      pendingAgentText = null;
    }
  }
}

function outDir() {
  try {
    const out = execFileSync(harnessCommand().file, [...harnessCommand().pre, 'records', 'reaction-predictor'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* fall through */ }
  const dir = path.join(process.cwd(), '.alignment-harness', 'records', 'reaction-predictor');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const dir = outDir();
const outFile = path.join(dir, 'pairs.jsonl');
fs.writeFileSync(outFile, pairs.map((p) => JSON.stringify(p)).join('\n') + (pairs.length ? '\n' : ''));

console.log(`Indexed ${pairs.length} pairs from ${files.length} session file(s) into ${outFile}.`);
if (totalRedactions) console.log(`Redacted ${totalRedactions} secret-looking value(s) before writing.`);
if (pairs.length < 50) {
  console.log('This is a thin index — predictions will say so and lean on "no close precedent" rather than guessing from too little history.');
}

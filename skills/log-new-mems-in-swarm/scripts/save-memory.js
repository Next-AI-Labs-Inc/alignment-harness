#!/usr/bin/env node
'use strict';
// save-memory.js — local, dependency-free institutional-memory writer.
//
// This is the working-out-of-the-box fallback for this skill. If you have
// your own institutional-memory service with its own search index, use
// that instead — the shape of a good memory (below) is the same either
// way, only the storage differs.
//
// Writes one JSON line per memory to the folder `alignment-harness records
// memory` prints, one file per repo/project: <that folder>/<repo>.jsonl.
// Never prompts, never blocks on stdin — safe to run from an agent with
// nobody at the keyboard, even for a long --lesson.
//
// Usage:
//   node save-memory.js --repo NAME --type TYPE --context "When ..." \
//     --lesson "..." --tags "a,b,c" --confidence N

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

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const required = ['repo', 'type', 'context', 'lesson'];
const missing = required.filter((k) => !args[k] || args[k] === true);
if (missing.length) {
  console.error(`Missing required fields: ${missing.join(', ')}`);
  console.error('Usage: node save-memory.js --repo NAME --type TYPE --context "When ..." --lesson "..." [--tags "a,b,c"] [--confidence N]');
  process.exit(1);
}

function resolveMemoryDir() {
  // Prefer the harness CLI so this respects wherever the person's plugin data
  // actually lives; fall back to a local .alignment-harness folder if the
  // CLI isn't on PATH for some reason (e.g. running this script standalone).
  try {
    const out = execFileSync(harnessCommand().file, [...harnessCommand().pre, 'records', 'memory'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* fall through */ }
  const dir = path.join(process.cwd(), '.alignment-harness', 'records', 'memory');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const dir = resolveMemoryDir();
const repoSlug = String(args.repo).replace(/[^A-Za-z0-9_.-]/g, '-');
const file = path.join(dir, `${repoSlug}.jsonl`);

const entry = {
  timestamp: new Date().toISOString(),
  repo: args.repo,
  event_type: args.type,
  context: args.context,
  lesson: args.lesson,
  tags: args.tags ? String(args.tags).split(',').map((t) => t.trim()).filter(Boolean) : [],
  confidence: args.confidence !== undefined ? Number(args.confidence) : null,
};

fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf8');
console.log(`Saved memory to ${file}`);

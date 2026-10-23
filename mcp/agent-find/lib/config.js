'use strict';
// Config resolution for the bundled agent_find server.
//
// Everything here is generic on purpose: this file ships inside the alignment-harness
// PLUGIN, which anyone can install into any repository. It must never assume a
// particular person's machine, home folder, or sibling-repo layout.
//
// Data lives under CLAUDE_PLUGIN_DATA (set by Claude Code when it loads a plugin).
// If that variable is unset — e.g. someone runs this file directly, outside the
// plugin harness — fall back to a scratch folder under the OS temp dir. We never
// create anything under ~/.claude ourselves.

const fs = require('fs');
const os = require('os');
const path = require('path');

function getDataDir() {
  const fromEnv = process.env.CLAUDE_PLUGIN_DATA;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return path.join(os.tmpdir(), 'alignment-harness-unbound');
}

function getPluginRoot() {
  // this file: <pluginRoot>/mcp/agent-find/lib/config.js
  return path.resolve(__dirname, '..', '..', '..');
}

function readJsonSafe(file) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

/**
 * Load the repo list this install should search.
 *
 * Config file: <dataDir>/agent-find.json, shape:
 *   { "repos": ["/abs/path/to/repo-a", "/abs/path/to/repo-b"] }
 *
 * When the file is missing, empty, or unreadable, default to the current working
 * directory — the one repo we can always safely assume the person cares about,
 * with no sibling-folder guessing and no hardcoded repo names baked in.
 */
function loadRepos() {
  const dataDir = getDataDir();
  const configPath = path.join(dataDir, 'agent-find.json');
  const parsed = readJsonSafe(configPath);
  const configured = parsed && Array.isArray(parsed.repos)
    ? parsed.repos.filter((p) => typeof p === 'string' && p.trim())
    : null;

  const repos = (configured && configured.length ? configured : [process.cwd()])
    .map((p) => path.resolve(p))
    .filter((p) => {
      try { return fs.statSync(p).isDirectory(); } catch (_) { return false; }
    });

  // De-dupe in case the config or cwd collide.
  return [...new Set(repos)];
}

function getConfigPath() {
  return path.join(getDataDir(), 'agent-find.json');
}

function getRecordsDir() {
  return path.join(getDataDir(), 'records');
}

/**
 * Where a person's Claude Code project transcripts live, for the current working
 * directory. Mirrors Claude Code's own slugging (non-alphanumerics -> '-').
 * Honors CLAUDE_CONFIG_DIR the same way Claude Code itself does.
 */
function getSessionsDir(forCwd) {
  const configHome = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const slug = (forCwd || process.cwd()).replace(/[^A-Za-z0-9]/g, '-');
  return path.join(configHome, 'projects', slug);
}

module.exports = {
  getDataDir,
  getPluginRoot,
  loadRepos,
  getConfigPath,
  getRecordsDir,
  getSessionsDir,
};

'use strict';
// A person's own past Claude Code sessions for this project —
// ~/.claude/projects/<cwd-slug>/*.jsonl — human and assistant TEXT only, never tool
// output or hook-injected context. This is the "raw material" a fresh install
// already has on day one, before any structured memory log exists (see
// docs/build/agentic-find.md section 4 for why this is distinct from a hand-written
// memory log).

const fs = require('fs');
const path = require('path');

const MAX_FILES = 40; // most recent
const MAX_LINE_LEN = 200000; // skip pathological single-line JSONL entries

function extractText(message) {
  const content = message && message.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n');
  }
  return '';
}

async function searchSessions(query, sessionsDir, deadlineAt) {
  // Pre-filter on raw substring before JSON.parse — session files can be large, and
  // parsing every line just to discard it is the expensive part. This mirrors the
  // standalone memory-search.js fallback script's approach.
  const terms = (query || '').toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || [];
  if (!terms.length) return [];

  let files;
  try {
    files = fs.readdirSync(sessionsDir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => path.join(sessionsDir, f))
      .sort((a, b) => {
        try { return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs; } catch (_) { return 0; }
      })
      .slice(0, MAX_FILES);
  } catch (_) {
    return []; // no session history for this project yet — not an error
  }

  const entries = [];
  for (const file of files) {
    if (deadlineAt && Date.now() > deadlineAt) break;
    let raw;
    try { raw = fs.readFileSync(file, 'utf8'); } catch (_) { continue; }
    const sessionId = path.basename(file, '.jsonl');
    for (const line of raw.split('\n')) {
      if (!line || line.length > MAX_LINE_LEN) continue;
      const lowerLine = line.toLowerCase();
      if (!terms.some((t) => lowerLine.includes(t))) continue;
      let evt;
      try { evt = JSON.parse(line); } catch (_) { continue; }
      const m = evt.message;
      if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
      const text = extractText(m);
      if (!text || text.includes('<hook-injected-context') || text.includes('<system-reminder>')) continue;
      const date = String(evt.timestamp || '').slice(0, 10);
      entries.push({
        source: 'session',
        title: `past session ${sessionId.slice(0, 8)} (${m.role}, ${date || '?'})`,
        body: text.slice(0, 400),
        timestamp: evt.timestamp,
        searchText: text.toLowerCase(),
        meta: { sessionId, role: m.role, more: `session:${sessionId}` },
      });
    }
  }
  return entries;
}

module.exports = { searchSessions };

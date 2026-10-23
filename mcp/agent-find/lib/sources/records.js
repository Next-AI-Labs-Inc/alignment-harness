'use strict';
// The harness's own local records folder — <dataDir>/records/** — whatever
// structured or free-text records the rest of the harness writes there (scope
// declarations, verification contracts, session compactions, etc). This source is
// entirely optional in the sense that an empty/missing folder is completely normal
// on a fresh install; it just means nothing has been recorded yet.

const fs = require('fs');
const path = require('path');

const MAX_FILES = 4000;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB — records are small structured writes, not logs
const TEXT_EXT = /\.(md|txt|json|jsonl|yaml|yml)$/i;

function titleFor(filePath, content) {
  const headingMatch = content.match(/^#\s+(.+)/m);
  if (headingMatch) return headingMatch[1].trim();
  if (path.extname(filePath) === '.json') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed.title || parsed.name || parsed.intent || path.basename(filePath);
      }
    } catch (_) { /* not JSON, or malformed — fall through */ }
  }
  return path.basename(filePath);
}

function walk(dir, out, depth) {
  if (depth > 6 || out.length >= MAX_FILES) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const ent of entries) {
    if (out.length >= MAX_FILES) return;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out, depth + 1);
    else if (TEXT_EXT.test(ent.name)) out.push(full);
  }
}

async function searchRecords(query, recordsDir) {
  if (!fs.existsSync(recordsDir)) return []; // normal on a fresh install
  const files = [];
  walk(recordsDir, files, 0);

  const entries = [];
  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (stat.size > MAX_FILE_SIZE) continue;
      const content = fs.readFileSync(file, 'utf8');
      const title = titleFor(file, content);
      entries.push({
        source: 'record',
        title,
        body: content.replace(/\s+/g, ' ').trim().slice(0, 300),
        timestamp: stat.mtime,
        searchText: `${title} ${content}`.toLowerCase().slice(0, 20000),
        meta: { path: path.relative(recordsDir, file), more: `record:${path.relative(recordsDir, file)}` },
      });
    } catch (_) { /* unreadable — skip */ }
  }
  return entries;
}

module.exports = { searchRecords };

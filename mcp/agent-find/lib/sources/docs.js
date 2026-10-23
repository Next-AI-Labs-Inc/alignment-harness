'use strict';
// Markdown docs across the configured repos. Generalized from the private engine's
// searchDocs()/loadMarkdownIndex(): same idea (git ls-files, first heading, first
// paragraph, cheap per-process cache), no IX-specific content classification, no
// hardcoded repo names — it walks whatever repos lib/config.js resolves to.

const fs = require('fs');
const path = require('path');
const { execFileSafe } = require('../util');

let cache = null; // { builtAt, entries: [...] } — process-lifetime cache

async function listMarkdownFiles(repoPath) {
  // Prefer git (respects .gitignore, includes untracked-but-not-ignored files, which
  // matters — a doc written minutes ago and not yet committed should still be
  // findable). Fall back to a plain fs walk when the repo isn't a git checkout.
  const out = await execFileSafe(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.md', '*.mdx'],
    { cwd: repoPath, timeout: 4000, maxBuffer: 32 * 1024 * 1024 }
  );
  const fromGit = out.trim() ? [...new Set(out.trim().split('\n').filter(Boolean))] : null;
  if (fromGit && fromGit.length) return fromGit;
  if (fromGit) return []; // git ran and genuinely found nothing tracked/untracked-visible

  // Not a git repo (or git unavailable) — walk the filesystem, capped so a huge
  // non-git tree can't make this hang or blow memory.
  const results = [];
  const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache']);
  const MAX_FILES = 5000;
  function walk(dir, depth) {
    if (depth > 8 || results.length >= MAX_FILES) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const ent of entries) {
      if (results.length >= MAX_FILES) return;
      if (ent.name.startsWith('.') || SKIP.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full, depth + 1);
      else if (/\.mdx?$/i.test(ent.name)) results.push(path.relative(repoPath, full));
    }
  }
  walk(repoPath, 0);
  return results;
}

function firstHeadingAndParagraph(content, fallbackTitle) {
  const headingMatch = content.match(/^#\s+(.+)/m);
  const heading = headingMatch ? headingMatch[1].trim() : fallbackTitle;
  const lines = content.split('\n');
  let firstPara = '';
  let pastHeading = !headingMatch;
  for (const line of lines) {
    if (!pastHeading) {
      if (line.startsWith('#')) { pastHeading = true; }
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|') || trimmed.startsWith('```')) continue;
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) continue;
    firstPara = trimmed.slice(0, 220);
    break;
  }
  return { heading, firstPara };
}

async function loadIndex(repos) {
  if (cache) return cache.entries;
  const entries = [];
  for (const repoPath of repos) {
    let files;
    try { files = await listMarkdownFiles(repoPath); } catch (_) { continue; }
    const repoName = path.basename(repoPath);
    for (const relPath of files) {
      try {
        const fullPath = path.join(repoPath, relPath);
        const stat = fs.statSync(fullPath);
        if (stat.size > 2 * 1024 * 1024) continue; // skip pathological files
        const content = fs.readFileSync(fullPath, 'utf8');
        const { heading, firstPara } = firstHeadingAndParagraph(content, path.basename(relPath, path.extname(relPath)));
        entries.push({
          source: 'doc',
          title: heading,
          body: firstPara || `${repoName}/${relPath}`,
          timestamp: stat.mtime,
          searchText: `${heading} ${firstPara} ${relPath}`.toLowerCase(),
          meta: { path: `${repoName}/${relPath}`, more: `doc:${repoName}/${relPath}` },
        });
      } catch (_) { /* unreadable file — skip */ }
    }
  }
  cache = { builtAt: Date.now(), entries };
  return entries;
}

async function searchDocs(query, repos) {
  const entries = await loadIndex(repos);
  return entries;
}

function resetCache() { cache = null; }

module.exports = { searchDocs, resetCache };

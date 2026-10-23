'use strict';
// Git commit search across the configured repos. Generalized from the private
// engine's searchCommits(): AND-match on `--grep` first (every query term must
// appear), falling back to OR-match if that comes back empty, so an over-specific
// query still gets something.

const path = require('path');
const { execFileSafe } = require('../util');

function parseGitOutput(output, repoName) {
  return output.trim().split('\n').filter(Boolean).map((line) => {
    const [hash, date, ...msgParts] = line.split('|');
    const msg = msgParts.join('|');
    return {
      source: 'commit',
      title: msg.slice(0, 100),
      body: msg,
      timestamp: date,
      searchText: msg.toLowerCase(),
      meta: { hash: (hash || '').slice(0, 9), repo: repoName, more: `git:${repoName}:${(hash || '').slice(0, 9)}` },
    };
  });
}

async function searchOneRepo(query, repoPath) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return [];
  // Each term is ONE argument handed to git with no shell in between, and
  // --fixed-strings makes git read it as plain text, not a pattern. A query like
  // `a;rm -rf x $(cmd) \`cmd\`` is just words to search for.
  const grepArgs = terms.map((t) => `--grep=${t}`);
  const logArgs = ['log', '--all', '--format=%H|%aI|%s', '--fixed-strings', ...grepArgs];
  const repoName = path.basename(repoPath);

  const andOut = await execFileSafe('git', [...logArgs, '--all-match', '-n', '60'], { cwd: repoPath, timeout: 3000 });
  if (andOut.trim()) return parseGitOutput(andOut, repoName);

  const orOut = await execFileSafe('git', [...logArgs, '-n', '40'], { cwd: repoPath, timeout: 3000 });
  if (!orOut.trim()) return [];
  // OR-match is weaker evidence than AND-match — dock relevance slightly by marking it.
  return parseGitOutput(orOut, repoName).map((e) => ({ ...e, meta: { ...e.meta, orMatch: true } }));
}

async function searchCommits(query, repos) {
  const perRepo = await Promise.all(repos.map((r) => searchOneRepo(query, r).catch(() => [])));
  return perRepo.flat();
}

module.exports = { searchCommits };

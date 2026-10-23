'use strict';
// Small shared helpers. No dependencies, and every helper here fails open: an error
// or a timeout returns an empty/default value rather than throwing up to the caller,
// per the "everything fails open" requirement for this server.

const { execFile } = require('child_process');

// Runs `file` with an argument array and NO shell, so nothing in `args` (a search
// query, a repo name) is ever interpreted as shell syntax: `;`, `$(...)`, backticks
// and quotes stay plain text. Returns stdout, or '' on any error or timeout.
function execFileSafe(file, args, opts = {}) {
  return new Promise((resolve) => {
    let done = false;
    const child = execFile(file, args, { encoding: 'utf8', timeout: opts.timeout || 4000, maxBuffer: opts.maxBuffer || 16 * 1024 * 1024, cwd: opts.cwd }, (err, stdout) => {
      if (done) return;
      done = true;
      resolve(err ? '' : (stdout || ''));
    });
    // Belt-and-braces: the `timeout` option sends SIGTERM, but guard again in
    // case the child ignores it, so a hung git process can never hang the search.
    const hardTimeout = setTimeout(() => {
      if (done) return;
      done = true;
      try { child.kill('SIGKILL'); } catch (_) { /* already gone */ }
      resolve('');
    }, (opts.timeout || 4000) + 500);
    child.on('exit', () => clearTimeout(hardTimeout));
  });
}

/**
 * Race a promise against a deadline; return `fallback` (default: []) if it loses.
 *
 * Clears its own timer either way. An uncleared setTimeout keeps Node's event loop
 * alive until it fires even after the real work is done — with several of these
 * nested (as search.js does, one per source plus an outer one), a search that
 * actually finished in well under a second would otherwise hold the whole process
 * open until every leftover timer expired.
 */
function withDeadline(promise, ms, fallback = []) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise.catch(() => fallback), timeout]).finally(() => clearTimeout(timer));
}

function relativeDate(dateStr) {
  if (!dateStr) return '?';
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (Number.isNaN(days)) return '?';
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

module.exports = { execFileSafe, withDeadline, relativeDate };

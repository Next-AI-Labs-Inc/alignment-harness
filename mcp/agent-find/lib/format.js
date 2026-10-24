'use strict';
// Renders an agentFind() result as plain text. Honest about an empty or
// near-empty index instead of just printing "Found 0 results" — see
// docs/build/agentic-find.md change 9.

const { relativeDate } = require('./util');

const SOURCE_EMOJI = { doc: '📄', commit: '📝', skill: '🔧', session: '💬', record: '🗂️' };

function formatResults(result) {
  if (!result) return 'agent_find: no result (internal error) — treat as no matches.';

  if (result.empty) {
    if (result.emptyReason === 'empty-query') {
      return 'agent_find: no query given. Pass a few keywords to search for.';
    }
    const counted = Object.entries(result.sourceCounts || {}).map(([s, n]) => `${n} ${s}`).join(', ') || 'nothing yet';
    return [
      `No institutional memory yet for "${result.query}" — searched ${counted}.`,
      'This grows as you work: past sessions, your repo\'s docs and commits, and skills',
      'all become searchable automatically. Nothing is broken; there is just nothing',
      'indexed that matches this query yet.',
    ].join(' ');
  }

  const header = [];
  const modeNote = result.mode === 'keyword' ? ' (keyword mode)' : '';
  header.push(`Found ${result.count} results for "${result.query}" (from ${result.totalCandidates} candidates)${modeNote}:`);
  const counts = Object.entries(result.sourceCounts || {}).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s}(${n})`);
  if (counts.length) header.push(`Hits: ${counts.join(' | ')}`);
  if (result.nearlyEmpty) {
    header.push('Note: very little is indexed yet for this query — treat these as a partial answer.');
  }

  const lines = [header.join('\n'), ''];
  result.results.forEach((r, i) => {
    const emoji = SOURCE_EMOJI[r.source] || '•';
    const pct = Math.round(Math.min(1.5, Math.max(0, r.score)) * 100);
    const rel = relativeDate(r.timestamp);
    const meta = r.meta || {};
    const ref = meta.more ? `ref:${meta.more}` : '';
    lines.push(`${i + 1}. ${emoji} ${r.title}`);
    const metaLine = [`${pct}%`, rel, ref].filter(Boolean).join(' | ');
    lines.push(`   ${metaLine}`);
    if (r.body && r.body !== r.title) lines.push(`   ${String(r.body).slice(0, 220)}`);
    lines.push('');
  });

  const firstRef = result.results.map((r) => r.meta && r.meta.more).find(Boolean);
  if (firstRef) {
    lines.push(`Open any result in full with agent_read({ ref: "${firstRef}" }) using the ref shown beside it (or: node <plugin folder>/mcp/agent-find/read-cli.js "${firstRef}").`);
  }

  return lines.join('\n').trim();
}

module.exports = { formatResults };

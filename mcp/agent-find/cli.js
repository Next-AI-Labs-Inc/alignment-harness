#!/usr/bin/env node
'use strict';
// CLI fallback for agent_find — the fail-safe path when the MCP transport is down.
// Same engine, same ranking, no stdio protocol involved.
//
// Usage:
//   node cli.js "your search query"
//   node cli.js "your search query" --limit 12
//   node cli.js "your search query" --sources doc,commit

const { agentFind } = require('./lib/search');
const { formatResults } = require('./lib/format');

function parseArgs(argv) {
  const args = argv.slice(2);
  const query = args.find((a) => !a.startsWith('--'));
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : 8;
  const sourcesIdx = args.indexOf('--sources');
  const sources = sourcesIdx !== -1 && args[sourcesIdx + 1] ? args[sourcesIdx + 1].split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  return { query, limit, sources };
}

async function main() {
  const { query, limit, sources } = parseArgs(process.argv);
  if (!query) {
    console.error('Usage: node cli.js "your search query" [--limit N] [--sources doc,commit,skill,session,record]');
    process.exit(1);
    return;
  }
  const result = await agentFind(query, { limit, sources });
  console.log(formatResults(result));
}

main().catch((err) => {
  // Fails open even at the top level: print a plain message, exit non-zero, never a
  // raw stack trace as the only output.
  console.error(`agent-find cli failed: ${err && err.message ? err.message : 'unknown error'}`);
  process.exit(1);
});

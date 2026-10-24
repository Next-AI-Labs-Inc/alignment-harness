#!/usr/bin/env node
'use strict';
// CLI fallback for agent_read — the fail-safe path when the MCP transport is down.
// Same engine as the agent_read tool, no stdio protocol involved.
//
// Usage:
//   node read-cli.js "record:compactions/session-abc.json"
//   node read-cli.js "doc:my-repo/docs/plan.md" --offset 200 --limit 100
// The reference is the "ref:" value agent_find prints beside each result.

const { agentRead, formatRead } = require('./lib/read');

function parseArgs(argv) {
  const args = argv.slice(2);
  const num = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : undefined;
  };
  const flagValues = new Set(['--offset', '--limit'].map((f) => args.indexOf(f) + 1).filter((i) => i > 0));
  const ref = args.find((a, i) => !a.startsWith('--') && !flagValues.has(i));
  return { ref, offset: num('--offset'), limit: num('--limit') };
}

async function main() {
  const { ref, offset, limit } = parseArgs(process.argv);
  if (!ref) {
    console.error('Usage: node read-cli.js "<ref from agent_find>" [--offset N] [--limit N]');
    process.exit(1);
    return;
  }
  const result = await agentRead(ref, { offset, limit });
  console.log(formatRead(result));
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(`agent-read cli failed: ${err && err.message ? err.message : 'unknown error'}`);
  process.exit(1);
});

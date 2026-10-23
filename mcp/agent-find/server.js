#!/usr/bin/env node
'use strict';
// A minimal, hand-written MCP server over stdio (JSON-RPC 2.0, newline-delimited).
// No SDK, no shipped node_modules, no `npm install` required to run this file — it
// uses only Node's built-ins plus the zero-dependency search engine in ./lib.
//
// Exposes exactly one tool: agent_find({ query, limit?, sources? }).
//
// Protocol notes:
//   - Every JSON-RPC response goes to stdout, one JSON object per line.
//   - Everything else (diagnostics, errors) goes to stderr — stdout must stay clean
//     JSON-RPC or the client can't parse it.
//   - This process must never crash and never hang: every handler is wrapped, and
//     search itself is deadline-capped inside lib/search.js.

const readline = require('readline');
const { agentFind } = require('./lib/search');
const { formatResults } = require('./lib/format');

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'agent-find', version: '0.1.0' };

const TOOLS = [
  {
    name: 'agent_find',
    description:
      'Search this project\'s institutional memory: markdown docs and git commits in ' +
      'the configured repo(s), past Claude Code sessions for this project, this ' +
      'harness\'s local records, and this plugin\'s own skills. Use it before ' +
      're-deriving something that may already be decided or documented.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query.' },
        limit: { type: 'number', description: 'Max results to return (default 8, max 50).' },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['doc', 'commit', 'skill', 'session', 'record'] },
          description: 'Restrict the search to specific sources. Defaults to all.',
        },
      },
      required: ['query'],
    },
  },
];

function send(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function ok(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function fail(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleToolsCall(id, params) {
  const name = params && params.name;
  const args = (params && params.arguments) || {};
  if (name !== 'agent_find') {
    fail(id, -32602, `Unknown tool: ${name}`);
    return;
  }
  let text;
  try {
    const result = await agentFind(args.query, { limit: args.limit, sources: args.sources });
    text = formatResults(result);
  } catch (err) {
    // Fails open: a search error becomes a plain-language message, never a crash and
    // never a thrown JSON-RPC error that would look like the TOOL is broken.
    text = `agent_find hit an internal error and returned no results: ${err && err.message ? err.message : 'unknown error'}.`;
  }
  ok(id, { content: [{ type: 'text', text }] });
}

async function handleRequest(msg) {
  const { id, method, params } = msg;
  try {
    switch (method) {
      case 'initialize':
        ok(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
        return;
      case 'notifications/initialized':
        return; // notification — no response
      case 'ping':
        ok(id, {});
        return;
      case 'tools/list':
        ok(id, { tools: TOOLS });
        return;
      case 'tools/call':
        await handleToolsCall(id, params);
        return;
      default:
        if (id !== undefined) fail(id, -32601, `Method not found: ${method}`);
        return; // unknown notification — ignore silently
    }
  } catch (err) {
    if (id !== undefined) fail(id, -32603, `Internal error: ${err && err.message ? err.message : 'unknown'}`);
  }
}

function main() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  let pending = 0;
  let inputClosed = false;

  const maybeExit = () => {
    if (inputClosed && pending === 0) process.exit(0);
  };

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch (_) {
      // Not valid JSON-RPC — ignore rather than crash. We don't know an id to
      // reply to, and stdout must never carry anything but well-formed JSON-RPC.
      return;
    }
    // A request (e.g. tools/call running a search) can take real time. stdin closing
    // — the client tearing down its side of the pipe, or (as in a one-shot test
    // harness) simply reaching EOF — must not race ahead of an in-flight response
    // and kill the process before it's written. Track in-flight work and only exit
    // once stdin is closed AND nothing is still pending.
    pending++;
    handleRequest(msg)
      .catch((err) => {
        process.stderr.write(`[agent-find] unhandled error: ${err && err.stack ? err.stack : err}\n`);
      })
      .finally(() => {
        pending--;
        maybeExit();
      });
  });
  rl.on('close', () => {
    inputClosed = true;
    maybeExit();
  });
}

process.on('uncaughtException', (err) => {
  process.stderr.write(`[agent-find] uncaught exception (server stays up): ${err && err.stack ? err.stack : err}\n`);
});
process.on('unhandledRejection', (err) => {
  process.stderr.write(`[agent-find] unhandled rejection (server stays up): ${err && err.stack ? err.stack : err}\n`);
});

main();

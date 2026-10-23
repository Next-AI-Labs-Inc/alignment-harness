#!/usr/bin/env node
'use strict';
// Print a skill-test transcript (stream-json from skill-test-run.sh) in a compact, readable form:
// what Dana asked, every tool the agent called, what came back (trimmed), everything the agent
// said, and how the run ended.
//
//   node plugin-dev/skill-test-transcript.js <run.jsonl> [--max 600]

const fs = require('fs');
const file = process.argv[2];
const maxI = process.argv.indexOf('--max');
const MAX = maxI > 0 ? Number(process.argv[maxI + 1]) : 600;
if (!file) { console.error('usage: skill-test-transcript.js <run.jsonl> [--max 600]'); process.exit(64); }
const cut = (s) => { s = String(s == null ? '' : s); return s.length > MAX ? `${s.slice(0, MAX)} …[+${s.length - MAX} chars]` : s; };

for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let e; try { e = JSON.parse(line); } catch { continue; }
  if (e.type === 'system' && e.subtype === 'init') {
    console.log(`[start] model=${e.model} skills=${(e.skills || []).length} plugins=${(e.plugins || []).map((p) => p.name).join(',')}`);
  } else if (e.type === 'assistant') {
    for (const c of e.message.content || []) {
      if (c.type === 'text' && c.text.trim()) console.log(`\n[agent says]\n${cut(c.text)}`);
      if (c.type === 'tool_use') console.log(`\n[tool call] ${c.name} ${cut(JSON.stringify(c.input))}`);
    }
  } else if (e.type === 'user') {
    const content = e.message && e.message.content;
    if (typeof content === 'string') { console.log(`\n[user]\n${cut(content)}`); continue; }
    for (const c of content || []) {
      if (c.type === 'text') console.log(`\n[user]\n${cut(c.text)}`);
      if (c.type === 'tool_result') {
        const t = Array.isArray(c.content) ? c.content.map((x) => x.text || '').join('\n') : c.content;
        console.log(`[tool result${c.is_error ? ' ERROR' : ''}] ${cut(t)}`);
      }
    }
  } else if (e.type === 'result') {
    console.log(`\n[end] ${e.subtype} turns=${e.num_turns} seconds=${Math.round((e.duration_ms || 0) / 1000)} est_cost=$${(e.total_cost_usd || 0).toFixed(3)}${e.is_error ? ' ERROR' : ''}`);
  }
}

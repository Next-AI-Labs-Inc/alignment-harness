'use strict';
// Reads the session transcript (the JSONL file Claude Code passes to hooks as
// transcript_path) and returns what happened in the CURRENT turn: everything
// after the person's last real message. Used by the evidence gate to see what
// the agent actually ran, not just what it said.

const fs = require('fs');

const TAIL_BYTES = 3 * 1024 * 1024; // enough for any single turn

function readTail(file) {
  const st = fs.statSync(file);
  const start = Math.max(0, st.size - TAIL_BYTES);
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(st.size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    let text = buf.toString('utf8');
    if (start > 0) text = text.slice(text.indexOf('\n') + 1); // drop partial first line
    return text;
  } finally { fs.closeSync(fd); }
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c) => {
      if (!c || typeof c !== 'object') return '';
      if (c.type === 'text') return c.text || '';
      if (c.type === 'tool_result') return textOf(c.content);
      return '';
    }).join('\n');
  }
  return '';
}

function isRealUserMessage(entry) {
  const m = entry && entry.message;
  if (!m || m.role !== 'user') return false;
  if (entry.isMeta) return false;
  const c = m.content;
  if (typeof c === 'string') return c.trim().length > 0;
  if (Array.isArray(c)) {
    if (c.some((p) => p && p.type === 'tool_result')) return false;
    return c.some((p) => p && p.type === 'text' && String(p.text || '').trim().length > 0);
  }
  return false;
}

// Returns { toolUses:[{name,input}], toolResults:[string], assistantText:string, found:boolean }
function currentTurn(transcriptPath) {
  const out = { toolUses: [], toolResults: [], assistantText: '', humanText: '', found: false };
  if (!transcriptPath) return out;
  let raw;
  try { raw = readTail(transcriptPath); } catch (_) { return out; }
  const entries = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try { entries.push(JSON.parse(line)); } catch (_) { /* skip */ }
  }
  let startIdx = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isRealUserMessage(entries[i])) { startIdx = i + 1; out.humanText = textOf(entries[i].message.content); break; }
  }
  out.found = true;
  const texts = [];
  for (const e of entries.slice(startIdx)) {
    const m = e.message;
    if (!m) continue;
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p && p.type === 'tool_use') out.toolUses.push({ name: p.name, input: p.input || {} });
        if (p && p.type === 'text') texts.push(p.text || '');
      }
    } else if (m.role === 'user' && Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p && p.type === 'tool_result') out.toolResults.push(textOf(p.content).slice(0, 20000));
      }
    }
    if (e.toolUseResult && typeof e.toolUseResult === 'object') {
      const r = e.toolUseResult;
      const s = [r.stdout, r.stderr].filter(Boolean).join('\n');
      if (s) out.toolResults.push(s.slice(0, 20000));
    }
  }
  out.assistantText = texts.join('\n');
  return out;
}

// Assistant text written after a given time (ms epoch). Used by the coherence
// gate's secondary check, for runtimes that write text to the transcript
// before tool calls.
function assistantTextSince(transcriptPath, sinceMs) {
  let raw;
  try { raw = readTail(transcriptPath); } catch (_) { return ''; }
  const parts = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch (_) { continue; }
    const t = Date.parse(e.timestamp || '');
    if (!Number.isFinite(t) || t < sinceMs) continue;
    const m = e.message;
    if (m && m.role === 'assistant') parts.push(textOf(m.content));
  }
  return parts.join('\n');
}

// Every tool call in the (tail of the) session — used at session end.
function allToolUses(transcriptPath) {
  const outp = [];
  let raw;
  try { raw = readTail(transcriptPath); } catch (_) { return outp; }
  for (const line of raw.split('\n')) {
    if (!line.includes('tool_use')) continue;
    let e; try { e = JSON.parse(line); } catch (_) { continue; }
    const m = e.message;
    if (m && m.role === 'assistant' && Array.isArray(m.content)) {
      for (const p of m.content) if (p && p.type === 'tool_use') outp.push({ name: p.name, input: p.input || {} });
    }
  }
  return outp;
}

module.exports = { allToolUses, currentTurn, assistantTextSince, textOf, isRealUserMessage };

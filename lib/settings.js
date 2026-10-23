'use strict';
// The one way anything reads or changes a setting in your switches file.
//
// `alignment-harness switch`, `alignment-harness settings ...` and the settings page all go
// through setSetting() here, so they behave the same way:
//   - only settings that exist in config/switches.default.jsonc can be changed, and only to a
//     value that setting accepts (lib/settings-catalog.js);
//   - the file is edited in place: only the characters of that one value change, so every
//     comment, blank line and the order of everything else stay exactly as they were;
//   - the write is atomic (a temporary file, then swapped in), so a hook never reads half a file,
//     and if the result doesn't read back as intended the previous text is put back;
//   - a switches file with a mistake in it is never written over. The hooks keep running on the
//     defaults (core.loadSwitches never throws) and the person is told what to fix.
//
// Nothing here is read by the hooks themselves; they keep using core.loadSwitches(). So a bug in
// this file can stop a setting from being changed, but it cannot stop a gate from failing open.

const fs = require('fs');
const path = require('path');
const core = require('./core');
const catalog = require('./settings-catalog');

// ── Finding values inside JSON-with-comments text ──────────────────────────
// Walks the text once and records, for every key path ("governer.predictRequiredSkills.enabled"),
// where its value starts and ends. Comments and strings are skipped properly, so a "//" inside a
// string or a brace inside a comment can't confuse it. Throws on text that isn't valid JSONC.
// When a key appears twice, the last one wins, the same as the reader.
function locate(text) {
  const spans = new Map();
  const n = text.length;
  let i = 0;
  const fail = (what) => { throw new Error(`${what} at character ${i}`); };
  function ws() {
    for (;;) {
      while (i < n && /\s/.test(text[i])) i++;
      if (text[i] === '/' && text[i + 1] === '/') { while (i < n && text[i] !== '\n') i++; continue; }
      if (text[i] === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      return;
    }
  }
  function str() {
    const s = i; i++;
    while (i < n) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i] === '"') { i++; return JSON.parse(text.slice(s, i)); }
      if (text[i] === '\n') break;
      i++;
    }
    return fail('unfinished text value');
  }
  function record(keyPath, entry) {
    const k = keyPath.join('.');
    spans.delete(k); // re-insert so file order follows the last occurrence
    spans.set(k, entry);
  }
  function value(keyPath, keyStart) {
    ws();
    const start = i;
    const c = text[i];
    if (c === '{') {
      i++; ws();
      while (i < n && text[i] !== '}') {
        if (text[i] !== '"') fail('expected a "name"');
        const ks = i;
        const k = str(); ws();
        if (text[i] !== ':') fail('expected ":"');
        i++;
        value([...keyPath, k], ks);
        ws();
        if (text[i] === ',') { i++; ws(); } else if (text[i] !== '}') fail('expected "," or "}"');
      }
      if (text[i] !== '}') fail('unclosed {');
      i++;
      record(keyPath, { kind: 'object', start, end: i, keyStart });
      return;
    }
    if (c === '[') {
      i++; ws(); let idx = 0;
      while (i < n && text[i] !== ']') {
        value([...keyPath, String(idx++)], i); ws();
        if (text[i] === ',') { i++; ws(); } else if (text[i] !== ']') fail('expected "," or "]"');
      }
      if (text[i] !== ']') fail('unclosed [');
      i++;
      record(keyPath, { kind: 'leaf', start, end: i, keyStart });
      return;
    }
    if (c === '"') str();
    else {
      while (i < n && !/[\s,}\]/]/.test(text[i])) i++;
      if (i === start) fail('expected a value');
      JSON.parse(text.slice(start, i)); // true / false / null / a number; anything else throws
    }
    record(keyPath, { kind: 'leaf', start, end: i, keyStart });
  }
  value([], null);
  ws();
  if (i < n) fail('unexpected text after the settings');
  return spans;
}

// The comment lines written directly above a key, without the "//" marks or the "── … ──" rules.
function commentAbove(text, keyStart) {
  if (keyStart === null || keyStart === undefined) return '';
  const before = text.slice(0, keyStart).split('\n');
  before.pop(); // the key's own line, up to the key
  const out = [];
  while (before.length) {
    const line = before[before.length - 1].trim();
    if (!line.startsWith('//')) break;
    out.unshift(line.replace(/^\/\/ ?/, ''));
    before.pop();
  }
  return out.filter((l) => !/^─+$/.test(l.trim()) && !/^── .* ─+$/.test(l.trim())).join('\n').trim();
}

// The same comment as flowing sentences: lines wrapped for the file are joined, while a line that
// starts a new value's explanation ("block" = …, true = …) keeps its own line.
function reflow(comment) {
  const out = [];
  for (const line of String(comment || '').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const starts = /^("[^"]*"\s*=|(true|false)\s*=)/.test(t);
    if (!out.length || starts) out.push(t); else out[out.length - 1] += ` ${t}`;
  }
  return out.join('\n');
}

function getPath(obj, dotted) {
  let cur = obj;
  for (const part of String(dotted).split('.')) {
    if (!cur || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, part)) return undefined;
    cur = cur[part];
  }
  return cur;
}

// ── What settings exist ────────────────────────────────────────────────────
// Every single value in the defaults file, in file order, with its default and its comment.
function defaultEntries() {
  const text = fs.readFileSync(core.P.switchesDefault, 'utf8');
  const spans = locate(text);
  const defaults = core.readJsonc(core.P.switchesDefault);
  const out = [];
  for (const [name, span] of spans) {
    if (span.kind !== 'leaf' || !name.includes('.')) continue;
    out.push({ name, default: getPath(defaults, name), comment: commentAbove(text, span.keyStart) });
  }
  return out;
}

function sectionFor(name) {
  const key = String(name).split('.')[0];
  return catalog.SECTIONS.find((s) => s.key === key) || null;
}

function inferAllowed(def) {
  if (typeof def === 'boolean') return { type: 'boolean' };
  if (typeof def === 'number') return { type: 'integer', min: 0, max: 1000 };
  return { type: 'text' };
}

function catalogEntry(name) {
  const sec = sectionFor(name);
  const rest = String(name).split('.').slice(1).join('.');
  return { sec, rest, c: (sec && sec.settings && sec.settings[rest]) || {} };
}

function describe(name) {
  const entry = defaultEntries().find((e) => e.name === name);
  if (!entry) return null;
  const { sec, rest, c } = catalogEntry(name);
  return { ...entry, section: sec, label: c.label || rest, allowed: c.allowed || inferAllowed(entry.default), note: c.note || '' };
}

// ── Turning what someone typed into a value the setting accepts ────────────
// Returns { ok: true, value } or { ok: false, error }. `raw` is either text from the CLI
// ("on", "off", "3", "remind") or an already-typed value from the page (true, 3, "remind").
function coerce(info, raw) {
  const a = info.allowed;
  const s = typeof raw === 'string' ? raw.trim() : raw;
  if (a.type === 'boolean') {
    if (typeof s === 'boolean') return { ok: true, value: s };
    if (/^(on|true|yes|1)$/i.test(String(s))) return { ok: true, value: true };
    if (/^(off|false|no|0)$/i.test(String(s))) return { ok: true, value: false };
    return { ok: false, error: `${info.name} is on or off` };
  }
  if (a.type === 'integer') {
    const v = typeof s === 'number' ? s : (/^-?\d+$/.test(String(s)) ? Number(s) : NaN);
    if (!Number.isInteger(v)) return { ok: false, error: `${info.name} needs a whole number` };
    if ((a.min !== undefined && v < a.min) || (a.max !== undefined && v > a.max)) return { ok: false, error: `${info.name} needs a number from ${a.min} to ${a.max}` };
    return { ok: true, value: v };
  }
  if (a.type === 'enum') {
    let v = String(s).toLowerCase();
    // "on" for a strength means its firmest setting, as the CLI always allowed.
    if (v === 'on' && !a.values.includes('on') && a.values.includes('off')) v = a.values[0];
    if (!a.values.includes(v)) return { ok: false, error: `${info.name} accepts ${a.values.join(' / ')}` };
    return { ok: true, value: v };
  }
  if (typeof s !== 'string') return { ok: false, error: `${info.name} needs text` };
  if (/[\n\r]/.test(s)) return { ok: false, error: `${info.name} must be one line` };
  return { ok: true, value: s };
}

// ── Changing a value in the file ───────────────────────────────────────────
function writeAtomic(file, text) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

function inlineJson(v) {
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${inlineJson(x)}`).join(', ')} }`;
  return JSON.stringify(v);
}

// A setting your file leaves out (it falls back to the default) gets added just inside the
// nearest enclosing group that is there, indented like that group's own lines. Trailing commas
// are accepted by the reader, so this is valid whether or not the group already had members.
function insertMissing(text, spans, name, value) {
  const parts = name.split('.');
  let depth = parts.length - 1;
  while (depth > 0 && !spans.has(parts.slice(0, depth).join('.'))) depth--;
  const parent = spans.get(parts.slice(0, depth).join('.'));
  if (!parent || parent.kind !== 'object') throw new Error(`can't find where ${name} belongs in your switches file, so nothing was changed`);
  let nested = value;
  for (let k = parts.length - 1; k > depth; k--) nested = { [parts[k]]: nested };
  const oneLine = !text.slice(parent.start, parent.end).includes('\n');
  const piece = `${oneLine ? ' ' : `\n${'  '.repeat(depth + 1)}`}${JSON.stringify(parts[depth])}: ${inlineJson(nested)},`;
  const at = parent.start + 1;
  return text.slice(0, at) + piece + text.slice(at);
}

// Change one setting. Returns { name, before, after, file, inserted, changed }. Throws with a
// plain message when the name or value isn't accepted, or the file can't be changed safely.
// Before the first Claude Code session with the harness, its data folder doesn't exist yet and the
// CLI would fall back to a temporary folder the hooks never read. A change saved there would be
// reported as done and then silently lost, so it is refused instead.
const NOT_BOUND = 'The harness has not had its first Claude Code session on this machine yet, so the folder its hooks read your settings from does not exist, and a change made now would be lost. Nothing was changed. Start one Claude Code session with the plugin on, then run this again.';

function setSetting(name, raw) {
  if (!core.DATA_BOUND) throw new Error(NOT_BOUND);
  const info = describe(String(name || ''));
  if (!info) throw new Error(`no setting called ${name} (see: alignment-harness settings list)`);
  const c = coerce(info, raw);
  if (!c.ok) throw new Error(c.error);
  core.seedUserFiles();
  const file = core.P.switchesUser;
  if (!fs.existsSync(file)) throw new Error(`your switches file could not be created at ${file}`);
  const before = fs.readFileSync(file, 'utf8');
  let spans;
  try { spans = locate(before); core.readJsonc(file); } catch (e) {
    throw new Error(`your switches file has a mistake (${e.message}), so nothing was changed. The harness is running on the defaults until it is fixed: ${file}`);
  }
  const effectiveBefore = getPath(core.loadSwitches().switches, info.name);
  const span = spans.get(info.name);
  let next; let inserted = false;
  if (span && span.kind === 'leaf') {
    next = before.slice(0, span.start) + JSON.stringify(c.value) + before.slice(span.end);
  } else if (span) {
    throw new Error(`${info.name} in your switches file holds a group of settings, not one value; nothing was changed`);
  } else {
    next = insertMissing(before, spans, info.name, c.value);
    inserted = true;
  }
  if (next !== before) {
    writeAtomic(file, next);
    let readBack;
    try { readBack = getPath(core.readJsonc(file), info.name); } catch (_) { readBack = Symbol('unreadable'); }
    if (readBack !== c.value) {
      writeAtomic(file, before);
      throw new Error(`${info.name} did not read back as ${JSON.stringify(c.value)} after writing, so your file was put back exactly as it was`);
    }
  }
  core.log('SettingChanged', { setting: info.name, from: effectiveBefore, to: c.value });
  return { name: info.name, before: effectiveBefore, after: c.value, file, inserted, changed: next !== before };
}

// Several changes in order (the page's Block/Remind/Off control may turn a piece's "enabled"
// back on and set its strength). Each is its own atomic write; the first refusal stops the rest.
function setMany(changes) {
  const done = [];
  for (const ch of changes || []) done.push(setSetting(ch && ch.name, ch && ch.value));
  return done;
}

// ── Listing: what `settings list --json` prints and the page shows ──────────
function recentEvents() {
  try {
    return fs.readFileSync(core.P.telemetry, 'utf8').trim().split('\n').slice(-5000)
      .map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  } catch (_) { return []; }
}

function cliValue(v) {
  if (typeof v === 'boolean') return v ? 'on' : 'off';
  if (v === '') return '""';
  return /\s/.test(String(v)) ? JSON.stringify(String(v)) : String(v);
}
function cliFor(name, value) { return `alignment-harness switch ${name} ${cliValue(value)}`; }

// The value the "same change from the terminal" example shows: the gentlest real change.
function exampleValue(allowed, current) {
  if (allowed.type === 'boolean') return !current;
  if (allowed.type === 'enum') return allowed.values.find((v) => v !== current && v !== 'off') || allowed.values.find((v) => v !== current);
  if (allowed.type === 'integer') return Number.isInteger(current) && current + 1 <= allowed.max ? current + 1 : allowed.min;
  return current || '<command>';
}

function skillsDir() { return path.join(core.PLUGIN_ROOT, 'skills'); }
function listSkills() {
  const out = [];
  let dirs = [];
  try { dirs = fs.readdirSync(skillsDir()).sort(); } catch (_) { return out; }
  for (const d of dirs) {
    let text = '';
    try { text = fs.readFileSync(path.join(skillsDir(), d, 'SKILL.md'), 'utf8'); } catch (_) { continue; }
    const fm = (text.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
    const desc = ((fm.match(/^description:\s*(.*)$/m) || [])[1] || '').replace(/^["']|["']$/g, '').trim();
    out.push({ name: d, description: desc.length > 300 ? `${desc.slice(0, 297)}…` : desc });
  }
  return out;
}

// Everything the agent and the page need, in one object. Never throws: a problem is reported in
// `problems` and everything else is still listed. withHealth adds each piece's "is it working?"
// line (from `alignment-harness doctor` and the local log); withSkills adds every skill.
function listSettings(opts) {
  const o = opts || {};
  const problems = [];
  let entries = [];
  try { entries = defaultEntries(); } catch (e) { problems.push(`the default settings could not be read: ${e.message}`); }
  const loaded = core.loadSwitches();
  problems.push(...loaded.problems);
  if (!core.DATA_BOUND) problems.push('These are the defaults. Settings can be changed after the first Claude Code session with the harness, which creates the folder its hooks read them from.');
  let userSpans = null;
  try { if (fs.existsSync(core.P.switchesUser)) userSpans = locate(fs.readFileSync(core.P.switchesUser, 'utf8')); } catch (_) { userSpans = null; }

  const settings = entries.map((e) => {
    const { sec, rest, c } = catalogEntry(e.name);
    const allowed = c.allowed || inferAllowed(e.default);
    const value = getPath(loaded.switches, e.name);
    const doc = sec ? `docs/${sec.doc}${sec.docAnchor ? `#${sec.docAnchor}` : ''}` : 'docs/switches.md';
    return {
      name: e.name,
      section: sec ? sec.key : e.name.split('.')[0],
      label: c.label || rest,
      value,
      default: e.default,
      isDefault: JSON.stringify(value) === JSON.stringify(e.default),
      inYourFile: !!(userSpans && userSpans.has(e.name)),
      allowed: { type: allowed.type, ...(allowed.values ? { values: allowed.values } : {}), ...(allowed.min !== undefined ? { min: allowed.min, max: allowed.max } : {}) },
      whatItDoes: reflow(e.comment),
      note: c.note || '',
      forYou: sec ? sec.forYou : '',
      doc,
      switchableOnPage: allowed.pageEditable !== false,
      howToChange: cliFor(e.name, exampleValue(allowed, value)),
    };
  });

  let doctorChecks = [];
  if (o.withHealth) { try { doctorChecks = require('./doctor').run().checks; } catch (_) { doctorChecks = []; } }
  const events = o.withHealth ? recentEvents() : [];
  const telemetryOff = getPath(loaded.switches, 'telemetry.enabled') === false;
  const sections = catalog.SECTIONS.map((s) => {
    const health = [];
    if (o.withHealth) {
      for (const piece of s.healthPieces || []) {
        const d = doctorChecks.find((x) => x.piece === piece);
        if (d) health.push({ text: `${piece}: ${d.detail}`, status: d.status, fix: d.fix || null });
      }
      if (!health.length && (s.healthEvents || []).length) {
        health.push({ text: `from the local log: ${s.healthEvents.map((ev) => `${ev} ${events.filter((x) => x.event === ev).length}×`).join(', ')}`, status: 'log', fix: null });
      }
      if (!health.length) health.push({ text: 'No check for this piece yet. You can see it at work in the agent\'s messages.', status: 'unknown', fix: null });
      if (telemetryOff && s.key !== 'telemetry') health.push({ text: 'The local log is off, so these numbers stopped counting.', status: 'off', fix: null });
    }
    return {
      key: s.key, name: s.name, group: s.group, what: s.what, forYou: s.forYou, ifOff: s.ifOff,
      headings: s.headings || [], headingsWhy: s.headingsWhy || '', primary: s.primary, doc: `docs/${s.doc}${s.docAnchor ? `#${s.docAnchor}` : ''}`,
      settings: settings.filter((x) => x.section === s.key).map((x) => x.name),
      health,
    };
  });
  // A setting in the defaults file whose group isn't in the catalog is still listed.
  for (const x of settings) {
    let s = sections.find((y) => y.key === x.section);
    if (!s) {
      s = { key: x.section, name: x.section, group: 'behind', what: '', forYou: '', ifOff: '', headings: [], primary: null, doc: 'docs/switches.md', settings: [], health: [] };
      sections.push(s);
    }
    if (!s.settings.includes(x.name)) s.settings.push(x.name);
  }

  const skills = listSkills();
  return {
    switchesFile: core.P.switchesUser,
    appliesFrom: 'your next message (no restart needed)',
    problems,
    groups: catalog.GROUPS,
    sections,
    settings,
    notSwitchableHere: catalog.NOT_SWITCHABLE.map((x) => (x.id === 'skills'
      ? { ...x, name: `${skills.length} skills`, ...(o.withSkills ? { skills } : {}) } : x)),
  };
}

module.exports = { NOT_BOUND, locate, commentAbove, defaultEntries, describe, coerce, setSetting, setMany, getPath, catalogEntry, inferAllowed, sectionFor, listSettings, listSkills, cliFor };

#!/usr/bin/env node
'use strict';
// Build check: no shipped skill or doc should send the reader to something that does not exist.
//
// This check HEALS; it never fails the build. When a skill or doc points at a setup checkpoint, a
// setting, an alignment-harness command or a docs page that does not exist:
//   - if exactly one real thing is plainly what was meant (a renamed or mistyped setting, command,
//     checkpoint or page with one obvious match), it rewrites the pointer itself and prints exactly
//     what it changed (file:line, old text, new text);
//   - otherwise it leaves the text alone and says, loudly and in plain words, where the pointer is
//     and what is missing, so a person can decide.
// Either way it exits 0 and the build carries on.
//
// Why. About twenty skills once said "if the person has connected an Obsidian vault (see
// /alignment-harness:harness-setup)", but setup has no vault step. An agent following that line goes
// looking for a step, a setting or a command that isn't there, and either stalls or invents one.
// This check reads the real lists at run time and looks for any reference outside them:
//
//   checkpoint  a harness-setup checkpoint, by number or name ("harness-setup, checkpoint 4",
//               "checkpoint \"memory-search\"", "the oracles checkpoint", "setup mark voice"),
//               and any line that sends the reader to harness-setup for a vault when setup has no
//               vault step. Real list: the "## Checkpoint N — name:" headings in
//               skills/harness-setup/SKILL.md.
//   switch      a setting named in backticks as a setting: a dotted name that starts with a real
//               section (`turnEnd.scoreAbove`), a name right next to the word switch / setting /
//               config (`emit_work_complete_marker` is enabled in your config), or the name after
//               `alignment-harness switch`. Real list: every key in config/switches.default.jsonc.
//   command     `alignment-harness <word>` inside code (backticks or a code block). Real list: the
//               `case '...'` labels of the command dispatcher in bin/alignment-harness.
//   page        a docs page: `docs/<page>.md` in README.md, or in a skill or doc when the plugin is
//               named right beside it ("`docs/governer.md` in the plugin"), and any relative
//               markdown link to a .md file in README.md or docs/. Real list: the files on disk.
//
// A fifth kind is only REPORTED, never changed (the words are the author's, so what to do is his call):
//   skill      a skill named as /name or /alignment-harness:name that does not ship in skills/. Real list:
//              the folders under skills/. Only names with a hyphen are looked at (/api, /me and other
//              paths are not skill names), and Claude Code's own built-in commands are left out.
//
// Scanned: every .md file under skills/, every .md file in docs/, and README.md. CHANGELOG.md is
// not scanned, because it records names that existed at the time.
//
// Usage: node scripts/check-dangling-references.js [plugin folder]   (default: this plugin; repairs files)
//        node scripts/check-dangling-references.js --skills            (also lists every skill name pointed at that does not ship)
//        node scripts/check-dangling-references.js --no-write [folder] (only reports; changes nothing)
//        node scripts/check-dangling-references.js --self-test         (checks the checker on made-up text)
// The exit code is always 0, even if something goes wrong inside the check: a build is never stopped by it.

const fs = require('fs');
const path = require('path');

// ── The real lists, read from their sources ────────────────────────────────

function checkpoints(root) {
  const text = fs.readFileSync(path.join(root, 'skills', 'harness-setup', 'SKILL.md'), 'utf8');
  const byNumber = new Map();
  for (const m of text.matchAll(/^##\s+Checkpoint\s+(\d+)\s+[—-]+\s+([a-z][a-z-]*)\s*:/gim)) byNumber.set(Number(m[1]), m[2].toLowerCase());
  if (!byNumber.size) throw new Error('no "## Checkpoint N — name:" headings found in skills/harness-setup/SKILL.md');
  return { byNumber, names: new Set(byNumber.values()), mentionsVault: /\bvault\b/i.test(text) };
}

// Strip // and /* */ comments outside strings, and trailing commas, then parse.
function readJsonc(file) {
  const src = fs.readFileSync(file, 'utf8');
  let out = ''; let inStr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) { out += c; if (c === '\\') { out += src[++i]; } else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 1; continue; }
    out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

function switchKeys(root) {
  const keys = new Set();
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const name = prefix ? `${prefix}.${k}` : k;
      keys.add(name);
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, name);
    }
  };
  walk(readJsonc(path.join(root, 'config', 'switches.default.jsonc')), '');
  const sections = new Set([...keys].filter((k) => !k.includes('.')));
  const suffixes = new Set(); // "predictRequiredSkills.oracleCommand", "oracleCommand", ...
  for (const k of keys) { const parts = k.split('.'); for (let i = 1; i < parts.length; i++) suffixes.add(parts.slice(i).join('.')); }
  return { keys, sections, suffixes };
}

function subcommands(root) {
  const text = fs.readFileSync(path.join(root, 'bin', 'alignment-harness'), 'utf8');
  const main = text.slice(text.indexOf('function main('));
  const body = main.slice(main.indexOf('switch (cmd)'));
  const names = new Set([...body.matchAll(/case '([a-z][a-z-]*)':/g)].map((m) => m[1]));
  if (!names.size) throw new Error('no `case \'...\':` labels found in the dispatcher of bin/alignment-harness');
  return names;
}

function docsPages(root) {
  return new Set(fs.readdirSync(path.join(root, 'docs')).filter((f) => f.endsWith('.md')));
}

function known(root) {
  return { cp: checkpoints(root), sw: switchKeys(root), cmds: subcommands(root), pages: docsPages(root), root };
}

// ── Working out what a broken pointer most likely meant ────────────────────

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}
const squash = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');

// The first rule that finds anything decides. If it finds exactly one thing, that is the repair;
// if it finds several, the pointer is ambiguous and a person decides (we return null).
function pickOne(rules, pool) {
  for (const rule of rules) {
    const hits = pool.filter(rule);
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) return null;
  }
  return null;
}

function suggest(heal, k) {
  const from = heal.from;
  if (heal.kind === 'switch') {
    const keys = [...k.sw.keys];
    const leaf = (x) => x.split('.').pop();
    return pickOne([
      (x) => squash(x) === squash(from),
      (x) => leaf(x) === leaf(from) && leaf(from).length >= 5,
      (x) => squash(leaf(x)) === squash(leaf(from)) && squash(leaf(from)).length >= 5,
      (x) => from.length >= 6 && lev(x, from) <= 1,
      (x) => leaf(from).length >= 6 && lev(leaf(x), leaf(from)) <= 1 && (x.includes('.') === from.includes('.')),
    ], keys);
  }
  if (heal.kind === 'command') {
    return pickOne([
      (x) => squash(x) === squash(from),
      (x) => x.replace(/s$/, '') === from.replace(/s$/, ''),
      (x) => from.length >= 5 && lev(x, from) <= 1,
    ], [...k.cmds]);
  }
  if (heal.kind === 'checkpoint') {
    const w = from.toLowerCase().trim().replace(/\s+/g, '-');
    return pickOne([
      (x) => squash(x) === squash(w),
      (x) => w.length >= 5 && lev(x, w) <= 1,
    ], [...k.cp.names]);
  }
  if (heal.kind === 'page') {
    const base = heal.base.replace(/\.md$/i, '');
    const found = pickOne([
      (x) => squash(x.replace(/\.md$/, '')) === squash(base),
      (x) => base.length >= 5 && lev(x.replace(/\.md$/, ''), base) <= 2,
    ], [...k.pages]);
    return found ? `${heal.prefix || ''}${found}` : null;
  }
  return null;
}

// ── Finding references in one file's text ──────────────────────────────────

const FILE_EXT = /\.(md|mdx|js|cjs|mjs|ts|tsx|jsx|json|jsonc|jsonl|sh|txt|py|css|html|yml|yaml|log|csv)$/i;
const IDENT_DOTTED = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+$/;
const IDENT_SETTINGLIKE = /^(?:[a-z][a-z0-9]*(?:_[a-z0-9]+)+|[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*)$/; // snake_case or camelCase

function normCheckpoint(words, cp) {
  const w = words.toLowerCase().trim().replace(/\s+/g, '-');
  const cands = [w, w.replace(/s$/, ''), `${w}s`, w.split('-').pop(), `${w.split('-').pop()}s`];
  return cands.some((c) => cp.names.has(c));
}

// Generic words that come before "checkpoint" without naming one ("the next checkpoint").
const NOT_A_NAME = new Set(['next', 'first', 'last', 'final', 'same', 'each', 'every', 'this', 'that', 'one', 'setup', 'harness-setup', 'alignment', 'verification', 'relevant', 'matching', 'previous', 'current']);

function scanText(rel, text, k) {
  const findings = [];
  const add = (lineNo, kind, missing, line, heal) => findings.push({ file: rel, line: lineNo, kind, missing, heal, excerpt: line.trim().slice(0, 110) });
  const isReadme = rel === 'README.md';
  const inDocs = rel.startsWith(`docs${path.sep}`) || rel.startsWith('docs/');
  const isSetupSkill = /harness-setup[\\/]SKILL\.md$/.test(rel);
  let inFence = false;
  text.split('\n').forEach((line, i) => {
    const n = i + 1;
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }

    // checkpoint ───────────────────────────────────────────────────────────
    const aboutSetup = /harness-setup|\bsetup\b/i.test(line) && !isSetupSkill;
    if (aboutSetup) {
      for (const m of line.matchAll(/checkpoint\s*:?\s*#?(\d+)\b/gi)) {
        if (!k.cp.byNumber.has(Number(m[1]))) add(n, 'checkpoint', `harness-setup checkpoint ${m[1]} (setup has ${k.cp.byNumber.size})`, line);
      }
      for (const m of line.matchAll(/checkpoint\s*:?\s*["“]([^"”]+)["”]/gi)) {
        if (!normCheckpoint(m[1], k.cp)) add(n, 'checkpoint', `harness-setup checkpoint "${m[1]}"`, line, { kind: 'checkpoint', from: m[1] });
      }
      for (const m of line.matchAll(/\(checkpoint:\s*([a-z][a-z-]*)\)/gi)) {
        if (!normCheckpoint(m[1], k.cp)) add(n, 'checkpoint', `harness-setup checkpoint "${m[1]}"`, line, { kind: 'checkpoint', from: m[1] });
      }
      for (const m of line.matchAll(/\b(?:the|its)\s+([a-z][a-z-]*(?:\s+[a-z][a-z-]*)?)\s+checkpoint\b/gi)) {
        const words = m[1].toLowerCase();
        const last = words.split(/\s+/).pop();
        if (NOT_A_NAME.has(words) || NOT_A_NAME.has(last)) continue;
        if (!normCheckpoint(words, k.cp)) add(n, 'checkpoint', `harness-setup checkpoint "${m[1]}"`, line, { kind: 'checkpoint', from: m[1] });
      }
    }
    // A vault named just before a harness-setup pointer ("an Obsidian vault … (see harness-setup)").
    // Only the text right before the pointer counts, so "your principles vault" later in a line
    // about the oracles checkpoint is not mistaken for it.
    if (!k.cp.mentionsVault && !isSetupSkill) {
      for (const m of line.matchAll(/harness-setup/g)) {
        if (/\b(vault|obsidian)\b/i.test(line.slice(Math.max(0, m.index - 100), m.index + 30))) {
          add(n, 'checkpoint', 'a vault step in harness-setup (setup has no vault step)', line);
          break;
        }
      }
    }

    // code segments: the whole line inside a fence, otherwise each `inline span`
    const spans = [];
    if (inFence) spans.push({ code: line, start: 0, end: line.length, fenced: true });
    else for (const m of line.matchAll(/`([^`]+)`/g)) spans.push({ code: m[1], start: m.index, end: m.index + m[0].length, fenced: false });

    for (const s of spans) {
      // command ────────────────────────────────────────────────────────────
      for (const m of s.code.matchAll(/(?<![\w<>/:.@-])alignment-harness\s+([a-z][a-z-]*)(?:\s+([^\s`|;&)]+))?(?:\s+([^\s`|;&)]+))?/g)) {
        // Only where a command would be run: the start of the code, after "$(", a pipe, ";",
        // "&&", or a shell keyword. Inside an echo'd sentence ("(alignment-harness not on PATH")
        // it is prose, not a command.
        if (!/(^\s*(\$\s+)?|\$\(\s*|[;&|]\s*|\b(then|do|else|xargs|exec|time)\s+)$/.test(s.code.slice(0, m.index))) continue;
        const sub = m[1];
        const ident = (t) => t && /^[A-Za-z]/.test(t); // skip <placeholders>, "…" and "$VAR"
        if (!k.cmds.has(sub)) { add(n, 'command', `alignment-harness ${sub}`, line, { kind: 'command', from: sub }); continue; }
        if (sub === 'switch' && ident(m[2]) && !k.sw.keys.has(m[2])) add(n, 'switch', `${m[2]} (after alignment-harness switch)`, line, { kind: 'switch', from: m[2] });
        if (sub === 'setup' && m[2] === 'mark' && ident(m[3]) && m[3] !== 'complete' && !k.cp.names.has(m[3])) add(n, 'checkpoint', `setup mark ${m[3]}`, line, { kind: 'checkpoint', from: m[3] });
      }
      if (s.fenced) continue;
      // switch ─────────────────────────────────────────────────────────────
      const tok = s.code.trim();
      if (IDENT_DOTTED.test(tok) && !FILE_EXT.test(tok) && k.sw.sections.has(tok.split('.')[0])) {
        if (!k.sw.keys.has(tok)) add(n, 'switch', tok, line, { kind: 'switch', from: tok });
        continue;
      }
      if (IDENT_DOTTED.test(tok) || IDENT_SETTINGLIKE.test(tok)) {
        if (FILE_EXT.test(tok)) continue;
        const after = line.slice(s.end, s.end + 70).split(/[.;:!?](?:\s|$)/)[0];
        const before = line.slice(Math.max(0, s.start - 30), s.start);
        // "switch" is the harness's own word for a setting, so "the `x` switch" always counts.
        // "setting" and "config" are generic (Claude Code's `cleanupPeriodDays` setting, an
        // example app's `test_mode` setting), so they count only on a line about the harness's
        // own config, and never for a setting the line says belongs to Claude Code.
        const harnessLine = /alignment-harness|\bharness\b|switches file|switches\.jsonc/i.test(line);
        const claudeCodeOwns = /Claude Code\b[^`.]{0,40}$/.test(line.slice(Math.max(0, s.start - 60), s.start));
        const namedAsSwitch = /^\s*switch\b/i.test(after) || /\bswitch\s*$/i.test(before);
        const namedAsSetting = /^\s*setting\b/i.test(after)
          || /^\s*(is|are)\s+(enabled|disabled|on|off|set)\b[^`]*\b(config|switches)\b/i.test(after)
          || /\bsetting\s*$/i.test(before);
        const counts = namedAsSwitch || (namedAsSetting && harnessLine && !claudeCodeOwns);
        if (counts && !k.sw.keys.has(tok) && !k.sw.suffixes.has(tok)) add(n, 'switch', tok, line, { kind: 'switch', from: tok });
      }
    }
    if (inFence) return;

    // page ─────────────────────────────────────────────────────────────────
    for (const m of line.matchAll(/(^|[\s(`'"[])docs\/([A-Za-z0-9_.-]+\.md)\b/g)) {
      const at = m.index + m[1].length;
      const near = line.slice(Math.max(0, at - 40), at + m[2].length + 45);
      if ((isReadme || /\bplugin('s)?\b(?!\s*folder)/i.test(near)) && !k.pages.has(m[2])) add(n, 'page', `docs/${m[2]}`, line, { kind: 'page', from: `docs/${m[2]}`, base: m[2], prefix: 'docs/' });
    }
    if (isReadme || inDocs) {
      for (const m of line.matchAll(/\]\(([^)\s#]+\.md)(#[^)]*)?\)/g)) {
        const target = m[1];
        if (/^[a-z]+:/i.test(target)) continue; // http:, mailto:, ...
        const resolved = path.resolve(k.root, path.dirname(rel), target);
        if (!fs.existsSync(resolved)) {
          const inDocsFolder = path.dirname(resolved) === path.join(k.root, 'docs');
          add(n, 'page', path.relative(k.root, resolved), line, inDocsFolder ? { kind: 'page', from: target, base: path.basename(target), prefix: target.slice(0, target.length - path.basename(target).length) } : undefined);
        }
      }
    }
  });
  return findings;
}

function files(root) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk(path.join(root, 'skills'));
  const docs = path.join(root, 'docs');
  if (fs.existsSync(docs)) for (const f of fs.readdirSync(docs).sort()) if (f.endsWith('.md')) out.push(path.join(docs, f));
  if (fs.existsSync(path.join(root, 'README.md'))) out.push(path.join(root, 'README.md'));
  return out;
}

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Swap `from` for `to` on one line, only where it stands alone as a token (not inside a longer name).
function swapOnLine(line, heal, to) {
  const from = heal.from;
  if (heal.kind === 'command') {
    const re = new RegExp(`(alignment-harness\\s+)${esc(from)}(?![A-Za-z-])`);
    return re.test(line) ? line.replace(re, (_, a) => `${a}${to}`) : null;
  }
  const re = new RegExp(`(?<![A-Za-z0-9_.-])${esc(from)}(?![A-Za-z0-9_])`);
  return re.test(line) ? line.replace(re, () => to) : null;
}

// Look at one file's text. Returns the (possibly repaired) text, what was repaired, and what needs a person.
function healText(rel, text, k, write) {
  const found = scanText(rel, text, k);
  const lines = text.split('\n');
  const repaired = [];
  const needsPerson = [];
  for (const f of found) {
    const to = f.heal ? suggest(f.heal, k) : null;
    const swapped = to && write ? swapOnLine(lines[f.line - 1], f.heal, to) : null;
    if (to && write && swapped !== null) {
      repaired.push({ ...f, from: f.heal.from, to });
      lines[f.line - 1] = swapped;
    } else if (to && !write) {
      needsPerson.push({ ...f, wouldUse: to });
    } else {
      needsPerson.push(f);
    }
  }
  return { text: lines.join('\n'), repaired, needsPerson, found };
}

// Skill names a shipped skill or doc points at that do not ship. Report only: nothing is repaired.
const BUILT_IN_COMMANDS = new Set(['add-dir', 'output-style', 'pr-comments', 'release-notes', 'terminal-setup', 'install-github-app', 'install-slack-app', 'security-review', 'code-review', 'permissions-help']);
// Words that look like a skill name but are the plugin's own name or a placeholder in an example.
const NOT_SKILL_NAMES = new Set(['alignment-harness', 'skill-name']);
function shippedSkills(root) {
  try { return new Set(fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)); } catch (_) { return new Set(); }
}
function skillReferencesInText(rel, text, skills) {
  const found = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(?<![\w/.~:@<>-])\/(?:alignment-harness:)?([a-z][a-z0-9]*(?:-[a-z0-9]+)+)(?![\w/.\-@])/g)) {
      const name = m[1];
      if (skills.has(name) || BUILT_IN_COMMANDS.has(name) || NOT_SKILL_NAMES.has(name) || /^skill-\d+$/.test(name)) continue;
      found.push({ file: rel, line: i + 1, name });
    }
  });
  return found;
}
function unshippedSkills(root) {
  const skills = shippedSkills(root);
  if (!skills.size) return new Map();
  const byName = new Map();
  for (const f of files(root)) {
    for (const r of skillReferencesInText(path.relative(root, f), fs.readFileSync(f, 'utf8'), skills)) {
      if (!byName.has(r.name)) byName.set(r.name, []);
      byName.get(r.name).push(`${r.file}:${r.line}`);
    }
  }
  return byName;
}

function scan(root, write) {
  const k = known(root);
  const out = { repaired: [], needsPerson: [], found: 0, couldNotWrite: [], unshipped: new Map() };
  for (const f of files(root)) {
    const rel = path.relative(root, f);
    const before = fs.readFileSync(f, 'utf8');
    const r = healText(rel, before, k, write);
    out.found += r.found.length;
    out.needsPerson.push(...r.needsPerson);
    if (r.repaired.length) {
      try { fs.writeFileSync(f, r.text); out.repaired.push(...r.repaired); }
      catch (e) { out.couldNotWrite.push(rel); out.needsPerson.push(...r.repaired); }
    }
  }
  try { out.unshipped = unshippedSkills(root); } catch (_) { /* a report-only extra never stops the check */ }
  return out;
}

const kindWords = { checkpoint: 'a setup step', switch: 'a setting', command: 'an alignment-harness command', page: 'a docs page' };

function report(r, write) {
  const w = (t) => process.stdout.write(t);
  for (const f of r.repaired) {
    w(`REPAIRED  ${f.file}:${f.line}  pointed at ${kindWords[f.kind]} that does not exist, \`${f.from}\`; now points at \`${f.to}\`, the one real thing with that name.\n`);
  }
  for (const f of r.needsPerson) {
    const why = f.wouldUse
      ? `A normal run would change it to \`${f.wouldUse}\`; this run only reports, so the text is untouched.`
      : 'I could not tell for certain what it should say, so I left the text alone.';
    w(`NEEDS A PERSON  ${f.file}:${f.line}  points at ${kindWords[f.kind]} that does not exist: ${f.missing}. ${why} The line reads: ${f.excerpt}\n`);
  }
  if (r.unshipped && r.unshipped.size) {
    const n = r.unshipped.size;
    w(`\nREPORT ONLY (nothing was changed; the words are the author's, so what to do is his call): ${n} skill name${n === 1 ? ' is' : 's are'} pointed at but do not ship in skills/. The full list, with where each is named: node scripts/check-dangling-references.js --skills\n`);
    if (r.listSkills) for (const [name, where] of [...r.unshipped.entries()].sort()) w(`  /${name}  named at ${where.slice(0, 6).join(', ')}${where.length > 6 ? ` and ${where.length - 6} more` : ''}\n`);
  }
  if (r.couldNotWrite.length) w(`COULD NOT WRITE  ${r.couldNotWrite.join(', ')}: the repair was not saved (files not writable here), so those pointers are listed above as needing a person.\n`);
  if (!r.repaired.length && !r.needsPerson.length) {
    if (r.unshipped && r.unshipped.size) w('No other pointer to a missing step, setting, command or docs page.\n');
    else w('PASSED: every setup checkpoint, setting, alignment-harness command and docs page named in skills and docs exists.\n');
    return;
  }
  w(`\nDangling pointers: ${r.repaired.length} repaired by this check, ${r.needsPerson.length} need a person${write ? '' : ' (report-only run: nothing was changed)'}. This never stops the build.\n`);
  if (r.needsPerson.length) w('  For each NEEDS A PERSON line: point the text at something real (a checkpoint in skills/harness-setup/SKILL.md, a key in config/switches.default.jsonc,\n  a command in bin/alignment-harness, a page in docs/), or say plainly what it would use if the person has it.\n');
}

function selfTest() {
  const root = path.join(__dirname, '..');
  const k = known(root);
  let allGood = true;
  const expect = (cond, what) => { process.stdout.write(`${cond ? '  ok      ' : '  NOTICE  '} ${what}\n`); if (!cond) allGood = false; };
  const scanKinds = (rel, text) => scanText(rel, text, k).map((f) => `${f.kind}:${f.missing}`);
  const hit = (rel, text, kind, needle) => scanKinds(rel, text).some((s) => s.startsWith(`${kind}:`) && s.includes(needle));
  const heal = (rel, text) => healText(rel, text, k, true);
  const realCp = [...k.cp.byNumber.entries()][0];
  expect(k.cp.byNumber.size > 0 && k.sw.keys.size > 0 && k.cmds.size > 0 && k.pages.size > 0, `the real lists were read (${k.cp.byNumber.size} checkpoints, ${k.sw.keys.size} settings, ${k.cmds.size} commands, ${k.pages.size} pages)`);

  // made-up references are noticed and reported (nothing real to point at, so a person decides)
  expect(hit('skills/x/SKILL.md', 'Set it up (`/alignment-harness:harness-setup`, checkpoint 42).', 'checkpoint', '42'), 'a made-up checkpoint number is noticed');
  expect(hit('skills/x/SKILL.md', 'See `/alignment-harness:harness-setup` checkpoint "crystal-ball".', 'checkpoint', 'crystal-ball'), 'a made-up checkpoint name is noticed');
  expect(hit('skills/x/SKILL.md', 'Run `/alignment-harness:harness-setup` (the telepathy checkpoint) first.', 'checkpoint', 'telepathy'), 'a made-up "the X checkpoint" is noticed');
  if (!k.cp.mentionsVault) expect(hit('skills/x/SKILL.md', 'If you have an Obsidian vault (see `/alignment-harness:harness-setup`), file there.', 'checkpoint', 'vault'), 'a harness-setup pointer for a vault is noticed while setup has no vault step');
  expect(hit('skills/x/SKILL.md', 'Raise `turnEnd.madeUpDial` if it fires too often.', 'switch', 'turnEnd.madeUpDial'), 'a made-up dotted setting under a real section is noticed');
  expect(hit('skills/x/SKILL.md', 'Print it if `emit_made_up_marker` is enabled in your alignment-harness config.', 'switch', 'emit_made_up_marker'), 'a made-up setting named next to "config" is noticed');
  expect(hit('skills/x/SKILL.md', 'Run `alignment-harness switch governer.notARealDial off`.', 'switch', 'governer.notARealDial'), 'a made-up setting after `alignment-harness switch` is noticed');
  expect(hit('skills/x/SKILL.md', 'Then run `alignment-harness teleport --now`.', 'command', 'teleport'), 'a made-up alignment-harness subcommand is noticed');
  expect(hit('skills/x/SKILL.md', '```bash\nalignment-harness frobnicate\n```', 'command', 'frobnicate'), 'a made-up subcommand inside a code block is noticed');
  expect(hit('skills/x/SKILL.md', 'Record it: `alignment-harness setup mark crystal-ball done`.', 'checkpoint', 'crystal-ball'), 'a made-up checkpoint after `setup mark` is noticed');
  expect(hit('README.md', 'Read [the guide](docs/no-such-page.md).', 'page', 'no-such-page.md'), 'a README link to a missing docs page is noticed');
  expect(hit('docs/fixture.md', 'See [the guide](no-such-page.md).', 'page', 'no-such-page.md'), 'a docs link to a missing page is noticed');
  expect(hit('skills/x/SKILL.md', 'Docs: `docs/no-such-page.md` in the plugin.', 'page', 'no-such-page.md'), 'a skill naming a missing plugin docs page is noticed');
  const unfixable = heal('skills/x/SKILL.md', 'Run `alignment-harness teleport --now` and see checkpoint "crystal-ball" in `/alignment-harness:harness-setup`.');
  expect(unfixable.repaired.length === 0 && unfixable.needsPerson.length >= 2 && unfixable.text.includes('teleport'), 'a made-up reference with no obvious real match is reported and the text is left alone');

  // near-misses with one obvious real match are repaired in the text
  const realKey = [...k.sw.keys].find((x) => x.includes('.') && x.split('.').pop().length >= 7);
  if (realKey) {
    const typo = realKey.slice(0, -1);
    const r = heal('skills/x/SKILL.md', `Raise \`${typo}\` if it fires too often.`);
    expect(r.repaired.length === 1 && r.text.includes(`\`${realKey}\``) && !r.text.includes(`\`${typo}\``), `a mistyped setting (\`${typo}\`) is repaired to the one real setting \`${realKey}\``);
  }
  const realCmd = [...k.cmds].find((x) => x.length >= 6);
  if (realCmd) {
    const r = heal('skills/x/SKILL.md', `Run \`alignment-harness ${realCmd}x --now\`.`);
    expect(r.repaired.length === 1 && r.text.includes(`alignment-harness ${realCmd} --now`), `a mistyped command (\`${realCmd}x\`) is repaired to \`${realCmd}\``);
  }
  const realPage = [...k.pages].find((x) => x.length >= 10);
  if (realPage) {
    const typoPage = realPage.replace(/\.md$/, 'z.md');
    const r = heal('README.md', `Read [the guide](docs/${typoPage}).`);
    expect(r.repaired.length === 1 && r.text.includes(`docs/${realPage}`), `a mistyped docs page (\`${typoPage}\`) is repaired to \`${realPage}\``);
  }
  const realCpName = [...k.cp.names].find((x) => x.length >= 6);
  if (realCpName) {
    const typoCp = realCpName.slice(0, -1);
    const r = heal('skills/x/SKILL.md', `See \`/alignment-harness:harness-setup\` checkpoint "${typoCp}".`);
    expect(r.repaired.length === 1 && r.text.includes(`checkpoint "${realCpName}"`), `a mistyped checkpoint name ("${typoCp}") is repaired to "${realCpName}"`);
  }

  // skill names that do not ship are only reported
  const shipped = new Set(['align', 'real-skill-name']);
  const sk = (text) => skillReferencesInText('skills/x/SKILL.md', text, shipped).map((f) => f.name);
  expect(sk('Run `/made-up-skill-name` first.').join() === 'made-up-skill-name', 'a skill name that does not ship is reported');
  expect(sk('Run `/alignment-harness:ghost-skill` first.').join() === 'ghost-skill', 'a skill named with the plugin prefix that does not ship is reported');
  expect(sk('Use `/real-skill-name`, `/align`, `/api/admin-page` and `/add-dir`, the folder `~/x/some-dir/`, and `/skill-name`.').length === 0, 'shipped skills, paths, built-in commands and placeholders are not reported');
  const clean = [
    `See \`/alignment-harness:harness-setup\`, checkpoint ${realCp[0]}, and \`/alignment-harness:harness-setup\` checkpoint "${realCp[1]}".`,
    'Use `turnEnd.scoreAbove` or the `understanding.memorySearchCommand` setting; `alignment-harness switch coherenceGate.strength remind`.',
    'Run `alignment-harness doctor`, `alignment-harness records proposals` and `alignment-harness setup mark <checkpoint> done`.',
    'The plugin data folder is `~/.claude/plugins/data/<alignment-harness id>/`; `calibration.md` is a file; `scoreThresholds.reflectAbove` is a score field.',
    'Your project may keep `docs/notes.md` of its own, with whatever pages suit it.',
    'Each piece is explained in `docs/settings.md` in the plugin.',
    'Claude Code deletes sessions older than its `cleanupPeriodDays` setting; an app may read a `test_mode` setting.',
    '```bash\necho "no session id (alignment-harness not on PATH)"\nID="$(alignment-harness session-id)"\n```',
    'Change any of them with `alignment-harness switch …`. Query the oracle (see `/alignment-harness:harness-setup`, the oracles checkpoint) or say plainly there is no principles vault yet.',
    'If you keep a notes vault (such as Obsidian) for this project, file there; otherwise save the file in the project and give its path.',
  ].join('\n');
  const noise = [...scanText('skills/x/SKILL.md', clean, k), ...scanText('README.md', 'Read [settings](docs/settings.md) and docs/README.md.', k)];
  expect(noise.length === 0, `real checkpoints, settings, commands, pages and plain prose are left alone${noise.length ? ` (touched: ${noise.map((f) => f.missing).join(', ')})` : ''}`);
  process.stdout.write(allGood
    ? 'self-test: every made-up pointer was reported or repaired as expected\n'
    : 'self-test: NOTICE, the lines above marked NOTICE did not behave as expected, so this check may miss or wrongly touch pointers. The build is not stopped; please look at scripts/check-dangling-references.js.\n');
}

// Never stop a build: whatever happens inside, say so in plain words and exit 0.
try {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) selfTest();
  else {
    const write = !args.includes('--no-write');
    const folder = args.find((a) => !a.startsWith('--'));
    const result = scan(path.resolve(folder || path.join(__dirname, '..')), write);
    result.listSkills = args.includes('--skills');
    report(result, write);
  }
} catch (e) {
  process.stdout.write(`NOTICE  the dangling-pointer check could not run (${e && e.message ? e.message : e}). Nothing was changed and the build carries on; the check itself needs a look.\n`);
}
process.exit(0);

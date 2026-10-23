#!/usr/bin/env node
'use strict';
// Private-data scanner. FAILS (exit 1) if anything in the plugin looks like a
// secret or private detail that must never ship:
//   - API keys / tokens / private keys
//   - the author's home folder or any real-looking /Users/<name>/ path
//   - the author's private API server address and its endpoints
//   - UUID-shaped ids (notebook ids, keys) unless an obvious placeholder
//   - email addresses (other than example.com / example.org)
// It WARNS (does not fail) on names of the author's private product and tools,
// so a person can see what still reads as someone else's setup.
//
// It never prints a matched secret: each finding shows the rule, the file and
// line, and a masked excerpt.
//
// Usage: node scripts/scan-private.js [dir]   (default: the plugin folder)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const SKIP_DIRS = new Set(['.git', 'node_modules', '__pycache__']);
// Operating-system folder metadata. It is git-ignored junk that holds no content of ours, so it is
// neither scanned nor reported as an unscannable file.
const SKIP_FILES = new Set(['.DS_Store']);
const TEXT_EXT = /\.(md|txt|json|jsonc|js|cjs|mjs|ts|sh|py|yaml|yml|toml|html|css|csv)$/i;

const HOME_NAME = ['je', 'di'].join(''); // assembled so this file does not flag itself
const PRIVATE_PORT = ['localhost', ':', '3002'].join('');

// The one published contact address. Founder ruling 2026-10-16: it is his main email and it stays the
// public contact, in README.md only (not in LICENSE, which is the standard MIT text). The email and
// product-name rules would flag it, so it is blanked out of README.md lines before they are checked.
// Anywhere else, or any other address, still fails. Assembled so this file does not flag itself.
const PUBLIC_CONTACT = ['founder', '@', 'ixco', 'ach.com'].join('');
const PUBLIC_CONTACT_FILES = new Set(['README.md']);

const FAIL_RULES = [
  { id: 'anthropic-key', re: /sk-ant-[A-Za-z0-9_-]{16,}/ },
  { id: 'openai-style-key', re: /\bsk-(proj-)?[A-Za-z0-9]{24,}/ },
  { id: 'stripe-key', re: /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{10,}/ },
  { id: 'aws-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'github-token', re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}/ },
  { id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { id: 'google-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'private-key-block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'assigned-secret', re: /\b(api[_-]?key|apikey|secret|token|password|passwd)\b["']?\s*[:=]\s*["'][^"'\s$<{]{16,}["']/i },
  { id: 'password-value', re: /\bpass(word|wd)\b\*{0,2}\s*[:=]\s*\*{0,2}\s*[`'"]?(?![<$({\[])[^\s`'"]{6,}/i, filter: (m) => { const v = m[0].split(/[:=]/).slice(1).join('').replace(/[\s`'"*]/g, ''); return /[^A-Za-z]/.test(v) && !/^(convention|manager|reset|field|hash|policy|required|standard)/i.test(v); } },
  { id: 'api-key-header', re: /x-api-key:\s*[A-Za-z0-9][A-Za-z0-9-]{15,}/i },
  { id: 'author-home-path', re: new RegExp(`/Users/${HOME_NAME}\\b|/home/${HOME_NAME}\\b|~${HOME_NAME}\\b`) },
  { id: 'home-path', re: /\/Users\/[A-Za-z]|\/home\/(?!runner\b|dev\b)[a-z][a-z0-9_-]*\// }, // any real-looking home folder; write ~/ instead. "dev" is the plugin-dev sandbox's own generic Docker user (see plugin-dev/sandbox/Dockerfile), not a real person's machine.
  { id: 'author-handle', re: new RegExp(`\\b${HOME_NAME}\\b|jryan${'haber'}`, 'i') },
  { id: 'machine-temp-path', re: /\/private\/tmp\/claude-/ },
  { id: 'macos-only-shell', re: new RegExp(["sed -i ", "''", '|\\bstat -f\\b|\\bdate -j\\b'].join('')) },
  { id: 'private-api-server', re: new RegExp(PRIVATE_PORT.replace('.', '\\.')) },
  { id: 'private-api-endpoint', re: /\/api\/(gen3|developer\/proposals)\b/ },
  { id: 'uuid-id', re: /\b([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\b/i, filter: (m) => !isPlaceholderUuid(m[0]) },
  { id: 'email-address', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, filter: (m) => !/@(example\.(com|org|net)|users\.noreply\.github\.com)$/i.test(m[0]) && !/^noreply@anthropic\.com$/i.test(m[0]) && !/@[\d.]+$/.test(m[0]) && !/\.(png|jpe?g|svg|gif|webp)$/i.test(m[0]) },
];

const WARN_RULES = [
  { id: 'names-the-author', re: /\bJonathan\b|\bHaber\b/ },
];
const PRODUCT_RULES = [
  { id: 'author-product-name', re: new RegExp(['\\bix ?co', 'ach\\b|\\bixco', 'ach\\b|\\bgptco', 'ach2?\\b|\\bix-co', 'ach\\b'].join(''), 'i') },
];
FAIL_RULES.push(...PRODUCT_RULES);
WARN_RULES.push({ id: 'author-private-tool', re: /\bagent[-_]swarm\b|\bagent-find-cli\b|\bnlm notebook\b|--profile personal\b/i });

function isPlaceholderUuid(u) {
  const hex = u.replace(/-/g, '').toLowerCase();
  if (/^([0-9a-f])\1+$/.test(hex)) return true; // 00000000-..., 11111111-...
  if (/^0+[0-9]?$/.test(hex)) return true;
  const groups = u.toLowerCase().split('-');
  return groups.every((g) => /^([0-9a-f])\1*$/.test(g)); // each group one repeated char
}

function mask(s) {
  const t = String(s);
  if (t.length <= 8) return `${t.slice(0, 2)}…`;
  return `${t.slice(0, 4)}…${t.slice(-2)} (${t.length} chars)`;
}

function walk(dir, files) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (!SKIP_FILES.has(ent.name)) files.push(p);
  }
  return files;
}

// Files that must never ship (raw author writing, backups). The author's own
// samples may only ship as examples/author-approved-samples.md, after he
// explicitly approves a small set for publication.
const NEVER_SHIP = [/(^|\/)author-samples[^/]*$/i, /(^|\/)VERBATIM\.md$/, /\.bak[^/]*$/i, /\.backup[^/]*$/i, /\.pyc$/i, /(^|\/)\.env(\.|$)/];

function scan() {
  const failures = [];
  const warnings = [];
  const binaries = [];
  for (const file of walk(ROOT, [])) {
    const rel = path.relative(ROOT, file);
    if (NEVER_SHIP.some((re) => re.test(rel))) { failures.push({ rule: 'never-ship-file', file: rel, line: 0, excerpt: path.basename(rel) }); continue; }
    const isText = TEXT_EXT.test(file) || !path.extname(file);
    if (!isText) { binaries.push(rel); continue; }
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch (_) { continue; }
    if (text.includes('\u0000')) { binaries.push(rel); continue; }
    const lines = text.split('\n');
    lines.forEach((rawLine, i) => {
      const line = PUBLIC_CONTACT_FILES.has(rel) ? rawLine.split(PUBLIC_CONTACT).join('') : rawLine;
      for (const r of FAIL_RULES) {
        const g = new RegExp(r.re.source, r.re.flags.includes('g') ? r.re.flags : `${r.re.flags}g`);
        let m;
        while ((m = g.exec(line))) {
          if (!r.filter || r.filter(m)) failures.push({ rule: r.id, file: rel, line: i + 1, excerpt: mask(m[0]) });
          if (m[0].length === 0) g.lastIndex++;
        }
      }
      for (const r of WARN_RULES) {
        const m = line.match(r.re);
        if (m) warnings.push({ rule: r.id, file: rel, line: i + 1, excerpt: m[0] });
      }
    });
  }
  return { failures, warnings, binaries };
}

const res = scan();
const json = process.argv.includes('--json');
if (json) {
  process.stdout.write(`${JSON.stringify(res, null, 2)}\n`);
} else {
  for (const f of res.failures) process.stdout.write(`FAIL ${f.rule}  ${f.file}:${f.line}  ${f.excerpt}\n`);
  const byFile = {};
  for (const w of res.warnings) byFile[w.file] = (byFile[w.file] || 0) + 1;
  const warnFiles = Object.keys(byFile);
  if (warnFiles.length) {
    process.stdout.write(`WARN ${res.warnings.length} lines name the author or his private tools, in ${warnFiles.length} files (not a failure; check each is intended, e.g. attribution or a labelled example):\n`);
    for (const f of warnFiles.slice(0, 40)) process.stdout.write(`  ${f} (${byFile[f]})\n`);
  }
  if (res.binaries.length) process.stdout.write(`FAIL binary-or-unknown-file (not scannable, must not ship): ${res.binaries.join(', ')}\n`);
  process.stdout.write(res.failures.length || res.binaries.length
    ? `\nSCAN FAILED: ${res.failures.length} private-data findings, ${res.binaries.length} unscannable files.\n`
    : `\nSCAN PASSED: no secrets, private paths, private endpoints, ids or emails found in ${ROOT}.\n`);
}
process.exit(res.failures.length || res.binaries.length ? 1 : 0);

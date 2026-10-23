#!/usr/bin/env node
'use strict';
// Build check: no skill file may contain $1, $2 ... $9 or ${1} ... ${9...}.
//
// Why. When a skill runs as a slash command, Claude Code replaces $1, $2, $3 ... in the skill's text
// with words from the person's request (and it does so everywhere in the file: shell helpers, awk
// fields, and even a dollar amount written as "$1" in plain prose). A shell helper such as
//   local title="$2"
// then reaches the model as   local title="fix"   and silently stops doing its job. This check
// fails the build on any such token in skills/*/SKILL.md, so a skill cannot ship with it.
//
// There are no exemptions, because the replacement is textual: a token inside a code fence, a comment
// or a regex is replaced just the same. Rewrite the text instead (see the message below).
//
// Usage: node scripts/check-skill-arguments.js [plugin folder]   (default: this plugin)
//        node scripts/check-skill-arguments.js --self-test        (checks the checker on made-up skills)

const fs = require('fs');
const os = require('os');
const path = require('path');

const POSITIONAL = /\$(?:[1-9]|\{[1-9])/g;

const MESSAGE = [
  'Claude Code substitutes $1.. with the user\'s words in slash-command skills, so these tokens corrupt the skill when it runs.',
  'Pass values through environment variables, or use "$*" for all of the arguments. Avoid awk-style $2 field references',
  '(use cut, sort -k or jq instead), and write a dollar amount in words ("one dollar") instead of "$1".',
].join('\n  ');

function scan(root) {
  const skillsDir = path.join(root, 'skills');
  const findings = [];
  if (!fs.existsSync(skillsDir)) return findings;
  for (const name of fs.readdirSync(skillsDir).sort()) {
    const file = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const tokens = line.match(POSITIONAL);
      if (tokens) findings.push({ file: path.relative(root, file), line: i + 1, tokens: [...new Set(tokens)], excerpt: line.trim().slice(0, 100) });
    });
  }
  return findings;
}

function report(findings) {
  for (const f of findings) process.stdout.write(`FAIL positional-argument  ${f.file}:${f.line}  ${f.tokens.join(' ')}   ${f.excerpt}\n`);
  const files = new Set(findings.map((f) => f.file));
  if (!findings.length) {
    process.stdout.write('PASSED: no $1-style positional arguments in any skill file.\n');
    return 0;
  }
  process.stdout.write(`\nFAILED: ${findings.length} positional arguments in ${files.size} skill file${files.size === 1 ? '' : 's'}.\n  ${MESSAGE}\n`);
  return 1;
}

function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-args-'));
  const mk = (name, body) => { fs.mkdirSync(path.join(tmp, 'skills', name), { recursive: true }); fs.writeFileSync(path.join(tmp, 'skills', name, 'SKILL.md'), body); };
  let ok = true;
  const expect = (cond, what) => { process.stdout.write(`${cond ? '  ok  ' : '  FAIL'} ${what}\n`); if (!cond) ok = false; };
  try {
    mk('shell-helper', 'helper() {\n  local title="$2"\n}\n');
    mk('braced', 'echo "${1:-default}"\n');
    mk('awk-field', "awk '{print $3}'\n");
    mk('dollar-prose', 'Invite them to continue for $1.\n');
    mk('clean', 'Pass values as environment variables: TITLE="$TITLE" run "$*" and use $ARGUMENTS and $NF and $HOME.\n');
    const names = scan(tmp).map((f) => f.file.split(path.sep)[1]);
    expect(names.includes('shell-helper'), 'a shell helper using "$2" is flagged');
    expect(names.includes('braced'), 'a braced ${1:-default} is flagged');
    expect(names.includes('awk-field'), 'an awk field $3 is flagged');
    expect(names.includes('dollar-prose'), 'a dollar amount "$1" in prose is flagged');
    expect(!names.includes('clean'), '"$*", $ARGUMENTS, $NF and $HOME are not flagged');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  process.stdout.write(ok ? 'self-test PASSED\n' : 'self-test FAILED\n');
  return ok ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--self-test') process.exit(selfTest());
process.exit(report(scan(path.resolve(arg || path.join(__dirname, '..')))));

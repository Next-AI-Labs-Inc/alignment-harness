#!/usr/bin/env node
'use strict';
// Settings test: the shared settings writer, `alignment-harness switch`, `settings list`, the
// settings page's server, and the two understanding switches that used to do nothing.
// Runs against a throwaway data folder, never your real one. No network beyond 127.0.0.1.
//   node plugin-dev/tests-smoke/settings-test.js   (PLUGIN_DIR=<path> to test another copy)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = process.env.PLUGIN_DIR || path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-settings-'));
const DATA = path.join(TMP, 'data');
const ENV = { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT, CLAUDE_PLUGIN_DATA: DATA, ALIGNMENT_HARNESS_NO_OPEN: '1' };
const BIN = path.join(ROOT, 'bin', 'alignment-harness');
const FILE = path.join(DATA, 'switches.jsonc');
let PASS = 0; let FAIL = 0;
const ok = (m) => { PASS++; process.stdout.write(`  ok   ${m}\n`); };
const bad = (m) => { FAIL++; process.stdout.write(`  FAIL ${m}\n`); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

function cli(...args) {
  try { return { code: 0, out: execFileSync('node', [BIN, ...args], { env: ENV, encoding: 'utf8' }) }; } catch (e) { return { code: e.status || 1, out: `${e.stdout || ''}${e.stderr || ''}` }; }
}
const comments = (t) => (t.match(/\/\//g) || []).length;
// The settings that exist, straight from the shared reader (in this process, on the test folder).
process.env.CLAUDE_PLUGIN_DATA = DATA;
const settingsLib = require(path.join(ROOT, 'lib', 'settings'));
const entries = () => settingsLib.defaultEntries().map((e) => { const d = settingsLib.describe(e.name); return { ...e, allowed: d.allowed, label: d.label }; });
// Effective values as the hooks see them: `config show` (your file merged over the defaults).
const coreLib = require(path.join(ROOT, 'lib', 'core'));
const effective = (name) => settingsLib.getPath(coreLib.loadSwitches().switches, name);
const listJson = () => JSON.parse(cli('settings', 'list', '--json').out);
const shown = (env) => JSON.parse(execFileSync('node', [BIN, 'config', 'show'], { env: env || ENV, encoding: 'utf8' }).replace(/\nproblem: [\s\S]*$/, ''));

// A value the setting accepts that is not its default.
function otherValue(s) {
  const a = s.allowed;
  if (a.type === 'boolean') return s.default ? 'off' : 'on';
  if (a.type === 'enum') return a.values.find((v) => v !== s.default);
  if (a.type === 'integer') return String(s.default + 1 <= a.max ? s.default + 1 : s.default - 1);
  return 'echo settings-test';
}
const cliText = (v) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v));

// ── 4. The /harness skill reads the list instead of keeping its own ────────
function skillTests() {
  process.stdout.write('settings: the /harness skill and the docs name only settings that exist\n');
  const names = new Set(entries().map((e) => e.name));
  for (const f of ['skills/harness/SKILL.md', 'docs/settings.md', 'docs/switches.md']) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const named = [...text.matchAll(/`(?:alignment-harness (?:switch|settings get) )?((?:coherenceGate|governer|evidenceGate|understanding|scope|subagents|turnEnd|correctionPatterns|intentSearchGate|sessionEnd|telemetry|permissions)\.[A-Za-z.]+)/g)].map((m) => m[1].replace(/\.$/, ''));
    const unknown = named.filter((n) => !names.has(n) && !/\.(jsonl?|md|txt)$/.test(n));
    check(named.length > 0 && unknown.length === 0, `${f} names ${named.length} settings, all real${unknown.length ? ` (unknown: ${unknown.join(', ')})` : ''}`);
  }
  const skill = fs.readFileSync(path.join(ROOT, 'skills/harness/SKILL.md'), 'utf8');
  check(/settings list --json/.test(skill) && !/^\| Piece \| Switch \|/m.test(skill), 'the skill reads `settings list --json` instead of a hand-written table');
  // The founder's ruling: explain the headings during onboarding; never change the harness to onboard.
  const headingsWhy = /check-in notes/;
  const coherence = listJson().sections.find((x) => x.key === 'coherenceGate');
  check(headingsWhy.test(coherence.headingsWhy) && coherence.headings.length === 3, "the page's Coherence check entry says what each heading is for and why the agent writes it");
  check(['docs/settings.md', 'README.md', 'skills/harness/SKILL.md'].every((f) => headingsWhy.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))), 'docs/settings.md, the README and the /harness skill explain the headings');
  check(['docs/README.md', 'docs/harness-command.md', 'docs/switches.md', 'README.md'].every((f) => /settings\.md/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))), 'the docs index, the /harness doc, the switches doc and the README all point to the settings page');
  const { sid, tp } = freshSession();
  const startOut = execFileSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'session-start'], { env: ENV, input: JSON.stringify({ session_id: sid, transcript_path: tp, hook_event_name: 'SessionStart', source: 'startup' }), encoding: 'utf8' });
  check(!headingsWhy.test(startOut), 'session start is unchanged: no onboarding line was added to the hook');
}

async function main() {
  // ── 1. The shared writer, through `alignment-harness switch` ──────────────
  process.stdout.write('settings: the shared writer keeps your file exactly as it was\n');
  cli('config', 'path');
  const snapshot = fs.readFileSync(FILE, 'utf8');
  const all = entries();
  const TOTAL = all.length;
  check(TOTAL >= 47, `every setting in the defaults file is listed (${TOTAL})`);
  const catalogued = all.filter((s) => s.label !== s.name.split('.').slice(1).join('.'));
  check(catalogued.length === all.length, `every setting has a plain-words name (${catalogued.length} of ${all.length})`);

  let flipped = 0; let commentsKept = 0; let readBack = 0; const failures = [];
  for (const s of all) {
    const v = otherValue(s);
    const r = cli('switch', s.name, v);
    const after = effective(s.name);
    const text = fs.readFileSync(FILE, 'utf8');
    if (r.code === 0 && JSON.stringify(after) !== JSON.stringify(s.default)) readBack++; else failures.push(`${s.name}: ${r.out.trim()}`);
    if (comments(text) === comments(snapshot)) commentsKept++;
    cli('switch', s.name, cliText(s.default) === '' ? '' : cliText(s.default));
    flipped++;
  }
  check(readBack === all.length, `each of the ${all.length} settings changes and reads back changed (${readBack})${failures.length ? `: ${failures.slice(0, 3).join(' | ')}` : ''}`);
  check(commentsKept === all.length, `every comment survives every change (${commentsKept} of ${all.length})`);
  check(fs.readFileSync(FILE, 'utf8') === snapshot, `after flipping all ${flipped} back, the file is byte-for-byte what it was`);

  // The reported bug: a three-part name wiped every comment and replaced the block with "off".
  let r = cli('switch', 'governer.predictRequiredSkills.enabled', 'off');
  let text = fs.readFileSync(FILE, 'utf8');
  check(r.code === 0 && /"predictRequiredSkills": \{\s*"enabled": false,/.test(text), 'governer.predictRequiredSkills.enabled off changes only that value');
  check(comments(text) === comments(snapshot) && text.length - snapshot.length === 1, 'and keeps every comment (the old bug wiped them all)');
  cli('switch', 'governer.predictRequiredSkills.enabled', 'on');
  check(fs.readFileSync(FILE, 'utf8') === snapshot, 'turning it back on restores the file exactly');

  // Refusals change nothing.
  for (const [args, why] of [
    [['switch', 'governer.predictRequiredSkills', 'off'], 'a group of settings is refused'],
    [['switch', 'coherenceGate.noSuchThing', 'on'], 'an unknown name is refused'],
    [['switch', 'coherenceGate.strength', 'loud'], 'a value the setting does not accept is refused'],
    [['switch', 'coherenceGate.enabled', 'remind'], 'a word that is not on/off is refused for an on/off setting'],
    [['switch', 'evidenceGate.contractsAtScore', '500'], 'a number out of range is refused'],
  ]) {
    r = cli(...args);
    check(r.code !== 0 && fs.readFileSync(FILE, 'utf8') === snapshot, `${why}, and the file is untouched`);
  }
  r = cli('switch', 'coherenceGate.strength', 'on');
  check(r.code === 0 && /"strength": "block"/.test(fs.readFileSync(FILE, 'utf8')), '"on" for a strength still means its firmest setting');

  // A setting your file leaves out is added inside its own group, and the file stays readable.
  const partial = path.join(TMP, 'partial');
  fs.mkdirSync(partial, { recursive: true });
  fs.writeFileSync(path.join(partial, 'switches.jsonc'), '// mine\n{\n  // only this\n  "governer": { "gateStrength": "remind" }\n}\n');
  const penv = { ...ENV, CLAUDE_PLUGIN_DATA: partial };
  execFileSync('node', [BIN, 'switch', 'governer.predictRequiredSkills.enabled', 'off'], { env: penv, encoding: 'utf8' });
  execFileSync('node', [BIN, 'switch', 'telemetry.enabled', 'off'], { env: penv, encoding: 'utf8' });
  const pshown = execFileSync('node', [BIN, 'config', 'show'], { env: penv, encoding: 'utf8' });
  const val = (n) => settingsLib.getPath(JSON.parse(pshown.replace(/\nproblem: [\s\S]*$/, '')), n);
  const ptext = fs.readFileSync(path.join(partial, 'switches.jsonc'), 'utf8');
  check(val('governer.predictRequiredSkills.enabled') === false && val('telemetry.enabled') === false && val('governer.gateStrength') === 'remind' && !/problem:/.test(pshown),
    'a setting missing from a short file is added in its group; the rest of the file still counts');
  check(ptext.includes('// mine') && ptext.includes('// only this'), "the short file's own comments stay");

  // A file with a mistake is never written over; the harness reports it and runs on defaults.
  const broken = '{\n  "coherenceGate": { "strength": "remind" \n'; // missing braces
  fs.writeFileSync(FILE, broken);
  r = cli('switch', 'coherenceGate.strength', 'off');
  check(r.code !== 0 && fs.readFileSync(FILE, 'utf8') === broken && /mistake/.test(r.out), 'a switches file with a mistake is left exactly as it is, and the reason is said');
  fs.writeFileSync(FILE, snapshot);

  await pageTests(snapshot);
  understandingTests();
  skillTests();

  fs.rmSync(TMP, { recursive: true, force: true });
  process.stdout.write(`\nsettings: ${PASS} passed, ${FAIL} failed\n`);
  process.exit(FAIL ? 1 : 0);
}

// ── 2. `settings list --json` and the settings page's server ────────────────
function startPage() {
  return new Promise((resolve, reject) => {
    const p = spawn('node', [BIN, 'settings', 'open', '--no-open', '--idle-minutes', '5'], { env: ENV });
    let out = '';
    const t = setTimeout(() => reject(new Error(`page did not start: ${out}`)), 10000);
    p.stdout.on('data', (c) => { out += c; const m = out.match(/(http:\/\/127\.0\.0\.1:(\d+)\/\?key=([a-f0-9]+))/); if (m) { clearTimeout(t); resolve({ proc: p, url: m[1], port: Number(m[2]), key: m[3] }); } });
    p.on('exit', (code) => { clearTimeout(t); reject(new Error(`page exited (${code}): ${out}`)); });
  });
}
function request(page, method, pathname, { body, key, host, type } = {}) {
  const http = require('http');
  return new Promise((resolve, reject) => {
    const headers = { Host: host || `127.0.0.1:${page.port}` };
    if (key !== null) headers['X-Harness-Key'] = key === undefined ? page.key : key;
    const data = body === undefined ? null : (typeof body === 'string' ? body : JSON.stringify(body));
    if (data !== null) { headers['Content-Type'] = type || 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
    const req = http.request({ host: '127.0.0.1', port: page.port, method, path: pathname, headers }, (res) => {
      let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => { let j = null; try { j = JSON.parse(t); } catch (_) { /* text */ } resolve({ status: res.statusCode, text: t, json: j }); });
    });
    req.on('error', reject);
    if (data !== null) req.write(data);
    req.end();
  });
}
const setOnPage = (page, name, value) => request(page, 'POST', '/api/set', { body: { changes: [{ name, value }] } });
const typed = (s, v) => { const r = settingsLib.coerce({ name: s.name, allowed: s.allowed }, v); return r.ok ? r.value : v; };

function hook(name, event) {
  try { execFileSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), name], { env: ENV, input: JSON.stringify(event), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); return { code: 0, err: '' }; } catch (e) { return { code: e.status, err: String(e.stderr || '') }; }
}
let sidN = 0;
function freshSession() {
  sidN++;
  const sid = `5e771265-0000-0000-0000-${String(sidN).padStart(12, '0')}`;
  const tp = path.join(TMP, `${sid}.jsonl`); fs.writeFileSync(tp, '');
  return { sid, tp };
}
function coherenceBlocksEdit() {
  const { sid, tp } = freshSession();
  hook('user-prompt', { session_id: sid, transcript_path: tp, prompt: 'please change how the subscription is charged each month' });
  const r = hook('pre-tool', { session_id: sid, transcript_path: tp, tool_name: 'Edit', tool_input: { file_path: '/x.js' } });
  return r.code === 2 && /coherence check not completed/i.test(r.err);
}
function evidenceSendsBack() {
  const { sid, tp } = freshSession();
  fs.writeFileSync(tp, [
    { type: 'user', timestamp: '2026-01-01T00:00:00Z', message: { role: 'user', content: 'fix the charge bug' } },
    { type: 'assistant', timestamp: '2026-01-01T00:00:05Z', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Edit', input: { file_path: '/repo/src/billing.js', old_string: 'a', new_string: 'b' } }] } },
    { type: 'user', timestamp: '2026-01-01T00:00:06Z', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] } },
  ].map((x) => JSON.stringify(x)).join('\n') + '\n');
  const r = hook('stop', { session_id: sid, transcript_path: tp, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: 'Done. The bug is fixed and all tests pass.' });
  return /evidence-gate/.test(r.err);
}

async function pageTests(snapshot) {
  process.stdout.write('settings: the agent\'s list and the page\n');
  const list = listJson();
  const total = settingsLib.defaultEntries().length;
  check(list.settings.length === total && list.problems.length === 0, `settings list --json lists every setting in the defaults file (${list.settings.length} of ${total})`);
  const needed = ['name', 'value', 'default', 'allowed', 'forYou', 'whatItDoes', 'doc', 'howToChange', 'switchableOnPage'];
  check(list.settings.every((s) => needed.every((k) => k in s) && s.forYou && s.doc), 'each setting carries its value, allowed values, what it does for you, its doc and its command');
  check(list.settings.every((s) => fs.existsSync(path.join(ROOT, s.doc.split('#')[0]))), 'every doc link points at a page that exists');
  check(list.notSwitchableHere.length >= 5 && list.notSwitchableHere.some((x) => x.id === 'skills'), 'pieces with no switch are listed honestly, with the real way to turn each off');

  const page = await startPage();
  try {
    let r = await request(page, 'GET', `/?key=${page.key}`, { key: null });
    check(r.status === 200 && /Alignment harness: settings/.test(r.text) && !/__HARNESS_KEY__/.test(r.text), 'the page opens with its one-time key');
    r = await request(page, 'GET', '/', { key: null });
    check(r.status === 403, 'without the key the page refuses');
    r = await request(page, 'GET', '/api/settings', { key: 'wrong' });
    check(r.status === 403, 'a wrong key is refused');
    r = await request(page, 'GET', `/?key=${page.key}`, { key: null, host: `evil.example.com:${page.port}` });
    check(r.status === 421, 'a request naming another host is refused');
    r = await request(page, 'POST', `/api/set?key=${page.key}`, { key: null, body: { changes: [{ name: 'telemetry.enabled', value: false }] } });
    check(r.status === 403 && fs.readFileSync(FILE, 'utf8') === snapshot, 'a change without the key in its header is refused');
    r = await request(page, 'POST', '/api/set', { body: 'name=telemetry.enabled&value=false', type: 'application/x-www-form-urlencoded' });
    check(r.status === 415 && fs.readFileSync(FILE, 'utf8') === snapshot, 'a form post (what another web page could send) is refused');
    r = await request(page, 'GET', '/api/settings');
    check(r.status === 200 && r.json.settings.length === total && JSON.stringify(r.json.settings.map((s) => [s.name, s.value])) === JSON.stringify(list.settings.map((s) => [s.name, s.value])), 'the page reads the same list the agent reads');
    check(r.json.sections.every((s) => s.health.length > 0), 'every piece has an "is it working?" line');
    r = await request(page, 'GET', `/docs/coherence-gate.md?key=${page.key}`, { key: null });
    check(r.status === 200 && /What it/.test(r.text), 'each piece\'s documentation opens from the page');

    // Every setting the page can change: change it, check it, change it back.
    const onPage = list.settings.filter((s) => s.switchableOnPage);
    let changed = 0; let commentsKept = 0; const fails = [];
    for (const s of onPage) {
      const v = typed(s, otherValue(s));
      r = await setOnPage(page, s.name, v);
      const now = effective(s.name);
      const fromList = r.json && r.json.list && r.json.list.settings.find((x) => x.name === s.name).value;
      if (r.json && r.json.ok && now === v && fromList === v) changed++; else fails.push(`${s.name}: ${r.text.slice(0, 120)}`);
      if (s.name === 'coherenceGate.strength') {
        check(settingsLib.getPath(shown(), s.name) === v && listJson().settings.find((x) => x.name === s.name).value === v, 'a change on the page shows in `config show` and `settings list --json` from the terminal');
      }
      if (comments(fs.readFileSync(FILE, 'utf8')) === comments(snapshot)) commentsKept++;
      await setOnPage(page, s.name, s.default);
    }
    check(changed === onPage.length, `each of the ${onPage.length} settings the page can change reads back changed, the way the hooks read it (${changed})${fails.length ? `: ${fails.slice(0, 2).join(' | ')}` : ''}`);
    check(commentsKept === onPage.length, 'every comment survives every change from the page');
    check(fs.readFileSync(FILE, 'utf8') === snapshot, 'after changing them all back, the file is byte-for-byte what it was');

    const commands = list.settings.filter((s) => !s.switchableOnPage).map((s) => s.name);
    r = await setOnPage(page, commands[0], 'echo hi');
    check(commands.length === 2 && r.status === 400 && fs.readFileSync(FILE, 'utf8') === snapshot, `the page does not set commands that run on your machine (${commands.join(', ')})`);
    r = await setOnPage(page, 'coherenceGate.noSuchThing', true);
    check(r.status === 400 && fs.readFileSync(FILE, 'utf8') === snapshot, 'the page refuses a setting that does not exist');
    r = await setOnPage(page, 'coherenceGate.strength', 'loud');
    check(r.status === 400 && fs.readFileSync(FILE, 'utf8') === snapshot, 'the page refuses a value the setting does not accept');

    // The change reaches the hooks: the gates behave differently, and turning one off lets work through.
    check(coherenceBlocksEdit(), 'with the coherence check on Block, an edit before the check waits');
    await setOnPage(page, 'coherenceGate.strength', 'off');
    check(!coherenceBlocksEdit(), 'turned Off on the page, the same edit goes through');
    await setOnPage(page, 'coherenceGate.strength', 'block');
    check(evidenceSendsBack(), 'with the evidence gate on, "it works" with nothing run is sent back');
    await setOnPage(page, 'evidenceGate.strength', 'off');
    check(!evidenceSendsBack(), 'turned Off on the page, the evidence gate lets it finish');
    await setOnPage(page, 'evidenceGate.strength', 'block');
    // The row's Block/Remind/Off control turns a switched-off piece back on in the same click.
    await request(page, 'POST', '/api/set', { body: { changes: [{ name: 'governer.enabled', value: false }] } });
    r = await request(page, 'POST', '/api/set', { body: { changes: [{ name: 'governer.enabled', value: true }, { name: 'governer.gateStrength', value: 'remind' }] } });
    check(r.json.ok && settingsLib.getPath(shown(), 'governer.enabled') === true && settingsLib.getPath(shown(), 'governer.gateStrength') === 'remind', 'several changes in one click are applied in order');
    await setOnPage(page, 'governer.gateStrength', 'block');
    check(fs.readFileSync(FILE, 'utf8') === snapshot, 'and the file is back to exactly what it was');

    // A file with a mistake: the page says so, refuses to write over it, and the hooks run on defaults.
    fs.writeFileSync(FILE, '{ "coherenceGate": { "strength": "remind" ');
    r = await request(page, 'GET', '/api/settings');
    check(r.json.problems.length === 1 && /defaults/.test(r.json.problems[0]), 'with a broken file the page shows the problem ("using defaults until it is fixed")');
    r = await setOnPage(page, 'telemetry.enabled', false);
    check(r.status === 400 && fs.readFileSync(FILE, 'utf8').startsWith('{ "coherenceGate"'), 'and refuses to write over it');
    check(coherenceBlocksEdit(), 'while the hooks keep running on the defaults');
    fs.writeFileSync(FILE, snapshot);
  } finally {
    page.proc.kill('SIGTERM');
  }
}
// ── 3. The two understanding switches that used to do nothing ──────────────
function understandingTests() {
  process.stdout.write('settings: the alignment-gate and task-tracking blocks follow their switches\n');
  const sid = 'dddddddd-1111-2222-3333-444444444444';
  const tp = path.join(TMP, `${sid}.jsonl`); fs.writeFileSync(tp, '');
  // The whole text the agent is given: what is shown, or, when it was shortened to stay visible,
  // the saved file the shortened text points to (the gate blocks sit after the cut).
  const say = () => {
    const shownText = execFileSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'user-prompt'], { env: ENV, input: JSON.stringify({ session_id: sid, transcript_path: tp, prompt: 'please change how the subscription is charged each month' }), encoding: 'utf8' });
    const saved = shownText.match(/the full text is in (.+?) — Read it/);
    return saved ? fs.readFileSync(saved[1], 'utf8') : shownText;
  };
  const first = say();
  check(first.includes('<governer-alignment-gate') && first.includes('<task-tracking-gate') && !first.includes('{{'), 'by default both blocks are sent, with no markers left in the text');
  cli('switch', 'understanding.injectAlignmentQuestions', 'off');
  let out = say();
  check(!out.includes('<governer-alignment-gate') && out.includes('<task-tracking-gate'), 'injectAlignmentQuestions off leaves out only the alignment-gate block');
  cli('switch', 'understanding.injectAlignmentQuestions', 'on');
  cli('switch', 'understanding.injectTaskTracking', 'off');
  out = say();
  check(out.includes('<governer-alignment-gate') && !out.includes('<task-tracking-gate'), 'injectTaskTracking off leaves out only the task-tracking block');
  cli('switch', 'understanding.injectTaskTracking', 'on');
  check(say() === first, 'switched back on, the message is exactly what it was before');
  // An older copy of the prompt in the data folder (no markers) keeps working as it always did.
  fs.mkdirSync(path.join(DATA, 'prompts'), { recursive: true });
  fs.writeFileSync(path.join(DATA, 'prompts', 'per-message.txt'), fs.readFileSync(path.join(ROOT, 'prompts', 'per-message.txt'), 'utf8').replace(/\{\{#if [^}]+\}\}|\{\{\/if\}\}/g, ''));
  cli('switch', 'understanding.injectTaskTracking', 'off');
  out = say();
  check(out.includes('<task-tracking-gate') && !out.includes('{{'), 'a copy of the prompt without the markers is sent unchanged (the switch only applies to marked lines)');
  cli('switch', 'understanding.injectTaskTracking', 'on');
  fs.rmSync(path.join(DATA, 'prompts'), { recursive: true, force: true });
}

main().catch((e) => { bad(`test crashed: ${e.stack || e}`); process.stdout.write(`\nsettings: ${PASS} passed, ${FAIL} failed\n`); process.exit(1); });

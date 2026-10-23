#!/usr/bin/env node
'use strict';
// Calibration test: builds a made-up ~/.claude/projects folder (never real
// transcripts), a fake "Haiku" executable, and drives the calibration offer
// hook and every `alignment-harness calibration` subcommand against them.
//   node plugin-dev/tests-smoke/calibration-test.js   (PLUGIN_DIR=<path> for another copy)

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = process.env.PLUGIN_DIR || path.resolve(__dirname, '..', '..');
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-test-'));
const CONFIG = path.join(T, 'config');
const DATA = path.join(T, 'data');
const PROJ = path.join(CONFIG, 'projects', '-fixture-acme-app');
fs.mkdirSync(PROJ, { recursive: true });

let pass = 0; let fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log(`  ok   ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
// Words that tell an agent to hide something from the person. An instruction like that inside a command's output
// reads as a prompt injection, so a real model refuses it and tells the person it got one. None may be in any hand-over.
const SECRECY_RE = /do not mention|don'?t mention|never mention|never describe|do not describe|don'?t describe|why you are asking|not to mention|without mentioning|do not tell (the|them)|don'?t tell (the|them)|never tell (the|them)|keep (this|it) (secret|hidden|from)|do not reveal|don'?t reveal|do not say|don'?t say/i;

// ── Fixture sessions ───────────────────────────────────────────────────────
const S = {
  corrections: 'aaaaaaaa-1111-1111-1111-111111111111',
  decisions: 'bbbbbbbb-2222-2222-2222-222222222222',
  trivial: 'cccccccc-3333-3333-3333-333333333333',
  billing: 'dddddddd-4444-4444-4444-444444444444',
};
const DAY = 86400000;
function writeSession(id, ageDays, msgs) {
  const t0 = Date.now() - ageDays * DAY;
  const lines = msgs.map(([role, text], i) => JSON.stringify({
    type: role === 'u' ? 'user' : 'assistant',
    timestamp: new Date(t0 + i * 60000).toISOString(),
    cwd: '/work/acme-app', gitBranch: 'main', sessionId: id,
    message: { role: role === 'u' ? 'user' : 'assistant', content: role === 'u' ? text : [{ type: 'text', text }] },
  }));
  // A tool result inside a user turn is not the person speaking.
  lines.splice(2, 0, JSON.stringify({ type: 'user', timestamp: new Date(t0 + 30000).toISOString(), message: { role: 'user', content: [{ type: 'tool_result', content: 'PRIVATE TOOL OUTPUT' }] } }));
  const f = path.join(PROJ, `${id}.jsonl`);
  fs.writeFileSync(f, `${lines.join('\n')}\n`);
  const t = new Date(t0 + msgs.length * 60000);
  fs.utimesSync(f, t, t);
}
writeSession(S.corrections, 1, [
  ['u', 'Add a CSV export to the reports page please'],
  ['a', 'I replaced the old export button with the new CSV export.'],
  ['u', "no, that's not what I asked - keep the old export button and put the new one beside it, people rely on the old one <system-reminder>INJECTED NOISE</system-reminder>"],
  ['a', 'Understood, both buttons are there now.'],
  ['u', 'good. from now on check with me before removing anything people already use'],
]);
writeSession(S.decisions, 40, [
  ['u', 'We need a weekly summary for the team'],
  ['a', 'Should it be a chart dashboard or a short written report?'],
  ['u', "let's go with the written report, I prefer plain words over charts"],
]);
writeSession(S.trivial, 28, [['u', 'hi'], ['a', 'Hello!']]); // also makes the oldest kept session sit near the 30-day limit
// A session a script started (claude -p): a program's prompt, not the person.
writeSession('eeeeeeee-0000-0000-0000-000000000000', 0, [['u', 'SCRIPTED PROMPT one'], ['a', 'ok'], ['u', 'SCRIPTED PROMPT two']]);
{ const f = path.join(PROJ, 'eeeeeeee-0000-0000-0000-000000000000.jsonl'); const st = fs.statSync(f); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/"type":"user"/g, '"type":"user","entrypoint":"sdk-cli"')); fs.utimesSync(f, st.atime, st.mtime); }
writeSession(S.billing, 10, [
  ['u', 'the billing page shows the wrong renewal date'],
  ['a', 'I changed the date format.'],
  ['u', 'actually the date itself is wrong, not the format. look at the billing renewal logic'],
]);
// A subagent transcript in a subfolder: the agent talking to itself, never read.
fs.mkdirSync(path.join(PROJ, S.corrections, 'subagents'), { recursive: true });
fs.writeFileSync(path.join(PROJ, S.corrections, 'subagents', 'agent-x.jsonl'), `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'SUBAGENT TEXT '.repeat(30) } })}\n`);
// Something already written down: one plan, one memory note.
fs.mkdirSync(path.join(CONFIG, 'plans'), { recursive: true });
fs.writeFileSync(path.join(CONFIG, 'plans', 'reports-plan.md'), '# Plan: CSV export beside the old button\n\nKeep the old export.\n');
fs.mkdirSync(path.join(PROJ, 'memory'), { recursive: true });
fs.writeFileSync(path.join(PROJ, 'memory', 'prefers-plain-words.md'), '# Prefers plain words over charts\n');

// ── A fake model: same arguments as `claude -p`, JSON events out ──────────
const ARGLOG = path.join(T, 'model-args.jsonl');
const FAKE = path.join(T, 'fake-haiku');
fs.writeFileSync(FAKE, `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
const input = fs.readFileSync(0, 'utf8');
fs.appendFileSync(${JSON.stringify(ARGLOG)}, JSON.stringify({ args, nested: process.env.ALIGNMENT_HARNESS_NESTED || null }) + '\\n');
const system = args[args.indexOf('--system-prompt') + 1] || '';
let result;
if (/notes about one person/.test(system)) {
  result = '## What they are usually working toward\\nShipping changes without breaking what people use.\\n\\n## Leans to weigh\\n- When removing something people use: lean toward checking first, "check with me before removing anything" [s:aaaaaaaa]\\n- A made-up claim: "they love dashboards more than anything" [s:bbbbbbbb]\\n\\n## Corrections they have had to make\\n- Agent replaced a button; they meant add beside it [s:aaaaaaaa]\\n\\n## Their words\\n- old export: the existing button\\n\\n## What I am still unsure of\\n- How they feel about charts in general';
} else {
  const m = input.match(/\\] PERSON: (.+)/g) || [];
  // The last thing the person said, word for word (deliberately cited as U2, so the ref gets corrected).
  const real = m.length ? m[m.length - 1].replace(/^.*\\] PERSON: /, '') : '';
  result = JSON.stringify({
    target: 'Get the change in without breaking what people already use',
    initiative: null, location: 'done', gap: null,
    corrections: [{ situation: 'when about to replace something people use', agentBelieved: 'replacing was fine', personMeant: 'add beside it', lean: 'lean toward adding beside', why: 'people rely on it', quote: real, ref: 'U2' }],
    preferences: [{ situation: 'when writing to them', lean: 'lean toward plain words', strength: 'lean', why: null, mightNotApply: null, quote: 'I absolutely adore long dashboards', ref: 'U1' }],
    decisions: [], vocabulary: [{ term: 'old export', means: 'the existing export button' }], openQuestions: [], confidence: 70,
  });
}
process.stdout.write(JSON.stringify([{ type: 'system', subtype: 'init', model: 'fake-haiku' }, { type: 'result', is_error: false, result, total_cost_usd: 0.0012 }]));
`);
fs.chmodSync(FAKE, 0o755);
const BROKEN = path.join(T, 'broken-haiku');
fs.writeFileSync(BROKEN, '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify([{type:"result",is_error:true,result:"Failed to authenticate: session expired"}]));\n');
fs.chmodSync(BROKEN, 0o755);

const ENV = { ...process.env, CLAUDE_CONFIG_DIR: CONFIG, CLAUDE_PLUGIN_DATA: DATA, CLAUDE_PLUGIN_ROOT: ROOT, ALIGNMENT_HARNESS_CALIBRATION_CMD: FAKE };
delete ENV.ALIGNMENT_HARNESS_NESTED;
const cli = (args, extraEnv) => {
  const r = spawnSync('node', [path.join(ROOT, 'bin', 'alignment-harness'), 'calibration', ...args], { env: { ...ENV, ...(extraEnv || {}) }, cwd: T, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};
const hook = (sid, source) => {
  const r = spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], {
    env: ENV, cwd: T, encoding: 'utf8', timeout: 20000,
    input: JSON.stringify({ session_id: sid, transcript_path: path.join(PROJ, `${sid}.jsonl`), hook_event_name: 'SessionStart', source: source || 'startup' }),
  });
  return { code: r.status, out: r.stdout || '' };
};
const notesDir = path.join(DATA, 'records', 'calibration', 'sessions');
const noteCount = () => { try { return fs.readdirSync(notesDir).filter((f) => f.endsWith('.json')).length; } catch (_) { return 0; } };
const offerFirstLine = fs.readFileSync(path.join(ROOT, 'prompts', 'calibration-offer.txt'), 'utf8').split('\n')[0];

console.log('the offer');
const NEW1 = 'eeeeeeee-5555-5555-5555-555555555555'; const NEW2 = 'ffffffff-6666-6666-6666-666666666666'; const NEW3 = '99999999-7777-7777-7777-777777777777';
// The keep-sessions offer is on by default; these first checks are about the switch turned off,
// so they set it to false explicitly (restored to the default after the keep-history checks below).
fs.mkdirSync(DATA, { recursive: true });
const SW = path.join(DATA, 'switches.jsonc');
const swBefore = fs.existsSync(SW) ? fs.readFileSync(SW, 'utf8') : null;
fs.writeFileSync(SW, '{ "calibration": { "offerLongerHistory": false } }');
let h = hook(NEW1);
ok(h.code === 0 && h.out.includes('<calibration-question id="calibrate">'), 'first session: the agent is handed the offer');
ok(h.out.includes(offerFirstLine), 'the offer carries the author\'s words verbatim');
ok(/Claude Code keeps sessions for 30 days by default, so I found 4 from the last month, across 1 project, going back to /.test(h.out), 'history reaching the 30-day limit: it says plainly that Claude Code keeps 30 days by default, and counts only those (the 40-day-old session and the subagent file are not counted)');
ok(/would cost under \d+ cents? at Haiku's API prices; on a Claude subscription/.test(h.out) && !/the range is because/.test(h.out), 'a single cost figure comes without the "range" explanation');
// The offer is handed over inside an <offer-text> envelope (no marker lines the agent could echo),
// identical to what offer-text prints, with a no-paraphrase instruction before and after.
{
  const C = require(path.join(ROOT, 'lib', 'calibration.js'));
  const m = h.out.match(/<offer-text>\n([\s\S]*?)\n<\/offer-text>/);
  ok(m && m[1] === cli(['offer-text']).out.trimEnd(), 'the offer text sits inside an <offer-text> envelope, identical to what offer-text prints');
  ok(!/^\s*(={3,}|-{3,}|\*{3,}|#{1,6}\s)/m.test(h.out) && !/CALIBRATION OFFER|SHOW EXACTLY AS WRITTEN/.test(h.out), 'no marker lines, dividers or headings in the hand-off for the agent to echo');
  ok(/do not paraphrase, summarize, shorten or reword them, never write the tags, and never add a heading, label, divider or marker line of your own/.test(h.out), 'the agent is told to show the words exactly, never the envelope or a marker');
  ok(/very last thing in your reply.*Nothing may come after it/s.test(h.out), 'the offer goes last in the reply, with nothing after it');
  ok(m && m[1].endsWith(`\n\n${C.CLOSING_LINE}`) && C.CLOSING_LINE === 'Say yes, ask for a sample first, or no to skip it.', 'the offer ends: "Say yes, ask for a sample first, or no to skip it."');
  ok(/- No, or skip: alignment-harness calibration answer no/.test(h.out), 'the agent is told that "no" and "skip" are the same answer');
  ok(!/keeps them for 365 days/.test(h.out) && !/keep-history/.test(h.out), 'with the switch off, there is no offer to keep sessions longer');
}
ok(!/1 plan and 1 memory note/.test(h.out) && (h.out.match(/<calibration-question /g) || []).length === 1, 'the calibration offer is the only question this turn: plans and notes wait for a later turn');
ok(/cents|under 1 cent|\$/.test(h.out) && /Claude subscription/.test(h.out), 'it shows a cost and says how it works on a subscription');
ok(!hook(NEW1).out.includes('<calibration-question id="calibrate">'), 'the same session is not offered twice');
ok(hook(NEW2).out.includes('this is the last time'), 'unanswered: offered once more in the next session');
ok(!hook(NEW3).out.includes('<calibration-question id="calibrate">'), 'never a third time');
const sub = spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_PLUGIN_DATA: path.join(T, 'data-sub') }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: NEW1, transcript_path: path.join(PROJ, NEW1, 'subagents', 'agent-x.jsonl'), source: 'startup' }) });
ok(sub.status === 0 && !String(sub.stdout).includes('<calibration-question id="calibrate">'), 'a subagent starting up is never handed the offer');

console.log('how far back history goes');
let r;
fs.writeFileSync(path.join(CONFIG, 'settings.json'), JSON.stringify({ theme: 'dark', cleanupPeriodDays: 90 }, null, 2));
r = cli(['offer-text']);
ok(/What I found on this machine: I found 5 past sessions across 1 project, going back to /.test(r.out) && !/keep sessions for 90 days/.test(r.out), 'history well inside a 90-day setting: no keep-period sentence, just what was found (the 40-day-old session counts again)');
fs.writeFileSync(path.join(CONFIG, 'settings.json'), JSON.stringify({ theme: 'dark', cleanupPeriodDays: 44 }, null, 2));
ok(/Your Claude Code settings keep sessions for 44 days, so that is as far back as your history goes here: I found 5 past sessions/.test(cli(['offer-text']).out), 'history reaching a 44-day setting: it names the setting as the limit');
fs.writeFileSync(path.join(CONFIG, 'settings.json'), JSON.stringify({ theme: 'dark', cleanupPeriodDays: 90 }, null, 2));
{
  const BIG = path.join(T, 'config-big'); const bp = path.join(BIG, 'projects', '-big');
  fs.mkdirSync(bp, { recursive: true });
  for (let i = 0; i < 250; i++) fs.writeFileSync(path.join(bp, `s${i}.jsonl`), 'x'.repeat(300));
  const big = cli(['offer-text'], { CLAUDE_CONFIG_DIR: BIG, CLAUDE_PLUGIN_DATA: path.join(T, 'data-big') }).out;
  ok(/would cost between .+ and .+ at Haiku's API prices \(the range is because different Claude Code versions use different Haiku models\)/.test(big), 'two cost figures keep the "range" explanation');
}
r = cli(['keep-history', '--yes']);
ok(r.code === 1 && /switched off/.test(r.out) && JSON.parse(fs.readFileSync(path.join(CONFIG, 'settings.json'), 'utf8')).cleanupPeriodDays === 90, 'with the switch off, keep-history refuses and changes nothing');
fs.writeFileSync(SW, '{ "calibration": { "offerLongerHistory": true } }');
const KEEP_90 = "Your Claude Code settings delete sessions older than 90 days. If you'd like more to calibrate from later on, I can change that so it keeps them for 365 days. I'll only change it if you say yes, and you can change it back any time.";
const KEEP_DEFAULT = "Claude Code deletes sessions older than 30 days by default. If you'd like more to calibrate from later on, I can change that so it keeps them for 365 days. I'll only change it if you say yes, and you can change it back any time.";
r = cli(['offer-text']);
ok(!/keeps them for 365 days|delete sessions older than/.test(r.out), 'switch on: the keep question is never part of the calibration offer, so one "yes" cannot mean both');
const keepQuestionNow = (switchesText) => {
  // A person who has answered calibrating and the plans question: the next session start opens the keep question.
  // switchesText: the data folder's switches file (null = no switches file at all, so the built-in default applies).
  const d = path.join(T, `data-k${Math.random().toString(36).slice(2, 8)}`); fs.mkdirSync(path.join(d, 'state'), { recursive: true });
  const swText = switchesText === undefined ? '{ "calibration": { "offerLongerHistory": true } }' : switchesText;
  if (swText !== null) fs.writeFileSync(path.join(d, 'switches.jsonc'), swText);
  fs.writeFileSync(path.join(d, 'state', 'calibration.json'), JSON.stringify({ decision: 'yes', plansDecision: 'no' }));
  return spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_PLUGIN_DATA: d }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: 'bbbbbbbb-1111-1111-1111-111111111111', transcript_path: '/x/bbbbbbbb-1111-1111-1111-111111111111.jsonl', source: 'startup' }) }).stdout || '';
};
const k90 = keepQuestionNow().match(/<offer-text>\n([\s\S]*?)\n<\/offer-text>/);
ok(k90 && k90[1] === KEEP_90, 'the keep question names the setting itself (90-day setting)');
const SETTINGS = path.join(CONFIG, 'settings.json');
const settingsSaved = fs.readFileSync(SETTINGS, 'utf8');
fs.unlinkSync(SETTINGS);
const kdef = keepQuestionNow().match(/<offer-text>\n([\s\S]*?)\n<\/offer-text>/);
ok(kdef && kdef[1] === KEEP_DEFAULT, 'default 30 days: "Claude Code deletes sessions older than 30 days by default. If you\'d like more …"');
fs.writeFileSync(SETTINGS, JSON.stringify({ cleanupPeriodDays: 365 }));
ok(!/id="keep"/.test(keepQuestionNow()), 'already keeping sessions for 365 days or more: no keep question');
// The default: the keep question is on unless the switches file turns it off.
fs.writeFileSync(SETTINGS, JSON.stringify({ cleanupPeriodDays: 90 }));
{
  const kNoFile = keepQuestionNow(null);
  const kNoFileText = kNoFile.match(/<offer-text>\n([\s\S]*?)\n<\/offer-text>/);
  ok(/<calibration-question id="keep">/.test(kNoFile) && kNoFileText && kNoFileText[1] === KEEP_90, 'no switches file at all (the default): after the calibrate and plans answers, the keep question is offered');
  ok(!/id="keep"/.test(keepQuestionNow('{ "calibration": { "offerLongerHistory": false } }')) && JSON.parse(fs.readFileSync(SETTINGS, 'utf8')).cleanupPeriodDays === 90, 'offerLongerHistory set to false: the keep question is never offered and the settings are unchanged');
}
fs.writeFileSync(SETTINGS, settingsSaved);
// A person with NO past sessions is never shown the calibration offer, so the keep question is the first setup
// question they ever see: the agent must not be told they answered an offer (it could narrate or invent one).
{
  const firstQuestion = (state) => {
    const d = path.join(T, `data-n${Math.random().toString(36).slice(2, 8)}`); fs.mkdirSync(path.join(d, 'state'), { recursive: true });
    fs.writeFileSync(path.join(d, 'switches.jsonc'), '{ "calibration": { "offerLongerHistory": true } }');
    if (state) fs.writeFileSync(path.join(d, 'state', 'calibration.json'), JSON.stringify(state));
    const emptyCfg = path.join(T, `config-n${Math.random().toString(36).slice(2, 8)}`); fs.mkdirSync(emptyCfg, { recursive: true });
    return spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_CONFIG_DIR: emptyCfg, CLAUDE_PLUGIN_DATA: d }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: 'bbbbbbbb-2222-2222-2222-222222222222', transcript_path: '/x/bbbbbbbb-2222-2222-2222-222222222222.jsonl', source: 'startup' }) }).stdout || '';
  };
  const first = firstQuestion(null);
  ok(/<calibration-question id="keep">/.test(first), 'no past sessions: the keep question is the first one shown');
  ok(/This is the first question of the harness setup\./.test(first) && !/calibration offer|answered the|started when/.test(first), 'no past sessions: it is introduced plainly as the first setup question, with no mention of an earlier offer');
  const afterPlans = firstQuestion({ plansAsked: new Date().toISOString(), plansDecision: 'no' });
  ok(/<calibration-question id="keep">/.test(afterPlans) && /This is the next question of the harness setup\./.test(afterPlans) && !/calibration offer|answered the|started when/.test(afterPlans), 'no calibration offer was ever made but the plans question came first: the keep question is "the next question", still with no offer mentioned');
  const afterOffer = firstQuestion({ decision: 'yes', plansDecision: 'no' });
  ok(/answered the calibration offer/.test(afterOffer), 'a person who did answer the calibration offer still hears that this is the next question of the setup they started');
}
r = cli(['keep-history']);
ok(r.code === 1 && fs.readFileSync(SETTINGS, 'utf8') === settingsSaved, 'without --yes (the person\'s yes), nothing is changed');

// The direct command is only ever the person's yes to the keep question they were shown. (Lane C, medium 1:
// `keep-history --yes` used to rewrite the setting with no question open.) State is written straight into the
// test data folder, the way the hook would have left it.
const CAL_STATE = path.join(DATA, 'state', 'calibration.json');
const calState = () => { try { return JSON.parse(fs.readFileSync(CAL_STATE, 'utf8')); } catch (_) { return {}; } };
const setCalState = (patch) => { fs.mkdirSync(path.dirname(CAL_STATE), { recursive: true }); fs.writeFileSync(CAL_STATE, JSON.stringify(patch)); };
const openKeep = (shown) => setCalState({ decision: 'yes', plansDecision: 'no', promptCount: 2, openQuestion: { id: 'keep', text: KEEP_90, openedAt: new Date().toISOString(), sessionId: 'cccccccc-1111-1111-1111-111111111111', shownAtPrompt: 1, ...(shown ? { shownConfirmed: new Date().toISOString() } : {}) } });
const backupsNow = () => { try { return fs.readdirSync(path.join(DATA, 'state')).filter((f) => f.startsWith('claude-settings-backup-')).length; } catch (_) { return 0; } };
{
  const before = fs.readFileSync(SETTINGS, 'utf8'); const b0 = backupsNow();
  setCalState({});
  r = cli(['keep-history', '--yes']);
  ok(r.code === 1 && /not the open question/.test(r.out) && fs.readFileSync(SETTINGS, 'utf8') === before && backupsNow() === b0 && calState().keepDecision === undefined, 'switch on, no question open: keep-history --yes is refused, the settings are byte-identical, no backup was made and nothing was recorded');
  openKeep(false);
  r = cli(['keep-history', '--yes']);
  ok(r.code === 1 && /has not confirmed that the person saw/.test(r.out) && fs.readFileSync(SETTINGS, 'utf8') === before && backupsNow() === b0 && calState().openQuestion && calState().keepDecision === undefined, 'the keep question is open but was not confirmed shown: refused, settings byte-identical');
  setCalState({ promptCount: 2, openQuestion: { id: 'calibrate', text: 'x', openedAt: new Date().toISOString(), shownAtPrompt: 1, shownConfirmed: new Date().toISOString() } });
  r = cli(['keep-history', '--yes']);
  ok(r.code === 1 && /not the open question/.test(r.out) && fs.readFileSync(SETTINGS, 'utf8') === before && calState().openQuestion.id === 'calibrate' && calState().decision === undefined, 'a different question is open (even a shown one): keep-history --yes neither changes the setting nor answers that question');
  const Cal = require(path.join(ROOT, 'lib', 'calibration.js'));
  setCalState({});
  const direct = Cal.keepHistory(365);
  ok(direct.ok === false && fs.readFileSync(SETTINGS, 'utf8') === before, 'the library call itself refuses with no question open (no path around the guard)');
  openKeep(true);
  r = cli(['keep-history', '--yes']);
  ok(r.code === 0 && JSON.parse(fs.readFileSync(SETTINGS, 'utf8')).cleanupPeriodDays === 365 && !calState().openQuestion && calState().keepDecision === 'yes', 'the keep question was shown and the person said yes: the one setting changes and the question closes');
  fs.writeFileSync(SETTINGS, before);
}

// The settings text keeps every byte except the one value: an existing key is changed in place…
const withKey = '{\n    "theme": "dark",\n    "cleanupPeriodDays": 90,\n    "env": { "cleanupPeriodDays": "nested, not ours" }\n}\n';
fs.writeFileSync(SETTINGS, withKey);
openKeep(true);
r = cli(['keep-history', '--yes']);
ok(r.code === 0 && fs.readFileSync(SETTINGS, 'utf8') === withKey.replace('"cleanupPeriodDays": 90', '"cleanupPeriodDays": 365'), 'existing setting: only its number changes in the file text (a same-named key nested elsewhere is untouched)');
const bk = r.out.match(/previous file is saved at (\S+?)\.(\s|$)/);
ok(bk && fs.readFileSync(bk[1], 'utf8') === withKey, 'the previous file is backed up byte for byte');
// …and a missing key is one inserted line, in the file's own indentation.
const noKey = '{\n\t"theme": "dark",\n\t"permissions": {\n\t\t"allow": ["Bash(ls:*)"]\n\t}\n}\n';
fs.writeFileSync(SETTINGS, noKey);
openKeep(true);
r = cli(['keep-history', '--yes']);
const afterText = fs.readFileSync(SETTINGS, 'utf8');
const bl = noKey.split('\n'); const al = afterText.split('\n');
ok(r.code === 0 && al.length === bl.length + 1 && al[1] === '\t"cleanupPeriodDays": 365,' && al.slice(0, 1).concat(al.slice(2)).join('\n') === noKey, 'missing setting: exactly one line inserted, with the file\'s own (tab) indentation; every other byte unchanged');
const notJson = '{ "theme": "dark", // a comment\n}';
fs.writeFileSync(SETTINGS, notJson);
openKeep(true);
r = cli(['keep-history', '--yes']);
ok(r.code === 1 && /could not be read/.test(r.out) && fs.readFileSync(SETTINGS, 'utf8') === notJson, 'a settings file that is not valid JSON is refused and left byte-identical');
{
  const C = require(path.join(ROOT, 'lib', 'calibration.js'));
  ok(C.withCleanupPeriodDays('{"a":1}', 365) === '{"cleanupPeriodDays": 365,"a":1}' && C.withCleanupPeriodDays('{}', 365) === '{\n  "cleanupPeriodDays": 365\n}' && C.withCleanupPeriodDays(null, 365) === '{\n  "cleanupPeriodDays": 365\n}\n', 'one-line, empty and missing files get the setting with nothing else changed');
}
if (swBefore === null) fs.unlinkSync(SW); else fs.writeFileSync(SW, swBefore);
fs.writeFileSync(SETTINGS, JSON.stringify({ cleanupPeriodDays: 90 }));

console.log('one open question per reply, in order, chained without a gap, each answer attributed to it');
{
  const SID = 'cccccccc-1111-1111-1111-111111111111';
  const mk = (name, sw) => { const d = path.join(T, name); fs.mkdirSync(d, { recursive: true }); if (sw) fs.writeFileSync(path.join(d, 'switches.jsonc'), '{ "calibration": { "offerLongerHistory": true } }'); return d; };
  // A conversation: the transcript Claude Code would write (named after the session, as the hooks expect).
  const convo = (D) => { const dir = path.join(T, `tr-${path.basename(D)}`); fs.mkdirSync(dir, { recursive: true }); const f = path.join(dir, `${SID}.jsonl`); fs.writeFileSync(f, ''); return f; };
  const start = (D, f, sid) => spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_PLUGIN_DATA: D }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: sid || SID, transcript_path: sid ? path.join(path.dirname(f), `${sid}.jsonl`) : f, hook_event_name: 'SessionStart', source: 'startup' }) }).stdout || '';
  // The agent's reply, then the person's message, then the message hook (what the agent is handed for its next reply).
  const turn = (D, f, agentReply, person, tp) => {
    if (agentReply !== null) fs.appendFileSync(f, `${JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: agentReply }] } })}\n`);
    fs.appendFileSync(f, `${JSON.stringify({ type: 'user', timestamp: new Date().toISOString(), message: { role: 'user', content: person } })}\n`);
    return spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_PLUGIN_DATA: D }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: SID, transcript_path: tp || f, hook_event_name: 'UserPromptSubmit', prompt: person }) }).stdout || '';
  };
  // Session start, then the person's first message: the offer is shown in the reply to it.
  const begin = (D, f) => { const hh = start(D, f); turn(D, f, null, 'hi, can you help me with my project?'); return hh; };
  const shown = (handoff) => (handoff.match(/<offer-text>\n([\s\S]*?)\n<\/offer-text>/) || [])[1] || 'MISSING';
  const ans = (D, a) => cli(['answer', a], { CLAUDE_PLUGIN_DATA: D });
  const qs = (t) => (t.match(/<calibration-question id="(\w+)"/g) || []).map((x) => x.match(/id="(\w+)"/)[1]);
  const state = (d) => JSON.parse(fs.readFileSync(path.join(d, 'state', 'calibration.json'), 'utf8'));
  fs.writeFileSync(SETTINGS, settingsSaved);
  const before = fs.readFileSync(SETTINGS, 'utf8');

  const D = mk('data-queue', true); let f = convo(D);
  const h0 = begin(D, f);
  ok(qs(h0).join() === 'calibrate' && !h0.includes('365 days') && !/memory note/.test(shown(h0)), 'session start: only the calibration offer is open; no plans or keep question in it');
  ok(/If the person later says a bare "yes" or "no" while no harness question is open, do not guess/.test(h0) && /Ask it plainly/.test(h0) && !SECRECY_RE.test(h0), 'every hand-off: a bare yes/no with nothing open is asked about; the question is to be asked plainly, with nothing in it asking the agent to hide anything');
  let t = turn(D, f, `Happy to help.\n\n${shown(h0)}`, 'yes');
  ok(/<calibration-open-question id="calibrate">/.test(t) && state(D).openQuestion.shownConfirmed, 'the offer was in the reply word for word, so "yes" is attributed to it');
  r = ans(D, 'yes');
  ok(r.code === 0 && /Recorded: yes to calibrating/.test(r.out) && fs.readFileSync(SETTINGS, 'utf8') === before, '"yes" goes to calibrating only: Claude Code\'s settings are untouched');
  ok(qs(r.out).join() === 'plans' && /Next setup question, as announced when the offer was shown/.test(r.out) && /word for word, as the last paragraph of the reply, alone/.test(r.out) && !SECRECY_RE.test(r.out), 'the answer reports the plans question as the next setup question, already announced, to be shown word for word as the last paragraph of that reply');
  const hp = r.out;
  t = turn(D, f, `Calibration has started in the background.\n\n${shown(hp)}`, 'yes');
  ok(/<calibration-open-question id="plans">/.test(t) && qs(t).length === 0, 'plans shown, then a bare "yes": attributed to plans; nothing new handed over');
  r = ans(D, 'yes');
  ok(r.code === 0 && /Indexed 1 plan and 1 memory note/.test(r.out) && fs.readFileSync(SETTINGS, 'utf8') === before && qs(r.out).join() === 'keep' && r.out.includes(KEEP_90), '"yes" to plans indexes them, leaves the settings alone, and hands over the keep question');
  t = turn(D, f, `Indexed.\n\n${shown(r.out)}`, 'yes');
  r = ans(D, 'yes');
  ok(r.code === 0 && JSON.parse(fs.readFileSync(SETTINGS, 'utf8')).cleanupPeriodDays === 365 && /it was the last one from the harness/.test(r.out), '"yes" to the shown keep question changes that one setting; it was the last question');
  t = turn(D, f, 'Done: Claude Code now keeps sessions for 365 days.', 'yes');
  ok(/<calibration-no-open-question>/.test(t) && /what they are saying yes to/.test(t), 'a bare "yes" with no question open: ask "yes to what?", never guess');
  ok(/what they are saying no to/.test(turn(D, f, 'Could you say what you mean?', 'no')), '…and the same for a bare "no"');
  ok(turn(D, f, 'Sure.', 'please fix the login page') === '', 'any other message: nothing from the harness');
  r = ans(D, 'yes');
  ok(r.code === 1 && /no question from the harness is open/.test(r.out), 'with no question open, a "yes" records nothing');
  fs.writeFileSync(SETTINGS, settingsSaved);

  console.log('an answer counts only for a question the person was shown');
  const D6 = mk('data-guard', true); f = convo(D6);
  const g0 = begin(D6, f);
  turn(D6, f, shown(g0), 'no');
  r = ans(D6, 'no');
  ok(qs(r.out).join() === 'plans' && /Next setup question, as announced when the offer was shown/.test(r.out) && !SECRECY_RE.test(r.out), 'after "no", the plans question is reported openly as the next setup question, with nothing to hide');
  t = turn(D6, f, 'Understood, no calibration. You did not ask for anything else, so I will leave it there.', 'yes');
  ok(qs(t).join() === 'plans' && /Your last reply did not show this question to the person/.test(t) && state(D6).lastClosed.reason === 'not-shown' && state(D6).plansDecision === undefined, 'the plans question never appeared in the reply: the "yes" is not recorded, and the question is handed over again, once');
  r = ans(D6, 'yes');
  ok(r.code === 1 && /has not confirmed that the person saw/.test(r.out) && state(D6).plansDecision === undefined && !fs.existsSync(path.join(D6, 'records', 'calibration', 'plans')), 'the agent cannot record an answer for a question that was not shown');
  t = turn(D6, f, `Sorry, one more setup step.\n\n${shown(t)}`, 'no');
  r = ans(D6, 'no');
  ok(r.code === 0 && state(D6).plansDecision === 'no', 'shown the second time, the person\'s "no" is recorded for it');
  t = turn(D6, f, 'OK. Nothing more.', 'no');
  ok(qs(t).join() === 'keep' && /did not show this question/.test(t), 'the keep question, not shown either, is handed over again once');
  t = turn(D6, f, 'Still nothing more.', 'yes');
  ok(qs(t).length === 0 && !state(D6).openQuestion && state(D6).keepDecision === undefined && JSON.parse(fs.readFileSync(SETTINGS, 'utf8')).cleanupPeriodDays === 90, 'not shown the second time either: closed, nothing recorded, the settings untouched');
  const D7 = mk('data-guard-unreadable', true); f = convo(D7);
  const u0 = begin(D7, f);
  t = turn(D7, f, shown(u0), 'yes', path.join(T, 'no-such-dir', `${SID}.jsonl`));
  r = ans(D7, 'yes');
  ok(/could not read your previous reply/.test(t) && r.code === 1 && !state(D7).decision, 'the transcript cannot be read: nothing is recorded (fail-safe)');

  console.log('the false refusal: identical answers in a row, the current message not yet in the transcript');
  // Claude Code may run the message hook before it writes the person's message to the transcript. Then the person's
  // previous "yes" is the last message in it, and the check must not take that one for the current "yes".
  const turnLate = (D, f, agentReply, person, extra) => {
    for (const e of extra || []) fs.appendFileSync(f, `${JSON.stringify(e)}\n`);
    if (agentReply !== null) fs.appendFileSync(f, `${JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: agentReply }] } })}\n`);
    const out = spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_PLUGIN_DATA: D }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: SID, transcript_path: f, hook_event_name: 'UserPromptSubmit', prompt: person }) }).stdout || '';
    fs.appendFileSync(f, `${JSON.stringify({ type: 'user', timestamp: new Date().toISOString(), message: { role: 'user', content: person } })}\n`);
    return out;
  };
  const toolRound = (cmd) => [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command: cmd } }] } },
    { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu1', content: 'Recorded.' }] } },
  ];
  const D8 = mk('data-guard-dup', true); f = convo(D8);
  { const hs = start(D8, f); turnLate(D8, f, null, 'hi, can you help me with my project?');
    t = turnLate(D8, f, shown(hs), 'yes');
    ok(/<calibration-open-question id="calibrate">/.test(t) && state(D8).openQuestion.shownConfirmed, 'late write: the calibration offer was shown, "yes" is attributed to it');
    r = ans(D8, 'yes');
    t = turnLate(D8, f, `Calibration has started.\n\n${shown(r.out)}`, 'yes', toolRound('alignment-harness calibration answer yes'));
    ok(/<calibration-open-question id="plans">/.test(t) && state(D8).openQuestion.shownConfirmed && !state(D8).lastClosed.reason.includes('not-shown'), 'late write, "yes" then "yes": the plans question was shown, so the second "yes" is attributed to it');
    r = ans(D8, 'yes');
    ok(qs(r.out).join() === 'keep', 'the plans answer hands over the keep question');
    t = turnLate(D8, f, `Done.\n\n${shown(r.out)}`, 'yes', toolRound('alignment-harness calibration answer yes'));
    ok(/<calibration-open-question id="keep">/.test(t) && state(D8).openQuestion && state(D8).openQuestion.shownConfirmed && state(D8).lastClosed.reason === 'answered', 'late write, "yes", "yes", "yes": the keep question was in the reply, so the third "yes" is attributed to it (was closed as not shown)');
    r = ans(D8, 'yes');
    ok(r.code === 0 && JSON.parse(fs.readFileSync(SETTINGS, 'utf8')).cleanupPeriodDays === 365, 'and it records: the one setting changes');
    fs.writeFileSync(SETTINGS, settingsSaved); }

  const D9 = mk('data-guard-dup-unseen', true); f = convo(D9);
  { const hs = start(D9, f); turnLate(D9, f, null, 'hi, can you help me with my project?');
    turnLate(D9, f, shown(hs), 'no'); r = ans(D9, 'no');
    t = turnLate(D9, f, 'Understood.', 'no');
    ok(qs(t).join() === 'plans' && state(D9).lastClosed.reason === 'not-shown' && state(D9).plansDecision === undefined, 'late write, "no" then "no": the plans question was NOT in the reply, so the second "no" is still not recorded (the guard stays strict)');
    r = ans(D9, 'no');
    ok(r.code === 1 && /has not confirmed that the person saw/.test(r.out), 'and the agent cannot record it'); }

  const D10 = mk('data-guard-notice', true); f = convo(D10);
  { const hs = start(D10, f); turnLate(D10, f, null, 'hi, can you help me with my project?');
    turnLate(D10, f, shown(hs), 'yes'); r = ans(D10, 'yes');
    const before = state(D10).promptCount;
    fs.appendFileSync(f, `${JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: `Calibration has started.\n\n${shown(r.out)}` }] } })}\n`);
    const notice = '<task-notification>\n<task-id>bw9ypva5x</task-id>\n<status>completed</status>\n</task-notification>';
    fs.appendFileSync(f, `${JSON.stringify({ type: 'user', timestamp: new Date().toISOString(), message: { role: 'user', content: notice } })}\n`);
    spawnSync('bash', [path.join(ROOT, 'hooks', 'run.sh'), 'calibration-offer'], { env: { ...ENV, CLAUDE_PLUGIN_DATA: D10 }, cwd: T, encoding: 'utf8', input: JSON.stringify({ session_id: SID, transcript_path: f, hook_event_name: 'UserPromptSubmit', prompt: notice }) });
    ok(state(D10).promptCount === before && state(D10).openQuestion && !state(D10).openQuestion.shownConfirmed, 'a background-task notice is not the person: it is not counted as a message and checks nothing');
    fs.appendFileSync(f, `${JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: 'The background run finished.' }] } })}\n`);
    t = turnLate(D10, f, null, 'yes');
    ok(/<calibration-open-question id="plans">/.test(t) && state(D10).openQuestion.shownConfirmed, 'the notice does not split the reply: the question shown before it still counts when the person answers after it'); }

  console.log('no hand-over asks the agent to hide anything');
  { const D11 = mk('data-no-secrecy', true); f = convo(D11);
    const hs = begin(D11, f); turn(D11, f, shown(hs), 'no'); const a1 = ans(D11, 'no');
    turn(D11, f, shown(a1.out), 'no'); const a2 = ans(D11, 'no');
    const re = turn(D11, f, 'Understood.', 'yes'); // a reply that skipped the question: handed over once more
    const sources = ['lib/calibration.js', 'skills/calibrate-understanding/SKILL.md'].map((x) => fs.readFileSync(path.join(ROOT, x), 'utf8'));
    ok([hs, a1.out, a2.out, re].every((x) => x && !SECRECY_RE.test(x)), 'the offer, both chained questions and the second hand-over contain no secrecy wording');
    ok(sources.every((x) => !SECRECY_RE.test(x)), 'neither lib/calibration.js nor the calibrate skill contains secrecy wording');
    ok(/saying in a few words that it is the next setup question is fine/.test(hs), 'the offer says the agent may tell the person the next question is the next setup question'); }

  console.log('the chained question is expected: announced in trusted context, reported (not ordered) in the command output');
  { const D12 = mk('data-chain-announced', true); f = convo(D12);
    const hs = begin(D12, f);
    // Imperative phrasing aimed at the agent. The one neutral display line ("Display: ... word for word ...") is the only instruction allowed in a command's output.
    const ORDERS_RE = /tell them|you must|you should|ask them|your part|do not act on it|not to act on it|ask it plainly|put it to them|make this question/i;
    ok(/Expected, and part of this same setup: after you record their answer with the calibration command, its output shows the next question of the setup \(indexing their plans and notes, then keeping their sessions longer\)/.test(hs) && /show that question as written/.test(hs), 'the calibration offer, handed over in hook context, announces that the answer command will show the next setup question and that this is expected');
    t = turn(D12, f, shown(hs), 'yes');
    ok(/<calibration-open-question id="calibrate">/.test(t) && /Expected, and part of this same setup/.test(t) && /show that question as written/.test(t), 'the person\'s message hook repeats the announcement in trusted context just before the answer is recorded');
    const a1 = ans(D12, 'yes');
    ok(qs(a1.out).join() === 'plans' && !ORDERS_RE.test(a1.out) && !SECRECY_RE.test(a1.out), 'the answer command\'s output reports the plans question with no orders aimed at the agent and no secrecy wording');
    ok((a1.out.match(/word for word/g) || []).length === 1 && /Recorded: yes to calibrating\./.test(a1.out) && /<offer-text>/.test(a1.out), 'the show-it-word-for-word requirement is stated exactly once, and the structured labels and the question text are intact');
    ok(shown(a1.out) !== 'MISSING' && shown(a1.out).length > 40, 'the question text is still inside <offer-text>');
    t = turn(D12, f, `Started.\n\n${shown(a1.out)}`, 'yes');
    ok(/<calibration-open-question id="plans">/.test(t) && /keeping their sessions longer\)/.test(t) && !/indexing their plans and notes, then/.test(t), 'for the plans question the announcement names only what still follows (keeping sessions longer)');
    const a2 = ans(D12, 'yes');
    ok(qs(a2.out).join() === 'keep' && !ORDERS_RE.test(a2.out) && !SECRECY_RE.test(a2.out) && (a2.out.match(/word for word/g) || []).length === 1, 'the second chained question (keep) is also reported neutrally, with the display requirement stated once');
    t = turn(D12, f, `Indexed.\n\n${shown(a2.out)}`, 'yes');
    ok(/<calibration-open-question id="keep">/.test(t) && !/Expected, and part of this same setup/.test(t), 'nothing follows the keep question, so nothing is announced for it');
    const a3 = ans(D12, 'yes');
    ok(!ORDERS_RE.test(a3.out) && !SECRECY_RE.test(a3.out) && /it was the last one from the harness/.test(a3.out), 'the last answer reports that it was the last question, with no orders aimed at the agent');
    fs.writeFileSync(SETTINGS, settingsSaved);
    const D13 = mk('data-chain-later', true); const g = convo(D13); const hl = begin(D13, g); turn(D13, g, shown(hl), 'later');
    const al = ans(D13, 'later');
    ok(al.code === 0 && !ORDERS_RE.test(al.out) && !SECRECY_RE.test(al.out) && !/say that's fine/i.test(al.out), '"later" is reported in the same neutral way'); }

  console.log('no, skip, later, switch off, ignored');
  const D2 = mk('data-queue-no', true); f = convo(D2);
  turn(D2, f, shown(begin(D2, f)), 'skip');
  r = ans(D2, 'skip');
  ok(r.code === 0 && state(D2).decision === 'no' && qs(r.out).join() === 'plans', '"skip" means no to calibrating, and the plans question comes in that same reply');
  turn(D2, f, shown(r.out), 'no'); r = ans(D2, 'no');
  ok(qs(r.out).join() === 'keep', '…then the keep question, in the reply that records the plans answer');
  turn(D2, f, shown(r.out), 'no'); r = ans(D2, 'no');
  ok(r.code === 0 && state(D2).keepDecision === 'no' && fs.readFileSync(SETTINGS, 'utf8') === settingsSaved, 'no to keeping: the settings file is byte-identical');
  const D3 = mk('data-queue-off', false); f = convo(D3);
  fs.writeFileSync(path.join(D3, 'switches.jsonc'), '{ "calibration": { "offerLongerHistory": false } }');
  turn(D3, f, shown(begin(D3, f)), 'no'); r = ans(D3, 'no');
  ok(qs(r.out).join() === 'plans', 'switch off: plans still follows in the same reply');
  turn(D3, f, shown(r.out), 'yes'); r = ans(D3, 'yes');
  ok(qs(r.out).length === 0 && !/365 days/.test(r.out) && /it was the last one/.test(r.out), 'switch set to false: the keep question never comes');
  const D5 = mk('data-queue-later', true); f = convo(D5);
  turn(D5, f, shown(begin(D5, f)), 'later');
  r = ans(D5, 'later');
  ok(r.code === 0 && /Recorded: later\. No further setup question this session/.test(r.out) && qs(r.out).length === 0 && !state(D5).openQuestion, '"later" pauses everything: no plans or keep question in that reply');
  ok([turn(D5, f, 'OK.', 'thanks'), turn(D5, f, 'Sure.', 'what next?'), turn(D5, f, 'Here.', 'ok cool')].every((x) => qs(x).length === 0), '…and none on the following messages of that session');
  t = start(D5, f, 'eeeeeeee-1111-1111-1111-111111111111');
  ok(qs(t).join() === 'calibrate' && /offer it once more now; this is the last time/.test(t), 'next session: the calibration offer once more, and only that');
  ok(qs(start(D5, f, 'ffffffff-1111-1111-1111-111111111111')).join() !== 'calibrate', '…and never a third time');
  const D4 = mk('data-queue-ignored', true); f = convo(D4);
  turn(D4, f, shown(begin(D4, f)), 'yes'); r = ans(D4, 'yes');
  const quiet = [turn(D4, f, shown(r.out), 'can you fix the build'), turn(D4, f, 'Looking.', 'and the tests'), turn(D4, f, 'Done.', 'thanks'), turn(D4, f, 'Sure.', 'what else')];
  ok(quiet.every((x) => qs(x).length === 0) && !state(D4).openQuestion && state(D4).plansDecision === undefined, 'a shown question the person ignores is closed after a few messages, nothing recorded, nothing new pushed');
  t = start(D4, f, 'dddddddd-1111-1111-1111-111111111111');
  ok(qs(t).join() === 'keep', 'next session: the next question (keep), once; the ignored one is not asked again');
}

console.log('cost wording');
{
  const C = require(path.join(ROOT, 'lib', 'calibration.js'));
  ok(C.money(0.0125) === 'about 1 cent' && C.money(0.03) === 'about 3 cents' && C.money(0.004) === 'under 1 cent' && C.money(2.5) === 'about $2.50' && C.money(0.996) === 'about $1.00', 'money reads naturally: about 1 cent, about 3 cents, under 1 cent, about $2.50');
  ok(C.moneyRange({ low: 0.0125, high: 0.125 }) === 'between 1 cent and 13 cents', 'ranges use the same wording');
}

console.log('choosing sessions (no model)');
r = cli(['estimate', '--sessions', '3']);
ok(r.code === 0 && /Would read 3 sessions/.test(r.out), 'estimate picks 3 sessions');
const listed = r.out.split('\n').filter((l) => /^\s+\d+\. /.test(l));
ok(listed[0] && listed[0].includes(S.corrections.slice(0, 8)), 'the recent session with corrections is ranked first');
ok(!r.out.includes(S.trivial.slice(0, 8)), 'a one-message session is left out');
ok(!cli(['estimate', '--sessions', '10']).out.includes('eeeeeeee'), 'a session started by a script (claude -p) is left out');
r = cli(['estimate', '--about', 'billing']);
ok(/Would read 1 session about "billing"/.test(r.out) && r.out.includes(S.billing.slice(0, 8)), '--about "billing" picks only the billing conversation');

console.log('sample');
r = cli(['sample', '--dry-run']);
ok(r.code === 0 && r.out.includes("keep the old export button and put the new one beside it"), 'dry-run sample shows the person\'s words verbatim');
ok(!r.out.includes('INJECTED NOISE') && !r.out.includes('PRIVATE TOOL OUTPUT') && !r.out.includes('SUBAGENT TEXT'), 'injected reminders, tool output and subagent text are not treated as the person');
ok(!fs.existsSync(ARGLOG) && noteCount() === 0, 'dry run: no model call, nothing saved');
r = cli(['sample']);
ok(r.code === 0 && /only a sample: it is not part of your calibration\.\s*$/.test(r.out) && noteCount() === 0, 'live sample shows one note and adds nothing to the calibration');
ok(!/calibration-sample\.json|state\/|\/data\//.test(r.out), 'the person sees no internal file path');
ok(!/agentBelieved|personMeant|mightNotApply|quoteVerified|"ref"|"strength"|"why"|hard-lean|[{}]/.test(r.out), 'the sample is plain sentences: no field names, no JSON');
ok(/Where you had to correct the agent:/.test(r.out) && /You said: "good\. from now on check with me before removing anything people already use"/.test(r.out), 'a correction reads as a sentence, with the person\'s exact words quoted');
ok(/What you lean toward:\n- When writing to them, you lean toward plain words\./.test(r.out), 'a lean reads as "When …, you lean toward …"');
ok(!/I absolutely adore long dashboards/.test(r.out), 'words the person never said are not shown as theirs');
const sampleFile = path.join(DATA, 'state', 'calibration-sample.json');
ok(fs.existsSync(sampleFile) && JSON.parse(fs.readFileSync(sampleFile, 'utf8')).corrections[0].quoteVerified === true, 'the structured JSON of the sample is kept on disk');

const a0 = JSON.parse(fs.readFileSync(ARGLOG, 'utf8').trim().split('\n')[0]);
ok(a0.args.includes('--no-session-persistence') && a0.args[a0.args.indexOf('--tools') + 1] === '' && a0.args[a0.args.indexOf('--model') + 1] === 'haiku', 'model call: Haiku, no tools, no saved transcript');
ok(a0.nested === '1', 'model call is marked nested, so the harness hooks stay out of it');

console.log('the light self-priming');
r = cli(['run', '--dry-run', '--sessions', '2']);
ok(r.code === 0 && /Dry run: no model was called/.test(r.out) && noteCount() === 0, 'run --dry-run calls nothing and saves nothing');
r = cli(['run', '--sessions', '2']);
ok(/skipped\. Cost under 1 cent in total\./.test(r.out) && !/for the session notes/.test(r.out), 'parts under a cent: one cost figure in total, no split');
ok(r.code === 0 && noteCount() === 2, `run --sessions 2 saves 2 session notes (${noteCount()})`);
const note = JSON.parse(fs.readFileSync(path.join(notesDir, `${S.corrections}.json`), 'utf8'));
ok(note.corrections[0].quoteVerified === true && note.corrections[0].ref === 'U3', 'a real quote of the person is kept, and a wrong message reference is corrected to the right one');
ok(note.preferences[0].quoteVerified === false && note.preferences[0].quote === null, 'a quote the person never said is removed');
ok(note.status === 'unconfirmed' && note.source && note.source.transcript, 'each note says it is unconfirmed and points at its source session');
const mapFile = path.join(DATA, 'records', 'calibration', 'understanding-map.md');
const map = fs.existsSync(mapFile) ? fs.readFileSync(mapFile, 'utf8') : '';
ok(map.startsWith('# Calibration map'), 'the understanding map is written');
ok(map.includes('"check with me before removing anything"'), 'a real quote in the map keeps its quotation marks');
ok(!map.includes('"they love dashboards more than anything"') && map.includes('they love dashboards more than anything'), 'an invented quote in the map loses its quotation marks');
r = cli(['run', '--sessions', '2']);
ok(/Calibrating from 0 sessions \(2 already done earlier\)/.test(r.out) && /Understanding map: unchanged \(nothing new to add to it\)/.test(r.out), 'running again resumes instead of paying twice, and says the map is unchanged');
ok(JSON.parse(fs.readFileSync(path.join(DATA, 'state', 'calibration.json'), 'utf8')).costCounts.map === 1, 'with nothing new, the map is not rebuilt (no extra model call)');
r = cli(['map']);
ok(r.code === 0 && /Cost under 1 cent\./.test(r.out), 'rebuilding the map reports its own cost');
const stAfterMap = JSON.parse(fs.readFileSync(path.join(DATA, 'state', 'calibration.json'), 'utf8'));
ok(stAfterMap.lastMap && stAfterMap.lastMap.costUsd > 0 && stAfterMap.costs.map >= 2 * 0.0012 - 1e-9, 'the map\'s model call is recorded in the cost (both map builds counted)');
ok(Math.abs(stAfterMap.costs.total - (stAfterMap.costs.sessionNotes + stAfterMap.costs.map + stAfterMap.costs.sample)) < 1e-9, 'total spent = session notes + map + samples');
r = cli(['status']);
ok(/spent so far: .*2 maps /.test(r.out), 'status shows what was spent, and says "2 maps" when two map builds are summed');
ok(/session notes: 2/.test(r.out) && /understanding map: yes/.test(r.out), 'status reports notes and map');

console.log('how the harness reads it afterwards');
h = hook('88888888-8888-8888-8888-888888888888');
ok(h.out.includes('<calibration-understanding') && h.out.includes('Calibration map'), 'session start hands the agent the map');
ok(h.out.includes('never treat them as rules'), '…framed as leans to weigh, not rules');
const { searchRecords } = require(path.join(ROOT, 'mcp', 'agent-find', 'lib', 'sources', 'records.js'));
searchRecords('old export', path.join(DATA, 'records')).then((hits) => {
  ok(hits.some((x) => x.meta.path.startsWith('calibration/') && x.searchText.includes('old export')), 'the built-in memory search finds the calibration notes');
  finish();
}).catch((e) => { ok(false, `memory search: ${e.message}`); finish(); });

function finish() {
  console.log('plans and notes');
  r = cli(['plans', '--dry-run']);
  ok(/Found 1 plan and 1 memory note/.test(r.out) && !fs.existsSync(path.join(DATA, 'records', 'calibration', 'plans')), 'plans --dry-run lists and writes nothing');
  r = cli(['plans']);
  const pdir = path.join(DATA, 'records', 'calibration', 'plans');
  ok(r.code === 0 && fs.readdirSync(pdir).length === 2, 'plans indexes the plan and the memory note');
  ok(/1 already current|Indexed 0 new or changed, 2 already current/.test(cli(['plans']).out), 'indexing again only touches what changed');

  console.log('choices and failure');
  cli(['decide', 'skip']);
  ok(!hook('aaaaaaaa-9999-9999-9999-999999999999').out.includes('<calibration-question id="calibrate">'), 'after skip (= no), never offered again');
  r = cli(['run', '--sessions', '3', '--redo'], { ALIGNMENT_HARNESS_CALIBRATION_CMD: BROKEN });
  ok(r.code !== 0 && /Stopped early: the model could not be reached/.test(r.out), 'model unreachable: stops after 3 tries and says why');
  ok(noteCount() === 2, 'a failed run leaves the earlier notes alone');
  r = cli(['sample'], { ALIGNMENT_HARNESS_CALIBRATION_CMD: path.join(T, 'does-not-exist') });
  ok(r.code === 1 && /could not be made/.test(r.out), 'missing Claude Code: one plain sentence, no crash');
  fs.writeFileSync(path.join(DATA, 'state', 'calibration.json'), '{ not json');
  h = hook('ffffffff-0000-0000-0000-000000000000');
  ok(h.code === 0, 'a corrupted state file never stops the session (fail open)');
  r = cli(['forget']);
  ok(/Run again with --yes/.test(r.out) && noteCount() === 2, 'forget without --yes only says what it would delete');
  r = cli(['forget', '--yes']);
  ok(noteCount() === 0 && !fs.existsSync(mapFile) && fs.existsSync(path.join(PROJ, `${S.corrections}.jsonl`)), 'forget --yes deletes the harness\'s notes and map, never the person\'s sessions');

  fs.rmSync(T, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

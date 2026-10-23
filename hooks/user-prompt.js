'use strict';
// UserPromptSubmit — the start of the per-message understanding loop.
//
// These three pieces only work together, which is why they ship as one unit:
//   - this hook ARMS the coherence gate when a person actually speaks and puts
//     the coherence ritual in front of the agent;
//   - session-start.js picks which wording of the ritual this session uses;
//   - pre-tool.js ENFORCES it: action tools wait until the agent has written
//     its understanding and attested.
// Without this hook the gate is never armed and silently never fires.
//
// It also writes the governer's provisional keyword guess (labelled as such),
// shows the agent the real score if one exists, and keeps a local copy of the
// person's words for after compaction.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const core = require('../lib/core');
const governer = require('../lib/governer');
const h = require('./common');

const ACKS = new Set(['ok', 'okay', 'yes', 'no', 'yep', 'nope', 'sure', 'thanks', 'ty', 'k', 'y', 'n', 'lgtm', '', 'done', 'nice', 'cool', 'great', 'good', 'fine', 'right', 'correct', 'exactly', 'perfect', 'agreed']);

function stripSystemBlocks(text) {
  return String(text || '')
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<task-notification>[\s\S]*?<\/task-notification>/g, '')
    .replace(/<persisted-output>[\s\S]*?<\/persisted-output>/g, '')
    .trim();
}

// Fixes a documented, known gap (docs/build/calibrate.md section 3, item 2:
// "Only match the person's own typed words — the remaining gap is pasted
// text... drop quoted lines (>), fenced blocks, and long pasted passages
// that look like agent output"). Before this fix, a person pasting back an
// agent's report or a quoted reply that happened to contain a confusion
// phrase — e.g. `Here is the assistant reply I got: "I have no idea what
// you mean by that..."` — fired the same /calibrate re-grounding as if THEY
// were the one confused, on an estimated 15-25% of firings on real usage
// (per the build doc). The detector has no way to know intent from raw text
// alone, so this narrows what counts as the person's own words: strip
// double-quoted spans, single-quoted spans, markdown blockquote lines
// ("> ..."), and fenced code blocks before matching — a confusion phrase
// the person is reporting or quoting from elsewhere no longer trips the
// trigger, while typing it plainly still does.
function stripQuotedAndPasted(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/^>.*$/gm, ' ') // markdown blockquote lines
    .replace(/"(?:[^"\\]|\\.)*"/g, ' ') // double-quoted spans (reported/quoted speech)
    .replace(/(?:^|[^A-Za-z])'(?:[^'\\]|\\.)*'/g, ' '); // single-quoted spans (not possessives)
}

function isConfusion(msg) {
  const ownWords = stripQuotedAndPasted(msg);
  const m = ownWords.toLowerCase().replace(/'/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  return /(dont understand|do not understand|dont know what (your|youre) talking about|what are you (even )?talking about|no idea what you|have no idea what)/.test(m);
}

function runMemorySearch(cmd, query) {
  try {
    const outp = execFileSync('/bin/sh', ['-c', `${cmd} "$1"`, 'memory-search', query], {
      timeout: 1500, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024,
    });
    return String(outp || '').slice(0, 6000).trim();
  } catch (_) { return ''; }
}

h.run('user-prompt', (input) => {
  const { switches } = core.loadSwitches();
  const sid = h.sessionIdOf(input);
  core.ensureDirs();
  h.writeLastSession(input);

  const raw = String(input.prompt || input.message || '');
  const msg = stripSystemBlocks(raw);
  const words = msg.split(/\s+/).filter(Boolean);

  // Trivial acknowledgements ("ok", "thanks") don't re-arm anything.
  if (words.length < 3 && ACKS.has(msg.toLowerCase().replace(/\s/g, ''))) {
    core.log('UserPromptSkipped', { sessionId: sid, reason: 'trivial' });
    return;
  }

  // Only a real person speaking arms the gate. Automatic "continue" prompts,
  // subagent notifications and scheduled autofires are not someone speaking.
  const isContinue = /^Continue from where you left off\.?$/.test(msg);
  const isScheduled = raw.includes('<scheduled-task');
  const realSpeech = msg.length > 0 && !isContinue && !isScheduled;

  const cg = switches.coherenceGate || {};
  const gateOn = cg.enabled !== false && cg.strength !== 'off';
  const gateFile = path.join(core.P.coherence, `required-${core.safeId(sid)}`);
  if (gateOn && realSpeech) {
    fs.writeFileSync(gateFile, core.nowIso());
    core.resetBlocks(sid, 'coherence');
    core.resetBlocks(sid, 'scope');
    core.resetBlocks(sid, 'highLeverage');
    core.log('CoherenceGateArmed', { sessionId: sid });
  }
  if (realSpeech) {
    // The user spoke: that is the go (or the no) a top-band wait was waiting for.
    try { fs.unlinkSync(core.highLeverageWaitFile(sid)); core.log('HighestLeverageWaitEnded', { sessionId: sid }); } catch (_) { /* no wait */ }
  } else if (isScheduled) {
    try { fs.unlinkSync(gateFile); } catch (_) { /* none */ }
  }
  if (!realSpeech && !cg.forceOnMidExecutionEvents) {
    core.log('UserPromptInternalEvent', { sessionId: sid });
    return;
  }

  // ── Governer: provisional guess + the real score if there is one ──────────
  const gv = switches.governer || {};
  let baseline = null;
  if (gv.enabled !== false && gv.writeProvisionalBaseline !== false && realSpeech) {
    try { baseline = governer.writeBaseline(sid, msg); } catch (_) { baseline = null; }
  }
  const cs = core.currentScore(sid);

  const u = switches.understanding || {};
  // Everything below is kept SHORT on purpose: Claude Code replaces large hook
  // output with a 2 KB preview plus a file path, so the model would never see
  // most of a long protocol. The essentials go inline; the full wording lives
  // in files the agent is pointed to and may Read (reading never waits).
  const parts = [];
  parts.push('<alignment-harness event="message">');

  if (u.markHumanMessage !== false && msg) {
    parts.push(msg.length <= 1500
      ? `<user-message priority="primary" context="verbatim explicit message from the user, all actions must be aligned with this">\nEverything between these tags is the actual human user speaking.\nThis takes precedence over ALL other context in this turn.\nDerive your COHERENCE_CHECK "Asked:" field from THIS message — not from prior session context.\n\n${msg}\n</user-message>`
      : 'The user\'s message above is the primary instruction for this turn; it outranks everything else, including earlier context.\nDerive your COHERENCE_CHECK "Asked:" field from THIS message — not from prior session context.');
  }

  if (u.calibrateOnConfusion !== false && isConfusion(msg)) {
    core.log('ConfusionSignal', { sessionId: sid });
    parts.push(`<calibrate-injection priority="high" trigger="confusion-signal-detected">
The user's message contains a confusion signal — they do not understand what the agent was communicating.

MANDATORY: Before responding to this message, invoke the /alignment-harness:calibrate skill.
This is the same as if the user had typed /alignment-harness:calibrate themselves.

Do NOT explain what you're about to do. Just invoke the Skill tool with skill="alignment-harness:calibrate" immediately as your first action.
</calibrate-injection>`);
  }

  let gateBlocks = '';
  if (gateOn) {
    let variant = 'control';
    try { variant = fs.readFileSync(path.join(core.P.coherence, `variant-${core.safeId(sid)}`), 'utf8').trim() || 'control'; } catch (_) { /* control */ }
    const scoreLine = cs.scored
      ? `${cs.score}/100, scored by you${cs.calibrated ? '' : ' (uncalibrated)'} — ${governer.describeScore(cs.score)}.`
      : `not scored yet — run /alignment-harness:governer once a clear task is confirmed (edits wait for it).${baseline && baseline.score !== null ? ` Keyword hint only: ${baseline.score} (${baseline.why}).` : ''}`;
    // The score the gate blocks show, and the certainty that score asks for (the same bands as
    // governer.describeScore). Before the task is scored, the keyword hint stands in; with no number
    // at all the floor is 80, the author's own default.
    const shownScore = cs.scored ? cs.score : (baseline && baseline.score !== null && baseline.score !== undefined ? baseline.score : null);
    const confidenceFloor = shownScore === null ? 80 : shownScore < 20 ? 70 : shownScore < 60 ? 80 : shownScore < 80 ? 85 : 90;
    const body = core.loadPrompt('per-message.txt', {
      SCORE: cs.scored ? String(cs.score) : 'unscored',
      CONFIDENCE_FLOOR: String(confidenceFloor),
      CONTEXT_DIR: path.join(core.P.data, 'context'),
      VARIANT_LINE: variant === 'per-item-96-escalation'
        // The author's own sentences from coherence-questions.per-item-96-escalation.txt, word for word.
        ? `For every distinct thing you claimed to understand above — every read of intent, every read of need, every task you said you would do, every assumption embedded in your reads — print your honest certainty as a percentage after it.
For any item below 96%, run agent_find once on that specific thing and re-rank honestly. If still below 96% after that one shot, you've established you can't close the gap from context alone. DO NOT engage the user with a raw question — a bare question forces the user to do the work of answering. Instead, the escalation is ALWAYS the same single action:
— Run /ask {the specific unclear thing}.\n`
        : '',
      ATTEST_LINE: cg.strength === 'remind'
        ? ''
        : `After printing it, attest with what you printed, as its own command (no permission prompt; it is saved so the user can check it):\n  node "${path.join(core.PLUGIN_ROOT, 'bin', 'alignment-harness')}" attest --session ${core.safeId(sid)} --certainty <1-100> --scope <TRUE|FALSE> --intent "<what they want and why, as you heard it, in their words>"\n`,
      RITUAL_PATH: path.join(core.PLUGIN_ROOT, 'prompts', variant === 'per-item-96-escalation' ? 'coherence-questions.per-item-96-escalation.txt' : 'coherence-ritual.txt'),
      SCORE_LINE: gv.enabled === false ? 'off' : scoreLine,
      CONTRACT_LINE: (u.injectVerificationContract !== false && (!cs.scored || cs.score >= 20))
        ? core.loadPrompt('verification-contract.txt', { SCORE: cs.scored ? String(cs.score) : 'unscored', CLI: 'alignment-harness' }).trim()
        : '',
    });
    // Everything above the {{OVERFLOW}} line must stay visible: the coherence instructions, the
    // attest command, the score, and the instruction to load the saved file when the text is
    // shortened. The gate blocks below it may land in that saved file (see contextOut's cap).
    const [bodyHead, bodyTail = ''] = body.split('{{OVERFLOW}}');
    parts.push(bodyHead.trim());
    gateBlocks = bodyTail.trim();
    if (cg.injectFullRitualText === true) parts.push(core.loadPrompt('coherence-ritual.txt'));
  } else if (gv.enabled !== false && gv.injectScoreBanner !== false) {
    parts.push(`GOVERNER: ${cs.scored ? `${cs.score}/100 — ${governer.describeScore(cs.score)}` : 'not scored yet — run /alignment-harness:governer once a clear task is confirmed.'}`);
  }

  // ── The session's own scope declaration, read back every message ─────────
  const sc = switches.scope || {};
  if (sc.showOnEveryMessage !== false) {
    try {
      const rec = require('../lib/records').getCompaction(sid);
      const d = rec && !rec.auto && rec.scopeDeclaration;
      if (d && d.intent) {
        const items = (d.decomposed || []).slice(0, 8).map((x, i) => `  ${i + 1}. ${String(x).slice(0, 200)}`).join('\n');
        parts.push(`SCOPE you declared (${d.certainty}% sure; update with alignment-harness compaction scope … if this message changes it): ${String(d.intent).slice(0, 400)}${items ? `\n${items}` : ''}${d.boundary ? `\nNot in scope: ${String(d.boundary).slice(0, 200)}` : ''}`);
        const gate = Number(sc.certaintyGate || 90);
        if (Number(d.certainty) < gate) {
          parts.push(`<scope-certainty-gate certainty="below-${gate}">
YOUR SCOPE CERTAINTY IS BELOW ${gate}%. Before doing ANY work on this task:

1. Invoke /reflect — articulate what you're uncertain about
2. PREDICT the most likely interpretation of the human's intent
3. UPDATE your scopeDeclaration on the compaction (alignment-harness compaction scope --intent "..." --certainty N)
4. State your predicted scope to the human as a proposal and PROCEED

NEVER stop work to ask. Intent > Gap > Path > Proposal.
The human corrects a wrong proposal faster than they answer an open question.

Certainty is not confidence in your ability — it's confidence that you understand
WHAT THE HUMAN WANTS. When uncertain, predict and propose — don't stall.
</scope-certainty-gate>`);
        }
      }
    } catch (_) { /* no record */ }
  }

  if (u.memorySearchCommand && words.length >= 3) {
    const q = msg.slice(0, 200).replace(/\s+/g, ' ');
    const res = runMemorySearch(u.memorySearchCommand, q);
    core.log('MemorySearch', { sessionId: sid, resultLen: res.length });
    if (res) parts.push(`MEMORY (optional context from past work):\n${res.slice(0, 1500)}`);
  }

  // Last turn ended without the hand-back: the reminder saved by hooks/stop.js, shown once.
  if (realSpeech) {
    const reminder = core.takeTurnEndReminder(sid);
    if (reminder) { parts.push(reminder); core.log('TurnEndReminderShown', { sessionId: sid }); }
  }

  // The author's governer, task and contract blocks go last: if the whole text is over the
  // visible cap, they are what lands in the saved file the agent was told to load.
  if (gateBlocks) parts.push(gateBlocks);

  parts.push('</alignment-harness>');

  // ── Keep the person's words, word for word, on this machine ───────────────
  if (u.captureMessagesVerbatim !== false && msg && words.length >= 3) {
    try {
      const file = path.join(core.P.verbatim, `${core.safeId(sid)}.jsonl`);
      const hash = crypto.createHash('md5').update(msg).digest('hex');
      const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (!existing.includes(`"hash":"${hash}"`)) {
        fs.appendFileSync(file, `${JSON.stringify({ type: 'user_message', hash, timestamp: core.nowIso(), content: msg })}\n`);
      }
    } catch (_) { /* ignore */ }
  }

  h.contextOut(`${parts.filter(Boolean).join('\n')}\n`, 'message');
});

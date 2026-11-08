'use strict';
// What every setting in config/switches.default.jsonc means to the person, and which values it
// accepts. The settings page, `alignment-harness settings list --json` and `alignment-harness
// switch` all read this one list, so the agent and the page can never disagree about a setting.
//
// The defaults file stays the source of truth for WHICH settings exist and their default values.
// This file only adds plain names, allowed values and the "what this does for you" text. A setting
// that is in the defaults file but missing here still works everywhere: its allowed values are
// inferred from its default (true/false, a whole number, or text), and it is listed with the
// comment from the defaults file. A test checks that every setting is covered, so new ones get
// their plain words before they ship.

const ONOFF = { type: 'boolean' };
const int = (min, max) => ({ type: 'integer', min, max });
const oneOf = (...values) => ({ type: 'enum', values });
// Commands that run on your machine on every message. The page shows them but does not write
// them (a web page should not be able to set a shell command); the CLI and /harness-setup can.
const COMMAND = { type: 'text', pageEditable: false };

// The order of GROUPS is the order things happen in a session.
const GROUPS = [
  { id: 'message', name: 'When you send a message' },
  { id: 'edits', name: 'Before the agent edits' },
  { id: 'done', name: "When the agent says it's done" },
  { id: 'subagents', name: 'Handing work to subagents' },
  { id: 'end', name: 'When the session ends' },
  { id: 'behind', name: 'Behind the scenes' },
];

// Value labels for the segmented control at the top of a row.
const STRENGTH_LABELS = { block: 'Block', remind: 'Remind', off: 'Off', 'block-once': 'Once' };

const SECTIONS = [
  {
    key: 'coherenceGate',
    name: 'Coherence check',
    group: 'message',
    doc: 'coherence-gate.md',
    what: 'The agent shows you what it understood before it changes anything.',
    forYou: "When you send a message, the agent's first move is to show you what it understood: your intent with a certainty %, what you need from it, every task or complaint it heard, and every thread still open. A misreading gets caught in one sentence, at the moment it forms, instead of three files later. It's a header on the reply, not a pause; the agent keeps working after writing it.",
    ifOff: 'The agent goes straight to work. You find out it misread you when the result arrives, and you spend a message un-teaching it.',
    headingsWhy: "These capitalised headings are the agent's own check-in notes. It writes them at the top of its reply so it keeps hold of what you meant, and so a misread is caught before it builds on it. They come in a fixed shape because the harness reads them back: the gate checks for them, and later sessions learn from what you confirmed or corrected. Skim them; if a line is wrong, correct it in one sentence.",
    headings: [
      ['COHERENCE_CHECK', 'marks the start of the check. The gate looks for it, and the learning loop collects it together with your reply.'],
      ['--scope TRUE / FALSE (in the attest line)', "says whether your message added work. Each new thing also goes in the agent's task list, as its own item in your words."],
      ['PENDING_SCOPE', 'lists every open thread, one line each, so nothing you asked for goes missing between turns.'],
    ],
    primary: { enabledKey: 'coherenceGate.enabled', strengthKey: 'coherenceGate.strength' },
    healthPieces: ['coherence gate'],
    healthEvents: ['CoherenceGateArmed', 'CoherenceGateAttested', 'CoherenceGateBlocked', 'CoherenceGateDowngraded'],
    settings: {
      enabled: { label: 'Ask for the check at all', allowed: ONOFF },
      strength: { label: 'How firmly', allowed: oneOf('block', 'remind', 'off') },
      maxBlocksPerMessage: { label: 'Stop blocking after this many blocks on one message', allowed: int(0, 50) },
      variant: { label: 'Wording', allowed: oneOf('control', 'per-item-96-escalation', 'ab-test') },
      forceOnMidExecutionEvents: { label: 'Also on automatic "continue" prompts', allowed: ONOFF },
      injectFullRitualText: { label: 'Paste the full wording on every message', allowed: ONOFF },
      requireRitualReadOncePerSession: { label: 'Agent reads the full wording once per session', allowed: ONOFF },
      requirePrintedCheck: { label: 'The check only counts once you could actually see it', allowed: ONOFF },
      requireScopeReflection: { label: 'New scope is restated to you before work on it starts', allowed: ONOFF },
      highestLeverageWait: { label: 'At score 80+ the agent names the stakes and waits for your go', allowed: ONOFF },
      blockRoundMs: { label: 'Blocks this close together (milliseconds) count as one', allowed: int(0, 60000) },
    },
  },
  {
    key: 'understanding',
    name: 'Understanding loop',
    group: 'message',
    doc: 'understanding-loop.md',
    what: 'Your words come first, and survive compaction word for word.',
    forYou: "Every message you send reaches the agent with your own words marked as yours, so it starts from your meaning rather than its guess. Your messages are also kept word for word on this machine and put back in front of the agent after a long conversation is compacted: a summary loses nuance, your words don't.",
    ifOff: 'Each of these is separate. Turning one off removes only that addition. For example, with "Keep your words" off, a compacted conversation carries on from the summary alone.',
    primary: null,
    healthPieces: ['memory search'],
    healthEvents: ['ConfusionSignal', 'VerbatimRehydrated', 'MemorySearch'],
    settings: {
      markHumanMessage: { label: 'Mark your words as yours', allowed: ONOFF },
      calibrateOnConfusion: { label: "When you say you're lost, the agent recalibrates before replying", allowed: ONOFF },
      injectAlignmentQuestions: { label: 'Ask the agent what you asked for, the result, and the motive', allowed: ONOFF, note: 'The "MANDATORY FIRST RESPONSE" block. It travels with the coherence check, so it is only sent while the coherence check is on.' },
      injectTaskTracking: { label: 'Ask the agent to turn your requirements into tracked tasks', allowed: ONOFF, note: 'The task-tracking block. It travels with the coherence check, so it is only sent while the coherence check is on.' },
      injectVerificationContract: { label: 'Ask for written checks on scored work', allowed: ONOFF, note: 'The verification-contract block. It travels with the coherence check, so it is only sent while the coherence check is on.' },
      captureMessagesVerbatim: { label: 'Keep your words, word for word, on this machine', allowed: ONOFF },
      rehydrateAfterCompaction: { label: 'Put your words back after compaction', allowed: ONOFF },
      memorySearchCommand: { label: 'Memory search command', allowed: COMMAND, note: 'A command that runs on your machine on every message. Set it with /alignment-harness:harness-setup, or in the terminal. Empty means off.' },
    },
  },
  {
    key: 'scope',
    name: 'Scope read-back',
    group: 'message',
    doc: 'settings.md',
    docAnchor: 'scope-read-back',
    what: 'The agreed scope is shown again on every message, so the work keeps checking itself against it.',
    forYou: 'When the agent writes down what this session is for, that scope is shown back to it on every message, so the work keeps checking itself against what was agreed. If its certainty is low, it is told to state its best reading to you as a proposal and carry on, rather than stall.',
    ifOff: "The agent's written scope stays saved but isn't shown to it again, so drifting from what was agreed is easier to miss.",
    primary: { toggleKey: 'scope.showOnEveryMessage' },
    healthPieces: [],
    healthEvents: [],
    settings: {
      showOnEveryMessage: { label: 'Show the scope on every message', allowed: ONOFF },
      certaintyGate: { label: 'Below this certainty, the agent reflects and proposes', allowed: int(0, 100) },
    },
  },
  {
    key: 'governer',
    name: 'Governer: risk score',
    group: 'edits',
    doc: 'governer.md',
    what: 'One 0–100 number for how much a mistake could cost. A typo fix gets out of the way; a payment change gets every check.',
    forYou: 'Before real work starts, the agent answers in writing what could go wrong for a real person and how far a mistake would travel. That becomes one 0–100 number the other checks read, so a one-line typo fix gets out of the way and a change to how payment works gets every check.',
    ifOff: 'Edits no longer wait for a score, and every task is treated alike: the evidence gate treats unscored work as needing proof, and big changes lose the extra care a high score asks for.',
    primary: { enabledKey: 'governer.enabled', strengthKey: 'governer.gateStrength' },
    healthPieces: ['governer', 'risk table', 'skill prediction'],
    healthEvents: ['GovernerScored', 'GovernerGateBlocked', 'GovernerGateReminded'],
    settings: {
      enabled: { label: 'Score tasks at all', allowed: ONOFF },
      gateStrength: { label: 'Edits wait for a score', allowed: oneOf('block', 'remind', 'off') },
      maxBlocksPerSession: { label: 'Stop blocking after this many blocks in a session', allowed: int(0, 50) },
      criticalMassFloor: { label: 'When two danger answers are 8 or more, raise the score to at least', allowed: int(0, 100) },
      writeProvisionalBaseline: { label: 'Note a quick keyword guess on each message (a hint only)', allowed: ONOFF },
      injectScoreBanner: { label: 'Show the score on every message', allowed: ONOFF, note: 'Used when the coherence check is off; while it is on, the score is part of the coherence check message.' },
      applyToSubagents: { label: 'Edits inside subagents wait for a score too', allowed: ONOFF },
      'predictRequiredSkills.enabled': { label: 'Predict which skills the task needs', allowed: ONOFF },
      'predictRequiredSkills.oracleCommand': { label: 'Skill-prediction command', allowed: COMMAND, note: 'A command that runs on your machine. Set it with /alignment-harness:harness-setup, or in the terminal. Empty means not set up.' },
    },
  },
  {
    key: 'intentSearchGate',
    name: 'Search memory before code',
    group: 'edits',
    doc: 'subagents-and-session-end.md',
    what: 'The agent starts from what you already decided, not a cold guess from the code.',
    forYou: "Once per session, the first code search waits until the agent has searched what's already known: past sessions, decisions, docs and records. It starts from what you already decided, not a cold guess from the code.",
    ifOff: 'The agent searches the code straight away, and may rebuild an answer you had already settled.',
    primary: { strengthKey: 'intentSearchGate.strength' },
    healthPieces: [],
    healthEvents: ['IntentSearchGate'],
    settings: {
      strength: { label: 'How firmly', allowed: oneOf('block-once', 'remind', 'off') },
    },
  },
  {
    key: 'evidenceGate',
    name: 'Evidence gate',
    group: 'done',
    doc: 'evidence-gate.md',
    what: '"It works" has to come with something the agent actually ran this turn.',
    forYou: 'An agent saying "it works" is not the same as it working. When the agent tries to finish, it is sent back if it claims something works, passes or is fixed and nothing it ran this turn shows it, or if it edited code and ran nothing at all. You get proof, not a self-graded report.',
    ifOff: '"Done, it works" comes back on the agent\'s word alone. You find out whether it works by trying it yourself.',
    primary: { enabledKey: 'evidenceGate.enabled', strengthKey: 'evidenceGate.strength' },
    healthPieces: ['evidence gate'],
    healthEvents: ['EvidenceGateBlocked', 'EvidenceGatePass', 'EvidenceGateReminded'],
    settings: {
      enabled: { label: 'Check finishes at all', allowed: ONOFF },
      strength: { label: 'How firmly', allowed: oneOf('block', 'remind', 'off') },
      applyToSubagents: { label: "Also check subagents' finishes", allowed: ONOFF },
      editsNeedProofAtScore: { label: 'Edited code but ran nothing: send back from this score', allowed: int(0, 100) },
      contractsAtScore: { label: 'Hold the agent to its written checks from this score', allowed: int(0, 100) },
      maxBlocksPerSession: { label: 'Stop blocking after this many blocks in a session', allowed: int(0, 50) },
      claimSensitivity: { label: 'How readily "it works" counts as a claim', allowed: oneOf('strict', 'normal') },
    },
  },
  {
    key: 'turnEnd',
    name: 'Hand-back at end of turn',
    group: 'done',
    doc: 'turn-end.md',
    what: "Real work ends with how to see it, what changed for people, and what's unfinished.",
    forYou: "A turn that did real work ends with you able to see it in seconds: how to look at it, what changed for people, and what's unfinished. If a turn ends without it, the agent is reminded at the start of its next turn; nothing ever waits on it.",
    ifOff: "Turns end wherever the agent stops, and you may have to ask how to see the result or what's left.",
    primary: { enabledKey: 'turnEnd.enabled', strengthKey: 'turnEnd.strength' },
    healthPieces: [],
    healthEvents: ['TurnEndReminderSaved', 'TurnEndReminderShown', 'TurnEndPass'],
    settings: {
      enabled: { label: 'Ask for the hand-back at all', allowed: ONOFF },
      strength: { label: 'How firmly', allowed: oneOf('remind', 'block-once', 'off') },
      scoreAbove: { label: 'Only for tasks scored above', allowed: int(0, 100) },
      requirementCapture: { label: 'Flag requirements you stated that got no task', allowed: ONOFF },
    },
  },
  {
    key: 'correctionPatterns',
    name: 'Standing corrections',
    group: 'done',
    doc: 'turn-end.md',
    what: "Something you've corrected more than once comes back to the agent before it repeats it.",
    forYou: "Something you've corrected more than once becomes a standing note. When a turn touches it, the note is put in front of the agent before it repeats the mistake, so you teach it once rather than every week.",
    ifOff: "Your recorded corrections stay saved but aren't shown to the agent, so you may find yourself correcting the same thing again.",
    primary: { toggleKey: 'correctionPatterns.enabled' },
    healthPieces: [],
    healthEvents: ['CorrectionPatternFired'],
    settings: {
      enabled: { label: 'Show standing corrections to the agent', allowed: ONOFF },
      activateAtEvidence: { label: 'A correction becomes standing after this many times', allowed: int(1, 100) },
      maxPerTurn: { label: 'At most this many notes per turn', allowed: int(0, 20) },
    },
  },
  {
    key: 'subagents',
    name: 'Subagent alignment',
    group: 'subagents',
    doc: 'subagents-and-session-end.md',
    what: 'A helper agent gets the task\'s risk and states what a person will experience before it builds.',
    forYou: "A helper agent starts with none of your conversation. When work is handed to one, it gets the task's risk and is asked to state the exact result a person will experience before it builds, so splitting work across agents doesn't multiply misreadings.",
    ifOff: 'Helper agents start from the task text alone, with no risk hint and no ask to state the result first.',
    primary: { toggleKey: 'subagents.injectAlignmentAtStart' },
    healthPieces: [],
    healthEvents: ['SubagentStart'],
    settings: {
      injectAlignmentAtStart: { label: 'Give subagents the alignment footing at start', allowed: ONOFF },
    },
  },
  {
    key: 'sessionEnd',
    name: 'Session record and cleanup',
    group: 'end',
    doc: 'subagents-and-session-end.md',
    what: 'Nothing you asked for dies with the transcript.',
    forYou: "When a session ends and the agent never wrote a record of it, an automatic one is saved, so nothing you asked for dies with the transcript. Likely corrections in your messages are kept for you to review, and the session's temporary files are tidied away.",
    ifOff: 'Each part is separate. With the automatic record off, a session that never wrote its own record leaves none behind.',
    primary: null,
    healthPieces: [],
    healthEvents: ['SessionEnd', 'SessionEndAutoCompaction'],
    settings: {
      autoCompaction: { label: 'Save an automatic record if the agent wrote none', allowed: ONOFF },
      collectCorrectionCandidates: { label: 'Note likely corrections for you to review', allowed: ONOFF },
      cleanUp: { label: "Remove the session's temporary gate files", allowed: ONOFF },
    },
  },
  {
    key: 'calibration',
    name: 'First-session calibration',
    group: 'behind',
    doc: 'calibration.md',
    what: 'On the first session, an offer to learn from your past sessions, so the harness doesn\'t start from nothing.',
    forYou: "The harness starts knowing nothing about you, so every intent has to be worked out from scratch. On the first session it offers, once, to read your most useful past Claude Code sessions (only with your yes) and build one map of what you're after, where you corrected the agent and your words for things. The agent reads that map at the start of every session.",
    ifOff: 'These two dials only shape the extra offer about keeping Claude Code sessions longer. The calibration offer itself is described in its documentation.',
    primary: null,
    healthPieces: [],
    healthEvents: [],
    settings: {
      offerLongerHistory: { label: 'Also offer to keep Claude Code sessions longer', allowed: ONOFF, note: 'Claude Code deletes sessions after 30 days by default. With this on, once the earlier setup questions are answered the harness asks you one separate question about keeping them longer, and changes that one Claude Code setting only if you say yes to it.' },
      longerHistoryDays: { label: 'How many days to offer', allowed: int(1, 3650) },
    },
  },
  {
    key: 'telemetry',
    name: 'Local log',
    group: 'behind',
    doc: 'settings.md',
    docAnchor: 'local-log',
    what: 'What lets "Is it working?" answer with numbers. Stays on this machine.',
    forYou: 'One line per check decision, kept on this machine. It is what lets `alignment-harness doctor` and this page answer "is it working?" with numbers.',
    ifOff: 'Everything keeps working, but "Is it working?" has no numbers to show.',
    primary: { toggleKey: 'telemetry.enabled' },
    healthPieces: ['hooks running'],
    healthEvents: [],
    settings: {
      enabled: { label: 'Keep the local log', allowed: ONOFF },
    },
  },
  {
    key: 'permissions',
    name: 'No prompts for harness bookkeeping',
    group: 'behind',
    doc: 'settings.md',
    docAnchor: 'no-prompts-for-harness-bookkeeping',
    what: "The harness's own small commands run without asking you each time.",
    forYou: "The harness's own bookkeeping commands (attest, score, status, adding or fixing a check, reading a setting, doctor) run without asking you each time. They only read, or write inside the harness's data folder. Commands that run your code, removing a check, changing a setting, opening this page and setup still follow your normal permission rules, so the agent can't turn its own checks down without you seeing it.",
    ifOff: "You'll be asked to approve each of these small commands, which can mean several prompts per message.",
    primary: { toggleKey: 'permissions.allowHarnessCommands' },
    healthPieces: [],
    healthEvents: [],
    settings: {
      allowHarnessCommands: { label: 'Let bookkeeping commands run without a prompt', allowed: ONOFF },
    },
  },
];

// Pieces that have no switch here, shown honestly with the real way to turn each off.
const NOT_SWITCHABLE = [
  {
    id: 'session-start-note',
    name: 'The "harness is on" note at session start',
    badge: 'always on while the plugin is on',
    what: 'A short note telling the agent the harness exists, how its skills are named and where its command is.',
    why: 'Every other piece relies on the agent knowing the harness is there, so this note has no switch of its own. It goes away when the plugin is turned off.',
    how: 'claude plugin disable alignment-harness',
  },
  {
    id: 'subagent-task-text',
    name: "Remembering a subagent's task text",
    badge: 'always on while the plugin is on',
    what: 'When the agent hands work to a subagent, the task text is kept for a few minutes so subagent alignment can read it.',
    why: 'It has no switch of its own. It only feeds subagent alignment; with that off, the saved text is simply never used.',
    how: 'alignment-harness switch subagents.injectAlignmentAtStart off',
  },
  {
    id: 'agent-find',
    name: 'agent_find memory search server',
    badge: 'managed by Claude Code',
    what: 'The built-in search over your docs, commits, past sessions and records that the agent uses before guessing.',
    why: 'Claude Code turns MCP servers on and off, not the harness.',
    how: 'Type /mcp in Claude Code',
    doc: 'agent-find.md',
  },
  {
    id: 'skills',
    name: 'Skills',
    badge: 'view only',
    what: 'The skills that ship with the harness. Each one is listed with what it helps with.',
    why: 'There is no supported way yet to switch off a single plugin skill, and moving skill files would break the other skills that call them by name. Turning skills on and off is planned as a later step.',
    how: '',
    doc: 'skills.md',
  },
  {
    id: 'wording',
    name: 'The wording of the check and its headings',
    badge: 'not a switch',
    what: 'The headings (COHERENCE_CHECK, PENDING_SCOPE) are a fixed shape the harness reads back, so they are never changed from here.',
    why: 'To tune the surrounding wording, copy a file from the plugin\'s prompts/ folder into the prompts/ folder inside the data folder and edit your copy; your copy wins.',
    how: 'alignment-harness paths',
  },
  {
    id: 'everything',
    name: 'Everything at once',
    badge: 'one command',
    what: 'Turns every hook off and keeps all of these settings for when you turn it back on.',
    why: 'This is Claude Code\'s own switch for the whole plugin.',
    how: 'claude plugin disable alignment-harness',
  },
];

module.exports = { GROUPS, SECTIONS, NOT_SWITCHABLE, STRENGTH_LABELS };

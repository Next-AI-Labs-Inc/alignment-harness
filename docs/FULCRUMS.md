# The fulcrums: the moments where an agent's work drifts from what the person meant

*Drawn from the harness's registered hooks and skill files. The same map is also kept as data for the project's website, which lives outside this repository.*

## The thesis: misalignment compounds

When an agent misreads what a person meant, it rarely fails at that moment. It fails later, and bigger. A misread message becomes a wrong plan. The plan becomes code, and tests written to the same wrong target. The tests pass, so the agent reports success. The report goes into a commit and a session summary, and the next session reads that summary as settled fact and builds on it. Each step inherits the error and adds its own, so the misalignment compounds rather than adding up.

This happens at specific, recurring moments in a Claude Code session. This map calls them **fulcrums**, because a small shift at one of them moves everything that comes after. A single check at the end can't undo what compounded on the way, and a single check at the start can't foresee what drifts later. So the harness intervenes at each fulcrum, from before the first message to the next session. It tries to catch drift while it is still cheap. At a fulcrum the fix is one sentence of "here is what I think you mean"; later it is a day of unwinding work built on the wrong reading.

In daily production use, the harness has made building with Claude Code dramatically more efficient — by the author's own estimate from that use, on the order of 5 to 10 times, and a session run without it gets roughly a fifth as much done before it goes off the rails, because it has to assume too much about what's wanted. The gain isn't the agent doing more; it's the absence of the losses that hallucination, miscalibration and compounding misalignment otherwise create at each point where a session can drift from what was meant.

It works at every one of these moments: every known fulcrum, from the beginning of a session to the end, to reduce agent misalignment that would otherwise cascade and compound into misaligned work.

## How to read the map

The fulcrums are numbered in the order they usually come up in a session, but some can happen at any point: a person can correct the agent, or the agent can be about to ask a question, at any time. Each section describes the moment, what the person experiences when it goes wrong, what that grows into if nothing catches it, and what the harness does there. It ends with the pieces that act at that moment.

A piece whose name ends in `.sh` is a **hook**: a script Claude Code runs automatically at a set moment, such as when a message arrives or before a tool runs. In Jonathan's setup these live in `.claude/hooks/`, apart from three that live in `agent-swarm-mcp/scripts/`. Every other name is a **skill**: an instruction file an agent loads by name, for example `/align`. Each piece in the installable version gets its own page, saying what it does, how to set it up and how to tell whether it is working; the website links to it from the map.

## The map at a glance

1. [Before the harness knows the person](#1-before-the-harness-knows-the-person): a new person has no record of their intent yet, so every memory-based check starts empty. The first-run flow that would build that record is not built yet.
2. [When a session opens](#2-when-a-session-opens): the agent starts as a capable stranger that fills gaps with defaults.
3. [The moment a message arrives](#3-the-moment-a-message-arrives): the latest sentence gets mistaken for the whole request.
4. [Between understanding and the first action](#4-between-understanding-and-the-first-action): the agent acts on a reading the person never saw.
5. [Before the agent rebuilds from scratch what is already known](#5-before-the-agent-rebuilds-from-scratch-what-is-already-known): a guessed "why" behind the code becomes a confident change.
6. [Turning intent into scope and tasks](#6-turning-intent-into-scope-and-tasks): the plan loses meaning in translation, and every later check confirms the wrong thing.
7. [Deciding how much care the work deserves](#7-deciding-how-much-care-the-work-deserves): a payments change gets treated like a typo fix, or the other way round.
8. [When the agent is about to stop and ask](#8-when-the-agent-is-about-to-stop-and-ask): it hands its thinking back to the person, or asks without the context that makes the question answerable.
9. [While it works](#9-while-it-works): the agent narrows, grinds, or shifts scope silently, and parallel agents collide.
10. [Handing work to a subagent](#10-handing-work-to-a-subagent): the what travels without the why, and the report is self-graded.
11. [When the conversation is compacted](#11-when-the-conversation-is-compacted): the person's exact words become a paraphrase the agent then trusts.
12. [When the person corrects the agent](#12-when-the-person-corrects-the-agent): this instance gets fixed, the cause doesn't, and it comes back.
13. [Calling it finished](#13-calling-it-finished): "it works" without having watched it work.
14. [Reporting back to the person](#14-reporting-back-to-the-person): a report the person can't read quickly is one they don't check.
15. [Committing the work](#15-committing-the-work): the record says what changed but not why, so the next session undoes deliberate work.
16. [When the session ends](#16-when-the-session-ends): unfinished asks and corrections die with the transcript.
17. [The next session reaching what was already settled](#17-the-next-session-reaching-what-was-already-settled): it re-asks what was answered, or inherits an earlier agent's misreading as fact.
18. [When the harness itself changes, or quietly stops working](#18-when-the-harness-itself-changes-or-quietly-stops-working): a broken safeguard is still trusted.

---

## The fulcrums, in session order

### 1. Before the harness knows the person

Someone new installs the harness. Much of what it does for Jonathan draws on a record of what he wants: past sessions, decisions he confirmed, principles mined from his corrections, and notebooks that predict his reactions. The new person has none of that. Installed as-is, the pieces that consult that record come back empty, or answer from someone else's history. The agent falls back to guessing about the person, which is exactly what the harness is meant to reduce.

That weakens every later fulcrum that leans on memory from day one. It is worse if a piece quietly carries Jonathan's own examples or notebooks, because then the new person's agent aligns to the wrong human.

This part is not built yet; it is the planned first run: one command to install and a setup that says what it will do before doing it, so building a synthetic understanding of the new person's intent is part of the workflow from the start. Each checkpoint offers options, for example walking the person through creating their own NotebookLM notebooks or switching that piece off. There are on/off switches, and intensity dials where something could fire too often. Part of that flow has to build a first map of the new person's intent. Some existing pieces suggest how. `align` records confirmed intent. `flywheel-consultant` describes how to build oracles from one's own sessions. `predict-required-skills2` and `instinct-harvest` have capture loops that can start from nothing.

The rule for every one of those checkpoints: the agent does the setup work, not the person. When a piece finds something missing, it offers to build it from what already exists (past Claude Code conversations, the repo, the person's own setup). It asks consent once and shows the result before saving. It never asks the person to write or paste material it could have gathered itself. Every shipped skill is audited against this rule (`plugin-dev/audits/agent-does-the-setup-work.md`).

Pieces: `align`, `intent-architect`, `seed`, `flywheel-consultant`, `predict-required-skills2`, `instinct-harvest`.

### 2. When a session opens

Before the person types anything, the agent is a capable stranger. It doesn't know how this person works, which moments tend to go wrong, what is waiting for their approval, or that it is expected to check its understanding before acting. It fills those gaps with defaults. The defaults frame the first message, and the reading of the first message frames the session. An agent that doesn't know it should declare scope, size the rigor, or look up what is known will skip all three exactly when they matter most.

With the harness, Claude Code loads the operating protocol in `CLAUDE.md`: how to communicate, when to validate, and what never to do. A start-of-session hook then adds three standing trigger rules:

- When the person states an intent, or a gap between what is and what should be, declare the scope.
- When turning intent into a plan, isolate the gap.
- When starting any work product, run the **governer**. This is the step that scores how much rigor a task deserves (see fulcrum 7).

Other start hooks surface anything waiting on the person's approval and say whether the memory-search gate is armed. The `init` skill switches on orchestration, scoring and scope declaration in one command.

Pieces: `session-start-alignment-autoload.sh`, `session-start-greenlight-injection.sh`, `session-start-intent-search-gate-arm-notice.sh`, `init`, `agentic-init`, `declare-scope`, `gap`, `governer`.

### 3. The moment a message arrives

The person sends a message, and the agent reads the words but not the person. It takes the latest sentence as the whole request, treats an added ask as a replacement, or reads one example as a universal rule. Meanwhile the person's actual words sit buried under pages of system context. A misreading here seeds everything the turn produces. The person finds out only when the output arrives, and has to spend a message un-teaching it. If they don't notice, it is carried forward as though they had said it.

A hook runs on every message (`user-prompt-enrich.sh`):

- It strips system noise so the person's literal words come first in the agent's context.
- It searches past sessions, decisions and notes for those words and injects what it finds.
- It asks a scoring service how much rigor the turn deserves and saves the score.
- It arms the coherence gate for this turn (fulcrum 4).
- It catches phrases like "I don't understand" and sends the agent to re-ground itself with `calibrate`.

It also notes any /commands the person typed. A stop gate that checks each of them was actually run exists, but its feed is switched off for now because it mistook path fragments for commands. Short acknowledgements like "ok" or "thanks" skip all of this.

Pieces: `user-prompt-enrich.sh`, `coherence-check`, `agentic-find`, `calibrate`, `governer`.

### 4. Between understanding and the first action

Having read the message, the agent goes straight to editing, writing or running things. The person never saw what the agent thought they meant, so a misunderstanding stays invisible until it has been built. Unseen misreadings are the expensive kind: by the time they surface they are files, commits and a report that all have to be unwound. The person learns to supervise every step, which is the opposite of what an agent is for.

With the harness, the agent opens its reply with a **COHERENCE_CHECK**. It covers:

- its sense of the person's intent, with a certainty percentage;
- what it thinks the person needs from it;
- how it will communicate so it is understood the first time;
- any new scope it heard, quoted back with its interpretation;
- whatever scope is still pending from earlier.

Then it keeps working, and the person steps in only if the reading is wrong. A gate (`pre-tool-coherence-gate.sh`) blocks action tools until that check has been printed this turn. Reading, searching and asking the oracles stay open, because looking things up helps the agent understand. For bigger or unclear asks, `align` works out the nested layers of intent with the person, and `reflect` checks the remaining scope against them.

Pieces: `coherence-check`, `pre-tool-coherence-gate.sh`, `align`, `reflect`, `how-to-talk-like-the-founder`.

One estimate from daily use: "Set up a harness around the coherence check alone and you'll likely see 10 to 15 percent more productivity — not from the agent doing more, but from it doing less of the wrong thing."

### 5. Before the agent rebuilds from scratch what is already known

The agent needs to understand a system, a past decision or a preference. It works out from the code alone something that is already on record: why a thing is the way it is, what was tried, what the person decided last week. It guesses the intent behind the code and treats the guess as fact. A guessed "why" licenses confident changes. The agent deletes "unused" scaffolding that was really the next feature, re-opens a settled decision, or re-asks an answered question. Each move looks reasonable on its own, and each costs the person a correction.

The harness puts the person's accumulated record within reach:

- `agent_find` (explained in the `agentic-find` skill) is one search across past sessions, session summaries, recorded intents, commits and notes. The message hook already runs it on every message.
- A separate gate is meant to block the first code search of a session until the agent has searched that record. It is registered, but as of this writing it waits on a validation flag and lets searches through.
- **Oracles** answer questions like "which principles apply here" (`infuse`, `insight`, `oracles`). An oracle is a Google NotebookLM notebook loaded with the person's own history, which the agent queries the way it would ask a colleague who remembers.
- Research from earlier subagents is cached and can be retrieved (`agentic-artifact-cache`).
- `track` tells an agent to check whether a sweep was already done before repeating it.

This is one mechanism at one fulcrum among many. It is not the harness's single cause.

Pieces: `agentic-find`, `user-prompt-enrich.sh`, `pre-tool-intent-search-gate.sh`, `post-tool-detect-agent-find.sh`, `insight`, `oracles`, `infuse`, `agentic-artifact-cache`, `track`.

### 6. Turning intent into scope and tasks

The agent translates what the person wants into a plan, a task list or a handoff, and meaning gets lost. It restates the ask in a tidier form that isn't what was asked. It drops the sub-asks it didn't understand and flattens nuance into black-and-white rules. Or it writes tasks so terse that whoever picks them up later has to guess. The plan then becomes the thing the work is checked against, so every later check faithfully confirms the wrong thing. The tests pass and the evidence is real, but the result still isn't what the person wanted.

The harness has several pieces for this translation:

- `declare-scope` turns the ask into testable statements of what the person will experience, in the form "When {situation}, {what happens}". It records them with a certainty number, so the scope can't be quietly reinterpreted later.
- `decompose` turns a confirmed intent map into tasks without losing the person's words.
- `gap` narrows an overwhelming scope to one piece that can be finished, with a stated test for done.
- `nested-intent2` writes a map in which each node carries enough intent for an agent reading only that node to act on it.
- `intent` is a writing standard that makes every statement checkable on first read.

A confirmed scope can be saved as a **seed**: the confirmed intent plus a description of the finished result, which later work is checked against.

Pieces: `declare-scope`, `decompose`, `gap`, `nested-intent2`, `intent`, `intent-lifecycle`, `align`, `dispatch-seed`.

### 7. Deciding how much care the work deserves

At the start of a task, every task gets the same effort. A change to payments or login is treated like a typo fix, or a trivial change gets a full ceremony, and nobody remembered to ask for the deeper checks. High-stakes work that was under-checked is where real users get hurt, and where the person loses the ability to trust the agent unattended. Trivial work that was over-checked spends their attention on approvals that didn't need them.

The **governer** scores how much rigor a task deserves, from 0 to 100, by how much a mistake could cost and whom it would touch. It then routes the task on that score. Low scores proceed. Higher scores get, in turn, a written plan, an independent evaluator and human review before anything reaches users.

- A gate (`pre-tool-governer-gate.sh`) blocks edits until the session has a score. After three blocks it softens to a reminder, so it can't trap the agent in a loop.
- At the start of a task the governer also writes **verification contracts**: the specific runnable checks that will prove the task done, which the stop gate enforces later (fulcrum 13).
- `governer2` is an experimental version. It turns the skills a task is predicted to need into steps that can't be skipped. The prediction comes from `predict-required-skills2`, which learns from what agents actually did in past sessions.

Pieces: `governer`, `governer2`, `pre-tool-governer-gate.sh`, `verification-contracts`, `predict-required-skills2`, `task-orchestrator`.

### 8. When the agent is about to stop and ask

The agent thinks "I should check with the person", and there are two opposite ways this goes wrong. It stops to ask something it could have found out by looking (a file, the git log, a past decision), which hands its thinking back to the person. Or it asks a bare question stripped of the context that would make it answerable at a glance. Less often, it pushes past a question that really needed the person. Needless questions turn the person into the agent's manager and teach them to hover. Bare questions get bare answers, which the agent over-reads. Real questions that get skipped produce confident work in the wrong direction.

`ask` gates every question. The agent sets out the context the question comes from, predicts the answer with a confidence number, and scores how much the question matters. Low-stakes questions are decided and announced. Only high-stakes, uncertain ones go to the person, with the prediction attached so they can answer in a word. `on-agent-getting-stuck` tells a real need for the human apart from a stall the agent should predict its way through. `jonathan-check2` predicts how the person would respond, using a notebook of thousands of their past exchanges with agents; `jonathan-check3` is a planned, larger version. A hook blocks Claude Code's pop-up question box and sends the agent to `ask` instead, because the pop-up shows the question without the context that makes it answerable.

Pieces: `ask`, `on-agent-getting-stuck`, `pre-tool-askuserquestion-gate.sh`, `jonathan-check2`, `jonathan-check3`, `predict-next-action2`.

### 9. While it works

During long stretches of work, the agent narrows. It grinds on one hypothesis that isn't working, loses the protocol it started with, drifts into dense technical narration, or quietly moves to a different sub-problem. When agents run in parallel, one can overwrite another's merge or take over a port the person is using. Narrowed effort feels productive while it moves away from the goal. Silent scope shifts mean the person's picture of what the agent is doing stops matching reality. Collisions destroy work outright.

The harness has a piece for each of these:

- `expand-perspective` is a frame-exit ritual with 100 worked examples. When something takes longer than expected, the agent stops at intervals to ask whether the frame it is working in is the limit.
- `until-proven-done` keeps a task going in rounds until it is proven done or blocked by a named outside dependency, so the person never has to say "keep going".
- `calibrate` re-reads the operating protocol when the agent has drifted.
- `on-scope-change` updates a visible breadcrumb (deepest task < parent < root) every time the focus shifts.
- `smc` watches for signs of drift, such as the person's frustration rising above their own baseline, and injects corrections that have worked before.
- Small guard hooks block a second merge into a shared branch while one is running, and stop agents from taking a port the person keeps for their own use.

Pieces: `expand-perspective`, `until-proven-done`, `calibrate`, `on-scope-change`, `smc`, `smc-frustration-detector`, `pre-tool-merge-lock.sh`, `pre-tool-founder-port-guard.sh`.

### 10. Handing work to a subagent

An agent delegates work to another agent (a **subagent**). The subagent gets a compressed prompt that says what to do but not why. It fills the gap with its own interpretation, builds to that, and reports "done" based on its own assessment. The parent passes the report along. Delegation multiplies drift. Each handoff is another translation, a fleet of subagents can produce a lot of confident work in parallel against a misread target, and self-graded reports pass the misreading up the chain as if it had been verified.

When a subagent starts, a hook scores its task. It also requires the subagent to state the target experience ("The person using this will see…") before writing code, and to search institutional memory first. When the subagent stops, the evidence gate that guards the main agent checks its completion claims too. A second hook logs whether it stated the target experience. A third saves any research reports it produced so they aren't lost with its context. `execute2` is the dispatch pattern: read the parent context, carry a verification contract that could fail, and return proof the parent can re-run. In `orchestrator` and `execute`, the work is checked by an evaluator that never saw the builder's reasoning, on the premise that agents grading their own work tend to praise it.

Pieces: `subagent-start-governer.sh`, `subagent-stop-alignment-check.sh`, `stop-evidence-gate.sh`, `hook-extract-on-stop.sh`, `execute2`, `execute`, `orchestrator`, `nested-intent2`, `dispatch-seed`.

### 11. When the conversation is compacted

A long conversation fills the context window, and Claude Code replaces the earlier part with a summary. This is called **compaction**. The summary is a paraphrase: the person's exact words become an agent's tidier version, and the confirmed scope, the rigor score, pending items and earlier corrections can thin out or disappear. After compaction the agent is working from a map of a map. Anything the summary distorted now looks like something the person said, and the rest of the session builds on it.

Before compaction, a hook saves session details and the person's messages, word for word, to disk. After it, other hooks put back two things: the session's structured record of intent, scope and unfinished items (also called a "compaction", filed through `compact-agentic-session`), and the last rigor score. That way the agent resumes knowing what it was doing and why. `CLAUDE.md` also asks agents to file that record themselves when a session is getting long, before automatic compaction fires.

Pieces: `pre-compact-extract.sh`, `post-compact-reinjection.sh`, `post-compaction-reload.sh`, `compact-agentic-session`, `agentic-session-compactions`.

### 12. When the person corrects the agent

The person says, in whatever words, that the agent got something wrong. The agent apologises, fixes this one instance and moves on. The misreading behind it is left in place, so it comes back later in the session or in the next one. The opposite failure happens too: one correction gets hardened into a rigid rule that misfires where the person never meant it to apply. A correction that isn't captured gets paid for again and again, and the person ends up teaching the same thing every week.

The operating protocol asks the agent to treat a correction as a pointer to its source and to fix that source, which is usually the skill file or instruction that led it astray. The harness backs this up in several ways:

- `hallucination` is the diagnostic for when an agent has stated something false as fact. It names the cause upstream of "I assumed".
- `fix-hallucinated-code-cleanup-source` traces code built on a false premise back to the material that caused it.
- An end-of-session scan looks for corrections that were never saved.
- Correction patterns the person has approved are injected at the end of a turn when they match.
- `smc` injects corrections that have worked before when drift signals appear.
- A confusion phrase from the person sends the agent to `calibrate`.

Pieces: `hallucination`, `fix-hallucinated-code-cleanup-source`, `calibrate`, `smc`, `stop-complete-agentic-task.sh`, `session-end-persist.sh`, `skill-file-create-pre-check-self-healing-protocol`, `how-to-create-or-update-skill-files`.

### 13. Calling it finished

The agent is about to say something works, is fixed, passes or is live, and end its turn. But it hasn't observed the success. It read the code and concluded the thing works, or it ran a check that tests something nearby rather than the thing itself. Saying so sounds exactly like reporting a verified result — the danger isn't the guess itself, it's treating an unverified guess as settled reality. That gap is where hallucination comes from. A false "done" is the most expensive drift, because it closes the loop and nobody looks again. The person finds out in front of a user, or the next session builds on it as settled.

A stop gate (`stop-evidence-gate.sh`) reads the agent's last message. If it says something works and the transcript holds no verification output, the gate blocks the stop and names what to verify, including any verification contract written at the start of the task. It has a loop-break so it can't trap the agent. Several skills back it up:

- `verify` makes the agent define the outcome before gathering evidence, so a nearby stand-in can't pass for it.
- `validate-load-bearing-claims-against-reality` requires measuring reality for anything a decision will rest on.
- `verification-gate` checks that every file-and-line citation exists before an answer is published.
- `complete-seed` and `sanity-check` compare the finished work with the confirmed intent.

A second stop gate is meant to block the stop when the person asked for a /command the agent never ran, but its feed is currently switched off (see fulcrum 3).

Pieces: `stop-evidence-gate.sh`, `verification-contracts`, `verify`, `validate-load-bearing-claims-against-reality`, `verification-gate`, `complete-seed`, `sanity-check`, `proof-its-fixed`, `stop-slash-command-gate.sh`.

### 14. Reporting back to the person

At the end of a turn that produced something, the agent tells the person what happened. The person gets pages of narration, internal names and undefined terms, or an account of effort instead of what changed for them. Guesses are presented as facts. A report the person can't read quickly is one they don't check, so errors get through. Every round of clarification costs their attention, and they start to skim, which is when misalignment slips past unnoticed.

`on-turn-end` picks the right closing move:

- show finished work where the person can see it working (`consume`);
- narrow the remaining scope and file a proposal (`gap`, `propose`);
- give a status of one to seven sentences the person can scan in seconds (`update-the-founder`);
- ask a question (`ask`);
- or reset, if the person complained about how the agent communicates (`calibrate`).

A hook that never blocks reminds the agent to run it when the turn's rigor score was above 40. `how-to-talk-like-the-founder` and `speak-human` govern every word a person reads. That means plain language, every term defined where it is used, and the exact condition stated whenever code is mentioned (`on-talking-about-code`). It also means keeping what the person said separate from what the agent thinks it means. `show-proof-to-human` turns final approval into a short click-through. `jonathan-check2` predicts the person's reaction before the report goes out, so predictable objections can be fixed first.

Pieces: `on-turn-end`, `stop-on-turn-end-reminder.sh`, `consume`, `update-the-founder`, `speak-human`, `how-to-talk-like-the-founder`, `on-talking-about-code`, `communication-pattern-validated`, `show-proof-to-human`, `agent-outcome-summary`, `whats-left`, `jonathan-check2`, `complete-agentic-task`, `stop-complete-agentic-task.sh`.

### 15. Committing the work

The changes become a commit, and the commit records what changed, not why it was worth doing. Unrelated changes get bundled, and the person approves a batch they couldn't see clearly. The next session sees code without its reason. Deliberate work looks accidental, so it gets "cleaned up", and settled questions get asked again. The history of changes is complete, but the history of decisions is lost.

After every git commit, a hook checks that a note was written to the **Commit Intent Ledger** in the last few minutes, and speaks up if not. A ledger note is a plain-language record of what a person can now do and why it mattered. The same hook closes any proposals the commit resolved. `batch` groups uncommitted changes by concern and walks through what each means for people before committing. `commit2` traces uncommitted code back to the intent it came from.

Pieces: `post-bash-router.sh`, `commit`, `commit2`, `batch`, `batch-whats-next`.

### 16. When the session ends

The session closes, deliberately or not, and everything it learned lives only in its transcript: unfinished asks, the person's corrections, what was decided and why, and which checks the person confirmed. The transcript is rarely read again. The next session starts poorer than this one ended. Unfinished work is silently dropped, and lessons are relearned at the person's expense.

A last-chance hook (`session-end-persist.sh`) files a minimal session record if none was filed. It also scans for corrections that were never saved, records the order in which skills were used, and logs what changed. Another hook (`session-end-instinct-harvest.sh`) captures the session's COHERENCE_CHECK and SANITY_CHECK blocks, together with the person's replies, word for word, as raw material for learning. There are also skills for closing deliberately:

- `close` produces an audited, thorough session record for large sessions, and `complete-agentic-task` is the quick version.
- `incomplete2` reads out unfinished asks so the person can decide on them.
- `nested-intent` lays out the session's work as a nested map of intent.

Pieces: `session-end-persist.sh`, `session-end-instinct-harvest.sh`, `close`, `complete-agentic-task`, `compact-agentic-session`, `incomplete2`, `nested-intent`.

### 17. The next session reaching what was already settled

A later session starts, and it is a new stranger. It asks again what the person already answered, re-opens what they decided, undoes deliberate work, and repeats mistakes that were already corrected. Or it goes the other way and reads an earlier agent's notes as settled truth, inheriting that agent's misreadings. Without continuity, alignment has to be rebuilt from zero each session and the person carries the whole memory. With naive continuity, one agent's error becomes every later agent's premise.

Past sessions leave structured records that `agent_find` can search: session records, ledger notes, memory files and cached research. The instinct ledger (`instinct-harvest`) turns checks the person confirmed or corrected into situational leans, each with its reasons and sources, which agents read before entering a similar situation. Oracles built from the person's history predict what they would say and which skills a scope usually needs. `advisor` briefs the agent on open and recent sessions, and `agentic-actionable-tasks` picks up work the person has approved. The stated stance throughout is that what an earlier agent wrote steers the work but doesn't settle anything.

Pieces: `agentic-find`, `instinct-harvest`, `compact-agentic-session`, `oracles`, `jonathan-check2`, `predict-required-skills2`, `advisor`, `agentic-actionable-tasks`, `extract-wip-from-past-sessions`, `founder-knowledge-store`.

Any of this documentation, including this map, is a map of the territory and not the territory itself: one agent's interpretation of the data, shaped by the experience and conditions in place when it was written.

### 18. When the harness itself changes, or quietly stops working

A skill, hook or protocol gets edited, and a change meant to improve alignment makes agents worse without anyone being able to tell. Or a hook silently stops firing. That has happened before: a Claude Code update renamed a field a hook reads. The protection disappears without a trace. Or a skill exists but no agent can find it. A broken safeguard is worse than none, because the person still trusts it.

The harness has pieces for noticing this:

- `genome-experiment` takes a fingerprint of the whole agent setup (skills, hooks, `CLAUDE.md`) and stamps each session with it, so sessions can be compared across versions of the setup.
- A circuit breaker warns, but never reverts, when recent alignment scores fall below the baseline.
- Some start hooks assign sessions to different versions of a prompt so those versions can be compared.
- `agent-debug` shows which hooks fired this turn and what they injected.
- `alignment-doctor` checks one thing: whether institutional context is being injected.
- `discoverability-audit-learnings-findable-by-agents` checks that new tools and skills can actually be found.

Pieces: `genome-experiment`, `session-start-genome-stamp.sh`, `genome-circuit-breaker.sh`, `session-start-coherence-gate-ab.sh`, `agent-debug`, `alignment-doctor`, `discoverability-audit-learnings-findable-by-agents`.

---

## The core loops

The fulcrums are moments. The loops below are the cycles that pass through them over and over, and each one keeps something true for the person.

### Every turn: understand before acting, prove before calling it done

Each message runs the same small cycle. The person's words are put first and relevant context is pulled in. The agent shows its reading before it acts, looks up what is known before guessing, and predicts before asking. At the end of the turn, whatever the agent says is finished is checked against evidence, and the report is written so the person can read it in seconds. What this keeps true is that the person can see, every turn, whether the agent understood them, and a misreading costs one sentence to fix instead of a day. It passes through fulcrums 3, 4, 5, 8, 13 and 14.

### Every task: intent, scope, rigor, work, proof, record

A task moves from intent to confirmed scope, then to a rigor score, the work itself, evidence, a report, and a commit that records why it was done. What this keeps true is that what gets checked at the end is what the person meant at the start, and that the depth of checking matches what a mistake would cost. It passes through fulcrums 6, 7, 9, 13, 14 and 15.

### Every delegation: the why travels with the work, and proof comes back

Each time work goes to a subagent, the intent goes with it: the target experience is stated before any code, along with a verification contract that could fail. What comes back is checked against evidence rather than taken on the subagent's word, and anything it learned is saved. What this keeps true is that splitting work across many agents doesn't multiply the misreadings. It passes through fulcrums 6, 10 and 13.

### Every session: open informed, survive compaction, close without losing anything

A session opens with the operating protocol and standing trigger rules loaded. It keeps the person's exact words and the confirmed scope through compaction. When it ends, it files what it learned and what is unfinished. What this keeps true is that the session that ends knows more than the one that started, and the next one can reach that knowledge. It passes through fulcrums 2, 11, 16 and 17.

### Every correction: fix the source, not just the instance

When the person corrects the agent, the correction is traced to the instruction or premise that produced the error, and that source is fixed. The correction is captured so it can be injected the next time the same situation comes up. What this keeps true is that the person teaches something once, not every week. It passes through fulcrums 12, 9 and 17.

### Across sessions: the learning flywheel

As skills work, they print blocks that are easy to recognise: COHERENCE_CHECK, SANITY_CHECK, reflections, scope declarations, and a one-line note each time a skill is used saying why. At session end, hooks and scripts extract those blocks word for word, together with the person's replies. What the person confirmed or corrected becomes instincts, principles and oracle notebooks. Those are read the next time a similar situation comes up, and the person's reaction to the next check becomes new material. What this keeps true is that alignment improves with use instead of resetting every session. Some parts of this loop run today and some are designed but not yet built. For example, according to an earlier reading of the skill files, the combined notebook that `jonathan-check3` is meant to query has not been created. It passes through fulcrums 1, 4, 5, 7, 12, 16 and 17.

### Continuously: the harness checks itself

Each session is stamped with a fingerprint of the setup that ran it. Alignment scores are watched against a baseline, and diagnostic skills show which hooks actually fired. What this keeps true is that a change to the harness, or a piece that has silently stopped working, can be noticed instead of trusted blindly. It passes through fulcrums 18 and 2.

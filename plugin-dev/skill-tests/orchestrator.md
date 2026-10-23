---
skill: orchestrator
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 10
seconds: 107
---

## What Dana asked
I need to fix how proration works in src/pricing.js - mid-cycle upgrades are getting double-charged on the invoice that src/invoices.js builds. Can you take point on this, break it into pieces, and get the investigation going while I keep working on the auth cleanup?

## What happened
The orchestrator skill never loaded. There was no Skill call in the run, the line "🟢 Hard Gates Active" was never printed, and no "All dispatches run in background" line appeared. The agent instead did the work itself: it tried to check for the `alignment-harness` binary, was stopped by the plugin's coherence-check hook, printed "COHERENCE_CHECK" with "My sense of your intent (92%)", then read pricing.js, invoices.js, the tests and git history inline, with no subagents and no "What else?" hand-back. It found that the repo has no proration code at all and said "I need to stop you before this goes further: there's no proration or mid-cycle-upgrade code in this repo at all", then asked whether she meant a different branch or a new feature. The stop hook asked for a task to be created; the agent replied that no TaskCreate tool exists. Nothing from the account's synced skills was used.

## Function: broken
The skill is written to be a standing mode that delegates all work and keeps the person free, but for this realistic "take point and get it going while I work on something else" request it did not fire, and the agent did the investigation in the foreground. The answer it gave Dana was sensible, but none of the skill's contract (marker, background dispatch, scope IDs, "What else?") was honored. The fault is in triggering: the description is long and abstract ("top-level agent must define outcomes, route work across analysis, research, and implementation layers...") and never mentions the plain situations where Dana would want it (handing off a task, staying free while work runs).

## Setup path: mixed
Several paths delegate well: a missing `alignment-role`, `communications-role`, `orchestrator-enforcement`, `/speak-human` or `intent-db-add-ux-intent-guide` falls back to doing the step inline, and proposals fall back to `alignment-harness records proposals` with read-back verification. But the intent-store and compaction writes ("POSTs the update to the compaction API via `/compact-agentic-session`", "POSTed to your intent store via `/intent-db`") and the `EvaluatorCaughtGap` "telemetry" log have no fallback when those services are not installed, which is the normal state for a new user. The skill also leaves the `/governer` proof requirement ("reject any packet that cannot prove it passed through `/governer`") with no stand-in when that skill is absent, which would block every non-trivial path.

## Proposed fix
1. In "Compaction Sync Protocol" and "Intent Sync Rule", after the dispatch pattern, add: "If `/compact-agentic-session` or `/intent-db` is not installed, the background subagent does not POST anywhere. It runs `alignment-harness records` to list the record kinds, writes the same payload as one file in the matching folder (intents under `records intents`, compactions under `records compactions`), reads it back to confirm, and reports the exact path. Tell the person once, in one line, that records are being kept locally, and offer to connect a real store later."
2. In "Evaluator Failure Logging", add: "If no telemetry sink is configured, append the `EvaluatorCaughtGap` JSON as one line to a file in the folder printed by `alignment-harness records`, and say where."
3. In "Alignment Result Contract", change "reject any packet that cannot prove it passed through `/governer`" to "reject any packet that cannot prove it passed through `/governer`, or, if `/governer` is not installed, through the inline alignment step's own criticality score and written reasoning."
4. In the frontmatter description, add a plain trigger sentence, for example: "Use when the person hands you a multi-step task and wants you to take point, break it down, and get it moving while they keep working, or says to delegate everything."

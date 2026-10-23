---
skill: agentic-init
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: delegates
turns: 1
seconds: 77
---

## What Dana asked
I am about to start on a refactor of the proration logic in src/pricing.js in acme-billing. Which skill should I use first, and which ones for testing and committing afterward?

## What happened
The agent answered in one turn with no tool calls, giving a before/testing/committing routing drawn from the skill's table. It named `/alignment-harness:governer` and `/alignment-harness:code-principles-how-to-code` before coding, then for testing said "No dedicated "run tests" skill" and pointed to `/alignment-harness:how-to-fix-failing-tests` and `/alignment-harness:audit-pre-commit`, and for committing `/alignment-harness:commit`. It tied the advice to Dana's repo (pricing is money-handling, so confirm whether behavior changes). It closed by saying it would not run the full coherence ritual for a routing question. No author-world data leaked into the answer.

## Function: broken
The routing was useful and fit Dana's work, but it sent her to `/alignment-harness:how-to-fix-failing-tests`, which does not exist in the plugin (no `skills/how-to-fix-failing-tests` folder). The pointer comes straight from row 65 of the SKILL.md, so a new user who follows it hits a dead command.

## Setup path: delegates
The one real fallback, Phase 0 "Starting any task", says that if institutional memory search is not set up the agent should search the repo docs, `git log` and past Claude Code sessions, and say plainly when nothing turned up. The memory-logging row falls back to `alignment-harness record notes`. The optional-integrations section tells the agent to say the integration isn't set up and skip it. None of these ask Dana to supply material.

## Proposed fix
In SKILL.md line 65 (Phase 4), replace the dead row with an existing skill and drop the stray "not in your batch, but ships if selected" text:

| Tests are failing, need to fix | `/tests-failing-check` | Checks whether a failing test actually proves the intended behavior, then decides whether to change the test or the code. |

Also add a build-time check that every `/skill-name` in this table has a matching `skills/<name>/` folder.

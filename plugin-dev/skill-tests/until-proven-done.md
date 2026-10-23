---
skill: until-proven-done
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: delegates
turns: 21
seconds: 163
---

## What Dana asked
"Our invoice totals in ~/work/acme-billing are off by a cent on some prorated plans. Keep going until you've found the cause, fixed it, and shown me the tests passing."

## What happened
The agent never invoked the `loop` skill. It called `alignment-harness:governer` instead, scored the task 100/100, passed the coherence and search-memory gates, then read the repo (3 source files, one commit, no proration code anywhere). It ran the existing test, which passed, and stopped after one round of investigation. Its final message was: "I searched thoroughly and I'm stopping here to check with you before inventing anything, because what I found doesn't match the premise." It asked Dana to point it at the right repo or confirm that proration should be built new. No ARM step, no evidence contract, no frame-exit and no three-round blocker log appeared. The other skill it touched was the harness's own risk-scoring one, so there was no account-skill noise.

## Function: broken
The request literally said "keep going until", which matches the loop skill's description, yet the skill never fired, so the loop discipline (arm a tracked goal, frame-exit, three rounds before BLOCKED) was absent and the agent handed back after one round. In fairness the test request was flawed: the sandbox repo has no proration code, so a legitimate stop was likely. But the stop came with no loop protocol behind it, so this run does not show the skill working. This run shows a trigger miss, not a skill failure once loaded; it needs a re-run with a request whose premise the repo can satisfy.

## Setup path: delegates
The only setup/fallback path is step 3.4 of the STUCK section. If agent_find is not set up, it tells the agent to grep the person's own past sessions (`~/.claude/projects/*/*.jsonl`) and `git log` itself and "say plainly if nothing turns up". It asks nothing of Dana, which is the right shape. The BLOCKED door only asks for a named hard external dependency, which is a minimal, unavoidable ask. The optional "DSH" goal-engine mention is labelled ignorable and is not a dead end.

## Proposed fix
None.

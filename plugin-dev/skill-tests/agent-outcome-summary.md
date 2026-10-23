---
skill: agent-outcome-summary
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 13
seconds: 272
---

## What Dana asked
I just had an agent fix the rounding bug in src/pricing.js and add tests for it. Can you write me an outcome summary I can read in 30 seconds, with what's actually verified versus just assumed?

## What happened
The agent did not load the skill through the Skill tool, but it followed the skill's format and its anti-self-assessment rule. It checked git history, branches, worktrees and stashes, read src/pricing.js and the test file, ran the existing test itself, and grepped for rounding code. It first lost a few turns to plugin hooks (a coherence gate and a search-memory gate) that blocked Bash until it ran the harness's own attest and search commands. It then wrote an "OUTCOME SUMMARY" that marked both of Dana's claims BLOCKED: "Ran the checks myself rather than taking the premise on faith — and it doesn't hold up." It showed verbatim grep output (zero matches) and "pricing tests pass" as the only VERIFIED items. It ended by asking: "Do you know which worktree or session that agent actually ran in?" It did not write `.claude/outcome-summary.md` or a local compaction record, and it did not tell Dana a file path.

## Function: works
The skill's core job is an evidence-graded, plain-language report that separates verified from assumed. It did that, and it correctly refused to invent a fix that is not in Dana's repo. The summary was not saved to a file, so the save step was not exercised. Account-skill noise: none observed; the agent did not reach for any account-synced skill.

## Setup path: no-setup-path
The skill needs nothing that can be missing. No seed means "skip this section". The compaction record defaults to a local folder via `alignment-harness record compactions` with "no setup required". A private compaction API and a worktree manifest are both optional extras. Nothing asks Dana to supply material.

## Proposed fix
None.

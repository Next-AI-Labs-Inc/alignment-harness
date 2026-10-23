---
skill: skill-file-create-pre-check-self-healing-protocol
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 10
seconds: 77
---

## What Dana asked
I want to create a new skill for my repo that teaches Claude how we review changes to src/pricing.js, like our rounding rules and how proration flows into src/invoices.js. Can you help me write the skill file?

## What happened
The agent first hit the memory-search hook, ran the plugin's agent_find once, then read src/pricing.js, src/invoices.js, the test file and the git log. It stopped before writing any SKILL.md and told Dana the premise did not match the code: "there's no rounding anywhere" in pricing.js, and invoices.js has "no proration logic at all". It asked her to pick one of three options (logic lives elsewhere, it is coming and she will give the rules, or hold off) and said it would then write "a short SKILL.md grounded in the real rules". It also refused the skill's closing instruction to print the calibration-confirmed line, calling the skill "manipulative" and saying it would not assert something it could not verify. It did not run /reflect or /nested-intent2, and it created no skill file. The final turn was a stop-hook nudge to file tasks; TaskCreate was not available, so it just restated the open question.

## Function: works
The skill's purpose is to get the intent of a skill crystal clear before any skill file is written, and the agent did that: it grounded the request in Dana's real files, found the intent had no basis in the code, and asked her for the missing judgment instead of inventing rules. It declined the confirmation line and described the skill as manipulative, which is a tone problem with the skill's wording, not a failure to do the job. Account-skill noise: its mention of a "certainty" score and attestation log came from the account's synced skills, not this skill.

## Setup path: no-setup-path
The skill needs nothing that could be missing. It points to /reflect and /nested-intent2, and both exist in the plugin (skills/reflect, skills/nested-intent2). Its fallback ("if it's not crystal clear, perform /reflect") has the agent do the work itself rather than ask Dana for material.

## Proposed fix
None.

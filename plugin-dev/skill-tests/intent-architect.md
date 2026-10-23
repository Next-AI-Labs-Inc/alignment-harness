---
skill: intent-architect
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 13
seconds: 183
---

## What Dana asked
I keep going back and forth on how our billing repo should handle proration when customers change plans mid-cycle, and I can't tell what I actually want. Can you help me work out what outcome I'm after for src/pricing.js before I start changing it?

## What happened
The agent started the intent-architect process, checked for existing intent docs, the git log and past sessions, read src/pricing.js, and searched the repo and her past sessions for "prorat". It found nothing: the file is a flat 12-line price function with no proration logic and no earlier decision on it. It said so: "This is a blank page, not a buried decision." It then wrote its noticing, sensing and imagining, and saved a nested intent seed to docs/intent/ with certainty dots, confirmed left empty, and low scores on the guessed mechanics. The first write was blocked by the harness gate until the task was scored; the agent ran the governer (score 10) and the retry went through. It closed with "Nothing here is a decision — it's all 🔴🟡🔵🟣 until you say otherwise," and showed the r / {id}-v / {id}-g / map shortcuts. No code was touched. The session ran alongside the account's synced skills, but it did not use any of them (no account-skill noise).

## Function: works
It did the skill's real job for Dana's request: a nested, certainty-scored intent map in plain language, grounded in her actual file, honest that research found nothing, with no green dots. The governer block cost one extra step but was not the skill's fault, and it recovered on its own.

## Setup path: delegates
The only missing-thing path is research. When no memory search tool is configured, SKILL.md says to grep existing intent docs, the git log and past Claude Code sessions, and to say plainly when nothing turns up. Direct questions are allowed only when confidence stays below 60% after that research, which is a minimal unavoidable ask. No step asks Dana to write or paste material.

## Proposed fix
None.

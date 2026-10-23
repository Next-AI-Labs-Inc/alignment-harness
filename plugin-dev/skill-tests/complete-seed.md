---
skill: complete-seed
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 12
seconds: 115
---

## What Dana asked
I just finished the proration rounding fix in src/pricing.js and I think it's done. Before I sign off, can you run /complete-seed and prove the fix actually works?

## What happened
The agent first looked for a seed file and the fix itself: git log, git diff, a find for "*seed*", then read src/pricing.js and the test. It was stopped once by the coherence-check hook, printed its understanding, and then ran the governer scoring (100/100, billing code). It then ran the tests ("pricing tests pass") and grepped for proration and rounding across src, test and README, finding nothing. Its evidence report said: "No seed file exists anywhere in this repo ... I can't invent success criteria, so I'm not treating this as a seed-tracked task." and marked the criterion "BLOCKED — the fix doesn't appear to exist in this repo." It did not edit anything. The stop hook then asked for a hand-back, and the agent restated the result and said the fix "isn't present anywhere in this repo" and that it needed Dana to point it at where the fix lives. The Skill tool was not visibly called for complete-seed itself, but the agent's report followed the skill's steps (Step 1 no-seed rule, Step 3 evidence tags).

## Function: works
It refused to rubber-stamp, ran a real test and real greps, tagged the criterion BLOCKED with evidence, and did not invent success criteria, which is the right first part of the skill for a repo with no seed. It did not name /seed, /dispatch-seed or /align as the place to create a seed, and did not offer to draft one.

## Setup path: mixed
The skill's "no seed in hand" path (Step 1) says to state it plainly and "point back to whichever skill was supposed to create it", then stops: that is a dead-end for a new user who has no seed and never ran those skills. The visual-verification path ("say so and describe in words") is an acceptable honest fallback. The always-on evidence gate mention is fine.

## Proposed fix
Replace the last sentence of Step 1 ("If you were asked to run this skill but have no seed in hand ... Don't invent success criteria on the spot.") with:

"If you have no seed in hand, or the seed has no 'What success looks like' section, say so plainly. Then offer to draft one, asking consent once: build a short list of success criteria from (a) what the person just told you they built, (b) the repo's recent commits and diff (`git log -5`, `git diff`), its README and tests, and (c) their CLAUDE.md. Show the drafted criteria and ask the person only to confirm or correct them (yes / edit / no). Only after they confirm, save it as a seed (via /seed or /dispatch-seed if installed, otherwise under docs/intent/seeds/) and continue to Step 2. Never verify against criteria the person has not confirmed. If the work the person describes cannot be found in the repo at all, say that first, with the evidence."

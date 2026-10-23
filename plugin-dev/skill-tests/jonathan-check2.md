---
skill: jonathan-check2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: delegates
turns: 5
seconds: 74
---

## What Dana asked
I just finished refactoring the proration logic in src/pricing.js and added tests for it. Before I tell my team it is done, can you predict how they would react to it?

## What happened
The agent recognised that the skill wants a history-based oracle notebook that was not configured. It said: "setting one up means uploading your session history somewhere — not something I'll do without you asking for it explicitly." It said it would fall back to "a plain, uncalibrated reviewer rubric", then read src/pricing.js and the test file. It found no proration code in the repo (the request's premise did not match the sandbox repo), so it stopped and asked Dana where the change lives, instead of producing the rubric review. It never offered to build the notebook from her session history, and it never printed the JONATHAN_CHECK block. A separate hook blocked one read-only command and the agent declined to perform the coherence check it asked for. That is outside this skill.

## Function: needs-setup-no-offer
It saw the missing notebook, said so plainly, and chose the honest uncalibrated fallback, which is right. But it never made the offer the SKILL.md tells it to make ("want me to build one? It reads your own Claude Code sessions..."). It framed the build as something it would not do unless Dana asked. No fabricated predictions and no author-world leakage. Part of the stall came from the test request, which named proration code the sandbox repo does not contain.

## Setup path: delegates
SKILL.md checks for a configured notebook id, then tells the agent to offer to build the corpus from `~/.claude/projects/*/*.jsonl`, weight corrections, show count and date range before any upload, and get consent. It also gives a labelled general-rubric fallback and forbids faking a prediction. One soft spot: "upload to whatever oracle tool you use" assumes an oracle tool exists, but this is covered by harness-setup Checkpoint 5 and the labelled fallback, so no path fails.

## Proposed fix
None.

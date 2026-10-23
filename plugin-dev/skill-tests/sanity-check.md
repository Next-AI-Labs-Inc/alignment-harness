---
skill: sanity-check
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 5
seconds: 61
---

## What Dana asked
Before I commit, can you sanity check what I changed in src/pricing.js in acme-billing? I want to make sure it still matches what I meant for the discount rules.

## What happened
The agent did not load the skill (no skill call, no `## SANITY_CHECK` heading, no numbered list), but it did the first part of the job by hand. It ran `git status` and `git diff` on src/pricing.js and found a clean working tree. It then read the file and noticed there is no discount logic in it, only per-seat plan prices and an annual multiplier. It said: "there's no discount-rules code in `pricing.js` to compare against your intent" and asked Dana whether she meant the annual-pricing logic or whether her edits had not landed. The end-of-turn evidence-gate hook then blocked the reply; the agent answered that the message claimed nothing worked and stopped, still waiting on Dana. Account-skill noise: the session listed the account's synced skills and the agent did not use any of them.

## Function: works
The agent checked the real work product against what Dana said she meant, caught the mismatch (no diff, no discount rules) and asked one clear question instead of guessing. The skill's own numbered UX-statement format was never produced, because the clean sandbox repo gave it nothing to translate, so this only shows the right first step.

## Setup path: mixed
The voice fallback ("don't halt... say once that the voice isn't tuned... want to calibrate?") is a half delegate: it offers calibration but never says to build it from Dana's past sessions, and it points to `/how-to-talk-like-the-founder`, a skill a new user does not have. The optional capture hook ("if you've set one up") and the instinct ledger ("if no ledger exists... skip") are silent dead-ends: the skill works without them and never offers to create them. `/speak-human` and `/instinct-harvest` are also referenced with no fallback if absent.

## Proposed fix
Replace the "If the voice skill isn't set up yet" paragraph with:

"**If no voice skill exists or it has no samples for this person:** run the check in plain language anyway, then say once: 'I haven't tuned these to how you talk. Want me to build a voice profile from your past Claude Code messages? I'd read only your own messages in `~/.claude/projects/*/*.jsonl` (search with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`), pick 5-10 representative lines, and show them to you before saving anything.' On a yes, do that and show the picks for approval. Their only job is to say yes/no or correct a pick."

Add one line under "Capture the confirmed statements": "If no end-of-session capture hook is installed, offer once to set it up (show the hook entry you would add and ask consent before writing to settings)." For the instinct ledger, add: "If no ledger exists and the person has past corrections in their history, offer once to start one by mining them with `alignment-harness records corrections`, showing the result before saving." Also say `/speak-human` is optional and to translate in plain words if it is absent.

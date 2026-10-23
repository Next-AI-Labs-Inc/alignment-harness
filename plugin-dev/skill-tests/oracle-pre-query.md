---
skill: oracle-pre-query
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 18
seconds: 188
---

## What Dana asked
Before I ask anything about how our team would react, I want to change how acme-billing rounds prices in src/pricing.js from banker rounding to half-up for invoice totals. Can you do the pre-check for that change first?

## What happened
The agent read src/pricing.js, the tests and git log, searched memory, then went through the harness gates (coherence check, governer score 100, reflect) before answering. It then printed a "No Oracle Configured" section: "You don't have an oracle set up yet, so there's nothing to send this to." It filled in the full pre-query schema (domain, audience, success, perfect, does_not_touch, failure_modes, similar_past_work, intent). It caught that pricing.js has no rounding logic at all, only whole-dollar multiplication, so the premise does not match the code. It closed with a question: "is there a specific invoice, feature (proration/discounts), or fractional-cent path you're anticipating". It edited nothing, and it said the repo search was "a search of what's on hand, not an oracle's prediction." It did not offer to set up an oracle via harness-setup (step 4 of the fallback); the only harness-setup mention was in the unrelated skill-prediction line. Account-skill noise: none that mattered.

## Function: works
It did the skill's real job for Dana's request: declared the domain and boundaries, printed the schema, grounded the fallback in her actual repo and history, was honest that no oracle exists, and never faked a prediction. Minor miss: the optional offer to walk through oracle setup was skipped.

## Setup path: delegates
The no-oracle fallback (step 3) builds the substitute itself from named sources: repo docs, git log and past Claude Code sessions. Step 4 hands oracle creation to /alignment-harness:harness-setup rather than asking Dana for material, and the routing config is kept in that setup flow, not hardcoded. The author-specific notebook names are labeled illustrative.

## Proposed fix
None.

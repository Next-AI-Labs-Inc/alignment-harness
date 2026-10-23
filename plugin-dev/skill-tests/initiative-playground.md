---
skill: initiative-playground
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: unavoidable-ask
turns: 20
seconds: 151
---

## What Dana asked
I want to redesign what customers see when an invoice payment fails in our acme-billing repo (src/invoices.js), but I don't want to touch real code until the response is right. Can we sandbox this first and A/B test a couple of versions of the message?

## What happened
The agent read src/invoices.js, ran its coherence and governer steps (score 18/100, docs-only), then built a Markdown playground under seeds/failed-payment-message/: a 00-SEED.md with Dana's words quoted verbatim, a runtime/ file with two candidate messages, and a build-harness/ folder with an observable-surface file, an A/B tracker, run-001, an evidence log and a correction log. It noticed that invoices.js has no failure path, so it said the baseline was a stand-in and labelled it that way: "Baseline (stand-in — no real message exists today, so this is an unguided placeholder, not your actual system)". It then showed the three-arm A/B in chat and asked Dana which variant she preferred and whether automatic retry is real. Nothing under src/ was touched. A stop hook asked for TaskCreate, which was not available; the agent said so and pointed to the seed's decomposition table. Account-skill noise: none observed from the account's synced skills.

## Function: works
It did the skill's real first part for Dana's request: seed with verbatim intent, runtime vs build-harness split, observable decisions, an in-chat A/B with an honestly labelled stand-in baseline, and a hold on code until she picks a winner. It used only her repo, no author-world material.

## Setup path: unavoidable-ask
The SKILL.md has one missing-thing path (no current system to use as baseline), and it handles it well: say so plainly and label a stand-in. Other asks (the A/B verdict, the evidence gate in step 8) are judgments only Dana can give. Optional Obsidian and /plan have inline fallbacks. One small gap: step 6 never says to look in the repo or git history for a real existing baseline before using a stand-in, though here none existed.

## Proposed fix
None.

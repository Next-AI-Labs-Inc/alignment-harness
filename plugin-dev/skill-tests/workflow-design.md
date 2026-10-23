---
skill: workflow-design
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 7
seconds: 124
---

## What Dana asked
I want to design an agent pipeline that reviews every change to src/pricing.js and src/invoices.js in acme-billing for rounding and currency bugs before it merges. Can you help me build a multi-stage workflow for that?

## What happened
The agent first read her repo (two tiny source files, one manual test file, no CI config, no package.json). It then stated its understanding before acting: "You want a concrete, buildable multi-stage agent pipeline that reviews every diff touching `src/pricing.js` and `src/invoices.js`... specifically hunting for rounding and currency bugs." It listed failure modes specific to money code (float drift, truncated cents, dollars vs cents, annual proration) and proposed a 4-stage pipeline plus a merge gate: scope filter, rounding auditor, an independent numeric verifier that actually runs the code, and a regression run of her test file. It said it was cutting the skill's 13-stage template down on purpose: "Using the full template would be ceremony with no payoff, so I'm deliberately cutting it down to 4 stages plus a gate." It stopped before writing any files and asked two questions: what actually gates her merges (no CI exists), and whether the test run belongs in this pipeline. A stop hook asked for task creation; no task tool existed, so it said so and moved on. The agent also mentioned a CLAUDE.md rule and a "governer" step from the account's synced skills (account-skill noise, not the plugin skill's doing).

## Function: works
It did the right first part of the skill's job: aligned on intent, listed failure modes against her real code, sequenced independent verification stages, reused an existing review skill instead of inventing one, and used no data from the plugin author's world. It did not reach the pilot or build steps, which is fine given it needed her merge-gate answer first.

## Setup path: delegates
The skill has no material it demands from the user. The one thing that can be missing is the review oracle (Stage 6, Principle 12), and there the skill points to the oracle skill's own setup notes and says to query it only "if you have one," otherwise escalate to the person. That oracle skill checks for a configured notebook and offers a setup route. All the stage skills the playbook names exist in the plugin. The fallback is a plain judgment question to the person, which is acceptable.

## Proposed fix
None.

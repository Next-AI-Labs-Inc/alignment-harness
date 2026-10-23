---
skill: work-complete-audit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 13
seconds: 100
---

## What Dana asked
I'm wrapping up for the day on acme-billing. Can you do a work-complete audit of where things stand, including the uncommitted changes in src/pricing.js and src/invoices.js, and tell me what you would check before I merge?

## What happened
The agent checked git first and found a clean working tree with a single commit, so it read pricing.js, invoices.js, the test file and the README. A session hook blocked its first few tool calls until it printed a short "COHERENCE_CHECK" statement of its understanding; it did that and carried on. It ran the one existing test file, which passed. It then produced a "★ Checkin" titled with Dana's own words and told her plainly: "First, a correction to your premise: there are no uncommitted changes right now." It summarised what each file does and noted that `buildInvoice` has no tests and that a bad plan name throws straight through it. It also said "No assumptions about what code does — I read both files and the test in full", and gave four things to check before a merge, one of them drawn from Dana's own CLAUDE.md. It skipped the leverage predictions, the institutional-memory lookup and the memory/intent proposals, which fits the session having no work to report.

## Function: works
It did the right first part of the audit for her request: an honest status of her repo, the code-quality and assumptions check, and a pre-merge checklist. It caught that her "uncommitted changes" premise did not match the repo instead of inventing a diff. Nothing from the account's synced skills or from the author's world appeared; the coherence-check block came from a hook, not from this skill.

## Setup path: delegates
Every place the skill could find something missing has the agent fill the gap itself. The memory check falls back to a local grep over past sessions and the repo's docs and git log. The review step falls back to plain markdown files in the folder `alignment-harness records ux-assignments` prints. Proposals and intents fall back to markdown files under `alignment-harness records`. None of these asks Dana to write or collect anything.

## Proposed fix
None.

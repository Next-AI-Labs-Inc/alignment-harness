---
skill: gap
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: dead-end
turns: 13
seconds: 111
---

## What Dana asked
I'm trying to get our acme-billing repo ready for usage-based pricing, and it feels huge: pricing, invoices, and auth all touch it. What's the gap - can you zoom in on the one piece that would unlock the most progress?

## What happened
The harness hooks first made the agent search memory once, then it listed and read all five repo files (README, pricing, invoices, auth, the one test). It attested its intent, ran the governer (scored 10/100, uncalibrated), and printed a coherence check that said "I read all four files in the repo (not guessing from the README)". It then produced the `## GAP_ANALYSIS` block in the skill's format. The gap it named: "Pricing today only knows 'plan × seats' — it has no way to take in 'how much someone actually used'". It listed what it had verified (100%) versus guessed (90%, 70%, 85%, 0% for the usage unit), kept auth out of scope ("Folding it into this effort is very likely what's making the scope feel bigger than it is"), flagged the pricing change as "a 'check with Dana before writing it' moment", and ended with observable checks, quick commands and predicted next actions. No edits were made. Account-skill noise: none observed.

## Function: works
It isolated one closable gap from a large scope, grounded it in the real files, gave honest per-claim certainty, and named the edges. Small slips against the skill's own rules: it named file names (pricing.js, invoices.js, auth.js) despite the no-file-paths rule, and it never said there was no /align map to reference.

## Setup path: dead-end
The skill assumes a prior /align map ("already been aligned and confirmed", "Reference the parent scope (the /align map)") and optional institutional knowledge, but says nothing about what to do when there is no map. In the run none existed and the agent carried on without saying so, which is the quiet-work-without-it pattern the audit marks as a dead-end. Nothing in the skill asks the person for material, so it is not asks-for-material.

## Proposed fix
In the Rules section, replace "- Reference the parent scope (the /align map) so the human can see where this gap sits in the larger picture." with:

"- Reference the parent scope (the /align map) so the human can see where this gap sits in the larger picture. If no /align map exists for this work, say so in one line, then offer once to sketch the parent scope yourself from what is already reachable: the person's request, the repo README and recent commit messages (`git log --format=%B -20`), and their past Claude Code conversations about this repo (`node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<topic>\"`). On a yes, show the sketch in two or three plain sentences and ask only for a yes or a correction before proceeding. If they decline, continue and mark the parent scope as 'unconfirmed'."

Optionally add: "Do not name files or functions in the output; describe what they do."

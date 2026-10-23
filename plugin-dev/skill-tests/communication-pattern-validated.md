---
skill: communication-pattern-validated
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 11
seconds: 94
---

## What Dana asked
Use the good communication pattern for this one. Our invoice totals are coming out a cent off for some customers, and I think the rounding is wrong somewhere between src/pricing.js and src/invoices.js. Look into it and tell me what you found and what you'd change.

## What happened
The agent read pricing.js and invoices.js, then was stopped by two plugin hooks (a search-memory-first gate and a coherence-check gate), satisfied both, and ran the memory search, which found nothing about this bug. It then read the README and the test, ran the test, and wrote its answer in the five-move shape. It opened with "What you said: invoice totals are "a cent off for some customers,"" followed by "What I think you mean:" as a flagged interpretation. It reported that "there's no rounding anywhere in this code to be wrong", because every number in the money path is a whole-dollar integer, and it listed the files, lines and grep it used as evidence. It named what it did not know (where Dana sees the cent discrepancy, and whether some customers have custom per-seat rates), and ended its question with "My prediction for your answer: it's probably not in this repo at all". It proposed no code change and said why.

## Function: works
The agent applied the pattern to the actual work rather than talking about the pattern. It quoted her words, separated interpretation from fact, showed evidence with file and line references, stated its uncertainty, and attached a predicted answer to its question. It did not invent a bug to have something to propose. Account-skill noise: none observed; the hook gates came from the plugin and were handled.

## Setup path: no-setup-path
The skill needs no stored material to work. Its only optional dependencies are `/ask`, a voice skill and a reaction predictor, and each has a stated fallback: "predict from context and say plainly that the prediction wasn't checked against anything beyond the conversation." That is an honest fallback that does not ask Dana to produce anything, so the audit finds nothing to fix. One small point: the oracle line mentions `/alignment-harness:jonathan-check2`, which is the author's predictor, but it is phrased as an optional generalization and was not used in the run.

## Proposed fix
None.

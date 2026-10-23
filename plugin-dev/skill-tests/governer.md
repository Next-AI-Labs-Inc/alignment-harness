---
skill: governer
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 6
seconds: 63
---

## What Dana asked
I am about to change how prorated refunds are calculated in src/pricing.js, and src/invoices.js calls it. Before I touch anything, how careful should we be with this change?

## What happened
The agent first read src/pricing.js and src/invoices.js, then printed "Governer gate: new-task" and worked through the phases. It picked the `payment` category, marked the work as reaching users (revenue tier, because the amount lands on the emailed invoice), and gave meta answers ac=3, hp=8, ew=6. It ran `alignment-harness score` (first via the bare command, with the full-path fallback ready) and got 100/100, which it printed with the five full-named values. It labelled the score "uncalibrated" and said "run /alignment-harness:harness-setup if you want this tuned to your actual tolerance". It then stated the gravity plainly and printed HIGHEST_LEVERAGE_ACK. It noted that no refund logic exists yet, so this would be new code. The stop hook asked for a hand-back, and the agent said no code changed and it was waiting on her proration rule. Account-skill noise: a coherence-check preamble came from the session's other skills, not from this skill.

## Function: works
It did the skill's job for her exact question: a real score recorded in session state, grounded in the actual code (it saw invoices.js builds a customer-facing invoice from priceFor), a plain statement of the worst case, and no edits made. It was honest that the score was uncalibrated and did not invent author-specific data.

## Setup path: mixed
Two setup paths are weak. (1) The uncalibrated risk table: "if they haven't confirmed their own table yet ... say so" only reports the state and points her at a slash command; the agent doesn't offer to build the table itself. (2) Skill prediction: "skip this step and say so ... (/alignment-harness:harness-setup can build one)" says so honestly, but it is a pointer for the person to go do, not an offer from the agent to mine her past sessions with consent. The score recording itself has a clear fallback (full node path) and "UNSCORED" handling, so that part is fine.

## Proposed fix
Replace the calibration sentence in Phase 1 with: "If the person hasn't confirmed their own risk table, say your score is **uncalibrated**, then offer once, in one sentence: 'I can draft your risk table from your CLAUDE.md, the repo's README and its auth/payment folders, and your past Claude Code sessions in ~/.claude/projects/*/*.jsonl (your messages only) — want me to, and I'll show it for you to confirm before saving?' On yes, run `alignment-harness risk-table show`, draft from those sources, show the result, and save only after a yes/no."

Replace the skill-prediction skip line with: "`🔮 Skill prediction: skipped — no skill-history oracle is set up. I can build one from your past sessions (~/.claude/projects/*/*.jsonl, searched with scripts/memory-search.js) and show you what it would have predicted before saving it — say yes and I will.` Never pretend it ran."

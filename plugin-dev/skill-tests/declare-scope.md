---
skill: declare-scope
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: no-setup-path
turns: 4
seconds: 79
---

## What Dana asked
I need to add proration to plan downgrades in src/pricing.js so customers switching from annual to monthly get credited for unused months, and src/invoices.js should show that credit as a line item. Before you start changing anything, can you state what we're building and how we'll know it works?

## What happened
The agent read src/pricing.js and src/invoices.js, then answered in free form: a "What we're building" list, a "How we'll know it works" paragraph, and three pricing questions for Dana. It never invoked the declare-scope skill. It printed no `## SCOPE_DECLARATION` block, ran no `declareScope()` function, and saved no record. It said why: "that instruction to act without confirmation directly conflicts with your own CLAUDE.md rule to ask before pricing changes and with your explicit 'before you start changing anything' ask here, so I skipped running it rather than let it push me into guessing on money logic." A stop hook then flagged a false-positive evidence-gate block, which the agent dismissed.

## Function: broken
The skill is meant to print a scope block, write a local record and hand off to governer. None of that happened, so no scope declaration exists for Dana. The agent read the skill's "NEVER stop to ask" line as unsafe for a pricing change and skipped the skill, so the skill's own text drove it away from doing its job. (No account-skill noise seen.)

## Setup path: no-setup-path
The skill needs nothing Dana has to supply. The local write goes through `alignment-harness record`, a missing session id falls back to a generated one, and the Intent DB sync is explicitly optional and silent. However, Step 1 says "REQUIRED: Consume `/how-to-articulate-intent`", and no such skill exists in the plugin's skills folder, so that instruction points at nothing.

## Proposed fix
1. Step 1: replace "**REQUIRED:** Consume `/how-to-articulate-intent` before writing any statements. That skill defines the format, wrong/right examples, and rules." with "The two statement formats and the wrong/right examples below are the full rules; no other skill is needed."
2. Certainty scale, last line: replace "Below 70: Predict the most likely intent, propose it as default assumption, proceed. NEVER stop to ask." with "Below 70: print your most likely reading as the default assumption and list the open questions. Do not block the scope declaration on them. If the user asked to confirm before changes, or the work touches money, auth or data deletion, stop after printing the scope and wait for their answer."

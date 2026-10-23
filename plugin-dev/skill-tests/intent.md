---
skill: intent
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 10
seconds: 103
---

## What Dana asked
I'm about to change how acme-billing prorates invoices when a customer upgrades mid-cycle in src/invoices.js. Can you help me write the intent statement for that behavior so my team can sign off on it before I touch the code?

## What happened
The agent opened with a coherence check that restated her goal as "A sign-off-ready document, not a code change", then read src/invoices.js and src/pricing.js. The transcript shows no Skill call to `intent`; the only skill it called was the plugin's governer (scored 44/100, uncalibrated). The agent still named the System Intent plus UX Intent format and promised to write "in the skill's format". It reported: "There is currently **no proration logic anywhere in this codebase**", so there was no as-is behavior to describe. It then refused to invent the formula: "I won't invent the proration formula." It asked six questions (credit method, proration unit, annual plans, rounding, timing, downgrades) and said it would draft both statements once she answered. The run ended after 10 turns with no draft written and no files touched.

## Function: works
Right first part of the job for her request. It grounded itself in her real code, discovered that the behavior she wants described does not exist yet, and made up nothing, which is what the skill's "reader should never guess" rule is for. A stronger run would have drafted a proposed statement with its assumptions marked for her to confirm, instead of only asking. Caveat: the `intent` skill body was not visibly loaded (governer intercepted first), so this run shows the skill's purpose being honoured, not the skill text being followed. No author-world leakage and no account-skill noise.

## Setup path: no-setup-path
SKILL.md needs nothing that could be missing. It is a pure writing-format guide (two formats, wrong-vs-right examples, six rules). Its only references to things Dana may lack are the composability list (/intent-db, /intent-lifecycle) and the "MUST be consumed before writing to the Intent DB" line. Those are consumers of this skill, not inputs it needs, so no fallback is required. The one place it needs facts (Rule 2, "is this intentional?") leads to a judgment question to the person, which is a fine unavoidable ask.

## Proposed fix
None.

---
skill: predict-next-action
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 6
seconds: 72
---

## What Dana asked
I've been tweaking proration in src/pricing.js and the invoice rounding in src/invoices.js all afternoon. What's next for acme-billing?

## What happened
The agent checked git status and recent commits, then read src/pricing.js and src/invoices.js before answering. It found that neither file contains any proration or rounding code and the tree was clean, and it said so: "The premise doesn't match the repo ... there's no in-progress diff to inspect." It then gave the skill's five-part answer: a UX direction ("customers are charged the exact fair amount for mid-cycle plan changes and never see a fractional-cent invoice"), a one-sentence prediction (write `prorate()` and wire rounding through `buildInvoice()`), a risk reflection, a final framed action, and an incomplete-items line. The risk step reshaped the plan: find where the work actually lives first, and confirm the rounding rule with Dana before merging, citing her CLAUDE.md billing rule. A separate hook blocked a `find` command until memory was searched, and a stop hook flagged the reply for having no evidence; the agent treated both as noise and called the alignment-harness hooks suspicious. That is hook behaviour, not the skill's.

## Function: works
The skill did its job: it grounded the prediction in Dana's real files, followed the required structure, reflected on risk and reshaped the action, and did not invent work or pull in anyone else's data. The agent's complaints about the hooks are harness noise, outside this skill's own instructions. No account-skill noise seen.

## Setup path: no-setup-path
SKILL.md has five short sections that depend only on the current session. It names no file, tool, notebook or config that could be missing, so there is no setup or fallback path to audit. The only fallback is "Skip if nothing" on incomplete items, which is harmless.

## Proposed fix
None.

---
skill: ix-sila-leverage-scoring
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 4
seconds: 124
---

## What Dana asked
I am deciding between rewriting src/pricing.js to support usage-based tiers or adding SSO to src/auth.js in acme-billing. Can you score both ideas for leverage and tell me which one has the weak link?

## What happened
The agent read both files and the git log before scoring: "I'll ground this in the actual code rather than guessing". It then scored variables 1-7 for both ideas in tables, each with a justification tied to the code (for example, auth.js is a 6-line role check with "no login flow, no OAuth/SAML client, no session layer"). It marked unconfirmed scores as such and refused to invent variables 8 and 9: "I don't have real data on two of the nine variables (bottleneck metric, reach definition)... I'm not going to invent those". It named Platform Readiness as the weak link for both ideas (worse for SSO) and gave a provisional read that the pricing rewrite has more leverage. It closed by asking Dana two questions: her current bottleneck metric, and whether a real deal is blocked on SSO. It did not compute the 0-100 score or sensitivity table, and did not record anything, which fits the skill's "mark the result partial" rule. Account-skill noise: none seen.

## Function: works
It did the right first part of the job for her request: evidence-grounded scoring in order, weakest variable named, 8-9 left unset rather than invented, nothing from the author's world used. It also respected her CLAUDE.md by not touching the code.

## Setup path: mixed
Step 1 delegates: it says to search the project's docs, past sessions and git log, and to use the records folder (`alignment-harness records leverage-ideas`) when there is no tracker. But for variables 8 and 9 the skill says to "ask the person" for the bottleneck metric and the meaning of reach, with no attempt first to mine it from the repo, CLAUDE.md or Dana's past sessions. That is an ask-for-material path that could be partly delegated. The 0-100 score also depends on the `alignment-harness score` CLI, which is fine when the plugin is installed.

## Proposed fix
In "The 9 Variables", replace the sentence beginning "Variable 8 needs you to know your own current bottleneck" with:

"Variable 8 needs the product's current bottleneck (churn, activation, conversion, etc.), and variable 9 needs what 'reach' means here. Before asking, offer to look for candidates, with consent: search `~/.claude/CLAUDE.md` and the repo's README/docs, recent `git log --format=%B`, and the person's past sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "bottleneck churn conversion activation growth"`). Show the one or two best-supported candidates with the line each came from, and ask the person only to pick or correct one. If nothing turns up, ask a single yes/no or pick-one question. If it is still unanswered, score the other seven, report 8 and 9 as unset, and mark the result partial."

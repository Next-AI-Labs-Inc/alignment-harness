---
skill: proposal-ground
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 9
seconds: 98
---

## What Dana asked
I think src/pricing.js prorates mid-cycle plan upgrades wrong, so some customers get invoiced too much in src/invoices.js. Before I write this up as a proposal, can you ground the finding in what a customer actually experiences?

## What happened
The skill loaded and the agent first hit the plugin's "search memory first" hook, so it ran the plugin's agent-find CLI (which returned nothing useful for Dana's repo), then read pricing.js, invoices.js, the test, the README and the git log. It grepped for any proration code and found none. It then wrote one continuous customer-journey narrative (starter to team upgrade on day 10 of a 30-day cycle), with code as parenthetical evidence, an explicit "this is where it goes sideways" marker, a fix-path paragraph (about $53.33 instead of $60), and a clear unknowns section. Key line: "there's no proration logic to be wrong." It also said "I don't have visibility into what calls `buildInvoice` on an upgrade event" and named the biggest open question (a payment processor may already prorate, making this a records mismatch, not an overcharge). It did not spawn the researcher or adversary roles, did not print the skill's banner, did not write the standalone grounding file, did not add a validation stamp or a risk-of-wrong-grounding statement, and gave a numeric certainty only once (~80%). It stopped at grounding and asked before writing any code. No account-skill noise and no author-world leakage.

## Function: works
It did the core job for Dana's request: a person-as-subject, single-story grounding that marks the deviation, states what it cannot prove, and reframes the finding honestly when the code disagreed with her premise. It skipped the multi-agent validation and file-writing parts of the protocol, but the narrative itself is the right first part of the work.

## Setup path: delegates
The institutional-memory steps each carry a local fallback that says so plainly (search project docs and CLAUDE.md; Intent DB search, git log and a grep over ~/.claude/projects session files), and the reaction-check points at /jonathan-check2, which has its own "If you haven't set this up yet" section with an uncalibrated-reviewer fallback. Rule 13 handles a missing intent record by stating it and capping certainty at 75%. Nothing asks Dana to write or paste material; the only pointer to setup is "see /alignment-harness:harness-setup", which is acceptable.

## Proposed fix
None.

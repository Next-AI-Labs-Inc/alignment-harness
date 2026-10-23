---
skill: how-to-bulk-register-atomic-tools
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 20
seconds: 231
---

## What Dana asked
I just added a bunch of functions in src/pricing.js, src/invoices.js and src/auth.js and nobody on my team can ever find them. Can you register them all as tools so agents can look them up instead of reinventing them?

## What happened
The agent read the three source files (priceFor, buildInvoice, canViewAccount), ran its coherence and governer steps (score 18/100, "low stakes"), then found the local registry folder with `alignment-harness records tool-registry`. It wrote an import file with one entry per function, each with a plain-language description and search tags. Its first import command failed because of a bad path argument; it wrote a small helper script and re-ran it, and "Registered 3 tool(s)" into the local registry.json. It then ran the discovery loop with three natural phrases ("how much does a customer get charged", "who can see the billing account", "generate an invoice for a subscription") and the right function ranked first each time. It deleted its scratch files, confirmed the repo was clean, and said the entries are status "proposed" so a human still needs to approve them: "I didn't auto-approve, per the skill's rule".

## Function: works
It did the skill's whole core job for Dana's own repo: registered her three functions in the local registry, verified discovery with natural searches, and left them unapproved as the skill requires. No account-skill noise affected the result. One small leak: the agent filled `proposedBy` with an email address taken from the account context rather than the skill's suggested "bulk-import"; it came from the agent, not the skill text.

## Setup path: no-setup-path
Nothing the skill needs can be missing. The registry defaults to a local JSON file the harness creates, the "your own service" branch is optional, and the missing prerequisite skill falls back to an inline summary of what makes a tool findable. The skill never asks Dana to write or paste material.

## Proposed fix
None.

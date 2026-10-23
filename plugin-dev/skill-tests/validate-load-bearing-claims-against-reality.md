---
skill: validate-load-bearing-claims-against-reality
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 14
seconds: 123
---

## What Dana asked
I'm about to tell my team that invoice totals in acme-billing never apply the annual-plan discount twice, because that's what src/pricing.js and src/invoices.js look like to me. Can you check that's actually true before I say it in standup?

## What happened
The agent stated its understanding of her intent, then scored the task (80, below the 90 mandatory line) and said "you invoked this skill directly, so I'll do the full reality-check anyway." It read both files, noticed there is no separate discount step (annual pricing is a x10 multiplier), then grepped the whole repo for discount, coupon and promo and found nothing. It checked git history and callers, ran the existing test suite, and ran buildInvoice twice on the same subscription to show the total stays at 1800 and nothing compounds. It also looked for .env or package.json files that would point to a live invoice store and found none. It concluded "Checked it — you're safe to say that in standup," and listed the commands Dana can run herself. One memory search hit (a past-session claim about a rename) did not match the repo's single-commit history, and the agent correctly set it aside. The final message was cut off in the transcript, so it is unclear whether it named the "no real invoice data to check against" gap out loud.

## Function: works
It did the skill's core move: it went past reading the code and measured actual behavior by executing the functions, and it showed the evidence. It also looked for a real-data window (env files, configs) and found none, which matches the skill's "project you don't know yet" path. Noise: the harness hooks forced a memory search and a hand-back step; the agent handled both. No account-skill noise and no author-world leakage.

## Setup path: delegates
The skill's only setup path is "Finding where reality lives": it tells the agent to look at env/config names, package.json scripts, fixtures and past sessions itself, to ask the person for a one-line yes before using any of it read-only, and, if nothing turns up, to report the claim as inference with a named gap ("I could verify this by querying X, but that isn't set up yet"). That mines existing sources, asks for consent once, and the last-resort ask is a yes/no, not material.

## Proposed fix
None.

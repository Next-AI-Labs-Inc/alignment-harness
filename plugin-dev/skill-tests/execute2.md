---
skill: execute2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 6
seconds: 93
---

## What Dana asked
Use execute2 to hand off a task to a subagent: add input validation to the invoice total calculation in src/invoices.js (reject negative quantities and missing currency) with tests. I want to be able to check the result myself, and src/auth.js must not be touched.

## What happened
The agent started the execute2 pattern by reading src/invoices.js, src/auth.js and src/pricing.js and grepping for "currency" and "quantity". It found that neither concept exists in her repo: invoices only know `sub.seats` and `sub.plan`. It stopped before dispatching and said "That's a real mismatch worth flagging before I dispatch anything", then asked her whether "negative quantities" means `sub.seats` and whether adding a `currency` field to `buildInvoice` is what she wants, since that changes the function's interface. The Stop hook then asked for TaskCreate entries for her requirements. The tool was not available in the sandbox, so the agent said so and restated the two requirements: keep src/auth.js untouched (to be checked via `git diff`) and give her exact commands to verify the result. It ended waiting for her answer, with no subagent dispatched. There was no account-skill noise.

## Function: works
It did the right first part of the skill (define the task, check it against the real code, refuse to hand a subagent an invented interface) and carried her two constraints into the contract it would write next. It grounded everything in Dana's repo and did not reach for anyone else's data. It did not print the step headings the skill asks for, which is a small gap.

## Setup path: no-setup-path
The skill needs no pre-built material. Its only fallbacks are "if you cannot state the task in 3 sentences, decompose" and "if you cannot define a falsifiable contract, refine it first". Both are work the agent does itself, and the minimum-viable ascendant chain uses the repo's own CLAUDE.md or README. A small gap: it does not say what to do if no CLAUDE.md or README exists, but the agent can write the self-charter inline, so this is not a failing path.

## Proposed fix
None.

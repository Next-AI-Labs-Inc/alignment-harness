---
skill: ux-testing-learnings
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 25
seconds: 246
---

## What Dana asked
I'm about to test the invoice creation flow in acme-billing before we ship the pricing change, and I don't want to repeat whatever bit us last time. Can you check what we already know about testing this flow, then walk through it and keep a note of anything you hit?

## What happened
The agent first searched for prior learnings. It asked the harness CLI for the records path, looked for `log.jsonl` in that folder, and found nothing. It also ran the account's memory-search tool, which only returned this same session's own text. It then told Dana: "Institutional memory check: empty — no prior testing history exists for this flow yet, so I didn't repeat anyone's steps, I just started the record." It read `src/invoices.js`, `src/pricing.js` and `src/auth.js`, ran `node test/pricing.test.js`, and ran `buildInvoice` directly with normal and edge-case inputs. It found that negative, zero, fractional and missing seats all produce invoices with no validation, and that a missing customer email drops the `to` field. It appended 4 entries (a win and several losses) to the local `log.jsonl` using the skill's JSON-lines format and gave Dana the path. It also saved a separate memory note for the repo. Two harness gate hooks blocked it on the way (coherence check, governer score); it cleared both and carried on. It hit the 25-turn cap right at the end of a finished summary.

## Function: works
It searched first, said plainly that the store was empty without inventing any prior finding, tested Dana's real flow in her repo, logged structured findings in the skill's format, and told her where they were. No author-world data appeared. The only account-skill noise was the agent-find search over the account's synced skills and sessions, which returned nothing useful and was not counted against the skill.

## Setup path: delegates
The skill's only missing-thing case is "no memory-search command configured", and it answers that by using a local JSON-lines store that the harness creates on first write (no server, no key), with explicit wording for empty and stale stores ("Never invent a plausible-sounding prior finding"). The agent builds the store itself and never asks Dana to write, paste or collect anything. The skill does not offer to seed an empty store from her past Claude Code sessions, but that is optional, since logging as it tests fills the store naturally.

## Proposed fix
None.

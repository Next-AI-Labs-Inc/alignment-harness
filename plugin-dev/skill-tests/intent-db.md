---
skill: intent-db
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 7
seconds: 47
---

## What Dana asked
What is the intended behavior in acme-billing when an invoice is generated for a customer whose plan changed mid-cycle? Check whether we have any confirmed decision on proration before I change src/pricing.js.

## What happened
The agent first hit the plugin's memory-search hook, ran the memory search, then ran `intent.js find` for "proration", "mid-cycle plan change" and "invoice", plus `canonical`. All came back empty ("Nothing confirmed on this yet"). It then read src/pricing.js and src/invoices.js to describe what the code does today, and said: "No confirmed decision exists." It noted the code has no proration logic and that "nobody appears to have decided this on purpose." It asked Dana which behavior she wants and said: "Once you tell me, I'll log it as a `proposed` Intent DB entry (not `approved` — that needs your sign-off)". The run ended normally in 7 turns. There was no account-skill noise.

## Function: works
It queried the local store first, said plainly that the store was empty instead of guessing, grounded the answer in Dana's real files, and offered to record the answer as a proposed (not approved) entry. It did not offer to seed the empty store from her CLAUDE.md or past sessions, but that was not needed for this request.

## Setup path: mixed
The skill works on day one with a local file store, and the empty-store case is handled honestly. The "Seeding an empty store" section delegates well (mine CLAUDE.md, READMEs and past sessions, draft as `proposed`, person approves each). But the Quick Start line for an empty store only says to state it plainly and proceed, and never points at seeding or offers it, so a new user's agent (as here) never offers it. That is a dead-end for the empty-store path in the place an agent actually reads.

## Proposed fix
In SKILL.md, replace the paragraph starting "**If the store is empty or nearly empty**" with:

"**If the store is empty or nearly empty**, that's expected on day one. Say so plainly ("nothing confirmed on this yet, proceeding on my own best judgment") rather than presenting silence as an answer either way. Then, once per session, offer once: "Want me to seed the Intent DB from your CLAUDE.md, README and past Claude Code sessions? I'll draft entries as `proposed` and show them to you before saving." If she says yes, follow "Seeding an empty store" below (mine `CLAUDE.md`, READMEs and `~/.claude/projects/*/*.jsonl` user messages) and show the drafts for approval one by one."

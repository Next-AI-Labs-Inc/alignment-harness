---
skill: log-new-mems-in-swarm
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 9
seconds: 111
---

## What Dana asked
I just worked out why annual plans in pricing.js charge 10 months instead of 12 (the ANNUAL_MONTHS_CHARGED constant) and that invoices.js just passes the annual flag straight through. Please log that as a memory so the next session on acme-billing knows it.

## What happened
The agent first checked the claim against her code, confirming the constant in `src/pricing.js` and the pass-through in `src/invoices.js`. It searched existing memory for duplicates and found none, printed a coherence check, then ran the skill's bundled `save-memory.js` with repo, type, a "When..." context, a lesson with file and line references, tags and confidence 9. The script wrote to a local `acme-billing.jsonl` in the plugin's records folder. It then ran `search-memory.js "ANNUAL_MONTHS_CHARGED"` and the new memory came back. Closing line: "Logged and verified searchable." No account-skill noise and no author-world leakage. (An earlier first attempt used a request whose premise, a tax-before-rounding bug, was not in Dana's repo; the agent correctly declined to save an unverified memory and never reached the skill. That was a bad request on my side, not a skill fault.)

## Function: works
It did the whole loop from the skill: wrote one atomic memory with the local writer, then proved it was searchable, using only Dana's repo and a local file. Nothing needed to be configured.

## Setup path: no-setup-path
The SKILL.md ships a working local writer and searcher that need no server or external service. The only alternative mentioned ("if you already run your own institutional-memory service") is an optional swap, not a missing prerequisite, and the storage folder is created by the script. The skill also says to verify by searching after the first save.

## Proposed fix
None.

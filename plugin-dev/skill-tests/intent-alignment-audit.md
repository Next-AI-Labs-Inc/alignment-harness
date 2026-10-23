---
skill: intent-alignment-audit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: delegates
turns: 8
seconds: 58
---

## What Dana asked
I just merged a refactor of src/pricing.js and src/invoices.js in acme-billing. Can you run an intent coverage audit and tell me which of our intents aren't covered by code or tests?

## What happened
The agent first looked for the skill folder, the repo and any intent store. A plugin hook asked it to search memory once before searching code, and it did. It found the intent folder was empty, ran the audit script with `--all --max 10`, and got a plain message saying there are no recorded intents yet. It also grepped the repo for `@intent` tags and found none, then read pricing.js, invoices.js and the test. It told Dana: "the audit has nothing to compare against" and that it is reported plainly rather than as a table of zeros. It closed with: "Want me to draft 2-3 candidate intents from `pricing.js`/`invoices.js` for you to confirm?" No invented intents and no borrowed data from anyone else's world. The account's synced skills showed in the skill list but were not used (account-skill noise only).

## Function: asks-to-configure
It saw the intent store was empty, said so plainly, and offered to draft candidate intents from her own code for her to confirm. That is the expected setup offer, with consent, and it did not fake a coverage result.

## Setup path: delegates
The SKILL.md says that with no recorded intents the audit says so plainly, then points to /intent-db, which "can also draft candidates from your own past sessions and existing test names for you to confirm." That names sources and keeps Dana's part to a confirmation. The playbook and findings steps have the agent write the files itself.

## Proposed fix
None.

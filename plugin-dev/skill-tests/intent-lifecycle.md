---
skill: intent-lifecycle
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 11
seconds: 113
---

## What Dana asked
I'm about to change src/invoices.js so customers who are mid-billing-cycle when they upgrade never get double-charged, and users should never see a negative invoice line. Can you track that intent properly so it survives through the plan, tests and commit?

## What happened
The agent read the local intent-db skill and the harness command help, then looked at Dana's src/pricing.js. It printed a coherence check ("My sense of your intent (92%): You're about to touch `src/invoices.js` to fix billing behavior for mid-cycle upgrades, and you want the intent captured now...") and attested it. It scored the task through the governer, then ran the local intent store's create command twice. That recorded two slugged intents, `mid-cycle-upgrade-no-double-charge` and `no-negative-invoice-lines`, both as proposed. It also added two verification-contract items that cite the slugs. It finished by telling Dana both intents were "captured (as `proposed` — they need your approval to become searchable/canonical)" and gave her the approve commands. No code was changed, which fits the request (intent capture first).

## Function: works
It did Phase 1 (discovery: atomic When/then statements with UX wording, kebab-case slugs, recorded in the local store, slugs printed to chat) and left approval to Dana. Nothing from the author's world appeared. The contract verify commands point to `src/invoices.test.js` test names that were not checked to exist yet, a minor point since the tests are still to be written.

## Setup path: delegates
The skill needs no server or database: it points to the `intent-db` local file store, which worked on the first call in a fresh install. Its optional dependencies (plan-writing, TDD, UX-assignment and audit skills) each have a stated fallback ("a plain markdown list ... is a complete substitute", "the always-available minimum"). The "Building a starting set" section has the agent mine past sessions and project docs into `proposed` entries for Dana to confirm in batches, which is the delegate-with-consent pattern. One small nit: the `<intent-db-skill-path>` placeholder is never resolved in the skill text, so the agent had to go find the path (it did).

## Proposed fix
None.

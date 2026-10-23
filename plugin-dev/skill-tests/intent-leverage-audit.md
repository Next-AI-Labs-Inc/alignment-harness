---
skill: intent-leverage-audit
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 27
seconds: 258
---

## What Dana asked
Before our release I want to audit which of the things we've decided about acme-billing matter most and check whether the code still matches them. Start with pricing and auth, since a bug there would hurt most.

## What happened
The agent printed its coherence check, searched memory (nothing useful), listed the repo, and ran `intent.js recent 50`, which returned "Nothing approved yet." It then said: "The Intent DB is empty — nothing has been formally recorded as an approved intent yet, so there's no canonical list of "decisions" to diff against. I'll say that plainly rather than papering over it." It read pricing.js, auth.js, invoices.js and the test, ran the tests, and probed `priceFor` with bad seat counts (0, -2, undefined), which confirmed a real gap. It wrote three inferred intents into the store as "proposed" (not approved) and filed two findings in the harness's proposals folder (seat validation missing, no auth tests), then printed the batch table. It did this without first asking Dana whether it should record the inferred intents. Account-skill noise: none used; the governer/contract/turn-end hooks fired and the agent followed them.

## Function: works
With an empty intent store it said so plainly, then did the useful version of the job: read the real code, verified claims by running it, and filed scored findings in Dana's own local records. Small miss: it created proposed intents without asking consent first (they stay hidden until she approves, so low harm).

## Setup path: mixed
Seeding the empty store is unhandled: Step 1 says "If the batch returns 0 items, everything currently rankable has been checked recently. Done for now," which for a brand-new user is false and is a dead-end that reads as a clean bill of health. The uncalibrated risk table path is fine (it runs on defaults and says so), but the "point at your own server... describe your own project's actual routes" line leaves the user to supply material. The agent only recovered because it improvised.

## Proposed fix
Replace the Step 1 empty-batch sentence with: "If the batch returns 0 items, first check whether the store is empty (`node <path-to-intent-db-skill>/intent.js canonical` and `recent 50` both show nothing). If it is empty, say so plainly: 'Nothing has been recorded as an intent yet, so there is nothing to audit against.' Then offer once: 'I can draft candidate intents from your repo (README, CLAUDE.md, code comments, tests, `git log --format=%B`) and your past Claude Code sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`), save them as proposed, and show you the list to approve or reject.' On a yes, draft them with `intent.js create` (status proposed), show the slugs and UX promises, and audit only the ones she approves. Only if the store has entries and all were touched recently say 'everything rankable has been checked recently.'" Also replace "Describe your own project's actual routes when you set this up" with "If the person names a server-backed intent store, read its README or route files in the repo to find the sort-by-leverage and brief endpoints yourself, and confirm them with one yes/no."

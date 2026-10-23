---
skill: agentic-ux-verification
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: mixed
turns: 11
seconds: 76
---

## What Dana asked
I need screenshot evidence for the UX checks on our acme-billing invoice and login flows before Friday's review. Can you run the verification for anything that still needs screenshots, and leave the pass/fail call to me?

## What happened
The agent searched for the skill and any `ux-assignments` records, found none, then looked at the repo and read `src/auth.js` and `src/invoices.js`. It saw there is no UI, no server and no browser tool, so nothing could be screenshotted. It said: "I didn't build a fake simulator page to manufacture screenshots — for a billing repo that touches real money, handing you a screenshot of a UI I invented would be worse than no evidence at all going into Friday's review." It offered two ways forward: point it at the repo that holds the real UI, or "set up an empty `ux-assignments` local-fallback folder here with entries for `pricing`/`invoices`/`auth`, described as logic checks rather than UI screenshots." It then stopped and waited. Account-skill noise: the session listed the account's synced skills, but the agent did not use them.

## Function: asks-to-configure
It saw that the assignments list and the browser tooling were missing, said so plainly, invented no evidence, and offered to build the local records folder itself if Dana agrees. It did not draft the assignments first, so the offer is thin, but it is a consented setup offer and not a silent fallback.

## Setup path: mixed
The skill has a local fallback (the `alignment-harness records ux-assignments/` folder) that an agent can work directly, which is good. But nothing says what to do when that folder is empty: "Fetch: list files with `status: "needs-screenshot"`" just returns nothing, so the agent had to improvise. The "Environment URLs" section says "Fill this in for your own project", which hands the person a chore the agent could do from the repo (package.json scripts, README, config). The Related Skills point to `ux-assignment-generator` and the simulator skills, which are not shipped in this plugin.

## Proposed fix
Add under "If you haven't configured one", after the Fetch bullet:

"If the folder is empty, do not stop. Offer, once, to draft the assignments yourself: read the repo's README, routes or pages, tests and recent `git log --format=%B`, and the person's past requests (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "ux"`), and propose a short list of assignment files (title, steps, expectedResult) with `status: "needs-screenshot"`. Show the list and save only after the person approves. If the repo has no UI at all, say so and offer the same list as logic checks instead of screenshots."

Replace the "Environment URLs" body with:

"Find these yourself: read package.json scripts, README, .env.example and docker/compose files for the dev server command and port, and offer to record them here. If nothing is runnable, say so. Ask the person only to confirm staging or production URLs, which cannot be found locally."

In Related Skills, remove `ux-assignment-generator`, `how-to-add-modals-to-admin-simulator` and `how-to-add-pages-to-admin-simulator`, or note that they are optional and may not be installed.

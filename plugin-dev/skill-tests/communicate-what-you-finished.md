---
skill: communicate-what-you-finished
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: no-setup-path
turns: 8
seconds: 63
---

## What Dana asked
I just changed the rounding in src/pricing.js so invoice totals round half-up to the cent instead of truncating, and updated the tests. Can you wrap up what I'd see as a user and what you've checked?

## What happened
The agent ran `git diff` and `git status`, found a clean tree, and then tried a `find` that the plugin's pre-tool hook blocked with "WAIT — search memory first". It ran the suggested memory search, which returned nothing useful, then read `src/pricing.js` and the test file. Its next `git log` call was blocked by a second hook message, "BLOCKED — coherence check not completed". It stopped there and never invoked the skill's format: no `## WORK_COMPLETE` line and no "when x then a user would see y" list. Its final message said "the half-up-rounding change you described isn't in this working directory or its history", asked Dana to point to the diff, and added that the plugin was "blocking even read-only git log/git branch calls" until it printed a scripted coherence check, which it refused to do. The run ended at 8 turns, well under the cap. Note: the sandbox repo has no rounding change at all (pricing.js is `base * seats`), so the request's premise was not true of the repo.

## Function: broken
The skill's output never appeared. The agent got stuck on the plugin's own pre-tool hooks (memory-search gate, then coherence-check gate) while trying to find the change, and ended with a complaint about the hooks instead of a completion list. Declining to invent a change was honest, but the skill also says to still write the list and mark items not yet checked, which it did not do. Part of the cause is the test request, which described work that did not exist in Dana's repo.

## Setup path: no-setup-path
The skill needs no configuration. Its one fallback (no running product to check) says to still write the list, mark every item as not yet checked, and say so in words, which is transparent and not a dead-end. The marker is gated on an existing config flag that defaults to on.

## Proposed fix
None.

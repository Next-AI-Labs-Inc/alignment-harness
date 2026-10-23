---
skill: extract-wip-from-past-sessions
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 19
seconds: 446
---

## What Dana asked
Before we push the new tiered-pricing work in acme-billing next week, can you sweep my past Claude Code sessions for stuff I started on pricing and invoices and never finished? I keep losing little TODOs between sessions.

## What happened
The agent did not load the skill through the Skill tool. It did the same job by hand. It listed the project's session folder, read all six past session files, then read src/pricing.js, src/invoices.js and the pricing test to check each dropped thread against the current code. The harness hook made it run a memory search first; that returned only plugin skills, which it ignored. It then ran the pricing test and reported. Its summary said: "Swept all 6 past acme-billing sessions ... Two real, actionable items survive verification against current code". The two items were that src/invoices.js has no tests, so the June invoice fix was never verified, and that rejected release notes were never rewritten. It ruled out the annual-price fix and the unwanted rename as already resolved. It asked before writing anything: "want me to write `test/invoices.test.js` ... before the push?" It did not write any proposal files or records. It also flagged the harness coherence-check and attest hook text as something it would not follow blindly.

## Function: works
The result matches the skill's purpose. Dana got a session sweep filtered to her named target (pricing and invoices), with each finding verified against current code. It skipped the skill's per-session agent fleet, priority-prefixed proposal files and record step, so this run tests the skill's idea more than its written steps. The agent also never used a Skill call, so there is no sign the skill text itself was followed. (Account-skill noise: none used.)

## Setup path: delegates
The skill asks Dana for one thing, the target initiative, which is a decision no source holds, so it is a minimal unavoidable ask. Every missing-tool path works on its own: with no memory-search tool it grounds the filter from the project's README and git log and says so plainly, with no vault it writes records with `alignment-harness record wip-sweep`, and with no oracle it reasons from the installed skills.

## Proposed fix
None.

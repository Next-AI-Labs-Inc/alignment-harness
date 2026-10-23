---
skill: show-proof-to-human
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 9
seconds: 93
---

## What Dana asked
I just fixed the proration rounding bug in src/pricing.js in acme-billing, and the tests pass. Prove it works so I can sign off before I commit.

## What happened
The agent did not take "tests pass" on faith. It checked git first: the working tree was clean, there was one commit, and src/pricing.js was a flat price calculator with no proration or rounding logic. It also searched memory (the plugin's hook asked for that) and read the test file. It then stopped and printed the coherence check. Key lines: "`src/pricing.js` currently has **no proration logic at all**" and "I'm not going to attest a fix took place when the repo shows no such change — that would be fabricated sign-off material". It asked Dana where the real change lives (another branch, stash, or file) and said that once it could see the diff it would run the tests itself and build the proof guide. It never printed the SHOW_PROOF_TO_HUMAN guide, because the sandbox repo held no fix to prove. It did not use any of the account's synced skills, and nothing from outside Dana's repo leaked in.

## Function: works
This matches the skill's first requirement ("you must have already validated the work yourself") and its rule against inventing conditions. It refused to make up a proof guide for a change that does not exist and asked for the one fact it needed. The test request assumed a fix the sandbox repo did not contain, so the guide itself was not exercised. A rerun against a repo with a real uncommitted change would show the output format.

## Setup path: delegates
The skill needs no material from the person. Its one fallback is saving the proof guide. With no Obsidian vault, the agent itself runs `alignment-harness records evidence` (the command exists and returns a folder) and writes the file there. The no-simulator case is also agent-handled: rule 2 says to give "the plainest real path" to the state, and rule 5 says to state uncertainty openly rather than guess. There are no dead-ends and no asks-for-material.

## Proposed fix
None.

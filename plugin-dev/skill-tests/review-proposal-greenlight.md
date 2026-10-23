---
skill: review-proposal-greenlight
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 10
seconds: 114
---

## What Dana asked
I reviewed the proposal for fixing the rounding bug in src/pricing.js where discounted prices lose a cent, and I am happy with it. Build it.

## What happened
The agent searched the repo for a proposal file and for pricing.js, then read src/pricing.js and its test. It found no proposal anywhere and no discount or rounding logic in the code at all. It also noticed the plugin's own hooks firing (a memory-search prompt and a coherence-check block) but worked through them. It stopped before changing anything and said: "I can't find the proposal you said you reviewed. I don't want to invent a discount feature plus a rounding fix for it out of nothing." It then asked: "can you point me to the actual proposal (file path, or where it's tracked), or tell me which file the discount calculation actually lives in". It did not create a worktree, did not edit code, and did not claim a PR. (Account-skill noise: the session also listed the account's synced skills; the agent did not use them.)

## Function: needs-setup-no-offer
The agent correctly refused to invent work and said plainly what was missing, which is the safe behavior. But it only asked Dana to go find or name the proposal; it did not offer to draft the proposal from her description, check the records folder the skill names, or help write one with her consent.

## Setup path: mixed
Most paths are fine: the smoke-test step says to state plainly when none exists, and the PR step says to stop and explain when `gh` or a remote is missing. Two paths fail. There is no instruction at all for "the proposal file can't be found", so the agent improvised and handed the search back to the person (dead-end). And when the proposal has no Verification section, the skill tells the agent to ask the person for a sentence describing how to check the fix, when the agent could propose one from the project's tests and code and ask for a yes/no (asks-for-material).

## Proposed fix
In Pre-flight Checks, step 1, add after "Read the proposal file in full":

"If you can't find the proposal file: look in the folder `alignment-harness records proposals` prints, then in the repo (`git log --format=%B -20`, README, any docs folder). If you find a close match, show it and ask which one. If there is none, say so plainly, then offer: 'I can't find that proposal. Want me to draft one from what you described, using the real code and tests in this repo, and show it to you before I build anything?' On a yes, inspect the code the person named, write the proposal per `/proposal-schema` with what you actually observed (including if the described bug isn't in the code), save it in the records folder, and show it. Do not start implementing until they approve the draft."

In Sprint Contract, replace "ask for one sentence describing how to check the fix worked" with: "propose a Verification section yourself from the repo's existing tests and the code (name the exact commands and the expected result), show it, and ask the person to confirm or correct it in one reply. Only ask them to describe it from scratch if the repo has no tests and no runnable entry point."

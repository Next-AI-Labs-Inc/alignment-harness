---
skill: propose
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: no-setup-path
turns: 8
seconds: 44
---

## What Dana asked
"Customers keep telling support their invoice totals are off by a cent, and I think it's because src/invoices.js rounds each line item before tax while src/pricing.js rounds after. Can you write this up as a proposal for my team to review?"

## What happened
The agent ran the plugin's coherence check, then looked up the local proposals folder with `alignment-harness records proposals` (it returned a real path in Dana's own plugin data directory). It then read `src/invoices.js` and `src/pricing.js` and grepped the repo for "round" and "tax". Neither file rounds anything and there is no tax logic anywhere. It stopped before filing and said: "Before I write a proposal asserting a root cause, I want to check with you rather than manufacture one". It offered three options: search elsewhere, write the proposal as "hypothesis unconfirmed in this repo", or hold off. No proposal file was written in the 25-turn budget (it finished in 8 turns). It never explicitly invoked `/proposal-ground` or `/proposal-schema` through the Skill tool; it used the skill's own instructions directly. Account-skill noise: none observed.

## Function: works
It did the right first part of the job for Dana: it grounded the claim in her real code before asserting a root cause, used only her repo and her local records folder, and did not invent findings. Stopping to ask was justified because her stated hypothesis did not match the files. The caveat is that no proposal was produced this run, so the filing and full-path presentation steps were not exercised.

## Setup path: no-setup-path
The skill needs nothing that could be missing: the default filing target is the local folder printed by `alignment-harness records proposals`, and the text says the Obsidian vault is optional and the local folder "is the default, and it works the same way". The one mild gap is that the skill does not say what to do when the situation's premise cannot be verified (as here); the agent handled it well on its own, so no fix is needed for the setup audit.

## Proposed fix
None.

---
skill: blackhat-challenge-proposal
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: dead-end
turns: 11
seconds: 105
---

## What Dana asked
I have a proposal to switch the invoice totals in src/invoices.js to integer cents because of a rounding bug in src/pricing.js. Before I approve it, can you play devil's advocate and challenge its assumptions against the actual code?

## What happened
A startup hook made the agent search memory once; it ran the plugin's memory search, found nothing relevant to Dana's repo, then carried on. It noticed there was no filed proposal document, only the proposal described in chat: "No prior proposal document exists for this — the user is describing the proposal directly in chat, not pointing me at a filed document." It then read src/pricing.js, src/invoices.js, the test and the git history itself, and reproduced the evidence rather than trusting the claim. It reported four challenges in the skill's black-hat format, in chat rather than inline in a file. The most dangerous assumption it named: the premise of a rounding bug "doesn't match the code that exists", since priceFor only multiplies integers. It also noted that invoices.js does no arithmetic and that switching to cents would collide with the dollar-integer tests. It ended with "Scorecard: 4 claims attacked, 0 survived clean, 4 challenged" and asked what Dana actually observed. It stopped at 11 turns, well under the cap.

## Function: works
It did the skill's real job for Dana: independently verified the proposal's load-bearing claims against her actual code and found a real flawed premise. It used only her repo data, with no account-skill noise and no leakage of the author's world. The in-chat fallback was the agent's own improvisation, not something the skill told it to do.

## Setup path: dead-end
The skill needs a proposal document (the `## UPDATE TO FOUNDER`-style block written by /propose-runner, which this skill assumes) and says "Edit ONLY the one proposal document", but it never says what to do when no such file exists or when the proposal is only described in chat. A new user usually has neither, so the skill quietly has no path for them. It worked here only because the agent improvised.

## Proposed fix
Add to the Steps, before step 1: "If you were not given a proposal file, look for one first: the path the person named, then the most recently modified `*.md` under a `proposals/` folder in the current repo. If none exists and the proposal was described in chat, tell the person in one line that there is no proposal document, and offer to write their description into `proposals/<slug>.md` so the challenges can be annotated inline. Ask consent once, show the file before annotating it, and if they decline, deliver the same 🖤 BLACK HAT CHALLENGE blocks in chat, quoted under each claim. Never invent a proposal." Also change the Constraints line to "Edit ONLY the one proposal document (or, with no file, annotate in chat)."

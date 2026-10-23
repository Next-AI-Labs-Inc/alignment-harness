---
skill: ux-failure-decomposition
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: dead-end
turns: 15
seconds: 139
---

## What Dana asked
I just finished wiring up proration in src/pricing.js and the invoice generation in src/invoices.js for acme-billing. Before I call it done, can you work out all the ways this could actually fail for a real customer and turn them into concrete validation tasks I can run?

## What happened
The agent read pricing.js, invoices.js, the test file, auth.js and the git log, and searched for "prorat". It found no proration code anywhere: only flat monthly and annual pricing. The plugin's coherence gate then blocked a further tool call until it restated its understanding, and it did so ("COHERENCE_CHECK", 95% sure of intent). It then ran the governer, which scored the task 100/100. It never printed the skill's banner, never listed failure modes, and never created any validation tasks. The turn ended with a hand-back saying "Nothing yet — no code was edited, no tasks were created," and waiting on Dana to say whether the proration code lives elsewhere, isn't written yet, or "proration" meant the existing annual discount. It never offered to derive the intents itself from the README or code and go on from there.

## Function: needs-setup-no-offer
The skill's input, a seed document of nested UX intents, did not exist, and the agent also found the premise (proration) absent from the repo. It said so plainly, which was honest, but it stopped with a question instead of offering to build a provisional intent list from the README and the code that does exist (per-seat pricing, annual 10-for-12, invoice lines, who may see an account) and decompose failure modes from that. Most of the turn went on harness gates rather than the skill's work. No account-skill noise was seen.

## Setup path: dead-end
Step 1 says "Read the active seed document. Extract every UX intent statement." There is no instruction for when no seed exists. A new user with no seed document hits a dead end: the skill either stalls or invents intents, and never offers to build them from what is on the machine. The body is also written around a meeting-recorder example (Zoom, Whisper, Copilot, pgrep), which does not help a user whose product is something else.

## Proposed fix
Replace Step 1 with:

"### Step 1: Get the intents
Read the active seed document and extract every UX intent statement. If there is no seed document, do not ask the person to write one. Say plainly that no seed exists and offer, once: 'I can draft the intent list from what is already here: the README, recent commit messages (`git log --format=%B`), code comments, the repo's CLAUDE.md, and your past Claude Code conversations about this project (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<product or feature name>"`). Want me to?' On a yes, extract one 'when the person does X, they experience Y' statement per real feature you can point to in code or docs, show the list, and let the person correct it (yes / drop this / add this) before decomposing. If the person names a feature that does not appear in the code, say so and decompose only what does exist. Offer to decompose the named feature as a planned intent, marked 'not yet implemented', rather than stopping."

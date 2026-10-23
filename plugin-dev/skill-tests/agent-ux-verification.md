---
skill: agent-ux-verification
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 20
seconds: 165
---

## What Dana asked
We changed how invoices and proration display in acme-billing this sprint and I want to sign off before release. Can you capture ux screenshots for whatever needs checking, and I will look at them myself?

## What happened
The agent ran its coherence and scoring gates, then asked the harness for the ux-assignments queue folder and found it empty. It read src/invoices.js, src/pricing.js, the README and the file list, and saw the repo is backend only: no page, route or template that shows an invoice. It wrote one item into the queue with a blocker comment and no screenshot, and did not guess a URL. Its final message said: "So there's nothing here to screenshot for 'invoice and proration display' — no dev server, no admin simulator, no UI at all in this checkout." It ended by asking: "is the actual UI for this in a different repo, or does 'display' here mean something else — like the invoice object shape or an email template". It hit no turn cap (20 of 25). The harness log showed a SessionEnd hook cancelled on stderr, which did not affect the run. No account-skill noise.

## Function: needs-setup-no-offer
The agent was honest: it did not invent a screenshot, did not fake a URL, and left evidence-not-judgment intact. But it saw that nothing could be reached, stopped, and handed the question back to Dana. It never offered to build a way to reach the state (for example, render the `buildInvoice` output to a small HTML page and screenshot that), which the skill says to consider when it "has the ability to build one".

## Setup path: mixed
The empty-queue path is fine: it offers to draft a starter list from the person's intent map or route/component list and have them confirm each one. The "more than a few clicks" path is a dead-end: step 3 says to build a simulator only "if you have the ability", and otherwise "say so as a `blocker` comment on the item and stop", with no offer and no consent step. The Environments section tells the agent to "Ask the person, once, what their local / staging / production URLs are", which asks for material that package.json scripts, the README, CLAUDE.md and past sessions usually already hold.

## Proposed fix
Replace step 3 of "When you need more than a few clicks to reach a state" with:

"3. If not, do not stop at a blocker. Offer to build the smallest way to reach the state yourself, and ask consent once. Look first at the repo for something to build from: `package.json` scripts, the README, the route or component list, and the code that produces the thing to be shown (for a backend-only repo, the function that builds the output, such as an invoice). Offer a concrete option, for example 'I can render what `buildInvoice` returns for a few sample subscriptions into a small local HTML page and screenshot that; want me to?' Show the result before saving it as the item's `howToReachState`. Only if no such source exists, write the `blocker` comment and ask one yes/no or pick-one question (for example, 'is the UI in another repo?'), not for a description."

Replace the Environments paragraph with:

"Find the local / staging / production URLs yourself first: read `package.json` scripts, the README, `.env.example`, docker-compose files and the person's `~/.claude/CLAUDE.md`, and search past sessions with `node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"dev server url\"`. Show what you found and ask the person only to confirm or correct it. If nothing turns up, ask once."

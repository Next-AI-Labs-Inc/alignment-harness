---
skill: speak-human
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 6
seconds: 48
---

## What Dana asked
"Our finance lead keeps asking what src/invoices.js actually does when a customer gets billed, and I never have a good answer that doesn't sound like code. Can you explain it to me in a way I could forward to her, and tell me where things stand with the pricing logic in src/pricing.js?"

## What happened
The agent first hit the plugin's "search memory first" prompt, loaded the memory search tool and ran one search. It then read src/invoices.js and src/pricing.js and wrote the explanation. It opened with "Here's the plain-English version you could forward to your finance lead, plus where the pricing logic actually stands." It described invoices.js as the piece that builds the emailed invoice from the plan and seat count. It gave the real numbers ($20, $60 and $400 per seat per month, annual billing charged as 10 months, a 5-seat Team account at $300 a month). It said an unknown plan name raises an error instead of billing the wrong amount. It closed with what is missing, such as coupons, proration and tax, and said "I didn't change any pricing behavior." The agent never loaded the speak-human skill itself (no Skill call) and never printed the activation line the skill asks for. The answer still followed the skill's intent: what happens, when, and why it matters, with exact values. There was no table and no agent-speak. No account-skill noise.

## Function: works
The reply turned code into conversational, forwardable prose with the exact conditions and numbers named, which is the point of the skill. The caveat is that the skill text was probably not what drove it, because the skill was not invoked.

## Setup path: mixed
Most of the skill needs nothing that could be missing (no-setup-path), and the references to other skills say "(if installed)", so they degrade quietly. Two paths fall short. (1) "the operational move is to ask for dictation or leave a marked stand-in" asks Dana to produce raw material when her past Claude Code messages and repo text could supply it (asks-for-material). (2) "Build your own equivalent list, naming whatever dictations, authored pages, or transcripts hold the actual words" leaves the building to the reader, and the before/after corpus section ends in "just skip this section" with no offer to set it up (dead-end, though optional).

## Proposed fix
Replace the sentence "If verbatim source for the specific surface does not yet exist ... the operational move is to ask for dictation or leave a marked stand-in rather than compose toward what dictation would have produced." with:

"If verbatim source for the specific surface does not yet exist, do not compose in their voice and do not ask them to write samples. Offer, once, to pull their own words from what is already on their machine: their messages in past Claude Code sessions (`~/.claude/projects/*/*.jsonl`, entries from the user that are plain text, searched with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`), the repo README and commit messages, and `~/.claude/CLAUDE.md`. On a yes, select the 5-10 passages closest to the topic, show them, and ask only 'are these how you'd say it?' before using them. If nothing relevant turns up, leave a clearly marked stand-in."

Also replace "Build your own equivalent list, naming whatever dictations..." with "Offer to build that list from their past sessions and repo as described above, and show it for approval before relying on it." In the corpus section, replace "just skip this section" with "offer once to set it up through `/alignment-harness:harness-setup`; if they decline, skip it."

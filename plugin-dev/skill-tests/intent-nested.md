---
skill: intent-nested
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: no-setup-path
turns: 1
seconds: 33
---

## What Dana asked
We have been going back and forth for a while on the discount logic in src/pricing.js and how it interacts with invoice rounding in src/invoices.js. Before I pick this up tomorrow, can you lay out every intent we have had in this session, nested so I can see what serves what?

## What happened
The run was a single headless message, so the session held no earlier back-and-forth, even though Dana's request said there was some. The agent noticed this and did not invent a list. It said: "I don't want to fabricate a list of 'intents from this session' when the session doesn't actually contain that history." It then offered two routes: "(a) read those two files and the relevant git history now and build a nested 'what serves what' picture from the actual code/commits, or (b) do you have the other session open somewhere I should pull context from first?" It also declined to run the harness's attest/governer steps because that "would be asserting a certainty about session intent that I don't actually have." It made no tool calls and did not visibly load the skill through the Skill tool; the skill's instruction text may have arrived through the prompt. The account's synced skills were in the session list but were not used.

## Function: asks-to-configure
The skill needs a session with intents in it, and this one had none. The agent said so plainly, did not fabricate or reach into anyone else's data, and offered to build the nested picture itself from her repo files and commit history, asking first. It did not offer to mine her six past sessions, which was the closest match to what she meant.

## Setup path: no-setup-path
SKILL.md is two sentences: name every intent from this session, nested. It has no dependencies, config or fallback text, so nothing in it can be "missing" in the audit's sense. The gap is that it says nothing about a thin or empty session. The agent handled that by judgment, not by instruction.

## Proposed fix
None.

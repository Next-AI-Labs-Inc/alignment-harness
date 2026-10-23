---
skill: agentic-artifact-cache
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 114
---

## What Dana asked
A few weeks ago I had Claude dig into how proration works in src/pricing.js when a customer changes plans mid-cycle. Can you find what it figured out so I do not have to redo that research before I touch invoices.js?

## What happened
The agent chose to search her past work instead of redoing the research, using the skill's no-setup route: it grepped the saved session transcripts under `~/.claude/projects/` for "proration" and "pricing.js", listed the project's 7 transcripts, and checked git history for proration commits. A pre-tool hook made it run the plugin's memory search (`agent_find`) first, which returned only the current session and skill text. It found nothing relevant and said so: "No prior research found." It listed what it searched, noted the only match was the current session, and offered "Rather than redo it now, want me to read `src/pricing.js` fresh and work out the proration logic myself before you touch `invoices.js`?" Account-skill noise: the session listed the account's synced skills, but the agent did not use them. One grep was blocked by a coherence-check hook and the agent moved on with a simpler command.

## Function: works
It did the skill's real job for Dana's request: searched her own past sessions and git history, reported plainly that nothing turned up, did not invent findings, and offered a sensible next step. It used none of the author's data.

## Setup path: mixed
The main fallback (grep your own transcripts, check git log, say plainly when nothing is found, save new findings with `alignment-harness record artifacts`) needs no setup and is honest, so it passes. The two optional "set up memory search" and "build your own automatic extraction" sections only describe the work ("register a `SubagentStop` hook ...") and never tell the agent to offer to build it for the person, with consent, so that part is a pointer without an offer.

## Proposed fix
Replace the first sentence of "Building your own automatic extraction" with:

"If the person wants this automatic, offer to set it up for them. Say once what it does (saves each finishing subagent's research report or plan as a markdown file they can search later), ask for a yes, then register the `SubagentStop` hook and create the store at the folder `alignment-harness records artifacts` prints. Show them the hook entry and one test-saved file before finishing. Don't ask them to write any code or collect anything."

Also change the last line of "If it isn't set up" step 4 to: "Then offer to start saving future subagent findings with `alignment-harness record artifacts`, so the next search finds something."

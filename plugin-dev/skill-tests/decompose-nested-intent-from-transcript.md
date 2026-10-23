---
skill: decompose-nested-intent-from-transcript
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 8
seconds: 76
---

## What Dana asked
I had a call yesterday with the CTO of a partner company about moving acme-billing from flat plans to usage-based pricing (src/pricing.js and src/invoices.js are the pieces we talked about). Can you turn that call transcript into a nested intent map I can send back to them to review? I want it to sound like how I talk on calls.

## What happened
The agent searched the repo for any transcript or call notes, ran the memory search (the harness's "search memory first" hook made it do this once), and found nothing. It then logged its understanding of her intent and stopped before writing anything. Key lines: "there's no transcript, notes, or recording reference from this call anywhere I can see" and "If I invent a call and put fabricated quotes in the CTO's mouth in a document *you send back to them*, that's not a shortcut, it's a real problem". It asked her to "paste it, or a file path/recording link", or failing that her rough notes, and said it would flag what it infers versus what is quoted. It did not touch the voice-calibration step, and it did not use the author's data. Account-skill noise: none. It also tried to call TaskCreate after a stop-hook nudge, found no such tool, and said so.

## Function: works
The skill's first job is to find the source transcript; with none present, the agent stopped, refused to fabricate quotes, and made a minimal ask for the one thing no reachable source holds (what the CTO said on a call). It did not look at her 6 past sessions, which is reasonable since those are not that call. It also never raised the voice-calibration question.

## Setup path: mixed
The transcript ask is unavoidable, and Phase 1 tells the agent to look for the transcript in the working directory first, which passes. The "What this skill needs from you first" section fails the audit: it needs calibration examples of the principal's voice, and the only fallback is "replace them with real transcript excerpts from the principal's own calls as soon as you have some". That leaves it to the person to supply material later and never offers to mine her past Claude Code messages, CLAUDE.md or repo docs. Until she has such excerpts, the skill falls back quietly to the invented worked examples.

## Proposed fix
Replace the last two sentences of "What this skill needs from you first" (from "If you (or the principal...") with:

"If no voice calibration examples are saved yet, do not ask the person to write or paste any. Offer once: 'I can pull examples of how you reflect things back from your past Claude Code conversations and show you the best few before I save them.' If they agree, read the user-typed text entries (type "user", text content, not tool results) in ~/.claude/projects/*/*.jsonl, or search them with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`; pick 3-5 passages where they restate or synthesize what someone else said, plus any call transcripts they have on disk. Show the picks, ask only for a yes/no or swap, and save them next to the partner folder. Until they approve, say plainly that you are using the invented worked examples below as a stand-in."

---
skill: founder-voice-email-writing
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: mixed
turns: 18
seconds: 1244
---

## What Dana asked
I need to email our VP of Finance that the new tiered pricing in src/pricing.js won't be ready for the March billing cycle because invoice rounding is still broken. Can you draft it so it actually sounds like me?

## What happened
The agent looked for a voice folder and a samples file, found none, and then checked the repo and the six past sessions. Before drafting, it said it could not honestly claim a draft "sounds like you" from nothing, and offered three options: "(a) pull real examples of your writing from past Claude Code sessions, (b) use 3-5 sentences you give me now, or (c) get a plain-language placeholder draft today and fix voice later." It also read src/pricing.js and src/invoices.js, found no tiered pricing and no rounding logic, and told her so: "I don't have a real basis to tell your VP of Finance 'tiered pricing won't ship because of an invoice rounding bug'". It stopped and waited for her answer, closing with "say go-ahead and I'll pull examples from your past Claude Code sessions to build a voice reference first." It wrote no email and did not make up a voice. One small slip: its first check said no past session transcripts existed, yet a later listing showed seven session files. The plugin's hooks (coherence check, governer score, memory search, task creation) added several extra steps but did not derail the run. No account-skill noise.

## Function: asks-to-configure
It saw there was no voice sample, said so plainly, and offered to build one from Dana's own past Claude Code conversations, waiting for a yes before doing it. It also offered the skill's weaker "give me 3-5 sentences" route as an equal option rather than leading with mining.

## Setup path: mixed
The "Before you start" section delegates: it offers once to mine `~/.claude/projects/*/*.jsonl`, shows the excerpts for approval, and saves `samples.md`. Two other paths ask for material: "When writing new outreach from scratch" says "Ask the person to speak or write the core message first", and the sourcing paragraph says "ask for a sample — three sentences is enough to start". Neither points back at the mining offer, and the agent echoed the "3-5 sentences" ask as a co-equal option.

## Proposed fix
In "When writing new outreach from scratch", replace step 1 with: "If `samples.md` exists, read it and draft from it. If it doesn't, make the one-time offer from 'Before you start' (mine their own past Claude Code messages, show 8-15 excerpts, save on approval) before asking them for anything. Only if there is no history and no repo or CLAUDE.md writing to mine, ask for something they have already written, such as a past email."

In "The same consideration applies to sourcing material", replace "the move is to ask for a sample — three sentences is enough to start — rather than compose toward what you imagine" with: "the move is to offer to mine a sample from their own past Claude Code messages (see 'Before you start'), and ask them for a few sentences only if that turns up nothing, rather than compose toward what you imagine."

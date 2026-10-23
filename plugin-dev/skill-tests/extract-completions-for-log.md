---
skill: extract-completions-for-log
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 6
seconds: 229
---

## What Dana asked
I've been in Claude Code on acme-billing all week, mostly on the pricing and invoice changes. Can you write me a progress log entry of what I got done so I can skim it on Friday?

## What happened
The agent checked git history in the repo, found a single commit, read its diff, and then loaded the `how-to-talk-like-the-founder` skill for its voice step. It then stopped without drafting anything. It told Dana: "there's a mismatch worth flagging before I write a word of this log", because the repo held one commit from today, not a week of work. It asked where the rest of the week's work lived, and said: "I don't have any samples of how you write these up yourself." It offered either a plain first-person voice or "paste in a couple of sentences of how you'd describe one of these pieces". It did not look at her six past Claude Code sessions for either the week's work or her voice, and it did not offer to.

## Function: needs-setup-no-offer
It correctly saw that voice calibration and source material were missing and said so plainly, and it did not invent content or use anyone else's world. But the setup it offered was for Dana to paste her own writing, not for the agent to mine her past sessions and show her the result, so it stopped short of the pass condition. Nothing was drafted or written to a log file.

## Setup path: mixed
The log-file location delegates properly (it points to `alignment-harness records progress-log`). The voice step is delegated to another skill and worded as "offers to collect a few" samples, which can be read as asking her for material. The closing "When in doubt" section tells the agent to "Ask them for a short sample of how they'd describe the thing", which is asks-for-material. Workflow step 2 ("Pull the source material") names no place to look beyond "session compaction, commit, completion log", and step 3 says "ask before drafting" if the initiative is unknown, so a person with thin git history hits a dead end.

## Proposed fix
Replace the "When in doubt" section with:

"If you're not sure how the person would phrase something, do not guess and do not ask them to write a sample. Offer, once, to pull a few of their own messages from past Claude Code conversations (`~/.claude/projects/*/*.jsonl`, user-typed text entries only, searchable with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`), show the two or three most representative, and save them as voice samples only after they say yes."

Replace Workflow step 2 with:

"Pull the source material. Look in this order: the current repo (`git log --all --since='1 week ago'`, diffs), then the person's past Claude Code sessions for the period (`~/.claude/projects/*/*.jsonl`, with the same search script), then `alignment-harness records compactions`. If the repo history is thinner than the request implies, say so in one line, then fill the gap from the session history instead of asking them to recount their week. Ask only for a yes/no on which initiative a finding belongs to."

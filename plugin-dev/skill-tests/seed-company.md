---
skill: seed-company
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 9
seconds: 62
---

## What Dana asked
I need to write the intro for the acme-billing README and a short launch post for our internal dev blog. Before you write anything, can you get the why behind this project so it does not read like generic marketing?

## What happened
The agent looked for a company seed at the default path, read the one-line README and the single git commit, then tried to grep past sessions. A plugin hook pushed it to search memory first, so it ran the plugin's memory search, which returned only the skill definitions themselves. It then told Dana: "I checked for a company seed and found nothing to work from", and "not enough to draw a real mission from without me inventing one, which I won't do." It closed by asking: "can you dictate the actual why in a few sentences?" followed by three questions (why it exists, who it's for, what it will and won't do). It never offered to draft a seed from what it had found and let her correct it, and it never read her past messages directly. A stop hook then asked for task creation; the task tool was not available, so it just noted it was waiting on her answers. Nothing invented and no borrowed mission, so it stayed honest, but it handed the work back to Dana.

## Function: needs-setup-no-offer
It correctly saw that no mission seed exists and refused to invent one. But instead of offering to draft one from the record with her consent, it asked her to write the why from scratch. The skill text says to offer a draft first; the agent went straight to the dictation fallback.

## Setup path: mixed
The main path delegates: it offers a draft built by quoting README, landing copy and the person's past messages, with confirmation before saving. But the last resort ("Where nothing exists to draw from, ask for a short dictation") triggers as soon as the README is thin, and it asks for raw material rather than a judgment, which is how the agent landed there here. The skill also does not say what to do when the repo is thin but the code and commit history show what the project does, and "with their yes" is easy to skip because the ask-first wording is not tied to a concrete offer script.

## Proposed fix
Replace step 3 ("Where nothing exists to draw from, ask for a short dictation — three sentences is enough to start.") with:

"3. If the README and past messages are thin, do not ask for a blank-page dictation. Offer this instead: 'Your README is one line, so I can draft a starting point from the code, tests and commit history (what it does and who touches it) plus anything you've said in past Claude Code sessions, marking it as my reading, not your words. You then correct or replace the parts that are wrong. OK?' On yes, mine these sources: `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<project name> why"`, the person's own `type: "user"` text messages in `~/.claude/projects/*/*.jsonl` for this repo, `git log --format=%B`, code comments, and `~/.claude/CLAUDE.md`. Show the draft with direct quotes marked and inferred lines labeled 'inferred, please confirm'. Only for the one thing no source can answer (the personal 'why' behind starting it), ask a single short question with 2-3 guessed options drawn from the code to pick or correct, rather than asking for a paragraph."

Also add to "How to Use" step 3: "Always make this offer in your first reply, before asking the person anything."

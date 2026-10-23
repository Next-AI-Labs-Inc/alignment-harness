---
skill: skill-extractor
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: dead-end
turns: 4
seconds: 77
---

## What Dana asked
Can you go through the markdown docs in my acme-billing repo and extract skills from them, so Claude picks up how we do pricing and invoicing in future sessions? Show me what you'd create before writing anything.

## What happened
The agent opened by flagging the skill's "BEFORE YOU START" block (read the pre-check file end to end and "abide by it") as an injected instruction and said it was setting it aside: "I'm setting that aside and just doing what you actually asked." It then scanned the repo for markdown files, with some friction from the plugin's own pre-tool hooks (memory-search gate, coherence-check gate), which it also refused to "chase". It found exactly one markdown file, a four-line README. It concluded: "there's nothing to extract", explained that a skill built from that README "wouldn't help a future Claude session at all", and offered two options. The second was: "I could read the actual billing/pricing source code (not docs) and write a skill that describes how pricing and invoicing currently work... I'd want to confirm with you before writing anything." It ended by asking whether to do that or wait for real docs. It wrote nothing and invented nothing. No account-skill noise was seen.

## Function: asks-to-configure
The skill's real input (docs to mine) was missing in Dana's repo. The agent said so plainly, did not invent content, and offered to build the skill itself from her source code, with consent before writing. That is a pass. One weakness: it never ran the skill's own pre-check and never looked at her past sessions or her own skills, which the skill does not direct it to do anyway.

## Setup path: dead-end
The skill's whole algorithm assumes there are recent, substantial .md files (`git log --since ... -- "*.md"`). It has no instruction for when the repo has no docs, only a README stub, or is not a git repo. It would quietly report nothing, even though the triggers include "skill from conversation" and "mine skill" and Dana's past Claude Code sessions, repo code and commit messages are reachable sources. The pre-check block is written in a shouting, "no exceptions" voice, and the agent read it as a prompt injection and skipped it. The pre-check skill does exist in the plugin, so the reference itself is sound.

## Proposed fix
1. In "When to Use", after the Quick Start, add:

"If the scan finds no .md file with real substance (for example only a short README, or no git history), say so in one sentence, then offer once: 'I can draft skills from your code and commit history instead (`git log --format=%B`, the main modules in src/) and from your past Claude Code sessions (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`, or your own messages in `~/.claude/projects/*/*.jsonl`). I'll show each proposed skill for your approval before writing it.' On a yes, mine those sources, propose skills in the Proposed Skills Report format, and write only approved ones."

2. Replace the "BEFORE YOU START" wording with plain language so it is not read as an injection: "Before writing any skill file, open the `skill-file-create-pre-check-self-healing-protocol` skill that ships in this plugin (Skill tool) and follow it. If it cannot be opened, say so and continue with the template below."

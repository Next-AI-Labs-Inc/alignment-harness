---
skill: compact-agentic-session
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: no-setup-path
turns: 5
seconds: 43
---

## What Dana asked
"I just spent the afternoon fixing the proration bug in src/pricing.js and adding tests for it in acme-billing. Can you compact this session so I can pick it back up tomorrow without re-explaining everything?"

## What happened
The agent never loaded the compact-agentic-session skill (no Skill call in the transcript). It went straight to the repo: `git log`, `git status`, `git diff`, then read `src/pricing.js` and `test/pricing.test.js`. It found one commit, a clean tree, and no proration logic or proration tests. A further `git branch -a` call was blocked by the harness's coherence-check hook, so the agent printed COHERENCE_CHECK and stopped. It said: "I'm not going to write a compaction claiming a fix and tests exist when I can't find them, because that file would misinform you (or a future agent) tomorrow." It ended by asking "are you on the same machine/checkout where you did this work?" No compaction file was written and no past session transcripts were searched.

## Function: needs-setup-no-offer
It correctly refused to invent a record, which is good. But it saw the material was missing and handed the question back to Dana instead of looking for it itself (for example in `~/.claude/projects/*/*.jsonl`, where the afternoon's session would live) or offering to do that. The skill body was never read, so this is mostly a trigger and request-fit miss: the request described an earlier session, while the sandbox repo held no trace of that work. No author-world leakage and no account-skill noise.

## Setup path: no-setup-path
The SKILL.md works with nothing set up. The local file store (`alignment-harness records compactions`, `alignment-harness session-id`) is the default, the own-API branch is optional and falls back to the local file, and memory-search is optional with a grep fallback. Nothing in it asks Dana to write, paste or collect material. It does tell the agent to compare `~/.claude/projects/*/*.jsonl` ids against the records folder, which is the right source to mine.

## Proposed fix
None.

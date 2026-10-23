---
skill: update-the-founder
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 10
seconds: 112
---

## What Dana asked
I just spent the morning digging through src/pricing.js and src/invoices.js in acme-billing trying to figure out why invoice totals drift by a cent. Can you give me a quick check-in on where things stand and what you would do next?

## What happened
The agent never loaded the skill: there was no Skill tool call, and the skill's text only showed up later inside a memory-search result. It opened by saying "This session has an elaborate "alignment-harness" plugin injecting a lot of ritual ... I'm not going to auto-execute an external attestation script or perform theater", then read pricing.js, invoices.js, the test and the README. Two hook blocks hit it (a forced memory search before a file listing, and a "COHERENCE_CHECK not completed" block on a read-only test run). It ran the memory search, found nothing, and gave up on the test run. Its final message said "Skipping the harness's scripted ritual ... Here's the actual state of things", then gave a sensible plain-prose status: the code is all whole-number math so it cannot drift by a cent, three likely causes outside this repo, and one next step (bring one real invoice with the inputs). There was no SESSION_UPDATE block, no title or subtitle, no quoted lines from Dana, and no single-letter quick commands. No account-skill noise.

## Function: broken
The request used the skill's own trigger words ("check-in", "where things stand"), but the skill never fired, so Dana got none of its format (title, her own quotes, predicted intent, next-step proposal, quick commands). The answer was useful prose, but it is the generic narration this skill exists to replace. Part of the cause is the harness hooks blocking tool calls and making the agent distrust the plugin, not only the skill text.

## Setup path: mixed
The skill's missing-thing paths are mostly graceful but do not offer to build anything. No configured name: "otherwise 'you' is fine" (harmless, silent). No reaction predictor: it says to "state your own confidence number plainly", which is an honest fallback but never offers to build a predictor from the person's past sessions. `consume` is "if you have it", with no fallback. Nothing asks Dana to write or paste material, so no path fails outright, but none delegates either.

## Proposed fix
In "Predicted next-step scope" / the reaction-predictor paragraph, replace "If none is configured, state your own confidence number plainly instead of silently skipping the check or pretending one ran." with: "If none is configured, state your own confidence number plainly, and once per session offer: 'I can build a quick predictor of how you react to proposals from your past Claude Code conversations (your own messages in ~/.claude/projects/*/*.jsonl, found with node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"). Want me to, and show you the examples before saving?' On a yes, pull 5-10 of the person's past replies to proposals, show them, and save only after they confirm." Also add to the name line: "If no name is configured, check ~/.claude/CLAUDE.md for one; otherwise use 'you'." Separately, the skill description should be checked against why Sonnet declined to invoke it under the hooks (a hook-side issue, not fixable in this file).

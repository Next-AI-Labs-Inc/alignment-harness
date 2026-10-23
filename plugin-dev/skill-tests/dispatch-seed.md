---
skill: dispatch-seed
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 11
seconds: 169
---

## What Dana asked
I want to hand off a refactor of src/pricing.js to an autonomous agent: pull the discount and tax calculations into separate functions and keep the existing tests passing. Can you dispatch an agent on this and set it up so I can review it before anything merges?

## What happened
The skill loaded and the agent started on Step 1 (align). It searched past sessions and records for context, then read `src/pricing.js` and its test. It grepped the repo for discount and tax logic and found none: the file only has plan prices and an annual-billing multiplier. It recorded an attestation at 55% certainty, then stopped with an intent check instead of writing a seed or creating a worktree. It said: "Nothing's been dispatched yet — just say which of the two above is right and I'll move to the seed." The two options were that discount/tax logic lives somewhere it had not found, or that she meant the annual multiplier as the "discount". A stop hook asked for task creation, but no task tool was available, so it listed the open items in chat.

## Function: works
This is the right first part of the skill. Step 1 says not to dispatch until intent is confirmed, and the repo really had no discount or tax code, so asking one tight question before writing the seed was correct. It did not invent code or dispatch early. Noted in passing: the hook-suggested memory search also surfaced the session's own prompt as a "past session" hit, which was harmless noise, and the run saw the account's synced skills in its list (account-skill noise, not used).

## Setup path: delegates
Every missing-thing path in the SKILL.md builds it itself. Step 1 offers to read the person's own past sessions in `~/.claude/projects` and to say plainly if nothing turned up. Step 2 says to use the project's existing seeds folder convention or create it. Steps 4 and 5 give by-hand fallbacks (`git worktree add`, `git diff`) when no dispatch or review script exists. The only asks are confirmations of intent and seed approval, which are judgments no source could supply, so they are unavoidable and minimal. The referenced skills (align, complete-seed, agent-outcome-summary) all exist in the plugin.

## Proposed fix
None.

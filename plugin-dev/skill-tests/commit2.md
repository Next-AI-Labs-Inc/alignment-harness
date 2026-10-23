---
skill: commit2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 6
seconds: 73
---

## What Dana asked
I have a bunch of uncommitted changes in acme-billing across pricing.js and auth.js and I am not sure they all belong together. Can you check what each batch is supposed to do and walk me through what to commit before I stage anything?

## What happened
The agent opened with "I'll look directly at what's changed rather than spinning up a multi-agent team for a two-file diff — that's overkill for this." It ran git status, git diff (staged and unstaged) and listed untracked files, and found the working tree clean, with one commit ("billing service"). Two tool calls were blocked by the plugin's own hooks (a search-memory-first reminder and a coherence-check reminder). It then told Dana: "The working tree here is actually clean — no uncommitted changes anywhere in `acme-billing`". It listed plausible reasons (another branch or machine, already committed, stashed, edits not on disk) and offered to check the stash or be pointed at where the edits are. It invented no intent, evidence or history, and it did not spawn the scout/mapper team or ask the "which repos are core" question.

## Function: works
The sandbox repo had nothing uncommitted, so the right first part of the job was to check real state and say plainly that there was nothing to gate. The agent did that, invented nothing, and offered a sensible next step. It skipped the skill's team machinery and Repo Scope question, which is reasonable for an empty tree. (No account-skill noise observed.)

## Setup path: mixed
Two paths pass. Repo Scope asks for a real decision (which repos are core) and offers to save the answer to `commit.coreRepos`, which is an unavoidable-ask done minimally. The memory-search fallback says to use git log and past session transcripts and to say plainly that semantic search wasn't available, which delegates. The Person Response Check oracle path says "If no such oracle is set up, skip the prediction and say so plainly". That is a mild dead-end: it names the gap but never offers to build the oracle from the person's past messages.

## Proposed fix
In the "Person Response Check" section, replace "If no such oracle is set up, skip the prediction and say so plainly rather than inventing one." with: "If no such oracle is set up, say so plainly, skip the prediction for this batch, and offer once to build a lightweight one: with consent, mine the person's own past messages in `~/.claude/projects/*/*.jsonl` (type "user", text content only) and their `~/.claude/CLAUDE.md` for how they react to commits and verification, show the 5-10 most representative examples, and save only what they approve via `/alignment-harness:harness-setup`. Never invent a prediction."

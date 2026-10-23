---
skill: on-complete-all-queued-tasks
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: mixed
turns: 9
seconds: 83
---

## What Dana asked
I've been queueing up review work on our pricing and invoice design notes in acme-billing, and I want to get through it all in one go. Can you run through whatever's queued and tell me what actually got done?

## What happened
The agent looked for `.claude/agent-action-queue/` in the repo, then searched the home directory for any alternate queue or notes vault, and searched the harness memory tool. It found nothing (the repo has only README.md, src/ and test/). It wrote its coherence check, then told her: "there's nothing to drain." and "0 items processed, 0 done, 0 blocked". It declined to report success: "I'm not reporting 'all queued tasks complete,' since that would be exactly the false-positive this skill exists to prevent." It then offered two ways forward: hand-write one queue item and drain it so she sees the whole loop, or build a producer script that writes queue files. It asked which she wanted. A stop hook then asked for TaskCreate, which was not available; the agent said so and moved on. Nothing was invented and nothing from the account's synced skills was used.

## Function: asks-to-configure
It found the queue missing, said so plainly, did not fabricate items, and offered to set up both a test item and a real producer, waiting for her choice. That matches step 0 of the skill. Both offers lean on Dana supplying a note and a command, which is the weak spot (see below).

## Setup path: mixed
Step 0 is honest (no dead end, no fake item) and offers to hand-write one item, but only "from something you tell me right now", so Dana has to name the document, command and operation. The agent could have proposed a candidate itself from the repo docs or her recent sessions. The "three ways to populate the queue" list names hand-write, script and dashboard but never offers the agent building the producer. The agent's producer offer also asked Dana where she issues commands from, which is material the agent could check first. The fallback does not leave her stuck, but parts of it ask for material.

## Proposed fix
Replace the step 0 offer ("I can write one queue item by hand from something you tell me right now...") with: "Nothing's queued and no producer writes to `<queue root>`. If you'd like, I can look through this repo's docs (README, `docs/`, design notes) and your recent Claude Code sessions (`~/.claude/projects/*/*.jsonl`, your own messages only) for documents you were reviewing or asked agents to act on, and draft one or two queue items from them: the document, the command, and the `operation` text. I'll show you the drafts, and with your yes I'll write them to `<queue root>` and drain them so you see the whole loop. I can also write a small script that creates items like this on demand." Keep her part to a yes/no or a pick-one. In "Three ways to populate the queue", add to option 2: "Offer to write this script for the person rather than asking them to."

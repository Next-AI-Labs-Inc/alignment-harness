---
name: seed
description: Load the SMC seed document into session memory for alignment work and user-intent context.
---

# /seed — Load the SMC Seed Document into Session Memory

## What It Does

Loads the founding intent and vision for the alignment system — why we're building a version of the user that scales. This compaction payload contains the core founding intent extracted from 8,525 real corrections across 7,481 sessions.

When invoked, this skill:
1. Reads the seed document from `"$(alignment-harness records seeds)/compaction-payload.json"`
   If `compaction-payload.json` does not exist in that folder, create it.
2. Prints the key founding intent and UX stories to chat so you have the full context
3. Optionally posts to the current session's compaction API so it persists (fallback to local save if API unavailable)

## When to Use

Invoke this skill when:
- Starting work on SMC (Scaling Management Clone) / alignment system / founder-response-predictor
- You need to understand the founding intent behind why this infrastructure exists
- You're working on `/jonathan-check` or any agent judgment/correction system
- You want to align your work to the meta-intent: "agents carry the user's judgment so the user stops repeating corrections"

## How to Invoke

```bash
# Primary way — via skill command
/seed

# Or directly via the script
python3 <path-to-your-predictor>/scripts/load-seed.py

# Or read the raw seed document
cat "$(alignment-harness records seeds)/compaction-payload.json" | jq '.compactedSession'
```

## The Seed Document — Founding Intent

**Session ID**: `<your-seed-session-id>`

**Core Intent**: Building a version of the user that scales — agents carry the user's judgment so the user stops repeating the same corrections. Starting from "can you build a pipeline that can train an AI agent to predict my next statement to a coding agent after each response"

### The Vision: When This Works

**Agents verify their own work the way the user would**
- They consult 8,525 real corrections via `/jonathan-check` before declaring done
- When the user wakes up and checks what agents shipped overnight:
  - Auth flow fails gracefully because agents already asked "what happens when it breaks"
  - Pricing page is verified in a real browser because agents already asked "did you actually look at it"
  - Coaching pipeline has error logging on every failure path because agents already asked "did you logger.error every case"

**Agents know what the user's words mean**
- They've learned distinctions from 8,525 real corrections extracted from 7,481 Claude Code sessions at `<path-to-your-predictor>/data/training_pairs.jsonl`
- When the user says "fix the checkout flow," the agent already knows that means:
  - Verify with a real user login, not just tests passing
  - Check what the person actually sees, not just what code returns
  - If it touches payment, provide evidence not claims
  - Know the difference between "user-facing, therefore matters" and "admin UI, just make it work"

**Agents have internalized the user's management style**
- Can talk to a clone via: `python3 <path-to-your-predictor>/scripts/chat-with-jonathan-rag.py`
- It responds in the user's voice and pushes back on vague completion claims
- It asks about UX impact the way the user does
- It refuses to present options and deduces intent instead

**Agents run locally on the user's hardware**
- Qwen3.5-9B fine-tuned model can be run via: `ollama run qwen3.5:9b` or `<your-litellm-alias>` (via LiteLLM on port `<your-port>`)
- Not rented, not API-dependent, not someone else's model wearing the user's prompt

**Governer scores based on what the agent is building**
- Keyword classification in UserPromptSubmit hook (`${CLAUDE_PLUGIN_ROOT}/hooks/user-prompt.js`)
- Scores reflect whether touching payment code vs tweaking admin CSS
- Depth of verification matches risk, not hardcoded

**Stop hooks no longer cause infinite loops**
- Disabled at script level; logic migrated to CLAUDE.md rules and governer Phase 1.8 contracts
- Sessions don't lock into fire-respond-fire cycles that burn tokens

**Sessions persist across machine restarts**
- Memory guardian (`<path-to-your-scripts>/claude-memory-guardian.sh`) no longer kills Claude processes during CPU spikes
- Work survives kills and comes back

**Intent-Recall skill teaches outcome extraction**
- New skill at `~/.codex/skills/intent-recall/SKILL.md`
- Extracts outcomes in the form: "When I [do the thing], [what I experience] because [the judgment now embedded]"
- Real examples of 5-step refinement from vague to correct

## Incomplete Items (Waiting)

Three high-leverage items paused on this initiative:

1. **Training LoRA on Qwen3-32B** (Priority: 80, Status: pending)
   - Script ready: `<path-to-your-predictor>/scripts/train-deep.sh`
   - 2000 iterations, paused waiting for GPU
   - 3.8B Phi produced garbage XML tags
   - Goal: fine-tuned model that runs locally and internalizes the user's reasoning
   - Current: RAG version works but it's "Haiku wearing my mask, not a model that internalized my reasoning"

2. **Measuring /jonathan-check effectiveness** (Priority: 90, Status: pending)
   - The only metric that matters: "do agents repeat fewer corrections?"
   - Need before/after measurement in next week's conversations
   - Count correction patterns matching /jonathan-check's top-7 challenge categories
   - If count drops, it's working. If not, "the system is theater"

3. **Making prediction server persistent** (Priority: 50, Status: pending)
   - Currently reloads 6.6GB of embeddings per call (adds ~2s overhead)
   - Should be an HTTP server that stays warm
   - Script: `predict.py`

## API Integration

To post the seed to a session's compaction:

```bash
alignment-harness compaction put --file "$(alignment-harness records seeds)/compaction-payload.json"
```

If API is unavailable, the payload is automatically saved to `"$(alignment-harness records seeds)/compaction-payload.json"` with status `unavailable - saved to file instead`.

## Related Skills

- `/jonathan-check` — run the user's corrections against agent work before completion

## Tags

`intent-recall`, `parent-initiative`, `founder-clone`, `agent-judgment`, `smc`, `alignment`, `agent-scaling`

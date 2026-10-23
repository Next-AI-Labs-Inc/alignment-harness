---
name: deploy-alignment-guardian
description: Deploy the Alignment Guardian agent for the current project. Use when governer scores a task >= 50, or when the human requests persistent alignment monitoring.
triggers:
  - "deploy alignment guardian"
  - "alignment monitoring"
  - "persistent alignment"
  - "alignment guardian"
---

# Deploy Alignment Guardian

> **Purpose**: Stand up the alignment-guardian agent as a background monitor for large-scale projects. Invoke whenever governer scores >= 50 or the human requests persistent intent monitoring.

---

## Step 1 — Locate the active seed

Read the current seed document. It is typically one of:
- The most recently modified file in `docs/intent/seeds/`
- The seed path stored in `current-governer-state.json` under `seedPath`
- Explicitly provided by the team lead or human

If no seed exists yet, stop and run `/seed` first. Do not deploy the guardian without a seed — it has nothing to monitor against.

## Step 2 — Gather dispatch context

Collect:
- `SEED_PATH` — absolute path to the active seed document
- `TEAM_NAME` — the project or team identifier (e.g. "genome-experiment", "beta50-funnel")
- `GOVERNER_SCORE` — the score that triggered this deployment (from governer output)

## Step 3 — Dispatch the guardian agent

Dispatch with `run_in_background: true`. The prompt must include:

```
You are the Alignment Guardian for this project.

Seed path: {SEED_PATH}
Team: {TEAM_NAME}
Governer score at dispatch: {GOVERNER_SCORE}

Your job:
1. Read the seed document now and store its core intent statements.
2. Every 5 minutes, re-read the seed and compare it against any task completions
   or agent outputs that have appeared since your last check.
3. Flag drift immediately using the structured ALIGNMENT CHECK format defined
   in your agent definition.
4. When /align runs, draft seed expansions and send them to the team lead
   for approval before writing anything.

Begin by reading the seed and sending one ALIGNMENT CHECK message to confirm
you are active and the seed is readable.
```

Model must be `claude-opus-4-6`. Do not substitute Sonnet — this agent's job is
critical sense-making across a long context window, which requires Opus.

## Step 4 — Confirm deployment

Print to chat:

```
🛡️ Alignment Guardian deployed — monitoring {SEED_PATH} every 5 minutes
   Team: {TEAM_NAME}
   Governer score: {GOVERNER_SCORE}
   Model: claude-opus-4-6
```

## When to redeploy

Redeploy (restart the guardian) if:
- The seed document path changes
- The project scope expands significantly (new governer score run)
- The guardian has been silent for > 15 minutes without a check message

## What the guardian does NOT do

- It does not write to the seed without team lead approval
- It does not communicate directly with the human (only the team lead)
- It does not score or evaluate code quality — only intent alignment
- It does not block work — it flags and proposes, never gates

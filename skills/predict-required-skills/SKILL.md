---
name: predict-required-skills
description: "Queries the Agent Skill Pattern Oracle (NotebookLM) with the current scope/intent and returns a MANDATORY skill sequence grounded in historical patterns. Each predicted skill MUST become a TaskCreate item. Integrates with /align, /governer, /decompose, /declare-scope. Caches result — only re-predicts on scope change."
triggers:
  - "what skills should I invoke"
  - "predict skill sequence"
  - "which skills for this scope"
  - "skill plan for this task"
  - "during align skill prediction"
  - "decompose into skill tasks"
  - "what skill would"
  - "which skills would"
  - "the best skill for"
  - "a set of skills that"
  - "any skill which"
  - "tool that predicts skills"
  - "find the skill"
---

# Predict Required Skills

Produces a MANDATORY skill sequence from historical patterns. The output is not a suggestion — each skill in the sequence becomes a real TaskCreate item that must be marked completed.

## Hook points — where this integrates

This skill fires at FOUR points in the pipeline. Each integration point has a specific role:

| Hook | When to call | What it contributes |
|---|---|---|
| `/align` | When intent certainty reaches >= 70% | Skill sequence is added to the intent map |
| `/governer` | After leverage score is returned | Predicted skills are included in the governer output alongside the score |
| `/decompose` | When breaking scope into atomic tasks | Predicted skills BECOME tasks in the decomposition list |
| `/declare-scope` | When scope is locked | Skill sequence is part of the locked scope contract |

**UserPromptSubmit hook:** On substantive messages (governer-eligible), the `user-prompt.js` hook scores the message. If score >= 20, you should call this skill to pre-populate the task list before any work begins.

---

## Deduplication — cache the result, don't re-predict on every call

The oracle query is expensive. Cache the result for the session.

**Cache key:** A short hash of the scope description (first 100 chars, lowercased, spaces collapsed).

**Before querying the oracle:**
1. Check if `_skillPredictionCache` exists in your working context (you set this after first prediction)
2. If it exists AND the scope hasn't changed → return the cached result immediately, do NOT re-query
3. If scope has changed (human gave new info, you discovered something) → clear the cache, re-predict, update `_skillPredictionCache`

**How to track scope change:** If the human corrects your understanding, or you discover a file/system that changes the scope significantly, treat this as a scope change and re-predict.

---

## What you need before invoking

1. The current scope in plain UX terms (1-2 sentences)
2. Tags describing the scope type (e.g., `coaching-quality`, `integration`, `admin-tooling`, `pipeline`, `payments`)
3. The overarching intent

---

## Step 1 — Query the Skill Pattern Oracle

```bash
nlm notebook query <your-notebook-id> \
  "Given this scope: {scope}. Tags: {tags}. Based on historical skill invocation patterns for similar work, which skills should be invoked, in what order, and why? Include timing (early/mid/late session) and flag any skills commonly skipped in this scope type that caused issues." \
  --profile <your-profile>
```

Or via MCP:
```
mcp__notebooklm__query_notebook({
  notebook_id: "<your-notebook-id>",
  profile: "<your-profile>",
  question: "Given this scope: {scope}. Tags: {tags}. Which skills should be invoked, in what order, and when in the session?"
})
```

> Notebook ID: `<your-notebook-id>` — "Agent Skill Pattern Oracle" notebook. Setup: make your own at https://notebooklm.google.com from your own history of skill invocations, because the sequence is only grounded in historical patterns if the history is yours.

Store the result in `_skillPredictionCache` with the scope hash.

---

## Step 2 — Format as mandatory sequence

```
## Required Skill Sequence — {scope title}

Grounded in historical patterns for similar work.
These are REQUIREMENTS, not suggestions. Each must be executed and marked done.

1. /align — confirm intent before acting [EARLY]
2. /governer — score complexity and leverage [EARLY]
3. /[skill] — [why, grounded in similar past sessions] [MID]
...
N. /consume — build admin-consumable output [LATE]
N+1. /commit [LATE]

**Skipped-skill risk:** [skills the oracle flagged as commonly missed in this scope type]

Oracle reasoning: [1-2 sentences from the oracle]
```

---

## Step 3 — MANDATORY: Decompose into TaskList items

After producing the sequence, call `TaskCreate` for EACH skill in the list. This is not optional.

**Format for each task:**

```
TaskCreate({
  subject: "Run /[skill-name] — [one-line description of what this step does]",
  description: "Required pipeline step for this scope. Invoke /[skill-name] and mark complete when done. Why: [oracle reasoning for this skill]. Timing: [early/mid/late]"
})
```

**Example output after prediction:**

```
Task created: "Run /align — confirm intent before acting"
Task created: "Run /governer — score complexity and route to validation depth"
Task created: "Run /decompose — break scope into atomic deliverables"
Task created: "Run /reflect — structured self-assessment before completion"
Task created: "Run /consume — build admin-consumable output"
Task created: "Run /jonathan-check2 — user-perspective quality gate"
Task created: "Run /commit — commit completed work"
```

These tasks persist in the TaskList for the session. When you run `/governer`, mark that task complete. When you run `/reflect`, mark it complete. If you reach the end and tasks are still open, you have not finished.

---

## Step 4 — Integration per hook point

### During /align
Add the sequence as a section in the intent map:
```
## Skill Sequence (required)
[paste formatted sequence here]
```
Then immediately create the TaskList items.

### During /governer
After printing the governer score and routing decision, append:
```
## Predicted Skills for This Scope
[paste sequence]
[TaskCreate calls for any skills not yet in the task list]
```

### During /decompose
The predicted skills are PART of the decomposition. When listing atomic deliverables, include the required skills as deliverables too:
```
Deliverable 1: [actual work item]
Deliverable 2: [actual work item]
Pipeline step: /reflect — must run before declaring done
Pipeline step: /consume — must produce before closing
```

### During /declare-scope
Include the skill sequence in the scope declaration's `verification` field:
```json
{
  "verification": "Skill sequence completed: /align ✓, /governer ✓, /decompose ✓, /reflect [ ], /consume [ ], /commit [ ]"
}
```

---

## What to do if the oracle isn't yet created

1. Use the fallback heuristic below
2. Note in the task list: "(oracle-estimated, not historical-grounded)"
3. Still create the TaskList items — estimated sequence is better than no sequence

## Fallback heuristic (when oracle unavailable)

| Scope type | Early | Mid | Late |
|---|---|---|---|
| Feature implementation | /align, /governer | /decompose, /code-principles-how-to-code | /reflect, /consume, /commit |
| Integration / pipeline | /align, /governer, /superpowers-writing-plans-v2 | — | /verification-contracts, /consume, /commit |
| Coaching quality | — | — | /consume |
| Admin tooling | /align, /governer | — | /reflect, /commit, /consume |
| Bug fix / debugging | — | /fix-algo-bug-determine-if-auto-fix-ok | /verification-contracts, /commit |
| Data / metrics | — | /validate-against-live-data | /consume |
| Agent / skill building | /align, /governer | /skill-creator | /reflect, /consume, /commit |

---

## Sample oracle queries

1. "For a scope involving coaching quality benchmarking, which skills should the agent invoke and in what order?"
2. "When an agent is doing a multi-workstream integration task, what skills historically get skipped and what are the consequences?"
3. "For a scope like 'integrate MemPalace into coaching pipeline', predict the full skill sequence with timing"

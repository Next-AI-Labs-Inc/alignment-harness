---
name: agentic-actionable-tasks
description: "Get human-approved incomplete tasks from compactions. Use when looking for approved work to pick up next."
triggers:
  - "agent tasks"
  - "actionable tasks"
  - "task queue"
  - "what to work on"
---

# Agent Actionable Tasks

## When to Use

**Trigger:** "what's approved", "get actionable tasks", "what should I work on", "agent:get:actionable-tasks", "pick up next task", "approved incomplete items"

Use this when you need to find work that a human has reviewed and approved from session compactions.

## How It Works

Session compactions contain `incompleteItems` — unfinished work from past coding sessions. Humans review these in the admin UI and click **Approve** on items worth doing. Approved items get a priority score (1-100). You query the approved list, pull context, then act.

## Get Approved Tasks

```bash
# Top 10 by priority
alignment-harness compaction open-items --status approved

# Most recently approved (default sort)
alignment-harness compaction open-items --status approved

# Filter by status (default: approved)
alignment-harness compaction open-items --status approved
```

### Response Shape

Each item returns:

| Field | Description |
|-------|-------------|
| `title` | The task title |
| `content` | Full task description |
| `priority` | 1-100 (higher = more important) |
| `status` | `approved` (ready for work) |
| `itemIndex` | Position in parent's incompleteItems array |
| `parentSessionId` | Session compaction this came from |
| `parentTitle` | Parent compaction title |
| `parentRepo` | Which repo the work is in |
| `parentIntent` | Overarching intent of the parent session |
| `contextInstructions` | **Read this first** — tells you how to pull full context |
| `creatorSessionId` | Original agent session ID (for resume) |
| `creatorCwd` | Working directory of original session |

## Required Workflow: Context Before Action

**NEVER start working on an item without pulling its surrounding context first.**

For each item:

1. **Read the `contextInstructions` field** — it tells you exactly what to do
2. **Pull full compaction**: `alignment-harness store get compactions <parentSessionId>`
3. **Review the overarching intent** — understand what the session was trying to achieve
4. **Check `howToConsumeThisWorkProduct`** — the original session may have left specific guidance
5. **Then act** on the incomplete item with full context

## Mark Work Complete

After finishing an item:

```bash
alignment-harness compaction item <parentSessionId>#<itemIndex> --status completed
```

## Priority Tiers

| Range | Tier | Meaning |
|-------|------|---------|
| 70-100 | High | Do this first — high leverage, time-sensitive |
| 40-69 | Medium | Important but not urgent |
| 1-39 | Low | Nice to have, do when available |

## Status Lifecycle

```
pending → approved → completed
              ↘ dismissed
```

- **pending** — extracted from session, not yet reviewed by human
- **approved** — human clicked Approve, ready for agent work
- **completed** — agent finished the work
- **dismissed** — human decided it's not worth doing

## Admin UI

Humans manage these at: the folder printed by `alignment-harness records compactions`

In the Incomplete view mode, each item shows:
- Approve / Dismiss buttons (pending items)
- Priority selector (click to set 10-90)
- Mark Complete button (approved items)
- Status badge with color coding

---

## Maintenance Intents (Recurring Tasks)

Some session compaction intents represent recurring maintenance work (dependency audits, test suite health checks, performance monitoring). These are flagged from the Session Compactions page and tracked with a due-date cadence.

### Get Due Maintenance Intents

```bash
# Get due/overdue maintenance intents
alignment-harness store list maintenance-intents --limit 5 --json | jq
```

Each item returns:
- `title`, `description` — what to do
- `regularityDays` — cadence (e.g. every 14 days)
- `overdueDays` — how many days overdue (0 = due today)
- `leverageScore`, `priority` — scoring
- `sourceSessionId` — original session compaction to read for context
- `contextInstructions` — **read this first**

### Required Workflow

1. **Read `contextInstructions`** on each item
2. **Pull source compaction**: `alignment-harness store get compactions <sourceSessionId>` (if linked)
3. **Do the maintenance work**
4. **Log completion**:

```bash
alignment-harness store update maintenance-intents <id> --json '{"completedBy": "agent", "notes": "summary of what was done", "sessionId": "your-session-id"}'
```

This recalculates `nextDueDate` from the completion date + `regularityDays`.

### Admin UI

Humans manage these at: the folder printed by `alignment-harness records maintenance-intents`

Supports: status changes, leverage scoring, regularity adjustment, completion logging, comments.

---
name: next-priority-tasks
description: Aggregate system logs, UX assignments, and agent proposals into a single prioritized task list.
triggers:
  - "priority tasks"
  - "what to do next"
  - "task queue"
  - "next task"
  - "agent priorities"
---

# Next Priority Tasks

Aggregate 3 data sources into a single ranked list of the top 10 actionable items, each with a proposed action and reasoning.

## Atomic Skills This Composes

| Skill | Role in Workflow |
|-------|-----------------|
| `ux-assignment-generator` | Defines UX assignment statuses, item model, scoring |
| `how-to-submit-and-track-proposals` | Defines proposal statuses, priority scale, API |

## Data Sources & API Calls

### 1. System Logs (severity-sorted errors, last 7 days)

```bash
export DEVELOPER_API_KEY=$(grep -E '^DEVELOPER_API_KEY=' .env | cut -d'=' -f2)

# Non-terminal, severity 5+, last 7 days, sorted by severity desc
curl -s "<your-api>/gen3/admin-logs?level=error&limit=10&includeDismissed=false&includeSilenced=false&startDate=$(date -v-7d -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "X-API-Key: $DEVELOPER_API_KEY"
```

**Terminal statuses to EXCLUDE** (already resolved):
- `dismissedAt` is set (closed, will reopen if error recurs)
- `silencedAt` is set (permanently hidden)
- `solutionImplemented: true` AND `solutionReviewed: true` (fix confirmed)

**Non-terminal statuses to INCLUDE** (needs action):
- No solution proposed (needs investigation)
- Solution proposed but not accepted (needs human review)
- Solution accepted but not implemented (needs agent work)
- Solution implemented but not reviewed (needs human verification)

**Priority mapping**: severity 8-10 = CRITICAL, 5-7 = HIGH

### 2. UX Assignments (non-terminal, with admin engagement)

```bash
# Items where admin commented AND/OR requested agent help
curl -s "<your-api>/developer/ux-assignments/status/agent-input" \
  -H "X-API-Key: $DEVELOPER_API_KEY"

# Also check items with admin comments that are still pending
curl -s "<your-api>/developer/ux-assignments/status/pending" \
  -H "X-API-Key: $DEVELOPER_API_KEY"
```

**Terminal statuses to EXCLUDE**: `verified`, `failed`, `skipped`, `stale`

**Non-terminal statuses to INCLUDE**: `pending`, `proposed`, `deferred`, `agent-input`, `on-hold`

**Priority boost**: Items with `status: "agent-input"` get +30 priority (admin is blocked waiting for agent)

### 3. Agent Proposals (high-priority, non-terminal, or help-requested)

```bash
# Proposals needing agent response (admin asked a question)
curl -s "<your-api>/developer/proposals/needing-response?agentId=claude-opus" \
  -H "X-API-Key: $DEVELOPER_API_KEY"

# High-priority approved proposals ready for implementation
curl -s "<your-api>/developer/proposals/approved?limit=10" \
  -H "X-API-Key: $DEVELOPER_API_KEY"

# Pending proposals with priority >= 80
curl -s "<your-api>/developer/proposals/?status=pending-review&limit=10" \
  -H "X-API-Key: $DEVELOPER_API_KEY"
```

**Terminal statuses to EXCLUDE**: `implemented`, `rejected`

**Non-terminal statuses to INCLUDE**: `pending-review`, `approved`, `in-progress`, `deferred`, `agent-input`

**Priority boost**: `status: "agent-input"` gets +30 (admin is waiting)

## Unified Priority Score (0-100)

Normalize all items to a single 0-100 scale:

| Source | Score Formula |
|--------|--------------|
| System log (sev 8-10) | 90 + (severity - 8) * 3 |
| System log (sev 5-7) | 60 + (severity - 5) * 10 |
| UX assignment (agent-input) | 80 |
| UX assignment (pending, high importance) | importanceScore * impactScore / 10 (capped at 70) |
| Proposal (agent-input) | 85 |
| Proposal (approved) | proposal.priority |
| Proposal (pending, priority >= 80) | proposal.priority - 10 |

**Tie-breaker**: More recent items win (sort by `lastSeenAt`, `updatedAt`, or `createdAt`)

## Presentation Format

For each of the top 10 items, present:

```markdown
## #{rank} [{source}] {title} — Score: {score}

**Source**: System Log / UX Assignment / Proposal
**Status**: {current status} | **Since**: {date}
**Why it's priority #{rank}**: {1 sentence — what makes this urgent and who is blocked}

**Proposed Action**: {specific next step the agent or human should take}
**Effort**: {quick estimate: trivial / small / medium / large}
**Admin URL**: {clickable link to view this item}
```

### Admin URLs by Source

| Source | URL Pattern |
|--------|------------|
| System Log | `http://localhost:3000/admin2/logs/system-console-error-logs?errorId={_id}` |
| UX Assignment | `http://localhost:3000/admin2/ux-assignments` |
| Proposal | `http://localhost:3000/admin2/proposals` |

## Workflow Steps

1. **Fetch** — Make all 5 API calls in parallel (2 UX, 2 proposal, 1 system log)
2. **Filter** — Remove terminal items, remove system logs below severity 5
3. **Score** — Apply unified priority score formula
4. **Dedupe** — If a system log has a linked proposal, show only the higher-scored one
5. **Sort** — By score desc, then recency
6. **Present** — Top 10 in the format above
7. **Ask** — "Want me to start on #1, or do you want to pick a different one?"

## Anti-Patterns

- Do NOT show terminal items (already done)
- Do NOT show system logs below severity 5 when severity 5+ exist
- Do NOT show proposals below priority 60 unless they have `agent-input` status
- Do NOT propose actions that require human approval without saying so
- Do NOT skip the "proposed action" — every item needs a concrete next step

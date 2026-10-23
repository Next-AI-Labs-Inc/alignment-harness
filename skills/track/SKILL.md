---
name: track
description: Use when performing any multi-step audit, triage, or alignment task where future agents may repeat the same work.
triggers:
  - "track progress"
  - "audit sweep"
  - "triage tracking"
  - "prevent duplicate work"
  - "agent work logging"
  - "repeatable sweep"
  - "multi-step audit"
---

# Track — Prevent Agents From Redoing Work

## Core Problem

When an agent audits principles, triages compactions, aligns UX intents, or runs any repeatable sweep — if they don't LOG that work was done, the next agent will redo it from scratch. This is the #1 source of wasted agent cycles.

## The Rule: Track Before You Move On

Before completing ANY item in a sweep/audit/triage:

1. Check if a tracking endpoint exists for this work type
2. If YES → log completion (item ID, timestamp, outcome, agent session)
3. If NO → STOP. Build the tracking endpoint first. Then log. Then continue.

## Protocol

### Phase 1: Discover Tracking Infrastructure

Before starting any sweep task:

1. Call `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "tracking endpoint for {work_type}"` to check if logging exists
2. Check `alignment-harness store` pattern — can it already log this type?
3. Check if a `getNextHighestLeverage{WorkType}` function exists
4. If any of these are missing → Phase 2. If all exist → Phase 3.

### Phase 2: Build the Bridge While Crossing It

When tracking infrastructure is missing:

1. **Build the tracker first** — create the endpoint/function following admin tooling template patterns
   - Model: timestamp, itemId, workType, outcome (pass/fail/needs-fix), agentSessionId, notes
   - Route: POST `<your-api>/admin/{work-type}-audit-log`
   - Route: GET `<your-api>/admin/{work-type}-audit-log/next` (returns next unaudited item, weighted by leverage x recency)
   - Use your project's admin auth middleware (never inline auth)
2. **Build the prioritizer** — `getNextHighestLeverage{WorkType}()` function
   - Inputs: all items of this type
   - Weighting: leverage score x (1 / days since last audit). If never audited → max recency weight.
   - Returns: sorted list, highest leverage first, with last audit date and outcome
3. **Run discoverability audit** on new endpoints — ensure future agents can find them via memory-search.js
4. **Register in agent tooling registry** — so agents know these tools exist
5. **Complete ONE item manually** — verify the full loop works (get next → audit → log result → get next returns different item)
6. **Save learned protocol to a skill file** if the pattern is novel enough to warrant it

### Phase 3: Execute the Sweep

Once tracking exists:

1. Call `getNextHighestLeverage{WorkType}()` to get the next item
2. Perform the audit/triage/alignment check on that item
3. Log the result via the tracking endpoint
4. If issues found → fix them, then log the fix
5. Repeat until sweep is complete or context budget is spent

### Phase 4: Parallelize with Subagents

ONLY after Phase 3 has been proven with at least 1 manual item:

1. Save the working protocol (Phase 3 steps + any gotchas discovered) to a temporary skill or include in subagent prompt
2. Deploy subagents with the protocol pre-loaded
3. Each subagent gets a batch of items to audit
4. Main agent monitors completion and aggregates results

## Gap Detection (MANDATORY)

When you invoke this skill, immediately scan for gaps:

- Does the tracking endpoint exist?
- Does the prioritizer function exist?
- Is the work type registered in agent tooling?
- Can memory-search.js surface these tools?

For EACH gap found, print:

```
GAP FOUND: {what's missing} — fixing with {specific action} to align with {specific intent}
```

Then act on it before proceeding with the sweep.

## Anti-Patterns

- Completing audit items without logging → next agent redoes everything
- Building tracking infra but not testing it → broken logging is worse than no logging
- Deploying subagents before proving the loop works manually → multiplies bugs
- Skipping discoverability audit on new endpoints → tools exist but agents can't find them
- Assuming tracking exists without checking → silent failures

## Integration Points

- Discoverability: `/run-discoverability-audit`
- Agent tools registry: `/agentic-tooling-registry`
- Proposals for human review: `/how-to-submit-and-track-proposals`

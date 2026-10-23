---
name: pipeline-scope-guardian
description: "Scope compliance enforcer for the pipeline orchestrator. Registers the full promised scope at session start, tracks coverage across dispatch cycles, and blocks 'done' declarations when any list or requirement has been silently dropped. Designed to run every 10 minutes during orchestrated pipeline sessions. Prevents the v1 failure mode: 4 lists received, only 1 processed, 3 silently dropped."
triggers:
  - "scope guardian"
  - "check scope coverage"
  - "scope compliance"
  - "what was dropped"
  - "pipeline guardian"
  - "coverage check"
  - "register scope"
  - "full scope"
  - "done"
  - "pipeline complete"
---

# Pipeline Scope Guardian

## Why This Skill Exists

In v1 of the pipeline orchestrator, the admin provided 4 explicit lists:
- 31 Landing Pages (LPs)
- 18 Seeds
- 1 Funnel Diagnostic
- 16 Compaction Items

The orchestrator processed list 1 (the LPs) and declared progress. Lists 2, 3, and 4 were silently dropped — no flag, no warning, no request for permission. The admin did not authorize the reduction. This skill makes that failure mode architecturally impossible.

**Core guarantee:** The orchestrator cannot say "done" when items from the registered scope have not been started or completed, unless the user explicitly approves the reduction in writing.

---

## Phase 1 — Session Start: Register Full Scope

**When to invoke:** Immediately after the admin provides the full list of work. Before any dispatch begins.

### Step 1: Parse Every List

Read the admin's message and extract EVERY discrete item from EVERY list. Do not summarize, combine, or drop any item.

Structure the scope registry as:

```json
{
  "scope_id": "{session_id}-scope-{timestamp}",
  "registered_at": "{ISO timestamp}",
  "lists": [
    {
      "list_id": "L1",
      "list_name": "{human name from admin message}",
      "item_count": 31,
      "items": [
        { "item_id": "L1-001", "label": "{exact text from admin}", "status": "not_started", "registered_at": "{ts}", "started_at": null, "completed_at": null }
      ]
    },
    {
      "list_id": "L2",
      "list_name": "{human name}",
      "item_count": 18,
      "items": [...]
    }
  ],
  "requirements": [
    { "req_id": "R1", "description": "jonathan-check2 on every item", "applies_to": "all", "checked_count": 0, "total_items": 49 }
  ],
  "total_items": 66,
  "user_approved_reductions": []
}
```

### Step 2: Persist the Registry

Write the scope registry to a persistent location accessible across dispatch cycles:

If the `.claude/` folder does not exist, create it.

```bash
SCOPE_FILE=".claude/pipeline-scope-registry.json"
```

```bash
# Write registry
cat > "$SCOPE_FILE" << 'EOF'
{scope_registry_json}
EOF

echo "✅ Scope registered: {total_items} items across {list_count} lists"
echo "   L1: {count} {name}"
echo "   L2: {count} {name}"
echo "   (continue for all lists)"
echo "   Requirements: {requirement descriptions}"
```

### Step 3: Print the Registered Scope to Chat

ALWAYS print the full scope to the admin before any dispatch begins. This is the alignment checkpoint.

```
## SCOPE REGISTERED — {total_items} ITEMS ACROSS {list_count} LISTS

L1 — {name}: {count} items
L2 — {name}: {count} items
L3 — {name}: {count} items
L4 — {name}: {count} items

Requirements applied to all items:
- {requirement 1}
- {requirement 2}

TOTAL SCOPE: {total} items + {req_count} requirements

This scope is now locked. The orchestrator will not declare done until all items are accounted for — or until you explicitly authorize a reduction.
```

**Wait for the admin to confirm the scope is complete before dispatching anything.**

### Step 4: Post Scope to Compaction

Use `declareScope()` from `/declare-scope` with the full item list encoded as decomposed statements:

```bash
declareScope \
  "Process {total_items} items across {list_count} lists with {req_count} requirements" \
  '["When all L1 items are dispatched → each LP receives a jonathan-check2", "When all L2 items are dispatched → each seed receives a jonathan-check2", "When all L3 items are dispatched → funnel diagnostic is complete", "When all L4 items are dispatched → all compaction items are resolved"]' \
  "Not reducing scope without explicit user approval" \
  "cat .claude/pipeline-scope-registry.json | jq '.total_items, (.lists[] | {list: .list_name, started: [.items[] | select(.status != \"not_started\")] | length, total: .item_count})'" \
  95
```

---

## Phase 2 — Dispatch Cycle: Mark Items as Started

**When to invoke:** Each time the orchestrator dispatches work for a specific item.

```bash
SCOPE_FILE=".claude/pipeline-scope-registry.json"

# Mark item started
mark_started() {
  local LIST_ID="${@:1:1}"   # e.g., "L1"
  local ITEM_ID="${@:2:1}"   # e.g., "L1-001"
  local NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  local UPDATED=$(jq \
    --arg lid "$LIST_ID" \
    --arg iid "$ITEM_ID" \
    --arg ts "$NOW" \
    '(.lists[] | select(.list_id == $lid) | .items[] | select(.item_id == $iid) | .status) = "in_progress" |
     (.lists[] | select(.list_id == $lid) | .items[] | select(.item_id == $iid) | .started_at) = $ts' \
    "$SCOPE_FILE")

  echo "$UPDATED" > "$SCOPE_FILE"
  echo "▶ Marked $ITEM_ID as in_progress"
}

# Mark item complete
mark_complete() {
  local LIST_ID="${@:1:1}"
  local ITEM_ID="${@:2:1}"
  local NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  local UPDATED=$(jq \
    --arg lid "$LIST_ID" \
    --arg iid "$ITEM_ID" \
    --arg ts "$NOW" \
    '(.lists[] | select(.list_id == $lid) | .items[] | select(.item_id == $iid) | .status) = "complete" |
     (.lists[] | select(.list_id == $lid) | .items[] | select(.item_id == $iid) | .completed_at) = $ts' \
    "$SCOPE_FILE")

  echo "$UPDATED" > "$SCOPE_FILE"
  echo "✅ Marked $ITEM_ID as complete"
}

# Mark requirement checked for an item
mark_req_checked() {
  local REQ_ID="${@:1:1}"   # e.g., "R1"

  local UPDATED=$(jq \
    --arg rid "$REQ_ID" \
    '(.requirements[] | select(.req_id == $rid) | .checked_count) += 1' \
    "$SCOPE_FILE")

  echo "$UPDATED" > "$SCOPE_FILE"
}
```

---

## Phase 3 — Coverage Report (runs every 10 minutes)

**When to invoke:** On a 10-minute timer during active pipeline sessions, AND any time the orchestrator considers saying "done" or "complete."

### Calculate Coverage

```bash
SCOPE_FILE=".claude/pipeline-scope-registry.json"

generate_coverage_report() {
  if [ ! -f "$SCOPE_FILE" ]; then
    echo "❌ SCOPE GUARDIAN: No scope registry found at $SCOPE_FILE"
    echo "   The orchestrator received work but never called pipeline-scope-guardian to register it."
    echo "   This is the v1 failure mode. Register scope before dispatching any work."
    return 1
  fi

  local TOTAL=$(jq '.total_items' "$SCOPE_FILE")
  local NOT_STARTED=$(jq '[.lists[].items[] | select(.status == "not_started")] | length' "$SCOPE_FILE")
  local IN_PROGRESS=$(jq '[.lists[].items[] | select(.status == "in_progress")] | length' "$SCOPE_FILE")
  local COMPLETE=$(jq '[.lists[].items[] | select(.status == "complete")] | length' "$SCOPE_FILE")

  local STARTED=$((IN_PROGRESS + COMPLETE))
  local STARTED_PCT=$(echo "scale=1; $STARTED * 100 / $TOTAL" | bc)
  local COMPLETE_PCT=$(echo "scale=1; $COMPLETE * 100 / $TOTAL" | bc)

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 SCOPE COMPLIANCE REPORT — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "COVERAGE:"
  echo "  Started:   $STARTED / $TOTAL  ($STARTED_PCT%)"
  echo "  Complete:  $COMPLETE / $TOTAL  ($COMPLETE_PCT%)"
  echo "  Remaining: $NOT_STARTED items not yet started"
  echo ""

  # Per-list breakdown
  echo "PER LIST:"
  jq -r '.lists[] | "  \(.list_id) — \(.list_name): \([.items[] | select(.status == "complete")] | length)/\(.item_count) complete, \([.items[] | select(.status == "not_started")] | length) not started"' "$SCOPE_FILE"
  echo ""

  # Requirements compliance
  echo "REQUIREMENTS:"
  jq -r '.requirements[] | "  \(.req_id) — \(.description): \(.checked_count)/\(.total_items) checked"' "$SCOPE_FILE"
  echo ""

  # What's missing
  if [ "$NOT_STARTED" -gt 0 ]; then
    echo "NOT YET STARTED ($NOT_STARTED items):"
    jq -r '.lists[] | .list_id as $lid | .list_name as $lname | .items[] | select(.status == "not_started") | "  [\($lid)] \(.item_id) — \(.label)"' "$SCOPE_FILE" | head -50
    if [ "$NOT_STARTED" -gt 50 ]; then
      echo "  ... and $((NOT_STARTED - 50)) more"
    fi
    echo ""
  fi

  # Time-since-registration for unstarted items
  local SCOPE_AGE_MINS=0
  local REG_TIME=$(jq -r '.registered_at' "$SCOPE_FILE")
  if [ -n "$REG_TIME" ] && [ "$REG_TIME" != "null" ]; then
    local NOW_EPOCH=$(date -u +%s)
    local REG_EPOCH=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$REG_TIME" +%s 2>/dev/null || echo "$NOW_EPOCH")
    SCOPE_AGE_MINS=$(( (NOW_EPOCH - REG_EPOCH) / 60 ))
    echo "  Scope registered $SCOPE_AGE_MINS minutes ago"
    echo ""
  fi

  # Compliance verdict
  if [ "$COMPLETE" -eq "$TOTAL" ]; then
    echo "✅ SCOPE COMPLETE — All $TOTAL items processed."
    echo "   Orchestrator may declare done."
  elif [ "$NOT_STARTED" -gt 0 ]; then
    echo "🔴 SCOPE INCOMPLETE — $NOT_STARTED items have never been dispatched."
    echo ""
    echo "   The orchestrator MUST NOT declare done."
    echo "   If scope reduction is intended, the user must explicitly authorize it."
    echo "   Authorized reductions so far: $(jq '.user_approved_reductions | length' "$SCOPE_FILE")"
    echo ""
    echo "   NEXT REQUIRED ACTION: Dispatch the $NOT_STARTED unstarted items, or"
    echo "   ask the user: 'Do you want me to skip [list name]? It has $NOT_STARTED items not yet started.'"
  else
    echo "⏳ SCOPE IN PROGRESS — All items started, $((TOTAL - COMPLETE)) not yet complete."
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Return non-zero if incomplete (used by done-gate)
  if [ "$COMPLETE" -lt "$TOTAL" ]; then
    return 1
  fi
  return 0
}

generate_coverage_report
```

---

## Phase 4 — Done Gate (blocks "done" declarations)

**When to invoke:** ANY TIME the orchestrator considers outputting the words "done", "complete", "finished", "all processed", "wrapped up", or any functional equivalent.

This is a hard gate. It must run BEFORE the orchestrator types those words.

```bash
SCOPE_FILE=".claude/pipeline-scope-registry.json"

done_gate() {
  if [ ! -f "$SCOPE_FILE" ]; then
    echo "🔴 DONE GATE BLOCKED: No scope registry exists."
    echo "   Scope was never registered. Cannot verify completion."
    echo "   If this session had a scope, register it now via pipeline-scope-guardian Phase 1."
    return 1
  fi

  local TOTAL=$(jq '.total_items' "$SCOPE_FILE")
  local COMPLETE=$(jq '[.lists[].items[] | select(.status == "complete")] | length' "$SCOPE_FILE")
  local NOT_STARTED=$(jq '[.lists[].items[] | select(.status == "not_started")] | length' "$SCOPE_FILE")
  local APPROVED_REDUCTIONS=$(jq '.user_approved_reductions | length' "$SCOPE_FILE")

  if [ "$COMPLETE" -eq "$TOTAL" ]; then
    echo "✅ DONE GATE PASSED: $COMPLETE/$TOTAL items complete."
    return 0
  fi

  # Check if a reduction was approved that covers remaining items
  if [ "$APPROVED_REDUCTIONS" -gt 0 ]; then
    local APPROVED_COUNT=$(jq '[.user_approved_reductions[].item_ids[]] | length' "$SCOPE_FILE")
    local EFFECTIVE_TOTAL=$((TOTAL - APPROVED_COUNT))
    if [ "$COMPLETE" -ge "$EFFECTIVE_TOTAL" ]; then
      echo "✅ DONE GATE PASSED (with approved reductions): $COMPLETE/$EFFECTIVE_TOTAL effective items complete."
      echo "   $APPROVED_COUNT items were explicitly removed from scope by the user."
      return 0
    fi
  fi

  echo ""
  echo "🔴 DONE GATE BLOCKED"
  echo ""
  echo "   The orchestrator attempted to declare done."
  echo "   Scope compliance check failed."
  echo ""
  echo "   Promised: $TOTAL items"
  echo "   Complete: $COMPLETE items"
  echo "   Not started: $NOT_STARTED items"
  echo "   Missing: $((TOTAL - COMPLETE)) items"
  echo ""
  echo "   This is the v1 failure mode. The orchestrator received scope and"
  echo "   did not process all of it. Declaring done without authorization"
  echo "   is a scope reduction without consent."
  echo ""
  echo "   REQUIRED: Either dispatch the missing $NOT_STARTED items, or ask"
  echo "   the user for explicit authorization to skip them."
  echo ""
  echo "   To authorize a reduction, the user says:"
  echo "   'Skip [list/items] — remove them from scope'"
  echo "   Then call: register_approved_reduction 'L2' 'all' 'the user said skip seeds'"
  echo ""
  return 1
}
```

---

## Phase 5 — User-Authorized Reduction

**When to invoke:** Only when the user has explicitly said to skip or remove items from scope. Never infer this from context.

```bash
register_approved_reduction() {
  local LIST_ID="${@:1:1}"        # e.g., "L2" or "all"
  local ITEM_SCOPE="${@:2:1}"     # e.g., "all", "L2-001,L2-002", specific item IDs
  local REASON="${@:3:1}"         # verbatim user quote or clear description
  local NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  if [ -z "$REASON" ]; then
    echo "❌ Cannot register reduction without a reason."
    echo "   Include the user's verbatim authorization."
    return 1
  fi

  # Collect affected item IDs
  local AFFECTED_IDS="[]"
  if [ "$ITEM_SCOPE" = "all" ]; then
    if [ "$LIST_ID" = "all" ]; then
      AFFECTED_IDS=$(jq '[.lists[].items[].item_id]' "$SCOPE_FILE")
    else
      AFFECTED_IDS=$(jq --arg lid "$LIST_ID" '[.lists[] | select(.list_id == $lid) | .items[].item_id]' "$SCOPE_FILE")
    fi
  fi

  local REDUCTION=$(jq -nc \
    --arg lid "$LIST_ID" \
    --arg scope "$ITEM_SCOPE" \
    --arg reason "$REASON" \
    --arg ts "$NOW" \
    --argjson ids "$AFFECTED_IDS" \
    '{list_id: $lid, item_scope: $scope, reason: $reason, authorized_at: $ts, item_ids: $ids}')

  local UPDATED=$(jq \
    --argjson reduction "$REDUCTION" \
    '.user_approved_reductions += [$reduction]' \
    "$SCOPE_FILE")

  echo "$UPDATED" > "$SCOPE_FILE"

  local COUNT=$(echo "$AFFECTED_IDS" | jq 'length')
  echo "✅ Reduction registered: $COUNT items removed from scope for list $LIST_ID"
  echo "   Reason: $REASON"
  echo "   This authorization will be preserved in the scope registry."
}
```

---

## Timer Protocol — 10-Minute Cycle

The orchestrator is responsible for invoking the coverage report every 10 minutes during an active pipeline session. This is not optional — it is the mechanism that prevents silent drift.

**Invoke pattern (orchestrator includes in its dispatch loop):**

```
Every 10 minutes during a pipeline session:
1. Run Phase 3 coverage report
2. If coverage < 100% and scope is not complete:
   - Do NOT proceed to "done" 
   - Surface the missing items to admin
   - Ask: "I still have [N] items in [list name] not started. Continue dispatching them?"
3. If admin says yes → continue dispatching
4. If admin says skip → call register_approved_reduction with their words
5. If admin says done → run done_gate, which will block unless coverage is 100%
```

**The orchestrator MUST print the coverage report as its regular status update. It is not internal tooling — it is the admin's real-time view of what was promised vs what was done.**

---

## Scope Compliance Report Format

Every report must answer these 4 questions in order:

```
WHAT WAS PROMISED
  {list all lists with item counts}

WHAT WAS DELIVERED
  {list all complete items, grouped by list}

WHAT IS MISSING
  {list all not-started items, with time-since-registration}

REQUIREMENTS STATUS
  {for each requirement, checked_count / total_items}
```

If the answer to "what is missing" is "nothing" — coverage is 100%.
If the answer to "what is missing" is anything else — the session is not done.

---

## Integration With /declare-scope

This skill calls `/declare-scope` at registration time to persist the scope in the compaction system. After the full session is complete, the compaction record will show:

- The full scope that was registered
- The coverage at each checkpoint
- Any authorized reductions with user quotes
- Final completion status

This makes scope decisions auditable — the admin can review the compaction and see exactly what was promised, what was delivered, and who authorized any gaps.

---

## Failure Mode Reference

The specific failure this skill prevents:

| v1 Behavior | Guardian Behavior |
|-------------|------------------|
| Received 4 lists, processed 1 | Registers all 4 lists before any dispatch |
| Lists 2-4 silently dropped | Timer surfaces L2-L4 as 0% started after 10 minutes |
| Orchestrator declared progress | Done gate blocks any "complete" claim |
| Admin unaware scope was reduced | Coverage report shows L2-L4 at 0 of N |
| No record of reduction decision | Reduction registry is empty — no authorization existed |

---

## File Location

```
.claude/pipeline-scope-registry.json
```

This file is the single source of truth for the current pipeline session's scope. It persists across dispatch cycles. If it does not exist when the orchestrator begins dispatching, Phase 1 was skipped — that is a compliance failure.

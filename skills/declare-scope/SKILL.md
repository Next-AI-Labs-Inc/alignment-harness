---
name: declare-scope
description: "Decompose a task into testable UX intent statements and post to compaction. Use at the start of every non-trivial task."
triggers:
  - "scope"
  - "decompose"
  - "intent"
  - "what are we building"
  - "state your understanding"
  - "scope declaration"
  - "declare scope"
  - "also, could you"
  - "I think we also need to"
---

# Declare Scope

Before your output, print `## SCOPE_DECLARATION` on its own line. This enables automated extraction to the compaction admin UI.

After your scope output is complete, print `## END_SCOPE_DECLARATION` on its own line. This closes the extraction block.

One function. Reason about the human's intent, decompose it, post it, print it.

## When to invoke

- At the start of every non-trivial task (governer score >= 20)
- When the human changes direction mid-session
- When you realize your understanding was wrong

## What you do

### Step 1: Reason

**REQUIRED:** Consume `/intent` before writing any statements. That skill defines the format, wrong/right examples, and rules.

Decompose the human's request into atomic statements using the two formats:
- **System intent:** When {every condition as experienced} then {system, named by function} should {behavior as effect on person}
- **UX intent:** When {every condition as person's state} then {the person} should {what happens for them, code-precise in human terms}

Rules for each statement:
- **Atomic** — one testable thing
- **Precise** — as specific as code
- **Human-readable** — any stakeholder can understand it
- **Never use code variable names when a UX-equivalent exists**
  - Wrong: "when `plan === 1` and `stripeCustomerId` exists"
  - Right: "when user is not paying and not on a CC trial"

Auto-mining triggers — when the human says any of these, an intent exists to be captured:

| Pattern | Example |
|---------|---------|
| "users should never..." | "users should never see a blank screen after paying" |
| "users should always..." | "users should always know their trial status" |
| "when X happens, they should see Y" | "when they upgrade, they should see a confirmation" |
| "never show X when Y" | "never show upgrade CTA to a paying user" |
| "this is broken because [UX description]" | "this is broken because free users see paid features" |

### Step 2: Post — use `declareScope()` function

Run the function below. It handles Intent DB write, compaction write, session ID resolution, validation, and error reporting back to you.

```bash
# Call this function — do NOT manually construct curl calls
declareScope() {
  # --- Resolve session ID via canonical resolver function ---
  # NEVER read from a shared file like current-session-id.txt — that's a singleton
  # that returns whoever-wrote-it-last, not the agent calling it. Multiple concurrent
  # agents = wrong UUID for everyone except the most recent writer.
  local SESSION_ID=""
  SESSION_ID="$(alignment-harness session-id 2>/dev/null)"
  if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "unknown-session" ]; then
    echo "❌ DECLARE-SCOPE: alignment-harness session-id resolver failed"
    echo "  → No CLAUDE_SESSION_ID env var, no cache, no fingerprint, no growing JSONL"
    echo "  → Fix: ensure the alignment-harness user-prompt hook is running (it caches the session ID)"
    return 1
  fi

  local SUMMARY="${@:1:1}"        # one-line summary of what the human asked for
  local DECOMPOSED="${@:2:1}"     # JSON array: ["When X → Y", "When A → B"]
  local BOUNDARY="${@:3:1}"       # what is NOT in scope
  local VERIFICATION="${@:4:1}"   # runnable command that proves it works
  local CERTAINTY="${@:5:1}"; CERTAINTY="${CERTAINTY:-85}" # 0-100

  # --- Validate inputs ---
  if [ -z "$SUMMARY" ] || [ -z "$DECOMPOSED" ]; then
    echo "❌ DECLARE-SCOPE FAILED: Missing required arguments"
    echo "  → Usage: declareScope 'summary' '[\"When X → Y\"]' 'boundary' 'verification' 85"
    echo "  → You must provide at least summary and decomposed statements"
    return 1
  fi

  local ERRORS=""
  local INTENT_IDS="[]"

  # --- Post each intent to Intent DB ---
  local INTENT_COUNT=$(echo "$DECOMPOSED" | jq 'length' 2>/dev/null || echo 0)
  local POSTED_INTENTS=0
  local INTENT_ID_LIST=""

  for i in $(seq 0 $((INTENT_COUNT - 1))); do
    local STATEMENT=$(echo "$DECOMPOSED" | jq -r ".[$i]" 2>/dev/null)
    local SLUG=$(echo "$STATEMENT" | tr '[:upper:]' '[:lower:]' | sed 's/when //;s/ then /-/;s/ → /-/' | tr -cd 'a-z0-9 -' | tr ' ' '-' | head -c 50)

    local INTENT_RESULT=$(alignment-harness intent add --session "$SESSION_ID" \
      --json "$(jq -nc \
        --arg title "$STATEMENT" \
        --arg slug "$SLUG-$(date +%s)" \
        --arg primaryIntent "$STATEMENT" \
        '{title:$title, slug:$slug, primaryIntent:$primaryIntent, statement:$primaryIntent, status:"proposed", proposedBy:"declare-scope", tags:["scope-declaration","session-intent"]}')" 2>/dev/null)

    local INTENT_SUCCESS=$(echo "$INTENT_RESULT" | jq -r '.success // .intentId // empty' 2>/dev/null)
    local INTENT_ID=$(echo "$INTENT_RESULT" | sed -n 's/^saved intents //p')

    if [ -n "$INTENT_ID" ]; then
      POSTED_INTENTS=$((POSTED_INTENTS + 1))
      INTENT_ID_LIST="${INTENT_ID_LIST}${INTENT_ID},"
    else
      local INTENT_ERR=$(echo "$INTENT_RESULT" | jq -r '.error // .message // .msg // "unknown error"' 2>/dev/null)
      ERRORS="${ERRORS}\n⚠️ Intent DB write failed for statement $i: $INTENT_ERR"
      ERRORS="${ERRORS}\n  → Response: $(echo "$INTENT_RESULT" | head -c 200)"
      ERRORS="${ERRORS}\n  → Check: is \`alignment-harness intent add\` on your PATH?"
    fi
  done

  # --- Post scope to compaction ---
  local COMPACTION_BODY=$(jq -nc \
    --arg sessionId "$SESSION_ID" \
    --arg title "Scope: $SUMMARY" \
    --arg compactedSession "Scope declaration for session $SESSION_ID. $SUMMARY. Decomposed into $INTENT_COUNT testable UX statements. Boundary: ${BOUNDARY:-none stated}. Verification: ${VERIFICATION:-none stated}. Certainty: $CERTAINTY/100. This scope was posted by the declare-scope skill at $(date -u +%Y-%m-%dT%H:%M:%SZ)." \
    --arg overarchingIntentTitle "$SUMMARY" \
    --arg targetUxIntentTitle "$(echo "$DECOMPOSED" | jq -r '.[0] // "No statements"' 2>/dev/null)" \
    --arg successMeasure "Scope persists in compaction. $INTENT_COUNT intent statements posted to Intent DB. Agent prints scope to chat for human alignment. Verification: ${VERIFICATION:-curl the endpoint}." \
    --arg scopeIntent "$SUMMARY" \
    --argjson scopeCertainty "$CERTAINTY" \
    --argjson scopeDecomposed "$DECOMPOSED" \
    --arg scopeBoundary "${BOUNDARY:-not specified}" \
    --arg scopeVerification "${VERIFICATION:-not specified}" \
    '{
      sessionId: $sessionId,
      title: $title,
      compactedSession: $compactedSession,
      overarchingIntentTitle: $overarchingIntentTitle,
      targetUxIntentTitle: $targetUxIntentTitle,
      successMeasure: $successMeasure,
      agentReasoning: {
        gestaltObservation: ("Scope declaration: " + $overarchingIntentTitle),
        alignmentFailures: "None yet — scope just declared",
        sanityCheckSteps: "1. Decomposed intent 2. Posted to Intent DB 3. Posted to compaction 4. Printing to chat",
        surfacingQuestion: "Does this decomposition match what the human actually wants?",
        surfacingAnswer: "Printed to chat for real-time correction. Certainty: \($scopeCertainty)/100"
      },
      scopeDeclaration: {
        intent: $scopeIntent,
        certainty: $scopeCertainty,
        decomposed: $scopeDecomposed,
        boundary: $scopeBoundary,
        verification: $scopeVerification,
        assumptions: ["API is running", "Intent DB accepts proposals"]
      }
    }')

  local COMPACT_RESULT=$(alignment-harness compaction put --session "$SESSION_ID" \
    --json "$COMPACTION_BODY" 2>/dev/null)

  local COMPACT_SUCCESS=$(echo "$COMPACT_RESULT" | head -1 | grep -q '^saved compaction' && echo true)

  if [ "$COMPACT_SUCCESS" != "true" ]; then
    local COMPACT_ERR=$(echo "$COMPACT_RESULT" | head -1)
    local COMPACT_DIAG=$(echo "$COMPACT_RESULT" | jq -r '.diagnostics // empty' 2>/dev/null)
    ERRORS="${ERRORS}\n❌ Compaction write FAILED: $COMPACT_ERR"
    if [ -n "$COMPACT_DIAG" ]; then
      ERRORS="${ERRORS}\n  → Diagnostics: $COMPACT_DIAG"
    fi
    ERRORS="${ERRORS}\n  → Next step: check compaction validation requirements (sessionId must be UUID, compactedSession >= 200 chars)"
  fi

  # --- Report back to the invoking agent ---
  echo ""
  echo "━━━ DECLARE-SCOPE RESULT ━━━"
  echo "Session: $SESSION_ID"
  echo "Intents posted: $POSTED_INTENTS/$INTENT_COUNT"
  if [ -n "$INTENT_ID_LIST" ]; then
    echo "Intent IDs: ${INTENT_ID_LIST%,}"
  fi
  echo "Compaction: $([ "$COMPACT_SUCCESS" = "true" ] && echo "✅ persisted" || echo "❌ failed")"

  if [ -n "$ERRORS" ]; then
    echo ""
    echo "━━━ ERRORS (fix these) ━━━"
    echo -e "$ERRORS"
  fi

  echo ""
  echo "📎 alignment-harness compaction get --session $SESSION_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Return non-zero if anything failed
  if [ -n "$ERRORS" ]; then
    return 1
  fi
  return 0
}
```

**How to use:**

```bash
declareScope \
  "Unify intent lifecycle and scope declaration into one skill" \
  '["When an agent starts a task → it decomposes intent and posts to Intent DB in one call", "When the scope is posted → it prints to chat so the human can correct in real-time", "When posting fails → the error and next step are reported back to the agent"]' \
  "Not changing the Intent DB schema or compaction API" \
  "curl the compaction and verify scopeDeclaration fields populated" \
  90
```

### Step 3: Print to chat

After calling `declareScope()`, print the decomposition to the human. The function reports success/failure, but YOU print the human-readable scope:

```
📋 Scope: {one-line summary of what the human asked for}

When {constraints} → {testable UX outcome}
When {constraints} → {testable UX outcome}
When {constraints} → {testable UX outcome}

Boundary: {what is NOT in scope}
Verification: {runnable command that proves it works}
Certainty: {0-100} — {why this number}
```

Do NOT block waiting for approval — `/governer` decides whether to act or propose.

**Certainty scale:**
- 95-100: Human was explicit, requirements unambiguous
- 85-94: Clear intent, some details need assumptions — state them
- 70-84: Direction clear, specifics fuzzy — reflect, then proceed with best prediction
- Below 70: Predict the most likely intent, propose it as default assumption, proceed. NEVER stop to ask.

### Step 4: Governer

After printing, invoke `/governer` on the first decomposed task. Governer scores it and decides: act directly or propose for human review.

## Error handling

Every failure reports back to you with:
- **What failed** (Intent DB write, compaction write, session ID resolution)
- **Why** (the actual error message from the API)
- **What to do next** (specific fix action)

If `declareScope()` returns non-zero, read the error output and fix the issue before proceeding. Do NOT ignore errors and claim scope was posted.

## Two-Layer ID System

Every intent gets two identifiers:
- **Machine layer:** `IX-042` (3-4 tokens) — use in code comments (`// @intent: IX-042`), commits (`Intents: IX-042`), agent context
- **Human layer:** Full UX statement — use in test names, UX assignments, changelogs, chat

`alignment-harness intent get <id>` resolves ID → full intent record. Intent DB is the registry.

## Intent Through Phases

| Phase | What happens with intent |
|-------|------------------------|
| Discovery | Decompose → post → print (this skill) |
| Planning | Reference IX-### slugs in plan, flag gaps |
| Implementation | Tag code: `// @intent: IX-042` at entry points and error paths |
| TDD | Test file header: `@intents-covered: IX-042, IX-043` |
| Commit | Body includes `Intents: IX-042` |
| Audit | `git log --grep="Intents:" --oneline` traces intent through commits |

## Admin link

After posting, the function prints:
```
📎 alignment-harness compaction get --session {sessionId}
```

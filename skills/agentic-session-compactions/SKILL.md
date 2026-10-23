---
name: agentic-session-compactions
description: "Create, consume, triage, and act on agent session compactions. Use when capturing or retrieving intent across sessions."
triggers:
  - "agent session compaction"
  - "compact agent session"
  - "agent session summary"
  - "agent session learnings"
  - "what was done last session"
  - "incomplete items from agent sessions"
  - "agent session knowledge"
  - "capture agent session intent"
  - "missing compactions"
  - "non-logged sessions"
  - "which sessions have no compaction"
  - "institutional knowledge gaps"
  - "backfill session ids"
  - "compaction gap detection"
---

# Agent Session Compactions — Full Lifecycle Skill

## What This System Is

Agent session compactions are structured summaries of Claude Code agent work sessions. They capture:
- **Overarching intent** — the big-picture UX goal of the session
- **Target UX intent** — the specific testable UX promise delivered
- **Success measure** — how to verify the work achieved its goal
- **UX stories brought to reality** — conversational descriptions of what changed
- **Incomplete items** — work that was started but not finished (with status/priority)
- **Principles** — "When X then Y" statements extracted from the session
- **How to consume** — step-by-step instructions to verify/use the work

**Important:** This is for AGENT (Claude Code) session compactions. For USER coaching session compactions, see the `agent-coaching-session-compaction` skill.

## Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| **Model** | `$(alignment-harness records compactions)/<sessionId>.json` | JSON file — sessionId (unique), 15+ structured fields |
| **API** | `alignment-harness` command + shell | CRUD: `alignment-harness record compactions --name <sessionId>.json` (upsert), `ls` / `grep` the folder (list+search), `cat <sessionId>.json`, `rm <sessionId>.json` |
| **Admin UI** | `$(alignment-harness records compactions)` | Triage in the files in that folder — status filtering, leverage scoring, comments, inline edit |
| **Search Index** | `grep -ril "<query>" "$(alignment-harness records compactions)"` | Searches each compaction's text: paragraphs, overarching intent, UX intent, success measure, UX stories, incomplete items |

## When to Create a Compaction

Create a compaction when a session involved:
- 3+ meaningful file changes (not just formatting)
- 1+ new patterns, principles, or architectural decisions
- Work on a feature that spans multiple sessions
- Debugging that uncovered a non-obvious root cause
- Any incomplete work that a future agent needs to pick up

Do NOT compact trivial sessions (single typo fix, config change, etc.).

### UX Criticality and Pre-Execution Reflection

Before composing the compaction, run the `ux-criticality-measurement` skill if the work was user-facing. If the criticality score is 4+, also run `ux-pre-execution-reflection` and include both outputs in the compaction's `uxCriticality` and `preExecutionReflection` fields. These fields are displayed in the admin UI as purple (criticality) and cyan (reflection) panels.

## How to Create a Compaction

### API Call

```bash
SESSION_ID="$(alignment-harness session-id)"
alignment-harness record compactions --name "unique-session-identifier.json" <<EOF
{
    "sessionId": "unique-session-identifier",
    "creatorSessionId": "$SESSION_ID",
    "userId": "creator-user-id",
    "repo": "your-repo",
    "title": "Human-readable title describing UX impact",
    "subtitle": "One-line context",
    "overarchingIntentTitle": "The big-picture goal",
    "overarchingIntentDescription": "When {constraints} we {testable outcome}",
    "successMeasure": "How to verify this work achieved its goal",
    "targetUxIntentTitle": "Specific UX promise",
    "targetUxIntentDescription": "When {user does X} they {experience Y}",
    "howToConsumeThisWorkProduct": "Step 1: go to localhost:3000/path\nStep 2: click X\nStep 3: verify Y",
    "uxStoriesBroughtToReality": [
      "When an admin opens agent session compactions, done items are hidden by default",
      "When an agent searches for past work, compaction paragraphs appear in results"
    ],
    "incompleteItems": [
      { "title": "Wire up X", "content": "Description of remaining work", "status": "pending", "priority": 80 }
    ],
    "principles": [
      {
        "title": "Short principle name",
        "content": "Detailed explanation",
        "scope": "When {X constraint} then {Y behavior}",
        "status": "pending",
        "priority": 70,
        "leverageScore": 85,
        "tags": ["admin", "ux"]
      }
    ],
    "agentReasoning": {
      "gestaltObservation": "What would it take to observe the gestalt and deduce the actual clear intent the human would instantly understand?",
      "alignmentFailures": "What failures of alignment with existing code intent were surfaced? Dependencies created unnecessarily? Breakage from assumptions?",
      "sanityCheckSteps": "Simple sanity check steps to verify the work — articulated so a human can check without reading code",
      "surfacingQuestion": "The question that, if asked of yourself, surfaces signal over noise of this work product",
      "surfacingAnswer": "The honest answer to that question"
    },
    "uxCriticality": {
      "criticalityScore": 6.5,
      "isUserFacing": true,
      "dimensions": {
        "silentFailureDegradation": 7,
        "deliveryChainLength": 5,
        "firstImpressionWeight": 8,
        "harmIfWrong": 6
      },
      "reasoning": "Explain why each dimension scored the way it did",
      "reflectionRequired": true,
      "reflectionLevel": "full"
    },
    "preExecutionReflection": {
      "targetIntent": "When {user} does {action}, they experience {outcome}",
      "deliveryChain": [
        { "layer": "Layer Name", "servesOrFights": "serves", "note": "Why this serves/fights the intent" }
      ],
      "failureModes": ["Silent failure mode 1", "Silent failure mode 2"],
      "uxRequirements": ["Must X", "Must Y"],
      "harmPotential": "How this could cause more harm than good",
      "riskyAssumption": "The assumption most likely to be wrong",
      "metaQuestion": "The question I should be asking",
      "metaAnswer": "The answer to that question"
    },
    "compactedSession": "Full markdown content of the compaction",
    "tags": ["admin", "compactions", "discoverability"]
}
EOF
```

### File Link (MANDATORY — print after every compaction write)

After any successful `alignment-harness record compactions` write, print the direct file link:

```
📎 $(alignment-harness records compactions)/{sessionId}.json
```

Replace `{sessionId}` with the actual session ID used in the request. This lets the admin jump directly to the compaction without searching.


### Agent Self-Reasoning (MANDATORY before composing)

Before generating any compaction fields, you MUST first reason through and populate these 5 `agentReasoning` fields:

1. **gestaltObservation** — What would it take to observe the gestalt and deduce the actual clear intent in nested UX terms that the human would instantly understand, so they could instantly know your sense of their intent and whether it was aligned?
2. **alignmentFailures** — What failures of alignment with existing code intent were surfaced? Where did you create dependencies that didn't need to exist, or breakage from making assumptions?
3. **sanityCheckSteps** — The simplest sanity check steps to actually verify the work, articulated so a human can perform them without reading code.
4. **surfacingQuestion** — The question that, if asked of yourself, would surface signal over noise of this actual work product.
5. **surfacingAnswer** — The honest answer to that question.

These fields are displayed in the admin UI as an orange "Agent Self-Reasoning" panel between the success measure and UX stories sections. They are the agent's structured self-reflection — not filler, but honest assessment of alignment gaps and verification steps.

### Required Fields
- `sessionId` — unique identifier (use Claude Code session ID or generate one)
- `compactedSession` — full markdown content

### Strongly Recommended Fields
- `title`, `overarchingIntentTitle`, `targetUxIntentTitle` — make it findable
- `agentReasoning` — structured self-reflection (5 fields above). Generate BEFORE composing other fields.
- `principles[]` — first-order concerns for future agents
- `incompleteItems[]` — so nothing gets lost
- `howToConsumeThisWorkProduct` — so humans can verify

## How to Find Compactions

### Semantic Search (memory-search)
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "your query"
```
Results appear as matching snippets from past sessions and repo docs, with where each came from.

### API List with Filters
```bash
# All compactions
ls "$(alignment-harness records compactions)"

# Search by keyword
grep -ril "admin tooling" "$(alignment-harness records compactions)"

# Filter by repo
grep -l '"repo": "your-repo"' "$(alignment-harness records compactions)"/*.json
```

### Admin UI
Browse and triage at: `$(alignment-harness records compactions)`

## How to Act on Compaction Findings

### Incomplete Items
1. Check status — `pending` items need triage, `approved` items need execution
2. Create a task or start a session to complete the work
3. Update status to `completed` when done

### Principles (FIRST-ORDER CONCERNS)
Principles are "When X then Y" statements that encode hard-won learnings. They MUST be:
- **Stored with full context** — not just the rule, but WHY it exists
- **Tagged for discoverability** — use tags like `["ux", "admin", "security", "performance"]`
- **Scored for leverage** — leverageScore 0-100, where 100 = affects every session
- **Promoted when high-leverage** — principles with leverageScore >= 70 should be:
  - Proposed to Intent DB via `alignment-harness intent add --statement "<the principle>"`
  - Added to relevant skill files as rules
  - Added to CLAUDE.md if they're universal

### UX Stories
These are human-readable descriptions of what changed. Use them in:
- Commit messages
- PR descriptions
- Changelogs

## Discoverability Audit Checklist

When creating or reviewing compactions, verify:
- [ ] Title clearly describes UX impact (not just technical change)
- [ ] Principles have `scope` field in "When X then Y" format
- [ ] Principles have `leverageScore` assigned
- [ ] Incomplete items have `priority` assigned
- [ ] Tags include repo name and domain keywords
- [ ] `howToConsumeThisWorkProduct` has actionable steps with URLs

## Session ID Auto-Attach (MANDATORY)

**Always pass these fields when calling `alignment-harness record compactions`:**
```
SESSION_ID="$(alignment-harness session-id)"
"creatorSessionId": "$SESSION_ID"
```

The unquoted `<<EOF` fills `creatorSessionId` from `$SESSION_ID`. This ensures every compaction is traceable back to its Claude Code session — including subagent compactions that use custom `sessionId` slugs.

**Finding gaps:** `find ~/.claude/projects -maxdepth 2 -name '*.jsonl' -mtime -30 -exec basename {} .jsonl \; | while read id; do grep -rqs "$id" "$(alignment-harness records compactions)" || echo "$id"; done`
**Backfilling:** `node agent-swarm-mcp/scripts/get-non-logged-compactions.js --backfill --apply`
**All compactions from one session:** `grep -l '"creatorSessionId": "<claudeSessionId>"' "$(alignment-harness records compactions)"/*.json`

## Agent Tooling Registry Entries

These endpoints are registered in the Agent Tooling Registry:
- `alignment-harness record compactions --name <sessionId>.json` — slug: `agent-session-compaction-upsert`
- `ls "$(alignment-harness records compactions)"` — slug: `agent-session-compaction-list`
- `cat "$(alignment-harness records compactions)/<id>.json"` — slug: `agent-session-compaction-get`
- the **Finding gaps** command above — slug: `get-non-logged-compactions`
- the **All compactions from one session** command above — slug: `compactions-by-creator-session`
- `POST /compactions/backfill-creator-session-ids` — backfill tool
- `rm "$(alignment-harness records compactions)/<id>.json"` — slug: `agent-session-compaction-delete`
- `POST /compactions/:sessionId/comments` — slug: `agent-session-compaction-add-comment`

## API Gotchas (Discovered During Audit)

1. **Route parameter is `sessionId` (UUID), NOT `_id` (ObjectId)** — all compaction endpoints use the UUID session identifier
2. **Update is PUT, not PATCH** — `PUT /compactions/:sessionId` replaces the specified fields
3. **Comments endpoint** — `POST /compactions/:sessionId/comments`
4. **`compactedSession` is required for new documents** — the model validates this field; if migrating from another format, set it even if content lives elsewhere
5. **`incompleteItems[].status` enum** — valid values: `pending`, `approved`, `completed`, `dismissed` (NOT `proposed`)
6. **shortId auto-generates on first save** — 5-digit numeric string, unique, sparse index

## Audit History

- **2026-03-04**: Full discoverability audit of all 48 compactions. 192 principles extracted (avg leverage 76.2, 66 with leverage >= 85). 102 comments added tracking audit start/completion per compaction. 10 parallel agents (batch0-batch9) processed all compactions. 1 orphan compaction found with no sessionId (unreachable via API). Skill file created as keystone discoverability artifact.

## Cross-References

- **User coaching compactions**: `agent-coaching-session-compaction` skill (different system, different data)
- **Intent lifecycle**: `intent-lifecycle` skill
- **Agent tooling registry**: `agent-tooling-registry` skill, `how-to-register-and-describe-agentic-tools` skill
- **Discoverability audit**: `discoverability-audit-learnings-findable-by-agents` skill
- **Memory pipeline**: Related system at `/admin2/memory-pipeline` for user coaching session compactions

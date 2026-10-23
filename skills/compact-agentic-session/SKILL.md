---
name: compact-agentic-session
description: "Create and consume agent session compactions for cross-session continuity. Use when capturing or retrieving intent."
triggers:
  - "agent session compaction"
  - "compact agent session"
  - "agent session summary"
  - "agent session learnings"
  - "what was done last session"
  - "incomplete items from agent sessions"
  - "agent session knowledge"
  - "capture agent session intent"
  - "done"
  - "finished"
  - "AGENT_COMPACT"
  - "compact"
  - "compact this"
  - "compact now"
  - "then compact"
---

# Agent Session Compactions — Quick Functions

> Base path for all records: `alignment-harness records compactions` (one file per session, `session-<sessionId>.json`)

> **Intent Vault (Obsidian) — Apr 8, 2026:** Durable intent lives at `docs/intent/` as an Obsidian vault with `.obsidian/` config. Structure: `seeds/` (numbered seed docs carrying frozen verbatim intent), `agent-alignment/` (alignment doctrine), `maintenance/`, and dated advisor folders. Seeds have required sections `## What this makes possible`, `## The specific gap this closes`, `## What success looks like`, and frontmatter with `name`, `parent_seed`, `type: agent-seed`, `status`, `certainty`, `worktree`. Seeds are registered via `scripts/register-seed.sh <path>` which writes `/tmp/active-seed-intent.json` — a PostToolUse hook then re-injects the frozen intent into the agent's context every N tool calls, preventing drift. Compactions and seeds are complementary: compactions capture session history; seeds carry forward-looking frozen intent across the dispatch lifecycle. See the `dispatch-seed` skill for full workflow.

## Get the answer

| Want to know... | Run this |
|---|---|
| All compactions | `alignment-harness compaction list` |
| Search by keyword | `grep -ril "admin tooling" "$(alignment-harness records compactions)"` |
| Filter by repo | `grep -l '"repo": *"my-app"' "$(alignment-harness records compactions)"/*.json` |
| Get one compaction | `alignment-harness compaction get --session <sessionId>` |
| My session's compaction | `alignment-harness compaction get` |
| Which sessions lack compactions | `for f in $(find ~/.claude/projects -name '*.jsonl' -mtime -30); do id=$(basename "$f" .jsonl); [ -e "$(alignment-harness records compactions)/session-$id.json" ] \|\| echo "$id"; done` |

## Do something

| Want to do... | Run this |
|---|---|
| Create/update compaction | `alignment-harness record compactions --name session-<sessionId>.json --json` body: `{sessionId, compactedSession, title, ...}` (merged into the existing file — see API Call) |
| Add comment | same save, body: `{comments: [...existing, {text}]}` |
| Delete compaction | `rm "$(alignment-harness records compactions)/session-<sessionId>.json"` |
| Backfill session IDs | `alignment-harness record compactions --name session-<sessionId>.json < <record.json>` |

### Canonical helper: `printAndPostCompactionUpdate`

Use this when an agent needs to update the current session compaction and ALSO surface the result in the conversation immediately.

```bash
printAndPostCompactionUpdate() {
  # Set COMPACTION_SESSION_ID, COMPACTION_TITLE, COMPACTION_TEXT (and optionally COMPACTION_EXTRA_JSON) before calling.
  local session_id="$COMPACTION_SESSION_ID"
  local title="$COMPACTION_TITLE"
  local compacted_session="$COMPACTION_TEXT"
  local extra_json="${COMPACTION_EXTRA_JSON:-{}}"

  local file body response
  file="$(alignment-harness records compactions)/session-${session_id}.json"
  body="$(jq -nc \
      --arg sessionId "$session_id" \
      --arg title "$title" \
      --arg compactedSession "$compacted_session" \
      --argjson extra "$extra_json" \
      '{sessionId:$sessionId,title:$title,compactedSession:$compactedSession} + $extra')"
  [ -f "$file" ] && body="$(jq -c -s '.[0] * .[1]' "$file" - <<<"$body")"
  response=$(alignment-harness record compactions --name "session-${session_id}.json" --json "$body")

  echo "$response"
  echo "COMPACTION UPDATE POSTED: $(jq -r '.sessionId // "unknown"' "$file") / $file"
}
```

Required use:
- Call this instead of a raw `alignment-harness record compactions` save when the admin or user should see proof that the compaction was updated.
- The final line MUST stay visible in the conversation:
  `COMPACTION UPDATE POSTED: {sessionId} / {file}`
- `LOW_COST_RESEARCH_AGENTS` should use this helper for completion updates, post-plan updates, and blocker updates.

## API Connection Failure Recovery (MANDATORY — do not skip)

If the compaction save returns an error, empty response, or exit code != 0:

1. **Check the harness** — run `alignment-harness doctor` and fix what it reports.
2. **Retry once** — re-run the exact same save. If it succeeds, continue normally.
3. **If retry also fails** — print `COMPACTION_BLOCKED: alignment-harness unavailable after doctor — scope preserved in conversation` and continue the session without compacting. Do NOT give up silently.

**Never silently swallow a compaction failure.** If the save doesn't produce a file with a `sessionId` in it, the compaction did not save.

## Auth
None — the records are local files.
Base command: `alignment-harness`
Always pass: the session id from `alignment-harness session-id` (see session ID detection below)

## CLI
`for f in $(find ~/.claude/projects -name '*.jsonl' -mtime -30); do id=$(basename "$f" .jsonl); [ -e "$(alignment-harness records compactions)/session-$id.json" ] || echo "$id"; done`
`alignment-harness record compactions --name session-<sessionId>.json < <record.json>`

---

# Agent Session Compactions — Full Lifecycle Skill

## What This System Is

Agent session compactions are structured summaries of Claude Code agent work sessions. They capture:
- **Overarching intent** — the big-picture UX goal of the session
- **Target UX intent** — the specific testable UX promise delivered
- **Success measure** — how to verify the work achieved its goal, naming 1-2 actual KPIs (primary + secondary) that would measure efficacy of this intent
- **UX stories brought to reality** — conversational descriptions of what changed
- **Incomplete items** — work that was started but not finished (with status/priority)
- **Principles** — "When X then Y" statements extracted from the session
- **How to consume** — step-by-step instructions to verify/use the work

**Important:** This is for AGENT (Claude Code) session compactions.

## Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| **Model** | `alignment-harness records compactions` | One JSON file per session — `session-<sessionId>.json` (unique), 15+ structured fields |
| **API** | `alignment-harness` | CRUD: `record compactions --name session-<sessionId>.json` (upsert, merged — see API Call), `compaction list` (list) + `grep` (search), `compaction get --session <id>`, `rm` the file (delete) |
| **Admin UI** | the JSON files in `alignment-harness records compactions` | Triage in the files themselves — status filtering, leverage scoring, comments, inline edit |
| **Search Index** | `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` | Searches past session text and this repo's markdown for the query words |

## When to Create a Compaction

Create a compaction when a session involved:
- 3+ meaningful file changes (not just formatting)
- 1+ new patterns, principles, or architectural decisions
- Work on a feature that spans multiple sessions
- Debugging that uncovered a non-obvious root cause
- Any incomplete work that a future agent needs to pick up

Do NOT compact trivial sessions (single typo fix, config change, etc.).

## Scope Declaration (save before writing code)

When the human assigns work, save a scope declaration to this session's compaction file BEFORE writing any code. This is injected into your context window every turn via the `SCOPE you declared` line in `<alignment-harness>` tags.

**Format:**

```json
{
  "sessionId": "$SESSION_ID",
  "compactedSession": "scope declaration",
  "scopeDeclaration": {
    "intent": "{the exact, precise, context-bound intended UX — include specific conditions, who experiences it, what changes from today}",
    "certainty": 85,
    "decomposed": [
      "When {condition} → {expected UX outcome}",
      "When {condition} → {expected UX outcome}"
    ],
    "boundary": "{what is explicitly NOT in scope}",
    "verification": "{how we'll know it's done — runnable commands}",
    "assumptions": ["{what must be true for this to work}"]
  }
}
```

**Steps:**

1. Decompose the human's intent into testable UX statements
2. Save scope via this skill (single source of truth for compaction saves)
3. Translate scope through `/speak-human` and **print it to the user**
4. THEN proceed with implementation

**Rules:**

- Save the scope BEFORE starting implementation — it's your contract with the human
- **certainty** is not confidence in your ability — it's confidence you understand WHAT THE HUMAN WANTS
- If certainty < 90, the harness's certainty gate fires automatically and forces you to run `/reflect` before proceeding
- UPDATE the compaction when scope changes (human gives new info, you discover something)

**Certainty scale:**

- 95-100: Human was explicit, requirements are unambiguous
- 85-94: Clear intent but some details need assumptions — state and validate them
- 70-84: General direction clear but specifics fuzzy — reflect, then proceed with best prediction
- Below 70: Predict the most likely intent, propose it as a default assumption and proceed. NEVER stop work to ask.

### UX Criticality and Pre-Execution Reflection

Before composing the compaction, run the `ux-criticality-measurement` skill if the work was user-facing. If the criticality score is 4+, also run `ux-pre-execution-reflection` and include both outputs in the compaction's `uxCriticality` and `preExecutionReflection` fields. These fields are displayed in the admin UI as purple (criticality) and cyan (reflection) panels.

## Voice and Translation Rules (MANDATORY)

### Translation Philosophy

"Translation" means converting code changes to intended UX or business logic language. Never lead with technical jargon. Always translate to the underlying intent: who is the user, what UX moment, what steps lead to it.

**Example of good translation:**
> "Many features have controls for whether they go live, which we manage by wrapping in feature flag objects. If the intent is to not expose the public to them yet, they are marked in-development which surfaces only to admins, which is handled by the feature flag system canonically. Here, we fixed specific issues that tried to coopt that logic out of the canonical place, so that feature flag settings are respected centrally for the pulse feature in its compute costs based on funnel stage status."

### Conversational Framing (MANDATORY)

All human-facing output MUST use conversational framing, NOT jargon-first formal language.

**WRONG:**
> "When an admin expands a coaching compaction, the original conversation is loadable above the reasoning section so they can cross-reference what the client actually said while reviewing the AI's analysis."

**RIGHT:**
> "Ok so I was working on a tool that allows you to audit the effectiveness of our new gen3 compaction, extracting the core meaning from coaching sessions automatically. If it works, we're going to wire it in to be automatic. What I did was fix its ability to grab the right conversation. Check if it worked by..."

### URL Rules

- **NEVER use relative paths** — always provide full clickable paths like the absolute folder `alignment-harness records compactions` prints
- **Always include the full link on its own line** at the bottom of any human-facing message
- **Sanity check links must be clickable** — not "/admin2/something" but "http://localhost:3000/admin2/something"
- **Direct link to this compaction**: After saving, return the record's file path with no prefix text, just the bare path on its own line: `$(alignment-harness records compactions)/session-{sessionId}.json` — printed as the full absolute path

## How to Create a Compaction

### Compaction Depth Calibration (from Adaptive Scoring)

Before composing, determine depth. If the Governer ran this session, its score's band tells you how rich this compaction should be (under 20 = thin, 20-59 = standard, 60-79 = rich, 80+ = deep):

| `compactionDepth` | What to include | What to skip |
|---|---|---|
| **thin** | Title, 1-sentence overarching intent, 1-2 UX stories, incomplete items only | agentReasoning, principles, preExecutionReflection, uxCriticality |
| **standard** | All required fields, key decisions captured | preExecutionReflection, uxCriticality (unless user-facing) |
| **rich** | Everything including principles with reasoning, uxCriticality if user-facing | Nothing — full coverage |
| **deep** | Everything + /reflect prefix, all principles with full reasoning chain, back-test references, delivery chain analysis | Nothing — maximum detail |

If no Governer ran, default to **standard**. If you're unsure, run the score command:
```
alignment-harness score --task "{name}" --ac {N} --hp {N} --ew {N}
```
Use the returned score's band to calibrate.

### Execution Order (MANDATORY)

1. **Generate `agentReasoning` FIRST** — the 5 self-reflection fields. This surfaces gaps that inform all other fields.
2. **Deduce overarching intent** — what initiative was this part of? Where is the team's energy going? (e.g., "increasing LTV through higher quality coaching over time", "admins having crystal clear visibility into coach capacity for nuanced decision making")
3. **Deduce KPIs** — name 1-2 actual KPIs (primary + secondary) that would measure success for this initiative in specific UX-translated terms
4. **Atomic intent gate** — count your "When X, then Y" statements across `targetUxIntentTitle`, `incompleteItems[].intentStatement`, and `uxStoriesBroughtToReality`. If fewer than 2 testable statements exist, decompose further before proceeding. The auto-sync to Intent DB depends on this — empty intent fields mean no knowledge graph links.
5. **Compose remaining fields** informed by the reasoning
6. **Attach real session ID** — run the `alignment-harness session-id` bash snippet from the "Session ID Auto-Attach" section below. Source: `bin/alignment-harness` `resolveSession()`. NEVER use a custom slug or hallucinated ID — must be the real Claude Code UUID.
7. **Print `AGENT_COMPACT DONE`** when the save succeeds

### Child Progress Updates (MANDATORY)

When you need to preserve phase-level, requirement-level, or subtask-level progress under an existing compaction, keep the signal but use the compliant shape:

- Keep the parent compaction on its real UUID `sessionId`
- Attach the child signal under the parent via `subCompactions[]`
- Optionally link with `parentCompactionIds`, but only when the child record itself is also a real session UUID
- NEVER invent synthetic child `sessionId` values like `uuid-phase1`, `uuid-S1`, `uuid-child`, or any suffixed custom slug

Allowed:

1. Update the parent compaction directly using the parent UUID
2. Attach a child progress object to the parent via `subCompactions[]`

Forbidden:

- Creating a new top-level SessionCompaction document whose `sessionId` is a fake child slug. That produces malformed standalone artifacts and breaks the compaction contract.

### Identify and Compact

Identify the following context to compact, and create a compacted item that maintains all nuance around the most critical things to learn:

- What was the human seeking to do, in UX-first language? What was the overarching intent and why were they seeking to do that? What was the larger intent this connected to, and how did they connect?
- What were the strategies, workflows, approaches engaged? Did you define or can you derive any strategies engaged to accelerate the realization of this work, to validate the UX? What were the resulting UX Statements you were able to determine were intended?
- Did you learn anything from the session?
- Condense the session conversations to reveal the intent of the user, the sub-intents used to realize that intent, and how it would be validated, the actual UX Intent created, and produce that condensed format with specific paths or strategies.

### Compaction Format Goal

- Nested headings and sub-headings which are nuanced and crystal clear and about specific intent
- All critical learnings surfaced, what changed and why, decisions made, organized into modular items with descriptive title
- Strip out all noise, refine just the signal, with acute specificity around the intent of the user
- Never assume the reader will know what you're talking about or in which context what you're saying is true
- Derive or deduce the overarching initiative this was part of and the intent of that
- Derive or deduce what KPI would measure success and what success would look like in UX terms
- Get the title so crystal clear about the intent that by simply looking at it the human will know instantly exactly what it is related to

### Atomic Intent Decomposition (MANDATORY — enforced before filing)

Every compaction MUST decompose the session's work into atomic, testable intent statements. This is not optional polish — it is the mechanism by which the knowledge graph auto-links to Intent DB and enables future agents to find and act on this work.

**Required fields for every compaction:**

1. **`overarchingIntentTitle`** — The big-picture UX goal. Must be specific enough that an agent can determine if new work relates to this intent. Bad: "Improve admin tools". Good: "Evolve Session Compactions into a living knowledge graph from capture to intent derivation to initiative grouping to AI team execution".

2. **`targetUxIntentTitle`** — The specific testable UX promise this session delivered. Written as a "When X, then Y" conditional. Bad: "Fixed the page". Good: "When an admin opens Session Compactions, they see enriched phases and calibrated predictions without the page crashing".

3. **`incompleteItems[].intentStatement`** — Every incomplete item MUST have an intentStatement: a present-tense UX promise describing correct behavior when the task is done. Written as: "When {actor} does {action}, they experience {outcome}". These auto-link to Intent DB at write time.

4. **`uxStoriesBroughtToReality`** — Each UX story captures what was actually delivered this session. The auto-sync wires these to Intent DB as proposed entries.

**Planning artifact linking:** If the session used `/plan` or `/superpowers-writing-plans-v2`, reference the plan's key decisions in the compaction's `agentReasoning.gestaltObservation` field. This creates a traceable chain: plan → implementation → compaction → Intent DB.

**Self-check before filing:** Count your atomic intent statements. If the compaction has fewer than 2 testable "When X, then Y" statements across all fields, you have not decomposed enough. Go back and extract more signal from the session.

### API Call

```bash
SESSION_ID="$(alignment-harness session-id)"
FILE="$(alignment-harness records compactions)/session-$SESSION_ID.json"
BODY='{
    "agentReasoning": {
      "gestaltObservation": "",
      "alignmentFailures": "",
      "sanityCheckSteps": "",
      "surfacingQuestion": "",
      "surfacingAnswer": ""
    },
    "sessionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "dateCreated": "2026-xx-x",
    "dateOfOriginalSession": "2026-xx-x",
    "userId": "creator-user-id",
    "repo": "my-app",
    "title": "Human-readable title describing UX impact",
    "subtitle": "One-line context",
    "overarchingIntentTitle": "The big-picture goal — where the teams energy is going",
    "overarchingIntentDescription": "When {constraints} we {testable outcome}",
    "successMeasure": "How to verify + name 1-2 actual KPIs (primary/secondary)",
    "targetUxIntentTitle": "Specific UX promise",
    "targetUxIntentDescription": "When {user does X} they {experience Y}",
    "howToConsumeThisWorkProduct": "Conversational framing + sanity check + full clickable URL",
    "uxStoriesBroughtToReality": [
      {
        "story": "Short UX change — under 100 chars, /speak-human, no jargon",
        "status": "complete",
        "verbatimOriginQuote": "The exact words the human said that originated this intent",
        "fulfillmentReasoning": "Why this UX change fulfills the scope — 1-2 sentences, plain language",
        "generatedBy": "opus"
      }
    ],
    "incompleteItems": [
      {
        "title": "When the next agent starts a session, no errors fire from hooks that no longer exist",
        "status": "proposed",
        "priority": 92,
        "intentStatement": "When a new Claude Code session starts after the restore, every hook reference in settings.json points to a script that exists, so the agent begins work immediately",
        "domain": "agent-alignment",
        "verbatimUserQuote": "make sure the current state is committed and saved then restore the working state",
        "extractionConfidence": "high",
        "generatedBy": "opus",
        "humanImpact": {
          "affectedUsers": "Every agent session and the user reviewing agent work",
          "currentExperience": "Session starts, hooks reference deleted scripts, errors fire before any work begins",
          "fixedExperience": "Session starts cleanly, agent begins work immediately on the Mar 30 baseline",
          "changesByUserType": "For agents: no startup errors. For the user: agents work like they did on Mar 30"
        },
        "currentStateVerification": {
          "verifiedStillBroken": true,
          "verificationMethod": "Diffed settings.json hook references against restored .claude/hooks/ directory",
          "verificationNote": "5 settings.json entries reference scripts added after Mar 30"
        },
        "nextStep": "Edit settings.json to remove the 5 post-Mar-30 hook references",
        "blockers": "none",
        "complexity": 25,
        "before": "settings.json references 5 hook scripts that were added after March 30",
        "after": "settings.json references only the 10 hook scripts that existed on March 30",
        "evidenceOfAlignment": "The user explicitly asked to restore the working state from March 30",
        "evidenceOfFix": "New session starts with no hook errors, agent begins work immediately"
      }
    ],
    "principles": [
      {
        "title": "Short human-readable name — under 60 chars, NO code/jargon/line numbers",
        "content": "Full explanation of why this principle exists and when it applies (can be long)",
        "scope": "When {X constraint} then {Y behavior}",
        "status": "pending",
        "priority": 70,
        "leverageScore": 85,
        "tags": ["admin", "ux"]
      }
    ],
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
        { "layer": "Layer Name", "servesOrFights": "serves", "note": "Why" }
      ],
      "failureModes": ["Silent failure mode 1"],
      "uxRequirements": ["Must X", "Must Y"],
      "harmPotential": "How this could cause more harm than good",
      "riskyAssumption": "The assumption most likely to be wrong",
      "metaQuestion": "The question I should be asking",
      "metaAnswer": "The answer to that question"
    },
    "compactedSession": "Full markdown content of the compaction",
    "tags": ["admin", "compactions", "discoverability"]
  }'
[ -f "$FILE" ] && BODY="$(jq -c -s '.[0] * .[1]' "$FILE" - <<<"$BODY")"
alignment-harness record compactions --name "session-$SESSION_ID.json" --json "$BODY"
```

### Admin Link (MANDATORY — print after every compaction write)

After any successful save to the compaction file, print the direct record path:

```
📎 $(alignment-harness records compactions)/session-{sessionId}.json
```

Replace `{sessionId}` with the actual session ID used in the request. This lets the admin jump directly to the compaction without searching.


### Compliant Parent-Attached Child Example

If you need to preserve child progress as signal, attach it to the parent instead of inventing a fake child session:

```bash
SESSION_ID="$(alignment-harness session-id)"
FILE="$(alignment-harness records compactions)/session-$SESSION_ID.json"
BODY='{
    "sessionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "title": "Design Layer Extraction — Zero Blast Radius Refactor",
    "compactedSession": "Parent compaction body...",
    "subCompactions": [
      {
        "title": "[Phase 1] Design Layer Extraction",
        "agentType": "attached-child-compaction",
        "taskDescription": "Extract design tokens and freeze the boundary",
        "description": "Phase-level progress attached to the parent compaction.",
        "status": "completed",
        "governerScore": 85,
        "planStatus": "posted"
      }
    ]
  }'
[ -f "$FILE" ] && BODY="$(jq -c -s '.[0] * .[1]' "$FILE" - <<<"$BODY")"
alignment-harness record compactions --name "session-$SESSION_ID.json" --json "$BODY"
```

### Agent Self-Reasoning (MANDATORY — generate FIRST before composing)

Before generating any compaction fields, you MUST first reason through and populate these 5 `agentReasoning` fields:

1. **gestaltObservation** — What would it take to observe the gestalt and deduce the actual clear intent in nested UX terms that the human would instantly understand, so they could instantly know your sense of their intent and whether it was aligned?
2. **alignmentFailures** — What failures of alignment with existing code intent were surfaced? Where did you create dependencies that didn't need to exist, or breakage from making assumptions?
3. **sanityCheckSteps** — The simplest sanity check steps to actually verify the work, articulated so a human can perform them without reading code.
4. **surfacingQuestion** — The question that, if asked of yourself, would surface signal over noise of this actual work product.
5. **surfacingAnswer** — The honest answer to that question.

These fields are displayed in the admin UI as an orange "Agent Self-Reasoning" panel between the success measure and UX stories sections. They are the agent's structured self-reflection — not filler, but honest assessment of alignment gaps and verification steps.

Generate these FIRST. The reasoning process surfaces gaps that should inform incompleteItems, successMeasure, and howToConsumeThisWorkProduct.

### Field-Specific Requirements

#### `howToConsumeThisWorkProduct`

Must follow this structure:
1. Conversational intro — "Ok so I was working on [what] which [why it matters]..."
2. What I did — specific changes in translated UX terms
3. Simplest sanity check — "Check if it worked by visiting [URL], clicking [thing], noticing [result]. If [good sign], it's working. If [bad sign], something's off."
4. **1 sentence for the main overarching hyper-specific UX intent you tried to create**
5. Direct record path on its own line, no prefix: `$(alignment-harness records compactions)/session-{sessionId}.json`

#### `uxStoriesBroughtToReality`

Each UX story is now a structured object with 3 REQUIRED fields:

1. **`verbatimOriginQuote`** — The exact words the human said that originated this intent. Copy-paste from the conversation. If you can't find a direct quote, use the closest paraphrase and note it.
2. **`story`** — The UX change that fulfilled that intent. Short, under 100 chars, `/speak-human` translated. No code paths, no line numbers, no endpoint names.
3. **`fulfillmentReasoning`** — Why that UX change fulfilled the scope. 1-2 sentences in plain language explaining the connection between what was asked and what was built.

Also include: `status` ("complete", "partial", "pending", "blocked"), `generatedBy` ("opus", "sonnet", "haiku", "human")

**Example — GOOD:**
```json
{
  "verbatimOriginQuote": "the ui needs to clearly state when intent is derived from sonnet vs opus vs haiku",
  "story": "Each enriched compaction card now shows which AI model generated it",
  "fulfillmentReasoning": "The user couldn't tell which fields to trust because model attribution was invisible. Adding colored tags per enrichment source lets them instantly gauge confidence.",
  "status": "complete",
  "generatedBy": "opus"
}
```

**Example — BAD:**
```json
{
  "story": "Added enrichmentHistory rendering to CompactionCard component with model-specific color coding via richnessColor() utility function"
}
```

- Do NOT include aspirational/planned changes — only what's actually live
- **HARD LIMIT: `story` MUST be under 100 characters** — if it is longer, cut it
- **NO code paths, NO line numbers, NO endpoint names** in `story` — apply `/speak-human` translation

#### `incompleteItems` (UNIFIED MODEL — tasks AND proposals)

`incompleteItems` is the single model for all actionable items: proposed changes, incomplete tasks, approved work, completed work. The `status` field determines the lifecycle stage — NOT separate arrays or separate schemas.

**Status lifecycle:** `proposed` → `pending` → `approved` → `actionable` → `completed` (or `dismissed` / `rejected` at any stage)

**Proposals:** When proposing a change, file it as an `incompleteItem` with `status: "proposed"`. Do NOT use a separate `proposalV2s[]` array — that is legacy fragmentation.

**Required fields for EVERY item regardless of status:**

- `title` — UX-translated, under 80 chars. NOT code jargon. What changes for the person using the system.
- `intentStatement` — "When {actor} does {action}, they experience {outcome}". MANDATORY.
- `verbatimUserQuote` — exact admin quote that originated this item. MANDATORY.
- `domain` — searchable tag (e.g. "agent-alignment", "coaching", "auth", "billing")
- `priority` — 1-100 integer
- `status` — one of: proposed, pending, approved, actionable, completed, dismissed, rejected, implemented
- `generatedBy` — "opus", "sonnet", "haiku", or "human"
- `extractionConfidence` — "low", "medium", or "high"

**Principle Quality Gate (MANDATORY)**

Principles in the `principles[]` array must meet ALL of these criteria:
- `title` starts with "When {condition/constraint}" — making it conditional and testable
- `content` is minimum 500 characters — a full paragraph explaining the reasoning, the evidence that established it, and how to apply it across domains
- `content` includes a "Why:" section explaining what happened that crystallized this principle
- `content` includes a "How to apply:" section explaining when this principle fires and what the agent should do differently
- `tags` array has at least 2 domain tags for cross-domain discoverability

**Principle format — WRONG:**
```json
{
  "title": "New systems are always additive",
  "content": "Never interpret anything as replacing an existing system unless explicitly told to."
}
```

**Principle format — RIGHT:**
```json
{
  "title": "When building anything new that overlaps with an existing system, the new thing is always additive — never a replacement — unless the user explicitly says 'replace'",
  "content": "When an agent encounters an existing system that partially overlaps with what it's being asked to build, the agent must frame the new system as complementary. The user corrected this directly: 'never interpret anything as replacing ever remember that, unless I ask for that explicitly.' Why: existing systems have accumulated institutional value that isn't always visible — swarm memory has 11,000+ entries, each system serves a different purpose even when they overlap. Destroying that value by 'replacing' it with something new is irreversible and usually wrong. How to apply: whenever proposing or building something new, explicitly name what existing systems it sits alongside. Use language like 'adds a new layer,' 'complements,' 'sits alongside.' Never use 'replaces,' 'supersedes,' 'instead of' unless the user explicitly requests replacement.",
  "tags": ["agent-behavior", "additive-systems", "user-directive"]
}
```

Vague one-sentence principles are worse than no principles — they give future agents false confidence that they understand a rule while providing zero actionable guidance. A principle that doesn't tell you WHEN it fires, WHY it exists, and HOW to apply it will be hallucinated into whatever meaning the consuming agent finds convenient.

**Required structured subdocuments:**

- `humanImpact` — who is affected, what they see today, what they'd see after the fix, what changes per user type
- `currentStateVerification` — when you checked, whether it's still broken, how you checked, what you found

**Required for proposals (status = proposed):**

- `before` — what exists today
- `after` — what would change
- `evidenceOfAlignment` — quotes or signals from the admin confirming this is wanted
- `evidenceOfFix` — measurable outcome after applying

**Optional enrichment fields:**

- `nextStep` — specific actionable next step
- `blockers` — what's blocking, or "none"
- `complexity` — effort estimate 1-100
- `content` — additional context (use for details that don't fit structured fields)

See the GOOD example in the API call section above. The example shows all required fields populated.

#### `successMeasure`

- Articulate how you would measure success for this initiative in specific UX-intent-translated terms
- Name 1 or 2 actual KPIs you believe would be the best primary and secondary measure for the efficacy of this intent
- Example: "Primary: trial-to-paid conversion rate (measures whether the simplified checkout actually reduces friction). Secondary: time-to-first-coaching-session (measures whether new subscribers engage faster)."

#### `overarchingIntentTitle` / `overarchingIntentDescription`

- Sense or deduce what defined initiative or overarching company objective this work was part of
- Surface where the team's energy is going — be specific
- Examples: "Increasing LTV through higher quality coaching over time", "Admins having crystal clear visibility into and observability of the coach's capacity for nuanced decision making when deferred to programmatic instead of API-consuming approaches"

**Alignment check (MANDATORY before writing):** Ask yourself: "Does this describe what the COMPANY wants to achieve, or what THIS TASK does?" If it describes the task, rewrite it. The field must answer: "What business goal does this work serve?" — not "What did I do?"

If your dispatch prompt included a `COMPANY INTENT:` block, copy that intent here (improved if needed). If no such block exists, query company-intent-db before filling this field.

**Wrong:** "The user launching Pulse email re-engagement to convert warm non-paying users"
**Right:** "Recover MRR from lapsed users as primary growth lever before increasing acquisition spend"

### Required Fields
- `sessionId` — unique identifier. Use the real Claude Code session UUID from the `alignment-harness session-id` snippet in "Session ID Auto-Attach" section. Source function: `resolveSession()` in `bin/alignment-harness`. NEVER use custom slugs like `"claude-code-20260306-73111"` or synthetic child IDs like `"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-phase1"` — these break admin UI re-launch and produce malformed standalone child artifacts.
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
Results appear as snippets with where they came from.

### API List with Filters
```bash
# All compactions
alignment-harness compaction list

# Search by keyword
grep -ril "admin tooling" "$(alignment-harness records compactions)"

# Filter by repo
grep -l '"repo": *"my-app"' "$(alignment-harness records compactions)"/*.json
```

### Admin UI
Browse and triage at: `alignment-harness records compactions` (the folder it prints)

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
  - Proposed to Intent DB via `alignment-harness intent add --statement "<scope>" --status proposed`
  - Added to relevant skill files as rules
  - Added to CLAUDE.md if they're universal

#### Principle title vs content rules (MANDATORY)
- `title` = short human-readable name, **under 60 characters**, NO code paths, NO line numbers, NO jargon
- `content` = the full explanation with context and reasoning (can be as long as needed)
- The title must be scannable at a glance — an agent or human should know what the principle is about without reading `content`
- Good title: "Always validate data completeness, not just required fields"
- Bad title: "API endpoints that accept structured data should validate minimum richness, not just required fields — The POST /agent/compact endpoint validates only sessionId..."
- If your title contains a colon followed by a long explanation, you have put `content` inside `title` — move it

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
- [ ] Incomplete items have UX-translated title prefix
- [ ] Tags include repo name and domain keywords
- [ ] `howToConsumeThisWorkProduct` has actionable steps with full clickable URLs (not relative paths)
- [ ] `successMeasure` names 1-2 actual KPIs
- [ ] All URLs are absolute (`http://localhost:3000/...`), never relative

## Session ID Auto-Attach (MANDATORY — sessionId MUST NOT be empty)

### What is the session ID?

The **Claude Code session ID** is a UUID (e.g., `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`) that uniquely identifies a specific Claude Code terminal session. It is the key that links a compaction back to its originating agent session, enabling **one-click re-launch** from the admin UI. Without it, the "Re-Init" button has no session to resume — the compaction becomes an orphan.

### How to get the session ID — call `alignment-harness session-id`, do NOT read the shared file

The **canonical source** is the function in `alignment-harness session-id`. Run it and use the value it prints. Do NOT read `.claude/current-session-id.txt` — that file is a shared singleton across all concurrent agents and returns whoever wrote it last, not the agent calling it. Multiple agents running at once = wrong UUID for everyone except the most recent writer. Confirmed root cause of compaction-collision bug 2026-05-13.

```bash
# Sole correct pattern: run the resolver, use the value it prints.
# The resolver internally handles --session → CLAUDE_CODE_SESSION_ID → the last session a hook saw.
# Every consumer gets a per-process answer, no shared-state collisions across concurrent agents.
SESSION_ID="$(alignment-harness session-id)"

echo "Session ID: $SESSION_ID"
```

**Origin of this pattern:** `bin/alignment-harness` `resolveSession()` function. It detects concurrent sessions safely by reading the `CLAUDE_CODE_SESSION_ID` that Claude Code sets in each agent's own shell.

### Passing the session ID to the compact API

**Always name the file by the session ID when saving:**
```
alignment-harness record compactions --name "session-$SESSION_ID.json"
```

The CLI reads the session from: `--session` → `CLAUDE_CODE_SESSION_ID` → the last session a hook saw (waterfall, see `bin/alignment-harness` `resolveSession()`).

### Why this matters

- **Admin UI re-launch**: an admin UI uses `sessionId` to power the "Re-Init" button — it launches a new Claude Code agent with the full context of that compaction
- **Session tracing**: `alignment-harness compaction get --session <claudeSessionId>` returns ALL compactions from one terminal session
- **Signal matching**: `adminSignalConfig.js` (line 592) matches compactions by both `sessionId` and `creatorSessionId`
- **Without it**: compaction is an orphan — unfindable by session, un-resumable from admin UI

### Verification checklist

After saving a compaction, verify the file's JSON contains a non-empty `sessionId` that looks like a UUID. If it's null/empty/custom-slug, the detection failed — check `alignment-harness session-id`.

**Finding gaps:** `for f in $(find ~/.claude/projects -name '*.jsonl' -mtime -30); do id=$(basename "$f" .jsonl); [ -e "$(alignment-harness records compactions)/session-$id.json" ] || echo "$id"; done`
**Backfilling:** `alignment-harness record compactions --name session-<sessionId>.json < <record.json>`
**All compactions from one session:** `alignment-harness compaction get --session <claudeSessionId>`

## Completion Signal

When the compaction save succeeds, print on separate lines:

```
AGENT_COMPACT DONE
$(alignment-harness records compactions)/session-{sessionId}.json
```

The path must be the actual record file — bare absolute path, no prefix text, no markdown.

## Agent Tooling Registry Entries

These commands map to the Agent Tooling Registry slugs:
- `alignment-harness record compactions --name session-<sessionId>.json` — slug: `agentic-session-compaction-upsert`
- `alignment-harness compaction list` — slug: `agentic-session-compaction-list`
- `alignment-harness compaction get --session <id>` — slug: `agentic-session-compaction-get`
- the `find ~/.claude/projects` loop under "Finding gaps" — slug: `get-non-logged-compactions`
- `alignment-harness compaction get --session <id>` — slug: `compactions-by-creator-session`
- `alignment-harness record compactions --name session-<sessionId>.json < <record.json>` — backfill tool
- `rm "$(alignment-harness records compactions)/session-<id>.json"` — slug: `agentic-session-compaction-delete`
- the same save with a `comments` array — slug: `agentic-session-compaction-add-comment`

## API Gotchas (Discovered During Audit)

1. **Lookup key is `sessionId` (UUID), NOT a generated id** — all compaction files are named `session-<sessionId>.json`
2. **Update is merge-then-save** — merge your fields into the existing file (`jq -s '.[0] * .[1]'`), then save; `record` alone replaces the whole file
3. **Comments** — the same save, with a `comments` array
4. **`compactedSession` is required for new documents** — the model validates this field; if migrating from another format, set it even if content lives elsewhere
5. **`incompleteItems[].status` enum** — valid values: `pending`, `approved`, `completed`, `dismissed` (NOT `proposed`)
6. **`incompleteItems[]` REQUIRED FIELDS** — every item MUST have: `title` (under 80 chars, UX-translated), `intentStatement` ("When {actor} does {action}, they experience {outcome}"), `verbatimUserQuote` (exact admin quote), `domain` (searchable tag), `priority` (1-100), `generatedBy` ("opus"/"sonnet"/"haiku"/"human"), `extractionConfidence` ("low"/"medium"/"high"), and `humanImpact` subdoc with all 4 fields (`affectedUsers`, `currentExperience`, `fixedExperience`, `changesByUserType`). Items missing ANY of these will be silently stripped by Mongoose — the API will not warn you.
7. **`principles[]` QUALITY GATE** — every principle MUST have: `title` starting with "When {condition}", `content` minimum 500 chars with Why + How to apply sections, and `tags` array with 2+ domain tags. Vague one-liners are rejected.
8. **Save-then-get verification** — after every save, immediately `alignment-harness compaction get --session <sessionId>` the compaction back and compare field counts. If any incompleteItems lost their title/intentStatement/humanImpact, the save silently stripped them. Report the discrepancy — do not silently proceed.
6. **The file name is the id** — `session-<sessionId>.json`, unique per session

## Audit History

- **2026-03-04**: Full discoverability audit of all 48 compactions. 192 principles extracted (avg leverage 76.2, 66 with leverage >= 85). 102 comments added tracking audit start/completion per compaction. 10 parallel agents (batch0-batch9) processed all compactions. 1 orphan compaction found with no sessionId (unreachable via API). Skill file created as keystone discoverability artifact.

## Cross-References

- **Intent lifecycle**: `intent-lifecycle` skill
- **Agent tooling registry**: `agentic-tooling-registry` skill, `how-to-register-and-describe-agentic-tools` skill
- **Discoverability audit**: `discoverability-audit-learnings-findable-by-agents` skill
- **Memory pipeline**: Related system (a separate memory pipeline) for user coaching session compactions

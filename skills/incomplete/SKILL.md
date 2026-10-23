---
name: incomplete
description: Capture unfinished tasks from the current Claude session transcript and persist them to the compaction system.
triggers:
  - "/incomplete-tasks-get-from-session"
  - "capture my unfinished session tasks"
  - "persist incomplete tasks from this session"
  - "what tasks are still open in this session"
---

# Capture Incomplete Tasks from Session

Before your output, print `## INCOMPLETE_TASKS` on its own line. This enables automated extraction to the compaction admin UI.

Extracts incomplete work from the current session's transcript and persists it to the compaction system so future agents can pick it up.

**The core principle**: the transcript JSONL file is the source of truth. Not agent memory, not the compacted summary, not what the agent thinks happened. The actual file on disk.

---

## Intelligence Routing

```
Step                              Model                    Dispatch
──────────────────────────────────────────────────────────────────────
Extract transcript from disk      None (Python)            Inline
Extract TaskList state            None (TaskList tool)      Inline
Identify incomplete work          ANALYSIS_AGENT            Background
Map to incompleteItem shape       ANALYSIS_AGENT            Background
POST to compaction API            None (curl)              Inline
Verify persistence                None (curl)              Inline
```

`ANALYSIS_AGENT = sonnet`

Never use Haiku here. This step reads the user's verbatim words and decides what the user's intent was and whether it landed. Haiku returns shallow or off-format output on that judgment and the user pays for it in a garbled report. Sonnet is the floor.

---

## Step 1: Extract Verbatim Transcript (PROGRAMMATIC — no AI)

**CRITICAL: The agent MUST use the Bash tool to execute this script. DO NOT reason about what it would return.**

This function reads the session's JSONL file and returns the actual user messages — verbatim, not summarized, not interpreted.

Run: `bash "${CLAUDE_PLUGIN_ROOT}/skills/incomplete-tasks-get-from-session/run_extract.sh"`

**Output shape:**
```json
{
  "session_uuid": "c06eab6d-...",
  "transcript_path": "~/.claude/projects/.../.jsonl",
  "total_user_messages": 18,
  "user_messages_verbatim": ["see if you can create...", "ok got it...", ...],
  "tasks_created": 7,
  "tasks_completed": 5,
  "incomplete_tasks": [
    {"subject": "Task subject verbatim", "description": "Full description", "status": "pending"}
  ],
  "tool_summary": {"Edit": 22, "Write": 3, "Bash": 45, "Agent": 16, "Skill": 5, "other": 12}
}
```

---

## Step 2: Dispatch Sonnet to Identify Incomplete Work

Take the programmatic output from Step 1 and feed it to a Sonnet agent. It receives the **actual verbatim user messages** — not a summary of them.

**Analysis agent prompt** (dispatch with `run_in_background: false`, model: `sonnet`):

```
You are an analysis agent. You receive the verbatim transcript of a Claude session.

INPUT (provided by caller — do NOT fetch these yourself):
- User messages (verbatim, in order)
- Tasks created during the session (with subjects and descriptions)
- Incomplete tasks (tasks created but not marked completed)

Your job: identify what work the user asked for that is NOT yet done.

Rules:
- Use ONLY the user's actual words. Do not rephrase or interpret.
- For each incomplete item, quote the user's exact request that created it.
- If the user asked for something that has no corresponding task, that's ALSO incomplete work — flag it.
- Return JSON array of incompleteItems.

Output format (JSON array, nothing else):
[
  {
    "adminQuote": "the exact sentence where the user asked for this",
    "intentTitle": "the single sentence that triggers instant user memory recall — connects what they said to the highest value part of the intent",
    "intent": "the exact, precise, context-bound intended UX the admin wants — specific conditions, who experiences it, what they see, what changes from today — no generalizing, no abstracting, no noise",
    "evidence": "files edited, tasks created, API calls made that relate to this request — or 'no evidence found'",
    "status": "not_started | in_progress | blocked",
    "priority": 60,
    "whats_missing": "specific gap between intent and current state",
    "risks": "what could go wrong if built incorrectly in UX terms — e.g. users locked out, agents failing silently, tokens wasted on automation that doesn't persist — or null if no high priority risks",
    "riskAbatement": "for each risk, the specific test or requirement that prevents it — or null if risks is null"
  }
]
```

**The caller pre-loads** the `user_messages_verbatim` and `incomplete_tasks` arrays from Step 1 directly into the prompt. The agent does NOT read files — it receives the extracted data.

---

## Step 2.5: Caller Writes It Out In English (MANDATORY — before any persistence)

**The JSON is for the API. It is NOT what the admin reads.** Never print schema field names —
`intentTitle`, `whats_missing`, `riskAbatement`, `adminQuote`, `status`, `priority` — to the
screen. Those are database columns. Printing them at a human is jargon, and it is the single
most common way this skill fails. The admin has said so directly: "did I ask for cryptic
jargon or a JSON file???"

Write each item as **prose the admin reads at a glance**, most important first. One short
paragraph each. It must answer, without the user having to ask a follow-up:

1. What the user asked for — quoted in the user's own words, woven into the sentence, not a labeled field.
2. What is actually there right now, with evidence (file, line, commit, or live check).
3. What is missing, in terms of what a person would see or not see.
4. Why it matters. If it doesn't matter much, say so in half a sentence and move on.

Use a number only when the number IS the point (7,022 URLs; 193 characters; two weeks).
Never print "priority: 78/100" — say "this is the one costing you traffic today" or
"this is cleanup, whenever."

Good:
> **The service account still isn't on the property.** You said "i did assignment a silly" —
> and you did, I verified the key on disk. But nothing's been added to Search Console yet, so
> the audit script still can't see a single number. This is the one blocking everything else.

Bad — never do this:
> INCOMPLETE TASK 1/9:
>   IntentTitle: Assignment B — add service account
>   Status: blocked · Priority: 95/100
>   RiskAbatement: verify email appears in users list

The structured fields still get built — they go in the Step 3 POST body. They just never
touch the screen.

### Legacy format — DO NOT USE (kept only to show what was wrong)

```
INCOMPLETE TASK {i}/{total}:
  Admin said: "{adminQuote}"
  IntentTitle: {intentTitle}
  Intent: {intent}
  Evidence: {evidence}
  Status: {status}
  Priority: {priority}/100
  What's missing: {whats_missing}
  Risks: {risks}
  RiskAbatement: {riskAbatement}
```

This prints BEFORE any POST. The admin reads it in their terminal first.

---

## Step 3: Delegate to Canonical Compaction Skill

**This skill does NOT POST to any compaction endpoint directly.** Persistence is delegated to `/compact-agentic-session` — the single source of truth for all agent compaction writes. Fragmenting compaction logic across multiple skills risks writing into the wrong collection, and that is exactly what happened previously.

### Past mistake — never repeat

This skill previously instructed agents to POST directly to `<your-api>/coaching-compactions`. That endpoint stores **user-facing the product coaching session data**, NOT agent work. The two collections are completely separate:

- `coachingconversationcompactions` (via `/coaching-compactions`) → user-facing coaching session summaries — agents must NEVER write here
- `sessioncompactions` (via `/knowledge-atoms/agent/compact`) → agent session compactions — the correct destination

Following the old version of this skill polluted the user-facing collection for ~3.5 weeks before discovery. Never POST to `/coaching-compactions` from agent code under any circumstances.

### Hand off to /compact-agentic-session

For the items the analysis agent identified in Step 2, invoke `/compact-agentic-session` with this payload shape:

```json
{
  "sessionId": "{CLAUDE_SESSION_UUID}",
  "title": "[Incomplete Tasks] {first item's intentTitle}",
  "compactedSession": "Tasks captured at session end from transcript analysis. {plain-language summary ≥ 200 chars describing what the agent worked on, what got completed, and what remains}",
  "tags": ["incomplete-tasks", "session-end", "auto-captured"],
  "incompleteItems": [
    {
      "title": "{intentTitle}",
      "content": "Admin said: \"{adminQuote}\"\n\nIntent: {intent}\n\nEvidence: {evidence}\nWhat is missing: {whats_missing}\nRisks: {risks}\nRisk Abatement: {riskAbatement}",
      "intentStatement": "When {actor} does {action}, they experience {outcome}",
      "status": "pending",
      "priority": {priority}
    }
  ]
}
```

The canonical skill handles the actual write to `$(alignment-harness records compactions)/{sessionId}.json`, the body validation, the retry logic on connection failure, and the `writeAndReportCompaction` helper that prints `COMPACTION WRITTEN: {sessionId}` so the admin sees proof. None of that should be duplicated here.

### Field rules (so the handoff payload is correct)

- `sessionId`: the real Claude Code session UUID — NOT a custom slug, NOT a `userId`. The canonical skill validates this.
- `compactedSession`: minimum 200 characters. If you have less, expand the summary before handoff or the canonical skill will reject the POST.
- `incompleteItems[].status` enum: `pending | approved | completed | dismissed`
- `incompleteItems[].priority`: integer 1–100 (not a string)
- `incompleteItems[].intentStatement`: required by the canonical skill — every item needs a "When X, then Y" UX statement

### Why delegation matters

- **Single source of truth**: when the compaction API changes, only `/compact-agentic-session` needs updating
- **No fragmentation**: agent work goes to one collection, not scattered across multiple
- **No user-data pollution**: the canonical skill enforces the correct collection
- **Failure handling**: the canonical skill has retry logic for connection errors that this skill should not duplicate

### Verify (read-only, from the correct endpoint)

After the canonical skill completes its POST, fetch back to confirm persistence:

```bash
cat "$(alignment-harness records compactions)/{SESSION_UUID}.json" | python3 -c "
import sys,json
d=json.loads(sys.stdin.read())
data=d.get('data') or d
items = data.get('incompleteItems',[]) if isinstance(data,dict) else []
print(f'Verified: {len(items)} items persisted in sessioncompactions')
for i in items:
    print(f'  [{i.get(\"status\")}] {i.get(\"title\",\"?\")[:60]}')
"
```

---

## Rules

- **The JSONL file on disk is the source of truth.** Not agent memory, not compacted summaries.
- **User messages are extracted programmatically** — the Python script reads them, not an agent.
- **The analysis agent receives pre-loaded data** — it does NOT read files or hit APIs. The caller feeds it the extracted transcript.
- **Never claim tasks were persisted without running the verification curl.** If verification fails, say so.
- **Never summarize user messages.** The `userQuote` field must be a direct quote. If you can't quote it, you don't have it.
- **Merge, don't overwrite.** If a compaction already has incompleteItems, fetch them first and include them in the POST.

---

## Admin UI

After successful POST, print:

```
PERSISTED: $(alignment-harness records compactions)/{conversationId}.json
Review, approve, or dismiss each item at the link above.
```

If POST failed:
```
NOT PERSISTED — API returned {status}. Items printed above but not saved.
```

- Incomplete items appear in the Incomplete tab of each compaction card
- The user approves/dismisses/prioritizes from there
- Approved items become consumable by future agents via `/agentic-actionable-tasks`

---

## Schema Update Note

The `incompleteItems` in the compaction now include richer fields in the `content` string:
- Admin's verbatim quote
- Full intent statement (not summarized)
- Evidence of what was done
- What's still missing
- Risks and risk abatement (if applicable)

If the admin UI (`session-compactions` page) needs to render these as separate fields instead of a single `content` blob, dispatch a Sonnet subagent to update the React component to parse the structured content. The MongoDB schema already supports this via the existing `content` field — no model changes needed, only UI parsing.

---
name: incomplete-tasks-get-from-session
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
Clean + separate utterances       HAIKU (data work only)   Background
Identify incomplete work          SONNET (reasoning)       Background
Map to incompleteItem shape       SONNET (reasoning)       Background
POST to compaction API            None (curl)              Inline
Verify persistence                None (curl)              Inline
```

**Model selection rationale (user-corrected Apr 15 2026):**
- **Haiku** = data cleaning ONLY: separating transcript into distinct utterances, stripping system tags, preserving full content without summarizing or truncating. NO reasoning, NO interpretation.
- **Sonnet** = reasoning: identifying what's incomplete, mapping intent to actionable items, determining priority, assessing risks. This requires actual sense-making — haiku produces shallow results here.

`LOW_COST_RESEARCH_AGENTS = claude-haiku-4-5-20251001` (data cleaning only)
`REASONING_AGENTS = claude-sonnet-4-6` (identifying incomplete work, mapping intent, assessing priority)

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

## Step 2: Dispatch Sonnet to Find ALL Unaddressed Intent

**Model: claude-sonnet-4-6 (MANDATORY — this is reasoning, not data work)**

The core job: find every piece of unaddressed intent in the transcript. Intent is NOT just explicit requests. Intent includes:

- **Explicit requests**: "build X", "add Y", "fix Z"
- **Complaints as intent**: "that tool is misaligned" = implicit intent to fix its alignment
- **Corrections as intent**: "no not that", "the style is wrong" = implicit intent to change approach
- **Objections as intent**: "this doesn't actually do the thing" = implicit intent to make it do the thing
- **Aspirational framing as intent**: "this is about surfacing alignment" = implies a set of requirements for what the system must do
- **Frustrations as intent**: "I keep having to check your work" = implicit intent for the system to self-verify
- **Observations that imply gaps**: "I don't see any place where I would articulate intent" = implicit intent that such a place should exist
- **Questions that imply requirements**: "how do we confirm that deterministically?" = implicit intent for deterministic confirmation to be built

**Every single statement the user makes that describes a difference between what IS and what SHOULD BE — that is intent.** The Sonnet agent must find ALL of them.

### HOW the Sonnet agent reasons about intent (MANDATORY — include in the prompt)

The prompt must teach the agent a DECISION PROCESS, not just a list of categories:

**Step 1: Does this message describe a GAP?**
A gap is any difference between what IS (current reality) and what SHOULD BE (desired reality). The gap can be stated explicitly ("build X") or implicitly ("that tool is misaligned" — implying it should be aligned). Ask: "Is the user describing something about reality that they want to be different?" If yes → this contains intent.

**Step 2: What KIND of gap is it?**
Use this decision table:

| Signal in the user's words | What it means | How to derive the intent |
|------|------|------|
| "Build X" / "Add Y" / "Create Z" | Explicit request | The intent IS the request |
| "That's broken" / "This is misaligned" | Complaint about current state | Intent = the FIXED state |
| "No not that" / "Wrong approach" | Correction of agent behavior | Intent = the CORRECTED approach |
| "This is about surfacing alignment" | Aspirational framing | Aspiration IMPLIES requirements |
| "I keep having to..." / "Why do I have to..." | Frustration with repeated problem | Intent = system handles it automatically |
| "I don't see any way to..." | Observation of absence | Intent = that thing EXISTING |
| "How do we confirm...?" | Question implying requirement | Intent = the answer being built |
| "That button is unclear" | UX feedback | Intent = clear UX |
| "I want this for every..." | Scope declaration | Intent = full scope realized |
| "Remember, it should..." | Constraint reminder | Intent = constraint honored |

**Step 3: Is this intent already captured as a task?**
Check the existing task list. "Specifically" means the task description would lead an agent to fulfill THIS exact gap — not just a task in the same general area.

**Step 4: Is the task actually COMPLETE with evidence?**
"Code exists" is NOT evidence. The intent is fulfilled when the PERSON EXPERIENCES the intended outcome.

### The prompt MUST include a `reasoning` field

Every output item must have: `"reasoning": "How I determined this is intent: [the specific gap between IS and SHOULD BE]"` — this is how the agent shows its work and how downstream consumers can verify the reasoning wasn't hallucinated.

**Sonnet agent prompt** (dispatch with `run_in_background: true`, model: `sonnet`):

```
You are an intent extraction agent. You receive the FULL verbatim transcript of a Claude Code session between the user and an AI agent.

Your job: find EVERY piece of unaddressed intent in the transcript. Not just explicit requests — ALL intent, including implicit.

INTENT IS: any statement that describes a difference between what exists and what the user wants to exist. This includes:
- Direct requests ("build X", "add Y")
- Complaints ("that's broken", "this is misaligned") — the fixed state is the intent
- Corrections ("no not that", "never do X") — the corrected approach is the intent
- Objections ("this doesn't actually work") — working correctly is the intent
- Aspirational statements ("this is about surfacing alignment") — the aspiration implies specific requirements
- Frustrations ("I keep having to check") — the system self-checking is the intent
- Observations of absence ("I don't see any way to do X") — X existing is the intent
- Questions that imply requirements ("how do we confirm this?") — confirmation existing is the intent
- UX feedback ("that button is unclear") — clear button is the intent
- Scope declarations ("I want this to work for every conversation type") — full scope is the intent

For EACH intent you find:
1. Quote the EXACT user words (never paraphrase)
2. Derive the implied intent — what reality would exist if this was addressed?
3. Check: does a corresponding task exist in the task list? Is it marked complete?
4. If no task exists OR the task exists but isn't verified as complete → this is UNADDRESSED

DO NOT summarize or compress the user's words. The full nuance must survive.
DO NOT skip statements because they seem minor. A frustration about a button is still intent.
DO NOT group multiple intents into one item. Each distinct intent gets its own entry.

Return JSON array:
[
  {
    "adminQuote": "the FULL exact quote — never truncated, never summarized",
    "intentType": "explicit_request | complaint | correction | objection | aspiration | frustration | absence | question | ux_feedback | scope_declaration",
    "intentTitle": "one sentence — what the user wants to exist, stated as the desired end state",
    "intent": "the precise, context-bound UX the user wants — who experiences what, when, how — with full nuance preserved",
    "hasMatchingTask": true/false,
    "taskStatus": "not_started | in_progress | completed | no_task",
    "evidenceOfCompletion": "what evidence exists that this was actually done — or 'none'",
    "isVerifiedComplete": false,
    "priority": 60,
    "whats_missing": "specific gap between intent and current state",
    "doneMeans": "1-3 sentences, in the USER'S OWN VOICE and words, stating the SEMANTIC meaning of completion — the lived outcome that tells the user it is done, NOT the code-level fix. The test: could the user read this one line and instantly feel what 'done' is, without parsing any code? Lead with 'Done means:' then describe the experience a real person has when this is complete, and WHY it matters. Reuse the user's exact phrasing from the transcript wherever the user gave it. Example shape: 'Done means: a search crawler hits yourapp.com/learn/something and the page loads, instead of Cloudflare slamming the door with a 403. The proof is a stranger from Google can actually reach the SEO pages we built.' NEVER write this as 'the X function returns Y' or 'the file is updated' — that is code meaning, which is exactly what this field exists to replace."
  }
]
```

**`doneMeans` is mandatory and is the single most important field for the user.** The user reads this list to decide what to act on; a code-meaning description ("populate the vector store") forces the user to translate it themselves, while a lived-outcome description ("you type a feeling into search and get the right practices back, ranked") lets the user decide in one glance. Every item MUST have a `doneMeans` written in the user's voice. This requirement was added 2026-06-18 after the user asked, verbatim: *"unpack each with 1-3 sentences precisely articulating the goal - meaning the semantic not code meaning of completion that helps me."*

**The caller pre-loads** the `user_messages_verbatim` and `incomplete_tasks` arrays from Step 1 directly into the Sonnet prompt. The Sonnet does NOT read files — it receives the extracted data.

---

## Step 2.5: Caller Prints to Screen (MANDATORY — before any persistence)

**The FIRST time this list is shown to the user, lead with the lived-outcome version.** The user does not want a schema dump — the user wants to read each item and instantly feel, in the user's own language, what "done" means and whether it matters. Print the items SORTED BY PRIORITY (highest first), each as a `[priority]` tag, the short title, then the `doneMeans` sentence(s) in the user's voice. This is the default presentation — produce it without being asked:

```
[{priority}] {intentTitle}
{doneMeans}

[{priority}] {intentTitle}
{doneMeans}
...
```

Keep it conversational and scannable — one item flows to the next like a person walking the user through the list, not a table. Do NOT lead with adminQuote/evidence/risks fields; those are the audit detail, available on request, not the user's first read.

This lived-outcome-first format was made the default 2026-06-18 per the user: the user had to manually ask an agent to "unpack each with 1-3 sentences precisely articulating the goal - meaning the semantic not code meaning of completion that helps me." From now on the skill produces that on the first run, so the user never has to ask.

**The full audit record** (for the compaction + for an agent that needs the detail) still carries every field — print this expanded block only if the user asks for the detail, or include it silently in the persisted compaction `content`:

```
INCOMPLETE TASK {i}/{total}:
  Admin said: "{adminQuote}"
  IntentTitle: {intentTitle}
  Done means: {doneMeans}
  Intent: {intent}
  Evidence: {evidence}
  Status: {status}
  Priority: {priority}/100
  What's missing: {whats_missing}
  Risks: {risks}
  RiskAbatement: {riskAbatement}
```

This prints BEFORE any POST. The admin reads it in their terminal first.

## Step 2.75: Create TaskCreate Items (MANDATORY — DO NOT SKIP)

**After printing and BEFORE compacting**, create a `TaskCreate` item for EACH incomplete item Haiku identified. This is NOT optional. Compacting without TaskCreate means the items exist in the compaction system but NOT in the session's active task list — which means the agent has no tracked work items to act on.

For each item:
```
TaskCreate({
  subject: "{intentTitle}",
  description: "Admin said: \"{adminQuote}\"\n\n{intent}\n\nWhat's missing: {whats_missing}",
  activeForm: "{short present-tense description}"
})
```

**Why this step exists:** On Apr 14 2026, the agent compacted 16 incomplete items but forgot to create TaskCreate entries. The task list didn't grow. The user had to catch this manually. Compaction is for cross-session persistence. TaskCreate is for in-session tracking. BOTH must happen. Neither replaces the other.

---

## Step 3: Delegate to Canonical Compaction Skill

**This skill does NOT POST to any compaction endpoint directly.** Persistence is delegated to `/compact-agentic-session` — the single source of truth for all agent compaction writes. Fragmenting compaction logic across multiple skills risks writing into the wrong collection, and that is exactly what happened previously.

### Past mistake — never repeat

This skill previously instructed agents to POST directly to the coaching compactions endpoint. That endpoint stores **user-facing product coaching session data**, NOT agent work. The two collections are completely separate:

- `coachingconversationcompactions` (via the coaching compactions endpoint) → user-facing coaching session summaries — agents must NEVER write here
- `sessioncompactions` (via `alignment-harness compaction put`) → agent session compactions — the correct destination

Following the old version of this skill polluted the user-facing collection for ~3.5 weeks before discovery. Never POST to the coaching compactions endpoint from agent code under any circumstances.

### Hand off to /compact-agentic-session

For the items Haiku identified in Step 2, invoke `/compact-agentic-session` with this payload shape:

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

The canonical skill handles the actual POST to `alignment-harness compaction put`, the body validation, the retry logic on connection failure, and the `printAndPostCompactionUpdate` helper that prints `COMPACTION UPDATE POSTED: {sessionId} / {shortId}` so the admin sees proof. None of that should be duplicated here.

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
alignment-harness compaction get --session {SESSION_UUID} | python3 -c "
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
- **Haiku receives pre-loaded data** — it does NOT read files or hit APIs. The caller feeds it the extracted transcript.
- **Never claim tasks were persisted without running the verification curl.** If verification fails, say so.
- **Never summarize user messages.** The `userQuote` field must be a direct quote. If you can't quote it, you don't have it.
- **Merge, don't overwrite.** If a compaction already has incompleteItems, fetch them first and include them in the POST.

---

## Admin UI

After successful POST, print:

```
PERSISTED: $(alignment-harness records compactions)
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

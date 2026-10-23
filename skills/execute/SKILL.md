---
name: execute
description: "Session-persistent adversarial execution team. Creates a team on first call that stays alive for the entire session — scope guardian, compliance auditor, and self-healing log accumulate context across all task batches. Dispatches implementers with independent cross-verification, adversarial disproof, and oracle alignment checking. Use when you have a confirmed task list and need verified implementation."
triggers:
  - "/execute"
  - "execute the tasks"
  - "run the pipeline"
  - "implement with verification"
version: 2
date: 2026-04-14
parent_workflow: /workflow-factory
work_type: IMPLEMENTATION
risk_profile: MEDIUM
status: oracle-validated
---

# /execute — Adversarial Execution Pipeline

## What This Is

A session-persistent execution team that stays alive for the entire Claude Code session. On first invocation, it creates a team with specialized agents (scope guardian, compliance auditor). Every subsequent `/execute` call feeds new tasks into the existing team — the accumulated context, self-healing patches, and learned patterns carry forward across all task batches in the session.

No task is marked complete until three independent verification agents converge: a cross-verifier, an adversary, and the user oracle. When any verification fails, the compliance auditor diagnoses the stage design flaw and patches it so the same failure class cannot recur — and that patch applies to every task for the rest of the session.

**The orchestrator (you) NEVER does work.** You dispatch, monitor, route, and report. Every piece of implementation, verification, and checking is delegated.

## Session Lifecycle

```
First /execute invocation:
  1. TeamCreate — name: execute-{session-short-id}
  2. Spawn persistent agents: scope-guardian, compliance-auditor
  3. Process initial task batch through the 8-stage pipeline

Subsequent /execute invocations (same session):
  1. Check if team execute-{session-short-id} exists
  2. If YES → feed new tasks into existing team
     - Scope guardian adds new tasks to its registry
     - Compliance auditor applies all prior self-healing patches
     - Self-healing log continues accumulating
  3. If NO (team was destroyed) → create fresh team

Session end:
  - Team persists until session ends or human explicitly destroys it
  - Self-healing log is written to compaction for future sessions
```

**The team is NEVER destroyed between task batches.** It dies when the session ends or the human says to kill it.

## When to Use

- You have a confirmed task list (from /decompose) with full verbatim intent in each task description
- The tasks are well-researched with current reality, gap analysis, and exact file paths
- You want verified implementation, not just code changes
- You're mid-session and want to feed more work into the existing pipeline

## When NOT to Use

- Tasks are not yet decomposed (run /decompose first)
- Intent is not yet confirmed (run /align first)
- Single trivial change (just do it, no pipeline needed)

---

## The Execution Flow Per Task

Each task flows through 8 stages sequentially. The orchestrator dispatches each stage ONLY after the prior stage completes.

```
┌─────────────────────────────────────────────────┐
│ STAGE 1: GOVERNER SCORE                         │
│ Agent: orchestrator (reads governer state)       │
│ Score the task. Dimensions determine which       │
│ verification types fire downstream.              │
│ Governer is the GATEKEEPER — score determines   │
│ whether human review is needed, NOT the          │
│ orchestrator's judgment.                         │
│ Output: governer score + dimensional breakdown   │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 1.5: DECLARE PERFECT                      │
│ Agent: orchestrator                              │
│ Before any implementation, declare what 10/10    │
│ realization of this task looks like — in UX      │
│ terms, with nuance proportional to the task's    │
│ complexity AND gravity (from governer dims).     │
│ This declaration:                                │
│   - Gets saved with the governer score           │
│   - Gets included in the oracle pre-query        │
│   - Serves as convergence gate success criterion │
│ Output: perfect-state declaration                │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 2: EVIDENCE BASELINE                      │
│ Agent: haiku (evidence-collector)                │
│ Capture current state BEFORE any changes.        │
│ For each file in the task's scope:               │
│   - grep for the pattern being changed           │
│   - record file contents at key line numbers     │
│   - run any relevant test suite, record output   │
│ Output: before-state artifact (structured)       │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 3: IMPLEMENT                              │
│ Agent: sonnet (implementer)                      │
│ Receives: full task description (verbatim intent │
│   + current reality + gap + approach + exact     │
│   file paths) + before-state artifact            │
│ Makes the changes. Produces a diff summary.      │
│ MUST source canonical functions where they exist.│
│ MUST NOT narrow scope without explicit statement.│
│ Output: list of files changed + diff summary     │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 4: EVIDENCE AFTER                         │
│ Agent: haiku (evidence-collector)                │
│ Same greps/tests as Stage 2, AFTER changes.      │
│ Produces before/after comparison showing what    │
│ actually changed.                                │
│ Output: after-state artifact + delta report      │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 5: CROSS-VERIFY                           │
│ Agent: sonnet (cross-verifier, INDEPENDENT)      │
│ Receives: ONLY the task intent + diff summary    │
│   Does NOT receive implementer's reasoning       │
│ Checks:                                          │
│   a) Does the diff match the task intent?        │
│   b) SYSTEMWIDE SCOPE CHECK — grep for the       │
│      same patterns across the ENTIRE codebase    │
│      to verify nothing was missed                │
│   c) Are there files the implementer should      │
│      have changed but didn't?                    │
│ Output: scope-complete / scope-incomplete +       │
│   list of missed locations (if any)              │
│ Evidence: actual grep output showing search       │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 6: ADVERSARY                              │
│ Agent: haiku (adversary)                         │
│ Receives: task intent + implementer's stated     │
│   constraints/assumptions                        │
│ Job: TRY TO DISPROVE every stated constraint.    │
│   - "Implementer says X doesn't exist" →         │
│     search codebase for X                        │
│   - "Implementer says this is the only way" →    │
│     search for alternative approaches            │
│   - "Implementer says scope is N files" →        │
│     grep systemwide for the same pattern         │
│ Output: disproof report — for each constraint,   │
│   CONFIRMED (couldn't disprove) or DISPROVEN     │
│   (found evidence contradicting the claim)       │
│ Evidence: actual search results, file paths      │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 7: ORACLE GATE                            │
│ Agent: haiku (oracle)                            │
│ Queries jonathan-check2 with:                    │
│   - The task intent (verbatim)                   │
│   - The implementation summary                   │
│   - The cross-verify report                      │
│   - The adversary report                         │
│ Question: "Would the user accept this            │
│   implementation? What would they challenge?"     │
│ Output: oracle verdict + specific challenges     │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│ STAGE 8: CONVERGENCE + CONSUMPTION              │
│ Orchestrator reads all three verification reports│
│                                                  │
│ CONVERGENCE LOGIC (NOT binary pass/fail):        │
│ For each verification agent, extract:            │
│   - Findings (specific, with evidence)           │
│   - Severity (how bad if unaddressed)            │
│   - Recommendation (proceed / revise / block)    │
│                                                  │
│ Decision matrix:                                 │
│   All three recommend PROCEED → task complete    │
│   Any BLOCK with severity >= 7 → back to         │
│     implementer with SPECIFIC ADDITIVE feedback  │
│     (what to ADD, not what's wrong)              │
│   REVISE recommendations → orchestrator judges   │
│     whether revision is needed or findings are   │
│     acceptable risks                             │
│                                                  │
│ CONSUMPTION (runs on every completed task):      │
│   - Translate changes to UX impact statement     │
│   - List exact files changed with line numbers   │
│   - If any URLs or endpoints affected, verify    │
│     they work (curl/haiku)                       │
│   - Print one-sentence summary for the human     │
│                                                  │
│ Max remediation rounds: 2                        │
│ After 2 failures → flag for human with evidence  │
└─────────────────────────────────────────────────┘
```

---

## Governer Dimension Routing

Stage 1 scores the task. The dimensions determine which verification stages get EXTRA attention:

| Dimension | If High (>= 7) | Extra Verification |
|---|---|---|
| touchesUserState | User-facing impact | Add UX Verify stage (haiku hits actual UI) |
| compoundAcrossSessions | Hallucination propagation | Double cross-verification (two independent agents) |
| couldBreakExisting | Regression risk | Regression test suite MUST run in evidence-after |
| spreadToOtherSystems | Blast radius | Adversary gets EXTENDED search scope (all repos) |

If governer score >= 50: implementer MUST produce a written mini-plan before coding.
If governer score >= 70: human reviews plan before implementation proceeds.

---

## Cross-Cutting Agents (Session-Persistent)

These agents are spawned once on the first `/execute` call and remain alive for the entire session. They are NOT recreated on subsequent `/execute` calls — they accumulate context.

### Scope Guardian

Spawned as a named teammate (`scope-guardian`) in the execute team. Registers the FULL task list at pipeline start and APPENDS new tasks when subsequent `/execute` calls add more work. Tracks:
- Which tasks have started (across ALL batches in this session)
- Which tasks are complete
- Which are blocked
- Overall completion percentage across the session

**BLOCKS "done" declaration** until ALL tasks are accounted for. If any task is skipped, the orchestrator must get explicit human approval.

Runs on a check cycle after each task completes. On new `/execute` calls, receives a message with the new task batch — does NOT restart from scratch.

### Compliance Auditor (Self-Healing, Session-Persistent)

Spawned as a **sonnet** named teammate (`compliance-auditor`) in the execute team. MUST be sonnet — haiku cannot read files or run commands, which makes verification impossible. A haiku auditor is a rubber stamp, not a verifier.

The auditor has two modes:

**Active verification mode:** When it receives investigator/implementer findings, it independently reads the actual files and line numbers cited, runs the commands referenced, and confirms or disputes each claim with its own evidence. It does NOT parrot back what it was told — it checks.

**Observational mode:** The orchestrator sends the auditor a copy of EVERY message it sends to the human. The auditor scans for:
- Claims stated as facts without certainty scores
- File paths or line numbers cited without evidence of having been read
- Investigator reports restated as verified findings
When it detects these, it sends the orchestrator a correction: "You stated X as fact — this is an unaudited investigator claim. Restate with certainty score or verify first."

Monitors every convergence gate outcome across ALL task batches in the session. When a gate FAILS:

1. **Diagnose:** Which stage produced the failure? What was the root cause?
2. **Immediate fix:** Route specific feedback to implementer for THIS task
3. **Design patch:** How should the stage prompt/instructions change to prevent this failure CLASS?
4. **Apply patch:** Update the stage instructions for ALL remaining tasks — including tasks from future `/execute` calls in this session
5. **Log:** Record the failure, diagnosis, and patch in the session-wide self-healing log

```
SELF-HEAL LOG — session {session-id}
| Batch | Task | Stage | Failure | Root Cause | Patch Applied | Prevents |
|-------|------|-------|---------|-----------|---------------|----------|
```

The log accumulates across the ENTIRE session. On new `/execute` calls, the compliance auditor applies all prior patches to the new task batch automatically. At session end, the log is written to a compaction so future sessions start with those learnings.

### Orchestrator Instinct: Unaudited Claims Get Certainty Scores

When reporting investigator or implementer findings to the human, lean toward routing through the compliance auditor first — because unaudited claims compound into hallucination cascades.

When the human needs speed and waiting for audit would block them, report findings immediately BUT:
- Label every claim as "investigator claims X (~N% confident — not yet audited)"
- Never present an agent's report as verified fact
- CC the compliance auditor on every message to the human so it can flag over-claims in real time

The instinct is: **certainty scores on everything, audit when possible, never state unverified claims as facts.** The human can always override and say "just tell me what you found" — the instinct adapts to that. What it prevents is the unconscious conflation of "an agent said it" with "it's true."

**Self-healing trigger:** If the compliance auditor catches the orchestrator reporting findings without certainty scores after the auditor was already available to check, log it and adjust: "Orchestrator skipped certainty labeling — add instinct reminder to next dispatch."

---

## Feedback Protocol (Principle 1: Always Additive)

When a verification agent finds an issue and feedback goes to the implementer:

**NEVER phrase as:** "You missed X" / "This is wrong" / "Fix Y"
**ALWAYS phrase as:** "The cross-verifier found 3 additional locations that also need this change: [list]. Please ADD these to your implementation."

The implementer receives:
- The original task description (unchanged)
- The ADDITIVE findings from verification
- The specific evidence (grep output, file paths)

The implementer does NOT receive:
- The full reasoning of the verification agents
- Any framing that implies the prior work was wrong
- Any instruction to replace or redo existing changes

---

## Dispatch Pattern

### Wave Execution

The orchestrator groups tasks into waves based on dependencies:

```
Wave 1: All independent tasks (dispatch in parallel)
  Each task gets its own 8-stage pipeline
  Stages are sequential within a task
  Tasks are parallel across the wave

Wave 2: Tasks that depend on Wave 1 outputs
  Dispatch only after blocking task completes

Wave 3: Tasks that inform future pipeline design
  (e.g., "design the adversarial mini-team" benefits from 
  observing how the pipeline performed on earlier tasks)
```

### Agent Naming Convention

Name by ROLE + TASK NUMBER:
- `implementer-1` (implements task #1)
- `cross-verifier-1` (cross-verifies task #1)
- `adversary-1` (adversary for task #1)
- `oracle-1` (oracle gate for task #1)
- `evidence-before-1` / `evidence-after-1`

### Background Dispatch

ALL agents dispatched with `run_in_background: true`. The orchestrator NEVER blocks. After each dispatch, the orchestrator reports status and remains available to the human.

### Sequential Stage Chaining

Within each task:
```
dispatch evidence-before-N → wait for completion → 
dispatch implementer-N (with before-state) → wait → 
dispatch evidence-after-N → wait → 
dispatch cross-verifier-N + adversary-N (parallel) → wait for both → 
dispatch oracle-N (with all reports) → wait → 
convergence decision
```

---

## Evidence Requirements Per Stage

| Stage | Required Evidence (not claims) |
|---|---|
| Evidence Baseline | Actual grep output, test results, file contents at specific lines |
| Implement | Git diff showing exact changes, list of files touched |
| Evidence After | Same greps as baseline showing changed state, test results |
| Cross-Verify | Systemwide grep output showing all locations of the pattern, count comparison |
| Adversary | Search results for each constraint disproof attempt, file paths found |
| Oracle | Jonathan-check2 response with citation count and specific challenges |
| Consumption | Curl output for any affected endpoints, UX statement per change |

An agent that says "I checked" without showing the check output FAILS the evidence requirement.

---

## UX Verify Stage (Conditional — fires when governer says touchesUserState >= 7)

When a task affects what users experience:

```
Agent: haiku (ux-verifier)
Action: Open the actual page/endpoint affected by the change
Check: Does the user see what the task intent says they should see?
Evidence: Screenshot or HTTP response body
```

This stage fires AFTER the implementer and BEFORE convergence. It is a SEPARATE stage, not part of cross-verify.

For infrastructure tasks (like our 6 tasks which are agent-infrastructure, not user-facing), this stage is SKIPPED with a note: "UX Verify skipped — task affects agent infrastructure, not user-facing UI."

---

## Consumption Handoff (Every Task)

After convergence passes, before marking a task complete:

1. **Translate to UX impact:** "When an agent starts a new session, the governer state from yesterday's session no longer blocks it — each session gets its own verification contract."
2. **List files changed:** Exact paths and line numbers
3. **Verify any affected endpoints:** If the change touches an API or UI, curl it
4. **One-sentence summary:** For the human's status view

This is NOT optional. It runs on EVERY task, even infrastructure ones. The human's experience of the pipeline output IS the quality.

---

## Self-Healing Protocol

When compliance catches a failure:

```
1. DETECT: Convergence gate blocked task N at stage X
2. DIAGNOSE: What specifically went wrong? (evidence)
3. ROOT CAUSE: Which stage design allowed this?
4. PATCH: What change to the stage prompt prevents recurrence?
5. APPLY: Update the stage instructions for remaining tasks
6. LOG: Write to self-healing log
7. VERIFY: Next task using this stage — did the patch work?
```

### Patch Categories

| Category | Approval | Example |
|---|---|---|
| Evidence requirement tightening | Auto-apply | "Adversary must also check skills directory" |
| Prompt refinement | Auto-apply | "Add 'search ALL file types' to implementer prompt" |
| Stage addition | Human review | "Need an extra pre-check stage for this task type" |
| Workflow routing change | Human review | "Change wave execution order" |

### The Positive Loop (Session-Scoped)

Within a session, each task batch produces:
- Completed tasks with evidence
- A self-healing log of what went wrong and what was patched
- Enriched stage prompts that prevent prior failure classes

The next `/execute` call in the SAME session inherits all of this automatically — the compliance auditor is still alive and already has the patches loaded.

At session end, the self-healing log is written to a compaction so the NEXT session can read prior learnings (though it starts with a fresh team).

---

## How to Invoke

```
/execute
```

**Session-persistent by default.** The first call creates the team. Subsequent calls feed new tasks into the same team.

Prerequisites for first invocation:
- TaskList exists with tasks that have full verbatim intent in descriptions
- Each task has: intent, current reality, gap, approach, exact files
- Dependencies between tasks are set via blockedBy

Prerequisites for subsequent invocations (same session):
- New tasks added to TaskList
- Team execute-{session-short-id} still exists (check before creating)

The orchestrator:
1. **First call:** Creates team via TeamCreate, spawns scope-guardian and compliance-auditor as named persistent teammates
2. Reads TaskList (new tasks only on subsequent calls)
3. Groups into waves by dependencies
4. Runs /governer on each task for dimensional scoring
5. Dispatches Wave 1 tasks in parallel (each with its own 8-stage pipeline)
6. Monitors completion, routes failures
7. Dispatches Wave 2 after dependencies clear
8. Reports status to human after each task completes
9. Scope Guardian blocks "done" until all tasks in the current batch complete
10. **Stays alive** — orchestrator remains available for the next `/execute` call or human direction

### Detecting Existing Team

On every `/execute` invocation, before creating a team:
```
Check: does team execute-{session-short-id} exist?
  YES → SendMessage to scope-guardian: "New task batch incoming: [task IDs]"
        SendMessage to compliance-auditor: "Apply all accumulated patches to new batch"
        Skip TeamCreate — use existing team
  NO  → TeamCreate, spawn persistent agents, proceed as first invocation
```

---

## Pipeline Feeds Itself (Principle 11)

After all tasks complete:
1. Review the self-healing log — what patterns emerged?
2. If a failure pattern appeared in 2+ tasks → create a new task to address the root cause
3. If the adversary found an existing solution nobody knew about → register it in the tooling registry
4. If the cross-verifier consistently found missed scope → tighten the implementer prompt permanently

These discoveries become the NEXT /execute payload — the pipeline feeds itself.

---

## Factory Metadata

```
Classification: IMPLEMENTATION, ACCURACY-constrained, MEDIUM STAKES
Failure patterns sourced from: this diagnostic session (6 real failure modes)
Alignment audit: 5 FAILs in v0 draft, all addressed in this version
  - P1 (additive feedback): Added feedback protocol section
  - P2 (no binaries): Convergence gate uses severity+recommendation, not pass/fail
  - P6 (UX verify): Added conditional UX verify stage
  - P7 (consumption handoff): Added per-task consumption section
  - P9 (governer dimensions): Added dimension routing table
  - P11 (feeds itself): Added pipeline-feeds-itself section
Research agent findings: 3 PARTIAL skills, 1 EXISTS, 2 GAPs
  - Gaps filled: evidence baseline protocol, adversary dispatch
  - Existing: scope guardian (full coverage)
Jonathan-check2: pending (Phase 5 of factory)
```

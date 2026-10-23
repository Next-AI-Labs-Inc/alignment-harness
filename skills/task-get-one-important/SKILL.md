---
name: task-get-one-important
description: Surface the single most critical proposable task from the current conversation — derives gap between user intent and reality, fills the full SessionCompaction incompleteItem proposal schema, and presents it in human terms.
trigger:
id: SK_1
---

# Task: Get One Important

## What This Skill Does

Scans the current conversation for the **single most salient, critical, recency-weighted, proposable task** — a gap between what the user wants and what reality delivers — and presents it as a fully-formed proposal with the complete schema filled in IF one exists, or marks convo clear if it does not. Shows full observability of each step.

A **proposable task** is a gap that could be addressed through a fix. Not a wish, not a vague improvement — a specific delta between intent and actuality.

## Execution Steps

### Phase 1 — Notice the Gap

1. **What does the user want?** — Derive the user's intended UX outcome from what they said, asked, or reacted to in this conversation. Use verbatim quotes where possible.
2. **What is reality?** — What actually happens today in the code, product, or system.
3. **Name the gap** — One sentence: "{intended outcome} but instead {actual outcome}."
4. **Scope the problem** — Ask: is this gap a symptom of something broader? What is the correct scope of the problem that creates this gap? Not the narrowest fix, not the broadest rewrite — the scope that eliminates the root cause without overreach.
5. **Evaluate the solution** — What would close this gap? Is it code, config, process, or communication? What's the simplest change that fully resolves it?
6. **Derive the UX intent** — Frame as: "When {user conditions}, they should {experience X}, so that {outcome Y}."

### Phase 2 — Fill the Schema

Print the **complete schema** as a JSON block. Every field must be filled — no nulls, no "TBD", no placeholders. If you genuinely cannot determine a field, write `"unknown — requires: {what you'd need to find out}"`.

The schema maps to `SessionCompaction.incompleteItems[]` from the harness's local compaction records (`alignment-harness compaction get`):

```json
{
  "title": "...",
  "content": "Full description of the gap and proposed fix",
  "status": "proposed",
  "priority": 1-100,

  "intentStatement": "When {conditions} the user should {experience} so that {outcome}",
  "domain": "e.g. agent-alignment, hooks, coaching, auth, billing, frontend, backend",
  "verbatimUserQuote": "Exact quote from user in this conversation proving intent existed",
  "extractionConfidence": "low | medium | high",
  "generatedBy": "opus",

  "humanImpact": {
    "affectedUsers": "Who specifically is affected and what journey triggers it",
    "currentExperience": "What they see/experience today (1 sentence)",
    "fixedExperience": "What they'd see/experience after the fix (1 sentence)",
    "changesByUserType": "What changes for each user type"
  },

  "currentStateVerification": {
    "verifiedAt": "ISO timestamp or 'not yet verified'",
    "verifiedStillBroken": true,
    "verificationMethod": "How you confirmed the gap still exists (code read, test, curl, browser)",
    "verificationNote": "What you observed"
  },

  "nextStep": "The specific, actionable next step to close this gap",
  "blockers": "What's blocking it, or 'none'",
  "complexity": 1-100,

  "evidence": {
    "screenshots": [],
    "verificationNote": "What you observed that proves the gap"
  },

  "before": "What exists today (code, behavior, or state)",
  "after": "Exact replacement or new behavior",
  "evidenceOfAlignment": "Quotes or signals from user confirming this is wanted",
  "evidenceOfFix": "Measurable outcome after applying the fix",

  "linkedIntentIds": ["IX-### IDs this serves, if known"],
  "linkedSystemLogIds": ["SystemLog ObjectIds, if known"]
}
```

### Phase 3 — Present in Human Terms

After the schema, speak plainly:

> **What I'd propose:** {one sentence — what you'd do}
>
> **Why:** {one sentence — the gap it closes, in terms of what the user actually experiences}
>
> **Skill ID:** SK_1

## Weighting Criteria

When multiple gaps exist in a conversation, pick the one that scores highest across:

| Signal                                                                         | Weight |
| ------------------------------------------------------------------------------ | ------ |
| **Recency** — surfaced late in conversation (recent frustration > old mention) | 30%    |
| **Criticality** — blocks the user or degrades their core experience            | 30%    |
| **Proposability** — can be stated as a concrete before/after with a clear fix  | 25%    |
| **Salience** — the user reacted emotionally or repeated themselves about it    | 15%    |

## Rules

- **One task only.** If you surface two, you picked wrong. Commit to the highest-signal one.
- **Verbatim quotes are mandatory.** If the user didn't say anything quotable about this gap, your confidence should be `low`.
- **Verify before claiming.** If you say `verifiedStillBroken: true`, you must have read code, run a command, or observed behavior. If you haven't verified, say so in `verificationMethod`.
- **Never propose what's already fixed.** Check if the gap was resolved during this conversation before surfacing it.
- **Complexity is effort, not importance.** A 95-priority item can be complexity 5 (easy fix, huge impact).

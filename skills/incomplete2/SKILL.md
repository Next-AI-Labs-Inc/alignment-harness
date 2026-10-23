---
name: incomplete2
description: Surface unfinished work from the current Claude session transcript and print it to the user in the user's own voice for approval. Sonnet does the analysis. Nothing is written to any database — the user decides what happens to each item.
triggers:
  - "/incomplete2"
  - "what did we not finish"
  - "what's still open in this session"
  - "surface unfinished session work"
---

# Surface Incomplete Work — User-Facing (INCOMPLETE2)

Before your output, print `## INCOMPLETE_TASKS` on its own line.

**What this is:** the user reads what's unfinished, in language the user doesn't have to translate, and decides. That's the whole thing.

**The core principle:** the transcript JSONL on disk is the source of truth. Not agent memory, not a compacted summary, not what the agent thinks happened. The actual file.

## What changed from `/incomplete`, and why (user-directed 2026-07-14)

- **Sonnet, never Haiku.** The user's judgment on Haiku's output for this work: "those like." This analysis is reading the user's intent out of the user's own words — the cheap tier flattens exactly the nuance that makes the output worth reading.
- **No database write. At all.** `/incomplete` ended by POSTing items into a session compaction. The user's judgment: "the quality there is." So persistence is absent from this skill — not defaulted off, not behind a flag. An agent running this has nowhere to file anything, which means the only place the work can go is in front of the human. If the user wants something persisted, the user says so, and that's a separate act with the user's hands on it.
- **User-voice formatting is the deliverable.** Each item comes to the user through `/how-to-talk-like-the-founder`, `/on-talking-about-code`, and `/speak-human`. A raw field dump makes the user do the translation work — which is the work being delegated to the agent in the first place.

## Step 1 — Extract the transcript (programmatic, no AI)

**Run this. Do not reason about what it would return.**

```
bash "${CLAUDE_PLUGIN_ROOT}/skills/incomplete-tasks-get-from-session/run_extract.sh"
```

It reads the session's JSONL and returns `session_uuid`, `user_messages_verbatim` (in order), `tasks_created`, `tasks_completed`, `incomplete_tasks`, and `tool_summary`.

If the output is large, parse the fields you need with python3 rather than dumping the blob.

**Note:** `incomplete_tasks` reflects the TaskList only. A session with zero tasks created has an empty array and still has unfinished work — it lives in the user's messages. The verbatim messages are the real source; the task array is a convenience.

## Step 2 — Dispatch Sonnet with the transcript pre-loaded

Dispatch with `model: 'sonnet'`, `run_in_background: true`. Paste the extracted `user_messages_verbatim` and `incomplete_tasks` INTO the prompt — the subagent reads no files and hits no APIs.

```
You are reading the verbatim transcript of a session between the user (the user) and an agent.

INPUT (provided below by the caller — do not fetch anything yourself):
- The user's messages, verbatim, in order
- Tasks created during the session, if any

Your job: identify what the user asked for that is NOT yet done.

Rules:
- Use ONLY the user's actual words. Never rephrase a request into a cleaner form — the rephrasing IS the loss.
- Quote the exact sentence where the user asked for each thing.
- Something the user asked for with no corresponding task is still incomplete work — surface it.
- A thing the user asked for, that got done, is NOT incomplete. Check the evidence before listing it.
- If you are unsure whether something landed, say so in `evidence` rather than guessing either way.

Return a JSON array, nothing else:
[
  {
    "adminQuote": "the exact sentence where the user asked for this",
    "intentTitle": "one sentence that triggers instant recall for the user — what the user said, tied to why it mattered",
    "intent": "the precise, context-bound outcome the user wants: who experiences it, what they see, what changes from today. No generalizing, no abstracting.",
    "evidence": "files edited, commands run, writes made that relate — or 'no evidence found'",
    "status": "not_started | in_progress | blocked",
    "priority": 60,
    "whats_missing": "the specific gap between the user's intent and where things actually are",
    "risks": "what could go wrong if this gets built wrong, in terms of what a person would experience — or null",
    "riskAbatement": "for each risk, the specific thing that prevents it — or null"
  }
]
```

## Step 3 — Print each item to the user, in the user's voice

Load `/how-to-talk-like-the-founder`, `/on-talking-about-code`, and `/speak-human` before writing this section. Do not skip them because the fields look ready to paste — they are not.

For each item, the user needs to see, without asking a follow-up question:

- **The user's own words, verbatim and quoted.** Never your cleaned-up version of what the user meant.
- **What you understand the intent to be** — the UX outcome, who experiences it, what changes.
- **Where it actually stands**, grounded in evidence you can point at. If nothing was done, say nothing was done.
- **What's missing** — the specific gap, not a restatement of the title.
- **What could go wrong** if it gets built wrong, in terms of what a person would experience, and what prevents that. Skip when there's no real risk rather than manufacturing one.

Any code reference obeys `/on-talking-about-code`: fused with the literal conditions and the user journey that makes it true, or left out.

End with the decision in front of the user: which of these the user wants picked up, and in what order. The user decides. Nothing is filed, queued, or written anywhere by this skill.

## Rules

- **The JSONL on disk is the source of truth.** Not memory, not summaries.
- **Sonnet, never Haiku**, for the analysis pass.
- **Never summarize the user's words.** `adminQuote` is a direct quote. If you can't quote it, you don't have it.
- **Never write to a database.** Not `/coaching-compactions` — that collection is user-facing product data and agents must never touch it. Not `sessioncompactions` either. This skill's output goes to the user's screen and stops there.
- **Never claim something is done without evidence you can name.** "I believe it landed" is not evidence.
- **Say what you don't know.** An item you can't determine the state of gets said as exactly that.

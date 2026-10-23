---
name: workflow-extract-from-session
description: "Extract a reproducible workflow from the current session's methodology. Use when a session produced a breakthrough result and you want to capture the exact steps, corrections, and quality gates into a permanent skill that any future agent can invoke. Invoke when the user says 'capture this', 'make this reproducible', 'I don't want to lose this', or 'extract this into a workflow'."
triggers:
  - "capture this workflow"
  - "make this reproducible"
  - "extract this into a workflow"
  - "workflow-extract-from-session"
  - "don't lose this methodology"
---

# Extract Workflow from Session

## Why This Skill Exists

Sessions produce breakthroughs — an agent figures out how to communicate intent correctly, or discovers a methodology that finally produces output the user can validate instantly. But that methodology lives in the session's context. When the context gets compacted, the breakthrough is reduced to a summary. The next agent reads "use /speak-human" but doesn't know the specific corrections that made it work. The quality degrades back to the baseline.

This skill exists to capture the exact methodology — including the user's verbatim corrections as quality gates — into a permanent, reproducible workflow that any future agent can invoke and get the same quality output.

## The Sequence

When invoked, run these steps in order. Each one builds on the previous.

### Step 1: /reflect

Reflect on what was accomplished in this session. Identify:
- What was the breakthrough? What shifted?
- What specific corrections from the user drove the shift?
- What was the wrong output before each correction?
- What was the right output after?
- What sequence of steps produced the final approved result?

### Step 2: /align

Confirm the intent of the extraction with the user:
- What exactly should the workflow reproduce?
- Which parts are specific to this session vs generalizable?
- What quality level does the output need to match?
- Present the intent map with checkboxes for the user to validate

### Step 3: boost

After alignment is confirmed, predict and fill gaps:
- What edge cases would break the workflow?
- What auditing agents are needed at each step?
- What verbatim corrections should become validation rules?
- Query /insight or `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` for related institutional knowledge

### Step 4: /plan

Create a technical plan for the workflow:
- Define each step with inputs, outputs, and quality gates
- Map user corrections to specific auditing agent prompts
- Design the wrong→right test fixtures from session examples
- Determine which model each auditing agent should use (haiku for mechanical checks, sonnet for nuance)

### Step 5: /workflow-design

Design the full workflow as a skill file:
- The skill file itself with frontmatter and triggers
- Embedded auditing agent prompts for each quality gate
- The wrong→right examples as inline test fixtures
- The consumption pattern (how the user reviews the output)
- The trace key for finding all invocations

## What Makes This Different from Just Writing a Skill

A normal skill says "do X." This workflow captures WHY X works — the specific failure modes that were discovered, the exact corrections that fixed them, and the auditing agents that prevent regression. The user's verbatim words ARE the quality standard. Not a paraphrase. Not an interpretation. The actual words they used when something was wrong, preserved as the validation criteria.

## Intent of This Workflow (confirmed by the user Apr 14, 2026)

The user approved these intent statements during the /align step of the first extraction:

- A single workflow that reproduces the exact methodology that produced an approved document — not just the steps, but the quality gates derived from the user's actual corrections
- The user's verbatim corrections become validation rules — each one is a specific failure mode that an auditing agent checks before the output reaches the user
- Auditing agents validate each step independently — sequencing, variable name translation, intentionality statements, reader-guessing prevention
- Wrong→right transformations from the session become test fixtures — concrete examples auditing agents compare against, not abstract rules
- This becomes a skill any future agent can invoke to produce the same quality output without needing the original session's context
- Once the workflow exists, the user can work freely without worrying about compaction destroying the methodology

## Feedback Loop

If a future session invokes this workflow and the output doesn't match the quality of the original session's approved output, that's signal. The auditing agents need to be refined, or a new correction needs to be added as a quality gate. Report what failed and what the user's correction was — that becomes a new test fixture.

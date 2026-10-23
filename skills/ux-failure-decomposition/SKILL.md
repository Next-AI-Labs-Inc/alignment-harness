---
name: ux-failure-decomposition
description: Consume the nested intent map for a product, derive every way each intent could fail in actual use, decompose into concrete validation tasks that return with deterministic evidence. The skill that asks "does this actually work for real?" — not "does the code exist?"
---

# UX Failure Decomposition

When invoked, immediately print:

```
★ UX_Failure_Decomposition ──────────────────────
For each intent: what are ALL the ways this could fail in real use?
```

## What This Skill Does

You take a seed document with nested UX intents and you INVERT each one. Instead of "when the person does X, they experience Y" you ask "what are all the ways X could fail to produce Y?" Then you create a concrete task for EACH failure mode that validates whether it actually happens, with deterministic evidence.

This is the missing consideration the user identified: "I'm looking at the finished product against the initial intent and I don't see you doing that."

The output is 10-15+ validation tasks, each of which:
- Names a specific failure mode in human terms
- Describes the exact test to run
- Defines what PASS looks like (with specific evidence)
- Defines what FAIL looks like
- Can be executed by an agent and return a deterministic result

## Process

### Step 1: Read the Seed

Read the active seed document. Extract every UX intent statement. These are your test targets.

### Step 2: For Each Intent, Derive Failure States

For each intent, ask these questions:
1. **Infrastructure failure**: Does the underlying system even work? (e.g., "does Whisper actually transcribe when given audio?")
2. **Integration failure**: Do the pieces connect? (e.g., "does audio capture output feed into transcription input?")
3. **Real-world failure**: Does it work in actual use, not just in test mode? (e.g., "does it detect a REAL Zoom call, not just a pgrep test?")
4. **UX failure**: Even if it works technically, does the person experience what the intent describes? (e.g., "are the suggestions actually helpful, or generic?")
5. **Edge case failure**: What breaks under non-ideal conditions? (e.g., "what happens when Zoom hasn't started yet?")
6. **Silent failure**: What fails without anyone knowing? (e.g., "does audio capture fail silently and you think it's recording but it's not?")

### Step 3: Create Validation Tasks

For each failure mode, create a task using TaskCreate with:

**Subject**: "{Intent} — FAIL IF: {specific failure in human terms}"

**Description** must include:
- The seed intent being validated (verbatim)
- The specific failure mode being tested
- The EXACT commands or steps to run the test
- What PASS looks like (specific output, file existence, content check)
- What FAIL looks like (specific symptoms)
- How to capture evidence (screenshot, curl output, file check, Playwright)

### Step 4: Prioritize by Blast Radius

Order tasks by: if this fails silently, how bad is it?
- Audio capture not working = user thinks they're recording but nothing is saved = CATASTROPHIC
- Suggestions being generic instead of framework-specific = product feels like every other meeting recorder = HIGH
- Scroll bug = annoying but not trust-destroying = LOW

### Step 5: Create Evidence Collection Commands

Each task should include a bash command or Playwright script that can be run to produce deterministic evidence. Not "check if it works" — a specific command that outputs PASS or FAIL.

Example:
```bash
# INTENT: Zoom detection finds active calls
# TEST: Is Zoom running right now?
pgrep -x "zoom.us" > /dev/null 2>&1 && echo "PASS: Zoom detected" || echo "FAIL: Zoom not detected"
```

```python
# INTENT: Copilot shows suggestions after transcript input
# TEST: Post transcript, wait, check suggestions
from playwright.sync_api import sync_playwright
# ... specific test code
```

## Output Format

Print each task before creating it:

```
FAILURE MODE {i}/{total}:
  Intent: "{seed intent verbatim}"
  Fails when: {specific failure description}
  Test: {what to do}
  PASS: {specific evidence}
  FAIL: {specific evidence}
  Blast radius: {CATASTROPHIC | HIGH | MEDIUM | LOW}
  Evidence command: {bash/python command}
```

Then create it via TaskCreate.

## After All Tasks Created

Print summary:
```
Created {N} validation tasks
  CATASTROPHIC: {count}
  HIGH: {count}
  MEDIUM: {count}
  LOW: {count}

Run them with: dispatch agents for each task, collect evidence, report back
```

## Integration with Alignment Guardian

After creating tasks, the alignment guardian should monitor:
- Are validation tasks being completed with evidence?
- Are any tasks returning FAIL?
- Is the agent treating FAIL results as blockers or ignoring them?

## When to Invoke

- After any /execute pass completes
- Before declaring a product "done"
- When the user says "does this actually work?"
- When the governer scores >= 60 and the product touches user experience

---
name: feature-completion-ux-test
description: "End-to-end product UX validation workflow. Use when confirming a change is truly complete: define intended UX, set conditions, execute the action, inspect request payloads, and verify admin logs (session diagnostics, pulse, the user notifications, system logs). Requires referencing $how-to-log-to-each-internal-log."
---

# Feature Completion UX Test

## Rule
For each change: define intended UX → set conditions → perform action → verify logs → report → commit.

## Workflow
1) Identify the exact intended UX change.
   - State the user-facing expectation in one sentence.
   - State the system expectation in one sentence (what should be logged where).

2) Set test conditions.
   - Use auto-login if available (see $how-to-log-to-each-internal-log).
   - Pick the correct user type (admin vs non-admin).
   - If simulating non-authenticated, log in as admin and use admin tools to simulate.

3) Execute the action.
   - Recreate the exact scenario (e.g., select preset, send message).
   - Capture the request payload in DevTools for the action.

4) Verify logs.
   - Use the correct admin surface:
     - Session diagnostics for session-scoped events.
     - Pulse logs for pulse flows.
     - The user notifications for the user alerts.
     - System logs for general errors/warnings.
   - Confirm payload fields match intent.

5) Decide outcome.
   - If correct: document evidence and commit the change.
   - If incorrect: fix and repeat this workflow.

## Report Format
- Intended UX:
- Conditions set:
- Action performed:
- Payload evidence:
- Log evidence:
- Result: pass/fail

## Note
Always reference log verification via $how-to-log-to-each-internal-log.

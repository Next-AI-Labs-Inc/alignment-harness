---
name: init
description: Bootstrap a session by activating orchestrator mode, confirming governer calibration, and arming declare-scope — all in one command. Use at the start of any session instead of running /orchestrator, /governer, and /declare-scope separately.
triggers:
  - "/init"
  - "session init"
  - "bootstrap session"
  - "initialize session"
  - "start session protocol"
---

# Session Bootstrap — /init

One command. Three layers armed. Session ready.

## What this does

Chains the three mandatory session protocols in order:

1. **Orchestrator** — activates non-blocking dispatch mode, hard gates, background-only agent rules
2. **Governer** — confirms scoring pipeline calibration (all phases: score → meta → verification contract → best-fit skill → execute → speak-human → summary)
3. **Declare-scope** — arms intent decomposition, ready to fire on first real task

## How to run

Invoke each skill in sequence using the Skill tool. Do NOT read their full contents — just activate them. Then print the combined ready state.

### Step 1 — Orchestrator

Invoke the `orchestrator` skill with args `"say ready"`.

Print output verbatim. It will print:
```
🟢 Hard Gates Active
⚡ All dispatches run in background. I stay available to you.
```

### Step 2 — Governer

Invoke the `governer` skill with args `"confirm calibrated"`.

It will confirm all pipeline phases are loaded. Print confirmation.

### Step 3 — Declare-scope

Invoke the `declare-scope` skill with args `"confirm this system loaded"`.

It will confirm intent decomposition is armed.

### Step 4 — Print combined ready state

After all three confirm, print exactly:

```
🟢 Session armed — orchestrator + governer + declare-scope active
Ready. What do you need?
```

## Rules this session now enforces

- **NON-BLOCKING — ABSOLUTE, NO EXCEPTIONS**
  - NEVER use Bash, Edit, Write, or Read tools for implementation work
  - NEVER call the Agent tool without `run_in_background: true`
  - ALWAYS dispatch → immediately say "What else, the user?"
  - "It's a small task" is not an exception. There are no exceptions.

- **Governer scores every task** before any code is written
- **Declare-scope** fires on every non-trivial task to post decomposed intent to Intent DB
- **No foreground blocking** — the orchestrator stays available to the user at all times

## What NOT to do

- Do not re-read the full orchestrator, governer, or declare-scope skill files — token waste
- Do not run any implementation commands during init
- Do not ask clarifying questions — just arm the three layers and print ready

---
name: agent-debug
description: "Print a diagnostic overview showing what hooks fired, what got injected into context, what's silent, and what's shaping agent behavior — before every response. Use when the user wants to see what's actually happening behind the scenes."
triggers:
  - "/agent-debug"
  - "diagnostic mode"
  - "debug mode"
  - "show me what's happening"
  - "what's shaping you"
---

# Agent Debug — Diagnostic Visibility Mode

When this skill is loaded, you are in diagnostic mode for the rest of the session.

Before EVERY response you give (not just the first one — every single one), print the diagnostic block below. This is the first thing the user sees before your actual reply. It shows them what's happening behind the scenes so they can evaluate what's useful and what's noise.

## What to Print

Print this block before every response:

```
🔬 DIAGNOSTIC — This Turn
```

Then for each of these, show what ACTUALLY happened this turn — not what the code says should happen, what actually happened. If something produced no output, say so. If something is broken, say so. If you can see the literal text that was injected, show a short excerpt (first 2-3 lines, not the whole thing).

### 1. UserPromptSubmit hook

Check the telemetry log for the most recent entry:
```bash
tail -5 "$(alignment-harness paths | sed -n 's/^data: //p')/telemetry.jsonl" | grep "UserPrompt"
```

Show whether it fired, whether it scored or skipped, and if it skipped show why (wordCount, reason). If it scored, show the score. Example output:

```
UserPromptSubmit: SKIPPED (wordCount=0) — no enrichment reached agent
```
or
```
UserPromptSubmit: SCORED 42/100 — governer gate + coherence check + agent_find injected
```

### 2. Coherence gate

Check if the gate file exists:
```bash
ls -la "$(alignment-harness paths | sed -n 's/^data: //p')"/state/coherence/required-* 2>/dev/null || echo "not present"
```

Show whether the gate was created (meaning the coherence check text was injected and tools are blocked until you clear it) or not created (meaning the hook skipped and no gate exists).

```
Coherence gate: NOT CREATED (hook skipped before reaching this step)
```
or
```
Coherence gate: ACTIVE — tools blocked until understanding stated and gate cleared
```

### 3. Governer state

Check the state file:
```bash
alignment-harness status
```

Show the current score, when it was last written, and whether it came from the API or a fallback default. If the file is stale (timestamp more than 1 hour old), flag that.

```
Governer: score 50 (fallback default) — last written 2026-04-06T22:43Z (STALE - 7 days ago)
```

### 4. System reminders

Count how many system-reminder blocks you received this turn. You can see these — they're the `<system-reminder>` tags in your context. Count them and note what each one contains (skill list, explanatory style reminder, task reminder, etc). Show a 1-line summary of each.

```
System reminders this turn: 3
  - Skill list (200+ skills from plugins)
  - "Explanatory output style is active"
  - "Task tools haven't been used recently" 
```

### 4.5. Ghost injections (CRITICAL — the user cannot see these)

These are blocks of text injected by hooks into your context that appear alongside the user's message but were NOT typed by the user. The user CANNOT see them in the UI — they are invisible to everyone except you. This is the primary source of agent drift: ghost injections that look like human instructions but aren't.

For EACH distinct injected block you received this turn, print:

```
GHOST {n}: <{tag_name}> — {one sentence describing what this injection tells you to do}
  Intent: {why this injection exists — what alignment problem it was designed to solve}
  First 3 lines: {literal first 3 lines of the injected text, verbatim}
  Source: {which hook file produces this — user-prompt-enrich.sh, stop-complete-agentic-task.sh, etc}
```

Known ghost injection types to check for:
- `[coherence_check start]` — from user-prompt-enrich.sh, forces intent restatement before tool use
- `<governer-alignment-gate>` — from user-prompt-enrich.sh, mandatory understanding declaration
- `<task-tracking-gate>` — from user-prompt-enrich.sh, task creation directive
- `<verification-contract-gate>` — from user-prompt-enrich.sh, UX intent decomposition requirement
- `<institutional-context>` — from user-prompt-enrich.sh, agent_find search results (optional context)
- `<slash-command-tracking>` — from user-prompt-enrich.sh, detected /commands to invoke (CURRENTLY DISABLED — was generating phantom commands from system metadata)
- `<Agent Reflection On Scope>` — from user-prompt-enrich.sh, prior scope declaration
- `<correction-patterns-active>` — from stop-complete-agentic-task.sh, correction directives from the patterns API
- `<scope-certainty-gate>` — fires when scope certainty < 90%
- Any other `<tagged-block>` you see that wasn't in the user's typed message

If you received NO ghost injections, say so explicitly — that itself is diagnostic (means enrichment hook didn't fire).

```
Ghost injections this turn: 4
  GHOST 1: [coherence_check] — forces 6-question alignment gate before tool use
    Intent: prevent agents from acting on misunderstood instructions
    First 3 lines: "[coherence_check start] / Before any tool calls or work, communicate explicitly..."
    Source: user-prompt-enrich.sh
  GHOST 2: <governer-alignment-gate score="42"> — mandatory A/B/C understanding declaration
    Intent: force agents to declare what they think the human wants before building
    First 3 lines: "MANDATORY FIRST RESPONSE — STATE YOUR UNDERSTANDING..."
    Source: user-prompt-enrich.sh
  ...
```

### 5. Skill files — what's loaded and how

Break this into three parts:

**Auto-loaded this turn** — any skill files that were loaded without the user explicitly asking. This includes skills triggered by hooks, plugins, or by the superpowers system telling you to invoke something. If nothing was auto-loaded, say "none."

```
Auto-loaded this turn: using-superpowers (SessionStart plugin)
```

**Manually loaded this turn** — skill files the user explicitly invoked with /commands or that you loaded via the Skill tool because the user asked you to.

```
Manually loaded this turn: agent-debug (the user said /agent-debug)
```

**All skills loaded this session (running total)** — every skill that's been loaded at any point during this session, in order. This accumulates across turns.

```
Session skill history: reflect → align → align (2nd) → gap → agent-debug
```

### 6. Static context

One line each for the big static files. Don't print their content — just confirm they're loaded and roughly how much space they take:

```
Static context:
  - CLAUDE.md: loaded (~800 lines)
  - MEMORY.md: loaded (~200 lines) 
  - AGENTS.md: loaded (~150 lines)
```

### 7. Anything unexpected

If you notice anything in your context that doesn't fit the categories above — an injected tag you don't recognize, a system message that seems new, a plugin doing something you haven't seen before — flag it here. If nothing unexpected, say so.

```
Unexpected: nothing this turn
```
or
```
Unexpected: received <session-compaction> tag — scope injection is working despite hook showing skipped
```

## Format

Keep the whole diagnostic block tight. The user wants signal. Each line should be one thing, one status. No paragraphs. No analysis. No opinions about what should be different. Just what IS.

After the diagnostic block, print a horizontal rule (---) and then give your actual response to the user's message.

## Rules

- Print this EVERY turn. Not just the first one. Every single response starts with the diagnostic.
- Run the bash checks (telemetry, coherence gate, governer state) in parallel to keep it fast.
- Do NOT add interpretation. "Hook skipped" is diagnostic. "Hook is broken and this means alignment is degraded" is interpretation — don't add it.
- Do NOT skip the diagnostic because the message seems trivial. Even "hey" gets the diagnostic. That's the point — you see what fires on every kind of message.
- If running the bash checks would slow things down noticeably, you can read from your most recent check and note "(cached from last check)" instead of re-running.

---
name: verify
description: Outcome-first verification protocol. Forces the agent to define what the OUTCOME looks like in measurable terms BEFORE gathering any evidence. Blocks the failure pattern of substituting mechanism-evidence (hook is configured, file exists, command runs) for outcome-evidence (the thing the human wants to be true is actually happening). Use whenever asked to check if something is working.
triggers:
  - "/verify"
  - "is it working"
  - "check if it's working"
  - "verify that"
  - "prove it"
  - "get evidence"
  - "confirm it's working"
---

# /verify — Outcome-First Verification

## The Failure This Skill Exists To Prevent

When asked "is X working?", agents default to finding the first thing that is *about* X and presenting it as evidence *of* X.

- Config file says it's enabled → "yes it's working"
- Hook fires → "yes it's working"
- Command runs without error → "yes it's working"

None of those are evidence the outcome is happening. They are evidence the mechanism exists. Those are different things.

**The rule:** You cannot present evidence until you have first defined what the outcome looks like in measurable terms. Evidence must be of the outcome, not the mechanism.

---

## Protocol — Run Every Step In Order

### Step 1 — Define the outcome in measurable terms BEFORE touching any tools

Print this block and fill it in completely before running a single command:

```
VERIFY PROTOCOL STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THING BEING VERIFIED: [what the human asked about]
INTENT: [what the human wants to be true — in outcome terms, not mechanism terms]
EVIDENCE WOULD LOOK LIKE: [specific, measurable, observable output that proves the intent is fulfilled]
WHAT I WILL NOT ACCEPT AS EVIDENCE: [list the mechanism proxies that are tempting but wrong]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do not proceed to Step 2 until this block is complete and honest.

**Self-check before proceeding:** Is "EVIDENCE WOULD LOOK LIKE" stated in terms of what the human wants to experience or observe — not in terms of what the system does internally? If it describes internal system state (logs, config, hook fires), rewrite it until it describes the observable outcome.

---

### Step 2 — Gather only the evidence defined in Step 1

Run the minimum commands needed to produce exactly the measurement you defined. Not related measurements. Not broader context. The specific thing.

If you find yourself running a command that produces mechanism-evidence (config reads, existence checks, "hook is registered" type checks), stop and ask: does this directly measure the outcome I defined? If not, don't use it.

---

### Step 3 — Compare and report honestly

Print this block:

```
VERIFY RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVIDENCE GATHERED: [literal output — show the actual data, not a description of it]
MATCHES INTENT: yes / no / partial
IF PARTIAL OR NO: [exactly what is missing or wrong]
CONFIDENCE: [%] — [why]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Rules for the result block:**
- "EVIDENCE GATHERED" must show literal output, not a description of output
- "MATCHES INTENT" must be yes, no, or partial — never "probably" or "appears to"
- If the evidence doesn't conclusively answer the question, say "INCONCLUSIVE" and explain what measurement would close the gap
- Never rationalize a "no" into a "yes" by explaining why the no doesn't count

---

## Examples

### Bad (mechanism-evidence)
> "The RTK hook is configured in settings.json with `RTK_BASH_COMPRESSION_ENABLED=true`. The hook script calls `rtk hook claude`. The hook is firing because the gain counter shows entries. RTK is working."

Why it's wrong: none of that measures whether output tokens are actually reduced.

### Good (outcome-evidence)
```
VERIFY PROTOCOL STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THING BEING VERIFIED: RTK token compression
INTENT: output that arrives back to me is shorter when RTK is active than without it
EVIDENCE WOULD LOOK LIKE: character count of a verbose command's output is lower through RTK than via rtk proxy (bypass)
WHAT I WILL NOT ACCEPT AS EVIDENCE: config files, hook firing, command renaming, gain counter existing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[runs: raw=$(rtk proxy git log --oneline -50); filtered=$(rtk git log --oneline -50); compare char counts]

VERIFY RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVIDENCE GATHERED: raw=4116 chars, filtered=4116 chars, difference=0
MATCHES INTENT: no
IF NO: Output is identical. RTK is routing commands but not compressing output for this command type.
CONFIDENCE: 95% — both measurements from same command, same session, direct comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## When To Invoke This Skill

- Any time the human asks "is X working?", "check if X is working", "is X running?", "does X work?"
- Any time you are about to present verification results
- Any time you feel confident something is working — that feeling is exactly when this skill is most needed
- Before writing "confirmed", "verified", "working", "active", "live" about any system behavior

## The Core Discipline

The question is never "does evidence exist that X is related to this?" The question is always "does this evidence prove the outcome the human wants is happening?" If you cannot draw a straight line from the evidence to the outcome, the evidence doesn't count.

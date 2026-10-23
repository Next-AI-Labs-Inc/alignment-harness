---
name: error-fix-safety-eval
description: Safety evaluation for error log fixes — classifies fix risk and determines if autonomous or human-approved. U
  hours of rollback when an "obvious" fix breaks a payment flow.
triggers:
  - "error fix safety"
  - "safe error fix"
  - "fix evaluation"
  - "error fix risk"
---

# Error Fix Safety Evaluation

When you find a system log error and understand the root cause, run this
evaluation BEFORE writing code. The goal: never break a user's experience
to fix a log entry.

## Why This Matters

Error logs are symptoms. Fixes change code. Code changes have blast radius.
A null guard on a non-critical path is free. A null guard on a payment
webhook can silently eat charge failures. Same pattern, wildly different
risk. This framework forces you to think about WHERE, not just WHAT.

## Step 1: Classify the Fix Type

Read the fix you're about to make and classify it into exactly one category:

| Category | What it means | Examples |
|----------|--------------|----------|
| **Defensive addition** | Adds a guard/catch on a path that currently crashes. Existing success path unchanged. | try-catch around API call, null check before property access, fallback default value |
| **Dead code removal** | Removes code that provably does nothing. No execution path changes. | Self-referencing map entry (A -> A), unreachable branch, no-op fallback |
| **Declaration reorder** | Moves existing code earlier/later. No logic change. | Fix TDZ by moving const above useEffect, reorder imports |
| **Presentation only** | CSS, copy, layout. No data flow change. | Centering a modal, changing a label, adjusting padding |
| **Log suppression** | Tightens the condition under which an error/warning is logged. UX unchanged. | Only log when data is fully loaded, skip log for known-transient states |
| **Behavioral change** | Changes what the code DOES — different return values, different control flow, different API responses. | Changing a gate condition, modifying a response shape, altering auth logic |
| **Data flow change** | Changes what data moves where — new params, different DB writes, altered event payloads. | Adding a parameter to a function, changing what gets saved to DB |

## Step 2: Identify the Blast Radius

Where does this code run in the user journey?

| Zone | Risk level | Examples |
|------|-----------|----------|
| **Auth/payment** | CRITICAL | Login, registration, token refresh, Stripe webhooks, subscription checks, access tier resolution |
| **Core product** | HIGH | Coaching session send/receive, conversation creation, AI response streaming |
| **Enrichment** | LOW | Analytics, step tracking, experiment lookups, metadata fetching |
| **Admin/internal** | MINIMAL | Admin UI, agent tooling, internal logs, dev-only features |
| **Presentation** | MINIMAL | CSS, layout, copy, visual-only components |

## Step 3: Apply the Decision Matrix

Cross-reference fix type with blast radius:

| Fix Type \ Zone | Auth/Payment | Core Product | Enrichment | Admin/Internal | Presentation |
|----------------|-------------|-------------|-----------|---------------|-------------|
| Defensive addition | PROPOSE | AUTO | AUTO | AUTO | AUTO |
| Dead code removal | PROPOSE | AUTO | AUTO | AUTO | AUTO |
| Declaration reorder | AUTO | AUTO | AUTO | AUTO | AUTO |
| Presentation only | — | — | — | AUTO | AUTO |
| Log suppression | PROPOSE | AUTO | AUTO | AUTO | AUTO |
| Behavioral change | PROPOSE | PROPOSE | AUTO | AUTO | AUTO |
| Data flow change | PROPOSE | PROPOSE | PROPOSE | AUTO | AUTO |

**AUTO** = Fix it, commit it, log it. No human needed.
**PROPOSE** = Write the fix plan as a solution proposal with `alignment-harness record proposals`. Do NOT implement.

## Step 4: Verify Defensive Coding Rules

Before committing ANY fix, verify these invariants:

1. **Fail-open for access**: If the fix touches anything that determines what
   a user can see/do, the failure mode MUST grant access, not deny it.
   A free user seeing premium features for 5 seconds is better than a
   paying user being locked out.

2. **No new constraints**: The fix must not introduce a new condition that
   could block a user who wasn't blocked before. Example: adding
   `if (!stableId) return res.status(400)` is WRONG — use defaults instead.

3. **Existing behavior preserved on success path**: The fix only adds a
   fallback for the failure path. When everything works normally, the
   code behaves identically to before.

4. **No silent data loss**: If the fix catches an error, it must not
   swallow data that downstream code needs. Return a safe default, not
   undefined/void.

## Step 5: Document Your Evaluation

Before committing, state in your reasoning (not in code):

```
Safety eval: [fix type] in [zone] → [AUTO/PROPOSE]
Fail-open: [yes/no — what happens on failure?]
Success path changed: [yes/no]
Blast radius: [what could break if this fix is wrong?]
```

## Quick Reference: Common Patterns

These come up repeatedly. Memorize them.

| Pattern | Classification | Decision |
|---------|---------------|----------|
| Add try-catch to non-critical API call | Defensive + Enrichment | AUTO |
| Add try-catch to auth/payment call | Defensive + Auth | PROPOSE |
| Guard null stableId with defaults | Defensive + Enrichment | AUTO |
| Guard null stableId with 400 response | Behavioral + Core | PROPOSE (violates fail-open) |
| Remove self-referencing fallback map entry | Dead code + Core | AUTO |
| Move variable declaration above useEffect | Declaration reorder | AUTO |
| Change CSS to center a modal | Presentation | AUTO |
| Suppress error log during loading state | Log suppression + Core | AUTO |
| Change what /auth/me returns | Data flow + Auth | PROPOSE |
| Add field to Stripe webhook handler | Data flow + Auth | PROPOSE |
| Silence a Google SDK third-party error | Log suppression + External | AUTO (silence, not fix) |

## Integration

This skill runs AFTER the triage decision tree identifies a fix, and BEFORE
implementation. The triage skill decides WHAT to fix. This skill decides
WHETHER you can fix it autonomously.

```
identifies root cause → designs fix
    ↓
/error-fix-safety-eval → classifies fix → AUTO or PROPOSE
    ↓
AUTO: implement, commit, log with `alignment-harness record known-fixed-errors`
PROPOSE: write solution proposal with `alignment-harness record proposals`, leave for human
```

## When In Doubt

If you can't clearly classify a fix, or if the matrix says AUTO but
something feels off, PROPOSE. The cost of a false PROPOSE is one
human review cycle. The cost of a bad AUTO is a production incident.

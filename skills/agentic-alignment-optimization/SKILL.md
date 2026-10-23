---
name: agentic-alignment-optimization
description: "Fix assumption cascades and feedback loops in agent workflows. Use when agents repeatedly err or validation is too slow."
triggers:
  - "alignment optimization"
  - "agent-human alignment"
  - "improve alignment"
---

# Agentic Alignment Optimization

> **Purpose**: Align agent behavior with human intent through systematic identification of assumption cascades, multi-layer enforcement design, and observable feedback loops.

This skill was developed from real-world debugging of agent swarm failures where agents created UX assignments for code that didn't exist. The patterns and techniques here are generalizable to any agent-human collaboration system.

---

## Core Insight: The Velocity-Accuracy Tradeoff

When agent swarms work at high velocity, they optimize for **completion over verification**. This creates three failure modes:

| Failure Mode | Description | System Theory Term |
|--------------|-------------|-------------------|
| **Assumption Cascade** | Agent A assumes → Agent B builds on assumption → Agent C documents as fact | Positive feedback loop (runaway) |
| **Canonical Drift** | Agents create one-off implementations instead of using established patterns | Entropy increase |
| **Validation Theater** | Tests/tools that appear to verify but don't check reality | False negative in control system |

**The Meta-Realization**: The problem is never "one bad agent" - it's a system that allows assumptions to propagate without verification checkpoints.

---

## The Alignment Methodology

### Phase 1: Identify the Assumption Cascade

Before fixing anything, trace the cascade:

```
1. SURFACE THE FAILURE
   - What did the human find that didn't work?
   - What did the agent claim would work?

2. TRACE BACKWARDS
   - What assumption did the final agent make?
   - Where did that assumption come from?
   - Was it from another agent's output? From a design doc? From nothing?

3. FIND THE MISSING VERIFICATION
   - At what point should reality have been checked?
   - What check would have caught this before cascade?

4. NAME THE PATTERN
   - Give the cascade a memorable name (e.g., "Phantom Code Cascade")
   - This makes it recognizable in future occurrences
```

**Example from this session:**
```
Failure: UX assignment said "test PaymentRoute redirect" but PaymentRoute.js didn't exist

Trace:
- Agent C created UX assignment referencing PaymentRoute.js
- Agent B created simulator referencing PaymentRoute.js
- Agent A proposed PaymentRoute.js in design doc
- NOBODY IMPLEMENTED PaymentRoute.js

Missing Verification: "Does this file exist?" before any reference

Pattern Name: "Phantom Code Cascade"
```

### Phase 2: Check for Existing Infrastructure

**Critical Insight**: Often the solution already exists but isn't being consumed.

Before building new enforcement:
1. Search for existing validation fields/flags
2. Check if there are existing endpoints that could help
3. Look for documented patterns that agents are ignoring

**Example from this session:**
```javascript
// DISCOVERED: The validation field already existed!
item.validation = 'phantom' | 'validated' | 'broken' | 'stale'

// The infrastructure was there - agents just weren't using it.
// Fix: Update skill files to tell agents to USE this field.
```

### Phase 3: Design Multi-Layer Enforcement

Single-point enforcement fails. Design **defense in depth**:

```
┌─────────────────────────────────────────────────────────────┐
│                    ENFORCEMENT PYRAMID                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Layer 1: SOFT ENFORCEMENT (Skill Files)                   │
│   └── Agent reads instructions                              │
│   └── Fails if: Agent doesn't read, or ignores              │
│                                                             │
│   Layer 2: PASSIVE ENFORCEMENT (API Warnings)               │
│   └── Server detects issue, returns warning                 │
│   └── Fails if: Agent ignores warning                       │
│                                                             │
│   Layer 3: ACTIVE ENFORCEMENT (Batch Validation)            │
│   └── Periodic scan marks issues                            │
│   └── Fails if: Scan doesn't run                            │
│                                                             │
│   Layer 4: HARD ENFORCEMENT (CI/Hooks)                      │
│   └── Blocks the action entirely                            │
│   └── Fails if: Bypassed (--no-verify)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle**: Each layer catches failures from the layer above.

### Phase 4: Create Observable System State

If you can't see it, you can't fix it. Create endpoints/tools that make system state visible:

| Observable | Endpoint/Tool | Purpose |
|------------|---------------|---------|
| Phantom items | `GET /phantom` | See all items referencing non-existent code |
| Validation status | `GET /status/:status` | Filter by validation state |
| Batch scan results | `POST /validate-phantom` | See what a scan found |
| Pattern frequency | Aggregate queries | Identify common failure modes |

### Phase 5: Close the Feedback Loop

The system must learn from failures:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   AGENT      │────▶│   CREATES    │────▶│   HUMAN      │
│   ACTION     │     │   ARTIFACT   │     │   VALIDATES  │
└──────────────┘     └──────────────┘     └──────┬───────┘
       ▲                                         │
       │         ┌──────────────────────────────┘
       │         │
       │         ▼
       │    ┌──────────────┐
       │    │   FEEDBACK   │
       │    │   CAPTURED   │
       │    └──────┬───────┘
       │           │
       └───────────┘

FEEDBACK TYPES:
- Status change (verified/failed)
- Comments/notes explaining why
- Pattern detection (multiple similar failures)
- Skill file updates (prevent recurrence)
```

---

## The Gate Pattern

**Critical Technique**: Insert mandatory verification gates at cascade initiation points.

```markdown
## Step 0: [GATE NAME] (MANDATORY FIRST STEP)

Before ANY other work, verify:

| Check | Command | If Fails |
|-------|---------|----------|
| [What to check] | [How to check] | STOP - [What to do instead] |

**Gate Rule**: If ANY check fails, do NOT proceed. Instead [alternative action].
```

**Example Gate** (from this session):
```markdown
## Step 0: Code Existence Verification (GATE)

Before ANY other reasoning, verify the code you're testing actually exists.

| Check | Command | If Fails |
|-------|---------|----------|
| File exists? | `ls {file_path}` | STOP - mark assignment `blocked` |
| Function exists? | `grep "{function}" src/` | STOP - mark assignment `blocked` |
| Not marked BROKEN? | `grep "{feature}" atomicConditions.js` | STOP - mark assignment `blocked` |

**Gate Rule**: If ANY reference is missing, create PROPOSAL instead of UX assignment.
```

---

## System Theory Patterns Observed

### 1. Positive Feedback Loop (Runaway)
**Pattern**: Agent outputs become inputs to other agents without verification
**Fix**: Insert negative feedback (verification checkpoints) to dampen the loop

### 2. Control System False Negative
**Pattern**: Validation exists but doesn't catch the failure
**Fix**: Add orthogonal checks (multiple independent verification methods)

### 3. Entropy Increase (Canonical Drift)
**Pattern**: Each agent creates slightly different implementations
**Fix**: Central registries (atomic-helpers-registry) with "check before create" protocol

### 4. Observability Gap
**Pattern**: System state is hidden, failures accumulate invisibly
**Fix**: Create explicit observability endpoints, batch scanning, dashboards

### 5. Single Point of Failure
**Pattern**: One enforcement layer, if bypassed everything fails
**Fix**: Defense in depth (4-layer pyramid)

---

## When to Use This Skill

### Triggers
- "Agents keep making the same mistake"
- "Human validation is taking too long"
- "We keep finding assumptions that were wrong"
- "The tests pass but the feature doesn't work"
- "Agents aren't using the tools we built"

### Diagnostic Questions
1. What assumption cascaded?
2. Where was the verification checkpoint missing?
3. Does infrastructure already exist that agents aren't using?
4. What would make the failure visible earlier?
5. What layers of enforcement exist? What's missing?

---

## Implementation Checklist

When optimizing agent-human alignment:

```
□ Identified and named the failure pattern
□ Traced the assumption cascade to its origin
□ Checked for existing infrastructure (fields, endpoints, docs)
□ Designed gate(s) at cascade initiation points
□ Updated skill files with new gates (soft enforcement)
□ Added API validation/warnings (passive enforcement)
□ Created batch validation endpoint (active enforcement)
□ Added CI/hooks if applicable (hard enforcement)
□ Created observability for the failure mode
□ Documented the feedback loop
□ Updated AGENTIC_WORKFLOW_ARCHITECTURE.md
```

If `~/.claude/skills/AGENTIC_WORKFLOW_ARCHITECTURE.md` does not exist, create it.

---

## Reference Files

| File | Purpose | Location |
|------|---------|----------|
| Workflow Architecture | Complete system overview | `~/.claude/skills/AGENTIC_WORKFLOW_ARCHITECTURE.md` |
| UX Assignment Reasoning | Gate example (Step 0) | `${CLAUDE_PLUGIN_ROOT}/skills/ux-assignment-reasoning-protocol/SKILL.md` |
| UX Assignment Generator | Pre-flight checklist example | `~/.claude/skills/ux-assignment-generator/SKILL.md` |
| Phantom Detection API | Server-side enforcement | `<your-project>/controllers/uxAssignmentController.js` |
| Pre-commit Hook | CI enforcement | `<your-project>/scripts/phantom-code-check.sh` |

---

## Critical Example: Programmatic vs Human Verification Misalignment

**This is one of the most common and costly misalignments.**

### The Wrong Pattern (What Agents Do)

An agent was asked to verify coupon comparison logic and produced this:

```
5. MISSING CONSOLE.ERROR - If promo comparison fails?

   VALIDATED - Logging exists for coupon decisions:

   console.log(`[Checkout] User promo code '${promo_code}'
   ($${promoDiscount} off) beats plan coupon '${planCouponCode}'
   ($${planCouponDiscount} off) - using promo code`);
```

**Why This Is Wrong:**
- This is checking that console.log EXISTS, not that the BEHAVIOR works
- This could easily be a Jest test: `expect(log).toContain('beats plan coupon')`
- Zero benefit to having a human verify code exists
- The human learns nothing, validates nothing real

### The Fundamental Misunderstanding

| Type | Purpose | Tool | Who Runs It |
|------|---------|------|-------------|
| **Programmatic Validation** | Code does what code says | Jest | CI/Automated |
| **UX Verification** | Real user flow works end-to-end | Browser | Human |

**Rule**: If you can write `expect(x).toBe(y)` for it, it's a Jest test, NOT a UX assignment.

### The Right Pattern (What Agents Should Do)

For the same coupon comparison feature, the correct UX assignment is:

```markdown
## UX Assignment: Verify better coupon wins at checkout

### WHY This Test Exists
When a user has multiple possible coupons (one from URL, one from plan default),
the system should automatically apply whichever gives them the better deal.
This prevents customer complaints about "I had a better coupon but got charged more."

### The Real Test (Human Verification)

**Pre-conditions created by atomic helpers:**
1. Create dummy user: `you+agentTest{rand5}@example.com`
2. Add user to Mongo with no subscription
3. Sign user in
4. Set plan default coupon: 30 days free (the BETTER deal)
5. Add URL coupon parameter: 10% off (the WORSE deal)

**One-Click URL:**
```
http://localhost:3000/checkout?promo=WORSE10PCT&simulate_user=agentTest12345
```

**Human Verification Steps:**
1. Click the URL above
2. See the checkout form pre-filled
3. Look at the discount line item
4. **Expected**: Shows "30 days free" (the better deal won)
5. **If you see**: "10% off" → The coupon comparison is broken

**Cleanup:**
Atomic helper auto-removes test user after 24 hours or on next test run.
```

### The Atomic Helpers Required

Each of these should be reusable functions in the registry:

| Helper | Purpose | Create If Missing |
|--------|---------|-------------------|
| `createDummyUser(email)` | Add test user to Mongo | ✅ |
| `cleanupDummyUser(email)` | Remove test user after test | ✅ |
| `setCouponCodeValue(code, value)` | Set a coupon in the system | ✅ |
| `simulateSignedInUser(email)` | Sign in as test user | ✅ |
| `prefillCheckoutForm(options)` | URL params to pre-fill checkout | ✅ |

**Protocol:**
1. Check `atomic-helpers-registry` for each helper
2. If missing → Create
3. Register the new helper
4. THEN create the UX assignment using those helpers

### Why This Matters

| Wrong Approach | Right Approach |
|----------------|----------------|
| Agent checks code exists | Human verifies real behavior |
| Validates logging | Validates user outcome |
| Could be Jest test | Must be human observation |
| No atomic helpers | Reusable atomic helpers |
| Not reproducible | One-click reproducible |
| Agent marks "validated" | Human marks verified |

### The Self-Check Question

Before creating ANY UX assignment, ask:

> "Could a Jest test verify this?"
>
> If YES → Write a Jest test, not a UX assignment
> If NO → Create atomic helpers, then one-click human verification

---

## Critical Example: Vague Expected Results Misalignment

**Another costly pattern**: Agents describe outcomes in internal/code terms that humans cannot verify.

### The Wrong Pattern

```
When a logged-in user loads the app, they should see their dashboard
immediately with correct access level. The defensive changes to
accessTier computation should not break normal login flow.
```

**Why This Fails:**
- "correct access level" — What does "correct" LOOK like visually?
- "accessTier computation" — Internal code term, meaningless to verifier
- "should not break" — How do I know it's NOT broken?
- **Human cannot pass or fail this test**

### The Right Pattern

```markdown
## Expected Result: Free User Dashboard

When you click the URL, you should see:
- Header shows "Free Plan" badge (gray, not gold)
- "Upgrade to Premium" button visible in sidebar
- Message limit counter shows "X of 10 messages used"
- NO premium features visible (voice mode button should NOT appear)

If you see:
- Gold "Premium" badge → Access level is WRONG
- No upgrade button → UI state is WRONG
- Voice mode button appears → Premium features leaking to free users
```

### Vague Words That Signal This Pattern

| Vague | Specific Replacement |
|-------|---------------------|
| "correct" | Exact text/badge/value |
| "appropriate" | Specific element name |
| "should work" | "You should see [X]" |
| "proper access" | "[Badge text] in [location]" |
| "normal flow" | Step-by-step what happens |

### The Fix

Add to pre-flight checklist:

> "If someone who has NEVER seen our app read this expected result, would they know EXACTLY what to look for?"
>
> If NO → Rewrite with exact visual elements and screen locations

---

## Example: Applying This to a New Problem

**Scenario**: Agents keep creating duplicate helper functions instead of using existing ones.

**Step 1: Identify the Cascade**
```
Agent A: Needs "simulate expired session" → Creates simulateExpiredSession()
Agent B: Needs same thing → Creates expireSession() (different name)
Agent C: Needs same thing → Creates mockSessionExpiry() (another name)

Pattern Name: "Helper Proliferation Cascade"
```

**Step 2: Check Existing Infrastructure**
```
- atomic-helpers-registry/SKILL.md exists
- Agents aren't reading it before creating helpers
```

**Step 3: Design Multi-Layer Enforcement**
```
Layer 1: Update create-admin-helpers-atomic skill to REQUIRE registry check first
Layer 2: API warns if function name is similar to existing helper
Layer 3: Batch scan finds duplicate-looking helpers, flags for merge
Layer 4: Pre-commit hook blocks if new helper without registry entry
```

**Step 4: Create Observable State**
```
GET /api/admin/helpers/duplicates → returns potential duplicates
GET /api/admin/helpers/registry → returns all registered helpers
```

**Step 5: Close Feedback Loop**
```
- Human marks duplicates as "merge needed"
- Agent sees the flag, creates PR to consolidate
- Registry updated, skill file updated
```

---

## Meta-Insight: This Skill Is Self-Referential

This skill file itself is an example of the patterns it describes:

1. **Named Pattern**: "Agentic Alignment Optimization"
2. **Gate**: "When to Use This Skill" section with triggers
3. **Observable State**: Implementation checklist makes progress visible
4. **Feedback Loop**: Skill updates based on new failure modes discovered

When you encounter a new alignment problem, update this skill file with:
- The new pattern name
- The enforcement layers that worked
- Any new system theory observations

---

## Changelog

| Date | Change | Trigger |
|------|--------|---------|
| 2026-02-03 | Initial creation | Phantom Code Cascade debugging session |

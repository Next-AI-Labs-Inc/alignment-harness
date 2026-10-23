---
name: pipeline-adversarial-design
description: "Stage 5.5 of the observable pipeline: adversarial thinking about a verified finding before it becomes a proposal. Fires AFTER verification confirms claims are real (Stage 4/5), BEFORE jonathan-check or proposal submission. Ask: what could go wrong if we act on this? What breaks if the fix is wrong? Outputs 05.5-adversarial-design.md with blast radius, risk-scored scenarios, and concrete UX test steps."
triggers:
  - "/pipeline-adversarial-design"
  - "adversarial design"
  - "what could go wrong"
  - "blast radius assessment"
  - "stage 5.5"
  - "what should I test to make sure it didn't"
  - "adversarial review before proposal"
---

# /pipeline-adversarial-design — Stage 5.5: Adversarial Design

> Full pipeline design: `${CLAUDE_PLUGIN_ROOT}/skills/process-actionable/SKILL.md`
> This skill fires AFTER Stage 4/5 (verify + cross-verify confirm a real finding), BEFORE Stage 6 (jonathan-check or proposal).
> Output: `05.5-adversarial-design.md` in the run directory.

---

## Why This Stage Exists

Verification tells you a claim is real. It does not tell you whether acting on it is safe.

An agent can confirm "this code path has a bug" and still propose a fix that silently breaks three other flows — because the agent read the code but never loaded the UI, never thought about who else calls that function, never asked "what does a real user experience if this fix is wrong?"

The user named this failure mode directly: agents trust the code, not the experience. They could have just pulled up the UI.

This stage exists to force adversarial thinking at the moment of highest leverage — after we know the problem is real, before we commit to a solution. It is a designed pause. The question is not "does the code look right?" It is "if we ship this and we're wrong, what breaks for whom?"

This skill reduces the human cost of reviewing proposals that look correct but have unstated assumptions baked in. It surfaces the "what could go wrong" that the generator skipped because they were focused on the fix.

---

## Consumption Intent

### 1. Primary Intent — Why does this skill exist?

This skill exists because agents that verify a finding and immediately propose a fix skip the question of blast radius. The fix looks correct in isolation, then breaks a payment flow nobody mentioned. The human catches it in review — or worse, in production. This stage inserts a structured adversarial check between "confirmed real" and "ready to act," so the proposal includes the risk surface, not just the solution.

It reduces the human cost of correcting proposals that are technically correct but contextually dangerous.

### 2. How to Consume — Written for a colleague, not a computer

When you are running this stage, you have just confirmed a finding is real. Now your job is to argue against yourself.

You are not looking for reasons the finding is wrong — you already confirmed it's right. You are looking for reasons the *fix* is wrong, incomplete, or dangerous in ways that aren't visible from the code alone.

Think like someone whose job it is to find the edge case that the proposer missed. Think about:
- Who else calls this code?
- What does the user see in the UI if the fix is applied incorrectly?
- What happens to users in an intermediate state (mid-session, mid-payment, partial data)?
- What monitoring or alerting would catch a regression?
- Is there a simpler version of this fix with a smaller blast radius?

Output a list of risks, each with a severity score (how bad if it happens) and a likelihood score (how often it would happen). Then write test scenarios in plain UX language: "a person clicks X and sees Y." Each scenario must be concrete enough for a separate agent (or a human) to execute without additional context.

Do not just summarize the finding. Argue against acting on it. Surface the things that could go wrong.

### 3. Feedback Loop When It Falls Short

If this skill cannot surface meaningful adversarial scenarios — for example, because the finding is too narrow or the codebase context is insufficient — do not silently produce a generic checklist. Instead:

State what you were looking for, what the finding touches, what you found when you tried to trace the blast radius, and what information would let you do a deeper adversarial analysis (e.g., "I need to know what other routes call this utility" or "I could not find the UI component that renders this data").

Report it. Do not work around it. Tools are under continuous evaluation — your feedback IS the improvement loop.

### 4. Observability Requirements

Every time this stage runs `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`, reads a file, or traces a code path to assess blast radius, print to the conversation:

`[ADVERSARIAL-DESIGN QUERY]: "{query}" — Intent: {why — what blast radius were you checking} — Result: {what came back} — Sufficient: {yes/partial/no}`

The human must be able to see what you looked at and whether it changed your risk assessment. "I checked the codebase" is not observable. "I searched for all callers of `sendCoachingMessage` and found 3 routes — two of them are in the payment flow" is observable.

### 5. Multi-Tool Composition

This skill works best when preceded by `pipeline-cross-verify` (Stage 5) — you have independent confirmation that the finding is real before spending adversarial budget on it.

After this stage, the output feeds `jonathan-check2` — the oracle that determines whether the risk surface is acceptable for proposal submission. If the adversarial design surfaces a severity-9 risk with high likelihood, `jonathan-check2` will likely require a more constrained scope before approving.

For high-severity risks, consider composing with `pipeline-scope-guardian` to check whether the proposed fix has already been scoped to avoid the danger zone.

### 6. Honest Framing

We do not know for certain that this skill will catch every blast radius failure. Adversarial thinking is bounded by the agent's knowledge of the system. A skilled human reviewer will still catch things this stage misses. The goal is to raise the floor, not eliminate risk. If you find this skill surfaces obvious risks but misses systemic ones, that is signal — report it.

---

## Input: What This Stage Receives

This stage receives from Stage 4/5:

1. **The verified finding** — the claim that was confirmed real, with evidence
2. **The file(s) touched** — the specific files and line numbers the finding implicates
3. **The proposed fix direction** (if Stage 4 identified one) — the approach Stage 4 was leaning toward

This stage does NOT receive:
- Stage 4's full reasoning chain
- Prior agent framing of the solution
- Assumptions about what the user wants — only the raw verified finding

---

## The Adversarial Thinking Protocol

### Step 1: Map the Blast Radius

Before generating any risk scenarios, trace the blast radius of the finding.

For each file implicated:
- What calls this code? (search callers, not just the file itself)
- What does this code call? (trace downstream dependencies)
- What user state does this code read or write? (session, payment, profile, coaching progress)
- What would a user experience if this code fails silently vs. loudly?

Use `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` and file reads to answer these. Do not assume.

Output: a blast radius map — a list of what else touches this code and how critical each touchpoint is.

### Step 2: Generate Risk Scenarios

For each risk, you need:

| Field | What to write |
|-------|---------------|
| **Risk** | What specifically could go wrong (not vague — name the user state or data) |
| **Trigger** | What action or condition causes this risk to materialize |
| **Severity** | 1–10 (10 = data loss, payment failure, account lockout; 1 = cosmetic) |
| **Likelihood** | 1–10 (10 = happens on every occurrence; 1 = requires rare edge case) |
| **Priority** | Severity × Likelihood (sort descending) |
| **Blast radius** | Which users are affected (all, paying only, users in onboarding, etc.) |

Generate at minimum:
- 1 risk scenario per file in the blast radius
- 1 risk scenario for the "fix is applied incorrectly" case
- 1 risk scenario for the "fix works but introduces regression in an adjacent flow" case

### Step 3: Write UX Test Scenarios

For each risk with Priority >= 30, write at least one UX test scenario.

A UX test scenario is not a unit test. It is a description of what a human (or a Haiku agent with browser access) would do and what they would observe.

**Format:**
```
Scenario: [short descriptive name]
User state: [who is this user — paying, free, mid-session, etc.]
Steps:
  1. User navigates to [specific screen]
  2. User clicks [specific element]
  3. [what should happen]
Expected: [what the user sees if the fix is correct]
Failure signal: [what the user sees if the fix is wrong or the risk materialized]
```

Each scenario must be concrete enough that a Haiku agent can execute it with browser access and return pass/fail with a screenshot.

### Step 4: Assess and Conclude

After generating risks and scenarios, output:

- **Recommendation**: proceed / proceed with constraints / block until [specific thing is resolved]
- **Minimum test gate**: which scenarios must pass before the proposal is approved
- **Constraints for the proposal**: if the fix should be scoped differently to reduce blast radius, state the constraint explicitly (e.g., "scope fix to users not currently in an active session" or "add a feature flag before rollout")

---

## Skip Condition

If the finding meets ALL of these conditions, skip adversarial design and note why:

- Single file implicated (no callers in payment, session, or auth flows)
- No user-facing state touched (pure internal utility, logging, or config)
- Governer score < 30

Output a one-liner: `Adversarial design skipped — single-location fix, blast radius contained to {file}. No user-facing state affected.`

Do not skip if you are uncertain whether state is affected. When in doubt, run Step 1 before deciding.

---

## Output: 05.5-adversarial-design.md

Write this file to the run directory.

```markdown
# Adversarial Design — [Item ID/Name]

## Blast Radius Map

| Touchpoint | Relationship | Criticality |
|------------|--------------|-------------|
| [file/route/component] | [caller/callee/consumer] | [high/medium/low] |

## Risks

| Risk | Trigger | Severity | Likelihood | Priority | Affected Users |
|------|---------|----------|------------|----------|----------------|
| ... | ... | N | N | N×N | ... |

## UX Test Scenarios (Priority >= 30)

### Scenario: [Name]
User state: ...
Steps:
  1. ...
Expected: ...
Failure signal: ...

## Recommendation

**Proceed / Proceed with constraints / Block**

Minimum test gate: [which scenarios must pass]
Constraints: [scope limitations or flags required]
```

---

## What Bad Looks Like

- Risks that are generic ("could cause errors") rather than specific ("users mid-checkout who have an active cart will see a blank payment screen")
- UX test scenarios that require code knowledge to execute (an agent without code access should be able to run them)
- Skipping adversarial design because "the fix looks straightforward" — that is exactly when the worst regressions happen
- Treating the blast radius map as complete after checking only the file that was flagged — callers are almost always where the real risk lives
- Stating risk likelihood as "low" without checking how often the triggering condition actually occurs in production data

---

## Connection to the Observable Pipeline

This stage is Stage 5.5 — it lives between independent cross-verification and proposal submission. The half-step number is intentional: it is not a full stage with its own agent, but it is not optional. It is the moment where the pipeline shifts from "is this real?" to "is acting on this safe?"

The pipeline without this stage produces proposals that are correct but incomplete. The human catches the blast radius in review. This stage catches it first.

## Adversarial Mini-Team (Auto-Dispatch Mode)

When invoked by /execute or when the governer score >= 50, this skill auto-dispatches a 3-agent team instead of running as a single-agent exercise.

### The Three Agents

**Agent A — Solution Proposer (sonnet)**
Receives the task intent and current implementation. Proposes the solution with stated constraints and assumptions.

**Agent B — Oracle Cross-Reference (haiku)**  
Receives ONLY the proposed solution and its stated constraints.
Queries jonathan-check2 with the /oracle-pre-query protocol.
Reports: which constraints align with institutional knowledge, which contradict it.

**Agent C — Adversarial Disprover (haiku)**
Receives ONLY the stated constraints/assumptions from Agent A.
For each constraint, searches the codebase for evidence that contradicts it:
- "X doesn't exist" → grep for X
- "This is the only way" → search for alternatives  
- "Scope is N files" → grep systemwide for the pattern
Reports: CONFIRMED (couldn't disprove) or DISPROVEN (found contradicting evidence) per constraint.

### Convergence

All three agents must report before the solution is presented:
1. Agent A's solution
2. Agent B's oracle alignment report
3. Agent C's disproof report

If B or C find issues, feedback goes to A as ADDITIVE (what to ADD, not what's wrong).

### Disagreement Handling (Governer-Gated)

If agents disagree AND governer score >= 50:
- Round 1: Disagreeing agents exchange evidence, attempt alignment
- Round 2: If still disagreeing, exchange again with specific counterarguments
- After 2 rounds: Orchestrator reads all positions + evidence, makes the call
- Decision logged with reasoning

If governer score < 50: Agent A's solution proceeds with B and C's findings noted but not blocking.

### Dispatch Pattern

All agents dispatched with run_in_background: true.
Agent B and C run in PARALLEL after Agent A completes.
Orchestrator reads all reports and makes convergence decision.

### Evidence Requirements

Agent B must include: oracle query (verbatim), oracle response (verbatim), citation count
Agent C must include: grep commands run, file paths found, content at those paths

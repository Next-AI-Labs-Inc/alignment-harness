---
name: task-orchestrator
description: "Automatic task orchestration — ensures every agent task gets the right pipeline steps (/align, /governer, /decompose, /declare-scope, /reflect, /consume, /complete-agentic-task) without the user having to ask. Predicts which steps are needed based on task characteristics, prints them, and spawns guardian agents."
triggers:
  - "orchestrate this task"
  - "what steps does this need"
  - "pipeline steps for this"
  - "task orchestrator"
  - "auto-pipeline"
  - "which steps should I run"
---

# Task Orchestrator

Predicts and enforces the correct pipeline steps for any task based on its characteristics.

## Why This Exists

Agents consistently skip mandatory pipeline steps. A recent session ran a full benchmark but skipped /align, /governer, /decompose, /declare-scope, /consume, and /reflect. The steps ARE the quality system — when skipped, everything degrades. This skill ensures they fire automatically.

## Source of Required Steps — /predict-required-skills

The canonical source for which skills are required for a given scope is `/predict-required-skills`. It queries the Agent Skill Pattern Oracle (NotebookLM) with the current scope and returns a sequence grounded in real historical session patterns — not just static rules.

**How they work together:**
1. `/task-orchestrator` fires first — determines structural pipeline steps based on complexity, leverage, blast radius
2. `/predict-required-skills` fires next — queries the oracle for domain-specific skills based on scope type
3. The two lists are MERGED (deduplicated) and every unique skill becomes a TaskCreate item
4. The merged list is the contract

**When `/predict-required-skills` result is already cached** (scope hasn't changed), skip the oracle query and use the cached sequence directly.

## How It Works

1. Accept a task description
2. Analyze task characteristics (complexity, leverage, blast radius, consumption needs)
3. Match against decision rules to determine structural pipeline steps
4. Call `/predict-required-skills` — merge oracle-predicted steps with structural steps
5. Print the merged required step list as a contract
6. Create a TaskList item for EACH required step via TaskCreate
7. Spawn guardian team to enforce compliance
8. Return control to the executor

---

## Step 1: Analyze Task Characteristics

Given the task description, classify:

### Complexity (1-10)
- 1-3: Simple — single file change, trivial fix, config update
- 4-6: Medium — multi-file changes, new feature, API + frontend
- 7-10: Complex — cross-system integration, new pipeline, architecture change

### Leverage (1-10)
- Run `/governer` to get the SILA score. Map 0-100 → 1-10.
- If no governer score available, estimate from:
  - Payment/billing/auth = 8-10
  - User-facing coaching/UX = 6-8
  - Admin/agent tooling = 4-6
  - Internal scripts/docs = 2-4

### Blast Radius (1-3)
- 1 = Internal/dev only (scripts, docs, agent tooling)
- 2 = Admin/the user workflows (admin UI, compactions, intent DB)
- 3 = End user-facing (coaching, checkout, email, onboarding)

### Consumption Complexity (1-3)
- 1 = Simple — just code, self-explanatory
- 2 = Needs admin review — new feature, needs walkthrough
- 3 = Needs structured consumption — benchmark data, multi-deliverable, audit results

---

## Step 2: Apply Decision Rules

Rules fire cumulatively — ALL matching rules contribute steps. Ordered by priority.

### ALWAYS rules (from CLAUDE.md mandates)
| Priority | Condition | Required Steps |
|----------|-----------|----------------|
| 100 | ALL tasks | /governer |
| 99 | ALL tasks with implementation | /declare-scope |

### Domain-specific ALWAYS rules
| Priority | Condition | Required Steps |
|----------|-----------|----------------|
| 95 | Payment/billing/stripe/subscription | /align, /governer, /declare-scope, /plan, /reflect, /jonathan-check2, /verify |
| 90 | Complexity >= 7 AND leverage >= 5 | /align, /governer, /decompose, /declare-scope, /plan, /reflect, /consume, /jonathan-check2, /complete-agentic-task |

### Leverage-based rules
| Priority | Condition | Required Steps |
|----------|-----------|----------------|
| 88 | Leverage >= 5 (governer >= 50) | /plan |
| 87 | Leverage >= 6 (governer >= 60) | /jonathan-check2 |
| 85 | Blast radius = 3 (user-facing) | /reflect, /jonathan-check2, /verify |

### Task-type keyword rules
| Priority | Condition | Required Steps |
|----------|-----------|----------------|
| 82 | Contains "benchmark", "eval", "scoring" | /consume, /reflect, /jonathan-check2 |
| 80 | Medium complexity (4-6) | /align, /governer, /declare-scope, /reflect, /consume |
| 78 | Contains "integration", "wire", "connect" | /declare-scope, /verify, /consume |
| 76 | Contains "refactor", "rewrite", "migrate" | /align, /declare-scope, /reflect |

### Completion rules
| Priority | Condition | Required Steps |
|----------|-----------|----------------|
| 75 | Consumption complexity >= 2 | /consume |
| 70 | Complexity >= 3 OR completed stories >= 1 | /complete-agentic-task, /commit |

---

## Step 3: Print the Contract + Create TaskList Items

After matching rules and merging with `/predict-required-skills` output, print the orchestration contract AND call `TaskCreate` for every required step.

```
## TASK_ORCHESTRATION_CONTRACT

Task: {task description}
Complexity: {1-10} | Leverage: {1-10} | Blast Radius: {1-3} | Consumption: {1-3}

### Required Pipeline Steps (in execution order):
1. [ ] /align — verify shared understanding of intent
2. [ ] /governer — score leverage and route to validation depth
3. [ ] /decompose — break into atomic deliverables
4. [ ] /declare-scope — lock scope boundaries before implementation
5. [ ] /plan — write implementation plan (governer >= 50)
6. [ ] [IMPLEMENTATION]
7. [ ] /reflect — structured self-assessment
8. [ ] /consume — build admin-consumable output
9. [ ] /jonathan-check2 — the user-perspective quality gate
10. [ ] /verify — runtime evidence
11. [ ] /complete-agentic-task — formal completion filing
12. [ ] /commit — git commit

### Rules That Fired:
- {rule_name}: {condition} → {steps added}
- ...

### Guardian Team:
- scope-guardian: Watching for drift from declared scope
- step-compliance: Will block completion if steps are skipped
- consumption-builder: Will produce consumable output before done
```

**Immediately after printing the contract**, create a TaskList item for every step listed:

```
TaskCreate({ subject: "Run /align — verify shared understanding of intent", description: "Required pipeline step." })
TaskCreate({ subject: "Run /governer — score leverage", description: "Required pipeline step." })
... (one per step)
```

Steps that have already been completed this session (e.g., /align already ran) should be created as `status: completed` to avoid duplication.

---

## Step 4: Spawn Guardian Team

After printing the contract, spawn these agents (if the task warrants them):

### When to spawn scope-guardian
- Complexity >= 5 OR blast radius >= 2
- Watches for: work that deviates from the declared scope, new features being added that weren't in scope

### When to spawn step-compliance
- ALWAYS for complexity >= 4
- Blocks: completion if any required step from the contract hasn't fired
- Checks: each step has evidence of execution (not just a mention)

### When to spawn consumption-builder
- Consumption complexity >= 2
- Builds: admin-readable output, consumption instructions, /speak-human translation

---

## Step 5: Return Control

After printing the contract and spawning guardians, return control to the executor.
The executor proceeds through implementation, and guardians watch in parallel.

When the executor attempts to declare "done" or run /complete-agentic-task:
1. step-compliance checks all contract steps have evidence
2. consumption-builder verifies consumable output exists
3. scope-guardian confirms no undeclared drift
4. Only if all three pass → completion proceeds

---

## Pipeline Phase Order (canonical)

This is the execution order. Steps MUST fire in this order when multiple are required:

1. /align
2. /governer
3. /decompose
4. /declare-scope
5. /plan (or /superpowers-writing-plans-v2)
6. [IMPLEMENTATION]
7. /reflect
8. /consume
9. /jonathan-check2
10. /verify
11. /complete-agentic-task
12. /commit

---

## Data-Driven Rule Updates

Rules are generated from real session data. To update:

```bash
cd <your-project>
NODE_PATH=./node_modules node scripts/extract-step-requirements.js
node scripts/enrich-step-data.js
node scripts/extract-step-rules.js
```

This produces `scripts/output/step-rules.json` — the machine-readable rules.
Review `scripts/output/step-rules.md` for the human-readable decision table.

Rules should be re-extracted monthly or after significant CLAUDE.md changes.

---
name: ultraplan2
description: >
  Deep-research planning workflow. Takes any scope and iterates through
  reflect → align → gap-identification → research-agent dispatch → oracle
  consultation → repeat until 95% confidence → outputs a full intent-nested
  decomposed plan, gated by jonathan-check2, written to Obsidian and opened.
  Use when a scope is complex, ambiguous, or high-leverage and requires
  multi-source research before committing to a plan.
---

# /ultraplan2 — Deep Research to Plan

A reusable planning workflow that refuses to produce a plan until it has
earned 95% confidence in the full scope, intent, and approach. Every step
is announced in the transcript. Every output is shown. Final plan is gated
by jonathan-check2 then written to Obsidian.

---

## When to invoke

- Scope is novel, multi-system, or strategically important
- You'd normally just start planning but the risk of misalignment is high
- The user has asked explicitly for /ultraplan2 on a given scope
- You need to consult oracles before proposing architecture

---

## The Protocol

### STEP 1 — /reflect

**Announce:** `🔁 ULTRAPLAN2 — STEP 1: /reflect`

Invoke `/reflect`. Surface:
- What you already know about this scope
- What prior work exists in this domain (sessions, skills, commits)
- What assumptions you're currently running
- Your current confidence level in understanding the full scope (0–100%)

Print the reflect output fully.

---

### STEP 2 — /align

**Announce:** `🔁 ULTRAPLAN2 — STEP 2: /align`

Invoke `/align`. Validate:
- Is your understanding of the scope aligned with the user's stated intent?
- Are there nested intents (parent/child) that need to be surfaced?
- Map the overarching intent → initiative intent → task-level intents
- State confidence: `Alignment confidence: X/100 — reason`

Print the align output fully.

---

### STEP 3 — Gap Identification (3 Key Questions)

**Announce:** `🔁 ULTRAPLAN2 — STEP 3: Gap identification — 3 key questions`

Evaluate: *If I knew the answer to these 3 questions, I would have 95% confidence to plan.*

Format each question:
```
Q1: [The question]
     WHY it matters: [what planning decision it unlocks]
     Best source to answer it: [`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` / insight oracle / codebase / external research]
     Current best guess: [your prediction with certainty %]
```

Print all 3 questions before dispatching agents.

---

### STEP 4 — Dispatch Research Agents (Sonnet)

**Announce:** `🔁 ULTRAPLAN2 — STEP 4: Dispatching research agents`

For each gap question, dispatch a Sonnet subagent (run_in_background: true).

Each agent prompt MUST include:
- The full parent scope/intent (copy verbatim — no summarizing)
- The specific question they're answering
- Instruction to start with `/agentic-find` before any other search
- Instruction to consult the most relevant `/insight` oracle
- Required output format: `{ question, answer, confidence, sources, key_insight }`
- Target: 90%+ confidence before returning

Dispatch ALL agents in parallel in a single message.

After dispatching: **do not go silent.** Share what you know so far and keep engaging with the user while agents run.

---

### STEP 5 — Review + Remaining Gap Evaluation

**Announce:** `🔁 ULTRAPLAN2 — STEP 5: Reviewing research, evaluating remaining gaps`

When agents return:
- Read each result
- Rate: did it close the gap? (yes / partial / no)
- Re-evaluate overall confidence: `Overall alignment confidence: X/100`

If confidence < 95%:
- Identify remaining 1–3 gaps (only what's still unknown)
- Dispatch a new round of agents (same protocol as Step 4)
- Announce the repeat: `🔁 ULTRAPLAN2 — STEP 5 (repeat N): X gaps remain`
- Continue until confidence ≥ 95% OR 3 rounds max

At 95%+, announce: `✅ ULTRAPLAN2 — Research complete. Confidence: X/100. Building plan.`

---

### STEP 6 — Consult /insight Oracles

**Announce:** `🔁 ULTRAPLAN2 — STEP 6: Consulting insight oracles`

Based on the scope domain, identify the most relevant NotebookLM notebooks.
The 8 notebooks available via /insight:
- agent steering
- product intent
- session history
- coaching principles
- investor context
- email design
- cross-domain
- founder voice

> **Setup:** These notebooks do not ship with this plugin. Make your own at https://notebooklm.google.com and load each one with your own institutional knowledge (see `/insight`). Why: an oracle can only stand in for asking the user if it holds the user's context.

Query the 2–3 most relevant ones. Surface any key signals that should
shape the plan. Print the oracle outputs.

---

### STEP 7 — Build the Full Plan (/intent-nested + /gap + /decompose)

**Announce:** `🔁 ULTRAPLAN2 — STEP 7: Building the full intent-nested plan`

Output the complete plan in this structure:

```
## ULTRAPLAN2 OUTPUT — [Scope Name]
**Confidence:** X/100
**Research rounds:** N
**Oracles consulted:** [list]

---

### OVERARCHING INTENT
[One bold sentence — what this system does in UX terms for the user]

### GAP ANALYSIS
Current state: [what exists now]
Target state: [what we're building]
The gap: [what must be built/changed/designed to close it]

### NESTED INTENT MAP
[Parent intent — bold, no prefix]
  🟢 [Child intent]
    🟢 [Sub-child intent]
  🟢 [Child intent]

### DECOMPOSED TASKS
For each task:
Task: [name]
  Scope: [1–2 sentences — exactly what gets built]
  When complete: [testable UX outcome — what the user can do]
  Verification: [runnable command or observable check]
  Governer hint: [estimated score 1–100]
  Dependencies: [what must exist first]

### KEY DESIGN DECISIONS
[3–5 architectural/strategic choices with rationale]

### RISKS & OPEN QUESTIONS
[Remaining uncertainties, not blocking the plan but worth tracking]

### FLYWHEEL / LEVERAGE MAP
[How each part compounds into the next — the emergent value beyond sum of parts]
```

---

### STEP 8 — /jonathan-check2 Gate

**Announce:** `🔁 ULTRAPLAN2 — STEP 8: jonathan-check2 gate`

Invoke `/jonathan-check2` on the full plan output.

If it raises issues: fix them and re-check. Loop until pass.
When approved: announce `✅ jonathan-check2 approved`

---

### STEP 9 — Write to Obsidian + Open

**Announce:** `🔁 ULTRAPLAN2 — STEP 9: Writing to Obsidian and opening`

Write the approved plan to:
`<api-repo>/docs/intent/Intent-Map/[domain]/[initiative-name]/ULTRAPLAN2.md`

If the `<api-repo>/docs/intent/Intent-Map/[domain]/[initiative-name]/` folder does not exist, create it.

Then open it immediately (if the person has an Obsidian vault; otherwise print the path):
```bash
open "obsidian://open?vault=<their vault name>&file=Intent-Map/[domain]/[initiative-name]/ULTRAPLAN2&newtab=true"
```

Print the Obsidian path and confirm it opened.

---

## Output contract

At the end, you MUST have produced:
- [ ] Full plan document written to Obsidian
- [ ] Obsidian opened (not just path printed)
- [ ] jonathan-check2 approved
- [ ] All 7 steps announced in transcript with their outputs shown
- [ ] Confidence ≥ 95% before plan was written

---

## Anti-patterns (NEVER do these in ultraplan2)

- Starting the plan before research rounds are complete
- Going silent after dispatching agents
- Compressing research output so the user can't verify it
- Stating research conclusions as facts without confidence scores
- Skipping jonathan-check2 because the plan "looks good"
- Summarizing the Obsidian file instead of opening it

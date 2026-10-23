---
name: intent-journey-documentation-v2
description: "Team-based workflow that produces human-readable journey documentation grounded in institutional knowledge with governing agents auditing every section. Use when documenting any user-facing flow, conversion funnel, or system behavior that needs the user's validation. Supersedes v1 for new work — v1 remains available."
triggers:
  - "document this journey"
  - "intent journey v2"
  - "walk through this flow"
  - "create journey docs"
  - "sanity check this flow"
---

# Intent Journey Documentation v2 — Team-Based Workflow

**Trace key: `JOURNEY-DOC-V2`**

## Why v2 Exists

v1 produced well-formatted documents that said the wrong things. An agent read the code, guessed the intent, and produced human-readable statements that looked correct but weren't grounded in the user's actual reasoning or documented intent. The formatting was right — chronological, split paths, human-readable — but the substance was wrong because the agent never checked institutional knowledge.

v2 fixes this by making it structurally impossible to skip the intent sources. Separate agents do the intent research and the code research. Governing agents check every section against documented intent, not just against formatting rules. The producer can't advance a section until the governors pass it.

## The Team

### Research Layer (haiku agents — cheap, parallel, run first)

Before ANY documentation is written, haiku agents query the institutional knowledge sources in parallel. They produce an **intent brief** — a summary of WHY this system exists, WHAT the user's reasoning was, and WHAT the documented intent says.

**Agent: Intent Researcher** (haiku)

> **Setup:** The Silver Grail, Product Intent and Cross-Domain Deep notebooks do not ship with this plugin. Make your own at https://notebooklm.google.com and load each one with your own institutional knowledge (see `/insight`). Why: a notebook can only stand in for asking the user if it holds the user's context.

- Queries Silver Grail notebook: "How does the user think about [this system]? Why does it matter?"
- Queries Product Intent notebook: "What is the intended purpose of [this system]? What should the person experience?"
- Queries Intent DB for any `@intent` tags found in the code (e.g., IX-1825)
- Runs `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`: "[system name] intent purpose why"
- Queries Cross-Domain Deep if the system spans multiple domains
- **Output:** Intent brief — the user's reasoning, the documented purpose, the intended UX, and any known gaps or historical decisions. This is the ground truth.

**Agent: Code Researcher** (sonnet)
- Reads the actual code files involved in the system
- For each file: what triggers it, what conditions are checked, what happens on pass vs fail, what downstream systems are affected
- Cross-references code behavior against the intent brief: does the implementation match the documented intent? Where does it diverge?
- **Output:** Code findings — verified facts about what the code actually does, with line references, plus flags where code behavior doesn't match documented intent.

### Producer (sonnet — writes one section at a time)

Receives BOTH the intent brief AND the code findings. Writes each section of the journey document by creating the binding between intent and implementation — human-readable statements grounded in the user's reasoning, with code references as pointers that anchor each statement to the specific place in the codebase where it's implemented.

The producer follows these rules from the user's corrections (verbatim):
- "the references to code should be wrapped in Human readable language" — code references come AFTER the human-readable explanation, in parentheses, as pointers
- "you can't leave out the actual intent of any part of the actual code that derives the UX" — every piece of code that affects the person's experience must be represented
- "using variable names is not against the rules, but you cannot use them as a substitute for the semantic meaning" — variable names are pointers, not explanations
- "you're creating the binding of the intent to the code" — the documentation connects the user's reasoning to the implementation, not one or the other

The producer writes ONE section, then passes it to all governing agents before writing the next.

### Governing Agents (each loaded with one skill, persistent throughout)

Each governing agent carries one concern. They audit EVERY section as it's produced — not in a batch at the end. A section that fails any governor goes back to the producer with specific feedback about what's wrong and why. The producer rewrites. The governor re-checks. Max 2 rounds per section per governor.

**Governor: Hallucination** (sonnet, loaded with `/hallucination`)
- Checks every claim against the intent brief and code findings
- Rejects any statement that isn't grounded in evidence from either source
- Specific check: "Did the producer derive intent from code instead of from the intent brief?" — this is THE failure mode that caused v1's wrong statements

**Governor: Alignment** (sonnet, loaded with `/align` principles + the intent brief)
- Checks every statement against the documented intent
- Rejects any statement where the described behavior doesn't match what the system is supposed to do
- Specific check: "Does this statement accurately represent why this system exists and what the user's reasoning was?"

**Governor: Articulation** (haiku, loaded with `/intent`)
- Checks the 8 quality gates from the Apr 14 2026 session:
  1. Chronological sequencing — events in the order the person experiences them
  2. No code-as-communication — code refs are pointers, not explanations
  3. Variable names are pointers — every variable preceded by its human meaning
  4. Intentionality stated — each behavior marked as by-design or accidental
  5. No reader guessing — no gaps the reader has to fill from imagination
  6. No separated context — evidence woven inline at the relevant moment
  7. Split paths get split sections — divergent journeys told separately
  8. Failure modes included — silent failures described with downstream consequences

**Governor: Readability** (haiku, loaded with `/speak-human`)
- Checks that a smart person who doesn't code could read and validate every statement
- Rejects any statement where the reader would furrow their brow
- Specific check: "Could the user check this box without looking at code?"

### Flow for Each Section

```
1. Haiku intent researcher produces intent brief (runs once for the whole document)
2. Sonnet code researcher produces code findings (runs once for the whole document)
3. Sonnet producer writes Section 1 using intent brief + code findings
4. Governor: Hallucination checks Section 1 → pass or reject with feedback
5. Governor: Alignment checks Section 1 → pass or reject with feedback
6. Governor: Articulation checks Section 1 → pass or reject with feedback
7. Governor: Readability checks Section 1 → pass or reject with feedback
8. If any reject → producer rewrites with feedback → governors re-check (max 2 rounds)
9. All pass → Section 1 is done → producer writes Section 2 → repeat
```

## Invoking This Workflow

When this skill is invoked with a topic:

**Step 1:** Print trace key
```
[JOURNEY-DOC-V2] Team initiated
  Topic: {what we're documenting}
  Evidence dir: {where evidence will be saved}
```

**Step 2:** Dispatch haiku intent researcher in background — query all 5 institutional knowledge sources

**Step 3:** Dispatch sonnet code researcher in background — read all relevant code files, cross-reference against intent brief when it arrives

**Step 4:** When both researchers complete, dispatch the producer with both outputs. The producer writes one section at a time.

**Step 5:** After each section, dispatch the 4 governing agents in parallel to audit it. Collect their results.

**Step 6:** If any governor rejects, send feedback to producer for rewrite. Re-dispatch governors on the rewrite.

**Step 7:** When all sections pass all governors, compose the final document with breadcrumbs, consumption checkboxes, and evidence links inline.

**Step 8:** Open in Obsidian for the user's review.

## Output Template

Same as v1 — the format was right, the content sourcing was wrong:

```markdown
[[parent-link]] > [[index-link]] > Step N
← [[prev-step]]  |  [[next-step]] →

# Step N: {What happens to the person at this point}

## The person's journey through this step — check each statement that matches your intent

{Context sentence connecting this step to the previous one}

- [ ] {Statement grounded in intent brief, with code reference as pointer}
      This is intentional — {why, from the user's reasoning in Silver Grail/Product Intent}.
      ({code file:line} — the specific implementation)

**Here the journey splits based on {condition from code, described as what the person did}:**

---

### Path A: {The person who...}

- [ ] {What happens chronologically, grounded in intent + code}

- [ ] **Where this path leads:** {Consequence, with evidence inline}

---

### Path B: {The person who...}

- [ ] {What happens chronologically, grounded in intent + code}

- [ ] **The gap:** {What doesn't happen, with evidence} [Evidence link]

---

## To continue this work, I need you to:

- [ ] {Consumption step 1}
- [ ] {Consumption step 2}
```

## What Stays from v1

- The 8 quality gates (now enforced by the Articulation governor, not end-stage audit)
- The output template (chronological, split paths, breadcrumbs, consumption checkboxes)
- The /speak-human translation style
- The /intent format rules

## What v2 Adds

- Institutional knowledge queried BEFORE code is read (haiku research layer)
- Code read to VERIFY intent match, not to DERIVE intent (code researcher)
- Governing agents check EVERY section as produced (not batch at end)
- Hallucination governor specifically checks: "was intent derived from code instead of from documented sources?"
- The producer creates the binding between intent and code — neither excluded, connected

## Self-Healing

When a governor rejects a section, the rejection reason is logged. If the same rejection type occurs 3+ times across different invocations, that's a signal the producer's prompt needs updating — the stage design is allowing a failure class to persist. The articulation governor's prompt should be patched to make that failure class structurally impossible.

## Composability

This workflow consumes:
- `/intent` — loaded by the Articulation governor
- `/speak-human` — loaded by the Readability governor
- `/hallucination` — loaded by the Hallucination governor
- `/align` — principles loaded by the Alignment governor
- `/insight` — for routing to the right notebook per topic

This workflow is consumed by:
- `/proof-its-fixed` — the narrative section of evidence packages
- `/workflow-extract-from-session` — when capturing session methodology
- Any journey documentation in the intent vault

## Feedback Loop

If the user rejects the output or asks for corrections after all governors passed, that correction becomes a new governing concern. Either add it to an existing governor's checklist or create a new governor for the concern. The user's verbatim words become the validation criteria — this is how the v1 quality gates were created, and the same mechanism extends v2.

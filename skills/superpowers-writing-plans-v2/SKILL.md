---
name: superpowers-writing-plans-v2
description: "Alignment-coaxed clone of superpowers:writing-plans (v1). Additively enforces the product's alignment protocol: Obsidian filing, open-on-create, required frontmatter, ascendant-chain confirmation, probability-qualified claims, speak-human tone, §0.4 handoff contract, kill-switch section, additive-feedback default, parent-agent self-enforcing loop awareness. v1 behavior preserved byte-accurate in PART A."
origin: clone of `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/writing-plans/SKILL.md`
origin_sha256: 90056bad3d5f196fa7c9fec0ffe592e6d9c86bc983e406642a51d1a4198b7024
coax_count: 10
created: 2026-04-23
ab_test: "[[AB-002]]"
parent-initiative: "[[00-PARENT-INTENT]]"
ascendant-rule: "[[ASCENDANT-READING-RULE]]"
self-enforcing-loop: "[[PARENT-AGENT-SELF-ENFORCING-LOOP]]"
---

# Writing Plans (v2 — Alignment-Coaxed)

This skill is a **coaxed clone** of `superpowers:writing-plans`. Everything v1 does, v2 does. Additionally, v2 enforces 10 alignment surfaces specific to the product workflow.

Announce at start: *"I'm using writing-plans-v2 — the alignment-coaxed plan skill. I'm composing this plan in the register of `/on-talking-about-code`, `/gap`, and `/reflect` (the architecture of a plan — see PART B-0): it communicates what the work does to a real person, not the code that does it. Every v1 instruction applies; 10 additional coaxes shape the form."*

---

## PART A — v1 Instructions (preserved byte-accurate)

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default) — **v2 REDIRECT: see COAX-1 below; user preference is Obsidian initiatives folder, not `docs/superpowers/plans/`.**

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Batch execution with checkpoints for review

---

## PART B-0 — What A Plan Is (the architecture every plan is built from)

> **Read this before writing any plan. It is the target. The coaxes below are the rules that keep your arrow from flying into a house — but this section is where the target actually is. If you only obey the rules and miss this, you will produce a worse plan than if you had no skill at all.**

### Load these three skills first — they ARE the architecture of a plan

Before drafting any plan, load and let these shape it — not as a checklist run once, but as the register the whole plan lives in:

- **`/on-talking-about-code`** — the discipline that turns any reference to code into its exact semantic meaning fused with the precise user journey it produces. This is how a plan describes *what the change does to a real person*, at the precision of a code spec, without being code.
- **`/gap`** — the shape that names where we are, where we need to be, the edges of what's in and out, and what will close the distance — all in the experience of the person, with honest confidence percentages.
- **`/reflect`** — the move that boosts the precision of your own articulation of intent before you commit it to the page.

A plan built from these three reads like a person explaining to another person what they understand the goal to be and how they intend to fulfill it — at full precision of intent — and lets the user confirm alignment in one read.

### The user's articulation of what a plan is — in the user's own words (do not paraphrase)

These are the user's verbatim words from the session where this section was authored (2026-06-19). They are the seed. Encode the intent they carry; do not reduce them to rules:

> "code goes in the code and the plan should be the thing for communicating to a human that you understand the intent and what your strategy is for fulfilling it."

> "The code goes in the code. The plan is for communicating what the code will do to the human."

> "you should be crystallizing the intent, not creating hardcoded rules that eliminate an agent's capacity to think freely... an agent is capable of consuming and accounting for context, but not when the rules tell them not to."

### What a 10/10 plan IS — the target, seen clearly

A plan is the artifact where a human reads it and arrives at: *"yes — you understand what I want, and your strategy for getting there is right"* — **before any code exists.** Its entire job is to make that confirmation possible in a single read. Everything that serves that job belongs in the plan. Everything that forces the reader to parse implementation in order to find the intent works against it.

So the substance of a plan is **the semantic meaning of every change** — what a real person will do, see, receive, or experience differently once the change exists — synthesized with the precise conditions that make it true, in the register `/on-talking-about-code` teaches. When a plan says what a piece of work does, it says it the way you'd tell a colleague who will *feel* the result: who the person is, what moment they're in, what they do, and what happens for them now that didn't before. The precision of a code spec, carried entirely in the language of human experience.

The literal code — the function bodies, the hooks, the exact syntax, the import paths — is the *implementation* of the plan, and it is born in the codebase during execution, where it is verifiable against reality. A plan that contains it has confused the map for the territory: it asks the user to authorize an implementation the user then has to mentally decompile back into intent to even evaluate. The plan you're reaching for instead is one where the user feels the result directly and confirms the intent in one read — that is the thing this section is pointing you toward. (The rare exception that is itself semantic content — a verbatim user-authored template, an exact threshold value that IS the intent, a literal string the user will see — belongs in the plan precisely because it is meaning, not implementation. You are trusted to tell the difference by asking: *is this the thing the human experiences, or the machinery that produces it?* The first is plan; the second is code.)

### How to hold this while writing

When you describe a change and feel the pull to paste the code that implements it, that pull is the signal to do the harder, more valuable thing instead: state, in the person's experience, exactly what that code will cause — with the precision that makes it checkable against reality without a single follow-up question. The inlined-result instinct (PART F INSTINCT-1) still holds: inline the *resulting human-experienced state* (the actual sentence the user reads, the actual thing that now happens when they act), not the code that produces it. A plan reaches 10/10 when the user can authorize it without ever needing to see, or simulate, the implementation — because the intent and strategy are rendered so precisely in the user's own terms that the code becomes a foregone, trusted detail.

### On PART A's worked examples

PART A (the byte-accurate v1 clone) shows task structure using small literal code snippets as its examples. Those examples teach the *mechanical rhythm* of a task — one small action, verify, commit. Read them for that rhythm only. The *substance* you fill each task with is governed by this section: the human-experience meaning of the change, not its code. Where PART A's example would have you paste an implementation into the plan, PART B-0 supersedes: render the resulting human experience instead. PART A is preserved unedited for provenance; B-0 is how its task shape gets filled.

---

## PART B — Alignment Coaxing (v2 additions)

These 10 additive coaxes apply ON TOP of PART A and PART B-0. They do not subtract from v1. When a PART A instruction and a PART B coax both apply, follow both — PART B extends, never replaces. **PART B-0 is the target the coaxes serve; if a coax ever seems to conflict with B-0, B-0 wins — it is where the intent lives.**

### COAX-1 — Obsidian filing over generic `/plans/`

**Override the PART A default save path.** Plans do NOT go to `docs/superpowers/plans/`. They go to Obsidian under the matching initiative.

Selection rubric:
1. Does the plan's scope match an existing initiative under `<api-repo>/docs/intent/1.5_initiatives/`?
   - If YES: save to `<initiative>/initiatives/T<N>-<topic>/01-PLAN.md` (create folder if missing)
2. If no match: save to `<api-repo>/docs/intent/2.0_Plans_all/YYYY-MM-DD-<feature-name>.md` AND include a pointer at the top: *"Long-term home unclear — ask the user which initiative this belongs to."*
   - If the `<api-repo>/docs/intent/2.0_Plans_all/` folder does not exist, create it.
3. NEVER default to `docs/superpowers/plans/` or any non-Obsidian path unless explicitly overridden by the user in-session.

**Why:** parent §4.4 (Obsidian ↔ compaction fracture); user correction 2026-04-23: *"produced a beautiful artifact that probably should've been in the initiatives folder."*

### COAX-2 — Open-on-create via `open -a Obsidian`

After writing any plan file (or any markdown file this skill touches), IMMEDIATELY run:

```bash
open -a Obsidian "<absolute path to file>"
```

NEVER use `code <path>` or any VS Code opener. NEVER silently skip the open step — the user must see the file in the vault right after it's created.

**Why:** user correction 2026-04-23: *"agents are opening with VS code the files that they're modifying instead of obsidian which is actually a bit slower and harder for me to consume."*

### COAX-3 — Required YAML frontmatter

Every plan MUST begin with YAML frontmatter containing at minimum:

```yaml
---
type: plan
title: <short>
status: awaiting-user-greenlight
parent-initiative: "[[<nearest-initiative>]]"
ascendant-rule: "[[<relative-path-to-ASCENDANT-READING-RULE>]]"
self-enforcing-loop: "[[<relative-path-to-PARENT-AGENT-SELF-ENFORCING-LOOP>]]"
created: <ISO-date>
author: <agent-id>
certainty: <0-100>
touches_users: <true|false>
---
```

This makes the plan Obsidian-graph-navigable and forces ascendant linking.

**Why:** parent §0.5 (append pattern with §X.Y.N), ASCENDANT-READING-RULE frontmatter conventions.

### COAX-4 — Ascendant-chain confirmation in body

Every plan begins (after frontmatter) with:

```
ASCENDANT_CHAIN_READ:
  L0_ROOT:        <path> (YES, read YYYY-MM-DD)
  L1_GRANDPARENT: <path or N/A>
  L2_PARENT:      <path>
  L3_RULE:        <path>
  L4_SELF:        this doc
  SIBLINGS_READ:  NONE
```

If any line is falsified or skipped, the plan is rejected by the ASCENDANT-READING-RULE.

**Why:** ASCENDANT-READING-RULE.md "Confirmation format" section; parent §15.2 (meta-irony — the doc building the system must obey the system).

### COAX-5 — Probability-qualified claims

Every factual claim in the plan body carries `(probability: X%, basis: Y)` or a named source citation. No unqualified assertions.

Examples of violations to avoid:
- ❌ "The endpoint currently returns 401."
- ✅ "The endpoint currently returns 401 (probability: 100%, basis: curl executed 2026-04-23)."
- ❌ "Users prefer the new flow."
- ✅ "Users prefer the new flow (probability: 70%, basis: 14-user sample 2026-04-10, not statistically powered)."

**Why:** parent §0.6 and §5.1; CLAUDE.md *"Nothing is a fact unless a human confirmed it to be true."*

### COAX-6 — /speak-human tone for user-facing sections

Plan sections the user will read (Goal, Architecture, Why-This-Matters, Revert) MUST be in plain language — no jargon, no variable names, no file paths, intent-first.

Technical detail (exact code, file paths, commands) goes in a clearly-labeled "Technical Detail" subsection BELOW the user-facing prose, never instead of it.

Example contrast:
- ❌ jargon-first: *"Refactor `hydrateCoachingSessions()` to use the new canonical `getStripeState()` in `stripeUtils.js:44`."*
- ✅ speak-human first: *"When coaches open a paying user's session today, the system sometimes shows the wrong subscription status because two places check Stripe in inconsistent ways. This plan makes one place the source of truth."*

(Technical Detail below would then list the exact refactor.)

**Why:** parent §5.9; MEMORY.md `feedback_founder_facing_docs_must_use_speak_human.md`, `feedback_no_jargon_ever.md`, `feedback_observable_means_human_readable_not_hidden.md`.

### COAX-7 — §0.4 handoff contract at plan end

Every plan ends with:

```
HANDOFF_CONTRACT:
  FROM:          <agent id>
  TO:            <next agent or the user>
  TASK:          <one line, grounded in a §-reference>
  PARENT_READ:   <digest hash or confirmation line>
  INPUT_DOCS:    [list]
  OUTPUT_DOCS:   [list]
  CONFIDENCE:    <%>
  CITATIONS:     [list]
  UNKNOWN:       [list]
  COULD_BE_WRONG_BECAUSE: [list]
  APPEND_TARGET: <§-reference>
```

No empty fields. An empty field = halt and ask, not skip.

**Why:** parent §0.4 handoff contract; §5.7 (evidence at every handoff).

### COAX-8 — Kill-switch + revert section

Every plan includes an explicit "Revert Contract" section BEFORE the task list. Revert must be stupid-simple: one env-var flip OR one file delete OR one git revert.

If the plan does not have a clean revert path, v2 marks it `🔴 DESTRUCTIVE_WITHOUT_SAFE_REVERT` and requires user greenlight before writing the task list.

Format:
```markdown
## Revert Contract

To fully revert this plan's deliverable:

\`\`\`bash
<one or two commands>
\`\`\`

Zero data migration. Zero code rollback beyond what's scripted above.

If revert fails, fall back to: <named human process>.
```

**Why:** parent §5.5 master + per-flag kill switches; MEMORY.md `project_experiment_safety_seed.md`, `project_claudemd_breakage_apr2.md`.

### COAX-9 — Additive feedback interpretation default

Prominent rule banner at the top of the Self-Review section:

```
⚠️ ADDITIVE FEEDBACK DEFAULT
When interpreting user feedback on this plan:
- "also X" = ADD X (never replace)
- "not just X, also Y" = keep X AND add Y
- "what about Z" = investigate Z AND preserve current plan
- ONLY interpret as destructive when the user explicitly says "instead", "remove", "replace with", "delete", or "stop doing X"
- If ambiguous, ask — never assume destructive.
```

**Why:** parent §4 citations 35–36 (the single most damaging failure mode catalogued in the session); MEMORY.md `feedback_interpret_feedback_as_additive_unless_founder_explicitly_says_delete.md`, `feedback_modernization_is_additive_not_replacement.md`.

### COAX-10 — Parent-Agent Self-Enforcing Loop awareness

If this plan will be executed by subagent dispatch (the PART A "Subagent-Driven" option), the Execution Handoff section MUST include this block:

```markdown
## Parent-Agent Loop Obligation

The parent agent dispatching subagents for this plan MUST:

1. Read `PARENT-AGENT-SELF-ENFORCING-LOOP.md` and print `PARENT_LOOP_READ: YES` before dispatch.
2. Treat every subagent output as a live test of this plan's charter — not a completion certificate.
3. Independently verify each task's verification contract (run commands, don't self-assess).
4. On subagent drift: log TOOL_REPAIR naming what in the plan let the drift through, repair the plan, re-dispatch with the repaired charter. Never accept drifted output by lowering the bar.
```

Also, every Task in the plan gets a "Verification" subsection with falsifiable pass/fail items (not just "tests pass").

**Why:** PARENT-AGENT-SELF-ENFORCING-LOOP.md in full; the user-directive 2026-04-23 that the pattern must be visible to every parent agent.

---

## PART C — User-facing summary (speak-human)

**What this skill does in one sentence:** Writes a plan that the user can green-light in one read — because it shows up in Obsidian automatically, names the initiative it belongs to, admits what's uncertain, and comes with a one-command undo.

**What it does NOT do:** Replace superpowers-writing-plans v1. v1 is still available. This skill just adds guardrails on top.

**When to use v2 over v1:** any time the plan is for product work inside the `auto-calibrating-agent-os` initiative (until the A/B test flag `FEATURE_SUPERPOWERS_PLANS_V2_ENABLED` resolves). Outside this initiative, v1 is the default.

---

## PART D — Merged Self-Review (v1 + v2)

After writing the complete plan, run both v1 self-review AND v2 checks:

**From v1 (PART A):**
1. Spec coverage — every requirement has a task
2. Placeholder scan — no "TBD" / "TODO" / "handle edge cases"
3. Type consistency — names match across tasks

**Added by v2:**
4. **Architecture check (PART B-0)** — did I actually let `/on-talking-about-code`, `/gap`, and `/reflect` shape this plan? I should be able to point to where each shows up: the user-journey-fused meaning of each change (not its code), the where-we-are / where-we-need-to-be / in-and-out-of-scope framing, and the sharpened articulation of intent. If any section reads like machinery rather than a person's experience, I haven't composed in the register yet — return and re-render that section before declaring the plan ready. (This is a reflection I answer with judgment, not a gate I pass.)
5. **Frontmatter check** — all COAX-3 fields populated?
5. **Ascendant chain check** — COAX-4 block present and truthful?
6. **Probability qualifiers** — COAX-5 on every factual claim?
7. **Speak-human check** — user-facing sections readable without jargon?
8. **Handoff contract check** — COAX-7 block at end with zero empty fields?
9. **Revert contract check** — COAX-8 section present with runnable commands?
10. **Additive-feedback banner** — COAX-9 banner visible in Self-Review?
11. **Loop-obligation block** — COAX-10 present if subagent execution chosen?

If any fail, fix inline. Never punt to "later."

---

## PART E — Anti-Scope Clarifications

- v2 does NOT replace v1. Both coexist. A/B test AB-002 measures which one produces better outcomes.
- v2 does NOT modify any v1 file. v1 lives at `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/writing-plans/SKILL.md` and is byte-unchanged.
- v2 does NOT require governer2 to be live. v2 can be manually invoked under `FEATURE_SUPERPOWERS_PLANS_V2_ENABLED=true` before governer2 ships.
- v2 is NOT finished — it's a v0.1. The 10 coaxes are current-best-understanding. Revisions land as §17.N entries in the parent doc.

---

## PART F — Planning Instincts (user-stated, 2026-05-13)

These are taste-level instincts the user named directly during a portfolio Hero plan in session focused-golick-926bb1. They are not gates and not checks — they are the register a well-written plan sits in. Every plan produced under v2 should be readable through this lens.

### INSTINCT-1 — Inline the resulting impact, not the reference to a change

A plan that says "rewrite the Hero paragraph in user voice" forces the reader to ask what the new paragraph would actually say. A plan that *inlines the actual resulting Hero paragraph* lets the reader read it, feel it, and authorize it in the same breath. Prefer plans where every change reference is accompanied by the literal resulting text, code, or UX state it produces — so authorization can happen instantly without the reader having to simulate the outcome in their head.

When the resulting text is too long to inline (multi-page documents, large code blocks), inline at minimum the first paragraph, the opening of each section, or the load-bearing sentences — enough that the register and direction of the change is felt directly rather than described abstractly.

### INSTINCT-2 — Use `/how-to-talk-like-the-founder` over undefined variables

Whenever a plan contains prose that will be read by the user, in user-facing voice, or as user-authored copy — load `/how-to-talk-like-the-founder` and the voice samples *before drafting that section of the plan*, not after. The plan itself is a user-facing artifact; treating it as agent-internal documentation and filling it with placeholders like `{new opening paragraph}` or `{user voice copy here}` defers the voice work to a later turn and forces the reader to authorize an undefined variable. Authorize the actual voice, in the actual register, in the actual plan.

### INSTINCT-3 — No clarifying-question debt

A plan that ends with the reader needing to ask a clarifying question before authorizing has already failed. Pre-resolve clarifying questions inside the plan: name the decision, predict the answer with reasoning, commit to the prediction, and let the reader veto or correct in one move. Plans that leave decisions implicit ("the exact wording will be determined in execution," "the layout will be finalized during implementation") create authorization debt the reader has to pay before approving — and that debt is the failure mode this instinct exists to catch.

If a genuine open question exists, name it explicitly and commit to the prediction the plan will execute against — never leave it as an undeclared variable.

### INSTINCT-4 — Synthesize the perspectives into coherent statements

Every load-bearing statement in a plan should synthesize four things into one coherent reading:

1. **The overarching intent** the statement serves — what larger goal does this change participate in.
2. **The actual semantically positioned outcome** the statement produces — what specifically results, in the system, in the UX, in the prose, in the data.
3. **The actual conditions** the statement operates under — what is true that makes this the right move (state of the system, prior decisions, available evidence).
4. **The actual connections between the layers of intent** being articulated — how this statement's layer relates to the layer above it (the parent intent it serves) and the layer below it (the sub-changes it generates).

Plans that list perspectives without synthesizing them ("here's the technical view, here's the UX view, here's the user view") force the reader to do the synthesis. The synthesis is the agent's job. Do it in the plan, in the sentence, in the structure of how the change is named.

### How these instincts compose with the existing COAXes

- INSTINCT-1 sharpens **No Placeholders** (PART A, line 122): "no placeholders" becomes "inline the actual resulting text, not just the spec of what will replace the placeholder."
- INSTINCT-2 sharpens **COAX-6 (speak-human tone)**: speak-human is the floor; user-voice via `/how-to-talk-like-the-founder` is the register when the prose will be read as the user's words.
- INSTINCT-3 sharpens the **Self-Review** pass (line 138): add "does any section require a clarifying question before authorization" as a self-review item.
- INSTINCT-4 sharpens **COAX-4 (ascendant-chain confirmation)** by extending the synthesis discipline from the top-level intent down into every load-bearing statement in the plan body.

---

## Source-integrity footer

- v1 source hash (SHA-256): `90056bad3d5f196fa7c9fec0ffe592e6d9c86bc983e406642a51d1a4198b7024`
- v1 source path (read-only, do NOT edit): `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/writing-plans/SKILL.md`
- v2 lives at: `~/.claude/skills/superpowers-writing-plans-v2/SKILL.md`
- Companion: `~/.claude/skills/superpowers-writing-plans-v2/ALIGNMENT-ADDITIONS.md` (per-COAX rationale + citations)

---

*END — v2 SKILL.md v0.1. Additions are additive. Revisions logged in parent §17.*

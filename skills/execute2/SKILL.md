---
name: execute2
description: "Dispatch a single subagent on a task with full alignment discipline baked in — ascendant-context read, falsifiable verification contract, RECOVERABLE_DRAFTS handoff, and parent self-enforcing loop. Use when you (parent agent) want to delegate a discrete task to a subagent and get back work that you can independently verify with runnable commands instead of trusting self-assessment. Portable: works for any task in any project. Validated 2026-04-23 by T13-LBL-001 substrate test (9/9 V1-V9 PASS) within the auto-calibrating-agent-os initiative; this skill extracts that pattern as a reusable command."
triggers:
  - "execute2"
  - "dispatch with discipline"
  - "dispatch a subagent with verification"
  - "subagent with handoff contract"
  - "delegate task with parent verification"
---

# /execute2 — Disciplined Subagent Dispatch (portable pattern)

## What this skill does

When you invoke `/execute2 <task description>`, this skill walks you (the parent agent) through dispatching ONE subagent with the full alignment discipline that was validated end-to-end on 2026-04-23 (T13-LBL-001 substrate test, 9/9 verification PASS). The pattern is portable — it works for any task in any project, not just inside the auto-calibrating-agent-os initiative.

**Core idea:** every dispatch is simultaneously the task AND a live test of the alignment substrate. When the subagent drifts, you (parent) repair the tool that let the drift through before re-dispatching — never lower the bar.

**What you get:** a subagent return you can independently verify with `ls`, `grep`, `wc`, or domain-specific runnable commands — not a self-assessed "done."

## When to use

Use `/execute2` when:
- You're a parent agent and the next step is delegating a discrete task to a subagent
- You want falsifiable verification of the subagent's work, not "looks good"
- The task has clear deliverable artifacts (files, schemas, specs) you can check with commands
- You're willing to spend 30–60 seconds on the parent verification step on return

Don't use `/execute2` when:
- The task requires synchronous in-conversation interaction (the subagent runs in background)
- You can't define a falsifiable verification contract (then your task isn't ready to dispatch — refine it first)
- The work touches code or systems where an additional human review gate must precede execution (use a more constrained pattern like `/governer` or stop and ask the human)

## The 7-step dispatch sequence

Walk through these in order. Print each step's heading as you complete it so the user can see the substrate firing.

---

### Step 1 — Define the task in 1-3 sentences

Write the task you're dispatching as a clear, scoped statement. Not "improve X" — "produce a YAML schema covering A, B, C and verify against existing telemetry source D."

If you cannot state the task in ≤3 sentences, the task is too big — decompose first.

---

### Step 2 — Identify the ascendant chain

What context must the subagent read before acting? List file paths the subagent should consume in order, parent-to-self.

**Inside an initiative with canonical rules** (e.g., auto-calibrating-agent-os):
- L0 root intent → L1 grandparent initiative → L2 parent intent → L3 rules index → L4 guide/rules → L5 self charter

**Outside an initiative — minimum viable chain**:
- L0 project root context (CLAUDE.md, README, or top-level intent doc)
- L1 the immediate parent context (your current session intent or the task's domain doc)
- L2 self charter (a brief you write inline OR a doc you create for the subagent)

Write the chain as a numbered list with full file paths.

**ANY CHARTER THAT COMMITS, MERGES OR PUSHES IN <frontend-repo> / <api-repo> / <landing-repo> — read
`.claude/staging-sweep/CLAIMS.md` first and put it in the chain (TOOL_REPAIR 2026-10-08).**
While its rule 3 names a coordinator session, only that coordinator commits/merges/pushes shared staging: the
charter must end at "named branch off staging + a handoff entry appended to CLAIMS.md", never "push to staging".
Observed failure: a landing charter said "push nextai HEAD:staging"; the subagent stopped only because a test
happened to fail, and the parent had already pushed earlier batches directly before learning the rule existed.

**CONTINUATION WORK — prove where the predecessor's work lives before you charter (TOOL_REPAIR 2026-10-05).**
If the task resumes something an earlier agent was doing, the chain must name the branch and worktree
its commits are actually on, proven by command, never inferred from a worktree's name:
`git branch -a --contains <predecessor's last commit>` and `git worktree list | grep <that branch>`.
Check every path you hand over with `ls` first: task transcripts under `/private/tmp/.../tasks/` get
cleaned up, and the durable copy is `~/.claude/projects/<proj>/<session>/subagents/agent-<id>.jsonl`.
Also check for a landing branch someone already prepared (`git branch -a | grep -i land`).
Observed failure: a comparison-wave charter pointed at `seo/100x-comparison-wave3` because the
worktree was called `-wt-comparison`, but all 13 commits were on `seo/100x-comparison-wave3b` in
`-wt-wsb2`, and a `land/oct03-wave3b` branch already existed. The agent spent its whole run
reconstructing a queue that was never on the branch it was given. The subagent will be required to confirm reading each level in its first output.

---

### Step 3 — Draft the falsifiable verification contract (V1-V9 minimum)

Each Vn must be checkable with a runnable command (file exists, grep returns N+ hits, count matches expected, command exits 0). Avoid Vns that require human judgment.

Minimum-viable contract template — adapt per task:

```
V1 <output artifact 1> exists at <exact path>
V2 <output artifact 2> exists at <exact path> (if applicable)
V3 Spec/output covers <named element 1, 2, 3> — verify by grep on <pattern>
V4 <count check> — e.g., bundle has N items matching source data count
V5 At least <N> citations from existing artifacts (verify via grep)
V6 ASCENDANT_CHAIN_READ block populated in subagent's first output (verify via grep)
V7 Handoff contract complete with RECOVERABLE_DRAFTS field populated even on success
V8 SELF_HEAL_LOG block per low-confidence-self-heal pattern
V9 No code touched (if applicable) — verify via git diff or absence of file edits outside expected paths
```

Falsifiability test: if you cannot describe the runnable command for each Vn, it's not falsifiable — refine until you can.

---

### Step 4 — Compose the dispatch prompt (self-contained packet)

The subagent has zero memory of your conversation. The prompt must be self-contained. Include in this exact order:

1. **Subagent identity**: "You are <agent ID> dispatched by <parent ID> for task <name>"
2. **STOP banner**: "Read the full ascendant chain below before any action"
3. **Ascendant chain list** from Step 2 (full paths)
4. **DO NOT list**: explicit prohibitions (no code edits, no sibling reads, no parent-doc edits, no skill files, no self-evaluation)
5. **Required first-output blocks**: ASCENDANT_CHAIN_READ confirmation, charter understanding restatement
6. **Charter** from Step 1 (the task)
7. **Deliverable paths**: exact file paths the subagent must produce
8. **Verification contract V1-V9** from Step 3 (so the subagent knows what they'll be measured against)
9. **Handoff contract template**: required return format (see below)
10. **Why this matters**: 2-3 sentences naming what this dispatch tests / why the discipline matters

### Required handoff contract template (paste into prompt)

```
HANDOFF_CONTRACT:
  FROM:                 <subagent id>
  TO:                   <parent agent id>
  TASK:                 <one sentence grounded in charter>
  ASCENDANT_READ:       L0-L<N> YES
  INPUT_DOCS:           [list every source file read]
  OUTPUT_DOCS:          [every file written, every section appended]
  SELF_HEAL_LOG:        [INITIAL_CONFIDENCE → assumptions → resolutions → FINAL_CONFIDENCE → ITERATIONS]
  RECOVERABLE_DRAFTS:   [content of any partial work, even on success — preserves work if blocked]
  CONFIDENCE:           <%>
  CITATIONS:            [every fact source]
  UNKNOWN:              [what couldn't be verified — becomes follow-up open questions]
  COULD_BE_WRONG_BECAUSE: [explicit risks]
  APPEND_TARGET:        <where parent will record outcome>
```

Any empty field invalidates the return — subagent must halt and ask, not fabricate.

---

### Step 5 — Dispatch in background

Use the `Agent` tool with:
- `subagent_type: general-purpose` (most flexible) — or a more specialized type if appropriate
- `model: opus` (or sonnet for lower-stakes / faster turns)
- `run_in_background: true` (per memory `feedback_always_use_run_in_background_true_when_dispatching_subagents`)
- `mode: "bypassPermissions"` — **REQUIRED when the subagent writes to any path outside the project working directory** (e.g., `~/.claude/skills/`, `~/.claude/`, temp dirs). Without this, background subagents are restricted to writes within the project tree even though the parent session has `defaultMode: bypassPermissions`. The `defaultMode` from settings does NOT flow into subagent dispatches automatically.
- `prompt`: the full self-contained packet from Step 4
- `description`: a 3-5 word task summary

**When to use `bypassPermissions` vs leaving unset:**
- Subagent writes to `~/.claude/**`, `/tmp/**`, or any path outside the project tree → `mode: "bypassPermissions"`
- Subagent writes only within the project root (e.g., editing code, adding migration files) → leave unset (inherits project permissions)

Print the dispatch decision in chat:
```
🚀 /execute2 dispatching: <task name> | model: <opus|sonnet> | bg: true | ETA: <estimate>
```

Stay available to the user while the subagent works. Per memory `feedback_stay_in_conversation_after_dispatching_never_go_silent_tailing_agents` — do NOT silently wait.

---

### Step 6 — Independent V1-V9 verification on return (NEVER self-assessment)

When the subagent returns its handoff contract, **you (parent) must run each Vn check yourself with a runnable command**. Do not accept the subagent's self-claim.

Per the Anthropic Generator/Evaluator pattern + the user's explicit principle ("agents praise their own work — never self-evaluate"):

- For "file exists" checks → `ls -la <path>` and read the output
- For "grep returns N+ hits" checks → `grep -c '<pattern>' <file>` and read the count
- For "count matches" checks → run the count, compare to expected
- For "block present" checks → `grep` for the block header in the subagent's return text

Print each Vn result as a table:
```
| V1 | <method>          | claim: <subagent>       | actual: <command output>     | ✅ PASS / ❌ FAIL |
```

If all PASS → subagent's work is verified, mark task complete in your tracking surface.

---

### Step 7 — Tool repair if any Vn fails (parent self-enforcing loop)

If any Vn fails:

1. **Diagnose what in the dispatch tool let the drift through.** Was the charter ambiguous? Did the verification contract not specify what good looks like? Was the DO NOT list missing a constraint?
2. **Repair the tool**, not the subagent's output. Add the missing constraint to the charter template, the DO NOT list, the verification contract, or this `/execute2` skill itself.
3. **Re-dispatch** with the repaired tool — never accept drifted output by lowering the bar.
4. **Log the TOOL_REPAIR** in your tracking surface (or in the parent doc §17 if inside an initiative):

```
TOOL_REPAIR:
  DRIFT_OBSERVED:   <one line — what the subagent did that violated contract>
  ROOT_CAUSE:       <which part of the tool was insufficient>
  REPAIR:           <what you changed in the tool>
  RE_DISPATCH:      YES | NO
  OUTCOME:          <result of re-dispatch if applicable>
```

This is the parent-agent self-enforcing loop. Every dispatch is a live test of the substrate — when it breaks, you fix it before using it again.

---

## Anti-patterns (do NOT do)

- **NEVER accept self-assessment**: subagent saying "all checks pass" is not a check — re-run each Vn yourself.
- **NEVER silently re-dispatch the same charter** after a drift — that treats the symptom not the cause.
- **NEVER lower the verification bar** to make drifted output pass — the point is the tool caught the drift.
- **NEVER let the parent layer skip this loop** even if the subagent layer ran cleanly. The loop fires at every parent level recursively.
- **NEVER dispatch without a falsifiable verification contract** — without it, you can't tell if the work is right or just looks right.

## Why this overhead is worth it

Validated 2026-04-23 by T13-LBL-001 (Greenlight Bundling Batcher dispatch test): one Opus subagent received a self-contained packet, read the full ascendant chain, followed all canonical rules, produced two falsifiable artifacts (26 KB + 27 KB), returned with complete handoff contract including RECOVERABLE_DRAFTS, and the parent agent independently verified V1-V9 with `ls`, `grep`, `wc`. **9/9 PASS.** The substrate works.

The pattern was extracted from `auto-calibrating-agent-os/PARENT-AGENT-SELF-ENFORCING-LOOP.md` and `CANONICAL-RULES-INDEX.md` and packaged here so any agent in any project can invoke it.

## Relationship to other skills

- **`/governer`** — scoring + leverage routing. `/execute2` complements `/governer` — `/governer` decides IF this is worth dispatching; `/execute2` is HOW you dispatch with discipline.
- **`/governer2`** — experimental scoring with forced workflow stages and oracle enrichment. Different scope from `/execute2`. Both can be used in the same task.
- **`/execute`** (v1) — session-persistent adversarial team. `/execute2` is single-dispatch with verification, not a persistent team.
- **`/orchestrator`** — top-level coordination role. `/execute2` is what an orchestrator uses for each individual delegation.
- **`/dispatch-seed`** — pipeline from intent alignment to dispatch. Use `/dispatch-seed` to get a seed approved; use `/execute2` to dispatch the work that the seed describes.
- **`PARENT-AGENT-SELF-ENFORCING-LOOP.md`** (auto-calibrating-agent-os) — the originating doc. `/execute2` is the portable extraction.

## Minimum-viable mode (for ad-hoc dispatch outside an initiative)

If you're using `/execute2` outside an initiative with canonical rules, the ascendant chain shrinks to:
- L0: project root context (CLAUDE.md or top-level intent)
- L1: your session's task intent (write inline as the dispatch prompt's "Charter" section)
- L2: self charter (the brief)

Verification contract still required. RECOVERABLE_DRAFTS still required. Parent verification still required. The discipline is the value — don't skip it because the project is small.

## Author

Created 2026-04-23 by Lattice as the portable extraction of the auto-calibrating-agent-os dispatch pattern, in direct response to the user's ask for a packaged skill so the pattern's extendability could be tested in other contexts independently of the originating initiative.

Validation: T13-LBL-001 substrate test (9/9 PASS) — see `auto-calibrating-agent-os/initiatives/T13-greenlight-bundling-batcher/02-FIRST-BUNDLE.md` for the live exemplar of what a verified subagent return produces.

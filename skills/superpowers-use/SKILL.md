---
name: superpowers-use
description: "MANDATORY orchestrator that forces the full Superpowers workflow chain. Invoke at the start of ANY non-trivial task. Enforces brainstorm → plan → worktree → execute (TDD + subagents) → verify → review → finish. No skipping phases."
---

# Superpowers Full Chain Orchestrator

This skill forces the complete Superpowers development workflow as a sequential pipeline. Each phase is a hard gate — you cannot advance without completing the current phase.

<HARD-GATE>
You MUST complete each phase before advancing to the next. "This is simple enough to skip" is rationalization. The only exception is the user explicitly saying "skip brainstorming" or "skip planning" for a specific phase.
</HARD-GATE>

## When to Use

ANY task that involves writing or modifying code. The only exemptions:
- Pure questions with no code output
- Single-line typo fixes the user pointed to explicitly
- Reading/researching with no implementation

If you're unsure, use it. The cost of an unnecessary brainstorm is 2 minutes. The cost of skipping planning on a complex task is hours of rework.

## The Chain

```
Phase 1: BRAINSTORM ──→ Phase 2: PLAN ──→ Phase 3: WORKTREE ──→ Phase 4: EXECUTE ──→ Phase 5: VERIFY ──→ Phase 6: REVIEW ──→ Phase 7: FINISH
```

Each phase invokes a specific Superpowers skill. You MUST use the Skill tool to invoke each one — do not attempt to "do the spirit of the skill" from memory.

If the `superpowers` plugin is not installed, install it: `/plugin install superpowers@claude-plugins-official`.

---

## Phase 1: BRAINSTORM

**Invoke:** `superpowers:brainstorming`

**Gate:** Do NOT proceed until:
- [ ] You explored project context (files, docs, commits)
- [ ] You asked clarifying questions (one at a time)
- [ ] You proposed 2-3 approaches with trade-offs
- [ ] You presented the design in sections
- [ ] The user approved the design
- [ ] You wrote a spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- [ ] You ran the spec self-review (placeholders, consistency, scope, ambiguity)
- [ ] The user reviewed and approved the written spec

**Print to user at start:** "Phase 1/7: BRAINSTORMING — exploring your idea before any code."

**Exit condition:** User approves the written spec.

---

## Phase 2: PLAN

**Invoke:** `superpowers:writing-plans`

**Gate:** Do NOT proceed until:
- [ ] You mapped the file structure (what files get created/modified)
- [ ] You decomposed into bite-sized tasks (2-5 min each)
- [ ] Each task has: exact file paths, complete code blocks, test code, run commands with expected output
- [ ] No placeholders ("TBD", "TODO", "similar to Task N")
- [ ] You ran the plan self-review (spec coverage, placeholder scan, type consistency)
- [ ] Plan saved to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- [ ] You offered execution choice (subagent-driven vs inline)

**Print to user at start:** "Phase 2/7: PLANNING — writing implementation plan for the approved spec."

**Exit condition:** Plan written, self-reviewed, user chose execution mode.

---

## Phase 3: WORKTREE

**Invoke:** `superpowers:using-git-worktrees`

**Gate:** Do NOT write any implementation code on main/master without explicit user consent.
- [ ] Created isolated worktree for the feature
- [ ] Verified worktree is clean and on correct base branch

**Print to user at start:** "Phase 3/7: WORKTREE — isolating work from main branch."

**Exit condition:** Working in an isolated worktree.

**Skip condition:** User explicitly says to work on current branch, OR task is small enough that worktree isolation adds no value AND user confirms.

---

## Phase 4: EXECUTE

**Invoke one of:**
- `superpowers:subagent-driven-development` (recommended — if user chose subagent mode in Phase 2)
- `superpowers:executing-plans` (if user chose inline mode)

**During execution, EVERY code change MUST follow TDD:**
- Invoke `superpowers:test-driven-development` for each task
- Write failing test FIRST
- Watch it fail (mandatory — never skip)
- Write minimal code to pass
- Watch it pass
- Refactor only after green
- Commit after each task

**For subagent-driven mode, per task:**
1. Dispatch implementer subagent with full task text + context
2. Dispatch spec reviewer subagent — confirms code matches spec
3. Dispatch code quality reviewer subagent — confirms code quality
4. Fix any issues found by reviewers before advancing

**Gate:** Do NOT advance to Phase 5 until:
- [ ] All tasks from the plan are complete
- [ ] Every task followed red-green-refactor TDD cycle
- [ ] Spec compliance confirmed for each task
- [ ] Code quality confirmed for each task

**Print to user at start:** "Phase 4/7: EXECUTING — implementing plan with TDD and review gates."

**Exit condition:** All plan tasks complete, all reviews passed.

---

## Phase 5: VERIFY

**Invoke:** `superpowers:verification-before-completion`

**The Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

**Gate:** Do NOT proceed until:
- [ ] You identified verification commands for every claim
- [ ] You ran EVERY verification command (fresh, in this message)
- [ ] You read full output and checked exit codes
- [ ] You confirmed output matches expected results
- [ ] You stated results WITH evidence (not "should work")

**Verification checklist:**
- [ ] Test suite passes (show output: X/X pass, 0 failures)
- [ ] Build succeeds (show exit code 0)
- [ ] Linter clean (show 0 errors)
- [ ] Original requirements met (line-by-line check against spec)
- [ ] No regressions (existing tests still pass)

**Red flags — STOP if you catch yourself:**
- Using "should", "probably", "seems to"
- Saying "Done!" before running verification
- Thinking "partial check is enough"

**Print to user at start:** "Phase 5/7: VERIFYING — running all verification commands before claiming completion."

**Exit condition:** All verification commands run, all pass, evidence shown.

---

## Phase 6: REVIEW

**Invoke:** `superpowers:requesting-code-review`

**Gate:** Do NOT proceed until:
- [ ] You dispatched a code-reviewer subagent with git SHAs and context
- [ ] Reviewer returned findings
- [ ] All Critical issues fixed
- [ ] All Important issues fixed
- [ ] Minor issues noted (fix or acknowledge)

**Print to user at start:** "Phase 6/7: CODE REVIEW — dispatching independent reviewer before finishing."

**Exit condition:** Code review passed or all issues addressed.

---

## Phase 7: FINISH

**Invoke:** `superpowers:finishing-a-development-branch`

**Process:**
1. Verify tests pass (again — fresh run)
2. Present exactly 4 options:
   - Merge locally
   - Push and create PR
   - Keep branch as-is
   - Discard
3. Execute user's choice
4. Clean up worktree if applicable

**Print to user at start:** "Phase 7/7: FINISHING — integrating completed work."

**Exit condition:** User chose integration path, work integrated or preserved.

---

## Phase Tracking

At the START of each phase, print this status bar:

```
SUPERPOWERS CHAIN: [1-BRAINSTORM] → [2-PLAN] → [3-WORKTREE] → [4-EXECUTE] → [5-VERIFY] → [6-REVIEW] → [7-FINISH]
                    ^^^^^^^^^^^^
                    YOU ARE HERE
```

Update the pointer for each phase. This gives the user a persistent visual of where you are in the pipeline.

## Handling Bugs During Execution

If you encounter a bug during Phase 4 (EXECUTE):
1. **Invoke** `superpowers:systematic-debugging`
2. Find root cause BEFORE attempting fixes
3. Write a failing test that reproduces the bug (TDD)
4. Fix minimally
5. Verify the fix
6. Resume execution

## Handling Parallel Tasks

If Phase 2 (PLAN) reveals 2+ independent tasks:
1. **Invoke** `superpowers:dispatching-parallel-agents`
2. One agent per independent problem domain
3. Each agent follows TDD independently
4. Coordinate results before advancing to Phase 5

## Anti-Patterns This Skill Prevents

| Without this skill | With this skill |
|---|---|
| Jump straight to code | Must brainstorm and get approval first |
| Write code, then tests | Must write failing test first (TDD) |
| Claim "it works" without running tests | Must show verification output |
| Self-assess quality | Independent reviewer subagent assesses |
| Work on main branch | Isolated worktree by default |
| Skip planning for "simple" tasks | Every task gets a plan |
| Merge without review | Code review gate before finish |

## User Overrides

The user can override any phase:
- "Skip brainstorming" → jump to Phase 2
- "Skip planning" → jump to Phase 3 (only if requirements are crystal clear)
- "No worktree needed" → skip Phase 3
- "Skip TDD" → execute without test-first (user must explicitly say this)
- "Skip review" → jump to Phase 7

These overrides must be EXPLICIT. You cannot infer them. "Just do it" does NOT mean skip phases — it means execute the phases efficiently.

## Quick Reference

| Phase | Skill to Invoke | Key Gate |
|---|---|---|
| 1. Brainstorm | `superpowers:brainstorming` | User approves spec |
| 2. Plan | `superpowers:writing-plans` | Plan written + self-reviewed |
| 3. Worktree | `superpowers:using-git-worktrees` | Isolated branch created |
| 4. Execute | `superpowers:subagent-driven-development` or `superpowers:executing-plans` | All tasks done + reviewed |
| 5. Verify | `superpowers:verification-before-completion` | All checks pass with evidence |
| 6. Review | `superpowers:requesting-code-review` | Reviewer approved |
| 7. Finish | `superpowers:finishing-a-development-branch` | User chose integration path |

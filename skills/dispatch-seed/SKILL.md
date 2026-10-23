---
name: dispatch-seed
description: Pipeline from intent alignment to agent dispatch. Runs /align until confirmed, creates observable seed in Obsidian, generates plan with docs-first approach, then dispatches. The full lifecycle from "I want this done" to "an agent is working on it."
triggers:
  - /dispatch-seed
  - when the user says "dispatch an agent on this"
  - when the user says "send an agent to do this"
  - when the user has a task they want an autonomous agent to handle
implements_seed: alignment-integration-edge-1
---

# Dispatch Seed — From Intent to Running Agent

## What This Skill Does

Takes a task the user wants done and walks through the full pipeline:

1. **Align** — clarify what the user actually wants (using /align)
2. **Seed** — create an observable seed file the user can review in Obsidian
3. **Plan** — write documentation for what the finished product looks like BEFORE building
4. **Dispatch** — hand the seed to an agent in an isolated worktree

The user stays in control at every step. Nothing moves without confirmation.

## When to Use This

- The user describes a task they want an agent to handle autonomously
- You have an approved proposal from the proposals queue
- The gap scanner surfaced an intent gap worth addressing

## When NOT to Use This

- Simple tasks you can do directly (typo fix, one-line change)
- Tasks that require the user's active involvement throughout
- Tasks that modify the hook system or CLAUDE.md (too risky for autonomous dispatch)

---

## Step 1: Align

Run `/align` on the task. This is a conversation, not a command.

**Your goal:** arrive at 2-3 specific UX intent statements the user confirms. Each one should be testable — "when X, the user sees Y."

**Don't move past this step until:**
- The user has confirmed the intent (green dots on the intent map)
- You can state in one sentence what the agent will do
- You know what "done" looks like in terms a non-coder can verify

**Output of this step:** Confirmed intent statements with certainty ≥ 90%.

---

## Step 2: Create the Seed

Generate a seed file in `docs/intent/seeds/` using this template:

If the `docs/intent/seeds/` folder does not exist, create it.

```markdown
---
name: {short-name}
parent_seed: docs/intent/{parent-intent}.md
type: agent-seed
status: proposed
certainty: {from step 1}%
worktree: {short-name}
---

# Seed: {What the agent will do — plain language}

## What this makes possible

{One paragraph. What becomes true when this is done that isn't true now.
Use the user's confirmed words from Step 1.}

## The specific gap this closes

{One paragraph. What's wrong or missing right now.}

## What success looks like

{Bullet points. Concrete things you can check to verify it worked.
Each one should be verifiable by running a command, looking at the app,
or checking a file — not by reading the agent's self-assessment.}

## Scope boundaries

- IN SCOPE: {what the agent should work on}
- OUT OF SCOPE: {what the agent must NOT touch}
- CRITICAL CONSTRAINTS: {anything that could break if done wrong}

## Agent execution instructions

1. Read this seed — it is your contract
2. Commit your work referencing: Implements-Seed: {filename without .md}
3. Before marking done, run your verification items and show actual output
4. Use /agent-outcome-summary to produce your completion report
```

**Tell the user:** "I've created a seed file at `docs/intent/seeds/{name}.md`. You can see it in Obsidian. Review it — if anything is wrong, edit it directly or tell me what to change. When it looks right, say 'approved' and I'll dispatch the agent."

**Don't move past this step until the user approves the seed.**

---

## Step 3: Write Docs-First Plan

Before dispatching, write documentation for the finished product AS IF it's already built. Add it to the seed file as a "## How the user uses this" section.

This documentation should answer:
- What command do you run (if any)?
- What do you see when it's working?
- What do you see when it's broken?
- How do you undo it if it went wrong?

**Why docs-first:** If you can't write clear docs for what the finished product does, the agent can't build it clearly either. The docs ARE the spec. The agent will read these docs and implement to match.

---

## Step 4: Dispatch

Run:

```bash
git worktree add .claude/worktrees/seed-{name} -b seed/{name}
```

This will:
1. Register the seed for intent injection (the agent gets reminded of the intent every 10 tool calls)
2. Create an isolated worktree for the agent
3. Print the dispatch command to paste into Claude Code

For A/B testing (comparing with and without injection):
```bash
# Agent A — with injection
git worktree add .claude/worktrees/seed-{name}-injected -b seed/{name}-injected

# Agent B — without injection (control)
git worktree add .claude/worktrees/seed-{name}-control -b seed/{name}-control
```

Tell the user: "Agent dispatched in worktree `seed-{name}`. It's working in isolation — nothing can affect your main codebase. I'll tell you when it's done."

---

## Step 5: Review (after agent completes)

When the agent finishes:

```bash
git diff HEAD...seed/{name}
```

This shows: what the agent was supposed to do (from the seed), what it actually did (the diff), and a review checklist.

For A/B comparisons:
```bash
git diff seed/{name}-injected seed/{name}-control
```

Tell the user: "The agent is done. Here's what it did: {one-sentence UX summary}. The diff is {N} files, {M} lines. Want me to show you the review, or do you want to merge/delete directly?"

---

## Step 6: Decide

The user says merge or delete. Execute whichever they choose.

Merge: `cd /path/to/repo && git merge seed/{name} --no-ff`
Delete: `git worktree remove --force .claude/worktrees/seed-{name} && git branch -D seed/{name}`

---

## What This Skill Does NOT Do

- Modify settings.json or the hook system
- Dispatch agents on tasks that touch payments, coaching prompts, or auth
- Skip the alignment step (Step 1 is not optional)
- Proceed without user confirmation at Steps 1, 2, and 6

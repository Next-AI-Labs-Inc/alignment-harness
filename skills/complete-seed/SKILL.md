---
name: complete-seed
description: Agent-invoked completion gate. When an agent believes its work is done, this skill forces it to collect evidence — load the page, grab screenshots, run verification commands from the seed's success criteria. The agent invokes this itself when it's ready. No hooks, no interrupts.
triggers:
  - /complete-seed
  - when an agent says "I'm done" or "task complete"
  - when an agent is about to mark a task as finished
implements: confirmed-intent-map Intent 2
---

# Complete Seed — Evidence Collection Before Completion

## What This Does

You invoke this when you believe your work is done. It walks you through collecting EVIDENCE that your work actually did what the seed says it should do. You cannot mark the task complete until you've done this.

This is not a punishment. This is how you prove to yourself and the user that the work is real. An agent that collects evidence is an agent that can be trusted with bigger tasks next time.

## When to Invoke

When you think you're done with a seed task. Before your final message. Before marking any task complete.

## Step 1: Re-read the Seed

Read the seed file you were given. Find the "What success looks like" section. Each bullet point is a success criterion you need to verify.

List them out:

```
Success criteria from seed:
1. {criterion 1}
2. {criterion 2}
3. {criterion 3}
```

## Step 2: Verify Each Criterion

For each criterion, run a concrete verification:

- **If it's about a page loading or looking right:** Use DevTools MCP or Playwright to load the page and capture a screenshot. Save it to `docs/intent/seeds/evidence/{seed-name}/` with a descriptive filename. If the `docs/intent/seeds/evidence/{seed-name}/` folder does not exist, create it.

- **If it's about an API returning something:** Run a curl command and paste the actual output.

- **If it's about code existing or not existing:** Run a grep and paste the result.

- **If it's about a test passing:** Run the test and paste the output.

- **If you CANNOT verify something:** Say so explicitly. "I cannot verify criterion 3 because the staging server is not running." Do NOT substitute your opinion for evidence.

## Step 3: Build the Evidence Report

For each criterion, tag it:

```
## Evidence Report

### Criterion 1: {description}
**Status:** VERIFIED
**Evidence:** {actual command output or screenshot path}

### Criterion 2: {description}
**Status:** UNVERIFIED — {reason you couldn't verify}

### Criterion 3: {description}
**Status:** BLOCKED — {what's preventing this}
```

## Step 4: Attach Evidence to the Seed

If you have screenshots, save them to `docs/intent/seeds/evidence/{seed-name}/` and add links to the seed file:

```markdown
## Evidence (collected {date})

![{description}](evidence/{seed-name}/{filename}.png)

{evidence report from Step 3}
```

## Step 5: Update Seed Status

Update the seed's frontmatter `status` field:

- If ALL criteria are VERIFIED → `status: evidence-collected`
- If SOME are verified, some unverified → `status: partial-evidence`
- If ANY are BLOCKED → `status: blocked`

## Step 6: State What Changed for the User

Write one sentence per change in the format:
"When {user does X}, they now see {Y} because {Z}"

This is what the user reads. Not what files you edited. What changed in the experience of the product.

## What This Skill Does NOT Do

- It does not merge code
- It does not modify hooks or settings.json
- It does not self-assess quality ("I think the code is good") — it collects EVIDENCE
- It does not mark the task as approved — only the user does that

## After This Skill Completes

The seed file now has evidence attached. The user can open it in Obsidian, see the evidence, and decide: approve (merge the work) or reject (delete the worktree). The user doesn't have to dig through transcripts or ask what happened — the seed tells the whole story.

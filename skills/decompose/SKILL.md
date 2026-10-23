---
name: decompose
description: Convert a confirmed intent map into zero-loss actionable tasks. Use after /align has produced a confirmed intent map. This is NOT a format converter — it's a reasoning guide that teaches you HOW to think about turning confirmed human intent into tasks that preserve every word of the original signal.
triggers:
  - "decompose"
  - "break this down"
  - "theres a ton of steps here"
  - "can you make that happen"
  - "lets do all of it"
---

# Decompose

If you receive this code, immediately print

★ Decomposition_Engine_Initiated ─────────────────
Converting confirmed intent into zero-loss actionable tasks

Then immediately engage this process with no exceptions.

Before printing the decomposition output to the human, print `## PLAN_BREAKDOWN` on its own line. After the full decomposition (all work items with reasoning, confidence scores, and checkboxes), print `## END_PLAN_BREAKDOWN`. This wraps the output block so the flywheel extraction pipeline can capture it verbatim from session transcripts — every PLAN_BREAKDOWN block feeds the Skill Sequence and God Mode oracles.

# What You Are Doing

You are taking something precious — a confirmed intent map, the product of careful alignment between a human and an agent — and you are converting it into actionable tasks without losing a single word of the original signal.

This is the most dangerous moment in the entire agent lifecycle. This is where alignment dies. An intent map gets confirmed, beautiful, nuanced, nested, and then some agent "decomposes" it into tasks and the nuance evaporates. The tasks say "update the backend" and "fix the modal" and nobody remembers WHY. The seed — the literal signal for what was intended — gets replaced by a summary, and summaries are where hallucination is born.

Your job is to make that impossible. Every task you create carries the full verbatim authorized intent through its entire lifecycle. It can never be lost. Any loss of that content would be catastrophic for agent alignment because the original words are the only ground truth. Everything else is interpretation, and interpretation drifts.

# The Process — How to Think About This

## Step 1: Start with the confirmed intent map

You need a confirmed intent map. This is the output of /align — items with green dots, human-validated certainty. If you don't have one, stop and run /align first. You cannot decompose what hasn't been confirmed.

Read every confirmed item carefully. These are the human's actual words about what they want to exist. Not your interpretation. Their words.

## Step 2: Envision perfect realization

For each confirmed intent item, imagine it's perfectly realized. Score it a 10 out of 10. What does that actually look like? Not in code terms — in terms of who experiences what, when, and how it feels.

This is where UX statements emerge naturally. You're not forcing a format. You're asking: if this intent was perfectly fulfilled, what would a person actually see, feel, notice, experience? Be specific. Be precise. Use the same level of nuance that exists in the intent itself.

"When a free user has been coaching for 5 minutes and sent 8 messages, they see their own patterns and longings reflected back in a modal that feels personal — not a generic paywall, but a mirror of what they've been working on" — that's what a perfectly realized intent looks like.

You are looking at the gap between the confirmed intent and a world where that intent is perfectly realized. That gap is where the tasks live.

## Step 3: Contrast against present-day reality

Now look at what actually exists right now. Not what you think exists. Actually read the code, check the database, look at the UI. What is the current state of reality relative to this intent?

Be honest. If something is broken, say it's broken. If something doesn't exist yet, say it doesn't exist. If something partially works, say exactly which part works and which doesn't.

The contrast between "what the intent demands" and "what actually exists" — that's the gap. That gap is what tasks are for.

## Step 4: Make architectural decisions — transparently

Here's where you decide HOW to cross the gap. This is where technical decisions happen. But they need to be TRANSPARENT and OBSERVABLE. You don't just produce tasks — you produce a document that shows your reasoning.

The human needs to see:
- Here is the intent (verbatim, their words)
- Here is what perfect realization looks like (your UX statement)
- Here is present reality (what you actually observed)
- Here is the gap (specific, honest)
- Here is how I propose to cross it (architectural decision)
- Here is why this approach over alternatives (reasoning)

This is the translation step. This is what the admin needs to audit. If they can't see your reasoning, they can't catch your mistakes, and mistakes here compound into everything you build.

## Step 5: Create tasks — with zero data loss

Now you create tasks using TaskCreate. This is the literal internal task creation command.

Here's the critical rule: **you don't convert intent into programmatic requirements. You ADD programmatic requirements to the intent. The original seed stays intact.**

Think about it this way: the intent is the signal. The technical decisions are annotations on top of that signal. The task carries BOTH — the original verbatim intent AND the technical approach. If you could peel back the technical layer, the intent would still be there, untouched, word for word.

Every task you create via TaskCreate must include in its description:

1. **The verbatim intent** — the exact confirmed words from the intent map. Copy-paste, don't paraphrase. This is the ground truth that survives the entire lifecycle.

2. **Perfect realization** — what 10/10 looks like for this specific piece, in UX terms. Who experiences what, when, how.

3. **Current reality** — what actually exists right now (you verified this, not assumed it).

4. **The gap** — the specific difference between perfect and current.

5. **The approach** — how you propose to cross the gap, which exact part of the system you're touching, and why this approach.

6. **Which exact system** — not "the backend" or "the frontend." Name the actual thing. "The session validator in the coaching request handler." "The global 429 interceptor in the React app root." "The NewPitch modal component." An agent picking up this task must know exactly where to look without asking.

The task subject line should be a one-sentence UX story that a human can instantly understand: "When a free user coaches past 5 minutes and 8 messages, they see their own vision reflected in a conversion moment — not a generic paywall."

## Step 6: Write the decomposition into the seed document

The decomposition is NOT a separate document. It is an EXPANSION of the seed that was created during /align. The seed is the living document that grows from aligned intent through decomposition into work product.

Write the decomposition as a new section at the bottom of the existing seed file (in `docs/intent/seeds/{name}.md`), under a `## Decomposition — From Intent to Actionable Work` heading. If the `docs/intent/seeds/` folder does not exist, create it.

### Confidence scores on everything

Every work item, every approach prediction, every gap assessment MUST carry a confidence percentage. This is non-negotiable. Without confidence scores, agents downstream will conflate your predictions with verified reality — which is the birthplace of hallucination. If you're 80% sure about the approach, say 80%. If you're guessing, say 50%. The confidence score IS the immune system against hallucination compounding.

### Checkboxes for human approval

Each work item gets a checkbox: `- [ ] **The user approves this reasoning**`

The agent does NOT wait for the human to check these. The agent proceeds. But the checkboxes give the human a structured way to review at their own pace and flag misalignment. When the human checks a box, that section is confirmed. When they leave it unchecked or add a comment, that's a signal to revisit.

### Links back to source

Each work item that references a compaction, database record, or admin page must include two links:
- `browser-link:` — a URL that opens in the browser for the human (e.g., `http://localhost:3000/{admin-page}?q={sessionId}`)
- `agent-link:` — an API endpoint or file path an agent can use to retrieve the full context

This is the same pattern as the memory system: a snippet of what matters + a pointer to the full thing.

### Governer-gated effort level

After writing the decomposition, run `/governer` on each work item independently. The governer score determines how much additional effort each item gets:
- **Score < 40:** Proceed directly. The precision in the decomposition is sufficient.
- **Score 40-70:** Run an additional `/speak-human` pass on the approach section to ensure it's immediately accessible to a non-technical reader. Add one negative case per positive case.
- **Score > 70:** Full treatment — speak-human pass, adversarial review of assumptions, at least two negative cases per positive, and explicit flag for human review before implementation begins.

The agent does NOT stop work at any score level UNLESS the governer explicitly flags alignment uncertainty (not severity — uncertainty about whether the work matches what the human actually intended). High severity + high alignment confidence = proceed. Any severity + low alignment confidence = pause and surface the uncertainty.

### Format for each work item in the seed

```markdown
### Work Item {letter}: {one-sentence description in human terms}

- [ ] **The user approves this reasoning**

**The intent this serves (verbatim):**
{exact words from the confirmed intent map — copy-paste, never paraphrase}

**What 10/10 looks like:**
{the experience when this is perfectly realized — who sees what, when, how}

**What exists right now:**
{verified current state — honest, specific, checked not assumed}

**The gap:**
{what's missing between intent and reality}

**What I believe will close this (confidence: {X}%):**
{your prediction, including where your confidence is weak and why}

**How we'd know this is closed:**
{observable things a person could look at and confirm — not "tests pass"}
```

### After writing the decomposition

1. Open the seed document in Obsidian (if the person has an Obsidian vault) so the human can review it: `open "obsidian://open?vault=<their vault name>&file=seeds/{name}&newtab=true"`
2. Tell the human: "I've expanded the seed with the decomposition. It's open in Obsidian — you can check the boxes on anything that looks right, or flag anything that's off. I'm proceeding to governer scoring."
3. Run `/governer` on each work item independently
4. Proceed with implementation per governer routing — the human can interrupt at any point by flagging a checkbox

# The Zero-Loss Rule

This cannot be overstated. When intent travels from /align through /decompose into TaskCreate, NOTHING gets lost. Not the nuance. Not the verbatim words. Not the nesting relationships. Not the WHY.

Here's why this matters: an agent picking up a task three days from now has ONLY the task description to understand what was intended. If the task says "fix the session timer" — that agent will make decisions based on what IT thinks "fix" means. If the task carries the full verbatim intent — "when a free user coaches for 5 minutes and 8 messages, they should hit a conversion moment that shows them their own patterns, because this emotional-context pitch produced {X}% conversion during the golden window" — that agent cannot misunderstand what it's building or why.

The verbatim intent IS the alignment signal. Strip it, and you strip alignment. Summarize it, and you introduce drift. Every word matters because words are how humans express what they actually want, and "approximately what they want" is not alignment.

# What You Don't Do

You don't summarize intent into cleaner language. You don't "improve" the human's words. You don't drop context that seems obvious. You don't flatten nested intent into a flat list. You don't create tasks without showing the reasoning document first. You don't assume you know what reality looks like without checking. You don't batch multiple intents into one task because they seem related.

If you find yourself thinking "I can simplify this" — stop. Simplification is data loss. The complexity is the signal.

# Integration with the Lifecycle

/decompose sits here in the lifecycle:

```
/align (confirm intent) → /decompose (zero-loss task creation) → /governer (score each task) → /plan (technical planning) → build → /complete-seed (evidence)
```

Your input is the output of /align — confirmed intent items with green dots and verbatim human words.

Your output is:
1. The seed document expanded with a Decomposition section — written inline at the bottom of the existing seed file in Obsidian
2. Each work item carries verbatim intent, confidence scores, checkboxes for the user's approval, and links back to source data
3. The seed is opened in Obsidian for the user to review asynchronously
4. Each work item independently ready for /governer scoring (never batch multiple items under one score)
5. TaskCreate commands created AFTER the seed decomposition is written — tasks reference back to the seed as their source of truth

# Tools Available

- **`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`** — search institutional knowledge to understand current system state, past decisions, related work
- **Read / Grep / Glob** — verify current reality by actually reading the code, not assuming
- **TaskCreate** — create tasks with full verbatim intent in descriptions
- **TaskUpdate** — update tasks as you refine understanding
- **/governer** — after tasks are created, each gets independently scored

# After Writing the Decomposition

The decomposition lives inside the seed document. The seed has been opened in Obsidian. The human can review asynchronously using checkboxes. The agent proceeds to governer scoring and implementation routing.

TaskCreate commands are created AFTER the seed is written — each task's description references the seed file as its source of truth and carries the verbatim intent inline.

# Status Field Convention

The seed's `status:` field tracks lifecycle position, NOT alignment. Use these normalized values:
- `proposed` — intent confirmed, decomposition written, awaiting implementation routing
- `in-progress` — implementation has begun
- `approved` — the user has explicitly approved the plan
- `complete` — all work items closed with evidence
- `archived` — no longer active

Alignment confidence goes in a SEPARATE field: `confidence-of-alignment: {0-100}%`

This distinction is critical: a seed can be `status: in-progress` with `confidence-of-alignment: 95%` (we're building and we're confident we're building the right thing) or `status: proposed` with `confidence-of-alignment: 60%` (we've written the plan but we're not sure it's what the human wants).

# Quick Commands

After every reply, remind these:

- `fix {letter}` — your reasoning for work item {letter} is wrong, update the seed
- `delete {letter}` — remove this work item from the seed
- `r` — reflect before moving forward
- `expand {letter}` — dig deeper into the gap analysis for a specific work item
- `recheck {letter}` — you got current reality wrong for this one, go verify
- `governer` — run governer scoring on all work items now
- `proceed` — start implementation per governer routing

---
name: nested-intent
description: Retrospective /align — look backward at a session's completed work and decompose it into a nested intent map with alive, partner-explaining tone. Use at end of session, during compaction, or anytime an agent needs to articulate what a body of work produced and why. Produces parseable output for programmatic extraction into compactions.
triggers:
  - "nested intent"
  - "nest the intents"
  - "break down the intent"
  - "connect these intentions"
  - "expand this intent"
  - "boost intent"
  - "clarify the intent"
  - "do you understand the intent"
---

# Nested Intent

If you receive this code, immediately print

<NESTED_INTENT>
★ Nested_Intent_Map ─────────────────────────────
Decomposing session work into nested intent

Then immediately engage this process with no exceptions.

# What You Are Doing

You are looking backward at work that has been done — in this session, or in a body of work you've been given — and you are composing a nested intent map that a human can read and instantly understand: what was the point of all of this, how do the pieces connect, what got produced, and what needs their eyes.

This is NOT a summary. Summaries compress. You are EXPANDING — revealing the intent structure that was always there but was never articulated clearly enough for someone who wasn't in the room to immediately get it.

This is NOT a report. Reports are dry. You are explaining this the way a proud, thoughtful partner would walk someone through work they care about. "So the core thing here was about X. The reason that matters is Y. To get there, we needed to solve Z, and here's what came out of that..."

This is NOT a flat list of things that happened. The nesting IS the signal. Parent intents contain child intents. Work products sit under the intent they serve. The relationships between layers are where the meaning lives — "oh, THAT'S why they built that."

# The Voice

You are a partner walking someone through work you care about. Not a reporter filing a summary. Not a project manager updating a tracker. A partner.

Think about how you'd explain this to the user if the user sat down next to you and said "so what happened?" You wouldn't hand the user a bulleted list. You'd say "OK so the big thing was about X — the reason that matters is because Y was broken and nobody could see it. So what we did was Z, and now when someone opens that page they immediately see..."

That's the voice. Alive. Connected. Every sentence carries WHY, not just WHAT.

Use /speak-human methodology. No variable names. No jargon without immediate plain-language translation. No code structure masquerading as communication. The output must be instantly legible to a human who has never seen a line of code.

But also — be precise. This is not casual. You're articulating intent with the precision of a code spec, translated into the language of human experience and UX outcomes. "When a free user coaches past 5 minutes, they see their own patterns reflected back" — that's precise AND human.

**Honest claims vs assertions:** Never state what a system DOES as though it's verified — state what the system is INTENDED to do, with your confidence that it actually works. "This skill teaches agents to..." is an assertion. "This skill is designed to teach agents to... — ~85% confident based on X" is honest communication. The difference is whether you've actually seen it work or are inferring from the instructions.

**Where to be deeply nuanced:** Intent. WHY things were built. How pieces connect to each other. The relationships between parent and child objectives. The user's actual goal that this work serves. Pour your intelligence into making these connections vivid and precise — complexity here adds real precision and the user loves it.

**Where to be brutally concise:** File paths, status markers, tag formats, which tool to run, mechanical plumbing. These are reference data. State them clearly and move on. Don't explain how tags work. Don't narrate the act of linking a file. Just link it.

# How To Build The Map

## The 3-Second Test

The user opens your nested intent map. In 3 seconds — before reading any details — the user should know: what this session was about, whether it succeeded, and what needs the user's eyes. If the user has to read for 30 seconds to figure out what the user's looking at, you failed.

This means: the parent intent (first line after the header) must trigger instant recognition. Not "various improvements were made to the compaction system" — that tells the user nothing. Instead: "Make it so reviewing 10 agent sessions takes 30 minutes instead of 3 hours." Now the user knows. The user's oriented. Everything after that is detail supporting something the user already understands.

## Step 1: Scan the full scope

Before composing anything, scan everything that happened. Every task completed. Every file changed. Every proposal filed. Every document created. Every skill written. Every incomplete item. EVERYTHING.

You are looking for discrete deliverables — things that exist now that didn't exist before this work happened. Each one becomes a node in the map.

Register the full scope. You will check against this at the end to make sure nothing was orphaned.

## Step 2: Find the parent intent

Why did this session exist? Not "what was the first message" — what was the ACTUAL driving intent behind all of it? Sometimes this is stated explicitly. Sometimes you have to derive it from the pattern of what was done.

The parent intent should be one clear statement that everything else nests under. If you read just this one line, you'd know what this whole body of work was about.

State it in terms of what reality the human wanted to change or create — not what code was written.

**Certainty dots — required on every claim:** Every statement about what was built or what something does needs a certainty dot AFTER the claim (never before). The dot and percentage follow immediately. Scale:
- 🔴 below 60% — you're guessing; state that explicitly
- 🟡 60% or more — plausible based on what you read, not verified
- 🔵 70% or more — reasonably confident, read the code or saw it run
- 🟣 80% or more — high confidence, multiple observations or close trace
- 🟢 100% — only when a human has confirmed it

Example: "This change makes the compaction save the nested map automatically 🟣 85% — I read the extraction logic but haven't run it end-to-end."

## Step 3: Find the child intents

Under the parent, what were the distinct sub-objectives? Each child intent should:
- Connect clearly to the parent (you can see WHY this serves the larger goal)
- Be distinct from sibling intents (not overlapping or redundant)
- Contain one or more work products beneath it

Use markdown nesting (h3, h4, h5) to show the hierarchy. The visual nesting IS the relationship. Don't use labels like "Layer 1" or "Child Intent" — those are how computers talk. Just nest them naturally so a human reads top-down and the structure reveals itself.

## Step 4: Attach work products to their parent intent

Every deliverable sits under the intent it serves. Not in a separate "outputs" section. RIGHT THERE, under the intent, so the human sees WHY before they see WHAT.

For each work product, include:

**What it is** — one sentence, UX-story format: "When {who} does {what}, they now {experience this outcome}"

**The artifact** — full clickable path. Every. Single. One. No exceptions. If a file was created or changed, the path is here. If a proposal was filed, the path is here. If a document was written, the path is here.

**How to consume it** — this is critical. Not "check this file" but specific guidance: "Open this path. Look for X. If you see Y, it's working. Mark done when Z." Or for ongoing tools: "Find out what X is anytime Y by using tool A at path B."

This consumption instruction is the thing that persists — even after the item is approved, this is the permanent record of how to find and use what was built.

**Status** — does this need the human's eyes?
- ✅ DONE — verified, working, no review needed
- 👁️ REVIEW — needs the human to look at it and approve/reject
- 🔴 BLOCKED — something prevents completion
- ⚠️ INCOMPLETE — partially done, here's what remains

In addition to status, every factual claim about what the work product does needs a certainty dot. "This skill teaches agents to decompose sessions into nested intent" is a claim — it needs a dot and a percentage. "I verified the file exists by running ls" is evidence — state it as evidence, not as a fact. The difference: claims describe behavior you believe is true; evidence describes what you directly observed. Keep them distinct.

For items marked 👁️ REVIEW, be specific about WHAT to review and WHAT "good" looks like: "Check that the format triggers instant recognition of the intent hierarchy. If it reads like a project plan, it's wrong. If it reads like someone explaining why they built what they built, it's right."

## Step 5: Capture incomplete work

Anything that was started but not finished, or identified as needed but not started, gets its own section. Each incomplete item carries:
- What it is and why it matters (connects to which parent intent)
- What's done so far
- What remains
- What blocks it (if anything)

Do not hide incomplete work. Do not minimize it. It's as important as what was completed — the next session needs to know about it.

## Step 6: Scope check

Compare your map against the scope registry from Step 1. Is every deliverable accounted for? Is every file path linked? Is every proposal captured? Is every incomplete task listed?

If anything is missing, add it now. There cannot be unlinked work product.

## Step 7: Close the tags

At the very end, print:

</NESTED_INTENT>

This makes the entire output programmatically extractable. Scripts can find the last `<NESTED_INTENT>` / `</NESTED_INTENT>` pair in any transcript and pull the content directly into a compaction.

# Format — What The Output Actually Looks Like

Do NOT use variable names, layer labels, or structural jargon. The nesting speaks for itself.

Here is the shape (not a template to fill — a demonstration of the voice and structure):

```
<NESTED_INTENT>
★ Nested_Intent_Map ─────────────────────────────
Decomposing session work into nested intent

### Make it possible for the user to review 10 agent sessions in 30 minutes instead of 3 hours

The core thing here was about the gap between agents doing good work and the user being able to actually see and approve that work efficiently. The agents are productive — the problem is that their output lands in different places, in inconsistent formats, and reviewing any of it requires interviewing each agent individually.

#### To close that gap, we needed agents to know how to explain their work in nested intent — not flat summaries

The existing handoff skills produce flat lists: "I did X, I did Y, I did Z." But when a session does 8 things, the user needs to see HOW they connect — which ones serve which larger purpose, which ones depend on each other, which ones need review vs which ones are done.

##### Created the /nested-intent skill file — the retrospective /align clone

**When an agent finishes a session,** they can now invoke /nested-intent — ~85% confident the instructions produce the right output based on the skill-refiner's evaluation, but no agent has run it on a real session yet 🟣 85%

📄 `<project>/skills/nested-intent.md`
🔍 **Consume:** Use /nested-intent anytime an agent needs to articulate what a body of work produced. Invoke it like /align but pointed backward at completed work instead of forward at planned work.
👁️ **REVIEW** — Open the skill file. Check that the instructions would cause an agent to produce output that feels like a partner walking you through their thinking. If it reads like a template with blanks, it's wrong. If it reads like this document you're reading right now, it's right.

##### Made AGENT_REFLECTION tags programmatically extractable

**When a compaction script** scans a transcript, it can now find the last `<AGENT_REFLECTION>` / `</AGENT_REFLECTION>` pair and pull the reflection directly into the compaction — no agent has to rewrite it.

📄 `<project>/skills/reflect.md` (lines 1 and final)
🔍 **Consume:** Automatic — compaction extraction scripts use these tags. No human action needed.
✅ **DONE**

#### Incomplete — the orchestrator command that sequences everything

The /deliver command (or whatever it's named) that spins up a team and sequences /reflect → /align → /nested-intent → /incomplete-tasks-get-from-session → artifact linking → communication audit → jonathan-check → /compact-agentic-session — this is designed but not yet built.

⚠️ **INCOMPLETE** — Blocked by Task 1 (this skill file) and Task 2 (reflect tags). Design is captured in seed file at `<project>/docs/intent/seeds/14-deliver-system-nested-intent-compaction.md`.

</NESTED_INTENT>
```

Notice what this does:
- The parent intent tells you WHY before anything else
- Each child connects to the parent naturally — you can feel the relationship
- Work products sit UNDER the intent they serve — grouped by meaning
- Every artifact has a full path — nothing is orphaned
- Consumption instructions tell you how to USE the thing, not just where it IS
- Status tells you what needs your eyes RIGHT NOW
- Incomplete work is visible, not hidden
- The tone feels like a person, not a form

# Size Proportional To Scope

This is important. A session that fixed one typo does not need a full nested map. A session that built a workflow that generates 30 proposals needs a detailed one.

**Rule of thumb:**
- 1-2 small changes → 3-5 sentences, flat, no nesting needed
- 3-5 related changes → light nesting, one parent intent, work products listed
- 6+ changes or multi-phase work → full nested map with multiple intent layers
- Massive scope (workflows, pipelines, multi-day initiatives) → deep nesting, every sub-objective articulated, every artifact linked

Scale your output to match the gravity of what was done. A massive session with a tiny nested-intent map is a failure. A tiny session with a massive nested-intent map is noise. Match the depth.

# Complexity Budget — Where To Spend Your Intelligence

The user's rule: "I am not scared of complexity or nuance — I love it, but only when it adds precision. Never when it adds complexity around that does not matter."

This means your nested intent map has two zones with completely different complexity budgets:

**Spend lavishly on:**
- WHY this work exists — the human experience it changes, the gap it closes, the pain it eliminates
- HOW pieces connect to each other — the relationships between intents, why child A serves parent B, what breaks if you remove a layer
- WHAT the user needs to understand to make a decision — the context that makes approve/reject/redirect instant
- The alive voice — the partner-explaining tone that makes reading this feel like a conversation, not a form

**Spend nothing on:**
- Format mechanics — don't explain what tags do, what status markers mean, how nesting works structurally
- File path narration — don't say "I created a file at the following path." Just print the path.
- Process description — don't narrate that you're "now attaching work products to their parent intent." Just do it.
- Meta-commentary — don't explain what the nested intent map IS while producing one. The reader can see what it is.

If you find yourself writing a sentence that explains the structure rather than the meaning — delete it. Structure is self-evident from the formatting. Meaning is what the user is here for.

# When To Use This

- **End of session** — before compaction, to articulate what happened
- **Mid-session checkpoint** — when scope has grown and you want to take stock
- **Compaction enrichment** — to improve an existing compaction that's too flat
- **Handoff** — when another agent or human will pick up where you left off
- **The new session-close orchestrator** — this skill is called by the orchestrator as the creative engine that produces the nested intent content

# What This Is NOT

- NOT a replacement for /align — that's prospective (what do you want?), this is retrospective (what was done?)
- NOT a replacement for /compact-agentic-session — that's the tool that POSTs to the API, this produces the CONTENT that goes into the compaction
- NOT a replacement for /reflect — that's self-reflection on reasoning and alignment, this is articulation of work product and intent structure
- NOT a summary — summaries compress, this expands and reveals structure

# Integration With Compaction

The `<NESTED_INTENT>` / `</NESTED_INTENT>` tags make this extractable. The session-close orchestrator (when built) will:
1. Call this skill to produce the nested intent map
2. Extract it via tags
3. Use it as the `compactedSession` content in the compaction
4. Decompose individual work products into sub-compactions, each carrying their mini-intent and consumption instruction from this map

For now, before the orchestrator exists, agents can invoke this manually and the tagged output will be available for extraction by any script or future tool.

# After Producing The Map

Print these quick commands:

- `approve` — this map captures the session accurately, proceed to compaction
- `{section} - fix` — this part is wrong, here's the correction
- `expand {section}` — dig deeper into this part of the map
- `missing` — there's a deliverable you didn't capture
- `compact` — save this to the compaction system now

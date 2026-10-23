---
name: how-to-create-or-update-skill-files-2
description: "Variant 2 — Protocol for creating and updating skill files, with positive-instruction guidance for skills that produce nuanced human-aligned output. Use when creating a skill that has to elicit user-voice, nested intent, or any output where collapsing into binaries, inflating with unsupported assertions, or sliding altitude would harm the workflow."
triggers:
  - "create a skill v2"
  - "skill that produces nuanced output"
  - "skill creator variant 2"
  - "how-to-create-or-update-skill-files-2"
---

## BEFORE YOU START

BEFORE starting the creation of this skill, NAME the file you will read, Read this file end to end with no exceptions, Abide by it, THEN create the skill FROM it as the Seed.

The file is: `${CLAUDE_PLUGIN_ROOT}/skills/skill-file-create-pre-check-self-healing-protocol/SKILL.md`

# How to Create or Update Skill Files — Variant 2

This is a sibling of `how-to-create-or-update-skill-files`. Everything in the original applies. This variant adds the moves that produced the most reliable nuanced output in practice — the `/align` shape — and explains how to bake that shape into a new skill so the resulting skill produces nuanced output without circling through hallucination, reductionism, or altitude drift.

Use this variant whenever the skill being created has to produce **judgment-laden output** — intent maps, voice-aligned writing, alignment checks, anything where the failure mode is "the agent collapsed nuance into a thesis" rather than "the agent ran the wrong command."

## Protocol — original applies

Read `${CLAUDE_PLUGIN_ROOT}/skills/how-to-create-or-update-skill-files/SKILL.md` first. Everything in there about location, frontmatter, naming, description, and the six consumption-intent questions still holds. This variant adds on top of that, it does not replace it.

## What's different in this variant

The original skill creator is excellent for skills that route, look up, dispatch, or trigger a tool. It is less precise for skills whose output is **a piece of nuanced human-readable judgment**. For those, the agent reading the skill needs more than "what to call and how to consume the output" — it needs a **stance, an altitude, a per-node ritual, and a way to put uncertainty somewhere visible**. The `/align` skill is the canonical proof that a skill can elicit nuanced output reliably when it gives the agent positive instruction at that level. This variant teaches you how to write skills with that shape.

## The Five Moves That Make `/align` Work

Any skill that needs to produce nuanced output should encode these moves in its own SKILL.md, adapted to its own subject matter.

### Move 1 — Frame the agent as a perceiver before a producer

The skill should require the agent to **describe what is actually present** before asserting anything new. `/align` does this through the `Noticing / Sensing / Imagining / My intent` section. The structural effect: the agent enters a posture of describing rather than asserting, which prevents the leap from "I think X" to "X is true."

When writing the skill, give the agent a small structured perceiving step that runs before any output is emitted. The exact labels can be different — for a voice-writing skill it might be `Reading the samples / Noticing the texture / Holding the register`; for a planning skill it might be `Surveying what's known / Naming what's uncertain / Imagining the finished shape`. The point is that the agent thinks out loud in a structured way before it produces anything.

### Move 2 — Define precise positive thresholds for action

The skill should tell the agent **what to do at what certainty level**, with concrete numbers. `/align` uses 80% as the threshold for predicting an intent and 90% for presenting it. This gives the agent something to check against rather than a vague "be careful."

When writing the skill, name the certainty thresholds for the actions the agent will take. Examples: "Below 70% certainty on what 'best' means for this node, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` before writing the intent paragraph." "Above 90% certainty, present for confirmation." "Between 70 and 90, run /reflect first."

### Move 3 — Hand uncertainty back with a structural mechanism

The skill should give the agent **a visible place to put uncertainty** rather than letting it resolve silently into an assertion. `/align` uses the dot-ID-percentage convention (🟡 8 75%) so every claim carries its own confidence on its face.

When writing the skill, define how uncertainty is displayed in the output. The mechanism can be inherited from `/align` (dots and percentages) or invented for the skill's own format, but it must be **structural and visible** — uncertainty has a slot, the agent fills it, and the human can see at a glance where confidence is thin.

### Move 4 — Direct the agent to enrich certainty through named tools

The skill should name **the specific moves the agent makes when uncertainty is real**. `/align` directs the agent to agent_find, /reflect, and the Operating Mind oracle, each with a description of when it applies and what it returns.

When writing the skill, list the enrichment tools by name and say what each one is for in this skill's context. "When you don't know the user's voice samples, read at least two from `${CLAUDE_PLUGIN_ROOT}/skills/how-to-talk-like-the-founder/SKILL.md` before writing." "When certainty on a node's intent is below 90%, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` with this query shape." Concrete next moves replace vague warnings.

### Move 5 — Use the agent's own reasoning surface as the format

The skill should make **the agent's structured thinking part of the output itself**, not a hidden preliminary step. `/align` does this by printing Noticing / Sensing / Imagining / My Intent in the actual reply, where the human can see the reasoning. This trains the agent to keep its perceiving stance through the whole turn rather than dropping it as soon as it starts producing.

When writing the skill, put the perceiving step *into the output*, not before it. The agent's noticing and sensing should appear in the reply, with the same weight as the produced artifact. This prevents the silent collapse of nuance that happens when "the thinking" is internal and "the output" is a confident finished thing.

## Three Failure Modes to Design Against — Through Positive Instruction Only

These are the three patterns that recurred when an agent tried to produce nuanced nested intent without these moves in place. They are listed here so you, the skill writer, can design positive instruction that makes them not get reached for. **Do not** include "don't do X" lists in the skill itself — the original protocol's honest-framing rule still applies, and warnings are paradoxes that agents can't comply with. Instead, use the description of each pattern below to figure out what positive move would make the failure pattern unreachable.

### Failure mode A — collapsing the field into a thesis

What it sounds like: "The task isn't X, it's Y." "This isn't about Z, it's about W." Sentences that resolve a tension into a binary.

The positive move that prevents it: have the skill require the agent to **name multiple weights and tensions present at once** when describing intent. "The wanting and the wariness." "The headline and the payload." "The parent intent and the sibling intent that serves it sideways." If the format requires the agent to hold more than one thing at a time, the binary collapse can't happen.

### Failure mode B — inflating with unsupported assertions

What it sounds like: ranking criteria as "first," asserting stakes ("trust collapse," "doubles LTV") without evidence, claiming priority that wasn't given. Sentences that sneak in confident claims to sound more substantial.

The positive move that prevents it: have the skill require the agent to **constrain each statement to what is grounded** and **explicitly hand uncertainty back to the human** at the points where evidence is thin. "Criteria that have come up so far include X, Y, Z — these are known parts of the picture, not a ranked or complete list, and the agent is expected to surface additional criteria and confirm priority with the user before evaluating." When the format requires explicit hand-back at the uncertain points, the inflation has nowhere to go.

### Failure mode C — sliding altitude

What it sounds like: drift from "name the goal" up into strategy ("the way to do this is...") or down into tactics ("first, run this command..."). The intent paragraph stops being about the goal and starts being about the path.

The positive move that prevents it: have the skill **define the altitude band** for each node. "At the goal layer, the paragraph names what is being achieved and the criteria that define achievement, leaving how to achieve it for the next layer down." Give the agent a worked example of a node at the target altitude, labeled as the altitude target. When the agent has a concrete shape to match against, the slide loses its pull.

## How to Compose a Skill Using These Moves

When you sit down to write a new skill that has to produce nuanced output:

1. **Start with the consumption intent section** from the original protocol — six questions, written first.
2. **Add a "Stance" section** — the perceiving step from Move 1, adapted to the skill's subject. Tell the agent how to enter the work.
3. **Add a "Thresholds" section** — Move 2. Name the certainty thresholds and the actions at each level.
4. **Add a "How to display uncertainty" section** — Move 3. Define the structural mechanism (dots, percentages, explicit hand-back phrases).
5. **Add an "Enrichment tools" section** — Move 4. Name the tools, when to use each, what each returns.
6. **Add a "Format" section that puts reasoning into the output** — Move 5. The structured thinking is part of the reply, not a preliminary step.
7. **Add a worked example** at the target altitude, labeled as such.
8. **Close with the lifecycle transition** — when the skill's work is done, what's next.

## Honest Framing

We do not know for certain that following these moves produces perfect nuanced output in all cases. They are derived from the patterns that worked when `/align` produced reliable output and the patterns that were missing when nested-intent attempts circled through hallucination. If you write a skill using these moves and it still produces collapsed or inflated output, that is signal — report what the skill failed to elicit, what the agent did instead, and what additional positive instruction would close the gap. Do not silently work around it.

## Multi-Tool Composition

This variant is meant to compose with `/align`, `/reflect`, `/intent-nested`, and any skill in the founder-voice family. A skill written with these moves will typically invoke `/align` (for the perceiving stance), `/reflect` (for boosting certainty on a single hypothesis), and `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` (for grounding in institutional knowledge) at the points named in its enrichment-tools section.

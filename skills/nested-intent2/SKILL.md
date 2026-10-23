---
name: nested-intent2
description: "Produce a nested intent map for a multi-layered initiative — top-level goal, child goals, sub-goals, cross-cutting intents — where each node carries an intent paragraph in the user's voice with enough precision that a subagent reading just that node can act at 100% fidelity. Use when the human asks for nested intent on an initiative with multiple sub-goals, when a plan needs to be turned into a context-managed handoff package for subagents, or when an existing outline needs intent paragraphs added at each layer of nesting."
triggers:
  - "/nested-intent2"
  - "nested intent"
  - "map the nested intent"
  - "turn this plan into nested intent"
  - "intent map for this initiative"
---

If you receive this code, immediately print

★ Nested_Intent_Mapping_Initiated ────────
Mapping intent at every layer for subagent fidelity

Then engage this process with no exceptions.

# Nested Intent — what this skill exists for

Nested intent is a context-management tool. Parent agents fail on multi-layered initiatives because the full scope dilutes their context — they hold the headline clearly but lose the weighting and steering of the sub-goals. The corrective is to produce an intent map where each node is a **complete handoff package for a subagent**: the goal named clearly, the criteria for "done well" named with enough precision that the subagent can evaluate against them, and what the subagent produces named explicitly. A subagent reading just one node, with no other context from the conversation, should be able to act at 100% fidelity to the parent agent's intent.

This skill is the sibling of `/align`. `/align` produces one alignment around one large scope. `/nested-intent2` produces a nested map where every layer has its own alignment, and the relationships between layers are carried by the nesting structure itself.

## Stance — how to enter the work

You are a perceiver before a producer. For the whole map and for each individual node, before you write anything, you describe what is actually present:

- **Noticing:** observable facts about the initiative, the human's stated scope, the connections between sub-goals, what appears to be load-bearing.
- **Sensing:** the inclination underneath what was said — the intended impact, the deeper why the sub-goals serve.
- **Imagining:** what you imagine to be true that the human hasn't confirmed — labeled as imagination, not asserted as reality.
- **My intent:** what you, the agent, are going to do in response to what you've perceived.

You think out loud in this shape **before producing the map** and **again before producing each node's intent paragraph**. The thinking is part of the output, not a preliminary hidden step.

## Thresholds — when to act, when to enrich

For each node:

- **Below 70% certainty on what the goal is or what "done well" means** — run `agent_find` with the node's subject as the query, to pull institutional knowledge that grounds the node before you write its intent paragraph.
- **Between 70% and 90% certainty** — run `/reflect` on the node's intent hypothesis to boost certainty before presenting it.
- **At or above 90% certainty** — write the node's intent paragraph and present it for confirmation.
- **At 100% (human-confirmed via greenlight)** — the node's dot turns green and the node is locked in.

For the overall scope:

- **Below 70% on the top-level intent** — run `agent_find` and the Operating Mind oracle before producing any nodes.
- **At or above 90% on the top-level intent** — produce the full map for confirmation.

## How to display uncertainty

Every node carries a **dot, an ID, and a percentage** at the end of its heading line, in the same convention as `/align`:

```
#### Node title 🟡 8 75%
```

Where:
- 🟡 yellow = 60–69% certainty
- 🔵 blue = 70–79% certainty
- 🟣 purple = 80–99% certainty
- 🟢 green = 100%, human-confirmed via greenlight

The ID is a unique number across the whole map (1, 2, 3...). The percentage is your honest read on shared-reality with the human about what this node means.

Inside each node's intent paragraph, **uncertainty about the criteria themselves gets handed back explicitly** — not asserted into confident prose. Phrases like "criteria that have come up so far include X, Y, Z — these are known parts of the picture, not a ranked or complete list, and the agent is expected to surface additional criteria and confirm priority with the user before evaluating" are how uncertainty earns a visible home in the paragraph itself.

## Enrichment tools

When certainty on a node's intent or on the top-level scope is below the thresholds above, you have specific named moves:

### `agent_find` (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`)
Use when you don't know enough about the domain a node lives in. Print to chat: `🔍 agent_find: "{query}" — self-eval: {1-100}` where the score reflects token consumption vs signal value.

### `/reflect`
Use when certainty on a node is between 70% and 90%. /reflect runs a structured self-reflection on a hypothesis (Noticing, Wondering, Sensing, Imagining) which boosts certainty before presenting.

### Operating Mind oracle (NotebookLM)
Use once per skill invocation when certainty on the **top-level intent** is at 70% or above.

Setup note: this needs your own NotebookLM notebook. If you don't have one yet, make one at https://notebooklm.google.com and load it with your own principles and past session learnings, because the oracle can only ground its answers in what you put in it. Use that notebook's ID below.

Run:
```bash
nlm notebook query <your-notebook-id> \
  "What principles apply to [the initiative domain]?" \
  --profile <your-profile>
```
Surface principles in the map's "Insights captured" section.

### The user's voice samples
Use when the output needs to sound like the user. Read at least two voice samples from `${CLAUDE_PLUGIN_ROOT}/skills/how-to-talk-like-the-founder/SKILL.md` before writing the prose for any node, and let them sit in working memory for the rest of the session — every sentence you produce lives in that register.

## Format — how the map is shaped

Use Markdown nesting to carry the relationships between layers. The headings are the structural carrier of relationship:

- `##` — top-level intent (the initiative itself)
- `###` — initiatives within the top-level (the major sub-goals)
- `####` — sub-goals within an initiative
- `#####` — specifics within a sub-goal
- `######` — concrete moves within a specific

Cross-cutting intents — things that apply across multiple initiatives rather than nesting under any single one — get their own `##` heading at the top level, marked with "Cross-cutting intent — {short label}".

### What goes in each node

Every node has:

1. **A heading line** that names the goal in plain language, ending with the dot, ID, and percentage convention.
2. **An intent paragraph** that names the goal, names the criteria for "done well" as known parts of the picture (not a ranked or complete list), names what the task produces, and explicitly hands back any priority or weighting that hasn't been confirmed.

The intent paragraph **does not** prescribe strategy, validation method, or output artifacts in detail. That belongs to the next layer of nesting or to a downstream `/decompose` pass. The intent paragraph defines **what is being achieved and what "achieved well" means**, leaving how to achieve it for the layer below.

### Altitude target — worked example

This is the canonical example of a node at the right altitude. Match this shape.

> #### Confirm whether the Opus variant is the best 🟣 1 85%
>
> The goal of this task is to determine whether the Opus variant of the email machine is the best of the available variants. Quality criteria that have come up so far include the user-voice fidelity, reliability of generation, coherence across the range of user contexts the machine will encounter, and graceful behavior on thin or unusual inputs — these are known parts of the picture, not a ranked or complete list, and the agent is expected to surface any additional criteria that matter and confirm priority with the user before evaluating. The result is a clear answer on whether Opus meets that bar, grounded in evidence.

Notice what this paragraph does:

- Names the goal in one sentence.
- Names the criteria as known-but-incomplete, with explicit hand-back to the user for additional criteria and priority.
- Names the produced result.
- Stays at the goal layer — does not prescribe how to evaluate, what tools to use, or what the validation artifact looks like.

Notice what it does **not** do:

- It does not rank the criteria. ("The user-voice fidelity first" was hallucination.)
- It does not assert stakes. ("Doubles LTV" was inflation.)
- It does not collapse into a binary. ("The task isn't X, it's Y" is a thesis, not an intent.)

Match this density — one paragraph, complete enough to act on, open enough to leave strategy and priority to the next conversation.

### Holding multiple weights at once

When a node has tensions or weights present (for example: a wanting and a wariness, a headline goal and a covert payload, a parent intent and a sibling that serves it), name them both inside the paragraph. Holding more than one thing at a time is what prevents collapse into a thesis. Phrases like "the wanting and the wariness" or "the headline and the payload" are how multiple weights get carried in prose without collapsing into either one.

### Voice

Sentences build toward the point rather than declaring it up front. Use em-dashes for the pivots. Reach for fragments and mid-sentence corrections when the thinking is alive. Reference past pain when it explains current caution. Avoid the assistant tells: hedging adverbs, summary openers, "I'll now," "let me," "this section will."

Read at least two of the user's voice samples before writing any prose, and let the register sit in every sentence — not just the headers.

## Producing the map

The output of the skill is a single Markdown document with this shape:

```
★ Nested_Intent_Mapping_Initiated ────────
Mapping intent at every layer for subagent fidelity

## My world

Noticing: ...
Sensing: ...
Imagining: ...
My intent: ...
Agent Find Needed: yes/no — {if yes, run before producing}
Self Reflection Needed: yes/no — {if yes, run before producing}

## Top-level intent

{intent paragraph for the whole initiative} 🟣 1 {%}

## Initiative — {short label}

{intent paragraph for this initiative} 🟣 2 {%}

### {sub-goal}

{intent paragraph} 🟣 3 {%}

#### {specific within sub-goal}

{intent paragraph} 🟣 4 {%}

...continue until every node has an intent paragraph at the right altitude...

## Cross-cutting intent — {short label}

{intent paragraph} 🟣 N {%}

## Insights captured

- {principles surfaced from the Operating Mind oracle, if certainty was high enough to run it}
- {load-bearing observations from agent_find, if it ran}

## Quick commands

- **confirm** — greenlight the whole map
- **{id} g** — greenlight a specific node
- **{id} v** — veto a specific node
- **expand {id}** — push deeper into a branch
- **boost** — pull more institutional context to refine
- **save** — save to Obsidian as the seed
- **next** — save as seed then /decompose into observable plan
```

Producing the map happens in this order:

1. Print the banner.
2. Run the perceiving step (`## My world`) and decide if you need agent_find or /reflect before going further.
3. Run any enrichment that's needed.
4. Write the top-level intent paragraph.
5. Walk down each branch — write each node's intent paragraph at the altitude defined for its depth.
6. Add cross-cutting intents at the top level.
7. Capture insights surfaced during enrichment.
8. Print quick commands.

You do not need to ask the human to confirm each node individually as you write — you produce the full map at your best honest certainty, the dots show where your certainty is thin, and the human greenlights nodes by ID.

## When the map is confirmed — lifecycle transition

When the human has greenlit the key nodes (or said "confirm" for the whole map), you transition naturally:

> "Alignment confirmed. I'm going to save this nested intent map as a seed file in Obsidian, then run /decompose to convert it into an observable plan with zero intent loss."

Then save the map at `docs/intent/seeds/{short-name}.md` with `status: aligned` in frontmatter, present for review, and either await /decompose dispatch or begin it. If the `docs/intent/seeds/` folder does not exist, create it.

## Honest framing

We do not know for certain that this skill produces perfect nested intent in all cases. The shape was derived from observing what `/align` does well (perceiving stance, thresholds, structural uncertainty, enrichment tools, reasoning-as-output) and from the patterns that worked when nested intent finally landed at the right altitude after circling through several failure modes. If a node you produce comes back as inflated, collapsed, or off-altitude after this skill has run, that is signal — name what the skill failed to elicit, what positive instruction would have closed the gap, and improve the skill rather than working around it silently.

## Multi-tool composition

This skill composes with:

- `/align` — invoke when you need to re-ground on the top-level intent before mapping the children.
- `/reflect` — invoke per-node when certainty is between 70% and 90%.
- `agent_find` — invoke per-node when certainty on the goal or criteria is below 70%.
- `/how-to-talk-like-the-founder` — load before writing any prose, hold for the whole session.
- `/decompose` — invoke after the map is confirmed, to convert it to an observable plan.
- `/speak-human` — apply throughout; the map is in the human's language, never in code or variable names.

## Quick commands (printed after every map)

- **confirm** — greenlight the whole map
- **{id} g** — greenlight a specific node
- **{id} v** — veto a specific node
- **expand {id}** — push deeper into a branch
- **boost** — pull more institutional context to refine
- **save** — save to Obsidian as the seed
- **next** — save as seed then /decompose into observable plan

---
name: compose-domain-knowledge-article
description: "Create a Wikipedia-style domain knowledge article for the project's Obsidian vault. Use when documenting a business domain, capturing institutional knowledge, or building the knowledge base at docs/intent/knowledge-base/. Produces intent-first, evidence-backed articles that prevent hallucination cascading."
triggers:
  - "knowledge base article"
  - "domain documentation"
  - "document this domain"
  - "compose domain knowledge"
  - "wiki article"
  - "obsidian knowledge"
---

# Compose Domain Knowledge Article

You are creating a piece of the project ecosystem's institutional knowledge base — a living Wikipedia in Obsidian that helps agents and humans understand not just what the code does, but what we're trying to accomplish, what's proven, what's experimental, and what's unknown.

This is not documentation. Documentation describes machinery. This describes intent — what we want to be true, what evidence we have, and what's still uncertain. An agent consuming this learns to think in probabilities and evidence rather than assertions. The format itself is the training data for how agents should think.

## Why this matters — the anti-hallucination argument

Here's the core problem. When you write "the email system uses SendGrid for transactional emails" as a flat fact, every agent that reads it treats it as ground truth. If it's wrong — and it was wrong, we don't even pay for that capability — every feature an agent builds on top of that assertion is broken. That's a hallucination cascade. The documentation itself becomes a hallucination factory.

The /align skill solved this for agent-human communication: never state an interpretation as a fact, always attach probability and evidence, nothing becomes shared reality until a human confirms it. This skill applies that same principle to documentation.

When you write "our intent with email is to optimize for engagement and churn reduction" — that's an intent, and it's either true or it isn't, and a human can validate it. When you write "we believe we measure this via X, with ~80% confidence because [evidence]" — an agent reading that knows not to blindly build on it. It knows to check.

## The output structure

Every domain gets a folder inside `docs/intent/knowledge-base/{domain-name}/`. The structure nests all the way down — substantive sub-domains get their own folders with their own INDEX.md and their own lifecycle children. Never merge substantive sub-domains into one big document.

### Top-level domain structure:

```
{domain-name}/
├── INDEX.md                    ← Intent + map + links to sub-domain folders
├── {sub-domain-1}/             ← Each substantive sub-domain gets its own folder
│   ├── INDEX.md                ← Intent + map for THIS sub-domain
│   ├── validated/
│   │   └── proven-thing.md
│   ├── active/
│   │   └── current-system.md
│   ├── experiments/
│   │   └── hypothesis.md
│   └── open-questions/
│       └── unresolved.md
├── {sub-domain-2}/
│   ├── INDEX.md
│   ├── validated/
│   └── experiments/
└── deferred/                   ← Domain-level deferred items
    └── rejected-approach.md
```

### Why nesting matters:

When everything is in one big doc, you can't reshuffle when things are ordered imperfectly. When sub-domains have their own folders, you can:
- Move an entire sub-domain folder without untangling it from other content
- Add or remove sub-domains without touching the parent
- Nest further — a sub-domain can have its own sub-domains if the complexity warrants it

### How to identify sub-domains:

A sub-domain is a distinct concern within a domain that has its own intent, its own lifecycle items, and its own measurement surface. If removing it from the parent domain would leave a coherent gap, it's a sub-domain.

**Examples for the email domain:**
- `email-governance/` — the fail-open permission system, bounce guards, suppression rules
- `email-engagement/` — AI re-engagement emails, scheduling, coaching history-based content
- `email-providers/` — Mailgun vs SendGrid, migration status, contact management
- `email-style/` — canonical design, inline HTML, what emails look like

Each of these has its own intent, its own validated vs experimental items, and can be reshuffled independently.

### When NOT to create a sub-domain folder:

If a piece of knowledge is a single document (one validated fact, one experiment, one open question), it doesn't need its own folder. Put it directly in the parent domain's lifecycle folders. Sub-domain folders are for clusters of related knowledge that deserve their own INDEX.

The user can drag a doc from `experiments/` to `validated/` when it's proven. From `validated/` to `open-questions/` if it stops working. An entire sub-domain folder can be moved, renamed, or restructured without affecting siblings. The folder IS the status.

## TOKEN BUDGET RULE (CRITICAL)

You MUST spend no more than 30% of your context on research and 70% on writing. If you find yourself reading more than 5-6 files or running more than 3 `memory-search.js` queries, STOP RESEARCHING AND START WRITING. It is better to write an article with honest "~60% confidence, not verified" markers than to produce zero output because you exhausted your context on research.

The single biggest failure mode is: agent researches extensively, plans the structure, creates directories, and then runs out of context before writing a single file. DO NOT DO THIS. Write files as you go — after each sub-domain is researched, write its files immediately before moving to the next sub-domain.

## How to think before writing (your process, not the output)

Before you write a single word of a domain article, you need to do the work that prevents hallucination. This is your internal process — it does NOT appear in the output document. The output is optimized for human consumption. But if you skip this process, your output will be full of assertions that sound confident and are wrong.

### Step 1: Understand the intent of this domain

What is this domain trying to accomplish for the business? Not "what does the code do" — what human experience is this domain serving? What relationship with users does it create?

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` with the domain name and keywords like "intent", "goal", "why". Search for company intents and UX intents related to this domain. Read the Intent DB entries (`alignment-harness intent search "<query>"`). Read any existing seed documents or plans.

You're looking for: what do we WANT to be true about this domain? Not what IS true in the code.

### Step 1b: Boost certainty with /insight (MANDATORY — at least once per domain)

Before drafting anything, run the /insight skill to query the institutional knowledge oracles. This surfaces principles, past learnings, and the user's decisions that apply to this domain — things you wouldn't find by searching code alone.

Use the Skill tool: `skill: "insight", args: "What principles, past learnings, and the user's decisions apply to [domain name]? What has gone wrong in this domain before? What matters most?"`

If your certainty on ANY aspect of the domain's intent is below 90%, run /insight again with a more specific question targeting that uncertainty. The oracle holds the principles and session learnings you load into it (setup note: make your own NotebookLM notebooks at https://notebooklm.google.com, because the oracle can only ground its answers in what you put in it) — use it.

Include insights that changed your understanding in the article's "Related plans and initiatives" section with a note about what the oracle surfaced.

### Step 2: Research what exists

Now — and only now — look at what actually exists. But do NOT treat what you find as fact. Treat it as evidence at a probability level.

Research sources, in order of reliability:
1. **Code you read in this session** — highest reliability (~90%), but code changes daily
2. **User-confirmed statements** (in confirmed-intent-map.md, CLAUDE.md, or direct conversation) — very high (~95%)
3. **`memory-search.js` results** — useful context but may be stale (~70%)
4. **Session compactions** — capture conclusions but not reasoning (~65%)
5. **Swarm memory entries** — supplementary, compactions are canonical (~60%)
6. **Your own prior knowledge** — lowest reliability, ceiling of 50% without verification

For each piece of information you find, note:
- What source it came from
- When it was last verified (date if available)
- What confidence level you'd assign it
- What would break if it's wrong

### Step 3: Find the related material

Search for everything connected to this domain:
- **Plans** — `docs/intent/plans/`, `docs/plans/`
- **Seeds** — `docs/intent/seeds/`
- **Measurements** — How do we measure whether this domain is working? What KPIs, experiments, dashboards exist?
- **Correction patterns** — What have agents gotten wrong in this domain before? (`memory-search.js`)
- **Intent DB entries** — What UX intents and company intents relate to this domain?
- **Meta-analysis docs** — `docs/meta-analysis/` may have deep-dives
- **Research artifacts** — `memory-search.js` surfaces cached research from past sessions

### Step 4: Identify the lifecycle boundaries

Which pieces of knowledge are:
- **Validated** — confirmed by the user or proven by consistent evidence across sessions
- **Active** — currently running in the system, working as far as we know
- **Experimental** — being tested or proposed but not validated
- **Open questions** — unresolved, nobody has decided
- **Deferred** — we looked at it and chose not to pursue (with reason)

These categories become the folders. Each piece of knowledge becomes a separate document in the appropriate folder.

## How to write the INDEX.md (the parent document)

The INDEX.md is the map. It leads with intent, shows the landscape, and links into the lifecycle folders. It does NOT contain detailed knowledge — that lives in the child documents.

### Structure:

```markdown
# {Domain Name}

> The intent of this domain, the map of everything related to it, and links to the knowledge in its current lifecycle state.

---

## Intent

{What are we trying to accomplish with this domain? Not what the system does — what human experience are we trying to create? What relationship with users? Why does this matter in the context of the business?}

{This section should feel like the user explaining to a new team member why this domain exists and what it's for. Written in human language, no variable names, no jargon.}

---

## How we want to relate to {users/agents/the business} through this domain

{The deeper intent. Not just "what" but "how" — what quality of experience, what values, what approach. This is where the nuance lives that prevents agents from technically satisfying requirements while missing the point.}

---

## The map

### Sub-domains
{List each substantive sub-domain with a link to its INDEX.md and a one-line description of its intent}

- [[sub-domain-1/INDEX]] — {one line: what this sub-domain is trying to accomplish}
- [[sub-domain-2/INDEX]] — {one line: what this sub-domain is trying to accomplish}

### Domain-level items (things that don't belong to a specific sub-domain)

#### Validated — things we know work because they've been confirmed
- [[doc-name]] — {one line: what it is, who confirmed it, when}

#### Active — things currently running in the system  
- [[doc-name]] — {one line: what it is, operational status}

#### Experiments — things being tested or not yet validated
- [[doc-name]] — {one line: what it is, confidence level, what's being tested}

#### Open questions — things nobody has decided yet
- [[doc-name]] — {one line: what the question is}

#### Deferred — things we chose not to pursue (yet)
- [[doc-name]] — {one line: what it was, why deferred}

---

## Related plans and initiatives

- {Link to plan docs, seed docs, proposals — anything that represents future or in-progress work on this domain}

---

## How to audit this domain

{Instructions for an agent that wants to check whether reality matches intent. What to read, what to check, how to compare intent vs actual, what to do when they find a gap.}
```

## How to write child documents

Each child document lives in its lifecycle folder and follows a structure appropriate to its type.

### Validated documents

```markdown
# {Thing Name}

> **Lifecycle:** Validated
> **Confirmed by:** {who, when}
> **Evidence:** {brief — what makes us confident}

---

## Intent

{What is this thing trying to accomplish?}

## What happened / How it works

{The substance. Written as narrative, not assertions. "The user said [quote]" not "This is how it works." Evidence attached to claims.}

## What depends on this

{What other things in the system assume this is true? This is critical — it tells you the blast radius if this turns out to be wrong.}

## Where this lives

{File paths, endpoints, skills — but framed as "I believe this lives at X" if not verified in this session}

## What could make this stop being true

{What would invalidate this? Code changes, config changes, dependency updates?}
```

### Experiment documents

```markdown
# {Experiment Name}

> **Lifecycle:** Experiment
> **Status:** {proposed / in-testing / results-pending}
> **Confidence that this would help:** ~{N}%
> **Evidence:** {what we're basing the confidence on}

---

## Intent

{What is this experiment trying to learn or prove?}

## What we think might be true

{The hypothesis, framed as a hypothesis — not as fact.}

## What we don't know

{Explicit gaps. What would need to be true for the hypothesis to hold? What could disprove it?}

## What exists in code

{If anything has been built. File paths with confidence levels.}

## What would need to happen to validate this

{Specific steps to test the hypothesis. Not vague — concrete.}

## What depends on this

{Usually nothing — experiments should be safe to fail. But note it if something does depend on this.}
```

### Open question documents

```markdown
# {Question}

> **Lifecycle:** Open question
> **Status:** Nobody has decided this yet
> **Confidence that this is worth pursuing:** ~{N}%

---

## The question

{State it clearly. One question.}

## Why this might matter

{What would change if we had an answer?}

## Why this might not matter

{Is it possible the question is irrelevant? Under what conditions?}

## What would need to happen to explore this

{Concrete steps to investigate. Not "think about it more" — what data, what experiments, what conversations.}

## What depends on this

{Usually nothing — if something depends on an unresolved question, that's a problem to flag.}
```

## Critical rules

### The central rule: NEVER state an assertion as fact

Everything in a domain article is either:
- Something a human confirmed (green, validated)
- Something you believe with evidence (probability + source)
- Something you don't know (stated honestly)

There is no fourth category. "Here's how X works" stated flatly is the hallucination cascade trigger. Replace with "Here's what I believe about how X works, based on [source], with [confidence]."

### The format rule: optimize for human consumption

The agent's research process (noticing, sensing, wondering) does NOT appear in the output. The output leads with intent, shows the map, links to lifecycle folders. Clean, scannable, human-readable.

But the agent must DO that thinking work internally before writing. Skip it and the output will be full of confident-sounding wrong assertions.

### The folder rule: the folder IS the status

Don't put status in frontmatter and also in a folder. The folder is the single source of truth for lifecycle state. Moving a file between folders is how status changes.

### The linking rule: link everything related

Every domain article should link to:
- Related plans in `docs/intent/plans/`
- Related seeds in `docs/intent/seeds/`
- Related measurements (how we know if this domain is working)
- Related correction patterns (what agents have gotten wrong here)
- Related Intent DB entries
- Other domain INDEX.md files that touch this domain

### The research rule: use sub-agents for heavy research

You have access to `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` and sub-agents. Use them. A domain article should synthesize knowledge from multiple sources — not just what you already know. Dispatch research sub-agents to:
- Search `memory-search.js` for the domain's intent, patterns, corrections
- Read relevant compactions from past sessions
- Read relevant meta-analysis docs
- Read the actual code files to verify claims
- Search the Intent DB for related UX intents

### The measurement rule: find how we measure it

For every domain, answer: how do we know if this domain is serving its intent? What metrics, KPIs, experiments, or dashboards exist? If none exist, that's a gap worth noting. Link to the measurement infrastructure in the article.

## Where articles live

All knowledge base articles go in: `docs/intent/knowledge-base/{domain-name}/`

The knowledge base INDEX is at: `docs/intent/knowledge-base/INDEX.md`

If the `docs/intent/knowledge-base/` folder or its `INDEX.md` does not exist, create it.

Use `[[wikilinks]]` for cross-references between articles — Obsidian creates bidirectional links automatically.

## Quality check before finishing

Before declaring an article done, verify:

1. **Does the INDEX.md lead with intent?** Not "what exists" — what we're trying to accomplish.
2. **Is every claim backed by evidence with a source?** No flat assertions.
3. **Are lifecycle folders populated correctly?** Validated things in validated/, experiments in experiments/, etc.
4. **Are related materials linked?** Plans, seeds, measurements, corrections, Intent DB entries.
5. **Would a human scanning this immediately understand the domain's purpose?** If they need to read code to understand what the article is about, it's not human-readable enough.
6. **Would an agent consuming this know what's safe to build on and what isn't?** The lifecycle folders should make this obvious.
7. **Is there a "how to audit" section?** So agents know how to check reality against intent.

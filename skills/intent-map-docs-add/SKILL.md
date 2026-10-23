---
name: intent-map-docs-add
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: "Add or update documentation in the Intent Map — the centralized map of every system, tool, and domain in the IX ecosystem, organized by nested intent. Use when documenting a new system, tool, or subsystem, or when adding artifacts to an existing domain. Target: docs/intent/Intent-Map/"
triggers:
  - "document this system"
  - "add to intent map"
  - "intent map documentation"
  - "domain documentation"
  - "map this tool"
  - "add system documentation"
  - "knowledge base article"
  - "document this domain"
---

# Intent Map — Add or Update Documentation

## What the Intent Map Is

The Intent Map at `docs/intent/Intent-Map/` is the centralized organizational system for the entire IX ecosystem. It maps every system, tool, domain, and subsystem — organized by **nested intent**, not by lifecycle status.

When you open a domain folder, you should see the actual subsystems that exist within that domain. When you open a subsystem, you should see the artifacts related to it. Every artifact has a clear schema label saying what kind of data artifact it is.

The Intent Map serves both humans and agents: a human drilling into `marketing-growth/acquisition-funnels/` should see the actual funnels (beta19, beta50, beta60). An agent entering a domain should immediately see everything at its fingertips — every tool, every system, every piece of context.

## Where It Lives

If the `docs/intent/Intent-Map/` folder does not exist, create it.

```
docs/intent/Intent-Map/
├── INDEX.md                         ← Master index, links to all domains
├── TEMPLATE.md                      ← Template for domain articles
├── domain-taxonomy.md               ← Why domains are organized this way
├── how-agents-use-this.md           ← Agent reading protocol
├── {domain-name}/                   ← One folder per domain
│   ├── INDEX.md                     ← Domain overview, links to subsystems
│   ├── {subsystem-name}/            ← One folder per subsystem
│   │   ├── INDEX.md                 ← Subsystem overview
│   │   ├── {artifact}.md            ← Individual documents
│   │   └── {sub-subsystem}/         ← Nest further if needed
│   └── {subsystem-name}/
└── ...
```

## CRITICAL: Organization Is By System/Intent, NOT By Lifecycle Status

The primary axis of organization is **what the thing IS** — which system, which tool, which subsystem. NOT whether it's active, experimental, or validated.

### WRONG — sorting by lifecycle status:
```
acquisition-funnels/
├── active/
│   ├── beta19-funnel.md
│   └── beta50-funnel.md
├── validated/
│   └── domain-separation.md
└── experiments/
    └── golden-window.md
```

### RIGHT — sorting by system, with status in frontmatter:
```
acquisition-funnels/
├── INDEX.md
├── beta19-product-led/
│   ├── INDEX.md
│   ├── funnel-flow.md
│   └── domain-separation.md
├── beta50-commitment-first/
│   ├── INDEX.md
│   ├── funnel-flow.md
│   ├── golden-window-offer.md
│   └── conversion-tracking.md
└── beta60/
    └── INDEX.md
```

Lifecycle status (active, experimental, validated, open-question, deferred) belongs in the **frontmatter schema** of each artifact — not as the folder structure. This way:
- When you drill into a domain, you see the actual systems
- Filtering by status can be done via frontmatter queries in Obsidian
- Moving a system doesn't require reshuffling lifecycle folders
- An agent entering a domain sees EVERYTHING at its fingertips

## Artifact Schema (Frontmatter)

Every document in the Intent Map MUST have this frontmatter:

```yaml
---
title: "{Human-readable title}"
artifact-type: "{system | tool | subsystem | pattern | decision | reference | config}"
domain: "{parent domain slug}"
subsystem: "{parent subsystem slug, if applicable}"
status: "{active | validated | experimental | open-question | deferred | deprecated}"
last-verified: "{YYYY-MM-DD}"
primary-repos: ["{repo-name}"]
related-domains: ["[[Domain Name]]"]
linked-intents: ["IX-#### — {brief description}"]
---
```

### Artifact Types — What Kind of Data Artifact Is This?

| Type | What it documents | Example |
|------|------------------|---------|
| `system` | A running system or service | CocoIndex code search, agent_find semantic search |
| `tool` | A tool agents or humans use | `ccc search`, admin simulator, governer |
| `subsystem` | A component within a larger system | coaching pipeline turn handler, Stripe webhook processor |
| `pattern` | A recurring approach or convention | grep-before-read, fail-open entitlements |
| `decision` | A design decision and its rationale | why we use Mailgun not SendGrid |
| `reference` | A reference document (file map, API routes) | key files table, route alignment |
| `config` | Configuration or setup documentation | CocoIndex settings, MCP server config |

## How to Add a New System or Tool

### Step 0: Name what you're placing — in one sentence, in human language

Before touching any files, state what you're adding in plain language. Not "agent-alignment principle about CLAUDE.md maintenance" — that's jargon about the filing system. Instead: "How to safely clean up the agent operating protocol without breaking agents." The name should make a human instantly understand what this knowledge IS, not where it goes.

### Step 1: Identify the domain — by what kind of work this IS, not what it touches

**Start from the domain, not from the tier.** The most common mistake is jumping to a tier first ("this is a principle, so it goes in 1.2_principles" or "this is a plan, so it goes in 2.0_Plans") and then picking a domain within that tier. This flattens the nesting and puts things in the wrong place.

Instead: ask "what area of the system is this about?" Read `Intent-Map/INDEX.md` to see the domains. Then `ls` the matching domain directory to see what's already there — your entry should feel like a sibling to existing articles.

**The test:** If someone browsing the Intent-Map drills into the domain folder, would they expect to find this knowledge here? If yes, it belongs. If it feels like an outlier, you're in the wrong domain.

**Common mistake:** Confusing what something TOUCHES with what it IS. CLAUDE.md maintenance touches agent alignment, but it IS infrastructure work — so it lives in `agent-infrastructure/`, not `agent-alignment/`.

If no domain fits, check `Intent-Map/domain-taxonomy.md` before creating a new one.

### Step 2: Identify the subsystem level

Where in the nesting does this live? A top-level system in a domain gets its own folder. A small tool within an existing subsystem gets a document within that subsystem's folder. Look at what already exists in the domain — if there's a `maintenance/` subsystem and your knowledge is about maintenance, it goes there.

### Step 3: Create the folder and INDEX.md

If it's a new subsystem folder:

```markdown
---
title: "{Subsystem Name}"
artifact-type: "subsystem"
domain: "{parent domain}"
status: "active"
last-verified: "{YYYY-MM-DD}"
primary-repos: ["{repo}"]
---

# {Subsystem Name}

## Intent

{What is this subsystem trying to accomplish? Not what it does technically — what human or agent experience does it serve? Why does it exist?}

## How It Works From the Outside

{What does a person or agent actually experience when using this? Walk through the most common scenario in human terms.}

## What's Inside

{List the artifacts in this subsystem folder with one-line descriptions}

- [[artifact-name]] — {what it is, what it does}
- [[artifact-name]] — {what it is}

## Connections

{What other domains or subsystems does this touch? What breaks if this changes?}

## For Agents Working Here

{What to read first. What tools to use. What common mistakes to avoid.}
```

### Step 4: Create individual artifact documents

Each artifact within the subsystem gets its own .md file with the frontmatter schema above. The body follows the TEMPLATE.md structure from the Intent-Map root, adapted to the artifact type.

### Step 5: Update the parent INDEX.md

Add a link to the new subsystem/artifact in the parent domain's INDEX.md under the appropriate section.

### Step 6: Cross-reference

If this system touches other domains, add a reference in BOTH domain articles under "Connections to Other Domains."

## How to Handle Existing Lifecycle-Organized Content

When you encounter a subsystem that's currently organized by lifecycle status (active/, validated/, experiments/ folders):

1. Create the new system-based folder structure
2. Move each artifact from its lifecycle folder into the appropriate system folder
3. Add `status:` to the artifact's frontmatter to preserve the lifecycle information
4. Remove the now-empty lifecycle folders
5. Update the parent INDEX.md

Do NOT lose lifecycle information — it moves from "which folder is it in" to "what does the frontmatter say."

## INDEX Files Are Maps, Not Monoliths

INDEX.md files serve as navigational maps — they show what exists in the domain and link to the actual documents. They can be substantial (showing intent, connections, agent guidance) but the detailed content about each system lives in its own document, not inline in the INDEX.

An INDEX should answer: "I'm looking at this domain — what's here, why does it exist, and where do I go to learn about each piece?"

## TOKEN BUDGET RULE (CRITICAL)

Spend no more than 30% of context on research, 70% on writing. Write files as you go — after each subsystem is researched, write it immediately before moving to the next. The single biggest failure mode is exhausting context on research before writing anything.

## Quality Check

Before declaring documentation done:

1. **Is every artifact clearly labeled?** — artifact-type and status in frontmatter
2. **Is the organization by system/intent, not by status?** — folders named after what they ARE
3. **Would someone drilling into this domain see the actual systems?** — not a flat list of lifecycle categories
4. **Are cross-domain connections documented in both directions?**
5. **Is there an INDEX.md at every folder level?** — the navigational map
6. **Does the INDEX lead with intent?** — why this exists, not just what it contains

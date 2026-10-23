---
name: intent-map-domain-synthesis
paths: "**/intent/**,**/seeds/**,**/proposals/**"
description: "Compose or restructure a domain-level INDEX and synthesis for the Intent Map at <api-repo>/docs/intent/Intent-Map/. Use when creating a new domain, restructuring an existing one, or building the navigational synthesis layer. For adding a single entry, use /intent-map-docs-add instead."
triggers:
  - "compose domain index"
  - "restructure domain"
  - "create domain synthesis"
  - "build domain map"
  - "organize domain"
  - "domain knowledge article"
---

# Compose Domain Knowledge Article — Intent Map Synthesis Layer

You are creating or restructuring a **domain-level synthesis** in the Intent Map. This is the INDEX.md and folder structure for an entire domain — the navigational map that shows what subsystems exist, how they connect, and why they matter.

**For adding a single artifact/entry to an existing domain, use `/intent-map-docs-add` instead.** This skill is for the heavier lift of composing or restructuring the domain itself.

## Where It Lives

All domain synthesis goes in: `<api-repo>/docs/intent/Intent-Map/{domain-name}/`

The master index is at: `<api-repo>/docs/intent/Intent-Map/INDEX.md`

If the `Intent-Map/` folder or its `INDEX.md` does not exist, create it.

## CRITICAL: Organization Is By System/Intent, NOT By Lifecycle Status

The primary organizational axis is **what the thing IS** — which system, which subsystem, which tool. NOT whether it's active, experimental, or validated.

Lifecycle status (active, experimental, validated, open-question, deferred) belongs in the **frontmatter** of each individual artifact document — not as the folder structure.

### WRONG:
```
acquisition-funnels/
├── active/
│   └── beta19-funnel.md
├── validated/
└── experiments/
```

### RIGHT:
```
acquisition-funnels/
├── INDEX.md
├── beta19-product-led/
│   ├── INDEX.md
│   └── funnel-flow.md       (status: active in frontmatter)
├── beta50-commitment-first/
│   ├── INDEX.md
│   └── golden-window.md     (status: experimental in frontmatter)
```

When someone drills into a domain, they should see the actual subsystems — not a sorting by status. Status is metadata, not structure.

## Artifact Frontmatter Schema

Every document MUST have:

```yaml
---
title: "{Human-readable title}"
artifact-type: "{system | tool | subsystem | pattern | decision | reference | config}"
domain: "{parent domain slug}"
status: "{active | validated | experimental | open-question | deferred | deprecated}"
last-verified: "{YYYY-MM-DD}"
primary-repos: ["{repo-name}"]
---
```

## INDEX.md Structure (the synthesis document)

The INDEX.md is the map of the domain. It leads with intent and links to subsystems.

```markdown
# {Domain Name}

## Intent

{What are we trying to accomplish with this domain? What human experience does it serve?}

## Subsystems

{List each subsystem with a link and one-line intent description}

- [[subsystem-name/INDEX]] — {what this subsystem is trying to accomplish}
- [[subsystem-name/INDEX]] — {intent description}

## Connections to Other Domains

{What other domains does this touch? What breaks if this changes?}

## For Agents Working Here

{What to read first. What tools to use. Common mistakes.}
```

## How to Research Before Writing

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` with domain keywords to surface recent work
2. Read existing artifacts in the domain folder
3. Check Intent DB for related UX intents
4. Check CLAUDE.md for domain-specific rules
5. Query /insight for institutional principles

**TOKEN BUDGET: 30% research, 70% writing. Write as you go — don't exhaust context on research.**

## When to Use This vs /intent-map-docs-add

| Situation | Skill |
|---|---|
| Creating a new domain from scratch | This skill |
| Restructuring an existing domain's folder layout | This skill |
| Building the INDEX.md synthesis for a domain | This skill |
| Adding one system/tool to an existing domain | `/intent-map-docs-add` |
| Documenting a tool you just built | `/intent-map-docs-add` |

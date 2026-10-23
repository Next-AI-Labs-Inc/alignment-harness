---
name: founder-knowledge-store
description: Read, write, and search the Founder Knowledge Store — personal insights, sales lessons, relationship patterns, strategic frameworks
triggers:
  - "founder knowledge"
  - "stored insights"
  - "founder memory"
  - "knowledge base"
---

# Founder Knowledge Store

The Founder Knowledge Store captures **personal founder-level** knowledge that doesn't fit into company intents (which are organizational/strategic) or UX intents (which are feature-level). It stores sales lessons, relationship patterns, market observations, leadership principles, and personal decision frameworks.

**Agents should use `agent_find` with `sources: ["record"]` for founder-specific queries and `agent_find` for strategic/business queries.**

## Quick Start

### Search Founder Knowledge (MCP)
```
agent_find({ query: "closing enterprise deals", sources: ["record"] })   — weighted search, local records only
grep -ri "enterprise" "$(alignment-harness records personal-knowledge)"   — regex search
agent_find({ query: "pricing strategy" })                                  — weighted search, all sources
```

### Add Founder Knowledge (CLI)
```
alignment-harness store add personal-knowledge --json '{
  "context": "Enterprise sales call with VP of Engineering at Acme Corp",
  "lesson": "Always ask about their current pain before pitching features. The first 5 minutes should be 80% listening.",
  "category": "sales",
  "tags": ["enterprise", "discovery", "listening"],
  "confidence": 9
}'
```

### Browse & Retrieve (CLI)
```
alignment-harness store list personal-knowledge --where category=sales --json      — list all sales entries
alignment-harness store list personal-knowledge --limit 5 --json                   — most recent 5 entries
alignment-harness store get personal-knowledge personal-kno-20261017224442-a314eb  — full entry by ID
```

---

## MCP Tools

These tools are available via this plugin's `agent-find` MCP server and the `alignment-harness` command:

### Weighted Search Tools

| Tool | Profile | When to Use |
|------|---------|-------------|
| `agent_find` | default | General coding/dev queries — balanced weights across all sources |
| `agent_find` | default | Business strategy, pricing, growth, org questions — same weights as default |
| `agent_find` with `sources: ["record"]` | record | Personal founder knowledge, sales, relationships — local records only |

### Founder CRUD Tools

| Tool | Description |
|------|-------------|
| `alignment-harness store add personal-knowledge` | Add entry — writes one JSON file to the records folder (searched by `agent_find`) |
| `grep -ri` on `$(alignment-harness records personal-knowledge)` | Regex search across context, lesson, tags, category |
| `alignment-harness store get personal-knowledge <id>` | Get full entry by record id |
| `alignment-harness store list personal-knowledge` | List entries sorted by updatedAt, optional category filter |

---

## Search Profile Weights

Each tool uses a different weight profile that controls how results from different sources are ranked:

### `default` (agent_find)
```
doc:1.0  record:1.0  session:0.9  commit:0.7  skill:0.6
```

### `company` (agent_find)
```
doc:1.0  record:1.0  session:0.9  commit:0.7  skill:0.6
```

### `founder` (agent_find with sources: ["record"])
```
record:1.0
```

**Key insight**: The `founder` profile is the default `record` weight alone, so only the local records folder is searched. Code-centric results do not appear.

---

## Categories

| Category | What It Captures |
|----------|-----------------|
| `sales` | Sales lessons, deal patterns, objection handling |
| `relationships` | Relationship management, networking, trust-building |
| `strategy` | Strategic thinking, decision frameworks |
| `personal` | Personal development, habits, routines |
| `market` | Market observations, competitive intelligence |
| `product` | Product intuitions, feature instincts |
| `leadership` | Leadership principles, management |
| `operations` | Operational learnings, process optimization |
| `culture` | Culture, team dynamics, hiring |
| `other` | Uncategorized |

---

## Data Architecture

### Single-Write Pattern
Every `alignment-harness store add personal-knowledge` call writes to ONE store:

1. **JSON file** (`<records folder>/personal-knowledge/<id>.json`, folder printed by `alignment-harness records personal-knowledge`) — structured CRUD, category filtering, ID lookups

No index rebuild is needed: `agent_find` reads the records folder on every search, so the entry is searchable right away.

### Record Model
Stored by `${CLAUDE_PLUGIN_ROOT}/lib/store.js` as one JSON file per entry:
```javascript
{
  context: String,      // required — the situation
  lesson: String,       // required — the insight
  category: String,     // enum (see Categories above)
  tags: [String],       // flexible categorization
  confidence: Number,   // 1-10
  status: String,       // draft | approved | deprecated
  addedBy: String,      // who added this
  metadata: Mixed,      // arbitrary extra data
  createdAt: Date,      // auto
  updatedAt: Date,      // auto
}
```

`agent_find` keyword-ranks the whole entry text (no field weights).

### Search Profiles Config
Located at `${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/lib/search.js`:
- `STARTING_DEFAULT_WEIGHTS` — resolves weight for scoring
- `VALID_SOURCES` — the sources `agent_find` can search
- `agentFind(query, { sources, limit })` — the search itself, for debugging

---

## Integration Points

| System | How It Connects |
|--------|----------------|
| `agent_find` | Can include `"record"` in explicit sources array to search founder knowledge |
| `agent_find` (no `sources`) | Searches founder knowledge along with everything else (record weight 1.0) — use `sources: ["record"]` to narrow |
| Records folder | JSON entries searched alongside docs, commits, sessions and skills, under `record:personal-knowledge/` |
| Records folder | Direct file access via `alignment-harness records personal-knowledge`, `grep` for structured search |
| Store module | Available for future admin UI at `${CLAUDE_PLUGIN_ROOT}/lib/store.js` |

---

## When to Use Which Tool

| Scenario | Tool |
|----------|------|
| "What sales lessons do we have?" | `agent_find({ query: "sales lessons", sources: ["record"] })` |
| "What's our pricing strategy?" | `agent_find("pricing strategy")` |
| "How does the login flow work?" | `agent_find("login flow architecture")` |
| "Remember this hiring lesson" | `alignment-harness store add personal-knowledge --json '{ "context": "...", "lesson": "...", "category": "culture" }'` |
| "List all sales knowledge" | `alignment-harness store list personal-knowledge --where category=sales --json` |
| "Get details on entry X" | `alignment-harness store get personal-knowledge <id>` |
| "Find entries about enterprise" | `grep -ri "enterprise" "$(alignment-harness records personal-knowledge)"` |

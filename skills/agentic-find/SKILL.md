---
description: "Explain how agent_find works and troubleshoot its results. Use when asked how to query IX institutional knowledge."
name: agentic-find
triggers:
  - "agent_find"
  - "agent find tool"
  - "how does agent_find work"
  - "swarm search"
  - "institutional memory search"
---

# agent_find — Unified Knowledge Search

## Usage

```
agent_find("firebase email spam")
```

One MCP tool call. Semantic-first search across 10 sources, keyword fallback, returns ranked results.

## How Search Works

**Two-path search** runs in parallel on every query:

1. **Semantic (primary)** — Embeds the query with `Xenova/all-MiniLM-L6-v2`, runs cosine similarity against ALL indexed sources. Catches synonyms, paraphrases, and conceptual matches ("cost model" finds "pricing philosophy").

2. **Keyword (fallback)** — Substring + regex matching on MongoDB and git. Catches exact matches, recently-added docs not yet in the vector index, and sources that can't be embedded (git commits, swagger, markdown docs).

Results from both paths merge, get scored with source weight + recency, then deduped by title.

### Keyword Scoring (Tolerant of Extra Terms)

Uses `max(ratio, absScore)` so extra query words don't kill good results:
- `matchCount / totalTerms` (strict ratio) OR
- `min(1.0, 0.15 + matchCount * 0.25)` (absolute match reward)
- Whichever is higher wins. 1 match = 0.4 min, 2 = 0.65 min, 3+ = 0.9+.

## Sources Searched

| Source | Emoji | Data | Weight | Semantic? | Keyword Method |
|--------|-------|------|--------|-----------|----------------|
| Swarm Memory | 🧠 | 512+ JSONL entries | 1.2x | Yes (JSONL) | Vector cosine |
| Intent DB | 🎯 | 72+ intents | 1.4x (highest) | Yes (MongoDB) | Regex on title/primaryIntent/tags |
| Company Intents | 🏢 | Strategic decisions | 1.2x | Yes (MongoDB) | Regex on title/primaryIntent/category |
| API Endpoints | 🌐 | 223 Swagger paths | 1.1x | No | Cached swagger.json keyword match |
| Agent Tools | 🔧 | 59+ registered tools | 1.0x | Yes (MongoDB) | MongoDB $text + keyword validation |
| Markdown Docs | 📄 | 1100+ .md files | 1.0x | No | git ls-files + heading/content match |
| UX Assignments | ✅ | 200 recent | 0.9x | Yes (MongoDB) | Regex on summary/commits |
| Dev Tasks | 📋 | 100 recent | 0.8x | Yes (MongoDB) | MongoDB $text + keyword validation |
| Git Commits | 📝 | All since 2025-06 | 0.7x | No | git log --grep |
| Founder Knowledge | 👤 | Personal insights | 2.0x (founder profile) | Yes (MongoDB + JSONL) | Regex + vector |

**"Semantic?"** = whether it's embedded in the unified vector index (auto-indexed on startup and refresh).

## Scoring

```
composite = relevance × sourceWeight × recencyDecay
```

- **Relevance**: rescaled cosine similarity (semantic) or keyword match score (fallback)
- **Source weight**: profile-dependent (see Profiles below)
- **Recency**: e^(-0.012 × daysAgo) — today=1.0, 7d=0.85, 30d=0.6, 90d=0.35

## Profiles

| Profile | Used by | Highest weight | Lowest weight |
|---------|---------|---------------|---------------|
| `default` | `agent_find` | intent (1.4), swarm/company (1.2) | commit (0.7), founder (0) |
| `company` | `agent_find_company` | company_intent (2.0), intent (1.8) | commit (0.4), founder (0) |
| `founder` | `founder_find` | founder (2.0), company_intent (1.8) | commit (0.56) |

## Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| query | string | required | Natural language search |
| limit | number | 8 | Max results |
| sources | string[] | all | Filter to specific sources |

Valid source names: `swarm`, `intent`, `company_intent`, `tool`, `ux`, `commit`, `task`, `api`, `doc`, `founder`

## Automatic Indexing

Structured sources (intents, tools, UX, tasks, founder, company intents) are **automatically embedded** into the vector store:

- **On startup**: `buildIndex()` (JSONL) → `indexStructuredSources()` (MongoDB)
- **On refresh**: After any `add_memory` or memory update, re-indexes structured sources too
- **Cache**: Embeddings cached by content hash in `data/vector-cache/vector-cache.json` — only re-embeds when content changes

No manual intervention needed. The MCP server keeps the semantic index current.

## When to Use

- **Starting any task** — run `agent_find("topic keywords")` first
- **Before creating helpers** — check if one exists
- **Debugging** — find related memories, intents, and past work
- **Understanding intent** — surface WHY something was built
- **API discovery** — find relevant endpoints without reading swagger.json
- **Synonym/concept queries** — semantic search finds "cost model" from "pricing philosophy"

## When NOT to Use

- For a specific file path → use Glob
- For code inside a known file → use Grep
- To log a new memory → use `alignment-harness record <kind>`

## Output Format

```
Found 5 results for "premium feature gate" (from 28 candidates):

1. 🔧 how-to-gate-premium-features-with-simulation-support
   🎯 73% | 2d ago | slug:how-to-gate...
   Canonical pattern for gating premium features...

2. ✅ Model selector gates premium models for LIMITED_ACCESS users
   🎯 67% | 1d ago | status:pending | repo:web-app

3. 🎯 Trial Tier 1: Full Access (No Gates)
   🎯 67% | 3d ago | slug:trial-tier-1...
```

## Source Files

- **Core search**: `${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/lib/search.js` (agentFind, indexStructuredSources)
- **Vector store**: `${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/lib/vector.js` (addDocuments, searchUnified)
- **Source weights**: `${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/lib/search.js`
- **MCP wiring**: `${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/server.js` (tools: agent_find, agent_find_company, founder_find)
- **Tests**: `${CLAUDE_PLUGIN_ROOT}/plugin-dev/tests-smoke/smoke.sh`

## Architecture

```
agent_find("query")
    │
    ├─► searchUnified()           ← SEMANTIC (primary)
    │   ├─ JSONL memories         (Xenova/all-MiniLM-L6-v2 embeddings)
    │   ├─ Intents                (auto-indexed from MongoDB)
    │   ├─ Company Intents        (auto-indexed from MongoDB)
    │   ├─ Agent Tools            (auto-indexed from MongoDB)
    │   ├─ UX Assignments         (auto-indexed from MongoDB)
    │   ├─ Founder Knowledge      (auto-indexed from MongoDB)
    │   └─ Developer Tasks        (auto-indexed from MongoDB)
    │
    ├─► searchIntents()           ← KEYWORD FALLBACK
    ├─► searchCompanyIntents()      (catches exact matches +
    ├─► searchTools()                recently-added docs not
    ├─► searchUx()                   yet in vector index)
    ├─► searchTasks()
    ├─► searchSwarm()             ← also vector, but swarm-only
    ├─► searchCommits()           ← git log --grep (keyword only)
    ├─► searchSwagger()           ← cached swagger.json (keyword only)
    └─► searchDocs()              ← git ls-files *.md (keyword only)
         │
         ▼
    Merge all results
         │
         ▼
    Score: relevance × sourceWeight × recency
         │
         ▼
    Dedupe by title → Return top N
```

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Zero results | Query too short (all terms ≤2 chars) | Use longer keywords |
| Missing semantic matches | Structured sources not indexed | Restart MCP server (indexes on startup) |
| Stale results | New MongoDB docs not in vector index | Run `swarm-rebuild-index` or restart MCP |
| Wrong source weighting | Using wrong profile | Check profile param (default/company/founder) |
| **"Transport closed"** | MCP server crashed or was killed | **See recovery section below** |

## When MCP is Down ("Transport closed")

The stdio pipe is **permanently dead** for this session. Cannot reconnect mid-session. Do this:

### 1. Diagnose
```bash
alignment-harness doctor
```

### 2. Use CLI Fallback (same search, no MCP)
```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "your query"
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "your query" --sources session
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "test query"
```

### 3. Tell the Human
"MCP transport is down. Using CLI fallback. Restart Claude Code session to restore MCP tools."

### Other Fallbacks
- Log memories: `alignment-harness record <kind>`
- Read JSONL directly: `cat "$(alignment-harness records <kind>)"/*`
- Code search: use Glob/Grep (no MCP dependency)

## Activation

Restart Claude Code after changes to pick up the new MCP tool.

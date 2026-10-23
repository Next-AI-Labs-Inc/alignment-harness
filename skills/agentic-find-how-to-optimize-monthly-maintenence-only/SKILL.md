---
name: agent-find-how-to-optimize-monthly-maintenence-only
description: "Tune agent_find signal quality during monthly maintenance. Use when results feel noisy or need recalibration."
triggers:
  - "agent-find maintenance"
  - "tune agent_find"
  - "agent find output quality"
  - "calibrate search results"
  - "agent find is noisy"
  - "agent find not surfacing"
---

# agent-find Monthly Maintenance & Optimization

## Overview

agent-find is the canonical first search for all agents. Its output quality directly determines whether agents act correctly on the first pass. This skill covers monthly tuning of signal/noise ratio, section thresholds, and source weights.

**Not for feature work.** For adding new sections or capabilities, read the source directly.

---

## Key Files

| File | Purpose |
|------|---------|
| `agent-swarm-mcp/mcp-server/agent-find.js` | Main search engine + output formatter |
| `agent-swarm-mcp/mcp-server/search-profiles.js` | Source weights per profile |
| `agent-swarm-mcp/scripts/agent-find-cli.js` | CLI test harness |
| `agent-swarm-mcp/logs/agent-artifacts.jsonl` | Session artifact JSONL (533+ entries) |
| `agent-swarm-mcp/data/vector-cache/` | Embedding cache |

---

## How to Test

Always test with the CLI — MCP transport may be down and results are identical:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "your query" 2>&1
```

**Test with 3 different query types each maintenance cycle:**
1. An operational task: `"how do I add credit to a customer stripe account"`
2. A debugging query: `"why is the stripe webhook not firing for new subscriptions"`
3. A domain knowledge query: `"how to get trial conversion rates by offer"`

---

## Output Structure (What Good Looks Like)

```
Found N results for "..." (from X candidates):
Hits: intent(N) | artifact(N) | tool(N) | commit(N) | doc(N)

1-4. Full intent results with body snippet
─── MORE MATCHES ───        (max 5, intents only, one line each)
─── SESSION ARTIFACTS ───   (past work, agent_read ID, days ago)
─── COMMITS ───             (recent code changes in domain)
─── DOCS ───                (reference material)
─── SWARM ───               (pattern memories, deduped)
─── STRATEGY ───            (company intents, max 3, high threshold)
─── TOOLS MATCHED ───       (endpoints + skills, slug + %, deduped)
```

**Signs it's working correctly:**
- Top 4 results are specific UX intents for the domain
- `stripe-add-customer-credit` or equivalent skill appears first in TOOLS MATCHED for operational queries
- SESSION ARTIFACTS shows research reports with clean titles + IDs
- Company intents NOT in main results (only in STRATEGY section)
- No duplicate lines anywhere

---

## Source Weights (`search-profiles.js` → `PROFILES.default`)

Current tuned values:
```js
intent:         1.4   // highest — UX intents are ground truth
artifact:       1.0   // session work — high value
tool:           1.1   // endpoints/skills — operational
api:            1.1   // swagger endpoints
doc:            1.0   // reference material
swarm:          0.9   // pattern memories
commit:         0.9   // recent code changes
company_intent: 0.3   // strategic context ONLY — appears via STRATEGY section, not main results
ux:             0.8   // UX assignments
task:           0.6   // mostly dead — don't increase
founder:        0.0   // never in default results
```

**Rule:** `company_intent` must stay ≤ 0.3 or it floods main results. It belongs only in the compact STRATEGY section.

---

## Section Thresholds (`agent-find.js` → `compactSectionDefs`)

```js
{ src: "artifact",       limit: 10, threshold: 0.35 }  // min relevance to show
{ src: "commit",         limit: 5,  threshold: 0 }
{ src: "doc",            limit: 5,  threshold: 0 }
{ src: "swarm",          limit: 10, threshold: 0 }      // filtered in formatter to ≥35%
{ src: "company_intent", limit: 3,  threshold: 0.65 }  // only show solid strategic matches
```

**TOOLS MATCHED threshold:** 0.30 composite, top 20, deduped by slug.

---

## Section-Only Sources

These sources **never appear in main results or MORE MATCHES** — they have dedicated sections:
```js
const SECTION_ONLY = new Set(["tool", "api", "skill", "artifact", "swarm"]);
```

If tools or artifacts start bleeding into MORE MATCHES, check this set.

---

## Common Issues & Fixes

### Problem: Company intents flooding main results
**Symptom:** Results 1-8 are all `🏢` company intent entries
**Fix:** Check `company_intent` weight in `search-profiles.js` — should be `0.3` not higher

### Problem: SESSION ARTIFACTS section empty
**Symptom:** `artifact(0)` in hit counts, no artifact section
**Check:** Was `buildIndex()` called on the vectorStore before `agentFind()`?
In `scripts/agent-find-cli.js`:
```js
const vectorStore = new MemoryVectorStore({ logsDir: LOGS_DIR, cacheDir: VECTOR_CACHE_DIR });
await vectorStore.buildIndex(); // ← THIS MUST BE PRESENT
```

### Problem: Artifact titles are raw session context
**Symptom:** Lines like "The user had three requests:" or "- Original request:"
**Fix:** Expand `SKIP_RAW` regex in `formatAgentFindResults()`:
```js
const SKIP_RAW = /^(The user|A user|User (is|was|had|request)|[-•]\s|\d+\.\s|Session (started|context)|...)/i;
```

### Problem: TOOLS MATCHED has duplicates
**Symptom:** Same endpoint slug appears twice
**Fix:** Check `seenTools` Set dedup logic in formatter TOOLS MATCHED block

### Problem: SWARM section shows founder knowledge (pricing/agency entries)
**Symptom:** "When considering agency partnerships..." appearing for coding queries
**Fix:** Swarm formatter filters `item.more.includes("/founder")` — verify this filter is active

### Problem: Docs section has duplicate titles
**Symptom:** Same doc title appears twice with different paths
**Fix:** `seenDoc` Set dedup in formatter doc section — verify it's active

### Problem: Swarm section appears with very low scores (15-25%)
**Symptom:** Swarm entries at 22% with no signal
**Fix:** Swarm minimum threshold in formatter: `item.score >= 35`

---

## Artifact Detection Logic

Artifacts are session work auto-extracted by the artifact extractor. Detected in `searchSwarm()`:
```js
const isArtifact = m.agent_id === "artifact-extractor" ||
  (m.tags || []).includes("auto-extracted");
```

Artifact `more` ref format: `agent_read 10524` (5-digit ID)
Read full content: `agent_read({ id: 10524 })`

---

## Monthly Tuning Checklist

1. **Run 3 test queries** (operational, debugging, domain knowledge)
2. **Check hit count header** — all expected sources appearing?
3. **Check top 4 results** — are they specific intents for the domain or noise?
4. **Check TOOLS MATCHED** — does the most relevant tool/endpoint appear first?
5. **Check SESSION ARTIFACTS** — clean titles? relevant content? IDs present?
6. **Check for section bleed** — tools/artifacts appearing in main results?
7. **Check for duplicates** — in TOOLS MATCHED, DOCS, SWARM?
8. **Check STRATEGY section** — appearing only when genuinely strategic? Max 3?
9. **If weights need adjustment** — change `search-profiles.js` only, test all 3 queries after
10. **Commit changes** — message format: `refine(agent-find): [what changed and why]`

---

## Architecture Notes

- Vector store searches JSONL logs only (`this.index`) via `search()` method
- Structured docs (intents, tools) indexed separately via `indexStructuredDocuments()`
- Both live in same `MemoryVectorStore` instance but searched differently
- `searchSwarm()` is called with `limit * 4` to ensure enough artifact candidates surface
- Composite score = `relevance × sourceWeight × recency × statusMultiplier`
- `approved` status = 1.075x multiplier, `proposed/pending` = 0.925x

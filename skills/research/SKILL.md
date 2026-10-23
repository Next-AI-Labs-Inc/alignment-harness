---
name: research
description: "Full lifecycle guide for conducting structured research: check existing findings, create a record, gather evidence, and record"
triggers:
  - "research"
  - "investigate"
  - "analyze metric"
  - "validate hypothesis"
  - "research finding"
  - "conduct research"
  - "explore topic"
---

# Research — Full Lifecycle Guide

Before your output, print `## RESEARCH_FINDING` on its own line. This enables automated extraction to the compaction admin UI.

## Overview

This harness has a structured research system built on local `research` records (`alignment-harness store`), artifact caching, and semantic search. This skill walks through the complete research lifecycle.

**Base URL:** `alignment-harness store add|list|get|update research`
**Auth:** none (local records)
**Admin UI:** the folder `alignment-harness records research` prints

---

## Research Rigor Standard

**Conclude nothing without /research rigor and /evidence. Build from ideation to evidence without skipping over conflation of "looks like" with "means."**

Every research product must distinguish between:
- **Observed data** — what the numbers actually show (measurement)
- **Correlation** — two things that move together (pattern, not causation)
- **Causal claim** — X caused Y (requires mechanism + controlled comparison)

"Looks like" is an observation. "Means" is a conclusion. Never bridge from one to the other without stating the evidence chain that justifies the leap. If the chain has gaps, say so — gaps are valuable, not shameful.

---

## Step 1: Check Existing Knowledge First

Before creating a new finding, search for prior research on the topic.

```bash
# Semantic search across all IX knowledge (swarm, intents, tools, commits)
# MCP tool:
agent_find({ query: "your research topic here" })

# CLI fallback if MCP is down:
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "your research topic"

# Search existing ResearchFindings in local records:
alignment-harness store list research --json | jq '.[] | select(tostring | test("YOUR_TOPIC"; "i")) | {id, title, verdict, confidence}'

# Read a cached artifact by 5-digit ID:
# MCP tool:
agent_read({ id: "10805" })
```

If existing research covers your question, build on it instead of starting fresh. Link to it via `linkedCompactionIds`.

---

## Step 2: Create a ResearchFinding

Create a finding with your hypothesis BEFORE conducting the research. This ensures the research is trackable from the start.

```bash
alignment-harness store add research --json '{
    "title": "Descriptive title of what you are investigating",
    "subtitle": "One-line context",
    "researchType": "metric-analysis",
    "hypothesis": "We believe X because Y, and expect to see Z",
    "kpiKey": "exchanges_per_user",
    "dataSource": "mongodb",
    "tags": ["coaching", "retention"],
    "verdict": "in-progress"
  }'
```

**Save the returned `id`** — you will need it for all subsequent updates.

### Research Type Options

| Type | When to use |
|------|-------------|
| `metric-analysis` | Analyzing a KPI, conversion rate, or behavioral metric |
| `ux-regression` | Investigating a UX degradation or regression |
| `decision-audit` | Reviewing whether a past decision had its intended effect |
| `prompt-regression` | Coaching prompt quality changed unexpectedly |
| `cohort-analysis` | Comparing user cohorts (by signup date, plan, behavior) |
| `funnel-analysis` | Analyzing drop-off in a conversion funnel |
| `ab-test-review` | Reviewing results of an A/B experiment |
| `system-health` | System performance, error rates, infrastructure |
| `other` | Anything that does not fit the above |

---

## Step 3: Conduct the Research

### Web Research (firecrawl)

Use the firecrawl CLI for any web-based research:

```bash
# Search the web
firecrawl search "your query" --limit 5

# Scrape a specific page
firecrawl scrape "https://example.com/article" --format markdown

# Deep research (multi-step, agent-driven)
firecrawl agent "What is the current best practice for X?"
```

### Internal Data Research

```bash
# Query MongoDB via admin tooling
curl -s "<your-api>/..." \
  -H "x-api-key: $YOUR_API_KEY"

# Check coaching telemetry
curl -s "<your-api>/<your-telemetry-endpoint>" \
  -H "x-api-key: $YOUR_API_KEY"
```

### Codebase Research

```bash
# Semantic search across code, commits, and institutional knowledge
agent_find({ query: "specific code pattern or system behavior" })

# Direct code search
# Use Grep and Read tools as normal
```

---

## Step 4: Record Findings

Update the ResearchFinding with your methodology and results.

```bash
alignment-harness store update research FINDING_ID --json '{
    "methodology": "Queried MongoDB for sessions in date range, compared exchange counts pre/post change",
    "findings": "## Key Findings\n\n1. Exchange count dropped 15% after commit abc123\n2. Drop concentrated in new users (< 7 days)\n3. Returning users unaffected",
    "conclusion": "The prompt change in abc123 reduced first-session engagement for new users",
    "timeRange": {
      "from": "2026-03-01T00:00:00Z",
      "to": "2026-03-15T00:00:00Z"
    }
  }'
```

---

## Step 5: Add Measurements

Attach quantitative data points to track the metric over time.

```bash
alignment-harness store update research FINDING_ID --json "$(alignment-harness store get research FINDING_ID | jq -c '{measurements: ((.measurements // []) + [{
    "date": "2026-03-10T00:00:00Z",
    "value": 4.2,
    "label": "Avg exchanges per session (new users)",
    "notes": "Week of Mar 10, post-change"
  }])}')"
```

Add multiple measurements to build a time series. The admin UI renders these as charts.

---

## Step 6: Link Decisions

Connect code changes or decisions that caused the observed effect.

```bash
alignment-harness store update research FINDING_ID --json "$(alignment-harness store get research FINDING_ID | jq -c '{linkedDecisions: ((.linkedDecisions // []) + [{
    "commitHash": "abc123def",
    "date": "2026-03-08T00:00:00Z",
    "description": "Changed greeting prompt to be more directive",
    "impact": "negative"
  }])}')"
```

**Impact options:** `positive`, `negative`, `neutral`, `unknown`

You can also update existing linked decisions:

```bash
alignment-harness store update research FINDING_ID --json "$(alignment-harness store get research FINDING_ID | jq -c '{linkedDecisions: (.linkedDecisions | .[0] += { "impact": "negative" })}')"
```

---

## Step 7: Set Verdict and Confidence

When research is complete, set the final verdict.

```bash
alignment-harness store update research FINDING_ID --json '{
    "verdict": "confirmed",
    "confidence": 85,
    "actionRecommendation": "Revert commit abc123 and A/B test the new prompt against baseline",
    "status": "actionable"
  }'
```

**Verdict options:**

| Verdict | Meaning |
|---------|---------|
| `in-progress` | Research is ongoing |
| `confirmed` | Hypothesis validated by evidence |
| `refuted` | Hypothesis disproven by evidence |
| `inconclusive` | Evidence does not clearly support or refute |
| `needs-more-data` | Insufficient data to reach a conclusion |

**Confidence:** 0-100 continuous score. Never bucket it. 85 means exactly 85.

**Status options:** `backlog`, `actionable`, `in-progress`, `reviewed`, `done`, `in-production`, `archived`

---

## Quick Reference: API Endpoints

| Command | Purpose |
|---------|---------|
| `alignment-harness store list research [--where k=v]` | List all (filters: status, researchType, verdict) |
| `alignment-harness store list research --json \| jq '.[] \| select(tostring \| test("X"; "i"))'` | Agent-optimized search (compact fields) |
| `alignment-harness store get research :id` | Get single finding |
| `alignment-harness store add research --json '{...}'` | Create finding (title required) |
| `alignment-harness store update research :id --json '{...}'` | Update finding |
| `rm "$(alignment-harness records research)/:id.json"` | Delete finding |
| append to `comments` (same pattern as Step 5) | Add comment (text required) |
| append to `measurements` (Step 5) | Add measurement (value required) |
| append to `linkedDecisions` (Step 6) | Add linked decision (description required) |
| `.linkedDecisions[:index]` update (Step 6) | Update linked decision |

## Quick Reference: MCP Tools and Slugs

| Tool | Purpose |
|------|---------|
| `agent_find({ query })` | Semantic search across all IX knowledge |
| `agent_read({ id })` | Read cached artifact by 5-digit ID |
| `alignment-harness store list research` | List findings via local store |
| `alignment-harness store add research` | Create finding via local store |
| `alignment-harness store update research` | Update finding via local store |
| `alignment-harness store list research --json \| jq` | Agent search via local store |

## Quick Reference: Related Skills

| Skill | When to use |
|-------|-------------|
| `/agentic-artifact-cache` | Reading/managing cached research artifacts |

---
name: agentic-artifact-cache
description: "Read cached research and plan docs from past sessions by ID. Use when agent_find returns an artifact_id."
triggers:
  - "artifact cache"
  - "cached research"
  - "agent artifacts"
---

# Agent Artifact Cache

## What This Is

Auto-extraction system that captures agent research reports, implementation plans, and context summaries from Claude Code session logs and makes them searchable via `agent_find`.

**Zero token cost.** Extraction runs as a SubagentStop hook using heuristics — no LLM calls.

## When To Use

- **As an agent**: Call `agent_find` first. If results include entries with `artifact_id` in metadata, you can read the full document with `agent_read`.
- **As a human**: Run `node agent-swarm-mcp/scripts/extract-agent-artifacts.js --stats` to see what's cached, `--read <id>` to read a specific artifact.

## MCP Tool: agent_read

Read auto-extracted agent artifacts by 5-digit ID. Supports offset/limit for context control.

```
agent_read({ id: 10006 })                    → first 200 lines
agent_read({ id: 10006, limit: 50 })         → first 50 lines
agent_read({ id: 10006, offset: 200 })       → lines 201-400
agent_read({ id: 10006, offset: 200, limit: 100 }) → lines 201-300
```

The response tells you how many lines remain and the exact offset to continue from.

## Artifact Types

| Type | Description | Confidence |
|------|-------------|-----------|
| `research_report` | Deep codebase analysis, architecture audits, system explorations | 9 |
| `plan` | Implementation plans with action steps and file targets | 8 |
| `context_summary` | Session compaction summaries (decision context, reasoning chains) | 6 |
| `code_completion` | Short task completions — NOT stored by default (low signal) | — |

## How Agents Find Artifacts

Artifacts are stored in `agent-swarm-mcp/logs/agent-artifacts.jsonl` and indexed by the vector search. When you run `agent_find("auth architecture")`, matching artifacts appear in results with:

- **context**: Summary of what the artifact covers + key findings (~300 tokens)
- **lesson**: Pointer to full doc (`agent_read 10006`) + topics + key files
- **metadata.artifact_id**: The 5-digit ID for programmatic access

## Context Summaries (Compactions)

Compaction summaries are auto-generated when sessions approach context limits. They contain:
- `<analysis>`: Chronological decision history (why things were done)
- `<summary>`: Structured reference (files, errors, pending tasks)

The extractor parses both sections, strips XML tags, and stores clean markdown. Swarm entries include pending tasks so future agents know what's unfinished.

**Included by default.** Use `--no-compacts` to exclude.

## CLI Reference

```bash
# Extract from recent sessions (includes compactions by default)
node scripts/extract-agent-artifacts.js --recent 5

# Test mode (show what would be extracted, don't save)
node scripts/extract-agent-artifacts.js --test --recent 3

# Read a specific artifact
node scripts/extract-agent-artifacts.js --read 10006

# View stats
node scripts/extract-agent-artifacts.js --stats

# Force re-extract (ignore dedup)
node scripts/extract-agent-artifacts.js --force --recent 5

# Exclude compaction summaries
node scripts/extract-agent-artifacts.js --no-compacts --recent 5
```

## Storage Layout

```
agent-swarm-mcp/
  data/artifacts/
    10001.md                    # Full document (markdown)
    10002.md
    index.jsonl                 # Structured metadata index
    .extracted-sessions.json    # Tracks which agents already processed
  logs/
    agent-artifacts.jsonl       # Swarm memory entries (searchable via agent_find)
```

## Auto-Extraction Hook

Configured in `~/.claude/settings.json` as a `SubagentStop` hook. Fires automatically when any subagent finishes. Errors are logged to the centralized admin system logs at `<your admin logs page>`.

Hook script: `agent-swarm-mcp/scripts/hook-extract-on-stop.sh`

## Signal vs Noise

The classifier uses structural heuristics, not LLM calls:
- Research reports have a consistent opener pattern ("Perfect! Now I have a comprehensive understanding...")
- Plans have action-verb numbered steps ("1. Create...", "2. Build...")
- Compactions are identified by `acompact` in filename + `<analysis>` tag in content
- Compaction parser extracts "Primary Request" for title, "Pending Tasks" for swarm lesson
- Length, heading count, bullet density, and file path references are all scored
- Content under 500 chars is always skipped
- Dedup via SHA256 content hash — same content never stored twice

---
name: knowledge-atom-extraction
description: Extract and consume typed knowledge atoms (corrections, mental models, findings, decisions, patterns, open questions,
triggers:
  - "knowledge atom"
  - "extract knowledge"
  - "typed knowledge"
  - "KA extraction"
---

## What Are Knowledge Atoms?

Self-contained typed assertions that prevent agent confusion by capturing corrections, mental models, findings, decisions, patterns, workflows, and open questions as first-class searchable objects.

The canonical example: An agent asked "should we hide Beta19 spend columns since they're organic?" — when Beta19 (example.com) receives ALL traffic sources including paid ads, not just organic. The distinction between Beta 19 and Beta 50 is the destination (example.com vs go.example.com), not the traffic source. A correction atom would have prevented this.

## 8 Atom Types

| Type | When to Extract | Signal Phrases |
|------|----------------|----------------|
| correction | Human says agent is wrong | "You're confused", "No, actually", "That's wrong" |
| mental_model | Human explains how a system works | "The way this works is", "Think of it as", "There are two..." |
| finding | Human shares empirical data | "Yesterday we spent X dollars and got", "The data shows" |
| decision | Human states a choice + reasoning | "We decided to", "Let's go with", "The reason we chose" |
| pattern | Human describes recurring behavior | "Every time X happens, Y", "This always means" |
| open_question | Human flags unresolved uncertainty | "I'm not sure yet whether", "We need to figure out" |
| workflow | Natural sequence to realize an objective | "First X, then Y, then Z", "The process is..." |
| gestalt | Pre-composed domain briefing | Created manually or by grouping related atoms |

## Verbatim Quotes

Every atom should capture the exact human words (`verbatimQuote` field) — this is the cleanest signal. The extractor captures these automatically. In agentic-find results, verbatim quotes appear alongside the statement.

## Temporal Awareness

Every atom has an `established` date = the session date when the knowledge was expressed. This is enforced with zero exceptions — anything without dates breaks semantic search.

- Atoms >14 days old: confidence downgraded to "inferred", time-sensitive data flagged
- Batch checkpoints track session age range for quality monitoring

## Consuming Atoms (Reading)

Atoms appear in agent_find results under `KNOWLEDGE ATOMS` section.

Type multipliers: correction=1.15, mental_model=1.10, gestalt=1.10, workflow=1.05, open_question=0.85.

Source weights: default=1.3 (just below intent at 1.4), company=1.0, founder=1.2.

## Proposing Atoms (Writing)

### Single atom:
```bash
alignment-harness store add knowledge-atoms \
  --json '{"type":"correction","statement":"...","domain":["tag1"],"wrongAssumption":"...","whyConfused":"...","verbatimQuote":"exact human words"}'
```

### Batch:
```bash
alignment-harness store add knowledge-atoms \
  --json '{"atoms":[{"type":"finding","statement":"...","domain":["tag1"],"verbatimQuote":"exact human words","established":"2026-03-01"}]}'
```

## Running the Extractor

```bash
# Mine last 5 sessions (multi-channel: atoms + intents)
# Routes through Claude Code CLI → Max subscription (no API key needed)
node agent-swarm-mcp/scripts/extract-knowledge-atoms.js --recent 5

# Dry run (preview only — no API calls to submit)
node agent-swarm-mcp/scripts/extract-knowledge-atoms.js --recent 10 --dry-run

# Specific session
node agent-swarm-mcp/scripts/extract-knowledge-atoms.js --session <UUID>

# Force re-extraction (ignores .extracted-sessions.json state)
node agent-swarm-mcp/scripts/extract-knowledge-atoms.js --recent 20 --force
```

### Multi-Channel Output

The extractor produces two channels per session:
1. **Atoms** → `alignment-harness store add knowledge-atoms`
2. **Intents** → `alignment-harness intent add`

Batch checkpoints every 10 sessions report: signal-to-noise ratio, duplicate rate, type distribution, domain coverage, session age range.

## Extraction Statement Quality Rules

Each atom's statement MUST be:
1. **Self-contained** — readable without conversation context
2. **Typed correctly** — corrections must include wrongAssumption + whyConfused
3. **Domain-tagged** — semantic tags for retrieval (lowercase, hyphenated)
4. **Non-obvious** — skip routine instructions, approvals, small talk
5. **Dated** — `established` field = session date, zero exceptions
6. **Quoted** — `verbatimQuote` captures exact human words when available

## Admin UI

Review proposed atoms with `alignment-harness store list knowledge-atoms`
- Filter by type, status, confidence, domain
- Approve/deprecate/mark wrong
- View verbatim quotes (purple, italic)
- View established dates for temporal context
- View correction chains (what was superseded)
- View gestalt cluster briefings + common mistakes

## Architecture

- **MongoDB**: `knowledgeatoms` collection with KA-#### auto-ID, correction chains, gestalt clusters
- **JSONL dual-write**: `agent-swarm-mcp/logs/agentic-atoms.jsonl` for vector search
- **agentic-find**: Source type `atom` with type multipliers (correction=1.15, workflow=1.05, etc.)
- **Extraction**: Haiku LLM multi-channel classification of human messages from session transcripts
- **Dedup**: SHA-256 hash of statement text, `.extracted-sessions.json` state tracking
- **Temporal**: Session mtime = established date, staleness detection at 14 days

## Key Files

| File | Purpose |
|------|---------|
| `<api-repo>/models/admin/KnowledgeAtom.js` | Mongoose model (8 types, verbatimQuote, text index) |
| `<api-repo>/controllers/admin/knowledgeAtomController.js` | CRUD + agent propose + JSONL dual-write |
| `<api-repo>/routes/admin/knowledgeAtoms.js` | Express routes at `<your-api-base>/knowledge-atoms` |
| `agent-swarm-mcp/mcp-server/agentic-find.js` | searchAtoms() + vector indexing |
| `agent-swarm-mcp/mcp-server/search-profiles.js` | atom source weights per profile |
| `agent-swarm-mcp/scripts/extract-knowledge-atoms.js` | Multi-channel conversation mining script |
| `<frontend-repo>/src/gen4/admin/knowledge-atoms/KnowledgeAtomsAdminPage.jsx` | Admin UI |

## Calibration Protocol

After adding new atoms or adjusting weights, verify against the Beta19 case:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "beta19 spend attribution Silver Grail" --limit 8
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "are beta19 registrations organic or paid" --limit 5
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "should I hide spend columns for Beta19" --limit 5
```

The correction atom must rank #1 or #2 for all queries. Current calibration: atom weight=1.3, correction mult=1.15, threshold=0.30 — all passing.

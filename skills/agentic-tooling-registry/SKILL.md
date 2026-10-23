---
name: agentic-tooling-registry
description: "Query, register, and document agent tools. Use when finding a tool for X or registering endpoints via `alignment-harness store add tool-registry`."
triggers:
  - "agent tools registry"
  - "register tool"
  - "tool registration"
  - "agent tool search"
---

# Agent Tooling Registry — Quick Functions

## Get the answer

| Want to know... | Run this |
|---|---|
| Find tools by keyword | `grep -rilE "{keywords}" "$(alignment-harness records tool-registry)"` |
| Full details on a tool | `alignment-harness store get tool-registry {slug}` |
| List all tools (with filters) | `alignment-harness store list tool-registry --where toolType=function,category=admin,status=approved` |
| Hierarchical tool tree | `alignment-harness store list tool-registry --json` |
| Registry statistics | `ls "$(alignment-harness records tool-registry)" \| wc -l` |
| Single tool by slug | `alignment-harness store get tool-registry {slug}` |

## Do something

| Want to do... | Run this |
|---|---|
| Propose a new tool (agent) | `alignment-harness store add tool-registry --json '{"id":"{slug}","name":"...","description":"...","toolType":"function","category":"admin"}'` |
| Create a tool (admin) | `alignment-harness store add tool-registry --json '{"id":"{slug}","name":"...","description":"...","toolType":"function"}'` |
| Update a tool | `alignment-harness store update tool-registry {slug} --json '{fields to update}'` |
| Approve a tool (certainty=100) | `alignment-harness store update tool-registry {slug} --json '{"certainty":100,"status":"approved"}'` |
| Delete a tool | `rm "$(alignment-harness records tool-registry)/{slug}.json"` |
| Batch approve tools | `for s in a b; do alignment-harness store update tool-registry "$s" --json '{"certainty":100,"status":"approved"}'; done` |
| Batch update status | `for s in a b; do alignment-harness store update tool-registry "$s" --json '{"status":"approved"}'; done` |
| Bulk import skill files | `for f in ~/.claude/skills/*/SKILL.md; do s=$(basename "$(dirname "$f")"); alignment-harness store add tool-registry --json "{\"id\":\"$s\",\"name\":\"$s\",\"toolType\":\"skill\",\"sourceFile\":\"$f\"}"; done` |
| Bulk import MCP tools | `alignment-harness store add tool-registry --json '{"id":"{slug}","name":"...","toolType":"mcp"}'` (one per tool) |
| Bulk import HTTP endpoints | `alignment-harness store add tool-registry --json '{"id":"{slug}","name":"...","toolType":"endpoint"}'` (one per endpoint) |
| Flag an issue with a tool | `alignment-harness store update tool-registry {slug} --json '{"helpRequest":{"message":"..."}}'` |
| Log tool usage | `alignment-harness store update tool-registry {slug} --json '{"lastUsedAt":"..."}'` |
| Resolve a help request | `alignment-harness store update tool-registry {slug} --json '{"helpRequest":{"resolved":true}}'` |

## Auth
Header: none (local files)
Base folder: `alignment-harness records tool-registry`

---

# Agent Tooling Registry

A full-stack admin tool to capture, index, and surface all tooling available to AI agents with semantic search, certainty scoring, and human validation workflow.

## Find Agent Tools

**Trigger: invoke 1–2x per task** with keywords for what you're working on. Don't reinvent — discover existing tools first.

```
🔍 Working on: [modal, scroll, admin]
   Search: grep -rilE "modal|scroll" "$(alignment-harness records tool-registry)"
```

### Agent Usage

| Action | Endpoint |
|--------|----------|
| **Search** | `grep -rilE "{keywords}" "$(alignment-harness records tool-registry)"` |
| **Details** | `alignment-harness store get tool-registry {slug}` |
| **Admin UI** | `alignment-harness records tool-registry` |

### When to Search

- **Starting a task** → search task keywords (e.g., `commit`, `modal`, `validation`)
- **About to create a helper** → search function purpose (e.g., `scroll`, `format`, `parse`)
- **New endpoints added** → search by workflow nouns (e.g., `segment compare`, `cell audit`, `conversion insights`)

---

## Quick Start for Agents

**CRITICAL: Search before creating!** Before implementing any new helper, function, or endpoint:

```bash
# Preferred: runnable from anywhere
grep -ril "commit" "$(alignment-harness records tool-registry)"

# Raw JSON fallback
alignment-harness store list tool-registry --json | grep -i "commit"
```

### Numbered Results Display Convention

When presenting search results to users/agents, format as a numbered list with context:

```
🔍 Found 4 tools matching "commit":

[1] commit
    Skill | git, workflow, staging
    Handle git commits with structured messages and verification checklists

[2] contribute
    Skill | git, upstream, atomic-changes
    Professional contribution workflow for upstream repos with atomic PRs

[3] api-alignment-check
    Skill | api-validation, routing
    Validate API alignment before commits affecting endpoints

[4] ux-assignment-generator
    Skill | verification, code-review
    Generate UX assignments after code changes

💡 Get full info: alignment-harness store get tool-registry {slug} (e.g., alignment-harness store get tool-registry commit)
```

---

## Bulk registering endpoints (recommended)

When new Express endpoints are added and agents can’t find them, use the canonical route→registry sync workflow:

- Skill: `how-to-bulk-register-atomic-tools`
- Implementation: `alignment-harness store add tool-registry`

This keeps the registry and Swagger from drifting and prevents “invisible endpoints”.

---

## Agent Endpoints

Agent endpoints accept EITHER the `alignment-harness store` commands OR the JSON files in `alignment-harness records tool-registry`.

### Search (GET)

```
grep -rilE "{query}" "$(alignment-harness records tool-registry)"

CLI:
alignment-harness store list tool-registry --where toolType=function,category=admin --limit 10
```

Returns: slug, name, description (truncated), certainty, signature, type, status

### Get Full Details (GET)

```
alignment-harness store get tool-registry {slug}

CLI:
alignment-harness store get tool-registry "{slug}"
```

Returns: Complete tool info including parameters, examples, source references

### Propose New Tool (POST)

```
alignment-harness store add tool-registry --json '
{
  "id": "myNewHelper",
  "name": "myNewHelper",
  "description": "What it does and when to use it",
  "toolType": "function",
  "category": "admin",
  "signature": "myNewHelper(param1, options)",
  "parameters": [
    { "name": "param1", "type": "string", "required": true, "description": "..." }
  ],
  "sourceFile": "my-app/src/utils/myHelper.js",
  "repo": "my-app",
  "proposedBy": "claude-agent",
  "triggerPatterns": ["my helper", "do the thing"]
}'
```

Note: Agent proposals are capped at certainty 50. Human approval sets to 100.

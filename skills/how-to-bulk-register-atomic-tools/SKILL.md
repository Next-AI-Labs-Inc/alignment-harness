---
name: how-to-bulk-register-atomic-tools
description: Bulk register API endpoints, functions, and skills as discoverable tools in the agent tooling registry.
triggers:
  - "register tools"
  - "bulk register endpoints"
  - "onboard new api"
  - "tools not in registry"
  - "register all endpoints"
  - "agent can't find endpoint"
  - "bulk import tools"
---

# How to Bulk Register Atomic Tools

## The Problem This Solves

New endpoints/functions/skills get built but never registered in the AgentTool registry. Then agents search for "segment compare" (or "simulate user state") and nothing surfaces, so they either reinvent the wheel or ask a human.

## Prerequisites

- Read `how-to-register-and-describe-agentic-tools` first (required description + tags + discovery loop).
- You need the local `alignment-harness` command (registry folder: `alignment-harness records tool-registry`).
- You need no API key (the registry is local files).

## Fast Path (Preferred): Route → Registry Sync

If you’re registering **Express endpoints** that already have route-level docs (`@route/@desc/@param`), use the `alignment-harness store add tool-registry` command:

```bash
# 1) Dry run (no writes)
grep -rn "@route" <your-routes-folder>

# 2) Import into AgentTool registry (creates/updates as status=proposed)
alignment-harness store add tool-registry --json '{"id":"<slug>","name":"<@route>","description":"<@desc>","toolType":"endpoint","status":"proposed"}'   # one per route

# 3) Verify discoverability via semantic search
grep -rilE "cohort|metrics" "$(alignment-harness records tool-registry)"
```

This is the safest pattern because it’s **idempotent** and prevents drift: route changes get re-synced instead of relying on hand-maintained registry entries.

## Manual Path: Bulk Import Endpoints (API)

If you already have a list of tools in JSON:

```bash
# tools.json: { "tools": [ /* ... */ ], "proposedBy": "bulk-import" }
node -e 'const j=require(process.argv[1]); for (const t of j.tools) console.log(JSON.stringify({ ...t, id: t.id || t.slug, status: "proposed", proposedBy: j.proposedBy }))' "$PWD/tools.json" \
  | while read -r t; do alignment-harness store add tool-registry --json "$t"; done
```

Then approve in batch (human step):

```bash
for s in tool-slug-1 tool-slug-2; do alignment-harness store update tool-registry "$s" --json '{"certainty":100,"status":"approved"}'; done
```

## Discovery Loop (MANDATORY)

After importing, verify natural searches actually surface the tool:

```bash
grep -rilE "segment|compare" "$(alignment-harness records tool-registry)"

grep -rilE "cell|audit|evidence" "$(alignment-harness records tool-registry)"

grep -rilE "conversion|insights" "$(alignment-harness records tool-registry)"
```

If it doesn’t surface:
- Add tags that match how agents search (workflow nouns + natural phrasing)
- Add `triggerPatterns` that match “how a human would ask”
- Rewrite descriptions to include the key terms

## Notes

- Imports create tools as `status=proposed` and cap certainty until approval.
- Registry search is separate from `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"`; if the concept matters broadly, log a swarm memory too.

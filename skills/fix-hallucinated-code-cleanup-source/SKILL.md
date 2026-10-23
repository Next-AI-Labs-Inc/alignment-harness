---
name: fix-hallucinated-code-cleanup-source
description: Identify code changes based on hallucinated intent, trace the source material that caused the hallucination, fix the code, then
---

# Fix Hallucinated Code + Cleanup Source

## When to use
An agent changed code based on something it read that was wrong or outdated. The code change needs to be undone, AND the thing that misled the agent needs to be found and fixed so it never happens again.

## Phase 1: Identify the hallucinated code
Read the commit diff. For each change, ask: does this look like it's reversing something intentional? Signs:
- Commit message says "restore", "revert", "fix regression"
- The diff puts BACK old values that were explicitly removed
- Comments in the old code say "removed", "deprecated", "disabled" — and the agent re-enabled it
- Test expectations changed to match old behavior instead of new behavior

## Phase 2: Predict intent, confirm with admin
For each hallucinated change, state what it looks like the human intentionally did, in plain language. No jargon. No variable names. Describe what the user of the product experiences.

Format: "Looks like you intentionally [what changed in UX terms]. An agent reversed it. Right?"

Do NOT proceed until the admin confirms.

## Phase 3: Fix the code
- Revert the agent's hallucinated commits or manually restore the correct state
- Add `@intent: [slug] — [plain language why]` comments near each restored setting
- Commit with: `fix: restore [what] — agent incorrectly reverted peak coaching settings`

## Phase 4: Trace the source with /hallucination
For each hallucinated change, find the EXACT thing that misled the agent:
- Old TDD test asserting wrong behavior → file:line, test name
- Dead feature flag with misleading name/value → file:line
- Stale comment describing removed feature → file:line
- Wrong intent DB entry → intent ID
- Stale compaction making false assertion → compaction ID
- Misleading variable name → file:line
- CLAUDE.md rule describing old architecture → line number

Search sources:
```bash
# Agent swarm memory
node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "[search term]"

# Intent DB
alignment-harness intent search "[term]"

# Compactions
grep -ril "[term]" "$(alignment-harness records compactions)"
```

## Phase 5: Clean up the source
For each source found:
- **Wrong TDD test**: Update to assert correct behavior, or delete if the test no longer applies
- **Dead feature flag**: Remove entirely. No tombstone. No "set to true to re-enable."
- **Stale comment**: Delete it
- **Wrong intent DB entry**: Report ID to admin for deletion (do NOT delete autonomously)
- **Stale compaction**: Report ID to admin (do NOT delete autonomously)
- **Misleading variable name**: Rename to reflect current truth
- **Wrong CLAUDE.md rule**: Update to reflect current architecture

Commit source cleanup separately: `fix: cleanup hallucination sources — [what was stale]`

## Rules
- Do NOT remove "unused" code — it may be WIP
- Do NOT delete intent DB entries or compactions — report IDs for admin review
- Do NOT change anything unrelated to the hallucination being fixed
- git add ONLY specific files — NEVER git add -A
- Do NOT push
- `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

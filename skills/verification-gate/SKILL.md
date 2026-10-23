---
name: verification-gate
description: Final-pass auditor that verifies every code citation in a research/synthesis answer against actual files BEFORE publishing. Use at the end of any code-grounded research task. Catches the retrieval-augmented confabulation pattern where agents invent specific file/line citations that feel grounded but don't exist.
---

# Verification Gate

## Why this skill exists

The IX agent-tooling-augmentation experiment measured retrieval-augmented agents at **33% citation-fabrication rate** on code-grounded research tasks. The most common failure mode:

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"` (or any retrieval tool) surfaces a REAL institutional fact
2. The agent synthesizes specifics around that fact
3. When the agent doesn't know an exact line number, it INVENTS one that "feels right" given the architectural pattern
4. The fabricated specific gets published with the same confidence as the verified institutional fact
5. Downstream agents and humans treat the fabrication as ground truth

Documented example: an agent claimed `canonicalStripeResolver.js:1396` and `:1491` contained the FUNNEL-4 production bug. The file is 558 lines long. Both line numbers are physically impossible. The agent invented them.

This skill prevents that pattern by auditing every citation against actual files BEFORE the answer is published.

## When to invoke

Run this skill at the END of any task that:
- Produces code citations (file paths + line numbers + descriptions)
- Was driven by retrieval (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`, `mcp__cocoindex-code__search`, `mempalace_search`)
- Is being submitted as a research deliverable, not as an internal scratchpad

Do NOT skip on the assumption "I cited carefully." The fabrication pattern fires SPECIFICALLY when the agent feels confident.

## Protocol

For every claim in your draft answer of the form `FILE:LINE — DESCRIPTION`:

### Step 1 — Existence check
```bash
[ -f "$(git rev-parse --show-toplevel)/$FILE" ] && echo "FILE_EXISTS" || echo "FILE_MISSING"
```

If `FILE_MISSING`:
- Search filesystem: `find "$(git rev-parse --show-toplevel)" -name "$(basename $FILE)" -not -path "*/node_modules/*" 2>/dev/null`
- If alternate location found, update FILE
- If not found anywhere, **DROP the citation**

### Step 2 — Line-number existence check
```bash
file_lines=$(wc -l < "$(git rev-parse --show-toplevel)/$FILE")
[ "$file_lines" -ge "$LINE" ] && echo "LINE_EXISTS" || echo "LINE_BEYOND_FILE_END"
```

If `LINE_BEYOND_FILE_END`:
- This is the most dangerous fabrication pattern (line number exceeds file length)
- Search the file for the described content: `grep -n "<key term from DESCRIPTION>" "$FILE"`
- If found, update LINE to actual location
- If not found, **DROP the citation**

### Step 3 — Description verification
```bash
sed -n "${LINE}p" "$(git rev-parse --show-toplevel)/$FILE"
# Compare output to DESCRIPTION
```

If content does not match DESCRIPTION:
- Search file for a closer match: `grep -n "<key term from DESCRIPTION>" "$FILE"`
- If a clear match found within ±20 lines, update LINE
- If match found at very different line, update LINE
- If no match found in the file, **DROP the citation**

### Step 4 — Apply outcomes
- Content matches at LINE → keep citation as-is
- Content matches at corrected LINE → update LINE in answer
- Content not found anywhere in file → drop citation, mark UNVERIFIED in audit log
- File doesn't exist → drop citation, mark FABRICATED in audit log

## Required output prefix

When the gate completes, prefix your final answer with:

```
VERIFICATION GATE RESULT:
- Total citations: N
- Verified at original location: N
- Corrected (line drift): N
- Dropped (file/line/content not found): N
- FABRICATIONS CAUGHT: {Y/N — list each if Y}
```

Then publish ONLY citations that survived the gate.

## What this skill is NOT

- **Not a content audit.** It does not check whether the description's *interpretation* of the code is correct, only that the cited location physically exists and contains the described entity.
- **Not a security audit.** It does not assess whether the cited code has bugs.
- **Not a substitute for running the code.** Reading line content is not the same as executing it. For runtime-behavior claims, the answer needs a separate verification step (curl, test runner, DB query).

## Cost expectation

For a typical research answer with 10-15 citations:
- Tokens: +5,000 to +10,000 (one Read or grep per citation)
- Time: +30s to +90s
- Hallucination rate impact (predicted): drop from 33% to <5%

The token overhead is small relative to the answer's existing token cost; the truthfulness gain is large.

## Failure modes of the gate itself

- The gate checks line existence, not semantic correctness. An agent could still cite the wrong file with the right description.
- The gate doesn't verify that the description's CLAIMED BEHAVIOR matches actual code logic — only that the cited entity is at the cited location.
- For `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"` claims that point to compaction/intent-DB records (not code), the gate doesn't apply directly — those need a separate corpus-validity check.

## When to evolve this skill

If A5 measurement shows the gate is insufficient (hallucination drops <50% rather than <85%), the protocol needs:
- Description-content match scoring (regex-based ranking of how closely the cited line matches the description)
- Corpus-citation handling for non-code claims
- Cross-file consistency check (if the same entity is cited in multiple places, do they agree)

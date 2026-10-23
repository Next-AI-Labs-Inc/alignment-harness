---
name: how-to-write-meta-analysis-docs
description: Create and store meta-analysis documents — deep audits, conversation mining reports, state audits, and architectural investigations
triggers:
  - "save analysis"
  - "meta-analysis"
  - "write audit"
  - "save research"
  - "conversation mining"
  - "document findings"
  - "state audit"
  - "research finding"
  - "log hypothesis"
  - "track verdict"
  - "decision audit"
---

# How to Write Meta-Analysis Docs

## Canonical Location

```
docs/meta-analysis/
```

This is the ONLY location for meta-analysis documents. Not `self/docs/`, not `<frontend-repo>/docs/`, not memory files. Always `docs/meta-analysis/`.

If the `docs/meta-analysis/` folder does not exist, create it.

---

## Filename Format (EXACT)

```
{YYYY-MM-DD}_{subject}_{method}_{trigger}.md
```

| Segment | Format | Examples |
|---------|--------|----------|
| **date** | `YYYY-MM-DD` | `2026-02-06` |
| **subject** | `kebab-case`, the system/feature analyzed | `user-simulator`, `login-flow`, `access-tiers` |
| **method** | `kebab-case`, how the analysis was done | `conversation-mining`, `state-audit`, `code-tracing`, `failure-analysis` |
| **trigger** | `kebab-case`, why it was created | `skill-creation`, `bug-investigation`, `design-review`, `incident-response` |

### Real Examples

```
2026-02-06_user-simulator_conversation-mining_skill-creation.md
2026-02-06_new-user-state-audit.md
2026-02-07_login-flow_code-tracing_redirect-bug.md
2026-02-10_access-tiers_failure-analysis_incident-response.md
```

### Naming Rules

- All segments joined by `_` (underscore)
- Within each segment, words joined by `-` (hyphen)
- Date always first
- Subject always second
- Method and trigger can be combined if the filename would be too long: `{date}_{subject}_{combined-context}.md`
- Keep filenames under 80 characters

---

## Document Structure (EXACT)

Every meta-analysis MUST follow this template:

```markdown
# {Title} — {Subtitle}

**Date:** YYYY-MM-DD
**Tags:** comma, separated, keywords
**Context:** One sentence explaining what triggered this analysis
**When Invoked:** When should future agents read this document?

---

## EXECUTIVE SUMMARY

2-3 sentences. What was found. Why it matters.

---

## {Numbered sections with findings}

### Each section should:
- State what was investigated
- Show what was found (with code references, quotes, or evidence)
- State the conclusion or resolved intent

---

## ANTI-PATTERNS / LESSONS LEARNED

What went wrong. What to avoid. Table format preferred.

---

**End of Analysis**
**Source:** {where the data came from}
**Files analyzed:** {count or list}
```

### Required Header Fields

| Field | Required | Purpose |
|-------|----------|---------|
| **Date** | Yes | When the analysis was performed |
| **Tags** | Yes | Keywords for searchability |
| **Context** | Yes | What triggered this analysis (one sentence) |
| **When Invoked** | Yes | Tells future agents WHEN to read this doc |

---

## When to Create a Meta-Analysis

Create one when you:

1. **Mine conversation logs** — Extract user directives, design decisions, frustrations from Claude Code history
2. **Audit system state** — Trace what code ACTUALLY does vs what it's SUPPOSED to do (like the new-user-state-audit)
3. **Investigate a failure** — Root-cause analysis after something broke
4. **Research for skill creation** — Deep dive before writing a skill file
5. **Architectural review** — Map data flow, dependencies, or integration points

Do NOT create one for:
- Simple bug fixes (use system logs)
- Feature requests (use proposals)
- Quick notes (use swarm memories)

---

## After Creating: OPTIONAL — Add Swarm Index Entries

**CRITICAL: The full document is the source of truth. NEVER reduce, summarize, or strip detail from the meta-analysis itself.** The document should contain the COMPLETE analysis with all nuance, code references, edge cases, and reasoning. Length is a feature, not a bug — these are deep audits, not summaries.

Optionally, after writing the full doc, you can create lightweight INDEX ENTRIES in the agent swarm so agents can DISCOVER the document exists. These entries are ADDITIVE pointers — they do NOT replace the full doc.

1. **Add 2-5 swarm memory index entries** pointing to the full doc:
   - `context`: "When an agent needs to understand {specific topic covered in the doc}"
   - `lesson`: "See full analysis at: docs/meta-analysis/{filename}.md — section '{section name}' covers {brief pointer}"
   - `tags`: Relevant keywords
   - `event_type`: `intent`, `pattern`, or `error`
2. **Optionally register as an agent tool** for discoverability:
   ```bash
   alignment-harness store add tool-registry \
     --json '{"name": "...", "description": "...", "toolType": "utility", "category": "admin"}'
   ```
3. **Every index entry MUST reference the full doc path** so agents always drill into the complete analysis

The goal is discoverability, NOT reduction. An agent searching "vision payment flow bugs" should find a pointer that leads them to the full 400-line document — not a 3-sentence summary that strips all the nuance out.

---

## Final Step: Add Swarm Link to Full Document

After creating the meta-analysis and breaking into modular sections, **always add a single swarm memory linking to the full document path**:

```bash
# Add swarm memory pointing to the full document
alignment-harness store add memories --json '{...}' with:
  context: "When an agent needs the full {subject} meta-analysis document"
  lesson: "Full meta-analysis available at: docs/meta-analysis/{filename}.md — covers {brief summary}"
  tags: ["meta-analysis", "{subject}", "documentation"]
  event_type: "pattern"
```

This ensures agents can discover the full document even when searching for specific topics.

---

## Research Findings DB — Structured Alternative

For findings that need structured tracking (confidence scores, verdicts, measurements over time, linked decisions), use the **Research Findings DB** instead of or in addition to a markdown doc:

```bash
# Search existing findings before creating a new one
alignment-harness store list findings

# Create a structured finding
alignment-harness store add findings \
  --json '{"title":"...","researchType":"metric-analysis","hypothesis":"...","findings":"...","verdict":"confirmed","confidence":85}'
```

- **Admin UI**: `alignment-harness records findings`
- **When to use markdown**: Deep narrative audits, architectural investigations, conversation mining (length is a feature)
- **When to use Research Findings DB**: Hypothesis tracking with verdicts, time-series measurements, decision audit trails, anything agents need to query programmatically
- **Both**: For major analyses, create the markdown doc AND a Research Findings DB entry that links to it

## Cross-References

- Agent tools via `alignment-harness store add tool-registry` (see `agentic-tooling-registry` skill)
- Swarm memories logged via `alignment-harness store add memories`
- Skill files at `~/.claude/skills/{skill-name}/SKILL.md`
- Research Findings DB: `alignment-harness store list findings` (agentic-optimized), admin UI at `alignment-harness records findings`

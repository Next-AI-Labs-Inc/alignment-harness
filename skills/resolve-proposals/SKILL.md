---
name: resolve-proposals
description: Fix approved proposals and close the loop — claim, fix, commit with Resolves-Proposal tags, mark implemented. U
triggers:
  - "fix proposals"
  - "resolve proposals"
  - "implement approved proposals"
  - "resolve proposal"
  - "mark this proposal done"
  - "this proposal has been addressed"
---

# Resolve Proposals

This skill ensures every proposal fix creates a traceable commit-to-proposal link. Without this, proposals rot in the queue even after the code is fixed.

## The Full Loop

```
Proposal created → Approved → Claimed → Code fixed → Committed with tag → Hook marks implemented
                                                         ↑ YOU ARE HERE
```

## API Setup

```bash
alignment-harness records proposals
```

## Step 1: Claim Each Proposal

Before starting work, claim so other agents don't duplicate effort:

```bash
alignment-harness proposal update <PROPOSAL_ID> --status in-progress \
  --json '{"agentId": "claude-opus"}'
```

## Step 2: Read Code Before Changing It

**MANDATORY**: Read every file you will modify. Never assume what code does. The proposal may describe a problem that was already fixed — if so, skip to Step 5 (mark implemented without code changes).

Check the proposal's `targetFiles` array for which files to read.

## Step 3: Make the Fix

Follow all CLAUDE.md rules. Key ones for proposal fixes:
- NEVER leave catch blocks empty
- NEVER use `res.json()` without `return`
- NEVER bare-destructure context hooks
- Code defensively: fail-OPEN (default MAX_ACCESS on error)
- NEVER name variables with bare ambiguous words — qualify with domain context

## Step 4: Commit with Resolves-Proposal Tags (CRITICAL)

This is the step that closes the loop. The `Resolves-Proposal:` tag is what the post-commit hook parses to auto-mark proposals as implemented.

**Commit per repo** (don't cross repos in one commit):

```bash
cd <repo>
git add <only-your-changed-files>
git commit -m "$(cat <<'EOF'
fix(scope): <what the user now experiences differently>

<1-2 sentence description of what changed and why>

Resolves-Proposal: <full-proposal-id>
Resolves-Proposal: <full-proposal-id-2>

Tags: <relevant tags>, Priority:<x>/10
Files: <changed files>
EOF
)"
```

**Rules:**
- One `Resolves-Proposal:` line per proposal ID (full id as `alignment-harness proposal list` prints it)
- Group proposals into single-responsibility commits — one commit per concern, not one per proposal
- If two proposals touch the same file for the same reason, one commit resolves both
- Do NOT push — only commit locally

### Example

```bash
git commit -m "$(cat <<'EOF'
fix(coaching): users now see error feedback when coaching reply fails or hits usage limit

Previously, catch blocks in CoachingSessionHelper silently swallowed errors —
users saw a frozen UI with no feedback. Now shows error message via
setErrorNoResponseFromAiMessage in all coaching error paths.

Resolves-Proposal: 6a00000000000000000000a1
Resolves-Proposal: 6a00000000000000000000a2

Tags: User Facing, Coaching Quality, Priority:9/10
Files: <frontend-repo>/src/components/helpers/CoachingSessionHelper.js
EOF
)"
```

## Step 5: Mark Implemented (if hook unavailable)

If the post-commit hook is not yet active, manually mark implemented:

```bash
COMMIT_HASH=$(git rev-parse HEAD)
alignment-harness proposal update <PROPOSAL_ID> --status implemented \
  --json "{\"agentId\": \"claude-opus\", \"commitHash\": \"$COMMIT_HASH\"}"
```

## Step 6: Report What Happened

Print a summary table:

```
| Proposal | Status | Commit |
|----------|--------|--------|
| 44cc14 - CoachingSessionHelper swallows errors | FIXED | abc1234 |
| 44cc1c - PremiumFeatureGate fail-closed | ALREADY RESOLVED | skipped |
```

Include "ALREADY RESOLVED" for proposals where the code was already fixed — this is valuable signal that the proposal queue has drift.

## Step 7: Propagate Resolution

MongoDB is only ONE of the surfaces where proposals live. If you stop at Step 5, the proposal still shows as unresolved in Obsidian, tracking.json, and agent_find results. Complete ALL applicable steps below.

### 7a. Update Obsidian Vault REPORT.md

If the proposal has a `run_id` (pipeline proposals like LP-004), update the frontmatter in the corresponding REPORT.md:

```bash
# Path: <api-repo>/docs/intent/experiments/process-actionables/runs/{run_id}/REPORT.md
```

Update the YAML frontmatter:
```yaml
status: resolved
resolved_date: YYYY-MM-DD
resolved_by: agent
resolution_commit: {commit hash from Step 4}
resolution_notes: {one sentence — what was fixed}
```

### 7b. Update tracking.json

If the proposal came from the process-actionables pipeline, update the run entry in:

```bash
# Path: <api-repo>/docs/intent/experiments/process-actionables/tracking.json
```

Set the run's status to `"resolved"` and add `resolved_date` and `resolution_commit`.

### 7c. Append Resolution Section to REPORT.md

Add a `## Resolution` section at the bottom of the REPORT.md so agent_find indexes the resolution when it rebuilds from vault files:

```markdown
## Resolution

- **Status**: Resolved
- **Date**: YYYY-MM-DD
- **Commit**: {commit hash}
- **What changed**: {one sentence — the UX-level fix}
```

### 7d. Open in Obsidian

So the user sees the updated status (if the person has an Obsidian vault; otherwise print the path):

```bash
open "obsidian://open?vault=<their vault name>&file=experiments/process-actionables/runs/{run-id}/REPORT&newtab=true"
```

## When a Proposal is Already Resolved

If you read the code and the problem described in the proposal is already fixed:

1. Do NOT make any code changes
2. Still mark the proposal as implemented (Step 5) — this closes it in the queue
3. **Still propagate the resolution (Step 7)** — if the proposal has vault files, update their status so all surfaces reflect reality
4. Note "ALREADY RESOLVED" in your summary
5. This is expected — code evolves faster than the proposal queue

## Anti-Patterns

- **NEVER skip the commit tag** — "I'll add it later" means it never happens
- **NEVER commit without reading the code first** — proposals go stale, you'll commit a fix for a non-problem
- **NEVER bundle unrelated proposals into one commit** — defeats single-responsibility and makes revert impossible
- **NEVER push** — only commit locally, the human decides when to push

## Known Limitations

- **Session compactions are frozen** — they cannot be updated after creation. Resolution context is indexed via the REPORT.md `## Resolution` section instead.
- **Intent DB entries are not automatically resolved** — if the proposal links to Intent DB items, resolving those is a separate manual step (use `/intent-db` skill).
- **Unified resolution API planned** — a unified resolution endpoint will replace manual propagation (Steps 7a-7d) when built. See `seeds/unified-proposal-resolution-plan.md` for the plan.

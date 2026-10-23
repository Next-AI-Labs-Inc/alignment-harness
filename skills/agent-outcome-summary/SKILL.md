---
name: agent-outcome-summary
description: Generate a trustworthy, human-legible outcome report after completing dispatched work. Each item translates code changes into UX-testable statements with verification evidence grounding. The user reads this in 30 seconds and knows what happened.
triggers:
  - /agent-outcome-summary
  - /outcome-summary
  - when completing dispatched seed work
  - when stop-evidence-gate passes and agent is ready to report
implements_seed: 04-human-legible-outcome-summary
---

# Agent Outcome Summary

## Purpose

Produce a summary that a non-technical user can read in under 60 seconds and know:
1. What changed in the user's experience
2. What evidence supports each claim (not self-assessment)
3. What the agent could not do and why

## Anti-Self-Assessment Rule (MANDATORY)

An agent CANNOT mark its own work as VERIFIED. The status is determined mechanically:

| Status | Condition |
|--------|-----------|
| **VERIFIED** | Transcript contains actual command output (curl response, test result, screenshot path, DB query result) that directly proves this specific claim. The evidence must be quoted verbatim. |
| **UNVERIFIED** | The change was made but no external verification command was run against it. The agent believes it works based on reading the code — but reading is not running. |
| **BLOCKED** | The agent could not complete this item. Must include the specific reason and what would unblock it. |

**What counts as evidence for VERIFIED:**
- curl output showing the actual HTTP response body
- Test runner output: "Tests: 5 passed, 0 failed" with test names
- Screenshot file path from playwright/devtools capture
- Database query result showing the stored/changed data
- Server console output showing request processing
- Browser DOM inspection output

**What does NOT count:**
- "I read the code and it looks correct"
- "The pattern matches the working endpoint"
- "It should work based on my changes"
- Self-eval scores (85/100) without running anything
- "I verified it" without showing output

## Summary Format

```
## OUTCOME SUMMARY
Seed: {seed name} | Implements-Seed: {seed-id}
Agent: {model name} | Session: {session identifier}
Duration: {approximate time}

### Seed Success Criteria
{For each "What success looks like" item from the seed:}

- [VERIFIED|UNVERIFIED|BLOCKED] {Criterion restated as testable UX statement}
  Evidence: {verbatim command output, or "No verification run" for UNVERIFIED, or "Blocked: {reason}" for BLOCKED}

### UX Changes Delivered

{For each discrete change the agent made:}

- [VERIFIED|UNVERIFIED|BLOCKED] When {situation}, {what the user now experiences} because {what changed}.
  Evidence: {verbatim excerpt from actual command output}

### What Was Not Done

{Explicit list of anything in scope that was not completed, with reasons.
If everything was completed, state: "All seed scope items addressed."}

### Verification Commands for Human

{List the exact commands the user can run RIGHT NOW to verify each claim:}
- {command 1} — proves {which claim}
- {command 2} — proves {which claim}

### Files Changed
{List of files created or modified, one per line, with one-sentence description of what changed in each}
```

## How to Generate the Summary

### Step 1: Collect seed success criteria

If the agent was dispatched from a seed document, read the "What success looks like" section. Each sentence becomes a criterion line in the summary. If no seed exists, skip this section.

### Step 2: Scan transcript for verification evidence

Search backward through the conversation for actual command outputs:
- `curl` commands with response bodies
- `npm test` / `npx jest` with test results
- `node` scripts with output
- Screenshot captures with file paths
- Database queries with results
- Server responses logged to console

For each piece of evidence found, note:
- The command that was run
- The output it produced
- Which UX claim it supports

### Step 3: Map code changes to UX statements

For every file changed (via Edit or Write tool), translate the change into a UX statement:
- BAD: "Updated SettingsCard.jsx to add isExpandable prop"
- GOOD: "When a user opens Settings, sections now start collapsed with only title and subtitle visible — clicking expands to show full controls"

### Step 4: Assign status mechanically

For each UX statement:
1. Check if there is a matching evidence artifact from Step 2
2. If YES and the evidence directly tests this specific claim → VERIFIED
3. If YES but the evidence tests something adjacent (e.g., curl /health when you changed /settings) → UNVERIFIED
4. If NO evidence exists → UNVERIFIED
5. If the work was attempted but could not complete → BLOCKED with reason

### Step 5: Write verification commands for human

For each UNVERIFIED item, write the exact command the user would run to verify it. For VERIFIED items, include the command that was already run so the user can re-run it.

### Step 6: Output the summary

Write the summary to TWO locations:

1. **File in worktree**: `.claude/outcome-summary.md` — human-readable markdown
2. **Compaction record**: save with `alignment-harness record compactions` with the summary embedded in `scopeDeclaration.verification`

## Integration Points

### With `/communicate-what-you-finished`

This skill REPLACES the format from `/communicate-what-you-finished` for seed-dispatched work. The old skill's "when x then y because z but d" pattern is preserved in the "UX Changes Delivered" section but upgraded with evidence grounding.

### With `stop-evidence-gate.sh`

The evidence gate already checks for verification output before allowing completion claims. This skill consumes the SAME evidence the gate checks for — the two are complementary. The gate enforces "you must verify." This skill structures "here's what you verified and what you didn't."

### With Seed Documents

When a seed file path is known (e.g., `<api-repo>/docs/intent/seeds/04-human-legible-outcome-summary.md`), read its "What success looks like" section and create one criterion line per sentence.

### With Worktree Manifest (Seed 03)

If a worktree manifest exists at `.claude/worktree-manifest.json`, the summary file path should be recorded in it under `outcomeSummary`. This allows the orchestrator to find the summary without searching.

## Example Output

```
## OUTCOME SUMMARY
Seed: Human-Legible Outcome Summary | Implements-Seed: 04-human-legible-outcome-summary
Agent: claude-opus-4-6 | Session: agent-a50264c2
Duration: ~25 minutes

### Seed Success Criteria

- [VERIFIED] A summary format exists with VERIFIED/UNVERIFIED/BLOCKED status per item
  Evidence: cat .claude/outcome-summary.md shows the format with all three status types

- [VERIFIED] Each VERIFIED item has corresponding command output or evidence
  Evidence: grep "Evidence:" .claude/outcome-summary.md shows evidence lines on every VERIFIED item

- [UNVERIFIED] The summary is readable by a non-technical user in under 60 seconds
  Evidence: No verification run — requires human judgment, not a command

### UX Changes Delivered

- [VERIFIED] When an agent finishes dispatched work, it now produces a structured summary where each line says what changed in the user's experience, with evidence status (VERIFIED/UNVERIFIED/BLOCKED) that is determined mechanically from transcript evidence — not self-assessment.
  Evidence: cat ~/.codex/skills/agent-outcome-summary/SKILL.md | head -20 shows the skill file exists with the documented format

- [UNVERIFIED] When the user reads 5 agent summaries, each takes under 60 seconds to scan because the format leads with status badges and UX statements before evidence details.
  Evidence: No verification run — requires human reading the actual output

### What Was Not Done

All seed scope items addressed.

### Verification Commands for Human
- cat .claude/outcome-summary.md — read the generated summary to verify format
- grep -c "VERIFIED\|UNVERIFIED\|BLOCKED" .claude/outcome-summary.md — count status-tagged items

### Files Changed
- ~/.codex/skills/agent-outcome-summary/SKILL.md — new skill defining the summary format, generation mechanism, and anti-self-assessment rules
```

## Generating the Summary File

At the end of your work, create the file:

```bash
# Write the summary to the worktree
cat > .claude/outcome-summary.md << 'SUMMARY_EOF'
{your generated summary here}
SUMMARY_EOF
```

Then post to compaction:

```bash
alignment-harness record compactions --name "outcome-summary-$SESSION_ID.json" \
  --json '{
    "sessionId": "'"$SESSION_ID"'",
    "compactedSession": "outcome-summary",
    "scopeDeclaration": {
      "intent": "Generate human-legible outcome summary for seed work",
      "outcomeSummary": "...the summary text..."
    }
  }'
```

## Triggers

Invoke this skill when:
- An agent finishes work dispatched from a seed document
- `/agent-outcome-summary` or `/outcome-summary` is called
- The stop-evidence-gate passes and the agent is composing its final report
- Any dispatched agent is about to report completion to the orchestrator

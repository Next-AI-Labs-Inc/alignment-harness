---
name: discoverability-audit-learnings-findable-by-agents
description: Audit whether tools, skills, and workflows you created are actually findable by future agents — and fix gaps before they become i
triggers:
  - "discoverability audit"
  - "will agents find this"
  - "is this discoverable"
  - "register tools"
  - "agent findability"
---

# Discoverability Audit — Making Work Findable by Agents

## When to Use

After creating new MCP tools, skills, endpoints, or workflows — before closing a session. The question: "Will a future agent working on a related problem actually find what I just built?" If the answer is no, the work is invisible and will be duplicated or missed.

## The 5 Discovery Surfaces

Future agents find tools through these surfaces, in order of reliability:

| # | Surface | How It Works | Check Command |
|---|---------|-------------|---------------|
| 1 | **MCP `list_tools`** | Auto-listed if agent has the MCP server attached | Automatic — no action needed |
| 2 | **Skill file triggers** | Matched against user input keywords in `triggers:` frontmatter | Check `~/.claude/skills/{name}/SKILL.md` has `triggers:` array |
| 3 | **Agent tooling registry** | Local record-store registry, searchable by slug/tags/category, human-auditable via `alignment-harness store list agent-tools` | `alignment-harness store get agent-tools {slug}` |
| 4 | **`agent_find` swarm search** | Semantic search across artifacts, intents, sessions | `node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "query"` |
| 5 | **Registry semantic search endpoint** | Token-conscious semantic search on the tool registry | `node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "..." --sources record` |

## Audit Procedure

### Step 1: Check MCP auto-listing

If your tool is in an MCP server's `TOOLS` array, any agent with that server attached will see it.

**Gap**: Agents WITHOUT the MCP server attached will never find it.

### Step 2: Check skill file triggers

```bash
# Verify skill file exists and has triggers
cat ~/.claude/skills/{skill-name}/SKILL.md | head -20
```

Look for the `triggers:` array in YAML frontmatter. If missing, agents won't match on keyword input.

### Step 3: Check agent tooling registry

```bash
# Search by slug
alignment-harness store get agent-tools {tool-slug}
```

If it returns `no agent-tools record`, the tool is missing.
If it returns `status: proposed` with `certaintyScore <= 50`, it exists but hasn't been human-approved.

### Step 4: Check registry semantic search endpoint

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "segment compare" --sources record
```

### Step 5: Check agent_find

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" \
  "your tool's purpose described naturally" --limit 5
```

**Codex gotcha:** if MCP `agent_find` fails with `Transport closed`, you usually can’t repair that pipe mid-session. Use the CLI fallback for this session, then restart Codex later to restore MCP tool transport.

## Fix Patterns

### Fix: Endpoint exists but is not discoverable

**Canonical solution:** generate + sync endpoint tools from Express route files.

```bash
# Dry run (no DB writes)
cd <your-api-repo> && npm run agent-tools:sync-endpoints:dry

# Write to AgentTool registry (creates/updates tools as status=proposed)
cd <your-api-repo> && \
  DEVELOPER_API_KEY=... npm run agent-tools:sync-endpoints
```

Then verify discoverability:

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "cohort metrics" --sources record
```

### Fix: Tool missing from agent tooling registry (manual)

Register via API, then approve:

```bash
alignment-harness store add agent-tools --json '{
    "id": "example-tool",
    "slug": "example-tool",
    "name": "Example Tool",
    "description": "What it does. Scope: workflow. When to use.",
    "toolType": "endpoint",
    "category": "analytics",
    "tags": ["endpoint","forecasting-workbench"],
    "signature": "GET /api/admin/tools/...",
    "repo": "your-repo"
  }'

alignment-harness store update agent-tools example-tool --json '{"status":"approved"}'
```

### Fix: Skill file missing triggers

Add YAML frontmatter with trigger keywords:

```yaml
---
name: your-skill-name
description: Audit whether tools, skills, and workflows you created are actually findable by future agents — and fix gaps before they become i
triggers:
  - "keyword phrase 1"
  - "keyword phrase 2"
---
```

## Validation Checklist

After fixes, verify each surface:

- [ ] `alignment-harness store get agent-tools {slug}` returns a tool object
- [ ] `node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "..." --sources record` returns it for natural queries
- [ ] Skill file has `triggers:` array with 3-5 keyword phrases
- [ ] `agent_find "natural description"` returns relevant results (or CLI fallback works)

## Step 6: Cross-reference into related skill files

After ensuring a tool is findable via the 5 surfaces, check whether it should be referenced in OTHER skill files that represent related workflows. For example, a new testing tool should be cited in all testing-adjacent skills.

**Procedure:**
1. `grep -rl "keyword1\|keyword2" ~/.claude/skills/*/SKILL.md` to find related skills
2. For each related skill, add a short section at the end: tool name, when to use it in that workflow, MCP call or CLI command
3. Keep it to 3-5 lines — enough for an agent to know the tool exists and how to call it

**Why:** Agents load one skill at a time. If a testing skill doesn't mention the UX Testing Learnings DB, the agent will never search it even though it's exactly what they need. Cross-references close this gap.

## Step 7: Predictive Admin Signal — Will the Human See This?

After ensuring agents can find the work, ask the harder question: **Will the admin see the highest-signal output from this work without having to go looking for it?**

Agents finding tools is one layer. The human admin seeing what needs their attention — predictively, based on the data — is the other. If 130 proposed intents sit in the Intent DB and nobody reviews them, the work is invisible to the decision-maker.

### Questions to ask yourself:

1. **What data source now holds signal that needs human review?** — Identify every DB collection, admin page, or status queue that your work populated (e.g., proposed intents, pending proposals, unverified UX assignments).

2. **Does the admin have to remember to check that page, or will the system surface it?** — If the answer is "they have to remember," the signal will rot. There are 50+ admin pages — nobody checks them all.

3. **Can priority be computed from the data itself?** — Most admin data has: a timestamp (staleness), a status (pending/proposed/overdue), and either a leverage score or a parent entity with one. Priority = `urgency(staleness) × impact(leverage) × decay_rate`. If you can compute it, you can rank it.

4. **What's the cost of the admin NOT seeing this signal?** — Proposed intents unreviewed = agents can't use them as approved contracts = intent drift compounds. Overdue maintenance = silent degradation. Pending UX assignments = shipped code never human-verified. State the cost explicitly.

5. **What form factor reaches the admin without them pulling?** — A new page they must remember to visit is pull-based and will be forgotten. The signal needs to be on the default admin landing surface, or pushed via notification/badge/digest.

6. **Is this signal already surfaced somewhere?** — Check your actionables page, your action items page, and the admin page organizer. If no existing surface covers it, flag the gap.

### What to do with the answers:

- If the signal is NOT surfaced anywhere: propose a **Predictive Admin Signal Feed** — one endpoint that cross-references admin data sources (Intent DB, File Registry, Agent Proposals, UX Assignments, Maintenance Intents, Staged Releases) and returns the top N signals ranked by computed priority. Each signal = `{ message, link, priority, source, decay }`. One React component renders them as cards on the admin landing page.

- If the signal IS surfaced but buried: propose adding a badge count or priority indicator to the admin page organizer entry, so the Cmd+K search shows "Intent DB (130 pending)" instead of just "Intent DB."

- If the signal is time-sensitive: propose a notification or Slack alert that fires when the threshold is crossed (e.g., "5 leverage-100 files dropped below 50% intent coverage").

### Principle:

**Agent discoverability is about machines finding tools. Admin discoverability is about humans seeing signal. Both layers must work or the work is invisible to someone.**

## Audit Registry — Preventing Duplicate Work

Before auditing any artifact, check `audit-registry.json` (same directory as this skill file) to see if it's already been audited. After auditing, add an entry.

```bash
# Read the registry
cat "${CLAUDE_PLUGIN_ROOT}/skills/discoverability-audit-learnings-findable-by-agents/audit-registry.json" | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); j.audited.forEach(a => console.log(a.slug, '|', a.status, '|', a.auditDate))"
```

Registry fields per artifact: `slug`, `type` (skill|endpoint|mcp-tool|admin-ui|utility|mcp-server), `auditDate`, `surfaces` (status per discovery surface), `status` (complete|gaps-found|needs-reaudit), `notes`.

**After auditing**: update the registry JSON with your findings. Future agents read this first to skip already-audited work.

## Known Gaps (Mar 2026)

1. **Registry and swarm are separate indexes** — registering in the AgentTool registry does NOT automatically make it findable via swarm semantic search; log a memory if the concept matters beyond one repo.
2. **Category enum is closed** — only `admin`, `user-facing`, `internal`, `debugging`, `analytics`, `ai`, `auth`, `data`, `ui`. Use the closest match.
3. **MCP tool transport can close mid-session** — use CLI fallback for `agent_find` and restart later.
4. **No predictive admin signal feed exists yet** — admin must manually poll 50+ pages. The actionables page only covers human communications. No surface aggregates agent-generated signal (proposed intents, coverage gaps, pending proposals) into a priority-ranked feed.

## Learnings: Skill File Quality as a Discoverability Problem (Mar 2026)

A tool being "findable" is worthless if the skill file that teaches agents HOW to use it propagates hallucination. These learnings come from the Coaching Principles Library extraction pipeline and apply to ALL skill files.

### Learning 1: Field-Contract Hallucination — GOOD examples override definitions

**What happened**: Every extraction agent (Haiku, Sonnet, Opus) produced directive scripts in the `coachingApplication` field ("Hold attention in the body. When the person says X, redirect: 'Where do you feel that?'"). The definition said "tends to" language. But the GOOD example said "redirect:" with quoted scripts. Agents pattern-matched the example, not the definition.

**Root cause**: GOOD examples in skill files are the highest-risk place for hallucination to live and propagate. Agents weight examples over definitions when they conflict.

**Fix**: Every GOOD example in a skill file MUST pass the SAME governing test as the definition it illustrates. If the definition says "option-awareness, not directives," the example must demonstrate option-awareness, not directives. Audit your examples with the same rigor as your definitions.

**Cross-reference**: `~/.claude/skills/extract-coaching-principle/SKILL.md`, `~/.claude/skills/hallucination/SKILL.md` (Field-Contract Hallucination section)

### Learning 2: coachingApplication contract — option-awareness not directives

The `coachingApplication` field must expand the coach's awareness of OPTIONS. Never restrict. Never direct. Never script. Never if/then. Test: "Does this ADD to the coach's awareness of available options, or does it REMOVE their ability to respond to the actual person?" Anything that implies the principle is the only consideration causes MORE harm than good.

### Learning 3: evidenceStatus freetext blob anti-pattern

Merging attribution ("Tara Brach developed this") with empirical findings ("Holzel 2011 RCT found...") into one blob corrupts evidence evaluation. Agents treat everything in a merged blob as equivalent evidence. Fix: structured `sources` array with type enum (`attribution | empirical | practitioner-consensus | lineage`). Key distinction: attribution is NOT evidence. "Tara Brach wrote this" says nothing about whether the mechanism works.

### Learning 4: principleCore — separate fields for separate consumers

The `principle` field serves the human auditor: full context, lineage, attribution, inline citations. But when injected into an AI coach's memory, attribution noise ("adapted from Tara Brach's RAIN practice, 'Radical Compassion' 2019, Viking") degrades signal. New `principleCore` field = clean mechanism statement for AI injection, zero attribution noise. Different consumers with opposite needs cannot share the same field.

### Learning 5: Decomposition is mandatory for multi-step methods

RAIN has 4 steps. Extracted as one principle, the AI tries to walk users through all 4 at once — wrong for 90% of sessions where only 1-2 steps are relevant. Every multi-step method MUST become: 1 meta-principle + N constituent principles linked via `constituentPrincipleIds`/`parentPrincipleId`. Trigger conditions differ per step — bundling makes trigger statements unusable. Applies to: RAIN, The Work, IFS cycles, EMDR phases, any practice described as "first X, then Y, then Z."

### Learning 6: Sonnet validation gate before scaling Haiku

224 raw Haiku-extracted principles sit unreviewed. Haiku consistently produces directive coachingApplications and merged evidence blobs. All Haiku extractions must pass Sonnet validation before entering verified status. Sonnet reads the hallucination skill before composing — this is the anti-directive gate.

## Section 8: Bulk Skill Onboarding Pipeline (External GitHub Skills)

When adding skills from external GitHub repos at scale (10+ skills), the single-agent approach overflows context. Use the Opus→Sonnet pipeline.

### The Pattern

```
GitHub Repos (N)
    ↓  [parallel Opus agents — one per repo]
Structured JSON per skill (skillName, description, triggers, content, chains)
    ↓  [Sonnet agents — one per skill]
SKILL.md files created at ~/.claude/skills/{skillName}/SKILL.md
    ↓  [domain router skills — one per domain]
CLAUDE.md routing entries (domain-level only, never individual skills)
    ↓  [skill-source registry]
detect-unadded.js automation — repeats until all added
```

### Roles

| Agent | Model | Input | Output |
|-------|-------|-------|--------|
| Evaluator | Opus | GitHub repo URL | Structured JSON (never writes files) |
| Creator | Sonnet | Structured JSON | SKILL.md created on disk |
| Router | Haiku (or inline) | List of skills per domain | Domain router SKILL.md |

### Opus Evaluator Return Schema

Every Opus evaluator MUST return this exact JSON shape — no prose:

```json
{
  "skillName": "slug matching directory name",
  "githubRepo": "user/repo",
  "title": "Human readable title",
  "description": "One sentence: when agent should invoke this. Written from agent's perspective.",
  "triggers": ["5-8 keyword phrases appearing in user requests"],
  "domain": "marketing|writing|seo|creative|publishing|aso",
  "subdomain": "more specific sub-category",
  "content": "Full SKILL.md body — all frameworks, instructions, examples. Not a summary.",
  "chains": {
    "typically_after": ["skills-that-run-before-this"],
    "typically_before": ["skills-that-run-after-this"]
  },
  "claudeMdRoutingEntry": "- trigger phrase → /skill-name",
  "discoverabilityScore": 85,
  "discoverabilityNotes": "Assessment of content density and trigger coverage"
}
```

### Sonnet Creator Contract

Sonnet receives the Opus JSON and:
1. Creates directory: `mkdir -p ~/.claude/skills/{skillName}`
2. Writes SKILL.md with frontmatter:
   ```yaml
   ---
   name: {skillName}
   description: "{description}"
   triggers:
     - "{trigger1}"
     - "{trigger2}"
   ---
   ```
3. Appends `content` from Opus JSON as the skill body
4. Runs detect-unadded.js to verify the skill is now found
5. Marks as added: `node detect-unadded.js --mark-added {id}`

### Detecting Unadded Skills

```bash
# Report: which skills in the registry haven't been added yet
node ~/.claude/skills/skill-source-registry/detect-unadded.js

# With JSON output for subagent consumption
node ~/.claude/skills/skill-source-registry/detect-unadded.js --json

# After adding new GitHub repos to skill-sources.json, run again to find new gaps
node ~/.claude/skills/skill-source-registry/detect-unadded.js --report-only
```

### Loop Until Done

```
1. Run detect-unadded.js --json → get list of missing skills
2. For each missing skill: dispatch Opus evaluator (background, parallel)
3. For each Opus result: dispatch Sonnet creator
4. Run detect-unadded.js again → verify 0 missing
5. If still missing (fetch failed, rate limited): retry with --dry-run to see what needs manual attention
```

### Adding New Repos to the Registry

Edit `~/.claude/skills/skill-source-registry/skill-sources.json`:

```json
{
  "id": "new-skill-id",
  "repo": "githubuser/reponame",
  "expectedSkillName": "skill-directory-name",
  "domain": "marketing|writing|seo|creative|publishing|aso",
  "description": "One-line description",
  "addedAt": null
}
```

Then run `detect-unadded.js` — the new entry will appear in the missing list and the pipeline will pick it up.

### Domain Router Pattern (Scaling CLAUDE.md)

At 400+ skills, CLAUDE.md can't list every skill. Use domain routers:
- CLAUDE.md lists ~10 domain-level entries (never grows)
- Each domain router lists its sub-skills and routing logic
- New skills added to a domain → update the router, not CLAUDE.md

When adding a new skill, always update the relevant domain router's routing table.

## Related Skills (Admin/Agent Tooling Cluster)
- **agent-tooling-registry** — Query, document, and manage agent tools in the registry
- **how-to-register-and-describe-agentic-tools** — Write human-readable tool descriptions
- **how-to-bulk-register-atomic-tools** — Bulk register endpoints, skills, and utilities
- **atomic-helpers-registry** — Registry of all atomic simulation helpers
- **route-to-agentic-tools-registry-sync** — Keep registry in sync with code
- **canonical-function-scanner** — Discover and register canonical functions

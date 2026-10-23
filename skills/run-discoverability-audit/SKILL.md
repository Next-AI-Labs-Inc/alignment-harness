---
name: run-discoverability-audit
description: Reproducible full-codebase discoverability audit — ensures every tool, skill, endpoint, and MCP tool is findable by any agent on any surface.
triggers:
  - "discoverability audit"
  - "run full audit"
  - "are tools findable"
  - "agent discoverability"
  - "missing triggers"
  - "orphaned skills"
  - "registry gaps"
  - "MCP parity"
---

# Run Discoverability Audit

Reproducible workflow for ensuring every artifact (skill, endpoint, MCP tool, admin UI, utility) is findable by any agent on any surface. Created from the Mar 2026 full-codebase audit.

## Quick Start — Automated Report

If `scripts/agent-tools/discoverabilityAuditHelpers.js` does not exist, create it.

```bash
cd "$(git rev-parse --show-toplevel)"
node scripts/agent-tools/discoverabilityAuditHelpers.js --full-report
```

This runs all 3 checks (triggers, cross-refs, registry gaps) and prints a summary.

## When to Run

- **After shipping new tools/endpoints/skills** — before closing the session
- **Monthly maintenance** — catch drift from accumulated commits
- **After MCP server changes** — ensure cross-surface parity
- **When an agent reports "couldn't find X"** — diagnose and fix the gap

## The 5 Discovery Surfaces (Quick Reference)

| # | Surface | Check Command |
|---|---------|---------------|
| 1 | MCP `list_tools` | Automatic if server attached |
| 2 | Skill `triggers:` | `node discoverabilityAuditHelpers.js --check-triggers` |
| 3 | Agent Tooling Registry | `node discoverabilityAuditHelpers.js --check-registry-gaps` |
| 4 | `agent_find` swarm | `node "${CLAUDE_PLUGIN_ROOT}/mcp/agent-find/cli.js" "query"` |
| 5 | Registry semantic search | `grep -rilE "..." "$(alignment-harness records tool-registry)"` |

## Phase 1: Triggers Audit

```bash
node scripts/agent-tools/discoverabilityAuditHelpers.js --check-triggers
```

**Fix missing triggers**: For each skill missing `triggers:`, read the SKILL.md, add 3-5 keyword phrases to YAML frontmatter:
```yaml
triggers:
  - "keyword phrase 1"
  - "keyword phrase 2"
  - "keyword phrase 3"
```

## Phase 2: Cross-Reference Audit

```bash
node scripts/agent-tools/discoverabilityAuditHelpers.js --check-crossrefs
# Or specific cluster:
node scripts/agent-tools/discoverabilityAuditHelpers.js --check-crossrefs --cluster stripe
```

**Available clusters**: stripe, auth, testing, forecasting, intent, admin-tooling

**Fix orphaned skills**: Append a "Related Skills ({Cluster} Cluster)" section at the end of each orphaned skill file listing 3-6 sibling skills with one-line descriptions.

## Phase 3: Registry Gaps

```bash
node scripts/agent-tools/discoverabilityAuditHelpers.js --check-registry-gaps
```

**Fix missing entries**: Register via API:
```bash
alignment-harness store add tool-registry \
  --json '{"slug":"...", "name":"...", "description":"...", "toolType":"endpoint", "category":"admin", "tags":["..."], "signature":"GET /api/...", "repo":"..."}'
```

## Phase 4: MCP Cross-Surface Parity (IX-9522)

If `scripts/agent-tools/syncMcpToolsToRegistry.js` does not exist, create it.

```bash
# Sync MCP tools to registry (dry run first):
node scripts/agent-tools/syncMcpToolsToRegistry.js --dry-run
# Then write:
node scripts/agent-tools/syncMcpToolsToRegistry.js
```

**Intent**: IX-9522 — All Claude agents access all tools regardless of surface.

## Phase 5: Endpoint Sync

If the `agentic-tools:sync-endpoints` and `agentic-tools:sync-endpoints:dry` npm scripts do not exist, create them.

```bash
# Discover Express routes not in registry:
npm run agentic-tools:sync-endpoints:dry
# Write missing ones:
npm run agentic-tools:sync-endpoints
```

## Phase 6: Signal Surfacing Audit (NEW — Mar 2026)

Every admin page with a "needs human review" state MUST have a signal config entry in `adminSignalConfig.js`. Without it, the page is a dead drop that the user must remember to visit.

If `config/adminSignalConfig.js` does not exist, create it.

```bash
# Check which admin routes have signal configs:
node -e "const { SIGNAL_CONFIGS } = require('./config/adminSignalConfig.js'); console.log(JSON.stringify({ configs: SIGNAL_CONFIGS }))" | \
  python3 -c "
import sys, json
d = json.load(sys.stdin)
paths = set(c['path'].split('?')[0] for c in d['configs'])
print(f'Signal configs: {len(d[\"configs\"])} entries covering {len(paths)} unique pages')
print('Covered:', ', '.join(sorted(paths)[:10]), '...')
"
```

**Fix missing entries**: Add a config entry with appropriate weight, label, and query.

**Rule**: If an admin page has items in a "proposed", "pending", "unscored", or "backlog" state that needs human action, it MUST have a signal config. Otherwise the user never knows to go there.

## Phase 7: Update Audit Registry

After fixing gaps, update the audit registry so future agents don't re-audit:
```
${CLAUDE_PLUGIN_ROOT}/skills/discoverability-audit-learnings-findable-by-agents/audit-registry.json
```

## Atomic Helper Functions

All helpers live at `scripts/agent-tools/discoverabilityAuditHelpers.js`:

| Function | CLI Flag | What It Does |
|----------|----------|-------------|
| `checkTriggers()` | `--check-triggers` | Scans 220 skills for missing `triggers:` frontmatter |
| `checkCrossRefs(cluster?)` | `--check-crossrefs` | Audits sibling references across 6 domain clusters |
| `checkRegistryGaps()` | `--check-registry-gaps` | Verifies critical tools exist in agent tooling registry |
| `fullReport()` | `--full-report` | Runs all checks, prints summary with counts |

## Cluster Definitions (for cross-ref audit)

| Cluster | Skills |
|---------|--------|
| **stripe** | stripe-best-practices, stripe-add-customer-credit, stripe-uncancel-subscription, entitlement-resolver-management, feature-gating-upgrade-flow |
| **auth** | app-local-login, admin-security-check, security-checklist-by-endpoint, owasp-security |
| **testing** | agentic-chrome-testing, autonomous-app-testing, feature-completion-ux-test, webapp-testing, playwright-e2e, playwright-validator, ux-testing-learnings, Test-Actual-UX, devtools-site-testing |
| **forecasting** | forecasting-workbench, forecasting-kpi-creation, forecasting-segmentation-tool, forecasting-top-insights-tool, forecasting-agentic-system-evals, forecasting-artifact-docs-pattern, forecasting-skills-index, proxy-metrics-kpis-forecasting-creation, create-proxy-forecast-metrics |
| **intent** | intent-db, intent-lifecycle, intent-alignment-audit, intent-alignment-audit-coaching, intent-leverage-audit, company-intent-db |
| **admin-tooling** | agentic-tooling-registry, how-to-register-and-describe-agentic-tools, how-to-bulk-register-atomic-tools, atomic-helpers-registry, discoverability-audit-learnings-findable-by-agents, route-to-agentic-tools-registry-sync, canonical-function-scanner |

## Benchmarks (Mar 2026 Baseline)

| Metric | Before | After |
|--------|--------|-------|
| Skills with triggers | 78/220 (35%) | 218/218 (100%) |
| Orphaned skills (in clusters) | 15 | 0 |
| Tools in registry | 250 | 260+ |
| MCP tools in registry | 0 | Bridged via syncMcpToolsToRegistry |
| Intent logged | — | IX-9522 (surface parity) |

## Related Skills
- **discoverability-audit-learnings-findable-by-agents** — Deep reference with 5-surface procedure and admin signal analysis
- **agentic-tooling-registry** — Query and manage the tool registry
- **how-to-bulk-register-atomic-tools** — Bulk registration patterns
- **route-to-agentic-tools-registry-sync** — Keep registry in sync with code

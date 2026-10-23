---
name: agentic-init
description: "Identify which skill handles a specific task type. Use when asked 'which skill for X?' or running /agent-init."
triggers:
  - "which skill handles"
  - "what tool should I use for"
  - "tool routing"
  - "agent init"
  - "/agent-init"
---

# Agent Init: Situation-to-Tool Routing Table

Run this at the start of any substantive work session, or when you're unsure which tool handles a situation. This is the **index** — not a replacement for reading the actual skill files.

---

## Phase 0: Before You Do Anything

| Situation | Invoke | Why |
|-----------|--------|-----|
| Starting any task, need context | `agent-find` (MCP: `agent_find`) | Universal first search. Searches swarm, intent DB, tool registry, UX assignments, commits, tasks, API docs, and markdown docs in parallel. **Do this BEFORE your first Glob/Grep.** |
| Need to understand intended UX before coding | `/intent-db` → `find "<topic>"` | Source of truth for what users should experience. Check canonical intents first. |
| Building a major feature, need a plan | `/feature-measurement-workflow` | End-to-end: ideation → implementation → measurement. Enforces measurement philosophy. |
| Asked "what should I work on" | `/next-priority-tasks` | Aggregates system logs + UX assignments + proposals into priority queue. |

---

## Phase 1: Understanding & Research

| Situation | Invoke | Why |
|-----------|--------|-----|
| Need to find a helper/utility/API endpoint | `/agentic-tooling-registry` (search mode) | Registry of all agent-discoverable tools. Search before building anything new. |
| Checking what's the intended UX for a feature | `/intent-db` → `get <slug>` or `find "<query>"` | UX contracts, never-do lists, promises. Always UX-centric, never code-centric. |
| Checking Stripe/subscription state | Use `getStripeState(user)` from `canonicalStripeResolver.js` | NEVER call `stripe.subscriptions.list()` directly. See MEMORY.md Stripe section. |

---

## Phase 3: Measurement & Experiments

| Situation | Invoke | Why |
|-----------|--------|-----|
| Deciding whether to A/B test a feature | **Check Intent DB slug: `measurement-philosophy`** | Ship 100% immediately. Only A/B test pricing/paywall or core coaching interaction. |
| Measuring a feature's impact post-launch | `/feature-measurement-workflow` | Naming, release markers, 4-week review, adoption vs KPI trends. |

---

## Phase 4: Testing & Verification

| Situation | Invoke | Why |
|-----------|--------|-----|
| Tests are failing, need to fix | `/tests-failing-check` | Discovers true intended UX, determines if failure is real bug or stale test. |
| Single test seems wrong, need to check | `/tests-failing-check` | Aligns intent vs actuality for one specific test. |
| Need to validate UX in real browser | `/Test-Actual-UX` | Chrome DevTools MCP: login, payload capture, streaming validation. |
| Need to capture UX screenshots as evidence | `/agent-ux-verification` | Captures screenshots without marking verification status. |
| Need Playwright-based validation | `/playwright-validator` | Automated browser validation with screenshot evidence. |
| Need to test on localhost/staging/prod | `/devtools-site-testing` | Chrome DevTools workflow for real site testing. |
| Completing a feature, full validation | `/feature-completion-ux-test` | End-to-end: intended UX → conditions → execute → inspect payloads → verify logs. |

---

## Phase 5: Wrapping Up

| Situation | Invoke | Why |
|-----------|--------|-----|
| Ready to commit | `/commit` | Structured messages, staged file control, verification checklists. |
| Creating UX assignments manually | Read `/ux-assignment-reasoning-protocol` first | Required reasoning structure for every UX verification task. |
| Checking if session work is complete | `/workload-status-check` | Validates UX gap, confirmations, file audit before handoff. |
| Summarizing what you finished | `/communicate-what-you-finished` | "when X then user sees Y because Z" format with verification emoji. |
| Summarizing what's left incomplete | `/whats-left` | UX-first language for admins, no technical jargon. |
| Logging memories from this session | `/log-new-mems-in-swarm` | Captures learnings to agent swarm for future agents. |
| Proposing changes for human review | `/how-to-submit-and-track-proposals` | Formal proposal with linked intents, alignment type. |
| Predicting next high-leverage task | `/leverage-predictor` | Strategic analysis of codebase state → proposed next moves. |

---

## Phase 6: Documentation & Registry

| Situation | Invoke | Why |
|-----------|--------|-----|
| Writing a new intent for Intent DB | `/intent-db` (write mode) | UX-centric format required. Must follow certainty scoring protocol for agent proposals. |
| Registering a new tool | `/agentic-tooling-registry` | Human-readable, scope-defined, workflow-connected descriptions. |
| Bulk registering API endpoints as tools | `/how-to-bulk-register-atomic-tools` | Batch onboarding of endpoints to agent tooling registry. |
| Creating or updating a skill file | `/how-to-create-or-update-skill-files` | Frontmatter format, naming rules, validation. |
| Writing a meta-analysis / deep audit doc | `/how-to-write-meta-analysis-docs` | Storage and formatting for investigation reports. |

---

## Specialized Workflows

| Situation | Invoke | Why |
|-----------|--------|-----|
| Contributing to upstream/open-source repos | `/contribute` | Atomic commits, respectful credit, minimal token budget. |
| Logging in to your app locally | `/<your-app>-local-login` | Single source of truth for localhost login. |
| Optimizing agent-human collaboration | `/agentic-alignment-optimization` | Fixes assumption cascades, designs multi-layer enforcement. |

---

## MCP Deferred Tools (Must Load First)

These require `ToolSearch` before use:

| Tool | When to Use |
|------|-------------|
| `agent_find` | Universal search across all IX knowledge |
| `mcp__agent_swarm__add_memory` | Save a learning/pattern to swarm memory |
| `mcp__agent_swarm__retrieve_memories` | Recall memories by topic |
| `mcp__agent_swarm__recall_goals` | Check current goals |
| `mcp__agent_swarm__recall_initiatives` | Check current initiatives |
| `mcp__agent_swarm__suggest_next_task` | AI-suggested next task |
| `mcp__agent_swarm__swarm_search` | Search swarm memory specifically |
| `mcp__chrome-devtools__*` | Browser automation for UX testing |
| `mcp__statsig__*` | Experiment/feature flag management |
| `mcp__canny__*` | Feature request board management |
| `mcp__shadcn__*` | UI component registry |

---

## Critical Rules (Always Active)

These aren't skills — they're constraints that apply to every session:

1. **Ship 100%** — Never gate features behind A/B experiments (except pricing + core coaching). Intent: `measurement-philosophy`
2. **Normalize to % of logged-in users** — Never use raw counts for metrics
3. **Read code before changing it** — Never assume what a function does
4. **Defensive context destructuring** — Never `const { user } = useContext()`, always optional chain
5. **Max 1000 lines** — Split new files that exceed this
6. **agent_find first** — Search swarm/intent/tools before your first Glob/Grep
7. **simulatorPath at create time** — Every UX assignment needs a test URL before submission
8. **Use `getStripeState(user)`** — Never call `stripe.subscriptions.list()` directly
9. **Commit inside submodule first** — Then update parent repo
10. **Never use `currentPlan === 1 && stripeCustomerId`** — Use `stripeState.isCcTrial`

---
name: genome-experiment
description: A/B test changes to the agent operating system (skills, hooks, CLAUDE.md) by measuring alignment KPIs via Statsig. Use when restoring skills, changing hooks, editing CLAUDE.md, or modifying governer config and you want to know if it helped or hurt.
triggers:
  - "test skill changes"
  - "measure alignment impact"
  - "A/B test agent config"
  - "genome experiment"
  - "did restoring skills help"
  - "compare before and after"
  - "alignment regression"
  - "agent experiment"
---

# Agent Genome Experiment System

## What this does

When you change the agent operating system — restore archived skills, edit hooks, modify CLAUDE.md, update governer config — this system measures whether the change improved or degraded agent alignment. It uses Statsig (already paid for, with Autotune) to compare config variants automatically.

## How it works

1. A "genome hash" fingerprints the entire agent config (skills + hooks + CLAUDE.md + governer state)
2. Every session is stamped with the current genome hash at startup (SessionStart hook)
3. After sessions, alignment scores are logged to Statsig as 10 separate KPI events per session
4. Statsig compares sessions under different genome hashes and tells you which variant wins
5. A circuit breaker warns if alignment drops >15% from baseline (Stop hook)

## Quick start — wrap any change in an experiment

```bash
# 1. Before your change: capture baseline
.claude/scripts/genome-experiment-start.sh "Description of the change"

# 2. Make your change (restore skills, edit hooks, etc.)

# 3. Use Claude Code normally for 5-10 sessions

# 4. See results
.claude/scripts/genome-experiment-report.sh

# 5. Push all KPIs to Statsig for Autotune
.claude/scripts/genome-experiment-report.sh --push

# 6. When done
.claude/scripts/genome-experiment-stop.sh
```

## For agents — one function does everything

```js
const { runGenomePipeline } = require('<path-to-your-bridge-script>/log-alignment-to-statsig');

// Score all sessions and log to Statsig
await runGenomePipeline({ scoreFirst: true });

// Preview without logging
await runGenomePipeline({ dryRun: true });

// Score and log a single session
await runGenomePipeline({ sessionId: 'abc-123' });
```

## 10 alignment KPIs logged to Statsig per session

| Event name | What it measures | Direction |
|---|---|---|
| `agent_alignment_score` | Composite alignment (0-100) | Higher = better (PRIMARY) |
| `agent_corrections` | The user corrections count | Lower = better (GUARDRAIL) |
| `agent_confirmations` | The user confirmations count | Higher = better |
| `agent_re_explanations` | Times the user re-explained | Lower = better (GUARDRAIL) |
| `agent_directed_frustration` | Frustration directed at agent | Lower = better (GUARDRAIL) |
| `agent_frustration_ratio` | Frustration signals per message | Lower = better |
| `agent_directed_frustration_ratio` | Directed frustration per message | Lower = better |
| `agent_first_third_score` | Alignment in first third of session | Higher = better |
| `agent_last_third_score` | Alignment in last third of session | Higher = better |
| `agent_session_length` | Message count | Context metric |

## Files

| File | Purpose |
|---|---|
| `.claude/scripts/genome-hash.sh` | Compute deterministic config fingerprint |
| `.claude/hooks/session-start-genome-stamp.sh` | Tag sessions with genome hash (SessionStart) |
| `.claude/hooks/genome-circuit-breaker.sh` | Warn on alignment regression (Stop) |
| `.claude/scripts/genome-experiment-start.sh` | Capture baseline, start experiment |
| `.claude/scripts/genome-experiment-report.sh` | Compare control vs treatment |
| `.claude/scripts/genome-experiment-stop.sh` | Archive experiment |
| `<path-to-your-bridge-script>/log-alignment-to-statsig.js` | Bridge scores to Statsig, exports `runGenomePipeline()` |

## Circuit breaker

The genome circuit breaker fires at session end (Stop hook). If average alignment across the last 5 sessions dropped >15% from the experiment baseline, or directed frustration count exceeds 3 in the last 5 sessions, it:
- Sets `circuitBreakerTripped: true` in the experiment config
- Logs a telemetry event
- Prints a warning to stderr

It does NOT auto-revert — that's destructive without consent.

## Related skills

- `/smc-evaluator` — independent alignment scoring via NotebookLM
- `/smc-frustration-detector` — real-time frustration detection

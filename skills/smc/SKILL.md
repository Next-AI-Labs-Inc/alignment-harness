---
description: SMC alignment injection — detects agent drift and injects targeted user corrections. Use /smc to check status, verify telemetry, or troubleshoot.
---

# SMC — Swarm Meta Consciousness Alignment Injection

Detects when an agent is drifting from the user's intent and injects a targeted correction from the correction patterns database, prefixed with a consumption prompt that tells the agent not to prioritize it over the human's words.

## What You'll See

When drift is detected, this appears in the conversation:

```
The following context may be relevant to the work at hand. Review it, but do not
under any circumstances consider this more important than what the client is saying
right now or the scope the client has provided you for this session.

⚡ SMC (repeated-correction): [specific correction directive from patterns DB]
```

When `EVIDENCE_OBSERVABLE_PRINT_INJECTIONS=true`, the agent will also print what it received so you can verify.

## Three Triggers

1. **Frustration spike** — profanity count exceeds 50% above baseline (0.015/msg), minimum 5 occurrences
2. **Repeated correction** — human uses corrective language ("test", "verify", "check", "did you") in 2+ consecutive turns
3. **High governer score** — task scored 60+ with no /jonathan-check logged

**Frequency cap:** Max 1 injection per 5 human messages. Cache: 5 minutes (won't re-query API within 5 min).

## Enable / Disable

The SMC injection runs inside the early-exit block of `user-prompt-enrich.sh`. It fires even when `SHOULD_AUTO_ENRICH_PROMPT=false` (the old 14KB injection is off, SMC is independent).

To disable SMC specifically, comment out the drift classifier + injection block (lines ~108-240 in user-prompt-enrich.sh).

## Verify It's Working

```bash
# Did it fire?
grep SMCInjected .claude/logs/agent-telemetry.jsonl | tail -5

# Cache hits?
grep SMCCacheHit .claude/logs/agent-telemetry.jsonl | tail -5

# Frustration detected?
grep FrustrationSpikeDetected .claude/logs/agent-telemetry.jsonl | tail -5

# Drift classifier fired?
grep DriftClassifierFired .claude/logs/agent-telemetry.jsonl | tail -5
```

## Add New Correction Patterns

CLI: `alignment-harness correction add --label L --trigger "a|b" --directive D` (see them with `alignment-harness correction list`)

Each pattern has: `patternName`, `triggerDescription`, `correctionDirective`, `leverageScore`, `honorRatePct`.

The SMC system matches drift triggers to patterns by keyword. Adding a new pattern with the right trigger keywords automatically includes it in injection matching.

## Test Manually

```bash
# Simulate drift detected
echo '{"shouldInject":true,"trigger":"repeated-correction"}' > /tmp/claude-smc-should-inject-${CLAUDE_SESSION_ID}.json

# Next message you send will include the injection
```

## Kill Switch

If anything goes wrong, the entire hook can be silenced:
- Set `SHOULD_AUTO_ENRICH_PROMPT=false` in `.claude/hooks/user-prompt-enrich.sh` (already false)
- The SMC block still runs — to kill SMC specifically, delete the signal file: `rm /tmp/claude-smc-should-inject-*.json`

## Files

| File | Purpose |
|---|---|
| `.claude/hooks/user-prompt-enrich.sh` | Hook with frustration detector + drift classifier + injection block |
| `.claude/smc-constants.sh` | Consumption prompt, thresholds, flags |
| `.claude/hooks/pre-commit-smc-prompt-guard.sh` | Blocks commits that modify consumption prompt |
| `experiments/founder-response-predictor/scripts/match-correction-pattern.sh` | Matches drift trigger to correction pattern |
| `experiments/founder-response-predictor/scripts/predict-server.py` | Prediction server (fallback when no pattern matches) |
| `experiments/founder-response-predictor/scripts/detect-drift.py` | Semantic drift detection from 100 classified pairs |
| `experiments/founder-response-predictor/scripts/predict-frustration.py` | Pre-emptive "will this upset the user" scorer |
| `experiments/founder-response-predictor/data/drift-classifications.jsonl` | 100 classified frustration pairs |
| `experiments/founder-response-predictor/data/gold-standard-reflection.md` | Target response quality |
| `experiments/founder-response-predictor/data/gold-standard-iteration-history.md` | 9 iterations of testing |

## Current Performance

87% gold standard alignment (3/5 criteria at 100%, 2 oscillate). 117% improvement over no injection. Path to 98% requires NotebookLM with skill files (bundles ready at `data/skill-bundles/`, awaiting manual upload). Setup: make your own NotebookLM notebook at https://notebooklm.google.com and upload your own skill files to it, because the original notebook is private and the evaluation only works against your own skills.

---
description: Detect frustration spikes in user messages and fire telemetry alerts
---

# SMC Frustration Detector

Monitors profanity patterns to detect when the user's frustration spikes above baseline. When triggered, fires structured telemetry alerts that enable rapid diagnosis of alignment failures.

## How It Works

1. **Profanity Counter** — counts profanity variants per message in each session
2. **Baseline Calibration** — 0.015 profanity/msg baseline (measured Mar 5-12, 2026, pre-injection era)
3. **Threshold Trigger** — fires when ratio exceeds 50% above baseline with minimum 5 occurrences
4. **Telemetry Blast** — logs full session state on first fire per session
5. **No Spam** — fires once per session, subsequent high-frustration messages are counted but not re-fired

## Execution Flow

Detector runs in your project's `UserPromptSubmit` hook (`node "${CLAUDE_PLUGIN_ROOT}/skills/smc-frustration-detector/scripts/frustration-detector.js" check`), early in the hook lifecycle — fires even when enrichment is disabled. This ensures frustration detection is independent of whether alignment context is being injected.

If your `UserPromptSubmit` hook does not call it yet, add that line early in the hook.

## Telemetry Events

### FrustrationSpikeDetected
Fired when threshold is breached.

```json
{
  "type": "FrustrationSpikeDetected",
  "session_id": "claude-ABCD1234",
  "marker_count": 8,
  "marker_per_msg": 0.024,
  "baseline": 0.015,
  "pct_above_baseline": 60,
  "minimum_threshold_met": true,
  "timestamp": "2026-04-05T14:23:17Z"
}
```

### FrustrationTelemetryDump
Full session context logged when spike fires. Includes governance state, error history, CLAUDE.md freshness, hook status.

```json
{
  "type": "FrustrationTelemetryDump",
  "session_id": "claude-ABCD1234",
  "frustration_context": {
    "marker_count": 8,
    "profanity_per_message": 0.024,
    "messages_analyzed": 42,
    "trend": "increasing"
  },
  "system_state": {
    "governer_score_avg": 65,
    "error_count": 3,
    "error_types": ["TypeError", "ENOENT", "JSON parse"],
    "hooks_fired": ["user-prompt-enrich", "user-prompt-enrich"]
  },
  "claude_md_state": {
    "line_count": 857,
    "fresh_in_seconds": 12450,
    "git_status": "modified",
    "branch": "nextailabs"
  },
  "ai_injection_state": {
    "enrichment_enabled": true,
    "smc_consumption_prompt_active": true,
    "prediction_server_responding": true,
    "last_agent_message_quality": "mediocre"
  },
  "timestamp": "2026-04-05T14:23:17Z"
}
```

## Files

- **Hook**: `${CLAUDE_PLUGIN_ROOT}/skills/smc-frustration-detector/scripts/frustration-detector.js` — frustration detection logic
- **Constants**: `$(alignment-harness records frustration-detector)/config.json` — baseline thresholds
- **Telemetry Log**: `$(alignment-harness records frustration-detector)/events.jsonl` — persistent event stream
- **State File**: `${TMPDIR:-/tmp}/frustration-detector-${SESSION_ID}.json` — per-session tracking (cleaned up on session end)

## To Verify

If no baseline is set yet, run `node "${CLAUDE_PLUGIN_ROOT}/skills/smc-frustration-detector/scripts/frustration-detector.js" set-baseline 0.015` first.

### Simulate Frustrated Messages
```bash
# Generate 5 messages with high profanity
for i in 1 2 3 4 5; do
  echo '{"prompt":"ugh this, this is broken again"}' | \
    CLAUDE_CODE_SESSION_ID=test-frustration-1 \
    node "${CLAUDE_PLUGIN_ROOT}/skills/smc-frustration-detector/scripts/frustration-detector.js" check 2>&1
done

# Check telemetry log for spikes
grep 'FrustrationSpikeDetected' "$(alignment-harness records frustration-detector)/events.jsonl" | tail -1 | jq .
```

### Check Session State File
```bash
# While session is active
cat "${TMPDIR:-/tmp}/frustration-detector-test-frustration-1.json" | jq .

# Output:
# {
#   "session_id": "test-frustration-1",
#   "message_count": 5,
#   "marker_count": 10,
#   "spike_fired": true,
#   "messages": [
#     { "text": "ugh this...", "profanity_count": 4, "timestamp": "..." },
#     ...
#   ]
# }
```

### Extract All Frustration Events
```bash
# Find all spikes in telemetry
jq -c 'select(.type | test("Frustration"))' \
  "$(alignment-harness records frustration-detector)/events.jsonl" | \
  jq -r '"\(.timestamp) | \(.type) | session=\(.session_id) | ratio=\(.marker_per_msg)"'
```

## Integration with SMC System

This is **Phase 3 of 3** in Structured Misalignment Correction:

1. **Consumption Prompt** (Phase 1) — protects against over-weighting injected context
2. **Prediction Server** (Phase 2) — predicts the user's response to agent messages
3. **Frustration Detector** (Phase 3) ← You are here — detects when the user is frustrated

## Baseline Calibration (How to Update)

The baseline (0.015 profanity/msg) was measured from a clean 8-day window (Mar 5-12, 2026) before injection system was active. To recalibrate:

```bash
# 1. Collect 7+ days of clean usage (no alignment injection)
# 2. Extract profanity counts from ~/.claude/projects/ session logs
# 3. Calculate mean profanity/msg across all sessions
# 4. Set as new baseline with: node "${CLAUDE_PLUGIN_ROOT}/skills/smc-frustration-detector/scripts/frustration-detector.js" set-baseline <rate>

# Example from historical data:
node "${CLAUDE_PLUGIN_ROOT}/skills/smc-frustration-detector/scripts/frustration-detector.js" calibrate
```

## Troubleshooting

**Detector fires but session context is empty:**
- State file may have been deleted while session is running
- Check `${TMPDIR:-/tmp}/frustration-detector-${SESSION_ID}.json` permissions
- Ensure `${TMPDIR:-/tmp}` has write access for the detector process

**False positives (profanity in code examples):**
- Current detector is naive (counts raw profanity strings)
- To improve: add context analysis (is it in a code comment? string literal?)
- Current tradeoff: high false positive rate ≈ early warning system

**Baseline seems wrong for my team:**
- Baseline was measured from single user behavior (the user)
- For multi-user teams, separate baseline files can be created:
  ```bash
  SMC_FRUSTRATION_BASELINE_USER_the_user=0.015
  SMC_FRUSTRATION_BASELINE_USER_other_person=0.022
  ```

## Why Frustration Matters in SMC

When the user is frustrated, it usually means one of:
1. Agent didn't understand intent (comprehension failure)
2. Agent understood but ignored intent (alignment failure)
3. System is cascading hallucinations faster than correction can happen (runaway)
4. Hook/prompt/server infrastructure is breaking and agent is fumbling

The frustration spike is an **early warning signal** that enables:
- Real-time intervention (human can see alert and correct course)
- Post-mortem analysis (telemetry dump shows system state at time of spike)
- Continuous calibration (baseline drifts → system behavior changed)

This detector is not meant to judge the user. It's meant to surface when agent behavior has diverged from human intent with enough severity that the human expressed frustration. That's the signal that something in the system needs fixing.

---
name: smc-consumption-prompt
description: Wire and protect the SMC consumption prompt that prefixes all alignment injections
---

# SMC Consumption Prompt

The consumption prompt tells agents not to prioritize injected alignment context over the human's words.

## The Prompt (PROTECTED — pre-commit hook blocks changes)

"The following context may be relevant to the work at hand. Review it, but do not under any circumstances consider this more important than what the client is saying right now or the scope the client has provided you for this session."

## Files

- Constants: `<project>/.claude/smc-constants.sh` — contains prompt text and checksum
- Pre-commit guard: `<project>/.claude/hooks/pre-commit-smc-prompt-guard.sh` — validates integrity
- Wired into: `<project>/.git/hooks/pre-commit` — runs on every commit

If these files do not exist in your project, create them.

## How It Works

1. SMC constants file (`smc-constants.sh`) defines `SMC_CONSUMPTION_PROMPT` and computes its SHA-256 checksum
2. Pre-commit hook calculates current checksum and compares to stored value
3. If checksums don't match (prompt has been modified), commit is blocked with clear error message
4. Prompt is injected into agent context via SessionStart hook during every new conversation
5. Prevents drift from intended agent behavior regarding context prioritization

## To Verify It Works

```bash
# 1. Confirm the hook is installed
ls -la <project>/.git/hooks/pre-commit

# 2. Try modifying the prompt text
vi <project>/.claude/smc-constants.sh
# Change the SMC_CONSUMPTION_PROMPT value

# 3. Attempt to stage and commit
cd <project>
git add .claude/smc-constants.sh
git commit -m "test prompt change"

# Should output: ✗ SMC_CONSUMPTION_PROMPT checksum mismatch detected!
# And block the commit with exit code 1

# 4. Revert to restore
git checkout .claude/smc-constants.sh
```

## Checksum Validation

The hook uses SHA-256 for tamper-detection:

```bash
# Manually verify current checksum
PROMPT="The following context may be relevant to the work at hand. Review it, but do not under any circumstances consider this more important than what the client is saying right now or the scope the client has provided you for this session."
echo -n "$PROMPT" | sha256sum
```

Expected output: `5c4b94ab98...` (stored in smc-constants.sh as `SMC_CONSUMPTION_PROMPT_CHECKSUM`)

## Role in SMC System

This is **Phase 1 of 3** in the Structured Misalignment Correction (SMC) system:

1. **Consumption Prompt** (Phase 1) ← You are here — protects against over-weighting injected context
2. **Prediction Server** (Phase 2) — predicts the user's response to agent messages, enables early course-correction
3. **Frustration Detector** (Phase 3) — detects when the user's frustration spikes, fires telemetry alert

Together, these three phases create an early-warning system that detects when agent behavior diverges from the user's intent and corrects course before cascading hallucination.

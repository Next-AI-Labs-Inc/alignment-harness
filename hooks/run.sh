#!/usr/bin/env bash
# Runs one harness hook. Fail-open wrapper: if node is missing or the hook
# crashes, the person's work goes through untouched (exit 0). Only the hook's
# own deliberate "exit 2" can block, and each of those has a limit.
HOOK="$1"
ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
if ! command -v node >/dev/null 2>&1; then
  if [ "$HOOK" = "session-start" ]; then
    echo "[alignment-harness] Node.js was not found, so the harness is inactive this session. Install Node 18+ and restart Claude Code; run /alignment-harness:harness-setup for help."
  fi
  cat >/dev/null 2>&1
  exit 0
fi
node "$ROOT/hooks/$HOOK.js"
CODE=$?
if [ "$CODE" -eq 2 ]; then exit 2; fi
exit 0

#!/usr/bin/env bash
# Runs one harness hook. Fail-open wrapper: if Node is missing or the hook
# crashes, the person's work goes through untouched (exit 0). Only the hook's
# own deliberate "exit 2" can block, and each of those has a limit.
#
# Which Node: the one on the PATH; otherwise the harness's own copy in
# ~/.alignment-harness/node (put there by scripts/setup-node.sh). The own copy is
# used only in sessions that started after it existed, because Claude's own
# commands (node …, alignment-harness …) need it on their PATH too, and Claude
# Code only takes that from a session-start hook (CLAUDE_ENV_FILE).
HOOK="$1"
ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
OWN="$HOME/.alignment-harness/node"
OWN_BIN="$OWN/bin"; [ -x "$OWN/node.exe" ] && OWN_BIN="$OWN"
MARKS="$HOME/.alignment-harness/sessions-with-node"

json_text() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

NODE=""
if command -v node >/dev/null 2>&1; then
  NODE="node"
elif [ -x "$OWN_BIN/node" ] || [ -x "$OWN_BIN/node.exe" ]; then
  INPUT="$(cat)"
  SID="$(printf '%s' "$INPUT" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([A-Za-z0-9._-]*\)".*/\1/p' | head -1)"
  if [ "$HOOK" = "session-start" ] && [ -n "$SID" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    if printf 'export PATH="%s:$PATH"\n' "$OWN_BIN" >> "$CLAUDE_ENV_FILE" 2>/dev/null; then
      mkdir -p "$MARKS" && : > "$MARKS/$SID"
      find "$MARKS" -type f -mtime +14 -delete 2>/dev/null
    fi
  fi
  if [ -n "$SID" ] && [ -f "$MARKS/$SID" ]; then
    NODE="$OWN_BIN/node"; [ -x "$NODE" ] || NODE="$OWN_BIN/node.exe"
    export PATH="$OWN_BIN:$PATH"
  else
    if [ "$HOOK" = "session-start" ]; then
      M="Alignment harness: its own copy of Node.js is installed. Start a new Claude Code session to turn the harness on."
      [ -z "${CLAUDE_ENV_FILE:-}" ] && M="Alignment harness: its own copy of Node.js is in $OWN_BIN, but this Claude Code can't add it to Claude's PATH. Add that folder to your PATH (or install Node 18+), then start a new session."
      printf '{"systemMessage":"%s"}\n' "$(json_text "$M")"
    fi
    exit 0
  fi
  printf '%s' "$INPUT" | "$NODE" "$ROOT/hooks/$HOOK.js"
  CODE=$?
  if [ "$CODE" -eq 2 ]; then exit 2; fi
  exit 0
fi

if [ -z "$NODE" ]; then
  cat >/dev/null 2>&1
  if [ "$HOOK" = "session-start" ]; then
    SETUP="bash \"$ROOT/scripts/setup-node.sh\""
    ME="Alignment harness is installed but off: it runs on Node.js, which isn't on this computer. Claude can set up the harness's own copy for you in one step (from nodejs.org, about 40 MB, no admin password)."
    AG="The alignment harness plugin is installed but inactive: its checks run on Node.js and none was found. Tell the person this in one sentence and offer to set it up. On their yes, run exactly: $SETUP  — it downloads the official Node.js 24 for this computer from nodejs.org into ~/.alignment-harness/node (no admin password, no system or shell-settings changes), checks its SHA-256 against nodejs.org's published list, and prints the result. When it finishes, tell them to start a new Claude Code session; the harness is on from there. Do not install Node any other way unless they ask."
    printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$(json_text "$ME")" "$(json_text "$AG")"
  fi
  exit 0
fi

node "$ROOT/hooks/$HOOK.js"
CODE=$?
if [ "$CODE" -eq 2 ]; then exit 2; fi
exit 0

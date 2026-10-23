#!/usr/bin/env bash
# Runs the session transcript extractor.
# Usage: bash ~/.claude/skills/incomplete-tasks-get-from-session/run_extract.sh [SESSION_UUID]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/extract_transcript.py" "$@"

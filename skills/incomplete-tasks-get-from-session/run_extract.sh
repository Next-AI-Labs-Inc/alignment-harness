#!/usr/bin/env bash
# Runs the session transcript extractor.
# Usage: bash run_extract.sh [SESSION_UUID]   (run from this skill's own directory, or pass its full path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/extract_transcript.py" "$@"

#!/bin/bash
# Try the Alignment Harness on a sealed machine that looks like an experienced Claude Code user.
# Your own ~/.claude is never mounted or touched. The only things shared are the harness folder
# (read-only) and a small Docker volume that keeps the sandbox's own sign-in between runs.
# Its network is closed to your own computer and local network (sandbox/seal.sh); needs --cap-add NET_ADMIN for that.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PLUGIN="$(cd "$HERE/.." && pwd)"
docker build -q -t alignment-harness-sandbox "$HERE/sandbox" >/dev/null
exec docker run -it --rm --name "harness-sandbox-$$" --cap-add NET_ADMIN \
  -v alignment-harness-sandbox-signin:/auth \
  -v "$PLUGIN":/opt/alignment-harness:ro \
  alignment-harness-sandbox "$@"

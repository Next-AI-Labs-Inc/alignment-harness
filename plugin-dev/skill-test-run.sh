#!/bin/bash
# Run one shipped skill the way a brand-new user would, inside the sealed sandbox, without a terminal.
# Fresh "Dana" persona each run; installs the harness from this folder (read-only); invokes the skill
# once with the request given; saves the full transcript (stream-json) for a reviewer to judge.
# Transcripts go outside the plugin (default ~/.cache/alignment-harness/skill-runs) so they never ship.
#
#   plugin-dev/skill-test-run.sh <skill-id> "<what Dana asks for>" [out-dir] [max-turns]
#
# The saved sign-in is mounted read-only, so test runs can never overwrite it.
# Nothing here can reach your own ~/.claude, and the sandbox's network is closed to your own
# computer and local network (sandbox/seal.sh). The sandbox has no claude.ai connectors, so a skill
# cannot send mail or post anywhere; it can only work inside Dana's machine.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PLUGIN="$(cd "$HERE/.." && pwd)"
SKILL="$1"; ASK="$2"; OUT="${3:-${XDG_CACHE_HOME:-$HOME/.cache}/alignment-harness/skill-runs}"; TURNS="${4:-25}"
[ -n "$SKILL" ] && [ -n "$ASK" ] || { echo "usage: $0 <skill-id> \"<request>\" [out-dir] [max-turns]" >&2; exit 64; }
mkdir -p "$OUT"
# Tell any idle-shutdown job on this Mac that Docker is in use (see "orbstack-holds" in
# agent-marketing/ops/postiz-ops.sh). Each run pushes the hold 30 minutes out, so it
# lasts through a batch and lapses by itself half an hour after the last run.
mkdir -p "$HOME/.cache/orbstack-holds" && echo $(( $(date +%s) + 1800 )) > "$HOME/.cache/orbstack-holds/alignment-harness-skill-tests"
# Always build: it is a no-op when nothing changed, and it guarantees an image from before the network wall is never reused.
docker build -q -t alignment-harness-sandbox "$HERE/sandbox" >/dev/null
# A run that ends without a result line (the container never really started, or Docker blinked)
# is retried once after a short pause. A run that finished, whatever it did, is never repeated.
for attempt in 1 2; do
  docker run --rm --name "skill-test-$SKILL-$$-$attempt" --cap-add NET_ADMIN \
    -v alignment-harness-sandbox-signin:/auth:ro \
    -v "$PLUGIN":/opt/alignment-harness:ro \
    -v "$OUT":/out \
    -e SKILL="$SKILL" -e ASK="$ASK" -e TURNS="$TURNS" \
    alignment-harness-sandbox bash -c '
      claude plugin marketplace add /opt/alignment-harness >/dev/null 2>&1
      claude plugin install alignment-harness@alignment-harness >/dev/null 2>&1
      claude -p "/alignment-harness:$SKILL $ASK" --model sonnet --max-turns "$TURNS" \
        --output-format stream-json --verbose --dangerously-skip-permissions \
        > "/out/$SKILL.jsonl" 2> "/out/$SKILL.stderr" || echo "exit $?" >> "/out/$SKILL.stderr"
    ' >/dev/null 2>>"$OUT/$SKILL.docker.log" || true
  grep -q '"type":"result"' "$OUT/$SKILL.jsonl" 2>/dev/null && break
  [ "$attempt" = 1 ] && { echo "attempt 1 produced no result; retrying" >> "$OUT/$SKILL.docker.log"; sleep 20; }
done
echo "$OUT/$SKILL.jsonl"

#!/bin/bash
# Proves the sandbox cannot reach a server running on YOUR computer. Starts a throwaway listener on this
# machine, then tries to reach it (a) from a plain container, to show the probe CAN see it, and
# (b) from the sandbox, which must not. Exit 0 only if (a) reaches it and (b) does not.
#   plugin-dev/sandbox/probe-isolation.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
docker image inspect alignment-harness-sandbox >/dev/null 2>&1 || docker build -q -t alignment-harness-sandbox "$HERE" >/dev/null
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("",0));print(s.getsockname()[1])')
python3 -m http.server "$PORT" --bind 0.0.0.0 >/dev/null 2>&1 & LISTENER=$!
trap 'kill $LISTENER 2>/dev/null' EXIT
sleep 1
PROBE='for h in host.docker.internal $(ip route | awk "/default/{print \$3}"); do nc -z -w3 $h '"$PORT"' 2>/dev/null && echo "  $h:'"$PORT"' OPEN" || echo "  $h:'"$PORT"' unreachable"; done'
echo "A throwaway server is listening on this computer, port $PORT."
echo "(a) plain container, no wall:"
PLAIN=$(docker run --rm --add-host host.docker.internal:host-gateway --entrypoint bash alignment-harness-sandbox -c "$PROBE")
echo "$PLAIN"
echo "(b) the sandbox:"
SEALED=$(docker run --rm --cap-add NET_ADMIN --add-host host.docker.internal:host-gateway alignment-harness-sandbox bash -c "$PROBE")
echo "$SEALED"
if echo "$PLAIN" | grep -q OPEN && ! echo "$SEALED" | grep -q OPEN; then echo "PASS: the probe can see your computer, and the sandbox cannot."; exit 0; fi
echo "FAIL: $(echo "$PLAIN" | grep -q OPEN || echo 'the probe could not reach the listener even without the wall (inconclusive); ')$(echo "$SEALED" | grep -q OPEN && echo 'the sandbox reached your computer')"; exit 1

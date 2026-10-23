#!/usr/bin/env bash
# oracle-locate — answer "which account holds this oracle?" by ASKING each account.
#
# WHY THIS EXISTS
#   The 8 oracles do not all live on one Google account. An agent that assumes
#   they do (or that points them all at whichever account happens to work today)
#   turns an auth failure into "notebook not found" — which reads as though the
#   knowledge base vanished. That is a worse bug wearing a fix's clothing.
#
#   So: never assign an oracle to an account. Ask every account what it holds,
#   and report where each oracle actually is.
#
# USAGE
#   oracle-locate.sh              # map every oracle to the account holding it
#   oracle-locate.sh <uuid>       # locate one oracle

set -uo pipefail
WANT="${1:-}"

# Skips a profile named exactly "personal" by default. That was the filter's evident intent: the old
# pattern had lost its first letter (it read '^ersonal$') and so matched, and excluded, nothing.
# Set ORACLE_LOCATE_SKIP to another profile name to skip that one instead, or to an empty string to
# ask every profile.
SKIP="${ORACLE_LOCATE_SKIP-personal}"
PROFILES=$(ls ~/.notebooklm-mcp-cli/profiles 2>/dev/null | { if [ -n "$SKIP" ]; then grep -vxF -- "$SKIP"; else cat; fi; })
[ -z "$PROFILES" ] && { echo "No profiles exist. Run: nlm login --profile <name>"; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Asking each signed-in account what it holds..."
echo
for p in $PROFILES; do
  if out=$(nlm notebook list --profile "$p" 2>/dev/null) && [ -n "$out" ]; then
    acct=$(python3 -c "
import json,os
try:
    m=json.load(open(os.path.expanduser('~/.notebooklm-mcp-cli/profiles/$p/metadata.json')))
    print(m.get('email') or '(account not recorded)')
except Exception: print('(account not recorded)')
")
    n=$(printf '%s' "$out" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)
    printf "  %-12s WORKS  %-30s %s notebooks\n" "$p" "$acct" "$n"
    printf '%s' "$out" > "$TMP/$p.json"
  else
    printf "  %-12s cannot sign in — run: nlm login --profile %s\n" "$p" "$p"
  fi
done

echo
if [ -n "$WANT" ]; then
  echo "Looking for oracle $WANT:"
  for f in "$TMP"/*.json; do
    [ -e "$f" ] || continue
    p=$(basename "$f" .json)
    if python3 -c "
import json,sys
d=json.load(open('$f'))
hit=[x for x in d if x.get('id')=='$WANT']
sys.exit(0 if hit else 1)
"; then
      title=$(python3 -c "
import json
d=json.load(open('$f'))
print([x['title'] for x in d if x.get('id')=='$WANT'][0])
")
      echo "  FOUND on profile '$p' — \"$title\""
      echo "  Query it with: nlm notebook query $WANT \"your question\" --profile $p"
      exit 0
    fi
  done
  echo "  NOT found on any account that can currently sign in."
  echo "  Either it lives on an account that is not signed in, or the id is stale."
  exit 3
fi

echo "Every notebook reachable right now, and where it lives:"
for f in "$TMP"/*.json; do
  [ -e "$f" ] || continue
  p=$(basename "$f" .json)
  python3 -c "
import json
for x in json.load(open('$f')):
    print('  %-38s %-46s --profile %s' % (x['id'], x['title'][:44], '$p'))
"
done

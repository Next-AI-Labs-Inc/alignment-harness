#!/usr/bin/env bash
# One command that checks the plugin is shippable:
#   1. every script parses
#   2. the /coherence-check skill matches the text the hook injects
#   3. the private-data scanner passes
#   3b. no skill file contains $1-style positional arguments (Claude Code replaces them with the user's words)
#   3c. a skill or doc that names a setup checkpoint, setting, alignment-harness subcommand or docs page
#       that does not exist is repaired where one real thing is plainly meant, and otherwise reported in
#       plain words. This step heals; it never fails the build (the real lists are read each run)
#   4. `claude plugin validate` passes (plugin + marketplace)
#   5. the hook smoke test passes (5b: the first-session calibration test)
#   6. install → list → uninstall works in a throwaway HOME, and uninstall
#      leaves no plugin files behind
# Usage: bash scripts/verify-build.sh [path-to-claude-binary]
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CL="${1:-${CLAUDE_BIN:-}}"
# Pick a Claude Code binary that actually runs. Order: one you pass in, then `claude` on the PATH
# if it answers --version, then the newest copy bundled inside the Claude desktop app. The app keeps
# it at claude-code/<version>/<hash>/claude.app/Contents/MacOS/claude (older builds skipped the
# <hash> folder), so both layouts are searched. A `claude` on the PATH can be installed but broken
# (for example its native binary never downloaded), which is why it is tested, not just found.
claude_runs() { [ -n "$1" ] && [ -x "$1" ] && "$1" --version >/dev/null 2>&1; }
if [ -z "$CL" ]; then
  PATH_CLAUDE="$(command -v claude 2>/dev/null || true)"
  if claude_runs "$PATH_CLAUDE"; then
    CL="$PATH_CLAUDE"
  else
    APP_BASE="$HOME/Library/Application Support/Claude/claude-code"
    while IFS= read -r cand; do
      if claude_runs "$cand"; then CL="$cand"; fi   # sorted oldest to newest, so the last one that runs wins
    done < <(printf '%s\n' "$APP_BASE"/*/claude.app/Contents/MacOS/claude "$APP_BASE"/*/*/claude.app/Contents/MacOS/claude | sort -V)
  fi
  [ -z "$CL" ] && echo "No working claude binary found on the PATH or in the Claude desktop app. Pass one: bash scripts/verify-build.sh /path/to/claude (or set CLAUDE_BIN). Steps 4 and 6 will fail without it."
fi
FAILS=0
step() { echo; echo "== $1"; }
res()  { if [ "$1" -eq 0 ]; then echo "PASS: $2"; else echo "FAIL: $2"; FAILS=$((FAILS+1)); fi; }

step "1. scripts parse"
e=0; for f in "$ROOT"/lib/*.js "$ROOT"/lib/scorer/*.js "$ROOT"/hooks/*.js "$ROOT"/scripts/*.js "$ROOT"/bin/alignment-harness; do node --check "$f" || e=1; done
for f in $(find "$ROOT/mcp" "$ROOT/skills" -name '*.js' -not -path '*/node_modules/*' 2>/dev/null); do node --check "$f" || e=1; done
for f in $(find "$ROOT/skills" "$ROOT/hooks" -name '*.sh' 2>/dev/null); do bash -n "$f" || e=1; done
res $e "all JavaScript parses"

step "2. coherence text in sync"
node "$ROOT/scripts/build-coherence-skill.js" --check; res $? "skill matches prompts/coherence-ritual.txt"

step "3. private-data scan"
node "$ROOT/scripts/scan-private.js" "$ROOT" | tail -1; res "${PIPESTATUS[0]}" "no private data"

step "3b. no \$1-style positional arguments in skills"
node "$ROOT/scripts/check-skill-arguments.js" --self-test >/dev/null; res $? "the check itself catches \$1, \${1} and awk fields"
node "$ROOT/scripts/check-skill-arguments.js" "$ROOT"; res $? "no skill file contains \$1-style positional arguments"

step "3c. pointers to setup steps, settings, commands or docs pages that do not exist (repaired or reported; never fails the build)"
node "$ROOT/scripts/check-dangling-references.js" --self-test | grep -E "NOTICE|^self-test"; res 0 "the pointer check ran its self-test (any NOTICE line above is the check itself needing a look)"
node "$ROOT/scripts/check-dangling-references.js" "$ROOT"; res 0 "pointers checked: anything repaired or needing a person is listed above, and the build carries on"

step "4. claude plugin validate ($([ -n "$CL" ] && "$CL" --version 2>/dev/null))"
if [ -z "$CL" ]; then res 1 "manifest and marketplace validate (no working claude binary)"; else
"$CL" plugin validate "$ROOT/.claude-plugin/plugin.json" >/dev/null 2>&1; a=$?
"$CL" plugin validate "$ROOT/.claude-plugin/marketplace.json" >/dev/null 2>&1; b=$?
"$CL" plugin validate "$ROOT" 2>&1 | tail -2
res $((a+b)) "manifest and marketplace validate"
fi

step "5. hook smoke test"
SMOKE="${SMOKE_TEST:-$ROOT/plugin-dev/tests-smoke/smoke.sh}"
if [ -f "$SMOKE" ]; then PLUGIN_DIR="$ROOT" bash "$SMOKE" | tail -1; res "${PIPESTATUS[0]}" "smoke test"; else echo "SKIP: smoke test not found (it lives outside the shipped plugin, in plugin-dev/)"; fi

step "5b. calibration test (made-up sessions, fake model)"
CAL="$ROOT/plugin-dev/tests-smoke/calibration-test.js"
if [ -f "$CAL" ]; then PLUGIN_DIR="$ROOT" node "$CAL" | tail -1; res "${PIPESTATUS[0]}" "calibration offer, picking, notes, map, plans, fail-open"; else echo "SKIP: calibration test not found (it lives outside the shipped plugin, in plugin-dev/)"; fi

step "6. install into a throwaway HOME"
T="$(mktemp -d)"
( cd "$T" && HOME="$T" CLAUDE_CONFIG_DIR="$T/.claude" "$CL" plugin marketplace add "$ROOT" >/dev/null 2>&1 \
  && HOME="$T" CLAUDE_CONFIG_DIR="$T/.claude" "$CL" plugin install alignment-harness@alignment-harness >/dev/null 2>&1 \
  && HOME="$T" CLAUDE_CONFIG_DIR="$T/.claude" "$CL" plugin list 2>/dev/null | grep -q "alignment-harness@alignment-harness" ); i=$?
res $i "installs and lists as enabled"
( cd "$T" && HOME="$T" CLAUDE_CONFIG_DIR="$T/.claude" "$CL" plugin uninstall alignment-harness@alignment-harness >/dev/null 2>&1 \
  && HOME="$T" CLAUDE_CONFIG_DIR="$T/.claude" "$CL" plugin marketplace remove alignment-harness >/dev/null 2>&1 ); u=$?
problems=""
grep -q "alignment-harness" "$T/.claude/settings.json" 2>/dev/null && problems="$problems settings.json still mentions it;"
grep -q "alignment-harness" "$T/.claude/plugins/installed_plugins.json" 2>/dev/null && problems="$problems still registered;"
ls -d "$T/.claude/plugins/data/"alignment-harness* >/dev/null 2>&1 && problems="$problems data folder left;"
# Claude Code keeps the cached copy marked .orphaned_at and deletes it itself later; it is inactive.
for v in "$T/.claude/plugins/cache/alignment-harness/alignment-harness/"*/; do
  [ -d "$v" ] && [ ! -f "$v/.orphaned_at" ] && problems="$problems cache copy not marked orphaned;"
done
if [ $u -eq 0 ] && [ -z "$problems" ]; then res 0 "uninstall + marketplace remove leave nothing active (cache copy marked for Claude Code's own cleanup)"; else res 1 "uninstall:${problems:- exit $u}"; fi
rm -rf "$T"

echo
if [ "$FAILS" -eq 0 ]; then echo "VERIFY: ALL PASSED"; else echo "VERIFY: $FAILS FAILED"; fi
[ "$FAILS" -eq 0 ]

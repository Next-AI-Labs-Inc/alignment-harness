#!/usr/bin/env bash
# Gives the harness its own copy of Node.js, so a computer without Node can run it.
#
#   bash "<plugin folder>/scripts/setup-node.sh"
#
# What it does, in order:
#   1. Works out which computer this is (Mac, Linux, or Windows with Git Bash; Intel or ARM).
#   2. Downloads the official list of Node.js files from nodejs.org, and the one file for
#      this computer (about 30-50 MB).
#   3. Checks the download's fingerprint (SHA-256) against that official list. If it doesn't
#      match, it stops and keeps nothing.
#   4. Unpacks it into ~/.alignment-harness/node. Nothing else on the computer changes: no
#      admin password, no system folders, no changes to your shell settings.
# The harness uses that copy from the next Claude Code session. To remove it, delete
# ~/.alignment-harness. Run it again any time to replace it with the newest Node 24.
set -euo pipefail

LINE="${ALIGNMENT_HARNESS_NODE_LINE:-latest-v24.x}"   # Node's long-term-support line
BASE="https://nodejs.org/dist/$LINE"
DEST="$HOME/.alignment-harness/node"

say() { printf '%s\n' "$*"; }
fail() { say "Node setup stopped: $*"; exit 1; }

command -v curl >/dev/null 2>&1 || fail "curl isn't available to download with."

case "$(uname -s)" in
  Darwin) os=darwin; ext=tar.gz ;;
  Linux) os=linux; ext=tar.gz ;;
  MINGW*|MSYS*|CYGWIN*) os=win; ext=zip ;;
  *) fail "this kind of computer ($(uname -s)) isn't one Node publishes a ready-made copy for." ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch=arm64 ;;
  x86_64|amd64) arch=x64 ;;
  *) fail "this processor ($(uname -m)) isn't one Node publishes a ready-made copy for." ;;
esac

WORK="$(mktemp -d "${TMPDIR:-/tmp}/alignment-harness-node.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

say "Finding the newest Node.js ($LINE) for $os-$arch on nodejs.org..."
curl -fsSL "$BASE/SHASUMS256.txt" -o "$WORK/SHASUMS256.txt" || fail "couldn't reach nodejs.org."
entry="$(grep -E "  node-v[0-9.]+-$os-$arch\.$ext\$" "$WORK/SHASUMS256.txt" | head -1 || true)"
[ -n "$entry" ] || fail "nodejs.org lists no $os-$arch file in $LINE."
want="${entry%%  *}"; file="${entry##*  }"

say "Downloading $file..."
curl -fSL --progress-bar "$BASE/$file" -o "$WORK/$file" || fail "the download didn't finish."

if command -v shasum >/dev/null 2>&1; then got="$(shasum -a 256 "$WORK/$file" | cut -d' ' -f1)"
elif command -v sha256sum >/dev/null 2>&1; then got="$(sha256sum "$WORK/$file" | cut -d' ' -f1)"
else fail "there's no tool here to check the download's fingerprint, so it wasn't used."; fi
[ "$got" = "$want" ] || fail "the download's fingerprint doesn't match nodejs.org's list, so it wasn't used."
say "Fingerprint matches nodejs.org's list."

mkdir -p "$WORK/unpacked"
if [ "$ext" = zip ]; then
  if command -v unzip >/dev/null 2>&1; then unzip -q "$WORK/$file" -d "$WORK/unpacked"
  else powershell.exe -NoProfile -Command "Expand-Archive -LiteralPath '$(cygpath -w "$WORK/$file")' -DestinationPath '$(cygpath -w "$WORK/unpacked")'" >/dev/null; fi
else
  tar -xzf "$WORK/$file" -C "$WORK/unpacked"
fi
src="$(find "$WORK/unpacked" -mindepth 1 -maxdepth 1 -type d | head -1)"
[ -n "$src" ] || fail "the download unpacked to nothing."

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST.old"; [ -d "$DEST" ] && mv "$DEST" "$DEST.old"
mv "$src" "$DEST"; rm -rf "$DEST.old"

if [ "$os" = win ]; then NODE="$DEST/node.exe"; else NODE="$DEST/bin/node"; fi
ver="$("$NODE" --version)" || fail "the unpacked Node didn't start."
say ""
say "Done: Node.js $ver is in $DEST."
say "Start a new Claude Code session and the alignment harness is on. (It stays off in this one,"
say "because Claude's own commands here were started before Node existed.)"

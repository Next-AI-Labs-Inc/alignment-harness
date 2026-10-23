#!/bin/bash
# Start of every sandbox run: fresh persona, then a shell in their repo. On exit, keep only the sign-in.
/usr/local/bin/seed-persona.sh
save_signin() {
  if [ ! -w /auth ]; then echo "  (could not save your sign-in: /auth is not writable — you will be asked to sign in again)"; return 0; fi
  [ -f "$HOME/.claude/.credentials.json" ] && cp "$HOME/.claude/.credentials.json" /auth/.credentials.json
  [ -f "$HOME/.claude.json" ] && cp "$HOME/.claude.json" /auth/.claude.json
  return 0
}
trap save_signin EXIT
cd "$HOME/work/acme-billing"
cat <<'MSG'

  You are Dana, an experienced Claude Code user. This machine is sealed off from your real one.
  The harness is available at /opt/alignment-harness (read-only). Install it the way a new user would:

    claude plugin marketplace add /opt/alignment-harness
    claude plugin install alignment-harness@alignment-harness
    claude

  First run only: Claude asks you to sign in (open the link, paste the code). The sign-in is kept for next time.
  Type exit to leave. Every run starts Dana fresh.

MSG
if [ "$#" -gt 0 ]; then "$@"; else bash -i; fi

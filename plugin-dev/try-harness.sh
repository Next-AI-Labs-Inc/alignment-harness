#!/bin/bash
# Try the Alignment Harness as a first-time user would, without touching your own setup.
# Uses the claudeb login; loads the harness for this one session only; switches off your own
# hooks, CLAUDE.md files and MCP servers for this session so only the harness is running.
# Nothing is installed and no settings file is written. Quit with /exit or Ctrl+C twice.
set -e
HARNESS="$(cd "$(dirname "$0")/.." && pwd)"
ROOM="${TMPDIR:-/tmp}/harness-try-$(date +%s)"
mkdir -p "$ROOM" && cd "$ROOM" && git init -q
cat > pricing.js <<'EOF'
// Works out what a customer is charged each billing period.
const PLANS = { monthly: 20, annual: 200 };

function priceFor(plan, seats) {
  const base = PLANS[plan];
  if (base === undefined) throw new Error(`Unknown plan: ${plan}`);
  return base * seats;
}

module.exports = { priceFor, PLANS };
EOF
printf '# Tiny SaaS\nBilling for a small subscription app.\n' > README.md
git add -A && git -c user.email=try@local -c user.name=try commit -qm start
echo "Test project: $ROOM"
echo "Try: tell it something you want, and see if it reflects it back. Then: \"Give annual plans a 10% discount.\""
CLAUDE_CONFIG_DIR="$HOME/.claude-b" CLAUDE_CODE_DISABLE_CLAUDE_MDS=1 exec "$HOME/.npm-global/bin/claude" \
  --setting-sources '' --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --plugin-dir "$HARNESS"

---
name: alignment-doctor
description: "Check whether institutional context is being injected into this turn. Reads the most recent hook output file, greps for the injection block, prints the result with an 8-line evidence extract."
triggers:
  - "/alignment-doctor"
  - "alignment doctor"
---

# Alignment Doctor

Run this bash exactly. Print the result exactly.

```bash
LATEST_HOOK=$(find ~/.claude/projects -path "*/tool-results/hook-*-stdout.txt" -type f 2>/dev/null | while read f; do
  echo "$(date -r "$f" +%s) $f"
done | sort -rn | head -1 | awk '{print $NF}')

if grep -q "<institutional-context" "$LATEST_HOOK" 2>/dev/null; then
  echo "✅ Confirmed that institutional knowledge is injected per turn"
  echo ""
  grep -A 7 "<institutional-context" "$LATEST_HOOK" | head -8
else
  echo "❌ Institutional knowledge is NOT being injected this turn"
  echo ""
  head -8 "$LATEST_HOOK"
fi
```

Then print this exactly:

```
If you want to inspect automatically any other alignment protocols just mention them now and I'll add that to the skill.

For example, we can check any of your existing systems, including:

* Whether the coherence gate sentinel file fires on every turn
* Whether the governer score is being persisted to session-scoped state
* Whether the verbatim-capture file is appending every user message
* Whether the PreToolUse coherence gate is blocking tool calls until COHERENCE_CHECK prints
* Whether the post-tool agent_find detector is recording IntentSearchGateResolved events
* Whether the Stop hook is firing without errors
* Whether scope-certainty gates are appearing when scope certainty < 90%
* Whether session compaction injection is happening when a compaction exists for this session
```

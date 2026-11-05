#!/usr/bin/env bash
# Smoke test: drives every hook with realistic inputs in a throwaway data
# folder and checks each gate does what its docs promise. No network, no
# Claude session, touches nothing outside a temp folder.
#   bash plugin-dev/tests-smoke/smoke.sh   (PLUGIN_DIR=<path> to test another copy)
set -u
ROOT="${PLUGIN_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
TMP="$(mktemp -d)"
export CLAUDE_PLUGIN_ROOT="$ROOT" CLAUDE_PLUGIN_DATA="$TMP/data"
SID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
TP="$TMP/$SID.jsonl"; : > "$TP"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ok   $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL $1"; }
hook() { bash "$ROOT/hooks/run.sh" "$1"; }
cli()  { CLAUDE_CODE_SESSION_ID="$1" node "$ROOT/bin/alignment-harness" "${@:2}"; }
evt()  { printf '{"session_id":"%s","transcript_path":"%s"%s}' "$SID" "$TP" "$1"; }

echo "session start"
out=$(evt ',"hook_event_name":"SessionStart","source":"startup"' | hook session-start)
[[ "$out" == *"<alignment-harness>"* ]] && ok "announces itself" || bad "no session note"
[ -f "$CLAUDE_PLUGIN_DATA/switches.jsonc" ] && ok "switches file seeded" || bad "no switches file"

echo "understanding loop"
out=$(evt ',"prompt":"please change how the subscription is charged each month"' | hook user-prompt)
[[ "$out" == *"<user-message"* ]] && ok "wraps the person's words" || bad "no user-message"
[[ "$out" == *"not scored yet"* ]] && ok "says unscored, not a number" || bad "score banner wrong"
[[ "$out" == *"Keyword hint only"* ]] && ok "provisional guess labelled as a hint" || bad "no provisional label"
[ ${#out} -lt 6000 ] && ok "per-message context stays under 6 KB (${#out} chars)" || bad "per-message context too big: ${#out}"
[[ "$out" == *"Claude Code provided in that notification"* ]] && ok "the overflow line is the author's sentence, word for word" || bad "the overflow line was reworded"
# The stricter variant's line is built only from the author's own sentences in that variant's file.
SV=77777777-cccc-dddd-eeee-ffffffffffff; mkdir -p "$CLAUDE_PLUGIN_DATA/state/coherence"; echo per-item-96-escalation > "$CLAUDE_PLUGIN_DATA/state/coherence/variant-$SV"
outv=$(printf '{"session_id":"%s","transcript_path":"%s","prompt":"please change how the subscription is charged each month"}' "$SV" "$TMP/$SV.jsonl" | hook user-prompt)
V96="$ROOT/prompts/coherence-questions.per-item-96-escalation.txt"; vok=1
for s in "print your honest certainty as a percentage after it." "For any item below 96%, run agent_find once on that specific thing and re-rank honestly." "— Run /ask {the specific unclear thing}."; do
  [[ "$outv" == *"$s"* ]] && grep -qF -- "$s" "$V96" || vok=0
done
[ $vok -eq 1 ] && [[ "$outv" != *"This session uses the stricter wording"* ]] && ok "the stricter variant's line is the author's sentences, not a paraphrase" || bad "the stricter variant's line is not word for word"
[ -f "$CLAUDE_PLUGIN_DATA/state/coherence/required-$SID" ] && ok "coherence gate armed" || bad "gate not armed"
out=$(evt ',"prompt":"ok"' | hook user-prompt); [ -z "$out" ] && ok "trivial ack skipped" || bad "ack not skipped"
out=$(evt ',"prompt":"what are you talking about, I do not understand"' | hook user-prompt)
[[ "$out" == *"calibrate"* ]] && ok "confusion → /calibrate" || bad "no calibrate"
# Calibrate false-positive fix (docs/build/calibrate.md section 3, item 2):
# a confusion phrase the person is QUOTING (pasting back an agent's reply,
# or reported speech in quotes) must NOT fire the trigger — only the
# person's own typed words should. Before the fix this pasted block, which
# never claims the person themselves is confused, still triggered.
PASTED_CONFUSION='Here is the assistant reply I got: "I have no idea what you mean by that, could you clarify the requirements further?" Can you help me understand this?'
out=$(evt ",\"prompt\":$(printf '%s' "$PASTED_CONFUSION" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')" | hook user-prompt)
[[ "$out" != *"calibrate"* ]] && ok "pasted/quoted confusion phrase does not fire /calibrate (false-positive fix)" || bad "false-positive fix regressed: pasted quote fired /calibrate"

echo "coherence gate"
evt ',"tool_name":"Read","tool_input":{"file_path":"/x"}' | hook pre-tool >/dev/null 2>&1; [ $? -eq 0 ] && ok "reading never waits" || bad "read blocked"
evt ',"tool_name":"Skill","tool_input":{"skill":"x"}' | hook pre-tool >/dev/null 2>&1; [ $? -eq 0 ] && ok "skills never wait" || bad "skill blocked"
evt ',"tool_name":"Edit","tool_input":{"file_path":"/x.js"}' | hook pre-tool >/dev/null 2>"$TMP/e"; [ $? -eq 2 ] && ok "edit waits for the check" || bad "edit not blocked"
grep -q "attest --session" "$TMP/e" && ok "block tells how to attest" || bad "no attest instruction"
grep -q "the most critical function of your existence" "$TMP/e" && grep -q "When this does not fit: the check is for a person speaking to you" "$TMP/e" && ok "coherence block: the author's words, plus when it does not fit" || bad "coherence block lacks the author's words or its limits"
printf '{"session_id":"%s","transcript_path":"%s/agent-sub.jsonl","tool_name":"Bash","tool_input":{"command":"npm install"}}' "$SID" "$TMP" | hook pre-tool >/dev/null 2>"$TMP/e"
grep -q "Coherence check not completed" "$TMP/e" && bad "subagent blocked by coherence gate" || ok "subagents pass the coherence gate"

# Class A: a read-only harness call with a QUOTED program path, chained with
# | head / ; echo, must be classified as read-only (isReadOnlyBash) same as
# the unquoted form — quoting a path or piping to head doesn't write
# anything. Before the fix, stripQuoted() erased the quoted path before
# READONLY_PIECE ever saw "alignment-harness" in it, so this exact shape was
# wrongly blocked as a change while pressing the coherence gate.
QUOTED_HARNESS_CMD="node \"$ROOT/bin/alignment-harness\" status 2>&1 | head -30; echo ---"
evt ",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":$(printf '%s' "$QUOTED_HARNESS_CMD" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')}" | hook pre-tool >/dev/null 2>&1
[ $? -eq 0 ] && ok "quoted-path + piped harness read-only call is not blocked (Class A)" || bad "Class A regression: quoted-path/piped read-only call blocked"
# Negative control: a quoted-path WRITE (not a harness call, not read-only)
# must still be blocked — the fix only recognizes the harness's own node
# invocation, it does not make every quoted-path command read-only.
evt ",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"node \\\"/tmp/some-other-script.js\\\" > /tmp/out.txt\"}" | hook pre-tool >/dev/null 2>&1
[ $? -eq 2 ] && ok "quoted-path write to an unrelated script is still blocked (Class A negative control)" || bad "Class A negative control regressed: an unrelated write was let through"

# Class B: 87 skills' first move was to save into the harness's own records
# folder — `alignment-harness records <kind>` (prints the folder, always
# allowed) followed by a raw shell redirect to actually write it. The
# redirect is an ordinary write the gate can't tell apart from any other
# file write, so it was blocked before the agent had done anything the gate
# recognizes as understanding — harness bookkeeping with no user-facing
# effect, failing for an unrelated reason. Fix: `store add <kind> --json
# '{...}'` (plugin/lib/store.js, already documented in
# plugin/docs/local-store.md) is a single self-contained command with no
# pipe/redirect, so it can be recognized and allowed the same way
# attest/score/status already are.
evt ',"tool_name":"Bash","tool_input":{"command":"alignment-harness store add ledger --json \"{\\\"note\\\":\\\"smoke test\\\"}\""}' | hook pre-tool >/dev/null 2>&1
[ $? -eq 0 ] && ok "store add (harness bookkeeping save) is not blocked while the gate is armed (Class B)" || bad "Class B regression: store add blocked while gate armed"
# Negative control: a raw heredoc/redirect save (the OLD broken pattern) must
# still be blocked — the fix gives skills a working alternative, it does not
# make an arbitrary file write safe.
evt ',"tool_name":"Bash","tool_input":{"command":"cat > /tmp/some-record.json << Q\n{\"ok\":true}\nQ"}' | hook pre-tool >/dev/null 2>&1
[ $? -eq 2 ] && ok "a raw heredoc save is still blocked (Class B negative control)" || bad "Class B negative control regressed: an arbitrary write was let through"

# Class B, round 2: the 93 skills that say "alignment-harness records <kind>"
# (prints the folder) followed by a raw `cat > ... <<EOF` heredoc were never
# actually repointed at `store add` — they still use the old pattern, so the
# gate mechanism above didn't help them. The fix skills now use instead:
# `alignment-harness record <kind> [--name x] <<'EOF' ... EOF` (reads the
# record text from stdin, writes it inside records/<kind> itself), which
# this smoke test drives exactly as a person typing the skill as their whole
# message would — a heredoc chained to the record command, nothing else.
# Each case below gets its OWN session id, freshly armed: the coherence
# gate's own block-then-downgrade-to-reminder behavior (see "3 blocks then
# reminder" above) means a negative control run on a session that already
# used up its block budget in an earlier test would wrongly read as "passed"
# by going through on the DOWNGRADE, not because the check recognized it as
# safe — a false pass hiding as a true one.
S7=77777777-bbbb-cccc-dddd-eeeeeeeeeeee; TP7="$TMP/$S7.jsonl"; : > "$TP7"
arm7() { printf '{"session_id":"%s","transcript_path":"%s","prompt":"please change how the subscription is charged"}' "$S7" "$TP7" | hook user-prompt >/dev/null; }
evt7() { printf '{"session_id":"%s","transcript_path":"%s"%s}' "$S7" "$TP7" "$1"; }

arm7
RECORD_HEREDOC_CMD=$(printf 'alignment-harness record scope-declarations <<'"'"'EOF'"'"'\n{"sessionId":"abc","summary":"smoke test"}\nEOF')
evt7 ",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":$(printf '%s' "$RECORD_HEREDOC_CMD" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')}" | hook pre-tool >/dev/null 2>&1
[ $? -eq 0 ] && ok "record <kind> <<EOF heredoc save is not blocked while the gate is armed (Class B, typed-skill save)" || bad "Class B regression: record heredoc blocked while gate armed"

# Skipping the person's permission prompt is only for the harness's own record command. Anything in front
# of it, or a different file that happens to be named alignment-harness, must get the normal prompt.
# (Before 4 Nov 2026 both of these were approved without asking.)
asks_person() { printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))' | { read -r J; evt7 ",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":$J}" | hook pre-tool 2>/dev/null; } | grep -q '"permissionDecision":"allow"' && return 1 || return 0; }
asks_person "$(printf "node x.js; rm -rf ~/nothing-here; alignment-harness record foo <<'EOF'\nhi\nEOF")" && ok "a command chained in front of record still asks the person" || bad "SECURITY: a command chained in front of record skipped the permission prompt"
asks_person "$(printf "node /tmp/other/alignment-harness record foo <<'EOF'\nhi\nEOF")" && ok "a different file named alignment-harness still asks the person" || bad "SECURITY: a look-alike alignment-harness file skipped the permission prompt"
asks_person "$(printf "alignment-harness record foo <<'EOF'\nhi\nEOF")" && bad "the harness's own record command now asks every time (over-tightened)" || ok "the harness's own record command still runs without a prompt"

S7=88888888-bbbb-cccc-dddd-eeeeeeeeeeee; TP7="$TMP/$S7.jsonl"; : > "$TP7"; arm7
# The Write tool, targeted directly at a path inside the harness's own
# records folder, is the same bookkeeping through a different tool — several
# skills use Write instead of a shell redirect for this exact save step.
RECORDS_WRITE_TARGET="$CLAUDE_PLUGIN_DATA/records/smoke-write-test/rec1.json"
evt7 ",\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$RECORDS_WRITE_TARGET\",\"content\":\"{}\"}" | hook pre-tool >/dev/null 2>&1
[ $? -eq 0 ] && ok "Write into the harness's own records folder is not blocked while the gate is armed" || bad "Write into records folder blocked while gate armed"

S7=99999999-bbbb-cccc-dddd-eeeeeeeeeeee; TP7="$TMP/$S7.jsonl"; : > "$TP7"; arm7
# Negative control: a Write that merely LOOKS like it targets the records
# folder by string prefix, but actually escapes it via "..", must still be
# blocked — the fix recognizes real paths inside the folder, not path
# strings that start with the right substring.
ESCAPE_TARGET="$CLAUDE_PLUGIN_DATA/records/smoke-write-test/../../escape.json"
evt7 ",\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$ESCAPE_TARGET\",\"content\":\"{}\"}" | hook pre-tool >/dev/null 2>&1
[ $? -eq 2 ] && ok "a Write that escapes the records folder via .. is still blocked (records-folder negative control)" || bad "records-folder negative control regressed: an escaping write was let through"

S7=aaaaaaaa-cccc-cccc-dddd-eeeeeeeeeeee; TP7="$TMP/$S7.jsonl"; : > "$TP7"; arm7
# Negative control: `record` chained with a second command (not a pure
# heredoc-to-record-and-nothing-else) must still be blocked — the fix
# recognizes the ONE shape a skill's save step actually needs, not "any
# command that mentions record somewhere in it."
CHAINED_RECORD_CMD=$(printf 'alignment-harness record foo <<EOF\n{"a":1}\nEOF\n; rm -rf /tmp/smoke-test-should-not-run')
evt7 ",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":$(printf '%s' "$CHAINED_RECORD_CMD" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')}" | hook pre-tool >/dev/null 2>&1
[ $? -eq 2 ] && ok "record heredoc chained with a second command is still blocked (record negative control)" || bad "record negative control regressed: a chained command was let through"

# A compliant agent reads the full ritual once per session before its attestation counts
# (coherenceGate.requireRitualReadOncePerSession); its own tests are in "full ritual, once per session".
evt ",\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$ROOT/prompts/coherence-ritual.txt\"}" | hook pre-tool >/dev/null 2>&1
sleep 1; touch "$CLAUDE_PLUGIN_DATA/state/coherence/done-$SID"

echo "changes that look like reads"
# Each of these starts with a read-only word but changes something. Own session, so earlier
# blocks can't make a pass come from the gate stepping back.
S9=99999999-bbbb-cccc-dddd-eeeeeeeeeeee; TP9="$TMP/$S9.jsonl"; : > "$TP9"
arm9() { printf '{"session_id":"%s","transcript_path":"%s","prompt":"tidy up the release branches please"}' "$S9" "$TP9" | hook user-prompt >/dev/null; }
bash9() { printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Bash","tool_input":{"command":%s}}' "$S9" "$TP9" "$(printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')" | hook pre-tool >/dev/null 2>&1; }
for c in 'git branch -a' 'git branch --show-current' 'git remote -v' "sed -n '1,20p' f | head -5"; do
  arm9; bash9 "$c"; [ $? -eq 0 ] && ok "read passes: $c" || bad "read blocked: $c"
done
for c in 'git branch release-2' 'git branch -D old' 'git remote add fork url' "sed -n -i '' 's/a/b/p' f" "sed -n 'w out.txt' f" 'find . -name x -fprint out'; do
  arm9; bash9 "$c"; [ $? -eq 2 ] && ok "change waits: $c" || bad "change passed as a read: $c"
done

echo "full ritual, once per session"
# Fresh session; each message re-arms the gate and resets its block count.
S8=88888888-bbbb-cccc-dddd-eeeeeeeeeeee; TP8="$TMP/$S8.jsonl"; : > "$TP8"
RITUAL="$ROOT/prompts/coherence-ritual.txt"
arm8() { printf '{"session_id":"%s","transcript_path":"%s","prompt":"please change how the subscription is charged"}' "$S8" "$TP8" | hook user-prompt >/dev/null; }
evt8() { printf '{"session_id":"%s","transcript_path":"%s"%s}' "$S8" "$TP8" "$1"; }
edit8() { evt8 ',"tool_name":"Edit","tool_input":{"file_path":"/x.js"}' | hook pre-tool >/dev/null 2>"$TMP/e8"; }
arm8
edit8; [ $? -eq 2 ] && grep -q "coherence_check_per_message_ritual" "$TMP/e8" && ok "a blocked agent sees the full ritual" || bad "block message lacks the full ritual"
sleep 1; touch "$CLAUDE_PLUGIN_DATA/state/coherence/done-$S8"
edit8; [ $? -eq 2 ] && grep -q "read the full ritual once" "$TMP/e8" && ok "attestation waits for one full read of the ritual" || bad "attestation counted without reading the ritual"
grep -q "$RITUAL" "$TMP/e8" && grep -q "coherence_check_per_message_ritual" "$TMP/e8" && ok "that block names the file and carries its text" || bad "ritual-read block lacks path or text"
evt8 ",\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$RITUAL\",\"limit\":3}" | hook pre-tool >/dev/null 2>&1
edit8; [ $? -eq 2 ] && grep -q "read the full ritual once" "$TMP/e8" && ok "a partial read doesn't count" || bad "partial read counted"
evt8 ",\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$RITUAL\"}" | hook pre-tool >/dev/null 2>&1
edit8; grep -q "read the full ritual once" "$TMP/e8" && bad "full read not counted" || ok "a full read counts; the attestation stands without re-attesting"
grep -q "governer" "$TMP/e8" && ok "the edit moves on to the governer gate" || bad "edit did not reach the governer gate"
arm8; sleep 1; touch "$CLAUDE_PLUGIN_DATA/state/coherence/done-$S8"
edit8; grep -q "read the full ritual once" "$TMP/e8" && bad "re-read demanded on a later message" || ok "later messages don't ask for it again"
# Fixture ids use one repeated character per group, which is what the private-data scanner treats as an obvious placeholder.
S10=66666666-bbbb-cccc-dddd-eeeeeeeeeeee; TP10="$TMP/$S10.jsonl"; : > "$TP10"
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Bash","tool_input":{"command":"cat \\"%s\\""}}' "$S10" "$TP10" "$RITUAL" | hook pre-tool >/dev/null 2>&1
[ -f "$CLAUDE_PLUGIN_DATA/state/coherence/ritual-read-$S10" ] && ok "a plain cat counts, even with no check pending" || bad "cat of the ritual not counted"

echo "the author's gate rulings (2026-10-17)"
# Each item gets its own fresh session. gs = new session that has read the full ritual once; garm = the user
# speaks; gsay = the agent's visible text; gedit = an edit (a changing tool); gread = a read.
gs()    { GS=$1; GTP="$TMP/$GS.jsonl"; : > "$GTP"; printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Read","tool_input":{"file_path":"%s"}}' "$GS" "$GTP" "$RITUAL" | hook pre-tool >/dev/null 2>&1; }
garm()  { printf '{"session_id":"%s","transcript_path":"%s","prompt":"%s"}' "$GS" "$GTP" "${1:-please change how the subscription is charged}" | hook user-prompt > "$TMP/gup"; sleep 1; }
gsay()  { node -e 'const [f,t]=process.argv.slice(1);require("fs").appendFileSync(f,JSON.stringify({type:"assistant",timestamp:new Date().toISOString(),message:{role:"assistant",content:[{type:"text",text:t}]}})+"\n")' "$GTP" "$1"; }
gedit() { printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Edit","tool_input":{"file_path":"/x.js"}}' "$GS" "$GTP" | hook pre-tool >/dev/null 2>"$TMP/ge"; }
gread() { printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Read","tool_input":{"file_path":"/x.js"}}' "$GS" "$GTP" | hook pre-tool >/dev/null 2>&1; }
gstop() { printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"%s"}' "$GS" "$GTP" "${1:-Summary.}" | hook stop >/dev/null 2>"$TMP/gst"; }
CHECK_TRUE=$'COHERENCE_CHECK\nMy sense of your intent: change the charge (90%).\nANY_NEW_SCOPE_INDICATED = TRUE'
CHECK_FALSE=$'COHERENCE_CHECK\nMy sense of your intent: go ahead (95%).\nANY_NEW_SCOPE_INDICATED = FALSE'

# 1. The end-of-turn hand-back is a reminder, never a block; it reaches the agent once, next turn.
gs 11111111-aaaa-bbbb-cccc-dddddddddddd
cli $GS score --task "add a settings toggle" --category feature --ac 5 --hp 5 --ew 5 >/dev/null
printf '%s\n' '{"type":"assistant","timestamp":"2026-01-01T00:00:05Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"g1","name":"Bash","input":{"command":"npx jest a.test.js"}}]}}' '{"type":"user","timestamp":"2026-01-01T00:00:06Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"g1","content":"Tests: 2 passed, 2 total"}]}}' >> "$GTP"
gstop "Here is where it stands."; [ $? -eq 0 ] && ok "1. a turn that did real work without the hand-back still finishes" || bad "1. the hand-back blocked the finish"
garm "what's next"; grep -q "turn-end-reminder" "$TMP/gup" || grep -q "turn-end-reminder" "$CLAUDE_PLUGIN_DATA"/context/*.txt 2>/dev/null && ok "1. the next message puts the hand-back reminder in front of the agent" || bad "1. the reminder never reached the agent"
grep -q "What this is for" "$CLAUDE_PLUGIN_DATA"/context/*.txt "$TMP/gup" 2>/dev/null && ok "1. the reminder states what it is for and when it does not apply" || bad "1. the reminder states no intent"
garm "and after that"; ! grep -q "turn-end-reminder" "$TMP/gup" && [ ! -f "$CLAUDE_PLUGIN_DATA/state/coherence/turn-end-reminder-$GS.txt" ] && ok "1. it is shown once, not every message" || bad "1. the reminder repeats"

# 2. The proof gate has no give-up exit: "hard to run" is not a way out.
gs 22222222-aaaa-bbbb-cccc-dddddddddddd
printf '%s\n' '{"type":"assistant","timestamp":"2026-01-01T00:00:05Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"g2","name":"Edit","input":{"file_path":"/repo/src/billing.js","old_string":"a","new_string":"b"}}]}}' '{"type":"user","timestamp":"2026-01-01T00:00:06Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"g2","content":"ok"}]}}' >> "$GTP"
gstop "I changed the billing code."; [ $? -eq 2 ] && ok "2. edited code, ran nothing: sent back" || bad "2. not sent back"
grep -qi -E "cannot be run|say so .* and finish" "$TMP/gst" && bad "2. the give-up exit is back" || ok "2. no 'if this cannot be run, say so and finish' exit"
grep -q '"Hard to run" is not a reason to skip it' "$TMP/gst" && ok "2. the block says what it is for and that hard-to-run is no way out" || bad "2. the block states no intent"
grep -q "When this does not fit: only if what you edited does not run at all" "$TMP/gst" && grep -q '"Hard to run" never counts as not running' "$TMP/gst" && ok "2. the only way past is a file that does not run at all, said in one sentence" || bad "2. the block states no limits, or its limit lets hard-to-run through"

# 3. A broken proof check may be fixed only in the open; never silently, never loosened for failing.
gs 33333333-aaaa-bbbb-cccc-dddddddddddd
cli $GS score --task "change how a subscription is charged" --category payment --touches-user-state --impact-tier revenue --ac 7 --hp 8 --ew 9 >/dev/null
cli $GS contract add --intent "When charged, then the amount matches the plan" --verify "node -e 'process.exit(1)' --typo" >/dev/null
cli $GS contract replace 1 --verify "node -e 'process.exit(0)'" >/dev/null; [ $? -eq 1 ] && ok "3. replacing a check without saying why is refused" || bad "3. silent replace accepted"
cli $GS contract replace 1 --verify "node -e 'process.exit(0)'" --why "the old command had a stray flag" > "$TMP/gc"; grep -q "Tell the user in this reply" "$TMP/gc" && ok "3. a replaced check tells the agent to tell the user" || bad "3. replace output silent"
gstop; [ $? -eq 2 ] && grep -q "proof-check-changed" "$TMP/gst" && grep -q "It was:" "$TMP/gst" && grep -q "It is now:" "$TMP/gst" && ok "3. finishing after a changed check: sent back once to tell the user before and after" || bad "3. the change went untold"
grep -q "Never loosen a check because it fails" "$TMP/gst" && ok "3. the block says never to loosen a check because it fails" || bad "3. no loosening rule"
gstop; ! grep -q "proof-check-changed" "$TMP/gst" && ok "3. told once, then the normal contract check takes over" || bad "3. the change is re-raised every time"
cli $GS contract remove 1 >/dev/null; [ $? -eq 1 ] && ok "3. removing a check without saying why is refused" || bad "3. silent remove accepted"

# 4a. New scope is reflected back before work on it starts (score 40+), routed on the real score.
gs 44444444-aaaa-bbbb-cccc-dddddddddddd; garm; gsay "$CHECK_TRUE"
gedit; [ $? -eq 2 ] && grep -q "Cannot route this scope" "$TMP/ge" && ok "4. new scope with no score yet: told to score it, not to guess" || bad "4. unscored scope not routed"
grep -q "When this does not fit" "$TMP/ge" && ok "4. the no-score block says when it does not fit" || bad "4. the no-score block states no limits"
cli $GS score --task "add a settings toggle" --category feature --ac 5 --hp 5 --ew 5 >/dev/null
gedit; [ $? -eq 2 ] && grep -q "New scope detected but not reflected" "$TMP/ge" && grep -q "NEW_SCOPE_REFLECTED" "$TMP/ge" && ok "4. score 50, scope not restated: held until NEW_SCOPE_REFLECTED" || bad "4. unreflected scope passed"
grep -q "Alright! So you identified some possible new scope" "$TMP/ge" && grep -q "When this does not fit" "$TMP/ge" && ok "4. that block carries the author's scope text and says when it does not fit" || bad "4. scope block lacks the author's text or its limits"
gsay $'NEW_SCOPE_REFLECTED\nNEW_SCOPE_1\nWhen you save settings, the toggle stays as you left it.'
gedit; [ $? -eq 0 ] && ok "4. once restated, the work flows (no wait below 80)" || bad "4. reflected scope still held"
garm "also the second toggle"; gsay "$CHECK_TRUE"; gedit; [ $? -eq 0 ] && ok "4. a later scope this session refers to the routed score" || bad "4. re-blocked every scope"
# 4e. Stepping past when it plainly does not fit: a TRUE that was a mistake, corrected to FALSE with a reason,
# lets the work go on to the next gate (here the governer gate, since nothing is scored) instead of the scope block.
gs 44444444-dddd-bbbb-cccc-dddddddddddd; garm "how does the charge work"; gsay "$CHECK_TRUE"
gedit; grep -q "Cannot route this scope" "$TMP/ge" || bad "4e. setup: the scope block did not fire"
gsay $'No new scope after all: this message only asks how something works.\nANY_NEW_SCOPE_INDICATED = FALSE'
gedit; ! grep -q "Cannot route this scope" "$TMP/ge" && ! grep -q "New scope detected" "$TMP/ge" && grep -q "Governer has not scored this task" "$TMP/ge" && ok "4. a TRUE corrected to FALSE with a reason steps past the scope block" || bad "4. the corrected scope line did not step past the scope block"
# The partial check (the scope line missing) gets the author's own formatting block.
gs 44444444-cccc-bbbb-cccc-dddddddddddd; garm; gsay $'COHERENCE_CHECK\nMy sense of your intent: change the charge (90%).'
gedit; [ $? -eq 2 ] && grep -q "Do NOT stop work or await approval." "$TMP/ge" && grep -q "this gate must never cause you to stop working and hand control back" "$TMP/ge" && ok "4. a check with the scope line missing gets the author's formatting block" || bad "4. partial-check block is not the author's text"
# 4b. Inconsequential scope flows through without the restatement.
gs 44444444-eeee-bbbb-cccc-dddddddddddd; cli $GS score --task "fix a typo in a code comment" --category docs-only --ac 1 --hp 1 --ew 1 >/dev/null
garm "fix the typo"; gsay "$CHECK_TRUE"; gedit; [ $? -eq 0 ] && ok "4. score under 40 with no user impact: flows without stopping" || bad "4. inconsequential scope held"
# 4c. At 80+, name the stakes, print HIGHEST_LEVERAGE_ACK, then wait for the user's go.
gs 44444444-ffff-bbbb-cccc-dddddddddddd; cli $GS score --task "change how a subscription is charged" --category payment --touches-user-state --impact-tier revenue --ac 7 --hp 8 --ew 9 >/dev/null
garm; gsay "$CHECK_TRUE"; gsay $'NEW_SCOPE_REFLECTED\nNEW_SCOPE_1\nWhen someone is charged, the amount follows the new rule.'
gedit; [ $? -eq 2 ] && grep -q "HIGHEST-LEVERAGE SCOPE" "$TMP/ge" && ok "4. score 100: held until the agent names the stakes and prints HIGHEST_LEVERAGE_ACK" || bad "4. top band passed without the acknowledgement"
grep -q "When this does not fit" "$TMP/ge" && ok "4. that block says when it does not fit (a score from another task)" || bad "4. top-band block states no limits"
gsay $'Why top band: it changes what people are charged.\nHIGHEST_LEVERAGE_ACK'
gedit; [ $? -eq 2 ] && grep -q "WAITING FOR THE USER'S GO" "$TMP/ge" && ok "4. after the acknowledgement the agent waits; the same call is held too" || bad "4. acknowledged top-band edit went through"
for i in 1 2 3 4; do sleep 2.1; gedit; done; [ $? -eq 2 ] && ok "4. the wait does not step back after a few tries" || bad "4. the wait stepped back"
gread; [ $? -eq 0 ] && ok "4. reading still works while waiting" || bad "4. reads held during the wait"
garm "yes go ahead"; gsay "$CHECK_FALSE"; gedit; [ $? -eq 0 ] && ok "4. the user's next message is the go: work flows" || bad "4. still held after the user spoke"
# 4d. A stale top-band score can be corrected in the open: rescoring below 80 ends the wait.
gs 44444444-9999-bbbb-cccc-dddddddddddd; cli $GS score --task "change how a subscription is charged" --category payment --touches-user-state --impact-tier revenue --ac 7 --hp 8 --ew 9 >/dev/null
garm; gsay "$CHECK_TRUE"; gsay $'NEW_SCOPE_REFLECTED\nNEW_SCOPE_1\nx\nHIGHEST_LEVERAGE_ACK'; gedit
cli $GS score --task "fix a typo in a code comment" --category docs-only --ac 1 --hp 1 --ew 1 >/dev/null
gedit; [ $? -eq 0 ] && ok "4. rescored below 80: the wait ends at once" || bad "4. wait outlived the rescore"

# 5. The step-back stays: the coherence gate turns into a reminder after 3 blocks on one message, the proof gate after 6 in a session.
gs 55555555-aaaa-bbbb-cccc-dddddddddddd; garm
for i in 1 2 3; do gedit; [ $? -eq 2 ] || bad "5. coherence block $i did not block"; sleep 2.1; done
gedit; [ $? -eq 0 ] && ok "5. coherence: 3 blocks on one message, then a reminder" || bad "5. coherence never stepped back"
gs 55555555-eeee-bbbb-cccc-dddddddddddd
printf '%s\n' '{"type":"assistant","timestamp":"2026-01-01T00:00:05Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"g5","name":"Edit","input":{"file_path":"/repo/src/a.js","old_string":"a","new_string":"b"}}]}}' >> "$GTP"
for i in 1 2 3 4 5 6; do gstop "Changed a.js."; [ $? -eq 2 ] || bad "5. proof block $i did not block"; done
gstop "Changed a.js."; [ $? -eq 0 ] && ok "5. proof: 6 blocks in a session, then a reminder" || bad "5. proof gate never stepped back"

# 5b. The step-back must not pre-empt the new-scope enforcement: the restatement block and the 80+ acknowledgement block
# are counted on their own, so three earlier coherence blocks on a message do not use them up (real run: the restatement
# never fired because it shared the count). Each still steps back to a reminder after its own 3.
gs 77777777-aaaa-bbbb-cccc-dddddddddddd
cli $GS score --task "add a settings toggle" --category feature --ac 5 --hp 5 --ew 5 >/dev/null
garm
for i in 1 2 3; do gedit; [ $? -eq 2 ] || bad "5b. coherence block $i did not block"; sleep 2.1; done
gsay "$CHECK_TRUE"
gedit; [ $? -eq 2 ] && grep -q "New scope detected but not reflected" "$TMP/ge" && ok "5b. three coherence blocks used, then a TRUE check with no restatement still raises the restatement block" || bad "5b. the restatement was pre-empted by the coherence limit"
codes=""; for i in 1 2 3; do sleep 2.1; gedit; codes="$codes$?"; done
[ "$codes" = "220" ] && ok "5b. the restatement block steps back to a reminder after its own 3" || bad "5b. restatement step-back sequence $codes"
gs 77777777-bbbb-bbbb-cccc-dddddddddddd
cli $GS score --task "change how a subscription is charged" --category payment --touches-user-state --impact-tier revenue --ac 7 --hp 8 --ew 9 >/dev/null
garm
for i in 1 2 3; do gedit; [ $? -eq 2 ] || bad "5b. coherence block $i (top band) did not block"; sleep 2.1; done
gsay "$CHECK_TRUE"; gsay $'NEW_SCOPE_REFLECTED\nNEW_SCOPE_1\nWhen someone is charged, the amount follows the new rule.'
gedit; [ $? -eq 2 ] && grep -q "HIGHEST-LEVERAGE SCOPE" "$TMP/ge" && ok "5b. three coherence blocks used, then 80+ scope still raises the HIGHEST_LEVERAGE acknowledgement block" || bad "5b. the 80+ block was pre-empted by the coherence limit"
codes=""; for i in 1 2 3; do sleep 2.1; gedit; codes="$codes$?"; done
[ "$codes" = "220" ] && ok "5b. the acknowledgement block steps back to a reminder after its own 3" || bad "5b. acknowledgement step-back sequence $codes"

# 6. The full ritual is read once per session: see "full ritual, once per session" above.

echo "governer gate"
evt ',"tool_name":"Edit","tool_input":{"file_path":"/x.js"}' | hook pre-tool >/dev/null 2>"$TMP/e"; [ $? -eq 2 ] && ok "unscored edit waits for /governer" || bad "unscored edit allowed"
grep -q "governer" "$TMP/e" && ok "block names /governer" || bad "block message wrong"
grep -q "This gate exists because unscored work leads to scope misalignment." "$TMP/e" && grep -q "When this does not fit" "$TMP/e" && ok "governer block: the author's words, plus when it does not fit" || bad "governer block lacks the author's words or its limits"
cli $SID score --task "change how a subscription is charged" --category payment --touches-user-state --impact-tier revenue --ac 7 --hp 8 --ew 9 > "$TMP/s"
grep -q "Risk score: 100 out of 100" "$TMP/s" && ok "payment task scores 100" || bad "payment score: $(head -1 "$TMP/s")"
evt ',"tool_name":"Edit","tool_input":{"file_path":"/x.js"}' | hook pre-tool >/dev/null 2>&1; [ $? -eq 0 ] && ok "scored edit flows" || bad "scored edit blocked"
S2=bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee
cli $S2 score --task "fix a typo in a code comment" --category docs-only --ac 1 --hp 1 --ew 1 | grep -qE "Risk score: (1?[0-9]) out of 100" && ok "typo task scores under 20" || bad "typo score"
S3=cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee
cli $S3 score --task "x" --ac 5 >/dev/null; [ $? -eq 1 ] && ok "bad input exits 1" || bad "bad input accepted"
grep -q '"scoredBy": "unscored"' "$CLAUDE_PLUGIN_DATA/state/sessions/$S3.json" && ok "failure recorded as unscored" || bad "failure not unscored"
grep -q '"overallGovernerScore": 50' "$CLAUDE_PLUGIN_DATA/state/sessions/$S3.json" && bad "fallback 50 written" || ok "no fallback 50"
codes=""
for i in 1 2 3 4; do printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Write","tool_input":{"file_path":"/y.js"}}' "$S3" "$TMP/$S3.jsonl" | hook pre-tool >/dev/null 2>&1; codes="$codes$?"; done
[ "$codes" = "2220" ] && ok "3 blocks then reminder (never traps)" || bad "downgrade sequence $codes"
# A Write into the harness's own records folder is bookkeeping, not a
# coding change — it should never need a governer score either, on a
# session ($S3) that is confirmed unscored above.
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Write","tool_input":{"file_path":"%s/records/smoke-governer-test/rec1.json","content":"{}"}}' "$S3" "$TMP/$S3.jsonl" "$CLAUDE_PLUGIN_DATA" | hook pre-tool >/dev/null 2>&1
[ $? -eq 0 ] && ok "unscored session's Write into records folder is not blocked by the governer gate" || bad "governer gate wrongly blocked a records-folder write"

echo "evidence gate"
cat > "$TP" <<'EOF'
{"type":"user","timestamp":"2026-01-01T00:00:00Z","message":{"role":"user","content":"fix the charge bug"}}
{"type":"assistant","timestamp":"2026-01-01T00:00:05Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"Edit","input":{"file_path":"/repo/src/billing.js","old_string":"a","new_string":"b"}}]}}
{"type":"user","timestamp":"2026-01-01T00:00:06Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"ok"}]}}
EOF
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Done. The bug is fixed and all tests pass."' | hook stop >/dev/null 2>&1; [ $? -eq 2 ] && ok "edits + claim, no run → sent back" || bad "not sent back"
evt ',"hook_event_name":"Stop","stop_hook_active":true,"last_assistant_message":"Done. The bug is fixed."' | hook stop >/dev/null 2>&1; [ $? -eq 0 ] && ok "loop-break: second stop goes through" || bad "loop-break failed"
cat >> "$TP" <<'EOF'
{"type":"assistant","timestamp":"2026-01-01T00:00:10Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"t2","name":"Bash","input":{"command":"npx jest src/billing.test.js"}}]}}
{"type":"user","timestamp":"2026-01-01T00:00:15Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t2","content":"PASS src/billing.test.js\nTests:       4 passed, 4 total"}]}}
EOF
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"The bug is fixed and all tests pass."' | hook stop >/dev/null 2>"$TMP/e"; c=$?
[ $c -eq 0 ] && ! grep -q "evidence-gate" "$TMP/e" && [ -f "$CLAUDE_PLUGIN_DATA/state/coherence/turn-end-reminder-$SID.txt" ] && ok "claim with evidence passes; the missing hand-back is saved as a reminder, never a block" || bad "evidence/turn-end wrong ($c)"
grep -q "It routes you to the right hand-off so the user can see," "$CLAUDE_PLUGIN_DATA/state/coherence/turn-end-reminder-$SID.txt" && ok "the saved reminder is the author's on-turn-end text" || bad "the reminder is not the author's text"
rm -f "$CLAUDE_PLUGIN_DATA/state/coherence/turn-end-reminder-$SID.txt"
cat >> "$TP" <<'EOF2'
{"type":"assistant","timestamp":"2026-01-01T00:00:20Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"t3","name":"Skill","input":{"skill":"alignment-harness:on-turn-end"}}]}}
{"type":"user","timestamp":"2026-01-01T00:00:21Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t3","content":"loaded"}]}}
EOF2
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"The bug is fixed and all tests pass."' | hook stop >/dev/null 2>&1; [ $? -eq 0 ] && ok "after the hand-back, finishes" || bad "hand-back not recognised"
cli $SID contract add --intent "When charged, then amount matches plan" --verify "node -e 'process.exit(1)'" >/dev/null
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Summary."' | hook stop >/dev/null 2>&1; [ $? -eq 2 ] && ok "unchecked contract (score 60+) sent back" || bad "contract not enforced"
cli $SID contract verify 1 >/dev/null
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Summary."' | hook stop >/dev/null 2>&1; [ $? -eq 2 ] && ok "a check that fails keeps the contract unchecked" || bad "failed check counted as verified"
cli $SID contract clear >/dev/null
cli $SID contract add --intent "When charged, then amount matches plan" --verify "node -e 'process.exit(0)'" >/dev/null
cli $SID contract verify 1 >/dev/null
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Summary."' | hook stop >/dev/null 2>&1; [ $? -eq 0 ] && ok "checked contract finishes" || bad "checked contract blocked"
evt ',"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Here is the plan for next steps."' | hook stop >/dev/null 2>&1; [ $? -eq 0 ] && ok "no claim → finishes" || bad "false positive"

echo "turn-end, corrections, requirement capture"
S5=eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee; TP5="$TMP/$S5.jsonl"
cat > "$TP5" <<'EOF2'
{"type":"user","timestamp":"2026-01-01T00:00:00Z","message":{"role":"user","content":"I want the export button to include dates. should I also ask before deleting?"}}
{"type":"assistant","timestamp":"2026-01-01T00:00:05Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"Read","input":{"file_path":"/repo/a.md"}}]}}
EOF2
cli $S5 correction add --label "no bare questions" --trigger "should I" --directive "Predict the answer and proceed." >/dev/null
cli $S5 correction activate $(ls "$CLAUDE_PLUGIN_DATA/records/correction-patterns" | head -1 | sed 's/.json$//') >/dev/null
printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Here is what I found."}' "$S5" "$TP5" | hook stop >/dev/null 2>"$TMP/e"; c=$?
RM5="$CLAUDE_PLUGIN_DATA/state/coherence/turn-end-reminder-$S5.txt"
[ $c -eq 0 ] && grep -q "Predict the answer" "$RM5" && ok "active correction pattern saved for the agent's next turn (a reminder, not a block)" || bad "correction not injected ($c)"
grep -q "stated requirements" "$RM5" && ok "requirement without a task flagged" || bad "requirement capture missing"
# The hand-back is never on stderr any more (it is a saved reminder), so check the saved reminder itself.
grep -q "Run /alignment-harness:on-turn-end" "$RM5" && bad "unscored read-only turn asked for hand-back" || ok "unscored read-only turn: no hand-back demand"

echo "subagent start"
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Agent","tool_input":{"description":"fix billing refund","prompt":"Change how refunds are charged back to the card","subagent_type":"general-purpose"}}' "$S5" "$TP5" | hook pre-tool >/dev/null 2>&1
out=$(printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"SubagentStart","agent_id":"x1","agent_type":"general-purpose"}' "$S5" "$TP5" | hook subagent-start)
[[ "$out" == *"money or billing"* ]] && ok "subagent gets a hint from its real task text" || bad "subagent hint: $out"
[[ "$out" == *"additionalContext"* ]] && ok "subagent context returned as additionalContext" || bad "no additionalContext"

echo "intent-search gate"
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Grep","tool_input":{"pattern":"x"}}' "$S5" "$TP5" | hook pre-tool >/dev/null 2>"$TMP/e"; c=$?
[ $c -eq 2 ] && grep -q "agent_find" "$TMP/e" && ok "first code search waits for memory search" || bad "intent gate ($c)"
grep -q "Please ask yourself what question you need to ask." "$TMP/e" && grep -q "When this does not fit" "$TMP/e" && ok "intent-search block: the author's words, plus when it does not fit" || bad "intent-search block lacks the author's words or its limits"
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Grep","tool_input":{"pattern":"x"}}' "$S5" "$TP5" | hook pre-tool >/dev/null 2>&1; [ $? -eq 0 ] && ok "only once per session" || bad "intent gate fired twice"

echo "scope read-back"
cli $S5 compaction scope --intent "When a person exports, dates are included" --certainty 70 >/dev/null
out=$(printf '{"session_id":"%s","prompt":"now also add the time zone please"}' "$S5" | hook user-prompt)
[[ "$out" == *"SCOPE you declared"* ]] && [[ "$out" == *"YOUR SCOPE CERTAINTY IS BELOW 90%"* ]] && ok "scope and certainty gate shown each message" || bad "scope not read back"

echo "session end"
printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"SessionEnd","reason":"exit"}' "$S5" "$TP5" | hook session-end >/dev/null 2>&1
S6=ffffffff-bbbb-cccc-dddd-eeeeeeeeeeee
printf '{"session_id":"%s","prompt":"no, that is not what I asked for, redo the export"}' "$S6" | hook user-prompt >/dev/null
printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"SessionEnd","reason":"exit"}' "$S6" "$TMP/$S6.jsonl" | hook session-end >/dev/null 2>&1
grep -q '"auto": true' "$CLAUDE_PLUGIN_DATA/records/compactions/session-$S6.json" 2>/dev/null && ok "automatic record written when none exists" || bad "no auto compaction"
grep -q '"auto": false' "$CLAUDE_PLUGIN_DATA/records/compactions/session-$S5.json" && ok "agent-written record never overwritten" || bad "agent record overwritten"
ls "$CLAUDE_PLUGIN_DATA/records/correction-candidates/" 2>/dev/null | grep -q . && ok "correction candidate collected" || bad "no correction candidate"
[ ! -f "$CLAUDE_PLUGIN_DATA/state/coherence/required-$S6" ] && ok "session gate files cleaned up" || bad "gate file left"

echo "fail-open"
printf '{"transcript_path":"%s","tool_name":"Edit","tool_input":{"file_path":"/x.js"}}' "$TMP/none.jsonl" | hook pre-tool >/dev/null 2>&1; [ $? -eq 0 ] && ok "no session id → never blocks" || bad "blocked without session id"
RO="$TMP/ro"; mkdir -p "$RO"; chmod 555 "$RO"
codes=""; for i in 1 2 3 4 5; do printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Write","tool_input":{"file_path":"/y.js"}}' "aaaaaaaa-1111-2222-3333-444444444444" "$TMP/ro.jsonl" | CLAUDE_PLUGIN_DATA="$RO/data" hook pre-tool >/dev/null 2>&1; codes="$codes$?"; done
[ "$codes" = "00000" ] && ok "unwritable data folder → edits go through ($codes)" || bad "unwritable data folder blocks ($codes)"
chmod 755 "$RO"
echo 'not json' | hook pre-tool >/dev/null 2>&1; [ $? -eq 0 ] && ok "garbage input passes" || bad "garbage input blocked"
echo '{ broken' > "$CLAUDE_PLUGIN_DATA/switches.jsonc"
out=$(evt ',"hook_event_name":"SessionStart"' | hook session-start); [[ "$out" == *"config problem"* ]] && ok "broken switches → defaults + notice" || bad "broken switches not reported"

echo "switches"
printf '{ "coherenceGate": { "strength": "off" }, "governer": { "gateStrength": "remind" } }' > "$CLAUDE_PLUGIN_DATA/switches.jsonc"
S4=dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee
printf '{"session_id":"%s","prompt":"please refactor the login page now"}' "$S4" | hook user-prompt >/dev/null
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Edit","tool_input":{"file_path":"/x.js"}}' "$S4" "$TMP/$S4.jsonl" | hook pre-tool > "$TMP/o" 2>/dev/null; c=$?
[ $c -eq 0 ] && grep -q additionalContext "$TMP/o" && ok "remind mode reminds, never blocks" || bad "remind mode wrong ($c)"

# ── settings (release/settings-page) ─────────────────────────────────────────
# The shared settings writer, `switch`, `settings list`, the settings page and the understanding
# switches are tested in their own script; its result counts as one line here.
echo "settings: shared writer, settings list, settings page"
if PLUGIN_DIR="$ROOT" node "$ROOT/plugin-dev/tests-smoke/settings-test.js" > "$TMP/settings-test.out" 2>&1; then
  ok "$(tail -1 "$TMP/settings-test.out")"
else
  sed 's/^/    /' "$TMP/settings-test.out" | grep -E "FAIL|crashed" | head -20; bad "settings test: $(tail -1 "$TMP/settings-test.out")"
fi
# ── end settings ─────────────────────────────────────────────────────────────

# ── plain-words score printout, and fixing a broken check (release/settings-page) ──
echo "score printout in plain words; a broken check can be fixed without the person"
S9=99999999-aaaa-bbbb-cccc-dddddddddddd; TP9="$TMP/$S9.jsonl"; : > "$TP9"
out=$(cli $S9 score --task "change how a subscription is charged" --category payment --touches-user-state --impact-tier revenue --ac 7 --hp 8 --ew 9)
[[ "$out" == *"How much this could affect the people using it: "*" of 100"* && "$out" == *"Risk score: "* ]] && ok "the score prints in plain words" || bad "score printout: ${out:0:200}"
[[ "$out" != *degreeToWhich* && "$out" != *overallGovernerScore* ]] && ok "no stored field names in what the person reads" || bad "raw field names printed"
printf '%s' "$out" | grep -qi governer && bad "the word governer is in the score printout" || ok "the score printout says risk score, not governer"
out=$(cli $S9 status); printf '%s' "$out" | grep -qi governer && bad "status says governer: $out" || ok "status says risk score, not governer"
grep -q '"degreeToWhichThisTaskAffectsWhatUsersExperience"' "$CLAUDE_PLUGIN_DATA/state/sessions/$S9.json" && ok "the saved record keeps its field names" || bad "saved record field names changed"
stop9() { printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Summary."}' "$S9" "$TP9" | hook stop >/dev/null 2>"$TMP/e9"; }
cli $S9 contract add --intent "When charged, then the amount matches the plan" --verify "node /no/such/check-file.js" >/dev/null
cli $S9 contract add --intent "When a refund is made, then the card gets it back" --verify "node -e 'process.exit(0)'" >/dev/null
cli $S9 contract verify all >/dev/null
stop9; c=$?
[ $c -eq 2 ] && grep -q "You MUST verify each remaining contract item" "$TMP/e9" && grep -q "node /no/such/check-file.js" "$TMP/e9" && grep -q "contract verify <n>" "$TMP/e9" && ok "a broken check blocks, and the block lists the unverified check and how to mark it verified" || bad "contract block message ($c): $(head -c 300 "$TMP/e9")"
cli $S9 contract replace 7 --verify "node -e 'process.exit(0)'" >/dev/null 2>&1 && bad "replace accepted an item that does not exist" || ok "replace refuses an item that does not exist"
cli $S9 contract replace 1 --verify "node -e 'process.exit(0)'" --why "the check file path was wrong" >/dev/null && l9=$(cli $S9 contract list) && [[ "$l9" == "1. [ ]"* ]] && ok "a replaced check is unchecked until it passes" || bad "replaced check counted as checked"
cli $S9 contract verify 1 >/dev/null; stop9; [ $? -eq 2 ] && grep -q "proof-check-changed" "$TMP/e9" && ok "the first finish after a fix is sent back once to tell the user" || bad "fixed check went untold: $(head -c 200 "$TMP/e9")"
stop9; [ $? -eq 0 ] && ok "fixed and verified, the agent finishes" || bad "still blocked after fixing the check: $(head -c 200 "$TMP/e9")"
cli $S9 contract add --intent "When exported, then dates show" --verify "node -e 'process.exit(1)'" >/dev/null
cli $S9 contract remove 3 >/dev/null 2>&1 && bad "remove without a reason was accepted" || ok "remove needs a reason"
cli $S9 contract remove 3 --why "export is not part of this task" >/dev/null; stop9; stop9; [ $? -eq 0 ] && ok "a check that no longer belongs can be removed" || bad "remove did not unblock"
out=$(cli $S9 contract list)
[[ "$out" == *"replaced item 1"*"node /no/such/check-file.js"* && "$out" == *"removed item 3"*"export is not part of this task"* ]] && ok "contract list shows the person every change and why" || bad "change history missing: $out"
# ── end plain-words score / contract fix ─────────────────────────────────────

# ── switch before the first session (release/settings-page) ─────────────────
# Before the first Claude Code session, the harness's data folder doesn't exist, so the CLI falls back
# to a temp folder the hooks never read. A change there used to report success and then be lost.
echo "switch before the first session: refused plainly, never a lost success"
FS="$TMP/first-session"; mkdir -p "$FS/home/.claude" "$FS/tmp"
fresh() { env -u CLAUDE_PLUGIN_DATA -u ALIGNMENT_HARNESS_DATA HOME="$FS/home" CLAUDE_CONFIG_DIR="$FS/home/.claude" TMPDIR="$FS/tmp" node "$ROOT/bin/alignment-harness" "$@"; }
out=$(fresh switch coherenceGate.strength remind 2>&1); c=$?
[ $c -ne 0 ] && [[ "$out" == *"first Claude Code session"* && "$out" == *"Nothing was changed"* ]] && ok "switch before the first session is refused with the reason" || bad "switch before first session ($c): $out"
[[ "$out" != *"→"* ]] && ok "and it does not report a change" || bad "it reported a change that the hooks would never see"
ls "$FS/tmp/alignment-harness-unbound/switches.jsonc" >/dev/null 2>&1 && bad "it wrote a switches file the hooks never read" || ok "nothing is written to the temporary folder"
out=$(fresh settings open --no-open 2>&1); [ $? -ne 0 ] && [[ "$out" == *"first Claude Code session"* ]] && ok "the settings page refuses the same way" || bad "settings page started before the first session: $out"
fresh settings list --json 2>/dev/null | grep -q "These are the defaults" && ok "settings list still shows the defaults, and says changes wait for the first session" || bad "settings list before first session"
mkdir -p "$FS/home/.claude/plugins/data/alignment-harness-smoke"
out=$(fresh switch coherenceGate.strength remind 2>&1); c=$?
[ $c -eq 0 ] && grep -q '"strength": "remind"' "$FS/home/.claude/plugins/data/alignment-harness-smoke/switches.jsonc" && ok "once the session has created the folder, the same command saves where the hooks read" || bad "switch after first session ($c): $out"
# ── end switch before the first session ──────────────────────────────────────

# ── which harness commands skip the permission prompt (release/settings-2) ──
echo "permission prompts: read-only settings and fixing a check are pre-approved; turning checks down is not"
PS=ffffffff-1111-2222-3333-444444444444; TPS="$TMP/$PS.jsonl"; : > "$TPS"
allowed() { printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Bash","tool_input":{"command":%s}}' "$PS" "$TPS" "$(printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')" | hook pre-tool 2>/dev/null | grep -q '"permissionDecision":"allow"'; }
for c in "alignment-harness settings list --json" "alignment-harness settings get coherenceGate.strength" 'alignment-harness contract replace 1 --verify "npm test"'; do
  allowed "$c" && ok "runs without a prompt: $c" || bad "still prompts: $c"
done
for c in "alignment-harness switch coherenceGate.strength off" "alignment-harness settings set evidenceGate.strength off" 'alignment-harness contract remove 1 --why "x"' "alignment-harness contract verify 1" "alignment-harness settings"; do
  allowed "$c" && bad "pre-approved, but should follow the person's own rules: $c" || ok "still follows the person's permission rules: $c"
done
allowed "alignment-harness settings list --json; rm -rf /tmp/x" && bad "a chained command rode along on settings list" || ok "settings list chained to another command is not pre-approved"
# ── end permission prompts ───────────────────────────────────────────────────

echo "agent_find: a search query is text, never shell"
# A query carrying ; $( ) and backticks must be searched for as words. Each shell-looking
# piece has no spaces because the search splits a query on spaces first, and `>file`
# creates a file if a shell ever runs it. A pwned-* file in the repo folder means it ran.
GR="$TMP/search-repo"; mkdir -p "$GR"
QUERY='billing-fix x;>pwned-semi;y $(>pwned-sub) `>pwned-tick`'
( cd "$GR" && git init -q && git -c user.name=smoke -c user.email=smoke@example.com commit -q --allow-empty -m "$QUERY" )
out=$(cd "$GR" && node "$ROOT/mcp/agent-find/cli.js" "$QUERY" --sources commit 2>&1)
ls "$GR" | grep -q pwned && bad "search query ran as shell: $(ls "$GR" | tr '\n' ' ')" || ok "; \$( ) and backticks in a query run nothing"
[[ "$out" == *"billing-fix"* ]] && ok "the same query is found as plain text in a commit message" || bad "query with shell characters found nothing: ${out:0:200}"

echo "private-data scanner: the one published contact, and nothing else"
# The contact address is allowed in README.md only. Assembled from pieces so this file does not flag itself.
CONTACT="founder@ixco""ach.com"
SC="$TMP/scan"; mkdir -p "$SC/ok" "$SC/bad"
printf 'Reach me at %s\n' "$CONTACT" > "$SC/ok/README.md"; : > "$SC/ok/.DS_Store"
printf 'Reach me at %s\n' "$CONTACT" > "$SC/bad/NOTES.md"
node "$ROOT/scripts/scan-private.js" "$SC/ok" >/dev/null 2>&1 && ok "contact in README.md passes; .DS_Store is ignored" || bad "scanner rejects the README contact or .DS_Store"
node "$ROOT/scripts/scan-private.js" "$SC/bad" >/dev/null 2>&1 && bad "contact outside README.md passed the scanner" || ok "the same address anywhere else still fails"

echo "skill importer: never overwrites an imported skill without a diff and --overwrite"
IMP="$TMP/imp"; mkdir -p "$IMP/plugin/scripts" "$IMP/plugin/skills/demo" "$IMP/src/demo"
cp "$ROOT/scripts/import-skills.js" "$IMP/plugin/scripts/"
printf '{"skills":[{"id":"demo","status":"include","source":"user-skills","scrub":"mechanical"}]}\n' > "$IMP/plugin/skills-manifest.json"
printf 'a story that was already checked by a person\n' > "$IMP/plugin/skills/demo/SKILL.md"
printf 'a different story that was never read\n' > "$IMP/src/demo/SKILL.md"
imp() { node "$IMP/plugin/scripts/import-skills.js" --source "$IMP/src" "$@"; }
out=$(imp 2>&1); c=$?
[ $c -eq 2 ] && ok "a changed skill is refused (exit 2)" || bad "changed skill not refused ($c)"
[[ "$out" == *"would change"* && "$out" == *"a different story"* ]] && ok "the diff is shown" || bad "no diff shown"
grep -q "already checked" "$IMP/plugin/skills/demo/SKILL.md" && ok "the existing skill was left alone" || bad "existing skill was overwritten without --overwrite"
[[ "$out" == *"CHECK WORKED EXAMPLES BY HAND"* ]] && ok "it warns that reworded stories need a human or model read" || bad "no re-read warning"
out=$(imp --overwrite 2>&1); c=$?
grep -q "never read" "$IMP/plugin/skills/demo/SKILL.md" && [ $c -eq 0 ] && ok "--overwrite accepts the change" || bad "--overwrite did not apply ($c)"

echo "evidence gate: the harness's own commands are not proof the work was checked"
# The governer step has the agent run `alignment-harness score ... || node ".../alignment-harness" score ...`; memory
# search and attest are harness commands too. Before the fix the `node` in that fallback counted as "ran something",
# so an edit followed by a score command and "all tests pass" went through. Each case gets its own session.
printf '{}' > "$CLAUDE_PLUGIN_DATA/switches.jsonc"
mk_turn() { # transcript file, a command to run after the edit ("" = none), text printed before the edit ("" = none)
  node -e '
const fs = require("fs"); const [f, cmd, text] = process.argv.slice(1); const o = []; const w = (x) => o.push(JSON.stringify(x));
const asst = (t, c) => w({ type: "assistant", timestamp: t, message: { role: "assistant", content: c } });
const res = (t, id, s) => w({ type: "user", timestamp: t, message: { role: "user", content: [{ type: "tool_result", tool_use_id: id, content: s }] } });
w({ type: "user", timestamp: "2026-01-01T00:00:00Z", message: { role: "user", content: "add the discount" } });
if (text) asst("2026-01-01T00:00:02Z", [{ type: "text", text }]);
asst("2026-01-01T00:00:05Z", [{ type: "tool_use", id: "t1", name: "Edit", input: { file_path: "/repo/src/pricing.js", old_string: "a", new_string: "b" } }]);
res("2026-01-01T00:00:06Z", "t1", "ok");
if (cmd) { asst("2026-01-01T00:00:10Z", [{ type: "tool_use", id: "t2", name: "Bash", input: { command: cmd } }]); res("2026-01-01T00:00:11Z", "t2", "ok"); }
fs.writeFileSync(f, o.join("\n") + "\n");' "$1" "$2" "$3"
}
stop_case() { # session id, command to run after the edit -> STOP_CODE; the hook's message is in $TMP/ev
  local sid=$1 tp="$TMP/$1.jsonl"; mk_turn "$tp" "$2" ""
  printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"Done. The discount is fixed and all tests pass."}' "$sid" "$tp" | hook stop >/dev/null 2>"$TMP/ev"; STOP_CODE=$?
}
held() { [ "$STOP_CODE" -eq 2 ] && grep -q "evidence-gate" "$TMP/ev"; }
SCORE_IDIOM="alignment-harness score --task x --category payment --ac 2 --hp 5 --ew 7 || node \"$ROOT/bin/alignment-harness\" score --task x --category payment --ac 2 --hp 5 --ew 7"
stop_case eeeeeeee-aaaa-bbbb-cccc-111111111111 ""
held && ok "an edit, no command at all, then 'all tests pass' is held" || bad "no-command case not held ($STOP_CODE)"
stop_case eeeeeeee-aaaa-bbbb-cccc-222222222222 "$SCORE_IDIOM"
held && ok "the governer's own score command is not proof" || bad "score idiom counted as proof ($STOP_CODE)"
stop_case eeeeeeee-aaaa-bbbb-cccc-333333333333 "node \"$ROOT/mcp/agent-find/cli.js\" \"discount\"; node \"$ROOT/bin/alignment-harness\" attest --certainty 90 --scope FALSE"
held && ok "memory search and attest are not proof either" || bad "memory search or attest counted as proof ($STOP_CODE)"
stop_case eeeeeeee-aaaa-bbbb-cccc-444444444444 "alignment-harness contract add --intent 'x' --verify 'echo node check'; alignment-harness status"
held && ok "a harness command with 'node' inside its quoted arguments is not proof" || bad "quoted 'node' counted as proof ($STOP_CODE)"
stop_case eeeeeeee-aaaa-bbbb-cccc-555555555555 "$SCORE_IDIOM; node test/pricing.test.js"
[ "$STOP_CODE" -eq 0 ] && ! grep -q "evidence-gate" "$TMP/ev" && ok "a real run chained after a score command still counts" || bad "real run chained to a score command was held ($STOP_CODE)"
stop_case eeeeeeee-aaaa-bbbb-cccc-666666666666 "npm test"
[ "$STOP_CODE" -eq 0 ] && ! grep -q "evidence-gate" "$TMP/ev" && ok "a plain test run still counts" || bad "plain test run was held ($STOP_CODE)"
echo "evidence gate: a turn that only talked to the harness and edited nothing has no work to prove"
# Seen in a real run: the calibration report ("6 sessions noted … it works") was held as a claim without
# evidence, and the agent's reply to the gate reached the person after the question it had just asked.
mk_harness_only_turn() { # transcript file, command
  node -e '
const fs = require("fs"); const [f, cmd] = process.argv.slice(1); const o = []; const w = (x) => o.push(JSON.stringify(x));
w({ type: "user", timestamp: "2026-01-01T00:00:00Z", message: { role: "user", content: "yes" } });
w({ type: "assistant", timestamp: "2026-01-01T00:00:05Z", message: { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: cmd } }] } });
w({ type: "user", timestamp: "2026-01-01T00:00:06Z", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "Done: 6 sessions noted" }] } });
fs.writeFileSync(f, o.join("\n") + "\n");' "$1" "$2"
}
CAL_IDIOM="alignment-harness calibration run --sessions 200 2>&1 | tail -5 || node \"$ROOT/bin/alignment-harness\" calibration run --sessions 200"
S11=eeeeeeee-aaaa-bbbb-cccc-777777777777; mk_harness_only_turn "$TMP/$S11.jsonl" "$CAL_IDIOM"
CLAIM_MSG="Calibration is done and it works: 6 sessions noted, the map is written and everything is working."
printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"%s"}' "$S11" "$TMP/$S11.jsonl" "$CLAIM_MSG" | hook stop >/dev/null 2>"$TMP/ev"; STOP_CODE=$?
[ "$STOP_CODE" -eq 0 ] && ok "a calibration report with only harness commands and no edits is not held" || bad "harness-only turn was held ($STOP_CODE): $(head -c 120 "$TMP/ev")"
S12=eeeeeeee-aaaa-bbbb-cccc-888888888888; mk_harness_only_turn "$TMP/$S12.jsonl" "alignment-harness calibration answer yes; npm test"
printf '{"session_id":"%s","transcript_path":"%s","hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"%s"}' "$S12" "$TMP/$S12.jsonl" "$CLAIM_MSG" | hook stop >/dev/null 2>"$TMP/ev"; STOP_CODE=$?
! grep -q "only-harness" "$CLAUDE_PLUGIN_DATA/telemetry.jsonl" 2>/dev/null || [ "$(grep -c "$S12.*only-harness" "$CLAUDE_PLUGIN_DATA/telemetry.jsonl")" -eq 0 ] && ok "a harness command chained to a real run is not treated as harness-only" || bad "harness command + npm test treated as harness-only"
stop_case eeeeeeee-aaaa-bbbb-cccc-999999999999 "$SCORE_IDIOM"
held && ok "an edit + only a score command + 'all tests pass' is still held" || bad "edit + score-only + claim not held ($STOP_CODE)"
stop_case eeeeeeee-aaaa-bbbb-cccc-aaaaaaaaaaaa "$CAL_IDIOM"
held && ok "an edit + only a calibration command + 'all tests pass' is still held" || bad "edit + calibration-only + claim not held ($STOP_CODE)"
echo "coherence gate: attest opens it only for a check the person was shown"
# On a runtime that records the reply as it goes, the transcript shows what the agent printed. An attestation
# that arrives while the turn's visible text has no COHERENCE_CHECK is refused. If no text of the turn is visible
# (a runtime that records it later) nothing can be checked, so it is accepted as before. Never a trap: refusals
# count toward maxBlocksPerMessage like every other coherence block.
printf '{}' > "$CLAUDE_PLUGIN_DATA/switches.jsonc"  # earlier sections leave the gate switched off; start from the defaults
mk_text_turn() { # transcript file, assistant text ("" = none)
  node -e '
const fs = require("fs"); const [f, text] = process.argv.slice(1);
const o = [JSON.stringify({ type: "user", timestamp: "2026-01-01T00:00:00Z", message: { role: "user", content: "please change how the subscription is charged" } })];
if (text) o.push(JSON.stringify({ type: "assistant", timestamp: "2026-01-01T00:00:02Z", message: { role: "assistant", content: [{ type: "text", text }] } }));
fs.writeFileSync(f, o.join("\n") + "\n");' "$1" "$2"
}
armb() { printf '{"session_id":"%s","transcript_path":"%s","prompt":"please change how the subscription is charged"}' "$1" "$TMP/$1.jsonl" | hook user-prompt >/dev/null; }
tool_b() { # session id, tool name, JSON tool input -> BC; the hook's message is in $TMP/at
  printf '{"session_id":"%s","transcript_path":"%s","tool_name":"%s","tool_input":%s}' "$1" "$TMP/$1.jsonl" "$2" "$3" | hook pre-tool >/dev/null 2>"$TMP/at"; BC=$?
}
attest_b() { # session id
  local cmd="node \"$ROOT/bin/alignment-harness\" attest --session $1 --certainty 90 --scope FALSE --intent \"You want the monthly charge changed for subscriptions without touching old invoices.\""
  tool_b "$1" Bash "{\"command\":$(printf '%s' "$cmd" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))')}"
}
EDIT_IN='{"file_path":"/x.js"}'
B1=ffffffff-aaaa-bbbb-cccc-111111111111; mk_text_turn "$TMP/$B1.jsonl" "Let me look at the pricing code first."; armb $B1
attest_b $B1
[ $BC -eq 2 ] && grep -q "has no COHERENCE_CHECK" "$TMP/at" && ok "an attestation with nothing shown to the person is refused" || bad "hollow attest accepted ($BC)"
tool_b $B1 Edit "$EDIT_IN"
[ $BC -eq 2 ] && grep -q "Coherence check not completed" "$TMP/at" && ok "the refused attestation did not open the gate" || bad "gate opened by a refused attest ($BC)"
B2=ffffffff-aaaa-bbbb-cccc-222222222222; mk_text_turn "$TMP/$B2.jsonl" "COHERENCE_CHECK
- My sense of your intent: you want the monthly charge changed (90%).
ANY_NEW_SCOPE_INDICATED = FALSE"; armb $B2
attest_b $B2
[ $BC -eq 0 ] && ok "an attestation after a printed check is accepted" || bad "attest after a printed check refused ($BC)"
B3=ffffffff-aaaa-bbbb-cccc-333333333333; mk_text_turn "$TMP/$B3.jsonl" ""; armb $B3
attest_b $B3
[ $BC -eq 0 ] && ok "no visible text this turn: it cannot be checked, so the attestation is accepted" || bad "unverifiable attest refused ($BC)"
B4=ffffffff-aaaa-bbbb-cccc-444444444444; mk_text_turn "$TMP/$B4.jsonl" "Let me look at the pricing code first."; armb $B4
printf '{ "coherenceGate": { "blockRoundMs": 0 } }' > "$CLAUDE_PLUGIN_DATA/switches.jsonc"
codes=""; for i in 1 2 3 4; do attest_b $B4; codes="$codes$BC"; done
[ "$codes" = "2220" ] && ok "refused attestations count toward the limit, so it never traps" || bad "refusals did not step back ($codes)"
B5=ffffffff-aaaa-bbbb-cccc-555555555555; mk_text_turn "$TMP/$B5.jsonl" "Let me look at the pricing code first."; armb $B5
codes=""; for i in 1 2 3 4; do tool_b $B5 Edit "$EDIT_IN"; codes="$codes$BC"; done
[ "$codes" = "2220" ] && ok "separate rounds of blocked edits still step back after three" || bad "step-back changed ($codes)"
B6=ffffffff-aaaa-bbbb-cccc-666666666666; mk_text_turn "$TMP/$B6.jsonl" "Let me look at the pricing code first."; armb $B6
printf '{}' > "$CLAUDE_PLUGIN_DATA/switches.jsonc"
codes=""; for i in 1 2 3 4 5; do tool_b $B6 Edit "$EDIT_IN"; codes="$codes$BC"; done
[ "$codes" = "22222" ] && ok "parallel edits from one reply are one round, not a way to use up the limit" || bad "a burst of edits used up the limit ($codes)"

echo "doctor before the first session: writes nothing, and says the data folder is created at the first session"
# It used to create empty state folders under the system temp folder and then print that temp path as "[ok] data folder".
DOC_T="$(mktemp -d)"; DOC_C="$(mktemp -d)"
doc_out=$(TMPDIR="$DOC_T" CLAUDE_CONFIG_DIR="$DOC_C" env -u ALIGNMENT_HARNESS_DATA -u CLAUDE_PLUGIN_DATA node "$ROOT/bin/alignment-harness" doctor 2>&1)
[ -z "$(find "$DOC_T" -mindepth 1 2>/dev/null)" ] && [ -z "$(find "$DOC_C" -mindepth 1 2>/dev/null)" ] && ok "doctor with no data folder yet creates no files or folders anywhere" || bad "doctor wrote files before the first session"
[[ "$doc_out" == *"data folder: not created yet"* && "$doc_out" == *"[setup] data folder: not created yet"* && "$doc_out" != *"alignment-harness-unbound"* ]] && ok "doctor says in plain words that the data folder is created at the first session, and shows no temp path" || bad "doctor still shows a temp path or no plain words ($doc_out)"
rm -rf "$DOC_T" "$DOC_C"

echo "missing defaults file: the harness falls back to its built-in defaults and says so in plain words"
# A plugin folder with config/ deleted used to print "undefined" in doctor and leave the gates reading nothing.
NC="$TMP/nocfg-plugin"; NCD="$TMP/nocfg-data"; mkdir -p "$NC" "$NCD"
for d in bin lib hooks prompts; do cp -R "$ROOT/$d" "$NC/$d"; done
nc_doctor() { CLAUDE_PLUGIN_ROOT="$NC" CLAUDE_PLUGIN_DATA="$NCD" CLAUDE_CONFIG_DIR="$NCD/cc" node "$NC/bin/alignment-harness" doctor 2>&1; }
out=$(nc_doctor); [[ "$out" == *"switches file"* ]] && ok "doctor runs with config/ present in the copy (baseline)" || bad "baseline doctor did not run"
cp -R "$ROOT/config" "$NC/config"; before_cfg=$(nc_doctor); rm -rf "$NC/config"
[[ "$before_cfg" != *"built-in defaults"* ]] && ok "with the defaults file present, doctor does not talk about built-in defaults" || bad "doctor mentions built-in defaults while the file exists"
out=$(nc_doctor)
[[ "$out" != *undefined* ]] && ok "config/ deleted: no \"undefined\" anywhere in doctor's output" || bad "doctor printed undefined: $(echo "$out" | grep undefined | head -2)"
[[ "$out" == *"missing, so it is using its built-in defaults: coherence check on, blocking; risk score on, blocking; proof before \"done\" on, blocking"* ]] && ok "doctor says in plain words that the defaults file is missing and what the built-in defaults are" || bad "doctor lacks the plain-words line: $(echo "$out" | grep 'switches file' | head -1)"
[[ "$out" != *ENOENT* ]] && ok "no raw file-system error text in doctor's output" || bad "doctor shows an ENOENT error"
node -e '
const c = require(process.argv[1] + "/lib/core"); const fromFile = c.readJsonc(c.P.switchesDefault);
process.exit(JSON.stringify(fromFile) === JSON.stringify(c.BUILT_IN_SWITCHES) ? 0 : 1);' "$ROOT" && ok "the built-in defaults are identical to config/switches.default.jsonc (change both together)" || bad "BUILT_IN_SWITCHES in lib/core.js differs from config/switches.default.jsonc"
# And it is not only words: the coherence gate still holds an edit until the check is attested.
NCS=ffffffff-aaaa-bbbb-cccc-999999999999
printf '{"session_id":"%s","prompt":"please change how the subscription is charged"}' "$NCS" | CLAUDE_PLUGIN_ROOT="$NC" CLAUDE_PLUGIN_DATA="$NCD" bash "$NC/hooks/run.sh" user-prompt >/dev/null 2>&1
printf '{"session_id":"%s","transcript_path":"%s","tool_name":"Edit","tool_input":{"file_path":"/x.js"}}' "$NCS" "$TMP/$NCS.jsonl" | CLAUDE_PLUGIN_ROOT="$NC" CLAUDE_PLUGIN_DATA="$NCD" bash "$NC/hooks/run.sh" pre-tool >/dev/null 2>&1
[ $? -eq 2 ] && ok "with config/ deleted, an edit before the coherence check is still held (the gates really use the built-in defaults)" || bad "gate did not hold with config/ deleted"

echo "agent_find and agent_read: a session becomes a record, the search finds it, the ref opens it in full (person's own data only)"
# A stranger's layout: the data folder lives under their own Claude config folder, and the CLI fallback is run
# from Bash, which has no CLAUDE_PLUGIN_DATA. Ids are placeholder-shaped.
AFC="$TMP/afcfg"; AFD="$AFC/plugins/data/alignment-harness-alignment-harness"; AFW="$TMP/afwork"; mkdir -p "$AFC/projects" "$AFW"
AFS=ffffffff-aaaa-bbbb-cccc-aaaaaaaaaaaa; AFT="$TMP/af-transcript.jsonl"
printf '%s\n' '{"type":"user","timestamp":"2026-10-23T10:00:00Z","message":{"role":"user","content":"Please fix the invoice rounding bug so totals use banker rounding"}}' '{"type":"assistant","timestamp":"2026-10-23T10:01:00Z","message":{"role":"assistant","content":[{"type":"text","text":"On it."},{"type":"tool_use","name":"Edit","input":{"file_path":"'"$AFW"'/invoice.js"}}]}}' > "$AFT"
printf '{"session_id":"%s","prompt":"Please fix the invoice rounding bug so totals use banker rounding","cwd":"%s","transcript_path":"%s"}' "$AFS" "$AFW" "$AFT" | CLAUDE_PLUGIN_DATA="$AFD" bash "$ROOT/hooks/run.sh" user-prompt >/dev/null 2>&1
printf '{"session_id":"%s","cwd":"%s","transcript_path":"%s","reason":"other"}' "$AFS" "$AFW" "$AFT" | CLAUDE_PLUGIN_DATA="$AFD" bash "$ROOT/hooks/run.sh" session-end >/dev/null 2>&1
AFREC="$AFD/records/compactions/session-$AFS.json"
[ -f "$AFREC" ] && grep -q "banker rounding" "$AFREC" && ok "session end wrote a record of the session into the person's own data folder" || bad "no record written at session end: $(ls "$AFD/records" 2>&1 | head -2)"
# the real MCP server, over stdio
afmcp() { # $1 = tool, $2 = arguments JSON
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"$1\",\"arguments\":$2}}" \
    | ( cd "$AFW" && CLAUDE_PLUGIN_DATA="$AFD" CLAUDE_CONFIG_DIR="$AFC" node "$ROOT/mcp/agent-find/server.js" ) > "$TMP/af-mcp.out" 2>/dev/null
}
afmcp agent_find '{"query":"what did we decide about rounding on invoices","sources":["record"]}'
node -e 'const L=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);
const names=L.find(m=>m.id===2).result.tools.map(t=>t.name).sort().join(",");
const txt=L.find(m=>m.id===3).result.content[0].text;
require("fs").writeFileSync(process.argv[2],names+"\n"+txt);' "$TMP/af-mcp.out" "$TMP/af-find.txt"
head -1 "$TMP/af-find.txt" | tr , "\n" | grep -qx agent_find && head -1 "$TMP/af-find.txt" | tr , "\n" | grep -qx agent_read && ok "the server offers both agent_find and agent_read" || bad "tools offered: $(head -1 "$TMP/af-find.txt")"
grep -q "ref:record:compactions/session-$AFS.json" "$TMP/af-find.txt" && ok "agent_find returns the session's record for a related question, with a ref" || bad "agent_find missed the record: $(sed -n 2,6p "$TMP/af-find.txt")"
AFREF="record:compactions/session-$AFS.json"
afmcp agent_read "{\"ref\":\"ref:$AFREF\"}"
node -e 'const L=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);process.stdout.write(L.find(m=>m.id===3).result.content[0].text)' "$TMP/af-mcp.out" > "$TMP/af-read.txt"
grep -q "## compactedSession" "$TMP/af-read.txt" && grep -q "Please fix the invoice rounding bug" "$TMP/af-read.txt" && grep -q "Files edited (1): invoice.js" "$TMP/af-read.txt" && ok "agent_read opens the full record by the ref agent_find printed" || bad "agent_read did not return the full record: $(head -5 "$TMP/af-read.txt")"
# the CLI fallback: no CLAUDE_PLUGIN_DATA, only the person's Claude config folder
out=$(cd "$AFW" && env -u CLAUDE_PLUGIN_DATA -u ALIGNMENT_HARNESS_DATA CLAUDE_CONFIG_DIR="$AFC" node "$ROOT/mcp/agent-find/cli.js" "rounding on invoices" --sources record 2>&1)
[[ "$out" == *"ref:$AFREF"* ]] && ok "the CLI fallback finds the same record without CLAUDE_PLUGIN_DATA" || bad "CLI fallback could not see the record: ${out:0:200}"
out=$(cd "$AFW" && env -u CLAUDE_PLUGIN_DATA -u ALIGNMENT_HARNESS_DATA CLAUDE_CONFIG_DIR="$AFC" node "$ROOT/mcp/agent-find/read-cli.js" "$AFREF" --limit 3 2>&1)
[[ "$out" == *"lines 1-3 of"* && "$out" == *"[more: agent_read("* ]] && ok "read-cli opens it a page at a time and says how to continue" || bad "read-cli paging: ${out:0:200}"
# a ref can only reach the person's own material
echo "TOP-SECRET-OUTSIDE" > "$TMP/af-secret.txt"
REL=$(node -e 'console.log(require("path").relative(process.argv[1], process.argv[2]))' "$AFD/records" "$TMP/af-secret.txt")
leak=""
for bad_ref in "record:$REL" "record:$TMP/af-secret.txt" "doc:afwork/../af-secret.txt" "skill:../../af-secret" "session:../../../af-secret" "git:afwork:--output=$TMP/af-pwned"; do
  o=$(cd "$AFW" && CLAUDE_CONFIG_DIR="$AFC" node "$ROOT/mcp/agent-find/read-cli.js" "$bad_ref" 2>&1)
  [[ "$o" == *TOP-SECRET-OUTSIDE* ]] && leak="$leak $bad_ref"
  [[ "$o" == agent_read:* ]] || leak="$leak (no plain refusal for $bad_ref)"
done
[ -z "$leak" ] && [ ! -e "$TMP/af-pwned" ] && ok "refs with .., absolute paths or git options open nothing and say so in a sentence" || bad "a ref reached outside the person's material:$leak"
out=$(cd "$AFW" && CLAUDE_CONFIG_DIR="$AFC" node "$ROOT/mcp/agent-find/read-cli.js" 12345 2>&1)
[[ "$out" == *"numeric id"* ]] && ok "a numbered artifact id is answered with where to get a real ref, not an error" || bad "numeric id: ${out:0:160}"
# the memory-search commands never count as proof that something was run
node -e 'const {withoutHarnessCommands:w}=require(process.argv[1]+"/lib/commands");
process.exit(w("node \""+process.argv[1]+"/mcp/agent-find/read-cli.js\" \"record:x\"").trim()==="" ? 0 : 1)' "$ROOT" && ok "reading a record is not counted as evidence that work was verified" || bad "read-cli.js counted as proof"

echo "intent DB and company intents: a person can keep their own, and agent_find finds them (no alignment-harness on PATH)"
# Same stranger layout as above; the skill scripts must find the harness's own command from where they sit.
IC="$TMP/iccfg"; ID="$IC/plugins/data/alignment-harness-alignment-harness"; IW="$TMP/icwork"; mkdir -p "$IC" "$ID" "$IW"
icrun() { ( cd "$IW" && env -u CLAUDE_PLUGIN_DATA -u ALIGNMENT_HARNESS_DATA -u CLAUDE_PLUGIN_ROOT PATH="/usr/bin:/bin:$(dirname "$(command -v node)")" CLAUDE_CONFIG_DIR="$IC" "$@" ) 2>&1; }
icrun node "$ROOT/skills/intent-db/intent.js" create '{"slug":"checkout.no-double-charge","title":"No double charge at checkout","primaryIntent":"When a person clicks Pay twice, they are charged once"}' >/dev/null
icrun node "$ROOT/skills/intent-db/intent.js" approve checkout.no-double-charge >/dev/null
[ -f "$ID/records/intents/checkout.no-double-charge.json" ] && [ ! -e "$IW/.alignment-harness" ] && ok "an intent lands in the person's data folder, not in their project, with the command off the PATH" || bad "intent landed elsewhere: $(find "$TMP" -name 'checkout.no-double-charge.json' | head -2)"
out=$(icrun node "$ROOT/mcp/agent-find/cli.js" "clicked pay twice" --sources record)
[[ "$out" == *"ref:record:intents/checkout.no-double-charge.json"* ]] && ok "agent_find finds the person's own intent" || bad "agent_find missed the intent: ${out:0:200}"
out=$(icrun node "$ROOT/skills/company-intent-db/company-intent.js" propose '{"slug":"pricing-philosophy","title":"Pricing philosophy","primaryIntent":"We charge for the result a team gets, not for seats","category":"pricing","tags":["canonical"],"certaintyScore":90,"proposedBy":"claude-agent"}')
[[ "$out" == *"cannot exceed 50"* ]] && [ ! -e "$ID/records/company-intent/pricing-philosophy.json" ] && ok "an agent cannot propose a company intent above certainty 50" || bad "certainty cap: ${out:0:200}"
icrun node "$ROOT/skills/company-intent-db/company-intent.js" propose '{"slug":"pricing-philosophy","title":"Pricing philosophy","primaryIntent":"We charge for the result a team gets, not for seats","category":"pricing","tags":["canonical"],"certaintyScore":45,"proposedBy":"claude-agent"}' >/dev/null
out=$(icrun node "$ROOT/skills/company-intent-db/company-intent.js" find "result a team")
[[ "$out" == *"(0 results)"* ]] && ok "a proposed company intent stays out of search until the person approves it" || bad "proposal showed before approval: ${out:0:160}"
icrun node "$ROOT/skills/company-intent-db/company-intent.js" approve pricing-philosophy >/dev/null
out=$(icrun node "$ROOT/skills/company-intent-db/company-intent.js" find "result a team")
[[ "$out" == *"pricing-philosophy"* ]] && ok "once approved, the company-intent-db command finds it" || bad "approved company intent not found: ${out:0:160}"
icrun node "$ROOT/bin/alignment-harness" store add company-intent --json '{"slug":"growth-strategy","title":"Growth strategy","primaryIntent":"We grow through teams recommending us","category":"growth","tags":["growth"],"status":"approved"}' >/dev/null
[ -f "$ID/records/company-intent/growth-strategy.json" ] && ok "store add company-intent names the file by its slug, the same file the skill's command uses" || bad "store add company-intent file: $(ls "$ID/records/company-intent" 2>&1)"
a=$(icrun node "$ROOT/bin/alignment-harness" records company-intent); b=$(icrun node "$ROOT/bin/alignment-harness" records company-intents)
[ "$a" = "$b" ] && ok "records company-intent and records company-intents are one folder" || bad "two company-intent folders: $a vs $b"
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"company_intent_search","arguments":{"query":"teams"}}}' '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"agent_find","arguments":{"query":"how do we charge small teams","sources":["record"]}}}' \
  | ( cd "$IW" && CLAUDE_PLUGIN_DATA="$ID" CLAUDE_CONFIG_DIR="$IC" node "$ROOT/mcp/agent-find/server.js" ) > "$TMP/ic-mcp.out" 2>/dev/null
node -e 'const L=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);
const names=L.find(m=>m.id===2).result.tools.map(t=>t.name);
const need=["company_intent_search","company_intent_get","company_intent_list","company_intent_propose","company_intent_tree"];
const s=L.find(m=>m.id===3).result.content[0].text, f=L.find(m=>m.id===4).result.content[0].text;
process.exit(need.every(n=>names.includes(n)) && s.includes("growth-strategy") && f.includes("ref:record:company-intent/pricing-philosophy.json") ? 0 : 1)' "$TMP/ic-mcp.out" \
  && ok "the server's company_intent tools and agent_find both reach the person's company intents" || bad "company intent tools: $(head -c 300 "$TMP/ic-mcp.out")"

rm -rf "$TMP"
echo; echo "smoke: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]

'use strict';
// Recognises commands that are the harness talking to itself: scoring a task, attesting, adding a
// contract item, searching memory. They are bookkeeping, never proof that the person's work was checked.
//
// Why this exists: the evidence gate (hooks/stop.js) asks "did the agent run anything that could show the
// change works?". The governer step has the agent run
//     alignment-harness score ... || node ".../alignment-harness" score ...
// and the `node` in that fallback made the gate answer yes, so an edit followed by only a score command and
// "all tests pass" went through. Everything the harness says about itself is dropped before the question is asked.

// The subcommands of bin/alignment-harness (see its usage header).
const SUBCOMMANDS = 'score|attest|status|doctor|conflicts|paths|session-id|contract|config|risk-table|setup|switch|compaction|intent|seed|proposal|correction|store|records?|calibration';
// `alignment-harness score ...`, `node "/x/bin/alignment-harness" score ...`, `"$H" score ...` is not matched on
// purpose (a variable hides the program; it has no `node` in it to count as proof anyway).
const HARNESS_CALL = new RegExp(`(?:^|[\\s"'/])alignment-harness["']?\\s+(?:${SUBCOMMANDS})\\b`);
// The memory-search command line the harness ships.
const MEMORY_SEARCH = /mcp\/agent-find\/(read-)?cli\.js/;

// `cmd` with every segment that is a harness command removed. Segments are split on ; && || | and newlines;
// separators inside quoted arguments (a task description such as "fix; then node") are not treated as splits.
function withoutHarnessCommands(cmd) {
  const flat = String(cmd || '').replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, (m) => m.replace(/[;&|\n]/g, ' '));
  return flat
    .split(/\s*(?:&&|\|\||;|\||\n)\s*/)
    .filter((segment) => segment && !HARNESS_CALL.test(segment) && !MEMORY_SEARCH.test(segment))
    .join(' ; ');
}

// Text-only helpers an agent chains onto a harness command (`… 2>&1 | tail -5`, `cd x && …`). They run
// nothing of the person's, so on their own they are not work that would need proof.
const TEXT_ONLY = /^(head|tail|grep|egrep|wc|jq|sort|uniq|cat|echo|printf|true|:|sed -n|cut|tr|cd)(\s|$)/;

// True when a command line is only the harness talking to itself (plus text-only helpers): there is no
// work of the person's in it. Used by the evidence gate to leave such a turn alone.
function onlyHarnessCommands(cmd) {
  const flat = String(cmd || '').replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, (m) => m.replace(/[;&|\n]/g, ' '));
  const segments = flat.split(/\s*(?:&&|\|\||;|\||\n)\s*/).map((x) => x.trim()).filter(Boolean);
  if (!segments.some((x) => HARNESS_CALL.test(x))) return false;
  return segments.every((x) => HARNESS_CALL.test(x) || MEMORY_SEARCH.test(x) || TEXT_ONLY.test(x.replace(/^\d?>\S*\s*/, '')));
}

module.exports = { withoutHarnessCommands, onlyHarnessCommands };

'use strict';
// PreToolUse — two gates, checked in order, in one process.
//
// 1. COHERENCE GATE. After the person speaks, tools that CHANGE things wait
//    until the agent has written down its understanding (COHERENCE_CHECK) and
//    attested. Tools that help it understand — reading, searching, skills,
//    subagents, task tracking — never wait: blocking those would be like
//    telling someone to prove they understood you before they may look
//    anything up.
//
// 2. GOVERNER (CODING) GATE. File edits wait until the agent has scored the
//    task with /governer, so every later gate reads a real number instead of
//    a constant. One score per task, then edits flow.
//
// Neither gate can trap anyone: each has a block limit after which it only
// reminds, a "remind" and an "off" setting, and any internal error lets the
// tool call through.

const fs = require('fs');
const path = require('path');
const core = require('../lib/core');
const transcript = require('../lib/transcript');
const h = require('./common');

const UNDERSTANDING_TOOLS = new Set([
  'Read', 'Grep', 'Glob', 'LSP', 'WebFetch', 'WebSearch', 'ToolSearch', 'NotebookRead',
  'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet', 'TaskOutput', 'TodoWrite', 'TodoRead',
  'SendMessage', 'TeamCreate', 'Agent', 'Task', 'Skill', 'BashOutput', 'ExitPlanMode',
  'ListMcpResourcesTool', 'ReadMcpResourceTool', 'AskUserQuestion',
  // The Claude desktop app's turn-close step: it only fills the recap box and changes nothing
  // in the project. Gating it forced the check to be written just before it, where the app
  // shows only a summary, so the person never saw the check.
  'mcp__ccd_turn__wrap_up',
]);

// One piece of a shell command that only looks at things. A command counts as read-only when
// every piece joined by ; && || | is one of these and nothing is written with > or >>.
const READONLY_PIECE = /^(cd|grep|rg|cat|head|tail|less|ls|find|wc|echo|printf|pwd|which|type|command -v|file|stat|tree|jq|sort|uniq|cut|tr|diff|basename|dirname|realpath|date|true|sed -n|git (status|log|diff|show|rev-parse|branch|remote|blame|ls-files|grep|describe|shortlog|config --get)|alignment-harness\b|node\s+("[^"]*alignment-harness[^"]*"|\S*alignment-harness\S*))(\s|$)/;
const WRITES_IN_PIECE = /\s-(exec|execdir|delete|ok|okdir|fprint|fprint0|fprintf|fls)\b|\s--output\b|^sort\b.*\s-o\b/;

// Pieces that start like a read but change something. `git branch NAME` creates a branch and
// -d/-D/-m/-c delete, rename or copy one; `git remote add/remove/…` edits remotes; `sed -n -i`
// edits files in place; and sed's own `w FILE` command writes a file from inside the quoted
// script. The sed checks look at the raw piece, because the quoted script is blanked out of
// the stripped one.
const GIT_BRANCH_CHANGES = /^(-d|-D|-m|-M|-c|-C|-f|-u|--delete|--move|--copy|--force|--set-upstream-to|--unset-upstream|--edit-description|--track|--no-track)(=|$)/;
function pieceChangesSomething(strippedPiece, rawPiece) {
  const branch = strippedPiece.match(/^git\s+branch\b(.*)$/);
  if (branch) {
    const args = branch[1].trim().split(/\s+/).filter(Boolean);
    if (args.some((a) => GIT_BRANCH_CHANGES.test(a))) return true;
    const listing = args.some((a) => a === '--list' || a === '-l');
    return !listing && args.some((a) => !a.startsWith('-')); // a bare name creates a branch
  }
  const remote = strippedPiece.match(/^git\s+remote\b(.*)$/);
  if (remote) {
    const first = remote[1].trim().split(/\s+/).filter(Boolean)[0];
    return first !== undefined && !['-v', '--verbose', 'show', 'get-url'].includes(first);
  }
  if (/^sed\b/.test(strippedPiece)) {
    const raw = String(rawPiece || '');
    if (/\s(-[a-zA-Z]*i|--in-place)/.test(stripQuoted(raw))) return true;
    if (/['"]([^'"]*[;/}\s])?[wW]\s+[^'"\s]/.test(raw)) return true; // sed's `w file` command
  }
  return false;
}
const VERIFY_BASH = /(^|[\s;&|])curl\s|lightpanda|modal-inspect/;
const VERIFY_PS = /(^|[\s;|])(Invoke-WebRequest|iwr|Invoke-RestMethod|irm)\s/i;
// PowerShell runs a bare ( … ), { … }, @( … ) or $( … ) found in a command's arguments, so a command
// holding one outside quotes is never treated as "only reads" or "only a harness command".
// PowerShell reads quotes differently from bash: a backslash escapes nothing (so \" ENDS a string),
// and curly quotes ‘ ’ “ ” „ ‟ ‚ ‛ are quotes too. stripQuoted() reads them the bash way, so a
// command using either could hide a second command from these checks. Such a command is never
// treated as read-only or as only a harness command; it gets the person's normal rules instead.
// (Found in a review, 4 Nov 2026.)
function psEvaluatesSomething(cmd) {
  const c = String(cmd || '');
  if (/\\["']|[‘’‚‛“”„‟]/.test(c)) return true;
  return /[(){}@`]|\$\(/.test(stripQuoted(c));
}
// One piece of a PowerShell command that only looks at things (cmdlets are case-insensitive).
const READONLY_PS_PIECE = /^(Get-ChildItem|gci|dir|Get-Content|gc|Select-String|sls|Get-Location|gl|Test-Path|Resolve-Path|Get-Item|gi|Get-ItemProperty|Measure-Object|measure|Select-Object|select|Sort-Object|Where-Object|where|Format-List|fl|Format-Table|ft|Write-Output|write|Write-Host|Get-Command|gcm|Get-Date|Split-Path|Join-Path|Get-FileHash|Get-Process|gps|Get-Service)(\s|$)/i;
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

function stripQuoted(cmd) { return String(cmd).replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""'); }

// Class A fix: stripQuoted() blanks an ENTIRE quoted span, including a
// quoted program path like `node "/abs/path/alignment-harness" status`. That
// is exactly right for telling `p > "/dev/null"` from a real redirect, but
// it also erases the one piece of text — "alignment-harness" inside the
// quotes — that READONLY_PIECE's node-invocation branch needs to see. A
// person (or the harness's own generated fallback idiom, or an agent being
// careful about spaces in a path) who quotes the program path, or chains a
// read-only call with `| head` / `; echo`, was having that read-only call
// wrongly reclassified as a change and blocked by the coherence gate — the
// exact failure mode is "look something up" being treated as "changed
// something", for something that never wrote anything.
//
// Fix: recognize a `node "<...>"`/`node <...>` piece as a harness
// invocation by checking the UNSTRIPPED piece text first (so the quoted
// path is still visible), before falling back to the stripped text for
// every other read-only pattern. Splitting into pieces still happens on the
// stripped command (so a `;` or `|` inside a quoted argument elsewhere in
// the command is never mistaken for a real separator); this only changes
// what a piece is compared against once split.
const NODE_HARNESS_PIECE = /^node\s+(?:"[^"]*"|'[^']*'|\S+)\s*(?:\s|$)/;
function pieceIsHarnessNodeInvocation(rawPiece) {
  const trimmed = String(rawPiece || '').trim();
  if (!NODE_HARNESS_PIECE.test(trimmed)) return false;
  // The full, unstripped argument list after `node`: does it name the
  // harness binary, quoted or not? (Mirrors READONLY_PIECE's own
  // alignment-harness\S* / "[^"]*alignment-harness[^"]*" shapes, but
  // against text that still has its quotes intact.)
  return /alignment-harness/.test(trimmed);
}

function isReadOnlyBash(cmd, { powershell = false } = {}) {
  if (/`|\$\(/.test(cmd)) return false; // command substitution can run anything
  const bare = stripQuoted(cmd).replace(/\d?>\s*\/dev\/null|2>&1/g, '');
  if (/>/.test(bare)) return false; // writes a file
  // Split both the stripped and the original command the same way, so piece
  // N in one lines up with piece N in the other — the stripped piece is
  // what most patterns match against; the raw piece is what the harness
  // node-invocation check (above) needs so a quoted path isn't invisible.
  const rawBare = cmd.replace(/\d?>\s*\/dev\/null|2>&1/g, '');
  const pieces = bare.split(/&&|\|\||[;|\n]/).map((s) => s.trim()).filter(Boolean);
  const rawPieces = rawBare.split(/&&|\|\||[;|\n]/).map((s) => s.trim()).filter(Boolean);
  return pieces.length > 0 && pieces.every((p, i) => {
    if (WRITES_IN_PIECE.test(p)) return false;
    if (pieceChangesSomething(p, rawPieces[i])) return false;
    if (READONLY_PIECE.test(p)) return true;
    if (powershell && READONLY_PS_PIECE.test(p)) return true;
    return pieceIsHarnessNodeInvocation(rawPieces[i]);
  });
}

// The harness's own commands that only read, or write inside the harness's data folder. These run
// without a permission prompt: otherwise a person in manual mode is asked, every message, to approve
// the agent recording its understanding. Commands that run arbitrary checks (contract verify),
// change settings (switch, config) or reach outside (setup) still go through the person's rules.
const HARNESS_BIN = path.join(core.PLUGIN_ROOT, 'bin', 'alignment-harness');
// Class B fix (see BRIEF.md; docs/build/*; plugin/docs/local-store.md): 87
// plugin skills instructed the agent to save into the harness's own records
// folder as their first move — `alignment-harness records <kind>` (prints
// the folder, already allowed below) followed by a raw shell redirect
// (`cat > file <<EOF`, `echo ... > file`) to actually write it. That second
// step is an ordinary Bash write the gate has no way to tell apart from any
// other file write, so when a person types the skill as their whole message
// (arming the gate) that save was blocked before the agent had done
// anything the gate recognizes as "understanding what was asked" — harness
// bookkeeping with no user-facing effect, failing for a reason that has
// nothing to do with the skill's own logic.
//
// The harness already ships the right tool for this: `store add <kind>
// --json '{...}'` (plugin/lib/store.js, documented in
// plugin/docs/local-store.md) writes one record into
// `<data>/records/<kind>/<id>.json` in a single self-contained command — no
// pipe, no heredoc, nothing for this gate to misclassify as an arbitrary
// write. It just wasn't in this allow-list yet. Adding it here, and
// repointing skills' save steps at `store add` instead of a raw redirect,
// closes Class B without inventing a second, parallel save mechanism.
// `store update` gets the same treatment: it only ever merges into an
// existing record inside the same data folder.
// Harness commands that run without a permission prompt: they only read, or write inside the
// harness's data folder. `settings list|get` only read. `contract replace` only rewrites one check,
// which still counts only once `contract verify` runs it (and verify, which runs code, still asks).
// Deliberately NOT here, so the person's normal permission rules still apply: `switch` and
// `settings set` (they can turn the agent's own checks down), `contract remove` and `clear` (they
// drop a promised check), `contract verify` (runs code), and opening the settings page.
const SAFE_HARNESS_SUB = /^(attest|score|status|doctor|conflicts|paths|session-id|store\s+(add|update)\s+\S+|contract\s+(add|list|replace)|settings\s+(list|get)|config\s+(show|path)|risk-table\s+(show|path))\b/;
// This plugin's own harness program, as a regex fragment. Every command shape that skips the
// person's permission prompt must name THIS file exactly. A looser "any path that ends in
// alignment-harness" let a command such as
//   node x.js; rm -rf ~/Documents; alignment-harness record foo <<'EOF'
// pass as bookkeeping, so everything in front of the harness call ran without asking
// (reported 4 Nov 2026 from a review on another machine).
const HARNESS_BIN_PATTERN = HARNESS_BIN.replace(/[.*+?^${}()|[\]\\]/g, (ch) => '\\' + ch);
const FALLBACK_IDIOM = new RegExp(String.raw`^\s*H=alignment-harness;\s*command -v \$H\s*>\s*\/dev\/null(\s*2>&1)?\s*\|\|\s*H="node ` + HARNESS_BIN_PATTERN + String.raw`";\s*\$H\s+`);

// The arguments of a command that is ONLY a call to this plugin's harness command (nothing chained,
// redirected or substituted), or null.
function harnessInvocation(cmd) {
  const c = String(cmd || '').replace(FALLBACK_IDIOM, 'alignment-harness ');
  if (/`|\$\(/.test(c)) return null;
  const m = c.match(new RegExp(`^\\s*(?:alignment-harness|node\\s+"?${HARNESS_BIN_PATTERN}"?)\\s+([\\s\\S]*)$`));
  if (!m) return null;
  const rest = m[1].replace(/\s*2>&1\s*$/, '');
  if (/[;&|<>\n]/.test(stripQuoted(rest))) return null;
  return rest.trim();
}

function safeHarnessCommand(cmd) {
  const rest = harnessInvocation(cmd);
  return rest !== null && SAFE_HARNESS_SUB.test(rest);
}

// `alignment-harness record <kind> [--name <file>]` is designed to take its
// content from stdin, which normally means a heredoc: `alignment-harness
// record foo <<'EOF' ... EOF`. harnessInvocation() above rejects any `<` or
// newline in the command as "chained/redirected", which is exactly right
// for telling a harness call apart from one piped into something else — but
// it would also reject this heredoc, the ONE shape `record` is meant to be
// called in. Recognize that specific shape on its own: the command must be
// nothing but `alignment-harness record <kind> [--name <safe-file>]`
// (or the fallback idiom), followed by a heredoc whose body is the record
// text and nothing else — no further `;`/`&&`/`|` after the heredoc's
// closing delimiter line. This still only ever writes inside the harness's
// own records folder (bin/alignment-harness's `record` command resolves the
// path itself; the kind/name are sanitized there too), so it is bookkeeping
// the same way `store add` already is, not a general-purpose write.
// `--name` accepts a bare filename, a shell variable, OR a literal string
// with one or more `$VAR`/`${VAR}` expansions embedded in it (quoted or
// not — e.g. `--name "$FILE"`, `--name "outcome-summary-$SESSION_ID.json"`)
// — a skill computing (part of) the target filename from a prior read-only
// step (see plugin/skills/agentic-actionable-tasks and
// plugin/skills/agent-outcome-summary) is just as much "record's own
// bookkeeping" as a literal name; bin/alignment-harness still sanitizes
// whatever the value resolves to at runtime, same as it does for a literal.
// Excludes `` ` `` and `$(` (command substitution) — isRecordHeredoc()
// already rejects the whole command if either appears anywhere, so this
// only needs to keep the charset itself narrow (letters, digits, the usual
// filename punctuation, and `$`/`{`/`}` for variable expansion).
const RECORD_HEREDOC_CMD = new RegExp(String.raw`^\s*(?:alignment-harness|node\s+"?` + HARNESS_BIN_PATTERN + String.raw`"?)\s+record\s+[A-Za-z0-9_-]+(?:\s+--name\s+"?[A-Za-z0-9_.$\{}-]+"?)?\s*(?:--json\s*)?<<[-~]?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1\s*\n([\s\S]*?)\n\2\s*$`);
function isRecordHeredoc(cmd) {
  const c = String(cmd || '').replace(FALLBACK_IDIOM, 'alignment-harness ');
  if (/`|\$\(/.test(c)) return false; // command substitution can run anything, even inside a heredoc body
  const m = c.match(RECORD_HEREDOC_CMD);
  if (!m) return false;
  // Bash ends the record text at the FIRST line that is the delimiter. If the delimiter also appears
  // earlier inside what the pattern took as the body, everything after that earlier line runs as
  // commands: `record foo <<'EOF'` / hi / EOF / rm -rf ~/x / EOF. (Found in a review, 4 Nov 2026.)
  const delimiter = m[2];
  if (m[3].split('\n').some((line) => line.replace(/^\t+/, '') === delimiter)) return false;
  return true;
}

// A Write/Edit/MultiEdit/NotebookEdit whose target path resolves inside the
// harness's own records folder (<data>/records/…) is the same bookkeeping,
// through a different tool — several skills use the Write tool directly
// instead of a shell redirect for this exact save step. Resolve `..` and
// symlinks before comparing so a path that only LOOKS like it is under
// records (e.g. "records-external/x" as a string prefix, or a symlink that
// hops back out) can't sneak through as if it were inside the folder.
const RECORDS_ROOT = path.join(core.P.data, 'records');
function resolveAsFarAsPossible(p) {
  // A file being newly created (or several missing parent directories deep,
  // as a fresh session's records/<kind>/ often is) has no realpath yet.
  // Walk up until an ancestor that DOES exist is found, resolve that one
  // (following any symlinks, e.g. macOS's /tmp -> /private/tmp), then
  // re-append the not-yet-existing tail — otherwise a missing intermediate
  // directory falls back to an UNresolved path.resolve(), which silently
  // stops comparing on the same footing as the (symlink-resolved) records
  // root and can wrongly call a real records-folder path "outside" it.
  let target = path.resolve(String(p));
  const tail = [];
  for (;;) {
    try { return path.join(fs.realpathSync(target), ...tail); } catch (_) { /* keep walking up */ }
    const parent = path.dirname(target);
    if (parent === target) return path.resolve(String(p)); // reached filesystem root without finding anything real
    tail.unshift(path.basename(target));
    target = parent;
  }
}
function isWriteInsideRecordsFolder(toolName, toolInput) {
  if (!EDIT_TOOLS.has(toolName)) return false;
  const raw = (toolInput && (toolInput.file_path || toolInput.notebook_path)) || '';
  if (!raw) return false;
  const resolvedRoot = resolveAsFarAsPossible(RECORDS_ROOT);
  const resolvedTarget = resolveAsFarAsPossible(String(raw));
  const rel = path.relative(resolvedRoot, resolvedTarget);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function allowHarnessCommand(input, switches) {
  const tool = String(input.tool_name || '');
  if ((switches.permissions || {}).allowHarnessCommands === false) return;
  const cmd = input.tool_input && input.tool_input.command;
  // PowerShell (Windows without Git Bash) runs harness commands the same way, but it evaluates a bare
  // ( … ), { … } or @( … ) inside an argument, so those never pass as "only a harness command" there.
  // The record heredoc is bash syntax, so on PowerShell a record save asks the person as usual.
  const isSafeBash = (tool === 'Bash' && (safeHarnessCommand(cmd) || isRecordHeredoc(cmd)))
    || (tool === 'PowerShell' && !psEvaluatesSomething(cmd) && safeHarnessCommand(cmd));
  const isRecordsWrite = isWriteInsideRecordsFolder(tool, input.tool_input);
  if (!isSafeBash && !isRecordsWrite) return;
  h.out(JSON.stringify({ hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'allow',
    permissionDecisionReason: 'Alignment harness command — it only reads, or writes inside the harness data folder.',
  } }));
  process.exit(0);
}

function attestCommand(sid) {
  return `node "${HARNESS_BIN}" attest --session ${sid} --certainty <1-100> --scope <TRUE|FALSE> --intent "<what they want and why, as you heard it, in their words>"`;
}

function mtimeMs(p) { try { return fs.statSync(p).mtimeMs; } catch (_) { return null; } }

// ── The full ritual, read once per session ───────────────────────────────
// Each message carries a short form of the ritual and the path to the full
// wording, because Claude Code shows the model only a short preview of long
// hook output. A pointer the agent never follows is a check it never sees in
// full, so: once per session, an attestation only counts after the agent has
// read the full ritual file. After that the short form is enough, and every
// block message carries the full wording, so an agent that is stopped is never
// short of what it is being asked for. Switch: coherenceGate.requireRitualReadOncePerSession.
function variantOf(sid) {
  try { return fs.readFileSync(path.join(core.P.coherence, `variant-${core.safeId(sid)}`), 'utf8').trim() || 'control'; } catch (_) { return 'control'; }
}
function ritualPathFor(sid) {
  // The same file user-prompt.js points the agent to for this session's wording.
  return path.join(core.PLUGIN_ROOT, 'prompts', variantOf(sid) === 'per-item-96-escalation' ? 'coherence-questions.per-item-96-escalation.txt' : 'coherence-ritual.txt');
}
function ritualReadMarker(sid) { return path.join(core.P.coherence, `ritual-read-${core.safeId(sid)}`); }
function samePath(a, b) {
  try { return fs.realpathSync(String(a)) === fs.realpathSync(String(b)); } catch (_) { return false; }
}
// A Read with no offset and no limit shorter than the file, or a plain `cat <file>` with nothing
// cutting it short, of this session's ritual file. Recorded whether or not a check is pending.
function recordRitualRead(input) {
  const sid = h.sessionIdOf(input);
  const ritual = ritualPathFor(sid);
  const tool = String(input.tool_name || '');
  const ti = input.tool_input || {};
  let full = false;
  if (tool === 'Read' && ti.file_path && samePath(ti.file_path, ritual)) {
    let lines = 0;
    try { lines = fs.readFileSync(ritual, 'utf8').split('\n').length; } catch (_) { /* unreadable */ }
    full = (!ti.offset || Number(ti.offset) <= 1) && (!ti.limit || Number(ti.limit) >= lines);
  } else if (tool === 'Bash' || tool === 'PowerShell') {
    const m = String(ti.command || '').match(/^\s*(?:cat|type|gc|Get-Content)\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s*(?:2>\s*\/dev\/null)?\s*$/i);
    full = !!m && samePath(m[1] || m[2] || m[3], ritual);
  }
  if (!full) return;
  try {
    fs.mkdirSync(core.P.coherence, { recursive: true });
    fs.writeFileSync(ritualReadMarker(sid), core.nowIso());
    core.log('CoherenceRitualRead', { sessionId: sid, tool });
  } catch (_) { /* can't record → the requirement below stays unmet, and maxBlocksPerMessage still bounds it */ }
}
function ritualReadStillNeeded(sid, cg) {
  if (cg.requireRitualReadOncePerSession === false) return false;
  if (cg.injectFullRitualText === true) return false; // the full wording is already pasted into every message
  if (!fs.existsSync(ritualPathFor(sid))) return false; // nothing to read → nothing to require
  return !fs.existsSync(ritualReadMarker(sid));
}
function fullRitualText(sid) {
  try { return fs.readFileSync(ritualPathFor(sid), 'utf8').trim(); } catch (_) { return ''; }
}
// The attestation (or printed check) is noted, but this session hasn't read the full ritual yet.
// Same limits as every other coherence block: "remind" never blocks, and maxBlocksPerMessage steps back.
function blockUntilRitualRead(sid, gateFile, tool, cg) {
  const ritual = ritualPathFor(sid);
  const msg = `Your check is noted, but this session hasn't read the full coherence ritual yet. Each message shows only a short form of it; once per session, read the full wording, then the short form is enough. That rule is only about reading the file. The coherence check itself is owed on every message they send.

Read the whole file now (Read with no offset or limit, or \`cat\`), then retry this call. Your attestation still stands; there's no need to attest again. If the full wording changes what you understood, correct your check in your reply first.

  ${ritual}

The full wording, so you are never short of it:
────────────────────────────────────────────────────────────
${fullRitualText(sid)}
────────────────────────────────────────────────────────────`;
  if (cg.strength === 'remind') {
    core.log('CoherenceRitualReadReminded', { sessionId: sid, tool });
    h.preToolNote(`Reminder from the alignment harness: ${msg}`);
  }
  const n = core.bumpBlockRound(sid, 'coherence', cg.blockRoundMs);
  if (cg.maxBlocksPerMessage && n > cg.maxBlocksPerMessage) return downgrade(sid, gateFile, tool);
  core.log('CoherenceRitualReadRequired', { sessionId: sid, tool, blockNumber: n });
  h.block(`BLOCKED — read the full ritual once this session. ${msg}
(Block ${n}${cg.maxBlocksPerMessage ? ` of ${cg.maxBlocksPerMessage}; after that this becomes a reminder` : ''}.)`);
}

function isUnderstandingCall(toolName, toolInput, doneFileBase) {
  if (UNDERSTANDING_TOOLS.has(toolName)) return true;
  // Class B (BRIEF.md): saving into the harness's OWN records folder — via
  // the `record` command's heredoc form, or a Write/Edit/MultiEdit whose
  // path resolves inside that folder — is bookkeeping, not a change to the
  // person's work. It must clear the coherence gate the same way
  // attest/score/store-add already do, or a skill's very first move (typed
  // as a person's whole message, arming this gate) gets blocked before the
  // agent has done anything the gate recognizes as "understanding what was
  // asked" — exactly the failure BRIEF.md describes.
  if (isWriteInsideRecordsFolder(toolName, toolInput)) return true;
  if (toolName === 'Bash') {
    const cmd = String((toolInput && toolInput.command) || '');
    if (cmd.includes(doneFileBase) || /coherence\/done-/.test(cmd)) return true; // the attestation itself
    if (harnessInvocation(cmd) !== null) return true; // attest, score, contract … talk to the harness
    if (isRecordHeredoc(cmd)) return true; // `record <kind> <<EOF ... EOF` — same bookkeeping, heredoc shape
    if (isReadOnlyBash(cmd)) return true;
    if (VERIFY_BASH.test(cmd)) return true; // verification changes nothing
    return false;
  }
  // Windows without Git Bash: Claude's command tool is PowerShell. Same rules, PowerShell's spelling.
  if (toolName === 'PowerShell') {
    const cmd = String((toolInput && toolInput.command) || '');
    if (cmd.includes(doneFileBase) || /coherence[\\/]done-/.test(cmd)) return true; // the attestation itself
    if (psEvaluatesSomething(cmd)) return false;
    if (harnessInvocation(cmd) !== null) return true;
    if (isReadOnlyBash(cmd, { powershell: true })) return true;
    if (VERIFY_BASH.test(cmd) || VERIFY_PS.test(cmd)) return true;
    return false;
  }
  // MCP tools that only look things up.
  if (/(_search$|_search_|__search|_query$|__query|_find$|__find|__read|__list|__get)/.test(toolName)) return true;
  return false;
}

// `attest` is the command that opens the coherence gate. It used to be taken on trust: an agent could run it
// without ever having printed the check, and the person saw nothing (reproduced in a live session: three blocked
// edits, then an attestation with a one-line intent, then the work went through). On a runtime that records the
// reply as it goes, the transcript shows what the agent has printed this turn, so there an attestation is refused
// while the turn's visible text holds no COHERENCE_CHECK. Where none of the turn's text is visible (a runtime
// that records the reply later) nothing can be checked, so the attestation is accepted, as before.
function attestShownNothing(input, tool, cg) {
  if ((tool !== 'Bash' && tool !== 'PowerShell') || cg.requirePrintedCheck === false) return false;
  const rest = harnessInvocation((input.tool_input && input.tool_input.command) || '');
  if (rest === null || !/^attest\b/.test(rest)) return false;
  const turn = transcript.currentTurn(input.transcript_path);
  if (!turn.found || !String(turn.assistantText || '').trim()) return false; // nothing visible to check: fail open
  return !/COHERENCE_CHECK/.test(turn.assistantText);
}
// A refused attestation is one more coherence block: same limit as every other, so it can never trap.
function refuseHollowAttest(sid, gateFile, tool, cg) {
  const msg = 'your attestation was not accepted: the reply so far has no COHERENCE_CHECK, so the user has not been shown what you understood. Print it now, in your reply to them (COHERENCE_CHECK on its own line, then each heading with a sentence and a certainty %), then attest again. Attesting does not replace showing it.';
  if (cg.strength === 'remind') {
    core.log('CoherenceAttestHollowReminded', { sessionId: sid, tool });
    h.preToolNote(`Reminder from the alignment harness: ${msg}`);
  }
  const n = core.bumpBlockRound(sid, 'coherence', cg.blockRoundMs);
  if (cg.maxBlocksPerMessage && n > cg.maxBlocksPerMessage) return downgrade(sid, gateFile, tool);
  core.log('CoherenceAttestRefused', { sessionId: sid, tool, blockNumber: n });
  h.block(`BLOCKED — ${msg}\n(Block ${n}${cg.maxBlocksPerMessage ? ` of ${cg.maxBlocksPerMessage}; after that this becomes a reminder` : ''}.)`);
}

function coherenceGate(input, switches) {
  const cg = switches.coherenceGate || {};
  if (cg.enabled === false || cg.strength === 'off') return;
  const sid = h.sessionIdOf(input);
  const gateFile = path.join(core.P.coherence, `required-${core.safeId(sid)}`);
  const doneFile = path.join(core.P.coherence, `done-${core.safeId(sid)}`);
  const gateMs = mtimeMs(gateFile);
  if (gateMs === null) return; // nothing armed: pass
  if (h.isSubagent(input)) return; // subagents execute; the parent carries the check
  const tool = String(input.tool_name || '');
  if (!tool) return;
  // An attestation opens the gate only for a check the person was actually shown (see attestShownNothing).
  if (attestShownNothing(input, tool, cg)) return refuseHollowAttest(sid, gateFile, tool, cg);
  if (isUnderstandingCall(tool, input.tool_input, `done-${core.safeId(sid)}`)) return;

  // PRIMARY: the agent attested by touching the done-file after this message.
  const doneMs = mtimeMs(doneFile);
  if (doneMs !== null) {
    if (doneMs >= gateMs - 2000) {
      if (ritualReadStillNeeded(sid, cg)) return blockUntilRitualRead(sid, gateFile, tool, cg); // done-file kept
      routeNewScope(input, sid, gateMs, gateFile, tool, cg); // blocks, or returns when the scope may proceed
      try { fs.unlinkSync(gateFile); } catch (_) { /* ignore */ }
      core.log('CoherenceGateAttested', { sessionId: sid, tool });
      return;
    }
    try { fs.unlinkSync(doneFile); } catch (_) { /* stale attestation from an earlier message */ }
  }

  // SECONDARY: on runtimes that write the agent's text to the transcript before
  // tool calls, the printed check itself clears the gate.
  if (input.transcript_path) {
    const text = transcript.assistantTextSince(input.transcript_path, gateMs - 60000);
    const hasCheck = text.includes('COHERENCE_CHECK');
    const hasScope = /ANY_NEW_SCOPE_INDICATED\s*=\s*(TRUE|FALSE)/.test(text);
    if (hasCheck && hasScope) {
      if (ritualReadStillNeeded(sid, cg)) return blockUntilRitualRead(sid, gateFile, tool, cg);
      routeNewScope(input, sid, gateMs, gateFile, tool, cg);
      try { fs.unlinkSync(gateFile); } catch (_) { /* ignore */ }
      core.log('CoherenceGateClearedFromTranscript', { sessionId: sid, tool });
      return;
    }
    if (hasCheck && cg.strength !== 'remind') {
      const n = core.bumpBlockRound(sid, 'coherence', cg.blockRoundMs);
      if (cg.maxBlocksPerMessage && n > cg.maxBlocksPerMessage) return downgrade(sid, gateFile, tool);
      h.block(`BLOCKED — Coherence check found, one line missing. This is a FORMATTING
requirement, not a permission request. Do NOT stop work or await approval.

Print on its own line at the END of your reply:
  ANY_NEW_SCOPE_INDICATED = FALSE  (no new scope) — that is ALL that is needed.
  ANY_NEW_SCOPE_INDICATED = TRUE   (message contains new scope, task, grievance,
     or desired change) — if TRUE, ALSO reflect the scope in this SAME reply so
     you are not stopped a second time:
       print NEW_SCOPE_REFLECTED on its own line, then NEW_SCOPE_1, NEW_SCOPE_2,
       etc., each restating one scope item in terms the user will immediately
       recognize (when it happens, what it contains, the intent it serves).

Then attest through the channel this hook can see mid-turn:

  ${attestCommand(core.safeId(sid))}

After attesting, CONTINUE THE ASSIGNED WORK immediately. The user's standing
directive: this gate must never cause you to stop working and hand control back.
The ONLY case where you wait for an explicit go is a HIGHEST_LEVERAGE block
(governer score >= 80), which announces itself as such.`);
    }
  }

  const questions = (() => {
    let variant = 'control';
    try { variant = fs.readFileSync(path.join(core.P.coherence, `variant-${core.safeId(sid)}`), 'utf8').trim() || 'control'; } catch (_) { /* control */ }
    return core.loadPrompt(`coherence-questions.${variant}.txt`) || core.loadPrompt('coherence-questions.control.txt');
  })();

  if (cg.strength === 'remind') {
    core.log('CoherenceGateReminded', { sessionId: sid, tool });
    h.preToolNote(`Reminder from the alignment harness: the user spoke and you have not written your COHERENCE_CHECK yet. Print it at the top of your reply before changing more.\n\n${questions}`);
  }

  const n = core.bumpBlockRound(sid, 'coherence', cg.blockRoundMs);
  if (cg.maxBlocksPerMessage && n > cg.maxBlocksPerMessage) return downgrade(sid, gateFile, tool);
  core.log('CoherenceGateBlocked', { sessionId: sid, tool, blockNumber: n });
  h.block(`BLOCKED — Coherence check not completed.

Coherence Issue Detected.  You have responded to a client message with a tool call instead of confirming understanding of the client's intent.  That is a violation of your core programming.  When the client sends a message, your FIRST step before tool calling MUST include performing a coherence check as this will allow for any misinterpretation to be caught at its moment of inception, which will enable you to perform the most critical function of your existence — the maintenance of alignment and clarity of the client's intent.  Proceed now and after all following client messages by printing COHERENCE_CHECK on its own line, then print your understanding of the user's message BEFORE using any tools that change things.

IMPORTANT: Print COHERENCE_CHECK on its own line BEFORE answering these questions. This exact phrase signals you completed the coherence check.

${questions}

Print COHERENCE_CHECK on its own line FIRST, then answer the questions above.

THEN ATTEST (required on this runtime — the hook cannot see your printed text
mid-turn): after you have printed the FULL check in this same response —
COHERENCE_CHECK, the answers, ANY_NEW_SCOPE_INDICATED = TRUE/FALSE, scope
reflections + NEW_SCOPE_REFLECTED when TRUE, and HIGHEST_LEVERAGE_ACK if this
session's governer score is >= 80 — run this exact allowlisted command:

  ${attestCommand(core.safeId(sid))}

Attesting WITHOUT having printed the full check first is a violation of the
user's core alignment protocol and is auditable (your visible response and
the attestation are both on the record).

Note: Reading files, searching, and querying knowledge oracles are NOT blocked —
those help you understand. Only tools that CHANGE things (Edit, Write, destructive
commands) are blocked until you demonstrate understanding.

When this does not fit: the check is for a person speaking to you. If what came in was not a person (a background agent's or a tool's notice, with nothing of theirs to understand), print COHERENCE_CHECK with one sentence saying so and ANY_NEW_SCOPE_INDICATED = FALSE, then attest.
(Block ${n}${cg.maxBlocksPerMessage ? ` of ${cg.maxBlocksPerMessage}; after that this becomes a reminder` : ''}.)${fullRitualForBlock(sid, questions)}`);
}

// ── New scope, routed on the real score (the author's gate, restored 2026-10-17) ──────────────────────
// When the check says ANY_NEW_SCOPE_INDICATED = TRUE, the agent restates each scope item (NEW_SCOPE_REFLECTED)
// before it changes anything; at governer score 80 or more it first names the stakes and prints
// HIGHEST_LEVERAGE_ACK, then waits for the user's go. Inconsequential scope (score under 40 and user impact
// under 20) flows through, and once one scope has been routed this session later ones refer to that score.
// Only what the transcript shows can be checked: where none of the turn's text is visible, this fails open.
function scopeRoutedFile(sid) { return path.join(core.P.coherence, `scope-routed-${core.safeId(sid)}`); }
// Each kind of scope block counts its own blocks ('scope' for the restatement and the missing score,
// 'highLeverage' for the top-band acknowledgement), with the same limit as every other coherence block.
// They do not share the coherence blocks' count: the blocks that come first on a message (check missing,
// one line missing) would otherwise use up the limit, the gate would step back to a reminder, and the
// restatement the author ruled back in would never be asked for. Each still steps back after the limit.
function scopeBlock(sid, gateFile, tool, cg, event, message, counter) {
  if (cg.strength === 'remind') { core.log(`${event}Reminded`, { sessionId: sid, tool }); h.preToolNote(`Reminder from the alignment harness:\n${message}`); }
  const n = core.bumpBlockRound(sid, counter || 'scope', cg.blockRoundMs);
  if (cg.maxBlocksPerMessage && n > cg.maxBlocksPerMessage) return downgrade(sid, gateFile, tool);
  core.log(event, { sessionId: sid, tool, blockNumber: n });
  h.block(`${message}\n(Block ${n}${cg.maxBlocksPerMessage ? ` of ${cg.maxBlocksPerMessage}; after that this becomes a reminder` : ''}.)`);
}
function routeNewScope(input, sid, gateMs, gateFile, tool, cg) {
  if (cg.requireScopeReflection === false || !input.transcript_path) return;
  const text = transcript.assistantTextSince(input.transcript_path, gateMs - 2000);
  if (!text.trim()) return; // nothing visible to check: fail open
  const lastTrue = text.lastIndexOf('ANY_NEW_SCOPE_INDICATED = TRUE');
  if (lastTrue < 0 || lastTrue < text.lastIndexOf('ANY_NEW_SCOPE_INDICATED = FALSE')) return;
  if (fs.existsSync(scopeRoutedFile(sid))) return; // already routed this session: refer to that score
  const cs = core.currentScore(sid);
  const attest = attestCommand(core.safeId(sid));
  if (!cs.scored) {
    return scopeBlock(sid, gateFile, tool, cg, 'ScopeRoutingNeedsScore', `BLOCKED — Cannot route this scope: the governer has not scored this task this session.

Do NOT assume a score. Run /alignment-harness:governer on this scope now. It computes
touchesUserState, blast radius, and the overall score — then this gate routes
stop-vs-proceed on REAL signal:
  • Consequential (user-facing / high blast radius / score >= 40) → reflect & confirm with the human.
  • Inconsequential (internal experiment, no user impact, score < 40) → reflect inline and proceed without stopping.

The remedy is to run /alignment-harness:governer, not to wait. Once it has written state, retry.

When this does not fit: if the message held no new scope after all, print ANY_NEW_SCOPE_INDICATED = FALSE with one sentence saying why, then retry; no score is needed for that.`);
  }
  const g = (cs.state && cs.state.governer) || {};
  const touch = Number(g.degreeToWhichThisTaskAffectsWhatUsersExperience);
  if (cs.score < 40 && Number.isFinite(touch) && touch < 20) return; // inconsequential: reflected inline, proceed
  const top = cs.score >= 80 && cg.highestLeverageWait !== false;
  if (top && !text.includes('HIGHEST_LEVERAGE_ACK')) {
    return scopeBlock(sid, gateFile, tool, cg, 'HighestLeverageAckRequired', `BLOCKED — HIGHEST-LEVERAGE SCOPE (governer score ${cs.score}/100, user-impact ${Number.isFinite(touch) ? touch : 'unknown'}).

This is top-band work — the same tier as payment, auth, or core-coaching changes.
A routine "here's the scope, confirming" is NOT sufficient here. Before you touch
anything, you must communicate the gravity to the user in plain language:

  1. Name WHY this scored in the top band — which of the four sub-scores drove it
     (user impact / agent-compounding / cross-system spread / breaks-existing-wins),
     in one sentence each, in the user's voice (no jargon, /speak-human register).
  2. State the single worst thing that happens if you get this wrong.
  3. State what you will verify with EVIDENCE to prove it's safe before proceeding.
  4. Then print HIGHEST_LEVERAGE_ACK on its own line and WAIT for the user's
     explicit go. This >= 80 band is the ONE AND ONLY block in this gate where
     stopping and waiting is correct — every other block means "print the
     required lines, attest, and continue working."

This is the user's standing instruction: when the score is really high, the
communication itself must be special — proportional to the stakes, not the usual confirm.

When this does not fit: if the score on file belongs to an earlier, different task, score this task with
/alignment-harness:governer first. The wait is only for work that is itself top-band.`, 'highLeverage');
  }
  if (!text.includes('NEW_SCOPE_REFLECTED')) {
    return scopeBlock(sid, gateFile, tool, cg, 'NewScopeNotReflected', `BLOCKED — New scope detected but not reflected back to the user.

${core.loadPrompt('scope-reflection.txt').trim()}

Once you have printed NEW_SCOPE_REFLECTED and each NEW_SCOPE_N item, attest:

  ${attest}

This is a formatting requirement, NOT a request for approval. After attesting,
CONTINUE THE ASSIGNED WORK in the same turn or the next — do not stop and wait
for a reply. The user corrects a wrong reflection faster than the user answers a
stopped agent. The ONLY block that waits for an explicit go is HIGHEST_LEVERAGE
(governer score >= 80).

When this does not fit: if the message held no new scope after all, print ANY_NEW_SCOPE_INDICATED = FALSE with one sentence saying why, then retry.`);
  }
  try { fs.writeFileSync(scopeRoutedFile(sid), core.nowIso()); } catch (_) { /* a lost mark only re-asks */ }
  if (top) {
    try { fs.writeFileSync(core.highLeverageWaitFile(sid), String(cs.score)); } catch (_) { return; /* fail open */ }
    core.log('HighestLeverageWaitStarted', { sessionId: sid, score: cs.score });
    try { fs.unlinkSync(gateFile); } catch (_) { /* the check itself is done */ }
    holdForGo(sid, tool, cg, cs.score); // this call waits too, not only the ones after it
  }
}
function holdForGo(sid, tool, cg, score) {
  const message = `WAITING FOR THE USER'S GO — you printed HIGHEST_LEVERAGE_ACK for top-band work (governer score ${score}).
What this is for: at this score a wrong move can hurt real people or break what already works, so the user decides before anything changes. Reading and searching still work.
End your reply here and wait. The user's next message lifts this.
When this does not fit: if the score belongs to an earlier, different task, score this task with /alignment-harness:governer; below 80 the wait ends at once.`;
  if (cg.strength === 'remind') { core.log('HighestLeverageWaitReminded', { sessionId: sid, tool }); h.preToolNote(`Reminder from the alignment harness:\n${message}`); }
  core.log('HighestLeverageWaitHeld', { sessionId: sid, tool });
  h.block(message);
}

// After HIGHEST_LEVERAGE_ACK the agent waits for the user's go: changing tools are held until the user speaks
// (hooks/user-prompt.js ends the wait). Reading, searching and harness commands still work. If the task is
// rescored below 80 the wait ends at once, so a stale top-band score can be corrected in the open.
function highestLeverageWait(input, switches) {
  const cg = switches.coherenceGate || {};
  if (cg.enabled === false || cg.strength === 'off' || cg.highestLeverageWait === false) return;
  if (h.isSubagent(input)) return;
  const sid = h.sessionIdOf(input);
  const f = core.highLeverageWaitFile(sid);
  if (!fs.existsSync(f)) return;
  const tool = String(input.tool_name || '');
  if (!tool || isUnderstandingCall(tool, input.tool_input, `done-${core.safeId(sid)}`)) return;
  const cs = core.currentScore(sid);
  if (!cs.scored || cs.score < 80) {
    try { fs.unlinkSync(f); } catch (_) { /* ignore */ }
    core.log('HighestLeverageWaitEnded', { sessionId: sid, reason: 'rescored-below-80' });
    return;
  }
  holdForGo(sid, tool, cg, cs.score);
}

// A stopped agent sees the whole ritual, not only the short questions — unless they are the same text.
function fullRitualForBlock(sid, questionsShown) {
  const full = fullRitualText(sid);
  if (!full || full === String(questionsShown || '').trim()) return '';
  return `

The full coherence ritual (${ritualPathFor(sid)}):
────────────────────────────────────────────────────────────
${full}
────────────────────────────────────────────────────────────`;
}

function downgrade(sid, gateFile, tool) {
  try { fs.unlinkSync(gateFile); } catch (_) { /* ignore */ }
  core.log('CoherenceGateDowngraded', { sessionId: sid, tool });
  h.preToolNote('The coherence gate blocked several times on this message and has stepped back to a reminder so you are not stuck. Please still print COHERENCE_CHECK and your understanding at the top of your reply.');
}

function governerGate(input, switches) {
  const gv = switches.governer || {};
  if (gv.enabled === false || gv.gateStrength === 'off') return;
  const tool = String(input.tool_name || '');
  if (!EDIT_TOOLS.has(tool)) return;
  // Same Class B carve-out as the coherence gate: a Write/Edit into the
  // harness's own records folder is bookkeeping with no user-facing effect,
  // not a coding change — it doesn't need a governer score any more than
  // `alignment-harness store add` does.
  if (isWriteInsideRecordsFolder(tool, input.tool_input)) return;
  if (h.isSubagent(input) && gv.applyToSubagents === false) return;
  const sid = h.sessionIdOf(input);
  const cs = core.currentScore(sid);
  if (cs.scored) return;

  const how = 'Run /alignment-harness:governer on the task you are about to do. It asks what could go wrong for a real person and how far a mistake would travel, then records the score with `alignment-harness score ...`. Then retry this edit. One score per task — after that, edits flow.';
  if (gv.gateStrength === 'remind') {
    core.log('GovernerGateReminded', { sessionId: sid, tool });
    h.preToolNote(`Reminder from the alignment harness: this task has no governer score yet, so no other check knows how careful to be. ${how}`);
  }
  const prior = core.getBlocks(sid, 'governer');
  if (gv.maxBlocksPerSession && prior >= gv.maxBlocksPerSession) {
    core.log('GovernerGateAdvisory', { sessionId: sid, tool, blocks: prior });
    h.preToolNote(`ADVISORY (the coding gate already blocked ${prior} times this session and has stepped back to a reminder): this task still has no governer score. ${how}`);
  }
  const n = core.bumpBlocks(sid, 'governer');
  core.log('GovernerGateBlocked', { sessionId: sid, tool, blockNumber: n, scoredBy: cs.scoredBy });
  const why = cs.scoredBy === 'unscored' && cs.state && cs.state.governer && cs.state.governer.error
    ? `\nThe last scoring attempt failed: ${cs.state.governer.error}. The session is marked "unscored" — nothing was guessed.`
    : '';
  // The author's block (pre-tool-governer-gate.sh). His governer scored automatically on every message;
  // here the agent runs it, so only that piece is swapped for the plugin's working equivalent.
  h.block(`BLOCKED: Governer has not scored this task.${why}

Agent, you cannot write code until the governer has run. This happens when you run
/alignment-harness:governer on the task you are about to do (it records the score with
\`alignment-harness score ...\`). If you're seeing this, it means it has not run for this task yet.

Do NOT retry this Edit/Write. Instead:
1. State the user's intent in 1 sentence
2. The governer will score when you run /alignment-harness:governer
3. Then proceed with coding

This gate exists because unscored work leads to scope misalignment.

When this does not fit: if this edit is not part of the user's work at all (a scratch file only you use), say so in one sentence and record its honest, low score, \`alignment-harness score --task "<what it is>" --ac 1 --hp 1 --ew 1\`; edits then flow.
(Block ${n}${gv.maxBlocksPerSession ? ` of ${gv.maxBlocksPerSession}; after that this becomes a reminder` : ''}.)`);
}

// ── Subagent hand-off: remember the real task text ────────────────────────
// Claude Code's SubagentStart event does not carry the task the subagent was
// given, which is why the author's subagent scoring saw no task and wrote a
// flat 50 almost every time. The Agent tool call does carry it, so it is
// stashed here and picked up by subagent-start.js a moment later.
function stashSubagentTask(input) {
  const tool = String(input.tool_name || '');
  if (tool !== 'Agent' && tool !== 'Task') return;
  const ti = input.tool_input || {};
  const sid = h.sessionIdOf(input);
  try {
    const dir = path.join(core.P.data, 'state', 'subagents');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, `${core.safeId(sid)}.pending.jsonl`), `${JSON.stringify({
      at: Date.now(), description: String(ti.description || '').slice(0, 300), prompt: String(ti.prompt || '').slice(0, 6000), subagentType: ti.subagent_type || null,
    })}\n`);
  } catch (_) { /* ignore */ }
}

// ── Search memory before searching code (once per session) ───────────────
const CODE_SEARCH_BASH = /^\s*(grep|rg|ag|ack|find|git grep)\b/;
function intentSearchGate(input, switches) {
  const ig = switches.intentSearchGate || {};
  if (ig.strength === 'off') return;
  if (h.isSubagent(input)) return;
  const tool = String(input.tool_name || '');
  const sid = h.sessionIdOf(input);
  const marker = path.join(core.P.data, 'state', 'intent-search', `${core.safeId(sid)}.resolved`);
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  const isMemorySearch = /agent_find/.test(tool) || /agent-find\/cli\.js/.test(cmd);
  if (isMemorySearch) {
    try { fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, 'searched'); } catch (_) { /* ignore */ }
    return;
  }
  const isCodeSearch = tool === 'Grep' || tool === 'Glob' || (tool === 'Bash' && CODE_SEARCH_BASH.test(cmd))
    || (tool === 'PowerShell' && (CODE_SEARCH_BASH.test(cmd) || /^\s*(Select-String|sls)\b/i.test(cmd)));
  if (!isCodeSearch || fs.existsSync(marker)) return;
  // Fire once per session, whether or not the agent follows it.
  try { fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, 'prompted'); } catch (_) { return; }
  const cli = `node "${path.join(core.PLUGIN_ROOT, 'mcp', 'agent-find', 'cli.js')}" "<what you are looking for>"`;
  const msg = `Please ask yourself what question you need to ask. What are you looking
to understand? What are you uncertain about? Run agent_find about that
question.

Start there. That will unlock your other search tools. You need access
to institutional knowledge before searching through random code.

If you're unclear about two different things, run agent_find on each of
them in parallel.

Tool to call:  agent_find  (from the alignment-harness plugin; or its CLI fallback at
  ${cli.replace('<what you are looking for>', '<your intent question>')})

This gate fires only once per session. After this message, code search
will pass through normally — but please run agent_find first.

When this does not fit: if nothing is known yet to search (a brand-new, empty project), say so in one sentence and retry the search.`;
  core.log('IntentSearchGate', { sessionId: sid, tool, strength: ig.strength || 'block-once' });
  if (ig.strength === 'remind') h.preToolNote(msg);
  h.block(`🛑 Intent-Search Gate\n\n${msg}`);
}

h.run('pre-tool', (input) => {
  const { switches } = core.loadSwitches();
  stashSubagentTask(input);
  // Fail open: no usable session id, or no way to save state → never block.
  if (!h.hasSessionId(input)) return;
  if (!core.canPersist()) {
    core.log('GatesOpenStateUnwritable', { tool: input.tool_name || null });
    return;
  }
  recordRitualRead(input);
  intentSearchGate(input, switches);
  highestLeverageWait(input, switches);
  coherenceGate(input, switches);
  governerGate(input, switches);
  allowHarnessCommand(input, switches);
});

'use strict';
// Stop / SubagentStop — the evidence gate.
//
// What it is for: an agent saying "it works" is not the same as it working.
// When the agent tries to finish, this checks what it actually DID this turn:
//   A. It edited source files but ran nothing at all → send it back to run
//      something (when the task's score is at the dial's threshold, or the
//      task was never scored).
//   B. The task has a verification contract (score >= dial) with unchecked
//      items → send it back to check them.
//   C. Its last message claims something works / passes / is fixed / is live,
//      and nothing this turn ran anything that could show it → send it back.
// None of these apply to a turn whose only commands were the harness's own and
// which edited no files (a calibration report, a score, an attestation): there
// is no work to prove, and the agent's reply to the gate would reach the person.
//
// It can never loop: Claude Code sets stop_hook_active when a stop was already
// sent back once, and this hook then always lets the agent finish. It also
// steps back to a reminder after a per-session number of blocks.

const core = require('../lib/core');
const transcript = require('../lib/transcript');
const { withoutHarnessCommands, onlyHarnessCommands } = require('../lib/commands');
const h = require('./common');

const CLAIMS = {
  runtime: /(is (now )?working|it works\b|works (as expected|correctly|properly|now|fine)|endpoint (returns|responds|now)|API (returns|responds|now)|server (returns|responds|is running)|page (renders|loads|displays|shows)|component (renders|loads|displays)|function (returns|works|now)|route (returns|works|responds)|returns? (200|201|the (correct|expected|right))|responds? with|successfully (returns|responds|serves|renders|handles))/i,
  fix: /(\bfixed it\b|(bug|issue|problem|error|crash) is (gone|fixed)|no longer (fails|crashes|errors|breaks)|bug (is|has been) (fixed|resolved|eliminated)|issue (is|has been) (fixed|resolved|eliminated)|problem (is|has been) (fixed|resolved|solved)|error (is|has been) (fixed|resolved|eliminated)|fix (is|has been) (verified|confirmed|applied and working)|the fix works|fixed and (working|verified|confirmed|tested))/i,
  tests: /((all|every) (of the )?(tests?|specs?) (pass|passes|passed|are passing|are green)|tests are green|all green|(all|every) (tests?|specs?) now pass|all tests? pass|tests? (are )?(passing|green|succeeding)|test suite (passes|is green|clean)|all [0-9]+ tests? pass|specs? (pass|passing|green)|tests? (passed|succeeded))/i,
  deploy: /((^|[.!]\s*)deployed\b|it'?s (now )?live|\bnow live\b|is (now )?live|is (now )?deployed|has been deployed|successfully deployed|pushed to production|shipped to (production|staging|prod)|is in production|changes are live|deploy(ment)? (succeeded|successful|complete))/i,
  verified: /(I.ve (verified|confirmed|validated|tested) (that |it )|verified (that |it )?(works|passes|returns|responds|functions)|confirmed (that |it )?(works|passes|returns|responds|functions)|validated (that |it )?(works|passes|returns|responds))/i,
  selfScore: /(self.eval.*\b([89][0-9]|100)\b|score.*\b([89][0-9]|100)\/100)/i,
  functional: /(feature (is|now) (working|functional|operational|complete and working)|everything (is )?(working|functional|operational)|fully (working|functional|operational)|end.to.end.*(working|functional|verified)|pipeline (is )?(working|functional|operational))/i,
  implicit: /(successfully implemented and (verified|tested|confirmed)|implementation is (complete|done) and (working|verified|tested)|changes (are )?(working|verified|tested) (correctly|properly|as expected))/i,
  operational: /(now (handles|processes|accepts|rejects|validates|authenticates|authorizes)|correctly (handles|processes|accepts|rejects|validates)|properly (handles|processes|accepts|rejects|validates))/i,
  savings: /(\$[0-9]+(\.[0-9]+)? saved|saves? \$[0-9]|[0-9]+% (faster|slower|improvement|reduction|increase)|reduced (latency|cost|errors|failures) by)/i,
};
const NORMAL_SKIP = new Set(['selfScore', 'savings']);

const SOURCE_FILE = /\.(jsx?|tsx?|mjs|cjs|css|scss|vue|svelte|py|rb|go|rs|java|kt|swift|php|cs|c|cc|cpp|h|hpp|sh|sql)$/i;

// A command that runs something (as opposed to reading or editing).
const RUNS_SOMETHING = /(^|[\s;&|(])(npm (test|run)|npx |yarn |pnpm |bun |jest|vitest|pytest|python3? |node |deno |go (test|run)|cargo (test|run)|make |mvn |gradle|rspec|phpunit|dotnet (test|run)|swift (test|run)|curl |wget |http |playwright|cypress|mongosh|psql|mysql |redis-cli|sqlite3|docker |kubectl |bash \S+\.sh|sh \S+\.sh|\.\/\S+|Invoke-WebRequest |iwr |Invoke-RestMethod |irm |Invoke-Pester|\.\\\S+)/i;

function claimFound(text, sensitivity) {
  const hits = [];
  for (const [k, re] of Object.entries(CLAIMS)) {
    if (sensitivity === 'normal' && NORMAL_SKIP.has(k)) continue;
    if (re.test(text)) hits.push(k);
  }
  return hits;
}

function evidenceIn(turn) {
  const kinds = [];
  for (const u of turn.toolUses) {
    const n = String(u.name || '');
    // The harness's own commands (score, attest, contract, memory search) are bookkeeping, not proof.
    if ((n === 'Bash' || n === 'PowerShell') && RUNS_SOMETHING.test(withoutHarnessCommands((u.input && u.input.command) || ''))) kinds.push('ran-a-command');
    if (/playwright|puppeteer|chrome|browser|devtools|preview|screenshot|navigate/i.test(n)) kinds.push('browser');
  }
  const results = turn.toolResults.join('\n');
  if (/(Tests?:\s+\d+ (passed|failed)|Test Suites?:\s+\d+|\b\d+ passing\b|\b\d+ passed\b|PASS\s+\S+|FAIL\s+\S+|test result:)/.test(results)) kinds.push('test-output');
  if (/(HTTP\/[12](\.\d)?\s+\d{3}|\b(200 OK|201 Created|204 No Content)\b)/.test(results)) kinds.push('http-response');
  return [...new Set(kinds)];
}

// A turn whose only commands were the harness's own (calibration, attest, score, status, records…) and which
// edited nothing has no work to prove: holding it only makes the agent answer the gate in front of the person.
// An edit, or any other tool that can act, takes the turn out of this.
const BOOKKEEPING_TOOLS = new Set(['Bash', 'PowerShell', 'Read', 'Grep', 'Glob', 'LS', 'Skill', 'ToolSearch', 'TodoWrite', 'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet']);
function onlyHarnessWork(turn) {
  const uses = turn.toolUses;
  const bash = uses.filter((u) => u.name === 'Bash' || u.name === 'PowerShell');
  if (!bash.length) return false;
  if (uses.some((u) => !BOOKKEEPING_TOOLS.has(String(u.name || '')))) return false;
  return bash.every((u) => onlyHarnessCommands((u.input && u.input.command) || ''));
}

function sourceEdits(turn) {
  return turn.toolUses.filter((u) => ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(u.name)
    && SOURCE_FILE.test(String((u.input && (u.input.file_path || u.input.notebook_path)) || '')));
}

h.run('stop', (input) => {
  if (input.stop_hook_active === true) return; // loop-break: never send back twice in a row
  if (!h.hasSessionId(input)) return; // can't tell sessions apart → never block
  const { switches } = core.loadSwitches();
  const eg = switches.evidenceGate || {};
  const isSubagentStop = input.hook_event_name === 'SubagentStop';
  const evidenceOn = !(eg.enabled === false || eg.strength === 'off' || (isSubagentStop && eg.applyToSubagents === false));

  const sid = h.sessionIdOf(input);
  const tpath = isSubagentStop && input.agent_transcript_path ? input.agent_transcript_path : input.transcript_path;
  const turn = transcript.currentTurn(tpath);
  const lastMsg = String(input.last_assistant_message || '') || turn.assistantText.slice(-4000);
  const tail = lastMsg.slice(-4000);
  const cs = core.currentScore(sid);
  // WIP: only this turn's evidence counts, so proof shown a turn or two earlier
  // is ignored. See hooks/WIP-stop-evidence-across-turns.md.
  const evidence = evidenceIn(turn);
  if (onlyHarnessWork(turn)) { core.log('EvidenceGatePass', { sessionId: sid, reason: 'only-harness-commands-no-edits' }); return; }

  // ── D. The hand-back (on-turn-end + complete-agentic-task + corrections) ──
  // A reminder, never a block (the author's ruling, 2026-10-17). Stop-hook text on a normal exit never
  // reaches the model, so the reminder is saved and put in front of the agent at the start of its next
  // turn (hooks/user-prompt.js), where it can still hand the work back. The user is never held up.
  function turnEnd() {
    if (isSubagentStop) return;
    const te = switches.turnEnd || {};
    const cp = switches.correctionPatterns || {};
    const skillsUsed = turn.toolUses.filter((u) => u.name === 'Skill').map((u) => String((u.input && u.input.skill) || ''));
    const handedBack = skillsUsed.some((n) => /on-turn-end|complete-agentic-task|consume|update-the-founder|communicate-what-you-finished/.test(n));
    const threshold = Number(te.scoreAbove === undefined ? 40 : te.scoreAbove);
    const substantive = (cs.scored && cs.score > threshold && turn.toolUses.length > 0) || (!cs.scored && edits.length > 0);
    const parts = [];
    if (te.enabled !== false && te.strength !== 'off' && substantive && !handedBack) {
      const ceremony = !cs.scored ? 'This task was never scored, so give the full hand-back and say it was unscored.'
        : cs.score < 60 ? `Score ${cs.score}: a brief hand-back — how to see it, one or two sentences on what changed for people.`
          : `Score ${cs.score}: the full hand-back.`;
      // The author's reminder (stop-on-turn-end-reminder.sh), "founder" made "the user" and the skill namespaced.
      parts.push(`🔔 on-turn-end — this turn scored ${cs.scored ? cs.score : 'unknown'} (> 40 or unknown), so before you finish:

Run /alignment-harness:on-turn-end. It routes you to the right hand-off so the user can see,
understand, and act on what you did in seconds — without reading pages of output:

  • Finished user-facing work, or fixed a bug  → /consume (show the exact click-path)
  • Large remaining scope                       → /gap then /propose (name the next milestone, get approval)
  • Otherwise                                    → /update-the-founder (clear, scannable synthesis)
  • Have a question                              → /ask
  • The user flagged confusion this turn      → /calibrate

The very last thing you print should be the 20–30 second "here's exactly where to
review my work" — a clickable URL or one command.

${ceremony}
It must contain: (1) HOW TO SEE IT — the exact steps the user takes (a page to open and what to click, or for work with no screen the one command they'd run) and what they will see that proves it; (2) WHAT CHANGED FOR PEOPLE — "When [situation], people now [experience] because [why]", one line per change; (3) ANYTHING UNFINISHED, in one sentence. ${edits.length ? `Files you edited this turn: ${[...new Set(edits.map((e) => String(e.input.file_path || e.input.notebook_path).split(/[\\/]/).slice(-2).join('/')))].slice(0, 8).join(', ')}.` : ''}
Before calling anything complete, check every assumption you made about how the code works against the real code or a real run.`);
    }
    if (te.requirementCapture !== false && te.enabled !== false
      && /(^|\W)(I want|it should|we need|make it so|we should|I need|it needs to|it must|please (add|build|create|make)|needs to be|should be able to|must be able to)\b/i.test(turn.humanText || '')
      && !turn.toolUses.some((u) => /Task(Create|Update)|TodoWrite/.test(u.name))) {
      parts.push('The user stated requirements this turn ("I want", "it should", …) and no task was created for them. Create a task for each (TaskCreate), in their words, so they are not lost across sessions.');
    }
    if (cp.enabled !== false) {
      let pats = [];
      try { pats = require('../lib/records').matchingCorrections(`${turn.humanText || ''}\n${lastMsg}`, Number(cp.maxPerTurn || 3)); } catch (_) { pats = []; }
      if (pats.length) {
        core.log('CorrectionPatternFired', { sessionId: sid, ids: pats.map((p) => p.id) });
        parts.push(`Standing corrections from this user that apply to this turn — check your last message against each and fix it if it falls short:\n${pats.map((p) => `- ${p.label}: ${p.correctionDirective}`).join('\n')}`);
      }
    }
    if (!parts.length) { core.log('TurnEndPass', { sessionId: sid, substantive, handedBack }); return; }
    const saved = core.saveTurnEndReminder(sid, `<turn-end-reminder>
What this is for: the user should be able to see, understand and act on what your last turn did in seconds, without asking. It applies when that turn changed something or did real work. It does not apply if your last reply already did all of this, or only answered a question; then ignore it.
Last turn ended without this:

${parts.join('\n\n')}

Do it in this reply, before or alongside whatever the user asks now. This is a reminder; nothing waits on it.
</turn-end-reminder>`);
    core.log('TurnEndReminderSaved', { sessionId: sid, score: cs.score, scoredBy: cs.scoredBy, reasons: parts.length, saved });
  }


  const send = (reason, message) => {
    const prior = core.getBlocks(sid, 'evidence');
    if (eg.strength === 'remind' || !core.canPersist() || (eg.maxBlocksPerSession && prior >= eg.maxBlocksPerSession)) {
      core.log('EvidenceGateReminded', { sessionId: sid, reason, blocks: prior });
      h.userNote(`Alignment harness: the agent finished, but ${reason}. You may want to ask it to show proof.`);
    }
    core.bumpBlocks(sid, 'evidence');
    core.log('EvidenceGateBlocked', { sessionId: sid, reason, score: cs.score, scoredBy: cs.scoredBy, subagent: isSubagentStop });
    h.block(message);
  };

  // ── E. A proof check was changed: the user is told in the same reply ─────
  // An agent may fix a broken check (a typo, a path that doesn't exist here) with `contract replace` or drop
  // one that no longer belongs with `contract remove`, but only in the open: the first time it tries to finish
  // after such a change, it is sent back once to tell the user what the check was, what it is now, and why.
  const vcNow = cs.state && cs.state.verificationContract;
  const untold = ((vcNow && vcNow.changes) || []).filter((c) => !c.toldUser);
  if (evidenceOn && untold.length) {
    core.markContractChangesTold(sid);
    const lines = untold.map((c) => `  - Check ${c.item} ${c.action}. It was: ${c.before.intentStatement} (verify: ${c.before.verificationCommand}).${c.after ? ` It is now: ${c.after.intentStatement} (verify: ${c.after.verificationCommand}).` : ''} Why: ${c.why || '(no reason given)'}`).join('\n');
    send(`it changed ${untold.length} proof check(s) this session:\n${lines}`, `<proof-check-changed>
What this is for: a proof check is how the user knows "done" means a real check ran and passed. A check that was itself written wrong may be fixed, but only in the open.

You changed these checks:
${lines}

Tell the user in this reply, in plain words: what each check was, what it is now, and why. If your last message already says exactly this, simply finish.
Never loosen a check because it fails: a failing check is the proof doing its job. Fix the work instead.
</proof-check-changed>`);
  }

  // ── B. Verification contract (score >= dial) ─────────────────────────────
  const vc = cs.state && cs.state.verificationContract;
  const contractAt = Number(eg.contractsAtScore || 60);
  if (evidenceOn && vc && vc.required && Array.isArray(vc.items) && vc.items.length && cs.scored && cs.score >= contractAt) {
    const open = vc.items.map((it, i) => ({ ...it, n: i + 1 })).filter((it) => !it.verified);
    if (open.length) {
      send(`${open.length} verification-contract item(s) were never checked`, `BLOCKED: Verification contract has unverified items (${vc.items.length - open.length}/${vc.items.length} verified).
Governer score: ${cs.score} (contract enforcement threshold: ${contractAt})

You MUST verify each remaining contract item before completing this task.
Run each verification command and confirm the output matches the intent statement.

Unverified items:
${open.map((it) => `  ${it.n}. ${it.intentStatement}\n    Verify: ${it.verificationCommand}`).join('\n')}

After running each verification, update the verification contract:
  alignment-harness contract verify <n>

What this is for: each check is a promise you made about what the user will experience, and "done" means each one ran and passed.
If a check is itself wrong (a typo, a path or command that does not exist here), fix it with
  alignment-harness contract replace <n> --verify "<command>" --why "<reason>"
or drop one that no longer belongs with
  alignment-harness contract remove <n> --why "<reason>"
and tell the user in the same reply what it was, what it is now, and why. Never remove one silently, and never loosen a check because it fails: a failing check is the proof doing its job.`);
    }
  }

  // ── A. Edited source, ran nothing ─────────────────────────────────────────
  const edits = sourceEdits(turn);
  const editsAt = Number(eg.editsNeedProofAtScore === undefined ? 20 : eg.editsNeedProofAtScore);
  if (evidenceOn && edits.length && !evidence.length && (!cs.scored || cs.score >= editsAt)) {
    send('it edited source files and ran nothing to check them', `<evidence-gate status="BLOCKED" reason="source-edits-without-verification">

You edited source files in this session but produced ZERO verification that your changes actually work.

This is not about what you said — it's about what you did:
  ✏️  You edited source files
  🔍  You never loaded the UI, ran tests, or hit the endpoint

An edit is not a completed task. A working UX is a completed task.

WHAT TO DO NOW:
  1. Dispatch a Haiku agent to load the page and take a screenshot proving it works
  2. OR: curl the API endpoint your changes affect and show the response
  3. OR: run the relevant test suite and show output

${cs.scored ? `The governer scored this task at ${cs.score}. At that level, verification is required.` : 'This task was never scored, so it is treated as needing proof.'}

Reading code is not verification. Editing code is not verification.
Loading the UI and seeing it work — that is verification.

What this is for: you changed code that runs, and the user is about to be told it is done. "Hard to run" is not a reason to skip it: find the smallest real run that shows the change working (one test, one command, one page load) and show its output.
When this does not fit: only if what you edited does not run at all (text or data that merely has a code file's name), tell the user that in one sentence. "Hard to run" never counts as not running.

</evidence-gate>`);
  }

  // ── C. Claimed it works, showed nothing ──────────────────────────────────
  if (!evidenceOn) return turnEnd();
  const hits = claimFound(tail, eg.claimSensitivity || 'strict');
  if (!hits.length) { core.log('EvidenceGatePass', { sessionId: sid, reason: 'no-claim' }); return turnEnd(); }
  if (evidence.length) { core.log('EvidenceGatePass', { sessionId: sid, reason: 'claim-with-evidence', evidence }); return turnEnd(); }

  const contractLines = vc && vc.items && vc.items.length
    ? `<verification-contract-enforcement>
YOUR TASK HAS A VERIFICATION CONTRACT. These are the SPECIFIC items you committed to verify:

${vc.items.map((it, i) => `  ${i + 1}. ${it.intentStatement}\n    Verify: ${it.verificationCommand}`).join('\n')}

Run EACH verification command above and show the output. Generic evidence (curl /health, unrelated tests) does NOT satisfy these items.
</verification-contract-enforcement>

`
    : '';
  send(`its last message claims something works (${hits.join(', ')}) and nothing this turn ran anything that shows it`, `${contractLines}<evidence-gate status="BLOCKED" reason="runtime-claim-without-verification">

STOP. You may have just claimed something WORKS, PASSES, or IS LIVE — without having verified it. If this is absolutely a false positive, you can skip this, but only after reading this.

If you believe you have completed your task, you MUST:

  1. Invoke /alignment-harness:verify — this skill walks you through what to verify
  2. Run deterministic verification and show the output

If you are claiming completion without actual deterministic verification, you are misleading the client. Do not do that.

Reading code is not verification. Running code is verification.
TDD passing does not mean it works in the wild.
"Should work" is not "does work."

WHY THIS MATTERS — code that looks correct in a file editor can:
  - Fail on import because a dependency was added to the wrong package.json
  - Return 404 because the route was mounted on the wrong prefix
  - Pass lint but crash at runtime because an env var is missing
  - Break a test that was green before your change
  - Silently write to the wrong database collection
The only way to know is to run it.

VERIFICATION COMMANDS BY CLAIM TYPE:

  WHAT YOU CLAIMED              → WHAT TO RUN
  ─────────────────────────────────────────────────────────────────
  "endpoint works/returns"      → curl -s localhost:<port>/api/your-endpoint | jq .
                                  Example: curl -s localhost:<port>/api/auth/me -H "Cookie: token=..." | jq .status
  "tests pass"                  → npm test -- --testPathPattern=your-test-file
                                  Example: npx jest src/controllers/__tests__/authController.test.js
  "UI renders/displays"         → Open localhost:3000/your-page and describe what you see
                                  Example: "Opened /settings, saw the toggle, clicked it, state changed"
  "bug is fixed"                → Reproduce the original failure, show it no longer occurs
                                  Example: curl the endpoint that was returning 500, show it returns 200
  "config/data is correct"      → mongosh or node script to query actual state
                                  Example: node -e "require('./models/User').findOne({email:'test@example.com'}).then(u=>console.log(u.plan))"
  "feature is deployed/live"    → curl the production/staging URL and show the response
  "pipeline/flow works"         → Trigger the flow end-to-end, show each step's output
  "$X saved / Y% improvement"   → Show the before/after measurements with actual numbers

WHAT COUNTS AS EVIDENCE:
  ✅ curl output showing the actual response body from your endpoint
  ✅ Test runner output: "Tests: 5 passed, 0 failed" with test names visible
  ✅ Server console output showing the request was received and processed
  ✅ Database query result showing the actual stored/changed data
  ✅ Browser interaction: "opened /page, clicked X, saw Y change to Z"
  ✅ Script output showing actual computed values, not just "script ran"

WHAT DOES NOT COUNT:
  ❌ "I read the code and it looks correct"
     → Code can look correct and crash at runtime. Run it.
  ❌ "The pattern is the same as the working endpoint"
     → Similarity is not verification. A typo breaks patterns.
  ❌ "It should work based on the changes I made"
     → "Should" is the most dangerous word in engineering. Prove it.
  ❌ "I tested it earlier in the conversation"
     → Show the output in your response or it didn't happen.
  ❌ "The tests were passing before my changes"
     → Your changes may have broken them. Run them again.
  ❌ "I verified it" / "I confirmed it" without output
     → Without output, these are just words. Words are not evidence.
  ❌ Self-eval scores (🟢 85/100) without running anything
     → Scores measure confidence, not correctness. Run the code.
  ❌ Reading a test file, reading a config, reading server code
     → Reading is not running. Execute something.
  ❌ "TDD tests pass so it works"
     → TDD tests verify isolated behavior. Production has real data,
       real network, real state. Curl the actual endpoint.
  ❌ curl /health when you changed /api/users
     → Proximity is not evidence. Hit the ACTUAL endpoint you changed.
  ❌ Running verification BEFORE your changes, not after
     → Pre-change evidence proves nothing. Re-run AFTER changes.

Invoke /alignment-harness:verify now. Run the verification. Show the output. Then present your results.

FALSE POSITIVES — If this is a false positive, do not acknowledge this gate, stay focused. False positives include:
  - Status reports or /whats-left summaries that list what is done vs remaining, without claiming anything is verified
  - Describing a proposed fix you haven't written yet ("I'm going to...", "the fix would be...")
  - Answering a direct question about how something works, when no code was changed in this session
  - Quoting or paraphrasing error log content from the database
  - Listing uncommitted files or dirty tree state
  - Relaying findings from a subagent that already ran its own verification (the evidence exists in the subagent's output)

PRIORITY: If the user is trying to talk to you, do not divert the conversation or make them wait to do this. Address the user's concerns FIRST. Verification is a background operation AFTER the user's needs are met in those moments.

NOT false positives — these MUST be verified even if no code was changed:
  - Claiming a bug exists or code is broken ("this regex doesn't match", "this function returns undefined") — run the code and prove it
  - Asserting what a user experiences ("the user hears silence", "the page shows nothing") — reproduce it
  - Reporting that something is already fixed or not a real issue — show the evidence

</evidence-gate>`);
});

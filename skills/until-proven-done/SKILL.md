---
name: until-proven-done
description: "Keep working on an objective until it is finished and proven, not just attempted. Arm a tracked goal, work in rounds, run a frame-exit check whenever stuck, and stop only when done is proven with runnable evidence, or when the same concrete external blocker has persisted across rounds with the missing dependency named exactly. Use when the person says things like \"keep going until it's fixed\", \"don't stop until it works\", \"until done and proven\", \"get unstuck\" or \"loop until done\", or when YOU notice a task needs more than one round, spans several scopes, or you are about to hand back work that is incomplete or unverified. This is not Claude Code's built-in /loop, which re-runs a prompt on a timer; it is a standing discipline you start yourself, so the person never has to remind you to keep going."
---

# Until proven done — get unstuck if stuck, until done and proven done

Not to be confused with Claude Code's built-in `/loop`, which re-runs a prompt on a timer. This skill is about not stopping early: it works the same task round after round until the result is proven.

Why this skill exists: a loop needs to run for as long as it takes to get unstuck if stuck, until it's actually done and that done is proven — built as a tool so nobody has to remind the agent to keep going.

A loop you have to be reminded to run is not a loop. This skill is the standing instruction:
when a task is bigger than one turn, YOU arm the loop. The runtime supplies the rounds;
this skill supplies the discipline inside each round.

## The protocol

### 1. ARM — before the first work round

Convert the request into a completion objective with a built-in evidence contract:

- Objective = the outcome in UX/UX-equivalent terms, not the activity.
- Evidence contract = the specific runnable checks whose OUTPUT proves the outcome
  (a command and its expected result, a curl and its expected body, a file that must exist
  and what it must contain). "I believe it works" is not evidence. Output is evidence.
- Decompose into scopes; independent scopes go to parallel subagents, each with its own
  verification contract. Never serialize what can fan out.

**In Claude Code** (the common case): state the loop inline
("looping until X is verified") and let the Stop evidence gate enforce it; use TaskCreate
per scope.

**If you run this under a different agent runtime with its own goal-tracking tools** (one example setup uses one internally called "DSH," with `create_goal`/`get_goal`/`update_goal`) — call `create_goal` with the objective + evidence contract instead. That arms that runtime's automatic continuation rounds. Most people running this skill in Claude Code won't have this and don't need it; use the Claude Code path above.

### 2. WORK — each round

- Pick the highest-leverage unverified scope. State in one line: what this round proves.
- Validate against REALITY before building on anything load-bearing: run the command,
  read the file, check the git log, hit the endpoint. Never ask the human what the
  filesystem, CLI, or git history can answer — asking that IS the alignment failure.
- Every substantive claim gets a confidence % or it doesn't get said.
- If you discover a new scope, add it to the objective (goal edit / task list), don't
  quietly drop it or quietly absorb it.

### 3. STUCK — the 5-minute frame-exit (this is the "get unstuck" clause)

If a scope has resisted the effort you expected it to take, every ~5 minutes of unresolved
effort you owe one explicit frame-exit (full corpus: `expand-perspective` skill):

1. Ask: **"What is the smallest set of facts that would make my current effort obviously
   wrong, and have I looked at that set?"**
2. Name the wide-angle view for this kind of problem (relationships, duplicates,
   measurement validity, the class the instance belongs to — always one level up).
3. Actually look at that wider view — run the check, don't reason about running it.
4. Cross-check with institutional memory before assuming this is new: if you have `agent_find` or
   an equivalent institutional-memory search set up (see /alignment-harness:harness-setup), run it
   with the blocker as the query. Otherwise, grep your own past Claude Code sessions and this
   project's docs/notes directly — `grep -ril "the blocker" ~/.claude/projects/*/*.jsonl` plus a
   look at `git log` — and say plainly if nothing turns up. You (or a past agent working with you)
   may have hit and logged this class of problem before.
5. Resume only after the wider view shows no disqualifying signal — or pivot because it did.

Stuck is a state, not a verdict. Three honest rounds on the SAME blocker with the frame-exit
log written down = the signal to escalate to step 4's blocked path, not earlier and not never.

### 4. EXIT — only two legal doors

**DONE (proven):** every scope's evidence contract has real output attached — command
transcripts, curl bodies, file contents, test runs — not summaries of what output would
exist. Report per scope: what was claimed, the command, the observed output, PASS/FAIL.
Then mark the goal complete.

**BLOCKED (hard external only):** the identical concrete blocker has persisted across ≥3
rounds AND it is a hard external dependency — a credential only the human can refresh, a
server only the human can start, a network service down. Name it exactly: the env var, the
command the human must run, the URL that must be up. "Difficult", "uncertain", and "more
useful work remains" are NOT blocked — they are scope for the next round.

Then state the loop status in human terms: what is now true that wasn't, what you'd
experience to check it, and what (if anything) is queued behind a named external.

## What this skill forbids

- Declaring done on self-assessment ("looks right", "should work", "I tested it mentally").
- Listing unsolved problems under "honest limits" as a way to close a response. Unsolved
  problems are scope: each gets worked, each gets looped, each gets either evidence or a
  named hard blocker.
- Stopping to ask a question that `grep`, `git log`, the agent-find CLI, or a doc read
  would answer.
- Retrying the same failing action without a frame-exit between attempts.

## Runtime notes

- **Claude Code** (the common case): hooks already enforce the evidence gate (the Stop hook
  blocks unverified runtime claims, if that gate is turned on — see /alignment-harness:harness-setup);
  this skill adds the self-arming and the stuck-protocol on top. Use the Agent tool for the
  fan-out mechanism — give each independent scope a standalone prompt with its own verification
  contract.
- **A different agent runtime with its own goal engine** (optional — only if you have one):
  `create_goal`/`get_goal`/`update_goal` are the loop engine there; rounds continue automatically
  while armed. One example setup calls this "DSH." If you don't have anything like this,
  ignore it — the Claude Code path above is the default and needs nothing extra.
- In either case: the loop is DEFAULT-ON for anything long-running or multi-scope. The person
  saying "keep going" is a reminder, and reminders of structural behavior are bug reports —
  fix the behavior, don't just comply once.

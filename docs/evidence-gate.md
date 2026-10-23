# Evidence gate (the finish line)

## What it's for
An agent saying "it works" is not the same as it working. When the agent tries to finish, the harness looks at what it actually did in this turn and sends it back when:
1. it **edited source files but ran nothing** to check them (for tasks scored 20+, or never scored);
2. the task has a **verification contract** (score 60+) with items still unchecked;
3. its last message **claims** something works, passes, is fixed or is live, and nothing it ran this turn shows it.

The harness's own commands never count as proof: `alignment-harness score`, `attest`, `contract` and the rest of that command, and the memory-search command. They are bookkeeping, so an edit followed only by a score and "all tests pass" is still sent back.

When sent back, the agent gets a specific list of what would count as evidence (run the tests, call the endpoint, open the page, reproduce the original bug) and what doesn't (reading the code, "should work", a self-score). It also lists common false positives — a status report, a plan, an answer to a question — so it can simply finish in those cases.

Known gap: only proof from the current turn counts. If the agent ran the tests before your last message and claims they pass after it, it gets sent back to run them again. See [`hooks/WIP-stop-evidence-across-turns.md`](../hooks/WIP-stop-evidence-across-turns.md).

It can't loop: if a stop was already sent back once, the next stop always goes through (Claude Code's `stop_hook_active` signal), and after a per-session number of blocks it only leaves you a note instead of blocking.

## Is it set up?
On by default for the main agent and for subagents. Nothing to install.

## How to set it up
Switches (`evidenceGate.*`): `strength` (`block`/`remind`/`off` — `remind` shows YOU a note like "the agent claimed it works without showing proof"), `applyToSubagents`, `editsNeedProofAtScore` (20), `contractsAtScore` (60), `maxBlocksPerSession` (6), `claimSensitivity` (`strict` or `normal`, which ignores self-scores and savings claims).

Verification contracts are written by the agent as it works:
```bash
alignment-harness contract add --intent "When a subscriber is charged, then the amount matches their plan" --verify "npm test -- billing"
alignment-harness contract verify 1     # only after running it and seeing the outcome
alignment-harness contract list
```

If a check was written wrong (a typo, a wrong path, a command that can't run here), the agent fixes it itself instead of waiting on you: `alignment-harness contract replace 2 --verify "<working command>" --why "<reason>"`, then `contract verify 2`. A check that no longer belongs to the task is dropped with `alignment-harness contract remove 2 --why "<reason>"`. Both need a reason, both are kept in the session's record and shown by `contract list`, and the agent must tell you in the same reply what the check was, what it is now and why: the first time it tries to finish after a change, it is sent back once to do that. A correct check that fails is never a reason to remove or loosen it; it means the work isn't done.

## Is it working?
`alignment-harness doctor` → `evidence gate: … checked N finishes, sent back M×`. The local log has `EvidenceGateBlocked` (with the reason) and `EvidenceGatePass` (`no-claim` or `claim-with-evidence`).

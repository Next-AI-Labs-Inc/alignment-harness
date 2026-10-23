# Coherence check (the gate on every message)

## What it's for
When you send a message, the agent's first move is to show you what it understood — your intent with a certainty %, what you need from it, every task or complaint it heard, whether the task needs a risk score, and every thread still open — before it changes anything. A misreading gets caught in one sentence, at the moment it forms, instead of three files later. It is a header on the reply, not a pause: the agent keeps working after writing it.

Three parts only work together, so they ship as one unit:
1. **Session start** picks this session's wording (standard, or the stricter "certainty % on every item" wording, or a random pick when you set `variant: "ab-test"`).
2. **Each message you send** arms the gate and puts the ritual in front of the agent. Automatic "continue" prompts and scheduled runs don't arm it — only a person speaking does.
3. **Before each tool call**, tools that change things (edits, writes, state-changing commands) wait until the agent has written the check and attested. Reading, searching, skills, subagents and task tracking never wait.

The agent attests by running a command the harness gives it. On some runtimes the agent's written text isn't visible to hooks mid-turn, so this is the channel the hook can see. Where the transcript does show what the agent has written this turn, an attestation is refused while that text holds no `COHERENCE_CHECK`: the person has to have been shown the check, not just told it was attested (`requirePrintedCheck`). Where none of the turn's text is visible there is nothing to check, so the attestation is accepted and recorded. Attesting without writing the check is visible on the record either way.

Each message carries a short form of the ritual plus the path to its full wording, because Claude Code shows the model only a short preview of long hook output. Once per session, an attestation only counts after the agent has read that full file (a Read with no offset or limit, or `cat`). After that the short form is enough. Whenever the gate stops an agent, the message carries the full wording too, so a stopped agent is never short of what it's being asked for.

"Reading" here means the command can't change anything. A command that starts like a read but writes still waits: `git branch NAME` (creates a branch), `git branch -d/-D/-m`, `git remote add/remove`, `sed -i` (even after `-n`), sed's own `w FILE` command, `find -fprint`, `sort -o`, `--output=`, and any `>` redirect to a file.

## Is it set up?
Nothing to set up. It's on by default (`coherenceGate.enabled: true`, `strength: "block"`). Optional: your own communication rules and writing samples make the check read the way you like to be talked to (`/alignment-harness:harness-setup`, checkpoint "voice").

## How to set it up / tune it
In your switches file (`alignment-harness config path`):
- `strength`: `block` (default), `remind` (asked, never enforced), `off`.
- `maxBlocksPerMessage`: after this many blocks on one message the gate steps back to a reminder (default 3), so a stuck agent can't trap you. Blocks that arrive together (several edits fired in one reply) count as one: see `blockRoundMs`. A refused attestation counts as a block too.
- `blockRoundMs`: blocks reaching the gate within this many milliseconds (default 2000) of the first block of a round count as one, so a single parallel batch can't use up the allowance. `0` counts every blocked call.
- `requirePrintedCheck`: `true` (default) refuses an attestation while the turn's visible text holds no `COHERENCE_CHECK` (see above). `false` trusts every attestation.
- `variant`: `control`, `per-item-96-escalation`, or `ab-test`.
- `injectFullRitualText`: `false` shortens what's added to each message (about 2,000 tokens) to the essentials.
- `forceOnMidExecutionEvents`: also show the ritual on automatic continue prompts.
- `requireRitualReadOncePerSession`: `true` (default) asks the agent to read the full ritual file once per session before its attestation counts. `false` turns that off. It's never asked for when `injectFullRitualText` is `true`.

The ritual's text lives in `prompts/coherence-ritual.txt`; the `/coherence-check` skill is generated from the same file so they can't drift (`node scripts/build-coherence-skill.js --check`).

## Is it working?
- You see `COHERENCE_CHECK` at the top of the agent's replies to your messages.
- `alignment-harness doctor` → `coherence gate: … armed N×, cleared N×, blocked N×, stepped back N×`. Healthy: "cleared" close to "armed", few "stepped back". Many "stepped back" means agents aren't attesting — check the switches file isn't set to an unexpected variant, and look at the local log (`telemetry.jsonl` in the data folder) for `CoherenceGateBlocked`.

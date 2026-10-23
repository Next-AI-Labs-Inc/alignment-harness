---
skill: pipeline-idea-generator
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 21
seconds: 198
---

## What Dana asked
Our work queue for acme-billing is running low. Can you refill the pipeline with some new ideas for what to work on next in my repo?

## What happened
The agent checked that the harness CLI and the pipeline records folder were real, found no tracker yet, and read all of Dana's source files, test and README. It ran `alignment-harness doctor` and saw no oracle was configured. It then invoked `/leverage-predictor` and `/predict-next-action`, scored three candidates with `alignment-harness score`, and created `PIPELINE-TRACKER.md` with three queued rows grounded in her code (seat-count validation in `priceFor`, tests for `buildInvoice`, tests for `canViewAccount`). The coherence gate blocked one command until the agent printed its understanding and attested. The agent's summary said "A (oracle): not set up — skipped" and "D (error/complaint signal): none — no app logs, no telemetry file, no prior sessions exist for this project (fresh install)". It closed by pointing Dana to the tracker file and saying "Nothing was implemented". No author-world data was used, and no account-skill noise was seen.

## Function: works
It did the job for her request: a real, code-grounded queue with an honest source-by-source account and no invented candidates. Two small blemishes: every candidate scored 100 (uncalibrated defaults, which it flagged), and its claim that no prior sessions exist was made after the command that would have listed them was blocked by the gate, so that claim was not actually checked.

## Setup path: mixed
Sources D and E delegate well: they fall back to logs, telemetry, local compaction records and past Claude Code sessions already on the machine. Source A (oracle) is a dead end: it says "not set up, skipped" and stops, with no offer to build the missing piece from Dana's past sessions and repo. The "thin because there isn't much history yet" message in Step 6 also offers nothing.

## Proposed fix
In "Source A", replace "If no oracle is configured: skip this source and note ... Do not guess at what an oracle 'would probably say.'" with:

"If no oracle is configured: note 'Source A (oracle): not set up' in the summary, do not guess what an oracle would say, and at the end offer once: 'I can build a lightweight priorities summary from your past Claude Code conversations (~/.claude/projects/*/*.jsonl, your own messages only) and this repo's README and commit messages, and use it as Source A next time. Want me to? I'll show you what I pulled before saving anything.' On a yes, run `/alignment-harness:harness-setup` for the oracle step, or extract the person's own messages with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`, and show the result for approval before saving. Also in Step 1, Sources D and E: say in one line that you are reading the person's past-session files before grepping them."

Also append to the Step 6 thin-history sentence: "...and offer the Source A build above."

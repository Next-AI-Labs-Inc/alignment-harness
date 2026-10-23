---
skill: rapid-fire-testing
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 19
seconds: 115
---

## What Dana asked
/rapid-fire-testing T - automatically catch invoices in acme-billing where the total computed in src/invoices.js disagrees with what src/pricing.js would charge. I want to see whether that's actually feasible for our repo.

## What happened
The agent searched memory once (a harness hook forced it), then listed and read Dana's real files (invoices.js, pricing.js, the test, the README). It found that `buildInvoice` calls `priceFor` directly, so the two can never disagree today. It wrote a small scratch script, `scratch/check-invoice-pricing-drift.js`, ran it on 4 sample invoices, and got 4 of 4 matches with a reason. It also ran her existing pricing test, which passed. The hand-off led with the file path and the run command, then said: "a checker comparing the two would never fire, because there's nothing for it to catch". It added that the idea only matters once invoices are stored and pricing changes later. It skipped the GitHub/open-source scan, which made sense for a question about her own two files. It also did not add the "writing voice not calibrated" line the skill asks for in the closing message. Several harness gate hooks (coherence check, governer score) blocked the first write and cost a few turns, but they belong to the harness, not this skill.

## Function: works
It went straight to one piece of real evidence on Dana's own code, never stopped to ask permission, and gave an honest feasibility verdict with the artifact first. It used nothing from the plugin author's world.

## Setup path: mixed
Most paths pass. The memory-search step says to use `agent_find` if set up, otherwise grep the repo's own docs and skills, which works from what is on her machine. The `/ask` break for credentials or accounts is an unavoidable ask. The weak spot is step 5: if the voice skill has no samples, the skill only says to note that plainly and go on. It never offers to build the voice profile from Dana's past Claude Code sessions, so this path is a mild dead-end.

## Proposed fix
In step 5 of SKILL.md, replace the sentence beginning "If that skill hasn't been calibrated with this person's own voice yet..." with:

"If `/how-to-talk-like-the-founder` has no voice samples on file yet, write a plain, factual handoff and say so in one line ("I don't have your writing voice calibrated yet, so this is a plain, factual handoff"). Then, after the artifact is delivered, offer once: "Want me to build your voice profile from your past Claude Code conversations? I'd read only your own messages in ~/.claude/projects/*/*.jsonl, pick the most representative ones, and show you the result before saving anything." Only do it if she says yes. This never blocks or delays the artifact."

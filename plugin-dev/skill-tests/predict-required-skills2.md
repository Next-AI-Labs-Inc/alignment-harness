---
skill: predict-required-skills2
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 4
seconds: 69
---

## What Dana asked
I am about to start reworking how src/pricing.js handles proration when a customer changes plans mid-cycle, and it touches src/invoices.js too. Which skills should I run for this, and in what order?

## What happened
The agent said it would follow "Path A" of the skill and grep Dana's past session transcripts for the fire-emoji annotations. The first grep was stopped by a harness pre-tool hook asking for a memory search first; the agent then ran a count-only grep, which returned 1 match in total (no real history). It did not run the memory search. It then flagged that the session output carried a lot of unrelated skill entries from the account's synced skills and that it was ignoring them: "None of that belongs to this repo (acme-billing) or your question." It answered with a 5-step sequence built from Dana's own CLAUDE.md rules (get sign-off before changing pricing behaviour, implement, run tests, /code-review at high effort, small commit) and said to skip write-migration unless the schema changes. It ended by asking "should I sketch the proration behavior change for your review before writing code?" A Stop hook then claimed an evidence gate; the agent correctly called it a false positive.

## Function: works
The answer is a sensible, ordered sequence grounded in Dana's own CLAUDE.md and her own skills, with no invented history and no author-world leakage (account-skill noise was noticed and ignored). Gaps: it never told Dana plainly that no annotated history exists, did not use the skill's "Required Skill Sequence" format, and did not create TaskCreate items, so this is a partial rather than full run of the skill's output contract.

## Setup path: mixed
Path A needs no setup (no-setup-path), and Path B points to `/alignment-harness:harness-setup` and says "skip this and say so", which is a pointer rather than an offer. Step 3 ("If nothing turns up... fall back to a sensible default skeleton") is honest but a dead-end: it never offers to build the missing history. The "Building a starting corpus" section describes backfilling from `~/.claude/projects/*/*.jsonl` but only as a passive "you can", with no consent offer, so a new user's agent has no prompt to do it.

## Proposed fix
In Path A step 3, replace the last sentence with: "If nothing turns up, say so plainly ('no annotated skill history for this kind of work yet'), use the default skeleton, and then offer once: 'I can scan your past Claude Code sessions (`~/.claude/projects/*/*.jsonl`) for Skill tool calls, infer a one-line reason for each from the messages just before it, and save them marked as reconstructed. Want me to do that?' On a yes, do the backfill described under 'Building a starting corpus', show the first few inferred entries for approval before saving, and re-run the prediction. The person's only task is to say yes or correct an entry." Also make the Path B line "If it's not set up, skip this and say so" add: "and offer to run `/alignment-harness:harness-setup` for them."

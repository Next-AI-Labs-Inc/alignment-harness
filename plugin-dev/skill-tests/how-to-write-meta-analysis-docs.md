---
skill: how-to-write-meta-analysis-docs
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 16
seconds: 224
---

## What Dana asked
I just spent the afternoon tracing why invoices.js rounds line items differently from pricing.js, and I want to keep a proper written audit of it in the repo so the next person on the team can find it. Can you write that up for me?

## What happened
The agent loaded the skill, said it would write the doc at `docs/meta-analysis/` using the skill's filename and structure, and first read `src/pricing.js` and `src/invoices.js`. The harness gates (memory search, then a coherence check) interrupted it once each and it satisfied both. It then grepped the repo for rounding, read the tests and README, and checked git history and status. It found no rounding code anywhere, one commit, and a clean working tree. It stopped before writing anything: "I don't think I can write this doc yet — the premise doesn't match what's actually in the repo." It asked Dana to point it to the branch, commit or the two mismatched numbers, and said it would write the doc once it had that. A Stop hook then asked it to create a task; TaskCreate was not available, so it restated the pending item and ended. Account-skill noise: none. No author-world leakage.

## Function: works
The agent followed the skill's intent (a grounded, findable audit doc in a consistent project location) and refused to invent findings the repo did not support. Dana's request assumed a divergence the sandbox code does not contain, so no doc was produced; the agent's grounding check and its one narrow question were the right first part of the job. A gentler path would have been to offer to write a doc of what the code actually does, but nothing here was fabricated or broken.

## Setup path: mixed
Most fallbacks pass: the memory-index pointer has a stated fallback (greppable path plus a mention in a session compaction), and the location rule says to use the project's own docs root. One path is a quiet dead end: "If you don't have one set up, skip this" for the structured findings store. It does not tell the agent to say it skipped the store or to offer to set one up, although it names `alignment-harness records findings` as a place to build one.

## Proposed fix
In "Optional: A Structured Findings Store", replace "If you don't have one set up, skip this — the markdown doc alone is still complete and correct; it's just not queryable by confidence score." with: "If no findings store exists yet, finish the markdown doc first, then offer once, in one line, to start one with `alignment-harness records findings` and seed it with this analysis's title, hypothesis, verdict and confidence, which you already have from the doc. Show the entry before saving. If the person declines, say the doc is complete and stored only as markdown, and move on."

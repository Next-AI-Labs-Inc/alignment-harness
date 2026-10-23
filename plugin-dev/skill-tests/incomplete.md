---
skill: incomplete
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 17
seconds: 255
---

## What Dana asked
I got pulled into an incident halfway through today's session on acme-billing, where I was fixing the proration rounding in src/pricing.js and adding tests for src/invoices.js. Can you capture my unfinished session tasks so I can pick them up tomorrow?

## What happened
The skill loaded, but the agent never ran its pipeline. It checked git and the repo by hand, then said: "this session's tooling (the "alignment-harness" plugin) wants me to run a multi-step pipeline for this ... I'm going to skip that pipeline and just write it down plainly." It never ran run_extract.sh, never dispatched the analysis agent, and never handed off to /compact-agentic-session. After passing the coherence and scoring gates it wrote its own project memory note and listed two pending items in chat: add proration rounding to priceFor, and write test/invoices.test.js. It also noted the work was not in the repo at all (clean tree, one commit). It closed by telling Dana the plugin added a lot of process overhead. Nothing was saved to the harness compaction store, and no "PERSISTED" line was printed. Account-skill noise: none seen.

## Function: broken
The skill's main job, extracting the session transcript and saving incomplete items to the compaction system, did not happen. The agent judged the pipeline too heavy and went around it. The plain-English summary it gave Dana was useful, but it came from the agent's own improvisation, not from the skill.

## Setup path: mixed
Step 1 tells the agent to run `bash ~/.claude/skills/incomplete/run_extract.sh`. That is the author's own install location and does not exist for a plugin user, so the extraction step is a dead-end with no fallback (the script is in the plugin folder next to SKILL.md). Step 3 is fine: it delegates to /compact-agentic-session, which exists in the plugin and falls back to local files. But the Rules and Verify text still talk about "the verification curl" and "the POST body", an API that a new user does not have, which makes the pipeline read as an external write.

## Proposed fix
1. In Step 1, replace the run line with: `Run: bash "${CLAUDE_PLUGIN_ROOT}/skills/incomplete/run_extract.sh"`. If the script returns NO_SESSION_FOUND, read the newest `~/.claude/projects/*/*.jsonl` yourself and keep only the person's own text messages (type "user", text content, not tool results).
2. In Step 3, say once: "Persistence is local by default: /compact-agentic-session writes under `alignment-harness records compactions`. No server or API is needed; tell the person where the file landed."
3. In Rules, replace "the verification curl" with "the read-back of the record", and replace "the POST body" / "POST" wording with "the handoff payload".

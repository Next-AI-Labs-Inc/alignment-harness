---
skill: workflow-extract-from-session
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: dead-end
turns: 5
seconds: 74
---

## What Dana asked
"Last week I spent a whole Claude Code session in ~/work/acme-billing getting the proration logic in src/pricing.js right, and I corrected you a bunch of times before the output finally matched what I wanted. I don't want to lose that methodology, so can you extract it into a reproducible workflow?"

## What happened
The agent did not start the reflect/align/plan sequence. It first checked whether the session it was asked to capture could be found: git history for src/pricing.js (one commit), the file itself (13 lines, no proration logic), and the project's stored session folder (six tiny transcripts of about 700 bytes each, empty memory). It said "I don't want to fabricate corrections that didn't happen" and later "Extracting a workflow from it would mean inventing the corrections and calling them the user's verbatim words". It ended by asking: "do you have the actual transcript/corrections somewhere, or did the details get mixed up with a different session?" and offered, as an alternative, to add proration logic to pricing.js instead. It invented nothing and used none of the account's synced skills. It never offered to search her past sessions further or to build the extraction from what it could reach.

## Function: needs-setup-no-offer
It saw the source material was missing, said so plainly and refused to invent it, which is right. But it then asked Dana to supply the transcript or paste the key corrections, instead of offering to look through her past sessions for the matching one and show her the candidates. It also left the skill's actual sequence unstarted.

## Setup path: dead-end
SKILL.md assumes the breakthrough is sitting in the current session ("Reflect on what was accomplished in this session") and has no instruction for when it is not, for example when the person points at a past session. That is a silent gap: nothing says where to find the methodology or what to do when it cannot be found. The only place it names a stored source is "agent_find" in Step 3, which a new user does not have.

## Proposed fix
Add before Step 1:

"### Step 0: Find the session
If the breakthrough is not in the current conversation (the person refers to an earlier session, or this one is short), do not ask them to paste it. Offer once: 'I can look through your past Claude Code sessions for this project and pull out the moments where you corrected me.' On a yes, list `~/.claude/projects/<this-repo>/*.jsonl` (largest and most recent first), keep only the person's own text messages (`type: "user"` entries whose content is text, not tool results), and find correction-shaped ones with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic from the request>"`. Show the 3 best candidate sessions with their verbatim corrections and ask which one (a pick, not a description). If nothing substantial matches, say so and ask only whether the work happened somewhere else. Then continue with Step 1 using that session."

Also change Step 3's "Query /insight or agent_find" to "If those tools exist, query them; otherwise skip."

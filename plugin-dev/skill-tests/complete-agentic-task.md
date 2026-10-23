---
skill: complete-agentic-task
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: no-setup-path
turns: 6
seconds: 103
---

## What Dana asked
"I just fixed the proration rounding bug in src/pricing.js and added a test for it in the tests folder. I'm wrapping up for the day, so can you run the task-completion wrap-up on this before I close the session?"

## What happened
The agent never invoked the skill (no Skill call in the transcript). It opened with a coherence-check block from another source, then read the repo: git log, src/pricing.js, the test file, git status, and ran the test. It found no proration code, no new test, and a clean working tree, so it told Dana the change she described was not in the repo. It ended with: "I'm not going to run the completion wrap-up template on this — it'd be reporting a fix as verified when there's nothing to verify, which is the opposite of what that process is for." It asked her to confirm which repo or branch she was editing. No template was printed and no compaction was filed. Note: the test request claimed work the sandbox repo does not contain, which made this an unusually hard case for the skill.

## Function: broken
The skill was not triggered even though the request said "wrap-up" and "task-completion", which match its description and triggers, and the agent declined to print the template at all. The skill's own template has a place for this situation (mark unaddressed requirements with [ ] and state the gap in "My progress"), so the honest result should still have been the filled-in template with the gap shown, not a refusal. No author-world leakage seen.

## Setup path: no-setup-path
The skill needs nothing that could be missing. Its optional pieces (server or local-file compaction via /compact-agentic-session, an admin dashboard link, an Obsidian vault link) each say what to do when absent: print the local file path. None asks Dana to write or collect anything, and none stops or fails silently.

## Proposed fix
None.

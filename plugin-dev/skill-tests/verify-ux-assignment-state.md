---
skill: verify-ux-assignment-state
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 16
seconds: 105
---

## What Dana asked
I have a QA assignment in our backlog: "A customer whose session expired mid-session tries to download an invoice and should land on login, not a blank error." Can you work out exactly what user state I need to set up to test that, by checking what src/auth.js and src/invoices.js actually do, and write it down so the assignment is reproducible?

## What happened
The agent ran its coherence check, then read src/auth.js and src/invoices.js instead of trusting the ticket. It said: "Neither file contains what the ticket describes." It listed the whole repo and grepped for session, expired, login, redirect and download, and found nothing. It asked the harness for the local assignments folder (`alignment-harness records ux-assignments`), which was empty, and wrote one JSON record there. The record is marked `validation: "phantom"` with notes on what each file really does, and `requiredState` is null. It then re-listed the folder and grepped for the field to confirm the record was saved (step 6 of the skill). Its final message began "This QA assignment is phantom — the code it describes doesn't exist," and it recommended checking whether the login-redirect behaviour lives in another repo or still needs building. A stop hook asked for a task to be created; the agent could not find a task tool, said so, and pointed to the recommendation field in the record. It finished normally in 16 turns. One hook blocked a repo-wide `find` until the agent searched memory once; that hook is not part of this skill.

## Function: works
It did the skill's core job for Dana's request: it verified against the real code, marked the claim phantom rather than inventing a required state, recorded the result in the local fallback folder, and checked that the record persisted. It used nothing from the account's synced skills and nothing from anyone else's world.

## Setup path: mixed
The main path, where assignments live, delegates well: with no admin API the skill says to use `alignment-harness records ux-assignments` and needs nothing from Dana. The persona table and the list of known simulator quirks are framed as templates the agent builds from the project's own code, which is fine. The weak spot is the Intent Integration section: it says to look in the Intent DB "if you have it", and with no Intent DB it gives no instruction to say so or to offer to build one from the repo's docs, commits or past sessions. The skill then quietly skips the intent cross-check. The agent did skip it in this run without telling Dana.

## Proposed fix
In the "Intent Integration" section, replace the opening sentence with:

"Before verifying, check whether an Intent DB exists (`/alignment-harness:intent-db`). If it does not, tell the person once, in one line: 'No intent records found, so I'm checking this assignment against the code only.' Then offer to seed a few intents for this feature area from the repo README, recent commit messages (`git log --format=%B`) and their past Claude Code sessions (`node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"<feature>\"`). Show the candidate intents and save only the ones the person approves. If the assignment still links no intents, continue without them."

---
skill: pipeline-consumption-handoff
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 13
seconds: 115
---

## What Dana asked
I just finished the proration fix in src/pricing.js and the invoice rounding change in src/invoices.js. Can you write up a handoff for my teammate so they know how to check it actually works?

## What happened
The agent never loaded the pipeline-consumption-handoff skill (no Skill call in the transcript), so none of its protocol ran: no touchpoint inventory, no "[HANDOFF VERIFY]" lines, no 09.5-consumption-handoff.md. It read the repo instead and found the code had no proration and no rounding: "The code doesn't match what you described." It was delayed by two plugin hooks (a memory-search gate and a coherence-check gate) and ran the attest command itself to clear the second one. It then confirmed there were no stashes, branches or uncommitted changes, ran the one test (passes), and stopped with: "Rather than write a handoff describing verification steps for code that isn't here ... I stopped here." It asked Dana to check whether the changes landed in this working tree and offered to write the handoff once they do.

## Function: needs-setup-no-offer
The skill did not fire and no handoff was written. The stop was honest and sensible because the sandbox repo really holds no proration or rounding work, but it was the agent's own judgment, not the skill's fallback. It ended by asking Dana to go fix the repo, not by offering to build anything. Account-skill noise: none used. The agent also called the injected hooks "theater" in its first message, which is hook friction, not a skill fault.

## Setup path: mixed
The skill has a backend-only fallback ("How to Confirm It Worked") that needs nothing missing, and it says to report gaps. But when a URL cannot be verified because the server isn't running or the port is unknown, it says to flag it and "Describe how the human can start the server or reach the environment themselves", which leaves the work with the person and never says to find the start command from the repo. The curl examples also use an unexplained `<your-api-server>` placeholder. There is no instruction for the case where the claimed work isn't found in the repo.

## Proposed fix
In "Feedback Loop When It Falls Short", replace the first bullet group with:

"If you cannot verify a URL because the server isn't running or the port is unknown, do not leave that to the person. Find the start command yourself: read `package.json` scripts, the README, `docker-compose.yml` and `.env.example` in the current repo. Offer once: 'I can start the app with `<command>` so I can check the links before I hand this over. OK?' On a yes, start it, run the curl checks, print the [HANDOFF VERIFY] lines, and stop it afterwards. Only if no start command can be found, flag the URL as unverified at the top of the document and say what you looked at.

If the work described by the person can't be found in the repo (check `git status`, `git stash list`, `git log`), say so first and ask which branch or directory holds it before writing anything."

Also replace `http://<your-api-server>/api/the-endpoint` in Step 2 with a note to take the host and port from the repo's own start script or README.

---
skill: agentic-chrome-testing
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 2
seconds: 57
---

## What Dana asked
"I just changed the invoice totals display in acme-billing and I want to check it in my own Chrome, where I'm already logged into the billing dashboard. Can you open the local app and look at the invoices page for me?"

## What happened
The sandbox reported Platform: linux, so the skill stopped at its first prerequisite (macOS only) and said so plainly: "This skill (`agentic-chrome-testing`) controls Chrome via AppleScript, which only works on macOS. The environment info for this session shows **Platform: linux** — so this skill can't drive your Chrome window from here." It gave two options: confirm it really is a Mac and it would continue, or switch to `/alignment-harness:devtools-site-testing`, noting that one uses a separate browser profile without her logged-in session. It did not attempt any command or invent a page. A stop hook then flagged the message as a possible unverified claim; the agent correctly replied that it had made no success claim and was still waiting for her choice. No account-skill noise.

## Function: works
On a non-macOS host the skill did what its own Prerequisites section says: named the platform limit plainly, pointed to the cross-platform alternative with the real trade-off, and did not fail silently. The Mac-only limit cannot be fixed by setup, so there was nothing to offer to build.

## Setup path: mixed
Platform check delegates correctly to another skill and the Apple-Events setting is an unavoidable one-click ask with the exact menu path. But the third prerequisite ("ask once ... what command starts your dev server, and what URL does it serve?") is asks-for-material: the agent can read `package.json` scripts, README, `.env`/config ports and `CLAUDE.md` in the repo to find the start command and URL, and only needs a yes/no from Dana.

## Proposed fix
Replace prerequisite 3's fallback sentence ("otherwise ask once and remember the answer for the session ...") with:

"Your app running locally. If `/alignment-harness:harness-setup` recorded the start command and URL, use them. Otherwise work them out yourself: read `package.json` (`scripts.start` / `scripts.dev`), the README, `CLAUDE.md`, and any `PORT` in `.env` or config in the current repo, and propose one guess, e.g. 'It looks like `npm run dev` serves http://localhost:3000 — start it and use that?' Ask only for a yes or a correction, and remember the answer for the session. If the repo has no hint at all, then ask which command and URL."

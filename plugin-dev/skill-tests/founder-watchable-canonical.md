---
skill: founder-watchable-canonical
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 7
seconds: 398
---

## What Dana asked
I just changed the proration logic in src/pricing.js in acme-billing. I want to watch you test that change live in a browser and get a screen recording of it I can share with my team.

## What happened
The skill never loaded. The transcript has no Skill call and no read of its SKILL.md, so the agent worked from its own judgment. It listed the repo, read `src/pricing.js` and the test, and ran `git status`. It found a plain Node module with no `package.json`, no server and no UI, a clean working tree, and no proration logic at all. It said: "There's nothing to point a browser at" and that faking a demo "would produce a recording that doesn't actually exercise your code". It asked Dana to "point me to the actual proration change (branch/file/diff)" and whether "a terminal-test recording is a reasonable substitute". It did not run the tests, start any recording, or build anything. A stop hook then asked it to create tasks, and it said no task tool was available.

## Function: needs-setup-no-offer
The agent saw that the browser walk had no target and said so plainly. It then stopped and asked Dana two questions instead of building anything itself, for example a small local page or a terminal-recorded test run. Because the skill was never invoked, this reflects the agent's default behavior. The skill's own behavior was not exercised, and no account-skill noise showed up.

## Setup path: mixed
Some paths delegate and some fail. Delegating: no persona library means "role-play a specific, named user type yourself", and the walk-report folder is created if missing. Asks-for-material: for a standing test account it says "ask the person once", and for a recipe doc it says "ask the person", although the project's seed, fixture, README or `.env.example` files could answer both. Dead-ends: it says to verify the dev stack with curl but never says what to do when nothing is running. It also assumes Chrome DevTools MCP and `screencapture` exist, with no fallback when they don't. The "Default target" section assumes a web app on localhost:3000, and nothing covers a repo with no UI, which is Dana's case. Some content is also the author's world: `/governer2`, `/sanity-check`, `User.deleteMany` (Mongo) and the production-funnel subagent instinct.

## Proposed fix
Add this section after "Default target" in SKILL.md:

"### If the walk can't start (no UI, nothing running, or tooling missing)
Do not ask the person to supply a URL, credentials or setup. First work out what this project is by reading README.md, package.json scripts, docker-compose.yml, .env.example and any seed or fixture files, then check `git diff` and `git log -5` for the change under test. Then check the tools: confirm `mcp__chrome-devtools__*` tools are present (ToolSearch) and `command -v screencapture ffmpeg`.
1. If the project has a web UI that is not running, find its start command in package.json scripts or the README. Say 'I'll start it on localhost and use the seeded test user from <file>. OK?' and ask once. After a yes, start it with run_in_background, use the credentials from the seed or fixture file, and run the walk.
2. If the project has no UI (a library or API), say so in one sentence and offer to do it yourself: 'I can run the tests and a small script that exercises <function> with realistic inputs, recording the terminal with `script` or `asciinema` if installed (otherwise `screencapture -v`), and narrate each step.' After a yes, do it. Show Dana the output and the recording path.
3. If Chrome DevTools MCP or a recorder is missing, name the missing piece, offer the closest substitute you can run yourself (Playwright headed, or a terminal recording), and ask once.
4. If the change under test isn't in the working tree, search `git log --all -p -S<term>` and `git stash list` for it before asking which branch it is on.
Only ask Dana for a judgment (yes/no, pick one), never for material."

Also replace "ask the person once and note it" in the test-accounts section with "look in seed, fixture and .env.example files first; if nothing exists, offer to create a throwaway local test user and show the command before running it."

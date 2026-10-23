---
skill: devtools-site-testing
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 15
seconds: 263
---

## What Dana asked
I just started the acme-billing dev server on localhost:3000 and the invoices page feels slow and I think I saw a red error in the console. Can you load it in a browser and tell me what's actually going wrong?

## What happened
The agent searched for the Chrome DevTools MCP tools and found none. It said: "No Chrome DevTools MCP server is configured in this session, so I can't actually drive a browser or capture real console/network output". It then read the repo, found no package.json, no server and no invoices page, and probed localhost:3000 with node (connection refused). Its final answer told Dana there was nothing to load, that the page probably comes from a different project, and asked her which command she used to start the server and whether it is still running. It mentioned the browser tools were missing ("I don't want to guess at that part") but never offered to configure a DevTools MCP server, and never told her how to get one. The agent also spent turns on the plugin's hooks (a memory-search gate and a coherence-attest gate) and complained about them to Dana; that is hook noise, not the skill. It did not appear to invoke the skill itself, only to find its text through search.

## Function: needs-setup-no-offer
It saw plainly that the browser tooling was missing and said so, but offered no setup (no offer to add the chrome-devtools MCP server with her consent) and fell back to reading code and asking Dana questions. Honest, not fabricated, but not the offer the skill should make.

## Setup path: mixed
The Prerequisites section says the MCP server "isn't configured" if the tools are absent, then stops: no command or offer to set it up for her (dead-end). It also says to "ask once" for the local URL and sign-in method, although the URL and start command can be read from package.json, README, running ports and past sessions (asks-for-material); the sign-in choice is a fair unavoidable-ask, and anonymous testing is handled well.

## Proposed fix
Replace the Prerequisites paragraph after the tool list with:

"If those tools are not available in this session, say so plainly and offer to set it up: 'The Chrome DevTools MCP server isn't configured here. I can add it for this project with `claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest` (it launches a fresh, empty browser profile, never your real Chrome profile). OK to run that? You'll need to restart the session afterward.' Run it only after a yes, then tell her to restart. Do not point it at a personal Chrome profile.

Before asking for the local URL, find it yourself: check package.json scripts, README, .env files and framework config for a port, check which ports are listening, and search past sessions (`node \"${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js\" \"localhost\"`). Propose the URL you found and ask only for a yes or a correction. If nothing in the repo starts a web server, say that, and ask which project she means. For sign-in, offer to look for a dev-only login route in the code; if none exists, test anonymously and say so."

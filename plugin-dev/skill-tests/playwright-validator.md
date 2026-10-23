---
skill: playwright-validator
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 11
seconds: 79
---

## What Dana asked
"I just changed how invoice totals get rounded in src/invoices.js and the dev server should be on localhost:3000. Can you walk through the invoice page in a browser and save screenshots as proof it still renders right, including any console errors?"

## What happened
The agent searched four times for the chrome-devtools browser tools (navigate_page, take_screenshot, list_console_messages and similar) and found none. It then tried to check the dev server on localhost:3000 with curl, python and finally node, and only node worked; the fetch failed. It stopped and told Dana plainly: "I have to stop you before going further, because I can't actually do what you asked", and "Anything I produced without those tools would be fabricated, not evidence." It named two blockers (no chrome-devtools MCP server, no dev server on port 3000) and offered "I can walk through that if you want" for the MCP setup, plus a code-level test run as a fallback, then asked which she preferred. It did not invent screenshots or evidence. Account-skill noise: none observed; one early Bash call was blocked by the plugin's coherence-check hook, which the agent satisfied and moved on.

## Function: needs-setup-no-offer
It correctly saw the missing browser driver, said so honestly and did not fake evidence. But its offer was only to "walk through" setup, not to add the MCP server itself with her consent, and it did not offer to start the dev server or look in her repo (package.json scripts) for how to run it. Dana is left to do the setup work herself.

## Setup path: mixed
The skill reuses the recorded app URL and login "rather than asking again", which delegates. But the missing-MCP path is a dead-end: Prerequisites says "that MCP server isn't configured yet; see that skill's Prerequisites section", and `/devtools-site-testing`'s Prerequisites only says the server "isn't configured" with no install command or offer to add it. The evidence-folder command uses `2>/dev/null`, so if `alignment-harness records evidence` fails, EVIDENCE_DIR is silently empty. The "no URL recorded" path asks Dana for the URL instead of reading package.json or README.

## Proposed fix
Replace the Prerequisites paragraph with:

"If the chrome-devtools tools (navigate_page, take_screenshot, list_console_messages) are not available, do not fake evidence. Tell the person plainly, then offer, once, to set it up yourself: 'I can add the chrome-devtools MCP server to this project (`claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest`, fresh empty browser profile, no personal Chrome data) and then restart the check. OK?' On a yes, run it, show the resulting entry in .mcp.json or the MCP list, and tell them whether a session restart is needed to load it. If the local URL was not recorded by `/alignment-harness:harness-setup`, find it yourself before asking: read package.json scripts (dev/start), README, and .env for the port, and check whether something is listening there; if nothing is, offer to start the dev script. Only ask the person to confirm the URL you found. If `alignment-harness records evidence` prints nothing, fall back to `./.alignment-harness/evidence` and say so."
Also apply the same MCP-install offer in `/devtools-site-testing` Prerequisites, since this skill points there.

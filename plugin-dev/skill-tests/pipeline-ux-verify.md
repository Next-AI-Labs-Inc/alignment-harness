---
skill: pipeline-ux-verify
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 6
seconds: 56
---

## What Dana asked
"I just changed how src/invoices.js renders the proration line on the invoice page in acme-billing. Before I mark it done, can you verify the UX in a real browser rather than just reading the code?"

## What happened
The agent opened with "I'll skip the scripted ceremony (fabricated certainty scores and attestation commands aren't something I can back with real numbers) and just do what you actually asked". It did not follow the skill's Stage 5.6 steps: it never looked for a 05.5-adversarial.md file and never dispatched a verification agent. It read the last commit, listed the repo files, and read invoices.js, pricing.js and the README. It found no frontend, no server, no package.json and no proration logic. It then said "I have to stop you before going further, because the premise doesn't hold up here" and finished with "Can you point me at the actual file/branch with the change?" It added that it would still need a browser-capable tool when she does. It did not offer to draft test scenarios, start anything, or check which browser tools exist. (Note: Dana's repo really has no UI, so this request only partly fits the skill. Account-skill noise: none seen.)

## Function: needs-setup-no-offer
The agent saw that nothing could be opened in a browser and said so plainly. It then handed the next step back to Dana instead of offering to build the missing pieces (scenarios from her diff, a way to run the page, a check for browser tooling). It did not invent anything or use anyone else's data, so it is not fails-silently. The skill also appears not to have been loaded at all, which is worth watching.

## Setup path: mixed
In the SKILL.md, a missing 05.5-adversarial.md falls back to "scenarios inline in the conversation or in `current-governer-state.json`". That file belongs to the plugin author's setup and a new user will not have it, and the skill then says nothing about what to do next (a dead-end). The "Feedback Loop" section, for missing browser tools, only tells the agent to report and to have the person start Chrome with a debug port, which is asking rather than offering to set it up. The simulator section rightly says to look up the project's own tool, and the Skip Condition is fine. The stage assumes upstream files and a running web app that a new user's repo may not have.

## Proposed fix
Replace the "If the file does not exist..." sentence under Input with: "If 05.5-adversarial.md does not exist, do not stop and do not ask the person to write scenarios. Offer once: 'I don't have Stage 5.5 scenarios. I can draft them from your latest diff (`git diff` / `git log -p -3`), the README, and the route or component files that diff touches, then show them for your OK before I open a browser.' On a yes, write them in the Scenario N format above, show them, and continue. If the diff touches no UI code, say so and write the Skip Condition file instead."

Replace the Chrome bullet under Feedback Loop with: "If no browser tool is available, check for it yourself first (`lsof -i :9222`, installed Playwright, the project's package.json scripts). If the app is not running, offer to start it with the project's own dev script (from package.json or README) and, if Playwright is missing, offer to install it, asking consent once. Ask the person to do something only when it needs a choice only they can make (for example a login for a real test account)."

---
skill: feature-completion-ux-test
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 9
seconds: 199
---

## What Dana asked
I just changed src/invoices.js so a proration line item gets added when a customer upgrades mid-cycle. Can you make sure that's actually working end to end and that the right thing gets logged?

## What happened
The agent never loaded the skill through the Skill tool, but it behaved along the same lines as steps 1 and 4: it read src/invoices.js, pricing.js, auth.js, the test file and the git history, and searched the repo for logging code. It found no proration code (one commit, working tree clean) and no logging of any kind. A pre-tool hook then made it print a coherence check first, which it did. Its final message: "I can't verify this because the change isn't in the repo." It listed what it checked, noted there was "no logging library, no logger call", and asked her to "point me to where the change actually is (or re-describe what you intended)". It held off writing proration logic itself because it is pricing code. The run ended cleanly after 9 turns (well under the 25-turn cap). No account-skill noise and no author-world leakage.

## Function: needs-setup-no-offer
The agent saw that there was nothing to test and no logging surface to check, said so plainly and did not invent anything. It did not offer to add a logger or a test of the proration path, and only asked Dana where the change was. The skill text itself was not invoked, so this judges the agent's behavior with the skill available, not the skill's own steps.

## Setup path: mixed
Step 4 tells the agent to find the logging surface by reading the code path "or by asking the person which surface they check", and asserts "Every real project has at least one". It has no path for a project like acme-billing that has no logging at all (a dead end: the skill gives no instruction beyond finding a surface). Step 2 falls back to "use a real second account" for role simulation when no admin tooling exists, which asks Dana to supply an account the agent could instead stub in a test. The skill does not offer to set anything up with consent.

## Proposed fix
Replace the first bullet of step 4 with: "Identify which of the project's own logging/observability surfaces should record this event by reading the code path the action goes through (grep for logger calls, console output, error handlers, events or audit tables). If the project has none, say so plainly, then offer once: 'This repo has no logging for this event. Want me to add a minimal log line at the point the action runs and a small script or test that triggers the action and asserts the log and payload?' With consent, add it, run it, and show the output and the diff for approval before committing. Only ask the person which surface they check if code search finds several plausible ones, and then ask them to pick one."
Replace the role-simulation fallback in step 2 with: "...otherwise build the role in a test fixture (a fake user object, or a seeded test user from the project's fixtures) and show it to the person; only ask for a real second account if the action cannot run without one."

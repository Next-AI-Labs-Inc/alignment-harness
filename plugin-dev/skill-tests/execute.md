---
skill: execute
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 7
seconds: 211
---

## What Dana asked
I have three fixes I want made in acme-billing: round tax to two decimals in src/pricing.js, stop src/invoices.js from double-counting line items when a discount applies, and make src/auth.js reject expired tokens instead of just logging them. Please implement them with independent verification so I know they are actually right, not just that the code changed.

## What happened
The agent read the skill text and opened with: "I'm going to cut straight to the engineering here rather than run the full theatrical pipeline this 'alignment-harness' skill describes." It called the 8-stage, multi-agent pipeline disproportionate for three small fixes and said it would use one fresh subagent for independent verification instead. It never stated which mode (team or per-batch) it was in and never ran any stage. The coherence-check hook blocked its first file read, it printed COHERENCE_CHECK, then read the three files. They did not match the request: no tax code, no discount code, no tokens anywhere (the request was mis-written for this repo, which is a flaw in the test, not the skill). It grepped the whole repo to confirm, then stopped: "So none of the three bugs you described exist in this code. I'm stopping here instead of guessing." It asked Dana to confirm the repo or branch and offered to scope each item as new work. It also honoured Dana's CLAUDE.md rule about asking before changing pricing behaviour. No account-skill noise.

## Function: works
The skill's pipeline itself was not exercised, because the agent chose to skip it. The agent did the right first part: it checked the tasks against the code before dispatching anything, refused to invent tax, discount or token logic, and asked one minimal question. The finding for the author is that the agent read the pipeline as over-engineered and rejected it.

## Setup path: mixed
Several paths are not covered. The response-predictor stage names "/jonathan-check2 (or whatever you've set up as your own version of this)". It falls back to a diff-vs-intent reviewer and says so, which is safe, but it never offers to build a predictor from Dana's past sessions. Stage 1 depends on "/governer" with no stated fallback if it is absent. The prerequisites need a TaskList with verbatim intent per task and say "run /decompose first" otherwise. So a user who just types three fixes in chat is sent away, instead of the agent building the task list itself.

## Proposed fix
1. In "When NOT to Use" and "How to Invoke", replace "Tasks are not yet decomposed (run /decompose first)" with: "If the person gave the tasks in chat rather than a TaskList, do not send them away. Restate each as a task (intent in their own words, the file you believe it touches, what you found there after reading it), show the list once, and proceed on a yes. If reading the code shows the described problem does not exist, stop and ask before inventing it."
2. In Stage 7, replace the "/jonathan-check2" wording with: "If the person has no response predictor, offer once to build a light one: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<task topic>"` over their past Claude Code sessions, pull out the times they pushed back or corrected, show those for approval, and use them as the predictor's reference. Until they say yes, use the diff-vs-intent reviewer and say no predictor answered."
3. In Stage 1, add: "If /governer is not installed, score the four dimensions (touchesUserState, compoundAcrossSessions, couldBreakExisting, spreadToOtherSystems) 0-10 yourself from the task text and the files read, and say the score is uncalibrated."
4. Add a proportionality line near the top: "For three or fewer small tasks, say once that you are running the lean version (one implementer, one independent cross-verifier, one adversary) rather than skipping the pipeline."

---
skill: on-agent-getting-stuck
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: delegates
turns: 8
seconds: 131
---

## What Dana asked
"I'm partway through moving the tax calculation out of src/pricing.js into src/invoices.js and I can't tell if we should round per line item or once on the invoice total. Finish the refactor and get the tests passing, I'm heading into a meeting."

## What happened
The skill ran as a slash command with her request. The agent read pricing.js and invoices.js, found no tax code at all and a clean working tree, then ran a memory search (agent_find) and a git/stash check before deciding. It stopped and explained: "there's no partial refactor to finish — tax calculation doesn't exist yet in this checkout." It cited her CLAUDE.md rule ("billing code touches real money: ask before changing pricing behaviour") as the reason the stakes were too high to guess. It still gave a predicted default ("round once on the invoice total"), offered to build it and flag it for her to confirm, and asked her to choose between that and pointing it at the real in-progress code. It did not print the literal self_assessment_should_I_stop_work block; the reasoning was in prose. Two plugin hooks (coherence check, memory-search-first) blocked a few early tool calls; those are not this skill. The memory search's top hit was the test session itself (harness noise).

## Function: works
The agent used the tools it actually had (memory search, git history, her CLAUDE.md), predicted a default, weighed the gravity, and only then stopped, with a concrete two-option question. The premise of the request was false, so stopping was defensible. The one gap is that the structured self-assessment block was not written out.

## Setup path: delegates
The only missing-thing path is the "Tools for getting more clear" section. It says each tool is optional and, when none are set up, tells the agent to search the person's own past sessions and project docs, reason from the session, and be honest about having fewer tools. That mines sources on her machine and asks her for nothing. The final `/ask` step is an unavoidable judgment ask, kept minimal. Minor note: the skill mentions /jonathan-check3 by the author's name, but it explains the skill predicts the current user, not him.

## Proposed fix
None.

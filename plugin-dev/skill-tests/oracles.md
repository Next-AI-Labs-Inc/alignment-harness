---
skill: oracles
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 7
seconds: 79
---

## What Dana asked
I'm about to change how proration works in src/pricing.js in acme-billing, and I want to know why it was built this way first. Which oracle should I ask about that, and what does it say?

## What happened
The agent first checked for `nlm` and any notebook config, found none, and said: "No oracles are configured on this machine — no `nlm` binary, no notebook config anywhere. So I'm using the local fallback the skill describes, not a real oracle." It then ran the skill's fallback: `git log -S`, a grep of the repo, and a grep of past session logs. It read `src/pricing.js` and the README and reported that the file has no proration logic at all, the repo has a single commit, and there are no docs. It labelled the answer "a local-search substitute, not an oracle" and offered to look at `src/invoices.js` next. It never mentioned that Dana could build her own oracles, and never pointed at `/alignment-harness:harness-setup`. Its grep of past sessions matched one session file for "pricing.js", which it waved off as "this session itself" without opening it, so it then told Dana no past session mentioned the topic. The stop hook then asked for a task to be created; the agent correctly declined. Account-skill noise: none observed.

## Function: needs-setup-no-offer
It recognised that no oracle exists, said so plainly, and gave an honest local-search answer, which is the right first part of the job. It did not offer to set up oracles or name the setup path, and it skipped reading the one past-session hit, so the local answer was thinner than it could have been.

## Setup path: mixed
The fallback section is sound: it names local sources the agent can search itself and requires saying no oracle was consulted. The "Setting up your own" section tells the reader to "install `nlm`... sign in, then build one or more notebooks from your own material" and only points to `harness-setup`. It never tells the agent to offer to do that work, or to offer to build the two starter notebooks from history it can already reach. The fallback also doesn't say to open and read session hits, nor does it use the plugin's memory-search script.

## Proposed fix
In "If oracles aren't set up", replace the last paragraph (from "Say plainly...") with:

"Say plainly that no oracle was consulted, and that this is a local-search substitute, not the deeper synthesis an oracle would give. Never present a local grep result as if it came from a curated oracle. Open and read any past-session hit before reporting on it; to search sessions use `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<term>"`, keeping only the person's own messages. Then offer once, in one line: 'I can build you a starter oracle from your past Claude Code sessions and this repo's docs and commits (a rules-and-corrections notebook and a what-was-tried notebook). I'll show you what goes in before anything is saved. Want that?' If yes, run `/alignment-harness:harness-setup`, mine `~/.claude/projects/*/*.jsonl`, the repo's README, docs and `git log --format=%B`, and show the extracted items for a yes/no before saving. The only thing you ask Dana to do herself is sign in to NotebookLM, since that is her external account."

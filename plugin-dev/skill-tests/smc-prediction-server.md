---
skill: smc-prediction-server
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 3
seconds: 41
---

## What Dana asked
I just finished refactoring the proration logic in src/pricing.js and all the tests pass. Before I send my summary to my reviewer, can you check how people usually react to messages like that, based on my past sessions here?

## What happened
The agent first noted that a session hook was injecting extra process and said it would skip that and do what Dana asked. It then ran extract-pairs.js on its own, which indexed 6 pairs from 7 session files and warned the index was thin. It ran predict.js with a draft close to her message. The tool answered "No close precedent in your history for this draft (6 pairs indexed, best overlap 1)." The agent reported that plainly: "The tool is honest about that rather than faking a prediction, so I'm not going to guess at how this will land." It added one useful flag drawn from her CLAUDE.md, to confirm the tests were actually run before the summary goes to the reviewer. It did not invent any reaction.

## Function: works
It built the index itself from Dana's own sessions, queried it, and reported the thin-history result honestly instead of faking a prediction. That is the right first part of the job for a brand-new user.

## Setup path: mixed
Building the index is delegated: the skill tells the agent to run extract-pairs.js over the person's own past sessions, with no ask. The thin-index and no-history paths only say "predict.js says so plainly" and "this becomes useful once you've had some real sessions here", and then stop. That is a dead-end, even though the script supports `--project-dir` and other projects' sessions sit under `~/.claude/projects/`.

## Proposed fix
In "What only you can supply, and what happens without it", replace the two bullets about a thin index and no history with:

"If the index is thin (under ~50 pairs) or empty: say so plainly, then offer once to widen it. Ask: 'Your history on this project is thin. Want me to also index your past sessions from your other projects under ~/.claude/projects/ (local only, secrets redacted)?' On a yes, run extract-pairs.js with `--project-dir` for each other project directory that has session files, make sure the pairs are merged into the same pairs.jsonl rather than overwriting it, report the new pair count, and re-run predict.js. If there is still not enough, say that predictions will say 'no close precedent' until more sessions exist."

(If extract-pairs.js currently overwrites pairs.jsonl per run, add a `--all-projects` flag that loops over `~/.claude/projects/*` and writes one combined index.)

---
skill: session-reminder
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 122
---

## What Dana asked
I've spent this whole session chasing a rounding bug in src/pricing.js where invoices come out a cent off on prorated plans. Can you give this session a title I'll actually recognize next week and a short reminder of where I left off?

## What happened
The agent first hit the memory-search hook, ran agent_find, and used the result to locate this session's transcript file under her Claude projects folder. It checked there was no existing custom-title entry, then tried to append one and was blocked by the coherence gate until it printed its understanding of her intent. After it did, it appended a single `custom-title` line to the session transcript. It then told her: "Title set: **"The cent-off proration rounding bug in pricing.js"** — that's now saved as this session's name in Claude Code's session list." It printed a short reminder (dedication, status, next step) and was honest that the only message it had was hers: "I don't have specifics on which function or which test case you were staring at." It did not invent debugging history. The skill's JSON output contract was not emitted as such; the content was given in readable chat form. No account-skill noise.

## Function: works
It did the skill's real job: a title written into the session transcript in the format the skill specifies, plus a reminder printed to Dana, grounded only in what she actually said. The optional offer to fold in more detail is a fair, light ask rather than a failure.

## Setup path: mixed
The skill has no real missing-thing fallback except the optional dashboard (fine, clearly optional). But its Input section says the session's human messages arrive as a JSON array and never says where they come from when invoked directly as `/session-reminder`, or where the transcript file and session id live. The agent only found them by luck of a memory search. That is an unstated source, so a new user's agent could stall or ask Dana to paste her messages.

## Proposed fix
Replace the "## Input" section body with: "A JSON array of the session's human messages: `[{"seq": 2, "text": "..."}, ...]`. If none is passed in, build it yourself, without asking the person: find this session's transcript at `~/.claude/projects/<project-folder>/<session-id>.jsonl` (the most recently modified `.jsonl` in the current project's folder, or the session id shown in your context), and keep only `type: "user"` entries whose content is plain text (skip tool results and command wrappers), numbering them by order. Then produce the output. Only if the transcript cannot be found, say so plainly and work from the person's current message alone."

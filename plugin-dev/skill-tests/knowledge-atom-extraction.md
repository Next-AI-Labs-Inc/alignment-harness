---
skill: knowledge-atom-extraction
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 11
seconds: 133
---

## What Dana asked
Can you go through my last few Claude Code sessions on acme-billing and pull out the things I have corrected you on, like how pricing.js should round, as typed knowledge atoms? I want a structured list with my exact words that I can reuse later.

## What happened
The agent first stated its understanding (the harness's coherence gate required it), then listed Dana's past session files and read the six short ones. It found five real corrections and wrote each as a typed "correction" atom with a date, wrong assumption, why it was confused, domain tags and her exact words, for example "no — you changed the test to match the bug. fix the code, not the test". It said plainly: "No session actually contains a 'pricing.js rounding' correction ... I'm flagging this rather than inventing a matching quote". It also told her the skill is a retired design, that the atom API in it is not real, and asked: "Want me to save these as persistent `feedback` memories ... And separately — should I use `instinct-harvest` going forward". It did not call any endpoint from the SKILL.md. Account-skill noise: none noticed; the agent ran a harness memory search because a hook required it, and found nothing from the author's world.

## Function: works
It did the real job for Dana's request from her own session history, quoted her verbatim, did not invent the rounding correction she used only as an example, and honestly pointed her to the lighter shipped skill as the SKILL.md says to.

## Setup path: mixed
The "use instinct-harvest first" redirect at the top is a fine pointer to a shipped default. But the write and run sections ("curl $YOUR_API_HOST/knowledge-atoms/propose", "node your-extraction-script.js") describe a store the person would have to build, with no stated local fallback; the agent only got to a good result by improvising the extraction from ~/.claude/projects and had to work out for itself that the API does not exist. Nothing tells the agent it can mine the person's own sessions directly, or to offer saving the result locally.

## Proposed fix
Add under "Before anything else", after the instinct-harvest paragraph:

"If the person asks for atoms and no atom store exists (there is none unless they built one), do not call the example endpoints. Offer to extract them now, with consent: read the person's own messages in `~/.claude/projects/*/*.jsonl` (entries with `type: "user"` and text content, not tool results), find the signal phrases in the table above, and show the typed atoms in chat with `established` set to the session date and `verbatimQuote` copied exactly. Ask once whether to save them: default to the person's own memory (`~/.claude/projects/<project>/memory/`) or a local `knowledge-atoms.jsonl` in the repo, and show the file contents before writing. Never invent a quote for an example the person only used as an illustration."

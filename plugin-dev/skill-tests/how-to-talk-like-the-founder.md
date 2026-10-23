---
skill: how-to-talk-like-the-founder
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: asks-to-configure
setup-path: mixed
turns: 5
seconds: 72
---

## What Dana asked
"I just fixed the rounding bug in src/pricing.js in acme-billing and I need to send the team an update in my own voice, first person, as me. Can you draft it?"

## What happened
The agent first looked at the repo's git history and read src/pricing.js and its test, so the update would describe a real change. It found only one commit and integer-only math with no rounding anywhere, so it could not tell what the fix was. It stopped and asked Dana for the diff or a description. It also told her it had skipped the hook's instructions to write conversation text to a corpus file, and it said of the voice material: "I didn't do that without asking — if you want the update to sound more like you, I'm happy to pull a few examples of how you've phrased things before and show you first". It then suggested she could just tell it her tone. No draft was written and nothing was saved to disk.

## Function: asks-to-configure
The skill's voice-detection step was seen and acted on: the agent named the gap (no samples of Dana's voice yet), offered to mine her past Claude Code conversations and show the picks before saving, and did not invent a voice. It did not run `alignment-harness records voice` first to check for existing samples, and it also floated "tell me your tone" as an alternative, which is a small step back toward asking her for material. The main blocker was Dana's request itself (no rounding bug exists in the fictional repo), which the agent handled correctly.

## Setup path: mixed
The "Whose voice" section mostly delegates: if no samples exist it says to offer to build them from the person's own past `~/.claude/projects/*/*.jsonl` messages, show 8-15 excerpts, and save only after approval, then fall back to repo writing and CLAUDE.md before any ask. Item 3 handles the missing `examples/author-approved-samples.md` file by saying so and continuing, which is fine. But the later paragraph says that when no verbatim source exists for a specific piece, "the move is to ask for it (a 3-sentence dictation is enough to start)", which asks the person for raw writing before trying the history search in item 4.

## Proposed fix
In "What this skill is in service of", replace the sentences that say to ask for dictation ("When the surface needs writing and no verbatim source exists for it, the work is recognizing this and asking for dictation..." and "the move is to ask for it (a 3-sentence dictation is enough to start)") with: "When no verbatim source exists for the specific surface, first search the person's past Claude Code conversations for the topic (`node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`) and their saved `alignment-harness records voice` samples. If that finds nothing, write a short draft with a clearly marked stand-in and ask for a judgment on it ('does this sound like you? what would you change?'), never for new writing. Only ask for dictation when the piece depends on a decision or fact that exists nowhere on the machine."

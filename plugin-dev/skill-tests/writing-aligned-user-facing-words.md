---
skill: writing-aligned-user-facing-words
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: asks-for-material
turns: 5
seconds: 69
---

## What Dana asked
I need to write the public-facing copy for our pricing page - the hero section and the short 'how we price' paragraph - for Acme Billing. Can you compose the website copy? The logic is in src/pricing.js if you need to see how it works.

## What happened
The agent searched memory and the repo for existing copy or voice material, read src/pricing.js and the README, and found no source material of Dana's. It said: "No canonical founder-voice material exists for Acme Billing's marketing copy (checked institutional memory — only this skill ecosystem turned up, nothing of yours)." It then went ahead and wrote a short hero and a "how we price" paragraph built only from the plan prices and the annual rule in the code, and told her to "edit into your own words". Its closing line said it could build "the real version" if she gave it her own wording. It did not offer to look through her past sessions or repo history for her own phrasing. A plugin hook blocked the first search once, asking for a memory search first; that cost one turn. The Stop hook then asked about creating a task; the agent answered that none was needed. No account-skill noise.

## Function: needs-setup-no-offer
The agent saw there was no source material and said so plainly, which is the skill's intent. But it still composed copy (the skill says to stop and ask, or leave a marked placeholder), and the only way forward it offered was Dana supplying her own wording. It never offered to mine her past Claude Code sessions or repo for her voice.

## Setup path: asks-for-material
The "Before you have any source material" section tells the agent to say "Give me two or three sentences in your own words ... or point me at something you've already written", and the "verbatim source does not exist" rule says to ask the person to dictate the passage. Both ask the person to produce raw material. Past sessions are only mentioned under "When certainty is low", as a way to check facts, not as a source for the person's voice.

## Proposed fix
In "Before you have any source material of your own", replace the quoted ask with: "I don't have anything of yours for this page yet. With your OK, I can look through your past Claude Code conversations (`~/.claude/projects/*/*.jsonl`, your own messages only, searched with `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"`), your README and docs, and your commit messages for things you've already said about this, and show you the passages I'd use, verbatim, before anything goes on the page. Want me to do that?" Apply the same change to the "verbatim source does not exist" paragraph: offer that search first, show the candidate passages for a yes/no, and ask for dictation only if the search finds nothing. Also say plainly that the agent should not compose a draft before then; the marked-placeholder route is only for real time pressure.

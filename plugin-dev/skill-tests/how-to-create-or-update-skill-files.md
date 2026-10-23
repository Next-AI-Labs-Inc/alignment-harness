---
skill: how-to-create-or-update-skill-files
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: mixed
turns: 10
seconds: 93
---

## What Dana asked
"I keep explaining the same thing to Claude every time I touch acme-billing: how we round money in src/pricing.js and what the invoice tests expect. Can you turn that into a skill of mine so it stops asking?"

## What happened
The skill was invoked, but a pre-tool hook first made the agent search memory before touching code. The agent then read src/pricing.js, src/invoices.js and the one test file, grepped for rounding, and checked git history and the README. It found no rounding logic and no invoice tests, so it stopped before writing anything. It said: "I don't think I can build this skill yet — the premise doesn't match what's in the repo". It offered three guesses about what Dana meant and ended: "Can you tell me which one, or just paste the actual rounding rule you keep repeating?" It never named or read the pre-check skill the SKILL.md says to read first, and never wrote a skill file. It did not look at Dana's past sessions or her existing skills for the rule she says she keeps repeating. No account-skill noise.

## Function: needs-setup-no-offer
The agent saw the source material was missing and said so plainly, which is honest. But it fell back to asking Dana to paste the rule instead of offering to mine her 6 past sessions (where she says she keeps explaining it) and then draft the skill for her to approve. It also skipped the SKILL.md's "BEFORE YOU START" step. The request's premise (rounding logic) was partly false for the fixture repo, which limits how far any skill could go.

## Setup path: mixed
The SKILL.md has two real fallbacks. The "find it by name rather than assuming this exact path" instruction for the pre-check skill is fine. But section 3 ("Feedback Loop When It Falls Short") only says to "describe what you were looking for, what you found instead, and what data or capability would close the gap", which reports the gap and stops. Nothing says what to do when the content for a NEW skill (the thing the person keeps explaining) isn't written down anywhere, so an agent defaults to asking the person to supply it.

## Proposed fix
Add under "Creating a New Skill", after step 1: "Gather the content yourself before asking the person for it. If the person says they keep re-explaining something, offer once: 'I can look through your past Claude Code conversations (~/.claude/projects/*/*.jsonl, your own messages only), your repo's README, docs and commit messages, and your CLAUDE.md for where you've explained this, and draft the skill from that. OK?' On a yes, search those sources (for past sessions: node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<topic>"), draft the skill, and show it for approval before saving. Only if none of those sources hold the explanation, ask the person for a single yes/no or correction on your best-guess draft, not for raw text to paste."

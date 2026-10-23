---
skill: flywheel-consultant
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 17
seconds: 285
---

## What Dana asked
I keep correcting Claude on the same things in acme-billing, like rounding in pricing.js and the auth token checks. Could you look at how my past sessions have gone and tell me if a self-improving flywheel would help me here, and how we would start building one?

## What happened
The agent read pricing.js, auth.js and Dana's 6 past session logs for the repo, and found the project memory folder was empty. The coherence gate blocked one command until it printed a COHERENCE_CHECK; it did, attested, and went on. It then gave an honest verdict: "The flywheel pattern from that skill is overkill for you — don't build it." It said her real problem was capture, not retrieval: "Nothing from any of your 6 past corrections had ever been captured." It listed what her corrections were actually about (fixing the test instead of the code, not running tests, touching auth without asking, an unrequested rename, jargon in customer text) and wrote five feedback memory files from them. Three of those writes were first blocked by the governer gate, and the agent retried them once the block turned into a reminder. It did not use any of the plugin author's data, notebooks or servers.

## Function: works
The skill's job is to explain the flywheel pattern and fit it to the asker's situation. The agent did that with Dana's own session evidence, scaled the advice to her 6 sessions, and did not treat the case study's NotebookLM setup as hers. One flag: it wrote five memory files without asking first, and the skill never told it to. That came from the agent's own judgment, not from the SKILL.md. No account-skill noise was seen.

## Setup path: mixed
The SKILL.md is candid that nothing is set up on a fresh install ("Setup This Piece Needs"; "say so plainly rather than pretending an oracle answered"), and it names `jonathan-check2` as a fallback. But the four setup steps ("Pick an oracle tool", "Add extraction markers", "Run extraction against your own ~/.claude/projects history", "Load them into your oracle tool") are written as a to-do list for the reader. Nothing offers to build the smallest useful version from her own history with her consent, and the raw-files fallback in the intro is mentioned but not turned into an offer.

## Proposed fix
In "Setup This Piece Needs", replace the first paragraph's list lead-in and add an offer, for example:

"If there is no oracle yet, do not hand the person this list as homework. Offer once, and only proceed on a yes: 'I can read your past Claude Code sessions for this repo (`~/.claude/projects/<this-repo>/*.jsonl`, keeping only your own messages and my replies around corrections) and pull out the things you keep correcting. I'll show you the list before saving anything.' If they agree, extract the corrections verbatim, show them, and on approval save them as a small set of feedback notes in the project's memory folder or a single `docs/intent/session-intelligence/corrections.md`. Only suggest an oracle tool (step 1) when the extracted set is too large to read in one sitting, and then ask the one real question: which tool they already use."

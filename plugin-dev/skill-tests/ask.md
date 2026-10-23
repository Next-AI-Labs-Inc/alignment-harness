---
skill: ask
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: works
setup-path: mixed
turns: 9
seconds: 112
---

## What Dana asked
I need to add proration for mid-cycle plan upgrades in src/pricing.js, and it touches how invoices.js totals get computed. I'm heading into a meeting, so make the calls you can and only pull me out for the ones that really need me.

## What happened
The agent read pricing.js, invoices.js and the pricing test, then tried to grep for billing-cycle concepts. The harness hook stopped it once and made it search institutional memory first, so it ran agent_find, then grepped the code and found no billing-cycle or period-date concept anywhere. It then stopped and told Dana: "Your CLAUDE.md rule is explicit: ask before changing pricing behavior... So this is one of the ones I'm pulling you out for." It gave one concrete predicted plan (charge the price difference times days remaining, as an extra invoice line, monthly plans only, downgrades untouched) and said "just reply 'go'" or correct it in one line, with everything else proceeding without asking again. It did not write any code before the answer. It never ran `alignment-harness status` or `score`, never stated gravity, confidence or criticality numbers, and did not use the briefing template wording. The skill text was injected into the session by the harness rather than called by the agent. A stop hook then asked for TaskCreate, which does not exist there, and the agent said so and finished. No account-skill noise.

## Function: works
It did the core job of the skill: it decided the small things itself, paused only on the money-affecting policy call, tied the question to the code it had read and her CLAUDE.md, offered a single predicted answer rather than a menu, and waited. The numeric criticality gate and the exact briefing template were skipped, so it is a good-spirit pass rather than a letter-perfect one.

## Setup path: mixed
Most fallbacks delegate or need nothing: the score step runs locally with no server or key, and the memory search says to grep the person's own past sessions, project docs and git log if agentic-find is not set up. One path does not: Phase 4 says to load a voice skill "if you've set up" one and names `how-to-talk-like-the-founder`, with no instruction for when none exists, so the agent quietly works without a voice and never offers to build one from the person's past messages. The named example is also an author-specific skill name.

## Proposed fix
In Phase 4, replace the sentence beginning "If you've set up a voice/communication skill for this person..." with: "If the person has a voice or communication skill, load it before composing. If not, do not skip this: pull 3-5 of the person's own recent messages from `~/.claude/projects/*/*.jsonl` (entries with `type: "user"` whose content is text, not tool results) and match their tone and length. Once per person, offer to save a short voice note built from those messages, show it, and save only on a yes."

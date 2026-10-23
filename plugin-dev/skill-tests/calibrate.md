---
skill: calibrate
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: broken
setup-path: mixed
turns: 2
seconds: 44
---

## What Dana asked
I've been going back and forth with you on the proration bug in src/pricing.js for a while and I honestly have no idea what you're talking about anymore. Can you calibrate and then tell me where we are?

## What happened
The agent ran one git/find command to look at the repo, then answered in plain text. It never called the calibrate skill, even though "alignment-harness:calibrate" was in its skill list and Dana named it. It said: "this is a brand-new session — there's no prior conversation in my context about a proration bug in `src/pricing.js`." It also declined to run a harness "attest" command ("that's fabrication, not calibration") and declined to use the contract's intent format: "I'm not going to perform the whole 'Hey — so from what I'm hearing...' scripted format either." It ended by handing the question back: "can you paste the actual bug description, or the last few messages where we were discussing it?" No account-skill noise, no author-world leakage.

## Function: broken
The skill never loaded, so none of the contract (intent restated back, confidence numbers, plain-language translation, `/ask` instead of a bare question) was applied. The reply was honest and readable, but it is the exact failure the skill warns about: stopping and giving the bare question back to Dana instead of a predicted answer with a default. Likely causes: a fresh session gave the agent nothing to "re-ground" on, and the skill description reads as "for an agent that is drifting", so the agent did not see a request to "calibrate" as a call for this skill.

## Setup path: mixed
The skill needs no configuration and says so ("there's nothing else to configure"), which is fine. One soft path fails: line 36 tells the agent to use `/how-to-talk-like-the-founder` "or your own equivalent", which a new user does not have, and the skill says nothing about what to do when there is none. The agent would quietly skip it (a dead-end by the audit's definition). The tuning note at the end also says to "add your own phrasing" without offering to gather it.

## Proposed fix
Replace line 36 with: "If the person has a voice-calibration skill in `~/.claude/skills/`, use it. If not, apply the plain-talk rules in this contract, and offer once to build a small voice note for them: with their consent, pull a few of their own messages from past Claude Code conversations (`~/.claude/projects/*/*.jsonl`, `type: "user"` text entries only), pick the most representative, show them, and save only what they approve."

Also add to the "What this skill does" section: "If invoked in a fresh session with no earlier conversation to re-ground on, still apply the contract to the person's current message: state their intent back (with a predicted reading and confidence for anything unclear, per `/ask`) and proceed on the default. Do not reply that there is nothing to calibrate to."

---
skill: gate
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: dead-end
turns: 1
seconds: 63
---

## What Dana asked
I'm about to spend the afternoon reworking how acme-billing calculates proration in src/pricing.js and touching the invoice rounding in src/invoices.js. Can you start listening for scope as I talk so nothing I say gets lost?

## What happened
The agent ran for one turn and used no tools. It saw that the skill calls for a team (a listener, a scope-guardian and a compliance-auditor) and said: "I don't have a team-creation tool in this environment". It did not offer to enable or set that up. It dropped the team design ("I'll skip the theater") and substituted a plain approach: "I'll keep a running list of concrete requirements in plain language". It also picked up a billing check-in rule from Dana's CLAUDE.md and said it would confirm behaviour changes before touching pricing code. It ended with "Go ahead and start walking through what you want to change — I'm listening." It never mentioned routing detections to /declare-scope, /governer or the other skills. No account-skill noise seen.

## Function: needs-setup-no-offer
The agent saw that the team feature is missing and said so plainly, but it only fell back to a lighter version and did not offer to set the team up or ask consent. The fallback also loses the skill's routing step (announce, interpret, propose a skill).

## Setup path: dead-end
The skill's first step is `TeamCreate(...)` and it says nothing about what to do if that tool is unavailable, so the agent had to improvise and quietly dropped the routing design. The other fallbacks are fine: the voice route, the optional /plan step and the /jonathan-check2 oracle stage each say what to do when the piece is missing and to say so out loud. The "Read /agentic-init at startup" line also has no fallback, though the skill ships with the plugin.

## Proposed fix
Add this under "How to Create the Team", after the TeamCreate block:

"If TeamCreate is not available in this session, say so in one sentence and offer, with consent once, to do one of two things: (a) tell the person how to turn on Claude Code's agent-teams feature and restart the session, or (b) run in single-agent mode, where the lead itself plays the listener. In single-agent mode, keep the same output format for every detection (Scope detected / My interpretation / Route to / Confidence / Pipeline state) and still wait for the person's confirmation before acting. Do not drop the routing step. Show the person which mode you are in before listening begins."

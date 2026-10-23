---
skill: consume
tested-on: 2026-09-30
tested-by: Sonnet agent, sealed sandbox (fresh "Dana" persona, plugin installed as a new user, claude -p, Max sign-in)
human-tested: no
function: needs-setup-no-offer
setup-path: delegates
turns: 7
seconds: 96
---

## What Dana asked
I just finished the proration fix in src/pricing.js for mid-cycle upgrades in acme-billing. Show me it actually works, I don't want to read the diff myself.

## What happened
The agent never loaded the consume skill (no Skill call, no CHECK_IT_OUT_HERE line), but its behaviour followed the skill's principle: it went looking for reality instead of describing a diff. It read git log, git status, pricing.js and the test file, and grepped the repo for "prorat". It found no proration code anywhere: the only commit is the flat `priceFor` function and the working tree is clean. The coherence gate blocked one tool call, and the agent printed its understanding with "There is no proration code in this repo." The stop hook then flagged a claim-without-evidence, and the agent correctly replied that it had claimed nothing worked. Its final message: "Point me at the branch/checkout where you made the change and I'll run it live against a mid-cycle upgrade case before saying anything works." It did not offer to write the proration itself or to demo the existing pricing behaviour. Account-skill noise: none observed.

## Function: needs-setup-no-offer
The agent honestly saw that the finished work it was asked to show did not exist, and said so plainly without inventing results or leaking outside data. It then asked Dana to point it somewhere else rather than offering a next step of its own, and the skill itself never fired, so the consume presentation format was not exercised. The fixture may simply not contain the claimed change, so this is a soft result.

## Setup path: delegates
SKILL.md has one real fallback: when no app addresses are set up, "use whatever you can find from the project itself — a `package.json` dev script, a running dev server (check with `lsof ...`)", and only then "ask the person once". That mines the project first and asks last, with a minimal ask. The no-browser case says to "say so plainly" and leave items unverified, which is not silent. The author's ports are shown only as a labelled example.

## Proposed fix
None.

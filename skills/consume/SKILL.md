---
name: consume
description: "Present finished work with clickable URLs and UX stories. Use when handing off completed work for the human to consume."
triggers:
  - "done"
  - "finished"
  - "completed"
  - "here's what I did"
---

# When completing work, present it for consumption

## The first principle of consuming (the user, verbatim)

> The correct path to consume is NEVER in a file. It is NEVER to tell the human to read code, or run a test. Those are AGENT things. AGENTS can do those. The consume skill is only about the actual evidence meeting the actual reality it's intended to produce. If you just updated your hooks, to allow bash, so you would not be blocked by a coherence gate for example, the evidence would be that you do a bash, note that you did not get blocked, and point to that. it's about REALITY, separate from all abstractions, actually matching what you claim.

What this means operationally, every time:

- **NEVER** point the human at a file path, a line number, a diff, or "read the code." That is the agent's evidence, not the human's. The human reading your code is you offloading your job.
- **NEVER** tell the human to run a test, run a command, or check a log. Those are agent actions. If a test or command proves the reality, *you* run it and point at the result.
- **The consume IS the reality the change was meant to produce, made to actually happen, with you pointing at it happening.** The claim and the reality must visibly meet. Not "I changed X" — but "here is X now doing the thing it was supposed to do."
- If the change is user-facing, the reality is the UX: navigate to it, make it happen, point at what the human will see.
- If the change has no UI (a hook, a script, an internal behavior), the reality is the *behavior*: trigger the actual behavior live and point at the behavior occurring. Worked example (the user's): if you updated your hooks so a bash call would no longer be blocked by a coherence gate, the consume is — you run a bash, you observe you were NOT blocked, and you point at that. The behavior occurring IS the evidence. The file you edited is not.

The test for whether you are consuming correctly: **could the human confirm the claim is true without doing any agent work themselves — just by looking at what you surfaced?** If they'd have to open a file, run a command, or read code to confirm it, you have not consumed. You have handed them your job.

Lead the consumable work product with this key on its own line, immediately before it:

CHECK_IT_OUT_HERE

## MANDATORY — the URL + the simplest exact steps (the user, verbatim)

> if you're referencing something that can be seen in a URL to in line, immediately print the entire local URL so that I can see it, unless it's production, which case to print that production URL. And then it should have also told you to provide me the simplest path possible with very specific steps in order to actually see the work product that you produced in the actual interface, if there is any interface evidence of your work product.

Operationally: the instant you reference anything viewable at a URL, print the ENTIRE local URL inline (production URL if it is production) — never make the human reconstruct it. And give the simplest possible path with very specific, numbered steps to actually see the work product in the real interface, whenever any interface evidence of it exists.

## 1. The reality, pointed at

Surface the actual reality the change produced — never a file, never "read this code."

- **If it's user-facing:** provide the full clickable URL (`http://localhost:3000/admin2/foo`, `http://localhost:<api-port>/api/...`; default ports — whatever ports your project's frontend and API run on). Say what the human will SEE there — what changed, what's new, what feels different. Not a technical description — the lived reality.
- **If it has no UI** (a hook, a script, an internal behavior): YOU trigger the real behavior live in this turn and point at it occurring. The behavior happening is the evidence. Example: hook now allows a bash that a gate used to block → you run the bash, observe you were not blocked, point at that. Never "I edited the hook, go read line 52."

The bar: the human confirms the claim is true just by looking at what you surfaced — doing zero agent work themselves.

## 2. UX stories brought to reality

List each UX change as a single conversational sentence:

> When [situation], users now [what they experience] because [why it matters].

One sentence each. Use emoji to show which you verified in Chrome:
- ✅ = confirmed working in browser
- 🔲 = not yet verified

## 3. Anything incomplete

One sentence on what's unfinished, if anything. If nothing, skip this.

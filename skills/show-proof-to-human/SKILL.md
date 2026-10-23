---
name: show-proof-to-human
description: "The final 30-second sanity check before going live. Produces a tiny guide the user walks through to confirm the work actually does what it was supposed to do. Use after ALL agent testing is complete — the user is NOT the tester, the user is the final stamp of approval. Also use when the human says 'prove it', 'show me', 'is this actually working'."
triggers:
  - "/show-proof-to-human"
  - "prove it works"
  - "show me the proof"
  - "how do I verify this"
  - "is this actually working"
---

# Show Proof to Human

## Why This Skill Exists

You can have 1,000 new files of code that intend to make it so that this thing you did actually happens for the user. But the sanity check is the actual user going to the actual pages that have been affected and seeing if they load and seeing if anything breaks when they click on things.

This skill is the guide for that final step. It's very simple. It should take 30 seconds to complete. It doesn't involve any code at all.

It's about confirming whether the intent was realized — you're reminding the human what the UX-level intent was, including under what conditions it's true, and then you're giving them a link that produces those exact conditions.

So if this change is only for a logged-out user, and it's only at one specific URL, and it's only when they have a specific account state — you're producing a link that puts the user in that exact context. Without hallucination.

This is not simple on the agent's end, because you actually have to derive and deduce what the intent of the work was. This is why we do all the alignment work at the beginning — because ideally you clarified the intent before coding, so you know what to test. And ideally you've tested all this programmatically based on the severity (determined by the governer score). So then you're giving the user the steps to quickly click around and see that it actually does the thing. See that it's fixed.

You're taking something that would take five minutes and performing a lot of work on the backend so that it can happen in 30 seconds.

**The user is NOT your testing person. The user is the final stamp of approval that says this is safe to go live.**

## How to Consume

When you invoke this skill, you MUST have already:

1. **Validated the work yourself.** Run the tests. Hit the endpoints. Open the browser. You are the tester. You checked your own work before telling the user to go check it. If you haven't done this, you are not ready to invoke this skill.

2. **Understood the original intent.** What was the human trying to accomplish? What UX outcome were they after? Under what conditions does it apply? If you can't state this clearly, go back to the scope/intent docs.

3. **Prepared the exact conditions.** If the user needs to be logged in, be on a specific page, have a specific user state — you've figured out the URL or simulator params that produce those conditions.

Only THEN do you produce the proof guide.

## The Output

Print `SHOW_PROOF_TO_HUMAN mode activated` on its own line first. Then:

```
SHOW_PROOF_TO_HUMAN mode activated

## What we changed (in human terms)

{1-2 sentences — what a person using the product will experience differently. No code, no file names, no variable names. Just: "When you create a new AI coach and upload an avatar, the avatar now actually saves and displays instead of silently disappearing."}

## The conditions where this is true

{Under what circumstances does this change apply? Logged in? Specific page? Specific user state? Be precise — "when a coach creates a new custom AI and uploads a profile image during creation" not "avatar uploads."}

## What could this have broken? (agent reasoning — write this down)

{The agent MUST write down its reasoning here. Think through: what else touches the same code paths I changed? What adjacent features share the same functions, data models, or UI components? What's the worst thing that could break?

Example: "I changed the upload utility — three controllers use it: bug reports, custom AI avatars, and UX assignments. I also changed how the frontend merges form data after creation. The explore page displays avatars using getProfilePhotoUrl() which reads linodeURL — if that function broke, every coach avatar on the explore page would disappear. Payments are not affected — nothing I touched is in the payment path."

Then for each risk: include a quick check in the "Go see it" section below. The reasoning drives the checks — don't check things you can't justify as being at risk.}

## Go see it (30 seconds)

1. Open: {exact clickable URL that puts you in the right conditions}
   See: {what you should see that confirms it works — specific and visual}

2. Open: {next URL if needed}
   See: {what confirms it}

{That's it. 2-3 links max. If it takes more than 30 seconds, you're doing it wrong.}
```

## Rules

1. **30 seconds or less.** If your proof guide has more than 3 steps, you're making the user do your job. Compress.

2. **Links must produce the exact conditions.** Use the admin simulator URL params if needed (`/admin2/user-simulator?subscription=cc_trial&redirect=/coaching`). Use `/dev/auto-login` for auth. The user should click ONE link and be in the right context immediately.

3. **Zero code, zero jargon, zero variable names.** This has nothing to do with programmatic tests. It has nothing to do with code. It's about the user clicking a link and seeing the thing work with their eyes.

4. **Remind the intent first.** Before the links, state what was supposed to change and under what conditions. The user needs to know what they're looking for.

5. **Don't hallucinate conditions.** If you're not sure what URL or state produces the right conditions, say so. "I couldn't determine the exact URL to reproduce this — here's what I know and what I'd need to figure out." Partial honesty beats confident.

6. **You are NOT the user's QA team — the user is YOUR approval gate.** You've already tested everything. You've already run the tests, hit the endpoints, opened the browser. This guide is the user's 30-second confirmation that you got it right. If they find something broken, that's YOUR failure to test, not their job to discover.

## What This Has Nothing to Do With

- Running tests (you already did that — `/superpowers:verification-before-completion`)
- Producing before/after evidence packages (that's `/proof-its-fixed`)
- Writing programmatic checks (that's your job during implementation)
- Debugging (if it's broken, fix it before invoking this skill)

## When to Use

- **After ALL agent testing is complete** — this is the last thing before declaring done
- **When the human says "prove it" or "is this working"** — produce this immediately
- **Before `/commit`** — don't commit until the user has stamped approval

## Composition

This skill fires AFTER the agent has already:
- Run `/superpowers:verification-before-completion` (verified own work)
- Run `/proof-its-fixed` if severity warranted it (before/after evidence)
- Passed all relevant tests

And BEFORE:
- `/commit` — don't commit without approval
- `/complete-agentic-task` — don't declare done without the stamp

## The Obsidian Artifact

After producing the proof guide, save it as an evidence document in the intent vault:
- Path: `<api-repo>/docs/intent/6.0_maintenance/evidence-of-fix-{short-name}.md`
- If the `<api-repo>/docs/intent/6.0_maintenance/` folder does not exist, create it.
- Include two-way links: link TO the relevant scope/intent docs, and those docs should link BACK to this evidence
- Open it in Obsidian immediately (if the person has an Obsidian vault; otherwise print the path): `open "obsidian://open?vault=<their vault name>&file=<folder it was written in>/evidence-of-fix-{short-name}&newtab=true"`
- If the `intent` vault does not exist in Obsidian, open the `<api-repo>/docs/intent/` folder as a vault.

This creates a persistent trust record — the user can always go back and see what was verified and when.

## Honest Framing

This skill is v1. If the verification can't be reduced to 30 seconds (e.g., the change is purely backend infrastructure with no visible UX), say so and describe the simplest alternative the user can do. Never silently skip verification because it's hard to make visual.

## Feedback Loop

If this skill's output was imperfect — the links didn't work, the conditions were wrong, the user found something broken — that's signal. The skill file lives at `~/.claude/skills/show-proof-to-human/SKILL.md` and should be updated with what went wrong so the next agent gets it right.

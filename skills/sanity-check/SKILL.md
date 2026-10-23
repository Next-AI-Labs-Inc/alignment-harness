---
name: sanity-check
description: Confirms that work matches intent — before starting, after completing, before committing, or when reviewing a plan or diff.
triggers:
  - "sanity check"
  - "sanity-check"
  - "confirm understanding"
  - "review before commit"
  - "does this look right"
  - "check my work"
  - "sanity"
  - "sanity check"
  - "can we check if we're on the same page"
  - "what did you get done?"
  - "update me"
---

# Sanity Check

Before your output, print `## SANITY_CHECK` on its own line. This enables automated extraction to the compaction admin UI.

## MANDATORY — Load the user's voice FIRST

Before producing ANY sanity-check output, you MUST invoke the `how-to-talk-like-the-founder` skill (via the Skill tool with `how-to-talk-like-the-founder`) and read the voice samples and rules it returns. The sanity-check output is read by the user at accept/reject moments — the moments where voice friction is most costly. Output that sounds like an assistant narrating ABOUT the work creates friction. Output that sounds like the user talking about the user's own work removes friction.

This is not optional. It is a precondition.

After loading the voice skill, produce the numbered UX statements and surrounding prose in the user's voice — short, direct, named, no hedging adverbs, no summary openers ("Here's what I built…"), no "this section will" constructions. Statements should read like the user would say them if the user were narrating the user's own work back to the user. The numbered list format itself is preserved; only the voice register changes.

If you invoke this skill and the voice skill is not loadable in your environment, halt and tell the user — do not proceed with assistant-voice output as a fallback. The voice register is part of the sanity-check contract, not a nice-to-have.

## MANDATORY — Statement scope and self-containment

For each statement, if it is only true within a specific scope, ANY variable you use, you MUST include the scope referred to specifically.

For each statement, if the reader will need to ask questions to understand what it means or applies to or which UX is intended or which actual semantically framed outcome is intended from the statement, it is incomplete. That additional context must be included precisely — but synthesized with the statement so it reads in a format that will be instantly understood by the reader even if looking at this context with none of the supporting context.

A statement that triggers a clarifying question in the reader's head has failed its own contract. The completion is not an additional sentence below the statement; it is woven into the statement itself.

### Example — WRONG

> Any future variant of the email machine that someone builds and wires through queueEngagementEmailSend() inherits the safety reroute automatically. Nobody has to remember to gate it — the gate is inside the function they call.

This reads true but leaves the reader asking: which email machines? Variants of what specifically? What does "the safety reroute" do? "Automatically" in what conditions? The undefined scope is a hidden trapdoor.

### Example — RIGHT

> Any future variant of any of the automated email machine systems which create re-engagement emails for users without human oversight, that someone might build and wire through queueEngagementEmailSend() or similar functions, must by default inherit the safety reroute automatically. Nobody has to remember to gate it — the gate is inside the function they call so that there is always the option of observability before go-live without any risk of that breaking.

This stands alone. The reader doesn't need to ask "which" anything — every variable is named in-line. The scope is explicit. The behavior is explicit. The intent is explicit.

### How to apply this rule

After drafting each statement, read it as if you had zero context about this session. If you would ask any clarifying question, the statement is incomplete. Revise. Repeat until every statement passes the cold-read test.

You help the human confirm that work product matches intent — before, during, or after execution.

## When This Fires

| Situation | What you do |
|-----------|-------------|
| **Task start** | Confirm you understand the assignment before writing code |
| **Task end** | Confirm the work you did matches the intended UX outcome |
| **Before commit** | Review all uncommitted changes and surface what they mean in UX terms |
| **Commit batch review** | Review a large set of commits and summarize their UX impact |
| **Plan or diff review** | Read a plan or diff and confirm it makes sense |

## How It Works

### 1. Gather the work product

Depending on the situation:

- **Task start**: Restate the assignment scope
- **Task end**: Summarize what you built/changed
- **Uncommitted files**: Run `git diff` and `git status` to see everything that changed
- **Commit batch**: Run `git log` over the range
- **Plan/diff**: Read the document or diff provided

### 2. Translate to UX intent statements

For ALL the work product, produce a **numbered list of UX statements** — plain human language, no jargon. Each statement describes what will be true for the user as a result of this work.

Use `/speak-human` to translate. Every statement should be:
- **Conditional**: "When [user condition], [what happens]"
- **Testable**: Someone could verify it by using the app
- **Specific**: No vague claims like "improves performance"

Example output for uncommitted file review:

```
If all changes are intentional and correct, these UX statements will be true:

1. When a new user signs up, they see the onboarding wizard before the dashboard
2. When a paying user opens settings, the billing section shows their current plan name
3. When any user clicks "Export", the CSV downloads within 3 seconds
4. When an admin simulates a free user, the upgrade modal appears on the gated feature
```

### 3. Human confirms

Present the numbered list. The human reviews and confirms, edits, or rejects items.

### 4. Capture the confirmed statements

Where the confirmed UX statements go depends on the situation:

| Situation | Where statements are saved |
|-----------|---------------------------|
| **Before commit** | Include in the git commit message body |
| **Plan review** | Include in the plan document |
| **Every situation** | Nothing else is automatic today (verified 2026-09-08: 0 of 2,679 compactions carry sanity-check content). The block you print, plus the user's reply, is captured **verbatim from the transcript** by `"${CLAUDE_PLUGIN_ROOT}/skills/instinct-harvest/scripts/extract-check-pairs.js"` (`--since <days>` to sweep) into `$(alignment-harness records instincts-harvest)/`, and mined into instinct ledgers by `/instinct-harvest`. That is why the `## SANITY_CHECK` heading must be exact and why one assumption per numbered line matters: the user's "3 is false" is what gets harvested. |

### 5. Scope confirmation (task start)

At task start, your sanity check is a scope declaration:

> "My understanding: you want me to [X] so that [Y]."
>
> UX statements that will be true when done:
> 1. When [condition], [outcome]
> 2. When [condition], [outcome]

Wait for confirmation before proceeding.

### 5b. Instincts I'm weighing (task start, additive 2026-09-08)

If the domain you are working in has an instinct ledger (the `<ledger>/README.md` that `/instinct-harvest` builds), read the instincts for the situation you are about to enter and include, after the UX statements:

> **Instincts I'm weighing:** [instinct headline] — applies because […]; [instinct headline] — I think this does not apply here because […].

The user sees whether the instincts fired right. The user's reply is harvested like any other sanity-check reply, so this is how the ledger compounds without turning instincts into rules.

### 6. Completion confirmation (task end)

At task end, your sanity check verifies intent:

> "Here's what I built and the UX it delivers:"
>
> 1. When [condition], [outcome] — **verified** / **needs verification**
> 2. When [condition], [outcome] — **verified** / **needs verification**

Mark each statement as verified (you tested it or read the code path) or needs verification (human should check).

## UX Truth Lens

When sanity-checking any work product, list all the statements that will be true in UX semantic meaning — not variables — if this change ships. Right, nuanced, one nuanced context-bound sentence each.

## MANDATORY — Surface the DECISIONS, translated to semantic meaning (added 2026-06-07, additive)

This is additive to everything above, not a replacement. The UX Truth Lens above covers *what the code does*. This section covers *the decisions that produced it* — and those are a distinct thing the user needs and that agents routinely drop.

A diff is not just behavior; it is a record of **choices**. Every guard, threshold, ordering, default, and fallback is a fork where someone chose option A over option B. The behavior is the *result* of the decision. If you report only the behavior, you have left the decision implicit in the code — which is exactly the "using code as a substitution for effective communication" failure. The user cannot evaluate whether the user agrees with a decision the user can't see.

**The rule:** for each non-trivial change in a batch, you must surface the decision *as a decision* and translate it to its semantic meaning — what was chosen, what the alternatives were, and *why this one*, in terms a person understands. Never leave the decision sitting inside the code for the reader to reverse-engineer.

### The distinction, concretely

- **Behavior (necessary but not sufficient):** "When the kill-switch holds any value other than `false`, `"false"`, `"0"`, or `0`, the email routes to admin instead of the user."
- **Decision, translated (what was missing):** "We decided the *only* thing that counts as 'safe to send to a real person' is an explicit, unambiguous off — and that every other possible value, including a half-set or garbled one, resolves toward *holding the email*, never sending it. The alternative was to treat 'not exactly on' as 'send,' which would mean a typo or a schema cast could leak a live email to a customer. We chose the direction where the failure is always 'too cautious,' because the cost of the other direction is a real person getting an email we never reviewed."

The second one is the decision. It names the fork, the rejected alternative, and the value judgment that settled it — all in human terms. That is what must not be left out.

### How to do it

For each batch, after the behavior statements, walk the **decisions** the diff embodies. A decision is present wherever the code could reasonably have done otherwise:
- A chosen **default or fallback** (what happens when nothing is set / something fails) — and why that direction.
- A chosen **threshold or set of accepted values** (why exactly these, why not looser/tighter).
- A chosen **ordering** (why this step before that one, and what the ordering costs or buys).
- A chosen **scope** (why this set of cases is handled and that set is deliberately not).
- A chosen **tradeoff** (what was accepted as a cost in exchange for what benefit).

For each, write one synthesized statement: *what was chosen, what it was chosen over, and why — in semantic meaning, with the code as the anchor, never as the substitute.* Same voice rules as the rest of the skill: intent leads, code rides inside as the precision anchor.

A decision you report as only its outcome has failed this section. The reader should finish a batch knowing not just what it does, but every judgment call that went into it and whether the user would have made the same call.

## Rules

- **Never skip the numbered list.** The list IS the sanity check. Without it you're just narrating.
- **Each line reconstructs the USER'S INTENT — never validates the agent's steps (the user's correction, 2026-07-08, second correction same day).** A line like "your approval covered X" or "I was authorized to Y" is the wrong register: it asks the user to confirm the agent's permission trail, which the user cannot validate and which tells the user nothing about whether the agent understood WHY. The correct register: "if this work was aligned, your intent must precisely have been: when [reader/user condition], [intended outcome] so that [why it matters]" — a statement the user can instantly recognize as the user's own intent or reject. The user verbatim: "This is not a step for determining whether or not the steps you took were correct. This is a step for determining whether or not your read on my intent [is] in fact my intent." The teaching example (Attempt 3, below) was always in this register; action-validation lines are the drift to guard against.
- **ONE assumption per numbered line — never bundle (the user's correction, 2026-07-08).** A numbered item containing two or more separately-falsifiable claims cannot be validated by number: the user can't say "3 is false" when 3 holds four assumptions. If a drafted item joins two falsifiable claims (watch for "and," "so," "plus," "which means"), split it into separate numbered lines. The user verbatim: "the entire purpose of this is for you to articulate assumptions clearly so that I can validate if any of them are false to create alignment so you cannot just create bulky paragraphs that contain multiple assumptions." Paragraphs that *allude* to assumptions while narrating work are the failure mode; the atomic list is the contract.
- **Never reference an internal label without carrying its meaning (same correction).** "Issue 6," "the source document," "the gate" mean nothing to a cold reader. If a line needs a label, the line also states what the label refers to in plain terms, inline. The user verbatim: "issue six having a source document. I have no idea what that means."
- **Never use technical jargon in the statements.** Translate everything through `/speak-human`.
- **Never assume correctness.** If a diff looks odd or a file seems unrelated, flag it — "This file changed but I'm not sure why: [filename]".
- **Always wait for human confirmation** before acting on the list (committing, proceeding, etc.).
- **If reviewing uncommitted files**, check for accidental changes — files that shouldn't be in the diff, debug code left in, env files staged.

---

## Teaching example — code-rephrase vs intent contract

This section captures a live correction cycle from a real sanity-check session (2026-05-11 / 2026-05-12, three-repo staging→main review). It walks through three agent attempts at translating one assertion, the user's verbatim feedback after each attempt, the comment about how to apply that feedback, and ends with the corrected version that the user accepted. Every agent invoking /sanity-check should read this before producing output and aspire to land on the third version on the first try.

### Attempt 1 — WRONG (code-rephrase as intent)

> 1. The admin intends that `trial.used = true` means **the trial has been STARTED**, not "the trial has been consumed/expired." (Restores [month year] / [date range] golden-window semantics.)

### Why this was wrong (the user's reasoning, verbatim)

> "This is not a correct sanity check all of this context is required, but the actual programmatic things that you're referencing here actually translate to an intended UX statement
>
> A UX statement would be a set of conditions that true would result in an intended UX system, as managed by a specific manager or function or controller
>
> When X then Y should Z so that A
>
> X is the actual exact conditions (. not code, actual human step conditions )
> Y is the actual system in charge of this the manager of it
> Z is the actual programmatic switch or control or function name in parens outside of the semantic meaning or translation of that
> so that A is the actual intended ux experience in the context of that when statement that's intended
>
> When completely translated, it still has all the details that this has [Attempt 1] but as reference, it actually primarily documents the intent, these programmatic things are left as the connection between the code and the intended ux and conditions."

### How to apply this feedback to arrive at the next attempt

The intent must *lead* the statement. The code symbol (`trial.used`) must NOT be the subject of the sentence — it should appear only as a precision anchor inside parens after the intent has already been stated in plain human conditions. The structure to use: **When [exact human-step conditions] then [the actual system/manager in charge of this] should [the actual programmatic control or function name in parens, after the semantic meaning] so that [the intended UX experience]**. The translated statement must still carry every detail from Attempt 1 — no detail dropped — but the primary thing it documents is the *intent*, not the code.

### Attempt 2 — also wrong (invented placeholders, missed the conversational shape)

> 1. When a brand-new Beta 19 user has begun their free trial within the last 7 days, the app's access-tier system (the manager that decides what each user can see and do, controlled by `isUserOnLegacyTrial()` in `<api-repo>/resolvers/legacy_trial/isUserOnLegacyTrial.js` and `<frontend-repo>/src/utilities/isUserOnTrial.js`) should treat them as actively on their legacy free trial (the function returns `true` only when the `trial[]` entry's `.used` field is `true` **AND** today's date is inside the 7-day window from `.startDate`), so that they get full coaching access for the duration of that 7-day window — which restores the [month year] / [date range] conversion behavior where a much higher share of trial-starters converted to paid before the inverted predicate broke it down to a fraction of that.

### Why this was wrong (the user's reasoning, verbatim)

> "more like this - see all caps for variable placeholders.
>
> When any user that does not get bucketed into a LIMITED_ACCESS or FULL_ACCESS state ( not paying or on a cc trial ) is accessing the app.  We are going to check if they are qualified for a legacy 7 day trial.
>
> Our intent is that they would be given one unless they are disqualified, which would be determined by them actually having already had one.  So effectively, the intent is, if you have not had a trial, and you're not already getting access by some other means, then we give you a legacy trial.
>
> We use VARIABLE set to VALUE to measure and check this in the SYSTEM/FUNCTION NAME
>
> There's a couple of conditions to this that are intended.  For example, we designed this for only brand new users, but it's also the fall back bucket for anyone who does not get caught by another bucket.  Now this will effectively label them as VALUE in the SYSTEM IN CHARGE OF THIS
>
> and if they don't qualify our intent is that they land in the next bucket, called FREE_ACCESS so that there is some bucket defined for everyone."

### How to apply this feedback to arrive at the next attempt

Two distinct corrections:

**First** — the shape is conversational, not declarative. A sanity-check intent statement is a **walkthrough of the bucketing/qualification logic as a whole**, not a single dense sentence. It names the upstream buckets (LIMITED_ACCESS, FULL_ACCESS), names the qualification check, names the exceptions and fallbacks, and names what happens to users who don't qualify (FREE_ACCESS). The reader follows the logic top-to-bottom in plain conversation. Variable names and function references appear *inline where they connect*, not as a parenthetical aside about implementation.

**Second** — when the user writes ALL CAPS in a template like "we use VARIABLE set to VALUE in SYSTEM/FUNCTION NAME," those are **placeholders the agent must resolve to the actual real values from the code** before writing the final output. The agent must NOT keep the ALL CAPS in the output as some pseudo-variable like `THE_USER'S_HISTORY_OF_TRIALS`. The agent looks up the actual field name (`.used`), the actual value (`true`), the actual function name (`isUserOnLegacyTrial()`), and writes those real strings into the prose. ALL CAPS survives in the final output ONLY when it refers to a literal constant name in the code (like LIMITED_ACCESS, FULL_ACCESS, FREE_ACCESS — which are real tier-name constants in `accessTiers.js`).

### Attempt 3 — CORRECT (the user accepted with "yea that's correct")

> When any user who does not get bucketed into LIMITED_ACCESS or FULL_ACCESS (so, not a paying member, and not on a credit-card-on-file trial) opens the app, we are going to check whether they qualify for a legacy 7-day free trial.
>
> Our intent is that they would get one — unless they are disqualified by already having had one. So effectively, the intent is: if you have not had a trial, and you are not already getting access by some other means, then we give you a legacy trial.
>
> We use `.used` set to `true` to measure and check this inside `isUserOnLegacyTrial()`, the single resolver that answers this question for both backend and frontend (lives at `<api-repo>/resolvers/legacy_trial/isUserOnLegacyTrial.js`, mirrored in `<frontend-repo>/src/utilities/isUserOnTrial.js`).
>
> There are a couple of conditions to this that are intended. For example, we designed this for brand new Beta 19 users, but it's also the fallback bucket for anyone who does not get caught by another tier. Now this will effectively label them as `isOnLegacyTrial: true` in the access-tier system (the manager in charge of deciding what each user can see and do, controlled at `config/accessTiers.js:1130` on the backend, surfaced through `useSimulatedUserState` on the frontend).
>
> And if they don't qualify, our intent is that they land in the next bucket, called FREE_ACCESS, so that there is some bucket defined for everyone.
>
> The reason this assertion matters right now: today on `main`, the predicate is inverted. `if (trial.used) continue;` skips trials where `.used` is `true`, which is exactly backwards — `.used = true` means the trial has been STARTED, not that it's been exhausted. So every brand new Beta 19 user who actually starts a trial instantly drops out of the legacy-trial bucket the moment they start it. This staging branch flips the predicate to `if (!entry?.used) continue;` which is the correct meaning. Promoting this restores the conversion behavior from [month year] / [date range] where a much higher share of trial-starters converted to paid, before this bug knocked it down to a fraction of that.

### Instructions for agents invoking this skill

When you are about to use /sanity-check, you should review the three attempts above and understand what perfect looks like and why, and aspire to do this perfectly based on Attempt 3 as your model.

Notice that in Attempt 3, the things the user would be confused about when trying to read the sanity check are **predicted and unpacked** so that the actual logic of the admin that must be true if the code is correct is clearly legible in a way the user would actually read. The walkthrough names the upstream buckets the user is NOT in, the qualification logic, the exception (brand-new users vs fallback bucket), the downstream bucket (FREE_ACCESS), AND the historical context (the bug on `main`, the inverted predicate, the conversion regression) — all in conversation, all with real values resolved, all with code anchors only where they earn their place.

A reader who has never seen this code should be able to read Attempt 3 cold, understand exactly what the admin must intend, and be able to `grep` the codebase for the named functions/fields/files to verify. That is the target every sanity-check statement aspires to.

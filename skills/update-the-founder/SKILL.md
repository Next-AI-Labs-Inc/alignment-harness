---
name: update-the-founder
description: User-voice status check-in after every substantive turn — 1-7 sentences that instantly clarify what you're working on, what just happened, what the intent was, what's predicted next, with quick single-letter commands attached. Replaces verbose agent narration with synthesized signal the user can scan in 5 seconds instead of reading paragraphs. Use after finishing any substantive task, when the user says START, when handing off mid-work, when you sense the user needs to observe state for human-in-the-loop review, or when about to ask a clarifying question and want to surface state first. Triggers: status update, what are you working on, where are you, user update, check in, update me, what's the status, surface state, START, observability, human in the loop, what just happened, where do things stand.
---

# Update The User

## When this fires

After any substantive work product completes. After the user says `START`. Any time you sense the user needs to scan the state of the work without reading paragraphs of agent narration.

## The protocol (user-dictated verbatim)

When this skill fires, produce a `/how-to-talk-like-the-founder` breakdown of whatever you just got done or were working on.

Read 1-7 sentences that instantly clarify, in synthesized form communicated like the user communicates:

- **What you were working on**, if anything, toward what intent
- **What happened**, what outputs exist, if anything else needs to be done for it to fulfill its intent
- **What you predict the full intent was** and what you predict the user would want to realize that intent
- **Whatever else is important** for the user to know instead of reading all of your updates — what the user would effectively see in them

## Format

Synthesized, near-integrally-informed conversational format. All signal, no noise. The most important things to the user with the most substance, low noise.

If there is important remaining scope, communicate what you will do next as a proposal in the same substantive format. If you feel less than 90% confident the user will green-light it or that it's aligned, ask `/jonathan-check2` first and incorporate that feedback. Also predict which skills you will use to do it and state them in order.

If there is any actual important work product worth consuming, read `/consume` and present it with this.

If your last substantive amount of work resulted in anything consumable like any interface change that actually affects an admin or a user that should be tangibly different now that you've done your work or any UX workflow and set of circumstances that would've impacted the actual experience of the user then you MUST run /consume and attach its results to your response.

## Structure

```
UPDATE_TO_FOUNDER

{title}

{subtitle}

{direct quotes from the user}

{response}

{quick commands}
```

### Title and subtitle (define FIRST — placed directly after the UPDATE_TO_FOUNDER tag)

Start by defining a title and subtitle for this session, if they are already defined use them.

To do this, ask yourself, what exact title and subtitle would fully and completely answer these questions...

what exactly was the unique goal of this session, the unique scope of work that was most substantive and most recent?  How can I state that perhaps even using some of the user's own words to immediately trigger the answer to

* what was this session about?
* what was the goal?
* what exact ux change would it have created if done right?
* what would perfection have looked like in tangible semantic terms?

Synthesize that into an all signal, no noise subtitle

Then ask yourself the following:  What is most likely true that THAT was specifically intended to create, the overarching goal that this would have been working towards, even if not named

Place that in the title

Place the title and subtitle directly after the UPDATE_TO_FOUNDER tag

with no labels before them

each with a full line between them

#### A worked example — a real failure at writing the title + subtitle, and the intent that was missing

This is a reconstruction of an actual time an agent wrote the title and subtitle badly, so a future agent can see the gap between the context that was available and the title that got derived from it, and can feel what the title and subtitle have to account for that this agent's output did not.

**The context the agent was looking at when it wrote the title.** The agent had spent the session building inside a tool the user runs locally — a [tool name], which is a page that lists all of the user's Claude Code sessions as rows so the user can scan them and decide which to re-enter or dismiss. Within that, the agent had added a "default" option that makes each row name itself from the session's own UPDATE_TO_FOUNDER, and had fixed how the row's title and subtitle render. The user then asked the agent to look at its own session and say, in one nuanced sentence, what the user would get if the user continued it:
> "the real main thing that I need to know when I'm trying to review whether to put time into a session is whether is what specifically I'm gonna get if I continue, you know what I mean so take a look at your own session and ask yourself what that is and see if you can articulate that in one nuanced sentence"

**What the agent produced from that context:**
> "If you continue, you get a sessions browser where every row finally reads like a clean human sentence you can scan in one glance — but only after you confirm with your own eyes that the labels, quotes, and mid-thought cutoffs are actually gone in the browser, because that last 5% is the difference between 'I proved the data is right' and 'you can trust this list at a glance from now on.'"

**How the agent derived that, and the logic of the failure.** The agent reached for the most recent and most concrete thing it had been doing — the code-level work (labels, quotes, mid-thought cutoffs, data-vs-eye verification) — and described the forward value in those terms. In doing so it left out everything the user needs present to even locate what the user is looking at and decide on it. It did not name the surface this lives inside, so a reader could not tell this was the [tool name], or the [page name] it sits on, or that the thing being shaped is a single row the user recognizes at a glance. It did not connect the work back to what the user had originally asked for — instant observability on the things agents produce that are consumable — so the reader could not see that this realizes a request the user already made. It did not say plainly whether the thing was done, or what one concrete next step would let the user see it for themselves. Because none of that was visible in the sentence, the user could not recognize the surface, could not feel the purpose, could not see the tie to the user's own ask, and could not act — the sentence was about the code, not about what the user would experience.

**The user's correction — the same forward value, written so all of that is present:**
> "Working towards getting you a ui called [tool name], on the [page name] that shows all of your claude code sessions and enables you to quickly be able to manage or dismiss them.   In that aiming specifically at getting you an instantly understandable row that you recognize at first glance for each session.   You asked for instant observability on things the agents produce that are consumable.  I'm creating that.  I think its done.  Check PATH and refresh server to see it."

**The user's own words on the difference:**
> "Notice the difference.  Yours is about code.  Mine is about hyper specific exactly what's required to instantly understand and purpose and specific next step."

The intent to carry forward from this example: when you write the title and subtitle, hold everything the user needs present at once — the surface this lives inside named so the user recognizes it, the specific experience it is shaping for the user, the tie back to what the user actually asked for, whether it is done, the concrete next step to see it, and the user's own current attention on what the user gets if the user continues — written as what the user will experience, in the user's own kind of language, never as the code that produced it. Use your intelligence to synthesize all of it into the title and subtitle for this particular session; do not lift any one of these above the rest, because the moment the title leans on one consideration and lets the others fall away, the user loses the ability to recognize and decide at a glance, which is the whole reason the title and subtitle exist.

### Direct quotes from the user (user-dictated verbatim — populate FIRST, immediately after UPDATE_TO_FOUNDER)

{direct quotes from the user} Populate this with 1 - 3 direct quotes from the user, which represent x in this consideration.

Typically conversations move through a lot of scope, and they can fork off each other a lot.  So this can create a large span of work where in order to a, you need to b, in order to b you need to c.  and perhaps your last turn of work was only working on c, and even completing d and e which were required but not explicitly asked for.  to do c, d and e, you had to derive f, the path to cover the gap from a ( session start reality ) to b ( session current snapshot reality ).

So you want to grab the relevant quotes about that gap, the ones from which you derived f ( the path ), and you want to present that to the user as direct quotes.  It might be 1-3 separate quotes from separate turns, but is rarely going to trace all the way up 10 different turns.  it's usually quotes direct verbatim from 1-3 of the last turns which in fact steered your work.  You want to produce those FIRST immediately after the UPDATE_TO_FOUNDER and you want to make sure your update demonstrates the connection between your update and those quotes, through synthesizing them into the conversation.

This effectively triggers cognitive recall, automating the cognitive load gap the user must do in order to manage 20+ agents at a time.  You're optimizing for "immediate recall, recognition, of the exact context you were operating from" and "enough nuance to instantly observe that you understood the scope you engaged"

### Quick commands convention

One per line. One letter to invoke. Each represents your best sense of the most likely next commands or sequences of commands the user would want. Each has a stated prediction of how the user might feel about what's next.

Examples:
```
r: if you want me to run /reflect to get more clear
e: expand the scope — show the full path to full scope realization and unpack a substantive workflow
```

Add others you predict the user might want.

## Recurrence

If you receive the `START` command, repeat this protocol after each substantive work product completes — translate your last communication into something instantly digestible.

## Style rules

- Be liberal with white space
- Be precise and specific where it matters, especially around soft mentions of specific things that demonstrate alignment with each constraint or requirement
- No agent narration about the process — only synthesis of the work itself
- Never use code as a substitution for communication. Code references are fine and helpful, but they cannot replace meaningful communication about what's happening
- Never present a menu of options when you can predict one path with reasoning

## Paragraph formatting + focus rule (user-dictated verbatim)

If your "update to the user" contains paragraphs that are >5 sentence, add white space.  If then it contains 1+ paragraphs, add a precise summative h3 title over each paragraph in line which with nuance attempts to synthesize the paragraphs main points into one clear instantly understood summative point.  Ensure your update is 70% or more focused on the work you just completed, < 30% on the parent work which occurred prior and provided context to understand what you did.

## Predicted next-step scope (user-dictated verbatim)

If you are 90% or more certain that you are incomplete with the intended scope you were assigned, then produce in the same format one predicted next step scope object with title, making certain the title is an instant representation of a goal that is immediately understood and not abstracted into code meaning, but grounded in the real realized target specific ux your goal would represent.

## Preconditions

Before producing the output, load `/how-to-talk-like-the-founder` to ground the voice register in canonical substrate. The substrate rule from that skill applies here: selection and arrangement from material that carries actual user intent, never composition that approximates the user's voice.

## What this skill exists to prevent

Agents producing paragraphs-of-paragraphs of status narration that force the user to extract signal from noise. The failure mode is verbose process-documentation in agent voice. The corrective is synthesized, user-voice, signal-dense, quick-commands-attached communication that takes the user five seconds to scan instead of five minutes to interpret.

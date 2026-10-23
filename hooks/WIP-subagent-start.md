# Not yet built: a fresh risk check for each helper you hand work to

## The target

When you hand a piece of work off to a helper working on its own, that helper should be told, before it changes anything, how much could go wrong with the specific task it was just given and who it could affect — a real judgment made for that task, not a number left over from something else you were doing earlier in the session.

## What happens today instead

Right now, a helper is only shown a risk assessment if one was already made earlier in the same conversation, for whatever the main work was at the time. If nothing was assessed yet, or if the helper's task is different in kind from what came before it (for example, the main conversation was about writing documentation and the helper is asked to touch a payment flow), the helper starts its work with no risk signal specific to what it's actually about to do.

## What would close the gap

A fresh, real judgment of the helper's specific task, made the moment it's handed off — not reused from earlier, and not guessed. That means actually evaluating the task's own words (what it's asking for, what it could touch, who could be affected) right when the handoff happens, so a helper working unsupervised treats something risky with the caution it deserves, even when the risk has nothing to do with what the rest of the session was doing.

## How it's checked

`plugin/hooks/subagent-start.js` (the `SubagentStart` hook) currently reads an existing session-level score if one is already on record and shows it to the new helper; it does not call any scoring step of its own for the helper's specific task text.

# End of turn: the hand-back, corrections and requirements

## What it's for
A turn that did real work should end with the person able to see it in seconds: how to look at it, what changed for people, what's unfinished. This is a reminder, never a block: nothing waits on it. Text a hook prints when the agent stops never reaches the model, so when a turn did real work and the agent hasn't handed it back, the reminder is saved and put in front of the agent at the start of its next turn (/on-turn-end routes to /complete-agentic-task, /consume, /gap + /propose, /ask or /calibrate). The same reminder:
- flags requirements the person stated ("I want…", "it should…") that got no tracked task;
- puts the person's standing corrections that match this turn in front of the agent (see below).

"Real work" means: a scored task above `turnEnd.scoreAbove` (40) with any tool use, or an unscored task that edited files. How much hand-back is asked for follows the score.

## Correction patterns
When the person corrects the agent the same way more than once, that becomes a standing directive: `alignment-harness correction add --label "…" --trigger "phrase|phrase" --directive "…"`. Each repeat adds evidence; at `correctionPatterns.activateAtEvidence` (3) it becomes active (or `correction activate <id>` by hand). At the end of a turn, active patterns whose trigger phrases appear in the person's message or the agent's reply are shown to the agent (up to 3). At session end, likely corrections in the person's own messages are saved as candidates to review: `alignment-harness store list correction-candidates`.

## Is it set up / how to tune it
On by default. Switches: `turnEnd.enabled`, `turnEnd.strength` (`remind`/`off`; the old `block-once` means the same as `remind`), `turnEnd.scoreAbove`, `turnEnd.requirementCapture`, `correctionPatterns.*`.

## Is it working?
Local log events `TurnEndReminderSaved`, `TurnEndReminderShown`, `TurnEndPass` and `CorrectionPatternFired`. `alignment-harness correction list` shows every pattern with its evidence count and status.

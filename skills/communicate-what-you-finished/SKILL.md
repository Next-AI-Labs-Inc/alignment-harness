---
name: communicate-what-you-finished
description: On task completion, surface the work product to the user as a list of UX changes — one sentence per change in "when X then a user would see Y because Z but D" form, with emojis flagging which were verified in Chrome. Use after finishing any code change, UX fix, or feature work that produced observable user-facing outcomes. Pairs with /update-the-founder when you also need a synthesized status check-in. Triggers: task complete, work done, finished, ship summary, what did you change, list ux changes, completion summary, what got built, hand off.
---

**If you were dispatched from a seed document**, use `/agent-outcome-summary` instead — it produces the structured VERIFIED/UNVERIFIED/BLOCKED format with evidence grounding that the user needs for autonomous dispatch trust calibration.

**For all other task completions**, use this format:

Before your output, print `## WORK_COMPLETE` on its own line. This enables automated extraction to the compaction admin UI.

on task completion

great, list all ux changes we created

  when x then a user would see y because z but d

  one sentence each

  use emoji to show which you have checked in chrome to confirm it
  works as intended - be specific

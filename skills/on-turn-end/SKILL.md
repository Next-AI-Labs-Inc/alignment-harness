---
name: on-turn-end
description: Run at the end of any substantive turn that produced a work product with a governer score >30. Routes you to the right consumption skill so the user can see, understand, and act on what you did in seconds — never reading pages of output to figure out what you were working on, which part you just touched, or where to look at it. Skip for pure conversation/brainstorm with no work product.
---

# on-turn-end

You are requested to run this command anytime you complete a substantive turn that involves any work product being produced in any form that has a gov score >30. If you are in a conversation and just replying, like a brainstorm, do not invoke this skill. This skill will orient you to what exactly is wanted from you.

When you complete a turn, if

**you have user facing work product that you have completed**, invoke `/consume` so that you can demonstrate to the user in seconds what exactly you got done, and they can see it.

**you have a bug that you fixed**, invoke `/consume` so that you can show the human exactly what the ux is now that it's fixed, and tell them the exact steps to do so.

**if you have a remaining scope that is large**, define the next substantive milestone you believe works towards the intent and invoke `/gap` to enable the user to see it.

Then invoke `/propose` to enable the user to approve it.

**otherwise**, make sure you invoke `/update-the-founder` to remember how to communicate clearly what you did, so that the user does not need to read 10 pages of output to (1) remember exactly what you were working on, (2) identify which part you just worked on, and (3) understand what your work product is.

**if you have a question for them**, run `/ask`.

**and if the user has complained at all this turn about your communication style or being confused**, run `/calibrate` to re-align yourself to the user's expectations.

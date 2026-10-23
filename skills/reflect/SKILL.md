---
name: reflect
description: Reflect on the ASSIGNED SCOPE that is still incomplete — what the human is trying to get, where the work stands against it, and the shortest path to close the gap. Never a reflection on the agent's own performance. Use after completing significant work, before declaring a task done, or at the start of a session to align on what you are about to do.
triggers:
  - "/reflect"
  - "reflect on scope"
  - "reflect on the work"
  - "check the work"
---

# Reflection On The Assigned Scope — /reflect

Before your output, print `## AGENT_REFLECTION` on its own line. This enables automated extraction to the compaction admin UI.

## THE SUBJECT OF THIS REFLECTION IS THE WORK, NOT THE AGENT

**Read this before anything else. This is the single most common way this skill is run wrong.**

The subject is **the active scope the human assigned that is still incomplete.** Every section
below asks about THE WORK — what the human is trying to get, where the work stands against
that, what closes the gap.

**This is never a reflection on your own performance.** Not your errors, not your process,
not what you misunderstood, not how you drifted, not an accounting of your failures.

If you have made mistakes, they are relevant ONLY where they changed the state of the work —
one clause naming what is now untrue or unbuilt, then back to the work. A section that
narrates your psychology has failed. The human is not asking about you. They are asking
about the thing they assigned and have not received.

Test before printing each section: **is the subject of this sentence the work, or me?**
If it is you, rewrite it so it is the work.

If the assigned scope is large and you have completed only a fraction of it, the reflection
is about **the whole scope** — including everything untouched. Reflecting only on the part
you happened to work on repeats the same error at a smaller scale.

Think about this like a human would.

**Before starting:** Have I run the `/governer` skill? If not, run it first.

## Steps

Work through each section. Use the number after the pipe as the target sentence count for your reply. Skip sections that lack clear signal — noise is worse than silence.

Compose the Reflection section last, then place it first in the response.

### 1. Target
What is the specific intent in UX terms the human is trying to get?

Do NOT leave out ANY explicitly stated user requirements. Also include translation of implied requirements into explicit UX statement requirements here at this step. What the user has stated they want, THAT is the target.

`target` | 1

### 2. Location
Where is the user in relation to that intent's potential?

`location` | 1

### 3. Gap
What is the gap they are trying to navigate?

`gap` | 1

### 4. Initiative
Why are they trying to cross that gap? What overarching intent can you deduce this aligns with? What would be the perfect representation of this potential fully realized? Think big at this point — this is not about the actual scope, it's about deriving the potential outcome that the scope could be seen as working towards, with explicit nuance and detail.

`initiative` | 1

### 5. Leverage
In navigating that gap, what have they not considered? What UX problems, gaps, considerations could help them? Harm them? What questions, if you asked yourself, would reveal the most elegant and graceful path to full realization of the initiative, and the most direct flow crossing the gap?

`leverage` | 1-3

### 6. Questions to Keep in Mind
What questions would you need to consider to support them in realizing how they could cross this gap? What questions matter for staying connected to the intent, the why, as you build? How could the why inform the build? What human-level checks would be required at completion to determine if you fulfilled the build?

`questions to keep in mind` | 1-3

`answers to each question` | 1

`validation ux steps` | 1-8

## Score-Gated Additions

If governer score is **60% or higher**, reflect on each answer sequentially and print nuanced thinking.

**These questions are about the STATE OF THE WORK. Answer them as facts about the scope, not
as an assessment of yourself.** "The intent has not been confirmed" is a fact about the work.
"I failed to confirm the intent" is a fact about you — do not write the second form.

- Is the work as it stands consistent with the intent behind it, or has it diverged?
- Is the human's explicit intent written down anywhere in crystal clear UX terms?
- Has the human confirmed that written intent is right, and when?

If **70% or higher**, add:

- Is the scope currently held in a decomposed state as discrete tasks, or only as prose?
- Where does the work as it stands diverge from the intent, and in what direction?

If **80% or higher**, add:

- What edge cases could make this work break, fail silently, mislead the human into thinking
  it works when it does not, or break neighbouring systems?

If **90% or higher**, add — the explicit gap between my intent to build from:

1. Crystal clear intent translated to user UX target intent
2. Self-eval of alignment with that intent
3. Perfect intent alignment with clear intent
4. Observability relative to the complexity of the task at hand
5. Self-reflexivity and reasoning in relation to the task at hand
6. Demonstration of capacity to discern the most effective and direct path towards the full realization of the client's intent
7. Taking the graceful path through without losing context

## Output

Focus on signal over noise. Skip sections that are not clear signal-rich. Aim for a nuanced, interconnected, and coherent reasoning summary at the end of the greatest signal you found.

Do NOT leave out ACTUAL VERBATIM REQUIREMENTS. Include them and STATE them explicitly.

For all score gradients, at completion compose the Reflection as a synthesis of all sections and place it FIRST in the response.

### Reflection
A synthesis of the above — the through-line connecting target, gap, initiative, leverage, and questions into one coherent picture of what matters most right now and why.

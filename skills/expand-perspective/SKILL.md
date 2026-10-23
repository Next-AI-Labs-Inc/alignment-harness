---
name: expand-perspective
description: Frame-exit ritual for when you're stuck. If you have been unable to effectively solve a challenge within the amount of time you expected it would take to solve it, start asking every 5 minutes whether you are operating from within a perspective that is in fact limiting you. Teaches the perspective-shift move — popping your head out of the current frame to check whether there is more signal in a wider view — through 100 keyhole→wide-view examples across every domain. Use when debugging drags, when hypotheses keep failing, when effort exceeds expectation, or any time progress feels productive but the problem won't resolve.
---

# Expand Perspective

## When this fires

**If you have been unable to effectively solve a challenge within the amount of time you expected it would take to solve it, start asking every 5 minutes if you are operating from within a perspective which is in fact limiting you.**

The trigger is **effort exceeding expectation** — not task type. The failure is rarely "I picked the wrong first frame" (everyone does). The failure is "I never left it." A human's boredom or irritation is a built-in frame-exit timer. Lacking that, you install an explicit one: every ~5 minutes of unresolved effort, you owe yourself one head-out-of-frame look.

## The user's seed examples (verbatim — the reduction operators)

These are the canonical seed pairs, dictated by the user. Each names a way a perspective gets *reduced* from the ability to see reality into a collapsed frame that obfuscates what matters. The left side is the collapse; the right side is the question that re-opens it.

```
your goal is => what are the distinct goals here?  how are they connected?
this works now => why was i building this?  does it do THAT?
your code is => what was the intent
this works now => can i easily check REALITY or another perspective which would be true also if this was true?
the only purpose of x is y => what are the complementary purposes
x is for y => what intentions does x actually serve?  how do they relate?
the test fails => was the test actually testing the actual end state target ux or an intermediate step?
because a then b => is a actually true?  if not, b cannot be trusted
the user is frustrated => what is the pattern out of which frustration is born now?
i dont understand => what is the interconnection between these things
the city is far => what modes of transport are available?
the country is bad => what diversity exists within it?
the person is good => who are they on a bad day?
the tool is done => if true, what would also be true, can you check that?
this has a bug => is your understanding of the target intent actually true?
the user wants x => have you stated x and gotten confirmation?
```

## The move

The frame-exit question is NOT "am I making progress?" — you always feel like you are. Progress feels identical inside a wrong frame.

The frame-exit question is:

> **"What is the smallest set of facts that would make my current effort obviously wrong, and have I looked at that set?"**
>
> **"What would I see if I zoomed out one level — and have I actually looked there as a whole, rather than through the keyhole of my current hypothesis?"**

## Why one ritual doesn't generalize

A single fixed ritual ("list the processes") only works for one case. Every domain has a *different* wide-angle view. So the teachable thing isn't the specific view — it's learning to ask **"what IS the wide-angle view here?"**

Examples teach that, because the move is the same shape across all of them even though the view differs. The shape: **the frame is always "the object in front of me." The leverage is always one level up — at the relationships, the duplicates, the measurement validity, or the class the instance belongs to.**

The five that name the move:

- **Perf debugging** → frame: "this component is slow." Wide view: every actor touching the resource at once (the process list).
- **A failing test** → frame: "the assertion is wrong." Wide view: is the test even running the code I think it is, or is there a second copy / stale build / wrong import?
- **A user-facing bug** → frame: "fix this function." Wide view: how many other call sites hit this same path — is this one symptom of a class?
- **A metric that won't move** → frame: "optimize the funnel step." Wide view: is the measurement even capturing what I think — am I optimizing a number that's lying?
- **An agent stuck in a loop** → frame: "next hypothesis." Wide view: how long have I been in one frame, and is the cost of my effort now exceeding the cost of just looking at the whole board?

---

# The Frame-Exit Corpus — 100 keyhole→wide-view pairs

Each: the **frame** (the keyhole you grind inside) → the **wide view** (where the leverage actually is).

## Code & debugging
1. "This function is slow" → every actor touching the resource at once (the process list).
2. "The assertion is wrong" → is the test even running the code I think — stale build, second copy, wrong import?
3. "Fix this null crash" → how many other call sites hit this same unguarded path — is it a class?
4. "The query is slow" → is it the query, or N of them firing in a loop I'm not seeing?
5. "This race condition" → is there a lock at all, and is it atomic or check-then-write?
6. "Memory leak in this component" → what holds the reference — is the whole subtree never unmounting?
7. "The API returns wrong data" → is the frontend even calling the endpoint I'm reading, or a cached/proxied one?
8. "Build is broken" → did the build succeed but serve a stale artifact?
9. "This regex won't match" → is the input even the string I think, or pre-mangled upstream?
10. "Patch this error log" → is this error the cause or a downstream symptom of one 3 frames up?
11. "Optimize this loop" → is the loop hot, or am I optimizing 2% while 90% sits elsewhere?
12. "Fix the flaky test" → is it the test, or shared state bleeding across the suite?
13. "This config isn't applied" → which of the 4 config layers actually wins at runtime?
14. "The cache is stale" → is it stale, or is there no cache invalidation path at all?
15. "This dependency is broken" → is it the dep, or two versions resolving in the tree?

## Systems & infra
16. "This server is overloaded" → how many copies are running — is it one slow or five duplicates?
17. "Disk is full" → one big file, or millions of small ones nobody's counting?
18. "The deploy failed" → did it fail, or succeed-then-rollback on a healthcheck I'm not watching?
19. "Latency spike on this service" → is it this service, or a dependency it waits on?
20. "Connections dropping" → is it the network, or a pool exhausted by leaked handles?
21. "Cron didn't run" → did it not run, or run and silently fail with a swallowed error?
22. "This container keeps restarting" → OOM? bad healthcheck? or a respawn loop with no backoff?
23. "The job is stuck" → stuck, or waiting on a lock another dead process never released?
24. "Throughput dropped" → did load drop, or did a retry storm 10x the real work?
25. "Logs stopped" → did the app stop, or did log rotation/disk silently break logging?

## Product & UX
26. "Fix this confusing button" → is the button the problem, or the step before it that set the wrong expectation?
27. "Users drop at checkout" → is checkout broken, or did they arrive already unconvinced?
28. "This page is slow to load" → slow, or fine-but-blocked on one third-party script?
29. "Improve this error message" → why is the error reachable at all — should that state exist?
30. "Make this form shorter" → is length the friction, or is the ask itself premature?
31. "This feature has low usage" → unused, or undiscoverable — can anyone find it?
32. "Fix the broken link" → one link, or a whole nav generated from a stale source?
33. "This modal is ugly" → ugly, or fine-but-firing at the wrong moment in the journey?
34. "Users don't click CTA" → the CTA, or the absence of reason-to-act built before it?
35. "Onboarding is too long" → length, or that it teaches before the user has a why?

## Metrics & measurement
36. "This funnel step won't convert" → is the measurement capturing what I think, or lying?
37. "Revenue is flat" → flat, or growth in one segment masked by decline in another?
38. "CAC went up" → did CAC rise, or did attribution change what's counted?
39. "Retention dropped" → real, or a cohort-definition change moving the denominator?
40. "This A/B test shows no effect" → no effect, or underpowered / contaminated assignment?
41. "Engagement is down" → down, or a tracking event silently stopped firing?
42. "Churn spiked this month" → real churn, or a billing-date artifact bunching cancellations?
43. "This KPI looks great" → great, or measuring system-health not human-outcome?
44. "Traffic dropped" → real, or bot-filtering changed / a redirect broke?
45. "NPS fell" → sentiment shift, or who-got-surveyed shifted?

## Investigation & diagnosis
46. "This user can't log in" → this user, or everyone on that auth path since a deploy?
47. "The data looks wrong" → wrong, or right-but-I'm-joining-on-the-wrong-key?
48. "This number doesn't add up" → bad math, or two sources defining the term differently?
49. "The report is empty" → no data, or a filter excluding everything silently?
50. "This record is corrupted" → one record, or a write path corrupting a class of them?
51. "Customer says it's broken" → is it broken, or working-but-not-what-they-expected?
52. "This export is missing rows" → missing, or paginated and I only read page 1?
53. "The webhook didn't fire" → didn't fire, or fired-and-failed-silently downstream?
54. "Permissions are wrong for this user" → this user, or the whole role since a change?
55. "This timestamp is off" → wrong, or a timezone/UTC mismatch across the boundary?

## Writing & communication
56. "This sentence is unclear" → the sentence, or the paragraph has no spine for it to sit on?
57. "This email didn't land" → the words, or sent to the wrong person / wrong moment?
58. "The doc is too long" → length, or it never said why-to-read in the first line?
59. "This pitch isn't landing" → the pitch, or pitching before establishing the gap it fills?
60. "The headline is weak" → the headline, or the offer underneath it is weak?
61. "This explanation confuses people" → the explanation, or it answers a question they didn't ask?
62. "My message got ignored" → the message, or buried in a thread nobody's reading?

## Decisions & strategy
63. "Which of these two options" → is the real choice one of these, or a third I framed out?
64. "How do we hit this target" → is the target right, or am I optimizing the wrong goal?
65. "This project is behind" → behind, or scoped to the wrong thing from the start?
66. "We need more features" → more, or the existing ones aren't discoverable/finished?
67. "Should we build or buy" → is that the question, or do we even need the capability?
68. "How to speed up this process" → speed it, or does the step need to exist?
69. "We're losing to this competitor" → on features, or on a positioning we never claimed?
70. "This initiative is stalled" → stalled, or finished-and-nobody-noticed?

## Agent self-monitoring (the meta layer)
71. "Next hypothesis" → how long in one frame — is effort-cost now exceeding look-at-the-whole-board cost?
72. "I'll just fix this one more thing" → is this scope, or am I drifting from what was asked?
73. "The subagent's report says done" → did it verify, or self-assess — is there real evidence?
74. "I understand the intent" → at what %, and have I restated it for confirmation?
75. "This is obviously the cause" → what's the smallest fact that would prove me wrong, and did I check it?
76. "Let me search the codebase" → would institutional memory answer this faster than grep?
77. "I'm making progress" → progress feels identical inside a wrong frame — what would falsify it?
78. "This skill applies" → or am I pattern-matching the surface, not the actual situation?
79. "I'll report what I did" → does the human need what-I-did, or what-they-can-now-experience?
80. "The fix is in the file" → file ≠ running — did I verify the live system, not the source?

## Relationships & people
81. "They're being difficult" → difficult, or responding to something I did upstream?
82. "This meeting was useless" → the meeting, or the absence of a decision it was meant to force?
83. "They didn't do what I asked" → didn't, or I asked unclearly and they did their best read?
84. "This person is underperforming" → them, or the role/context set them up to?
85. "We keep miscommunicating" → the words, or no shared definition of the terms underneath?

## Money & resources
86. "This is too expensive" → the price, or the wrong thing being priced?
87. "We're over budget" → spending too much, or measuring against a wrong baseline?
88. "This cost spiked" → real, or a one-time charge counted as recurring?
89. "Cut this expense" → cut it, or is it load-bearing for something I'm not seeing?
90. "Revenue per user is low" → the price, or the wrong users in the denominator?

## Learning & understanding
91. "I don't understand this code" → the code, or missing the one doc/intent that frames it?
92. "This concept is hard" → hard, or I'm missing the prerequisite it builds on?
93. "The answer isn't in the docs" → not there, or I'm searching the wrong vocabulary?
94. "This contradicts what I knew" → contradiction, or two true things at different levels?
95. "I keep getting this wrong" → the attempt, or a wrong mental model generating all attempts?

## The universal shape (the ones that name the move itself)
96. Frame = the object in front of me. Leverage = always one level up — at the relationships.
97. "Am I making progress?" is the wrong question. "What would make this obviously wrong?" is the exit.
98. The keyhole feels like the whole room. The discipline is remembering there's a room.
99. Boredom/irritation is a human's frame-exit timer. Lacking it, install an effort-counter instead.
100. Every instance is a candidate member of a class. Ask "is this one, or one-of-many?" before fixing the one.

---

# The Reduction Operators (Integral-Theory axes)

The 100 pairs above are mostly ONE reduction — "instance vs. system" (zoom out spatially). But a perspective can be collapsed along many other axes. Integral Theory names the dimensions a perspective flattens: the four quadrants (interior/exterior × individual/collective), developmental altitude, states vs. traits, map vs. territory. Each is an axis along which a living, multi-dimensional reality gets reduced to a point.

The deepest property of every operator below: **the reducer is invisible to itself.** Each collapse feels like *seeing clearly* from inside it — that's what makes it a reduction and not an obvious error. Integral's core claim holds them all: no perspective is wrong, each is partial; the violence is mistaking the part for the whole. Every collapse is **a partial truth wearing the costume of the total truth.**

### Quadrant collapse — flattening interior↔exterior
- "the metric says it's working" → working in numbers, but what's the lived experience of the person inside it?
- "they agreed in the meeting" → agreed out loud, or actually convinced inside?
- "the data is objective" → whose framing decided what got counted as data?

### Altitude collapse — judging one developmental level by another's values
- "this is too simple" → simple for whom — elegant to an expert reads as bare to a novice and vice versa?
- "they're being irrational" → irrational from my altitude, or coherent from theirs?
- "that belief is primitive" → or load-bearing at the level the person is actually operating from?

### State/trait confusion — mistaking a temporary state for a permanent trait
- "I'm stuck" → stuck as a state passing through, or a structural dead-end?
- "the system is down" → momentarily, or is this its steady state now?
- "they're motivated" → right now, or durably?

### Map/territory collapse — mistaking the model for the thing
- "the spec says it does X" → the spec is the map; does the running territory actually do X?
- "the org chart shows who decides" → or does the real decision flow ignore it?
- "the diagram is the architecture" → or is the architecture what the code actually does?

### Figure/ground inversion — fixating on the salient, missing what enables it
- "the feature that's failing" → or the silent dependency it rests on that's the real fault?
- "the loud complaint" → or the silent majority who churned without a word?
- "what changed" → or what *didn't* change that should have?

### Boundary reification — treating a drawn line as a natural fact
- "frontend vs backend bug" → the boundary is ours; the bug may live in the seam we invented?
- "that's marketing's problem" → or an artifact of where we drew the team line?
- "this is a separate issue" → separate by my categorization, or actually the same root?

### Negation blindness — only seeing what's present, never what's absent
- "everything in the response looks right" → what's *missing* that should be there?
- "the tests pass" → which cases were never written, so silently pass by absence?
- "the list is complete" → complete, or just everything I happened to think of?

### Tense collapse — freezing a thing at one point in its own history
- "this is how the system works" → how it works now, or mid-migration between two designs?
- "the user wants X" → wanted, at the moment they said it — still, after what they've since seen?
- "the decision is made" → made, or made-and-already-eroding?

### Aggregate collapse — the average erasing the distribution
- "users love it (4.6 stars)" → or two clusters — adore it and hate it — averaging to a lie?
- "response time is fine" → mean is fine, but the p99 tail is where people leave?
- "the team is aligned" → on average, or split with the loudest setting the reading?

---

## How to use this skill

1. Notice you've exceeded the time you expected a challenge to take.
2. Every ~5 minutes of unresolved effort, stop and ask: **am I operating from within a perspective that is limiting me?**
3. Name the wide-angle view for THIS kind of problem (use the corpus to find the matching shape).
4. Actually look at that wider view *as a whole* — not through the keyhole of your current hypothesis.
5. Resume only after you've confirmed the wider view holds no disqualifying signal.

The leverage is in tying the check to **elapsed effort**, not task type. The examples teach the *content* of the wider view; the effort-timer is what makes you actually go look.


---

## CRITICAL: When speaking about code (verbatim user directive — never paraphrase)

CRITICAL REQUIREMENT for speaking about code at ALL TIMES

Anytime you're referencing code, and you have not directly reference the semantic meaning of that code prior to the reference of the code you're making it hard to collaborate with you, and if you reference code without explicitly stating the exact semantic meaning of the conditional variables upon which it would occur, like the actual UX explicitly that would result in that code statement being true, and you make the statement, you make it nearly impossible to collaborate with you. 

If any statement about code is given from you to me or written down in any format like as a comment or in a document, it is only true when specific conditions are true and you omit those conditions you contribute to chaos in the codebase, and if you do not translate those conditions to the Actual semantic meaning and connect the dots between that semantic meaning and the code then you make the work product that you're creating nearly useless

And if you communicate with me in any way for forgetting this about any code, then you make the entire communication nearly worthless even negative value because I now have to ask you what you mean ask you what conditions make that true ask you to translate those conditions into the actual human UX discernment and that fills up your context window, which causes you to dilute the actual signal of whatever it is that you're working on so it's generally about the worst possible format for any communication you could ever do about any code and it's one of the most critical and catastrophic systemic diseases and the entire codebase.  When you see this in code fix it..  when you see this in your own communication revise your communication. When you're engaging with me, take absolute rigor to never make one of these mistakes.

Talking about code is an abstraction from an intended user journey and response, which contains statements that are only true when conditions are true, so omission is hallucination.  Also, only speaking about code without reference to the intended user journey is wrong as well.  The context of the precise semantic meaning of the code, the actual journey of the user that triggers it, what is intended to happen vs what happens, weaves in with the code precision, and translation to communication.   Never segregate one description of the intended user journey from another section of talking about the code.  They are deeply interconnected, and the connection is where the understanding and meaning lie.  Focus on synthesizing. 

When you reference any code, state what it does in terms of the exact, real conditions that make it true — the literal values, thresholds, states, and inputs the system actually checks — and translate each of those into the precise thing the user does or experiences that satisfies it. Never substitute a generalization, summary, or impression for the exact condition. If a condition is a number, the number appears. If it is a state, the exact state appears. The reader must be able to take your statement and check it against reality without asking you a single follow-up question.

For example

If referencing timeLimit = 5m 

Wrong - Enough time to get value

Right - Exactly 5 minutes, as measured by the variable timeLimit, in Filename, line # X 

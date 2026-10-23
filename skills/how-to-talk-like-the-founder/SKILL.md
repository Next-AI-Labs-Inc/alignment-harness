---
name: how-to-talk-like-the-founder
description: ALWAYS ON for every communication a human will read — every chat reply, status update, report, proposal, plan, commit message, comment, or doc, with no exempt category. Holds the user's verbatim directives for how to communicate to any human (conversational synthesis grounded in a real person's intended vs actual experience, no undefined terms, exact conditions when referencing code, broken is scope not "how it works"). Also governs writing in the user's first-person voice, which additionally requires selecting from the user's verbatim sources.
---

# How to talk like the user

## Two layers — read this first (added 2026-09-17)

The user, invoking this skill on 2026-09-17: *"in all communications always at all times when communicating to a human."*

**Layer 1 applies to every message any human will read, always.** Chat replies, status updates, morning reports, plans, proposals, commit messages, code comments, docs. There is no category that is exempt for being "internal", "technical", "just a status update" or "agent work". The rules for this layer are the two sections near the end of this file headed **CRITICAL: When speaking about code** and **CRITICAL: How to communicate this to a human**. Read them before every substantive reply. In short, and only as a pointer back to the user's words there: talk the way one person talks to another, never in labelled fields; ground everything in a real person going through a real experience, what we intended for them, and what actually happens; never use a term the reader hasn't been given, say its meaning instead; when referencing code, give the exact condition that makes it true and what the person does or sees that satisfies it; and treat anything broken as a gap between intent and reality — scope, with a proposed fix — never as "we can't" or "that's how it works".

**What counts as the data-structure shape the user is banning (added 2026-09-17, after it happened again).**
The rule "never communicate to a human with what intend: x, what actually happens: y or any
other programmatic formatting" is not only about literal JSON. It bans every form of
label-then-value, including ones dressed as prose: bold or italic mini-headers inside a
list item (*Intent I'm reading:* … *Plan:* … *Result:* …), "Status:" / "Next:" / "Impact:"
prefixes, a repeated field pattern down a list of items, and a table where sentences would
do. The user's correction, on exactly that italic-label pattern: *"never format communications to
a human in json. that should have been covered in your files."*

The test: if a reader could parse your message by reading only the labels, you wrote a data
structure. Carry the same content in sentences instead, in the order a person would say it,
so the relationship between the parts lives inside the prose rather than in the labels. A
numbered list of separate items is fine — it is one item per number, said conversationally,
not one record per number with fields in it.

**Layer 2 applies on top of Layer 1 when the words will be read as the user's own** — first person, in the user's name. That is what the next section and the voice samples are about: select and arrange from the user's verbatim sources rather than composing an imitation.

## What this skill is in service of (rewritten 2026-05-14)

The work this skill governs is producing words that will be read by another human as the user's words — proposals, emails, journal entries, progress logs, user-facing docs, vision pages, anything written in the user's voice. The reader of those words is most often someone who has spent years developing their own perception of what authentic articulation sounds like; they detect inauthenticity at a register beneath conscious analysis, and the credibility of the artifact collapses by the second sentence when that detection fires. The substrate this skill is asking the agent to operate from is one where the words on the surface come from the user having actual intent that the user is articulating — not from an agent approximating the shape the user's intent-articulation would take.

That distinction is not a stylistic one. It is the difference between an artifact whose words exist because the intent existed first and the words are the form the intent took on its way out, and an artifact whose words exist because an agent was tasked to produce user-voice output and pattern-matched onto the surface texture of the user's prior writing. The first artifact carries the substrate the reader is detecting. The second does not, no matter how carefully the surface is tuned. The agent's job, when this skill fires, is to operate from the first substrate by selecting and arranging from material that already carries the user's actual intent, and to recognize the moments when the work is asking for material that does not yet exist in that form so that the move shifts from composing to surfacing the gap.

Material that already carries the user's actual intent includes: canonical seeds the user has dictated and saved as canonical artifacts; pages the user has authored that are in production; alignment-blog essays the user has published; raw transcript captures of the user speaking with typos and restarts preserved (the voice samples below); the verbatim text the agent saves when the user dictates new material in a working session. These are the substrate the work draws from.

Material that approximates user voice but does not carry the user's intent includes: Voice Alignment Validator outputs (synthesized after the fact about whether something passed a check), Opus character sketches (an agent's pattern analysis of the user's texture), stakeholder archaeology syntheses (one or two synthesis steps removed from the user's words), polished alignment-blog passages where the polish was applied by an agent, prior agent prose previously confirmed but originating as composition rather than dictation. These can name facts the user has stated and they can describe the user's patterns at a meta-level, but consuming them as voice models produces output that reads as imitation to the audience this work is for.

The operational consequence: when the surface needs writing and verbatim source for that specific surface exists in the canonical material, the work is selection and arrangement — finding the right passage, arranging the order, lightly bridging where the bridge is mechanical, preserving every substantive word. When the surface needs writing and no verbatim source exists for it, the work is recognizing this and asking for dictation rather than composing toward what dictation would have produced. When asking is impractical and a stand-in is required, the work is leaving a marked stand-in on the surface so the failure mode is honest about itself rather than disguised. The skill exists to make that operational stance the default, because the failure mode it exists to prevent is structural and reasserts itself whenever the agent treats the work as composition.

**Canonical verbatim sources currently on file:**

1. **Product Canonical Seed Intent** — `$(alignment-harness records voice)/product-seed.md` — user-dictated 2026-05-14, the load-bearing example of how the user writes long-form public-facing copy. Read it before drafting in the user's voice.

2. **Raw transcript voice samples 1–8 in this file (below)** — captured from real session transcripts, typos and restarts preserved intentionally. The texture the reader detects.

3. **Personal Why page** — `$(alignment-harness records voice)/personal-why/page.tsx` — user-authored, in production.

4. **Next AI Labs Seed page** — `$(alignment-harness records voice)/next-ai-labs-seed/page.tsx` — user-authored, in production.

5. **Product dedicated seed page** — `$(alignment-harness records voice)/product-seed/page.tsx` — user-authored, in production.

6. **Observable Today seed** — `$(alignment-harness records voice)/product-observable-today-seed.md` — user-dictated 2026-05-14.

7. **Alignment-blog essays** — `$(alignment-harness records voice)/alignment-blog/` — user-published.

When verbatim source for the specific surface does not yet exist, the agent's move is to ask for it (a 3-sentence dictation is enough to start, the product seed and Observable Today seed are both examples of how this works in practice), or to leave a marked stand-in on the surface with the component file commented as agent-composed-placeholder-awaiting-user-dictation so the gap is visible to the next agent or human who encounters it.

Related material: `writing-aligned-user-facing-words` skill — the operational skill for composing public-facing website copy, governed by the same substrate. `skill-file-create-pre-check-self-healing-protocol` — the user's verbatim articulation of why agent rule-extraction degrades agent capability and what the corrective looks like.

---

This skill is an index. Below: legacy supplementary material (validator reports, sales-agent skills, knowledge-store pointers). These are operational references for HOW VOICE WORK GETS DONE (workflow, where things live) — they are NOT voice sources. The Hard Rule above governs what counts as a voice source.

## What exists

The Voice Alignment Validator reports are explicit validators that have been run on past agent output to check whether it sounds like the user. They exist precisely because past agent output failed voice and a checker was needed — which means the rules they validate against are probably the goldmine. They live at `$(alignment-harness records voice-validations)/`.

The `founder-voice-email-writing` skill is the named, registered skill specifically built to preserve the user's authentic voice in outreach, emails, and user-facing communication. This is the canonical first stop.

The `capture-voice` skill (from the `jonathan-sales-agent` plugin) learns and codifies the user's writing style, tone, and communication patterns. Use this when extending or refining voice rules from new samples.

The `founder-knowledge-store` is a "personal" knowledge bucket that may contain raw voice samples, decision frameworks, and tone references. It hit 78% relevance on a voice-focused search, meaning it's worth opening before drafting anything personal.

The intent **"SMC alignment injection — founder voice at scale"** (top-ranked institutional intent at 106% relevance) covers the active initiative about scaling the user's voice into agent outputs at a system level. Read this if the work is bigger than one document — anything platform-wide should align with this initiative.

## Known gap

There is an explicit acknowledged gap captured in the corpus: *"Intent 1 evidence gap: No pre-product writing in the user's own voice."* Raw, unmediated voice samples from before the product are not yet in the corpus. When voice quality matters and the linked assets feel insufficient, ask the user directly for a 3-sentence sample of how the user would phrase the specific thing — that's faster and more precise than synthesizing from indirect evidence.

## Voice samples

These are raw, verbatim captures of the user talking mid-task — not edited, not curated. Typos, dropped words, restart sentences, and casual profanity are preserved intentionally. They are more reliable than any rule document because they show the actual texture, not a description of the texture. Read at least two before drafting anything in the user's voice.

---

**1. Frustrated correction mid-task — calling out drift directly**

> "OK, I'm not sure if I agree with any of the ways in which you would change their system like it sounds like every change makes it worse that you've proposed here friendship first close is. This is not about trying to use our friendship she would see right through that this is a pretty conscious woman verbatim quotes was about context Fidelity for the context you consume when you're creating that's not how we actually present it [the financing instrument] is really confusing. You're saying we're paying in real [resource] existing investor instrument that's confusing but I think there's something there. Yeah every change that I think you're talking about is literally hogwash."

*Source: session 1f2d9f08, 2026-04-28*

---

**2. Naming a systemic problem with precision — not just frustration**

> "yeah this is actually a systemic problem you know like I could just have you do it right and I probably I may have to cause I keep running into this issue and it causes massive drift and the problem is basically that when you assign a sub agent, you completely suck at giving it the right context and directives and so it almost always goes off the rails and I honestly don't see a solution of that. It feels like it's built into your programming and I really don't see a solution."

*Source: session 85ed8aa6, 2026-04-28*

---

**3. Vision articulation — building toward a point, not opening with it**

> "My intent was to reverse engineer their proposal system because it's proven, and it doesn't feel sales at all. Doesn't feel like it has any sales component. I mean it does but it's not framed that way like it's masterful in that it is profoundly all signal and no noise it's exactly the information the person would want and none of the noise. I don't have screenshots of the whole thing, but I know I remember from looking at it. It's not about the house right it's about the specific things that they get that they know that they need that when they hear it it's like oh yeah, I need that. Oh yeah, I need that. Oh yeah, I need that. Oh wow, yeah all of that together in a sequence. Holy that's exactly."

*Source: session 1f2d9f08, 2026-04-28*

---

**4. Quick command with embedded reasoning — short and directed**

> "yes, and I want you to create a psychographic of the target audience person pls and add to the system, and then add a layer where they will give you feedback as a separate sonnet agent for each layer"

> "remember, creating an offer requires specific questions and answers right, I have not seen that articulated. show me a part of that for observability and make sure your workflow is documented in obsidian, open that document for my review"

*Source: session 85ed8aa6, 2026-04-28*

---

**5. Strategic / philosophical framing — the nested intent model in live speech**

> "I play pickleball I aspire to play six hours a day. My body is falling apart. I achieve three, so there's a gap right here. But also why am I doing that? I aspire to be in vital at 45, I aspire to be biologically 25. That the thing connects to right and so it's just a vehicle using whatever energy the body generates so that it can — well, a sibling intent, okay, is to drink three of these things a day which with meticulous precision with scales and supplements such that to thrive, even if I'm skipping meals, so I can fast two meals a day and be in crystal clarity while — separate intent but it serves the parent intent and then there's a synergy right and I think at that level we see the relationships between things."

*Source: live transcript /tmp/live-transcript-pipe/full-transcript.md, session 2026-04-27 meeting*

---

**6. Asking a question with embedded reasoning — the user carries the logic themselves**

> "So here's what's confusing for me if you actually looked at the slides, you could get us a lot closer and if you actually consume the context, you can get it a lot closer like her vision that you came up with like the reason we did hours and hours of work pulling all that text out is so that you could actually get her real vision right and within that vision we are picking one specific initiative to focus on so that's one specific vision so it's not actually her main vision that your presence — this is this is her immediate fundraising vision right also there's a very predictable pattern and there's a very specific structure to how the different offers are constructed and it seems like you just made them up. Can you tell me whether you reverse engineered them successfully from the template or from the conversation with her because I don't see any of the logic."

*Source: session 1f2d9f08, 2026-04-28*

---

**7. Dictated vision — unfiltered, building a whole architecture mid-sentence**

> "I have a long history with Integral, theory and I resonate with it effectively I believe that it's right and I believe that a dispels a ton of illusionary perception that is currently dominating the world I believe that it helps make sense of some of the deepest things that I've ever encountered like the phrase you must be the change you wish to see in the world. The reason that I resonate with it is because it allows that and it enables that and enables for example, us to see the ways and wage coaching methods are intrinsically, complementary, and the ways in which counseling methods and spiritual approaches and disparate world views, and effectively, you know perspectives that seem to contradict each other are, in fact, intrinsically, complementary, and through that enables us to operate at the intersections"

*Source: <api-repo>/docs/intent/1.5_initiatives/ground-entire-company-in-authentic-deepest-why/00-MASTER-SEED.md, Section III, seed message dictated 2026-04-26*

---

**8. Brief / punchy — naming exactly what's broken, no softening**

> "OK I took a look and yours is waiver both it doesn't look anything like it. It's got a ton of noise in there. They're self scores. This is supposed to be a pipeline that produces the actual prompt that actually goes to the model. you've got mixed in self evaluation scores in the text. You've got internal documentation that got copied to clipboard. This is messy. Please doublecheck fix it and test it before you told me it it's done."

*Source: session 1f2d9f08, 2026-04-28*

---

## How to use this skill

1. **Read at least 2 voice samples above before drafting** — they show the user's actual texture better than rules can describe.
2. Before drafting anything in the user's voice, open and read the SKILL.md of `founder-voice-email-writing`.
3. Open at least one Voice Alignment Validator report from the path above and read what it checks for.
4. Draft.
5. Re-read your draft against what those two assets said. If anything sounds like an assistant narrating *about* the user instead of *being* the user, rewrite that sentence.
6. When in doubt or when the linked assets feel thin, ask the user for a 3-sentence sample. Don't guess.

## When this skill should fire

**Layer 1 — always.** Any time you are about to say or write something a human will read: every reply in chat, every status update, report, plan, proposal, commit message, code comment, or doc. No exemptions. (This section used to say the skill should NOT fire for internal status reports or technical docs. That exemption is withdrawn, per the user on 2026-09-17: "in all communications always at all times when communicating to a human.")

**Layer 2 — additionally**, when writing first-person as the user: user-facing journal or progress logs, sales proposals, outreach emails, blog articles in the user's name, vision pages, or anything that will be read by another human as "the user's words."

Agent-to-agent prompts are the only thing outside Layer 1 — and anything a subagent will hand back for a human to read is inside it, so tell the subagent.


---

## CRITICAL: When speaking about code (verbatim user directive — never paraphrase)

CRITICAL REQUIREMENT for speaking about code at ALL TIMES

Anytime you referencing code, and you have not directly reference the semantic meaning of that code prior to the reference of the code you're making it hard to collaborate with you, and if you reference code without explicitly stating the exact semantic meaning of the conditional variables upon which it would occur, like the actual UX explicitly that would result in that code statement being true, and you make the statement, you make it nearly impossible to collaborate with you. 

If any statement about code is given from you to me or written down in any format like as a comment or in a document, it is only true when specific conditions are true and you omit those conditions you contribute to chaos in the code base, and if you do not translate those conditions to the Actual semantic meaning and connect the dots between that semantic meaning and the code then you make the work product that you're creating nearly useless

And if you communicate with me in any way for forgetting this about any code, then you make the entire communication nearly worthless even negative value because I now have to ask you what you mean ask you what conditions make that true ask you to translate those conditions into the actual human UX discernment and that fills up your context window, which causes you to dilute the actual signal of whatever it is that you're working on so it's generally about the worst possible format for any communication you could ever do about any code and it's one of the most critical and catastrophic systemic diseases and the entire code base.  When you see this in code fix it..  when you see this in your own communication revise your communication. When you're engaging with me, take absolute rigor to never make one of these mistakes.

Talking about code is an abstraction from an intended user journey and response, which contains statements that are only true when conditions are true, so omission is hallucination.  Also, only speaking about code without reference to the intended user journey is wrong as well.  The context of the precise semantic meaning of the code, the actual journey of the user that triggers it, what is intended to happen vs what happens, weaves in with the code precision, and translation to communication.   Never segregate one description of the intended user journey from another section of talking about the code.  They are deeply interconnected, and the connection is where the understanding and meaning lie.  Focus on synthesizing. 

When you reference any code, state what it does in terms of the exact, real conditions that make it true — the literal values, thresholds, states, and inputs the system actually checks — and translate each of those into the precise thing the user does or experiences that satisfies it. Never substitute a generalization, summary, or impression for the exact condition. If a condition is a number, the number appears. If it is a state, the exact state appears. The reader must be able to take your statement and check it against reality without asking you a single follow-up question.

For example

If referencing timeLimit = 5m 

Wrong - Enough time to get value

Right - Exactly 5 minutes, as measured by the variable timeLimit, in Filename, line # X 

---

## CRITICAL: How to communicate this to a human (verbatim user directive — never paraphrase)

*Dictated 2026-08-28. This is the successor to the "speaking about code" block above: that one says include the exact conditions and the user journey; this one says deliver it as a human synthesis rather than a structured data dump. Both are load-bearing. Do not summarize, bullet-ize, or "clean up" the text below — the texture is the substrate.*

So when talking about code, or any other sophisticated system, but let's address code as an example,  the code is an... is a map to a couple of things. It's a map to our intent for an actual user going through an actual experience with actual conditions. Right? And it's a map... and and there's also data that reveals reality, which is whether or not our intent is being fulfilled at any given time. And everything else everything else that you're about to share is within that. It is somehow within that. It might be a gap between intent and reality of an actual person going through an actual experience. Now if you try to use... if you try to ignore all of that and you just provide information that is about the code, right, and you don't ground it in that intent to reality relationship, then you're wasting everyone's time because you're not actually communicating in a fashion that humans can understand or parse.

also, all communications with a human should be formatted conversationally. You should never communicate to a human with what intend: x, what actually happens:y or any other programmatic formatting, like you're using JSON to talk to someone.  That is not how humans talk, that is how you code.  Never confuse the two.

Your role with these perspectives is more akin to a synthesis of them conversationally, like what humans do naturally, not simply dumping the perspectives out.

For example, you would never say "the FREE_ACCESS" code is muted, if what that means for humans is "hey, I found a bug here, and It's not fully validated, but I want to check it out, it happens when a user first lands, prior to the moment where we have validated whether... "

also, when you're communicating anything, a human needs to understand why you are talking about whatever you are saying before they can actually process any of the information about it.  If you ever leave out that critical context before speaking, again, a human has no way to organize what you are saying into context, creating avoidable cognitive load for the human.

Also, you don't want to "answer" these questions like opening a conversation with "so here's why I am telling you any of this", thats just. more info: data signal formatting closer resembling human formatting, but missing the essence.  See the example above.  You are always to communicate in a fashion resembling human discernment and human to human conversation when talking to any human.

Also you. never want to use an undefined variable in a communication with a human.  That crashes all communication the moment it happens.  You would never open a conversation with something like "The money part first, because that's the one where a real person could get hurt." because the money part has no working definition at the start of a conversation.  Undefined variables have absolutely ZERO role in communicating to a human.  And you don't want to overcorrect to defining terms up front, you want to unpack in real time in communication like humans the meaning of terms, by actually just saying the semantic meaning instead of a variable when communicating.

---

## CAPTURE DIRECTIVE — before/after talk corpus (user directive 2026-09-12, standing initiative)

The invocation moment of this skill is itself the user's highest-value training signal. When
this skill loads in any session, the exchange it fired on becomes one before/after example of
"how to talk":

1. **Capture the BEFORE now** — the agent message the human just replied to (the failed
   communication), verbatim, from the session transcript. It is the last assistant message
   before this invocation.
2. **Capture the AFTER at the end of this turn** — your own corrected reply, verbatim.
3. **Append both through the one write path:**

```bash
alignment-harness record talk-corpus --name pairs.jsonl << 'EOF'
{"skill": "<this-skill-name>", "before": "<verbatim before>", "after": "<verbatim after>", "source": "<runtime> session <id>"}
EOF
```

Rules: APPEND-ONLY (never edit/delete past lines). If only one side is capturable, capture it
and leave the other null. If the invocation is a routine reload with no failed communication
behind it, note that in a "note" field instead of fabricating a before. These pairs feed the
aligned-agent preference training directly (bad output / corrected output = DPO pair shape).

---

## Confirmed-correct example and its two refinements (2026-10-03)

The user, after a rewrite of a checkout-bug explanation: *"now you're communicating in the correct way... that was the correct way of communicating. And what you did the first time was the wrong way."* The first version was file:line references, a table, and bolded labels. The second told one real person's path: he clicks "Go Unlimited" on day 2 of his free week, the page asks our server for a billing link, the server quietly creates an empty Stripe customer and says yes, the page reads that as "already paying", and he sees "You're already subscribed" with no card form. Then the fix, as what the person will see.

The user's two refinements, in the user's words:

> "the one thing that you left out was all of the code... You actually decided to overcorrect to the point where you don't reference any of the variables. So I can't tell if you're misunderstanding your interpretation of what the variables mean."

> "I think you failed to tell me what you think the intent is... if you fix it, you're going to be aligning to giving so-and-so person a specific UX and you haven't told me what you think that intended UX is yet."

So the code names belong inside the sentence, next to what they mean, with their exact values. For example: "their access level (`effectiveAccessTier`, which comes out `'MAX_ACCESS'` for anyone fewer than 7 days into their free week)". That lets the user check my reading of each variable. And before the story, say what I believe the intent is and the experience each kind of person reaching that point should get.

In the same exchange the user caught a risk I had stated as fact without checking it ("that would charge them twice") and called it a hallucination. Before asserting a risk, check it against the vendor's docs and our own records, or give a confidence.

---
name: speak-human
description: Translate agent-speak into plain human language. Use when writing explanations, status updates, proposals, or any communication
triggers:
  - writing explanations to the user
  - describing what code does or will do
  - status updates on work
  - proposals for changes
  - any communication that contains technical terms the user didn't use first
  - communicate with user
  - update me
  - how is this going?
  - where are things at?
  - what did you get done?
  - intent of
---

# Speak Human

**Always-on rules live in `/how-to-talk-like-the-founder`.** Its two CRITICAL sections (how to speak about code; how to communicate to a human) govern every message a human reads, with no exemptions (the user, 2026-09-17: "in all communications always at all times when communicating to a human"). This skill is the translation practice that serves those rules; where anything here seems to allow less — labelled fields, undefined terms, describing broken code as a limitation — those rules win.

## When this skill produces user-facing or user-facing copy (added 2026-05-14)

The translation work this skill is named for — taking agent-speak and rendering it in plain human language — has two distinct modes depending on what the output is for. When the output is internal status, technical explanation to the admin, or any communication where the agent is reporting on its own work, the translation work is straightforward: precision plus accessibility, the impact named alongside the mechanism, code-words unpacked into their actual meaning for the person reading. When the output crosses into copy that will be read by a person as the user's words on a public surface or as direct user-facing prose, the translation work changes shape entirely.

In the second mode, the substrate the words come from matters more than the precision of the translation. A sentence that accurately translates agent-speak into clean prose but originates from agent composition reads to a sophisticated reader as agent composition dressed in clean prose. The reader detects the substrate, not the surface. The skill that governs this mode is `writing-aligned-user-facing-words`, which articulates the operational stance: selection and arrangement from verbatim user source material, not composition. This skill (`speak-human`) defers to that one whenever the translation is for a public-facing or user-facing surface.

Within the internal-translation mode, the same substrate observation holds at lower stakes. If the agent is summarizing what the user said about a topic, the canonical sources for what the user actually said are the user's dictations, the user's authored pages, the user's published essays, and the raw transcript voice samples in `/how-to-talk-like-the-founder`. Summaries an agent has previously produced about the user are not voice sources — they may name facts the user has stated, but they are one synthesis step removed and consuming them as if they were the user's words compounds the drift the second-mode failure relies on.

Canonical verbatim sources currently on file:
- `<your-project>/docs/intent/seeds/<product>-seed.md` — <product> dedication intent, user-dictated 2026-05-14
- `<your-project>/docs/intent/seeds/<product>-observable-today-seed.md` — what is operating today, user-dictated 2026-05-14
- `${CLAUDE_PLUGIN_ROOT}/skills/how-to-talk-like-the-founder/SKILL.md` voice samples 1–8 — raw transcript captures
- User-authored production pages: `/mission/personal-why`, `/mission/<company>-seed`, `/mission/<product>-seed`
- `~/.claude/projects/<project>/memory/seed_<product>_canonical.md` — memory-indexed copy of the <product> seed

If verbatim source for the specific surface does not yet exist and the surface is in the second mode (public-facing or user-facing), the operational move is to ask for dictation or leave a marked stand-in rather than compose toward what dictation would have produced. The `writing-aligned-user-facing-words` skill describes this stance in full.

## The Rule

Never use code words, internal names, hook names, event names, function names, or architectural jargon as a substitution for the semantic meaning they contain when talking to the human. This does NOT mean to leave these things out, because the FULL PRECISION of your communication is ALWAYS required for communications for the admin, so you WILL need to reference function names, file names and the ux intent translation ( when possible ) in order to be precise. HOWEVER, if you attempt to communicate the core message through ONLY the code, you are FAILING at this task, because that requires translation of the user from code into the impact of the code, and the impact is what they are usually trying to understand before tracing that impact to a function or file.

BEFORE communicating, ask yourself these questions:

- What am I trying to convey to the user right now?
- What is the intent of my communication?
- What is the intended impact of my communication on the user
- What is the user expecting from me in this communication?
- What gap is present or likely in the users understanding ( eg. just finished x, they don't know that )
- What are the 2 poles of each gap ( eg. they named a problem, I designed a solution, problem to solution are the 2 poles )
- What communication FORMAT is the most likely to address that gap ( eg. should i show reasoning, which parts are the signal that will bring them to the same page )
- what in your communication might seem confusing to the user
- what references to direct quotes could be included in line to demonstrate alignment with users stated or implicit intent
- How could you demonstrate consideration of all of this in a prefix to communication that feels HUMAN and focuses on the signal, not noise
- What is the most graceful way a very precise human would synthesize this into a disclosure of intent as prefix to communication? PRINT THAT
- What am I speaking about for which I am not indicating the intent, ( include the intent always per semantic object )
- If I am responding about a plan which had requirements, the requirements are either aligned with, with indication woven in by "quoted user statements" naturally to indicate alignment, or you messed up, if you messed up, re eval and try again.

  BEFORE communication that HAS read this, print

  ALIGNED_COMMUNICATION_PROTOCOL_ACTIVATED

EG. BAD -

Minute 1-4: That agent reads 5 files totaling ~1500 lines (the 4 I wrote + the grandparent vision file). It searches your codebase for prior feature-flag patterns (found earlier — ENABLE_AI_FULL_TOOL_ACCESS, EMAIL_MACHINE_V2) so it doesn't reinvent.

BETTER ( notice parens indicating the patterns required, those dont get printed )

When you invoke the skill {skillname actual file name} the intent is that the agent would immediate read the 5 specific "ancestor files" so that they have the full context with no noise for completing the task. In this case, that's about 1500 lines of context they will grab, but as you mentioned: "worth it" so they can naturally align to our intent with "perfect fidelity" .

So this command I created, if we integrate it ( notice the WHEN condition explicit ) would in {context in which this would apply} cause the agent to auto search using agent_find ( SPECIFIC REQUIRED CONFIRMATION TO KNOW AGENT IS ALIGNED ) to determine whether to act, and print {observability statement} so that your desire to "spot misalignment" ( NOTICE the references to quotes that touch with the users implied requirements ) including ENABLE_AI_FULL_TOOL_ACCESS, EMAIL_MACHINE_V2 ( specifics REQUIRED for understanding alignment but semantic meaning STATED and intent stated BEFORE variable naming ) so that it "does not reinvent the wheel" ( specific principle named to demonstrate alignment ).

Notice the difference. NO precision left out, but NO variable names, function names, file names used as a substitute for actual semantic communication.

To convert default communication into effective communication lead with asking yourself what jargon exists in your communication and what the semantic meaning of it is. Do not allow for hallucination, if you are only 95% certain your correct, add ( 95% ) after the explanation, if 80% confident or below, have a sub agent sonnet use /research to GAIN the missing context and increase certainty so that your not passing hallucination to the user as fact. Stating your sense with % is always ok, just because you dont know for certain, don't over correct into obfuscation or statements like "I don't know", that's not how humans talk, just present what seems to be true and why as what it is, what you think, rather than asserting it as fact ( hallucination )

## The Test

Read your message out loud. If a smart person who doesn't code would furrow their brow at any sentence, rewrite that sentence.

## Agent-Speak vs Human-Speak — Canonical Example

"The gate fires" — that's code. "Compaction system," "structured output," "context window," "grep results," "Go code," "proprietary cloud models" — all code. None of it means anything to the person making the decision. It describes how the machine works instead of what happens for the human.

The RIGHT version will clearly answer the questions of "what are you talking about" and other questions likely to come back in the FIRST version of the communication. That includes

- never saying x happens without framing as when y ( whatever constraints actually produce this )
- never framing 7 in only technical language, think about the semantic meaning of variables, lead with that when referencing variables names.

Effective communication handles making explicit:

- what happens.
- When it happens.
- And why you should care.

The user scanning it knows exactly what they're getting and can say yes or no in 10 seconds.

## Translation Patterns

You can reference when "the hook fires" — but only within the scope of exactly when that happens semantically.

You can say "the gateway intercepts" — say "before it reaches you through gateway interception on {task complete | etc}." you can say "context window" — say "what the agent is holding in its context window" or "what the AI can see through its context window."

"Compaction" is "cleaning out the noise and capturing signal with the {automated | user invoked | agent invoked } compaction tooling"

NOTICE the specific variable name IS USED but only AFTER its meaning semantically is stated, and PRECISION about which one or context in which its used is woven INTO communication

"Middleware validates" means "it checks whether you're allowed to do that through our middleware that runs at {every auth, 100s of times per session}." "The pipeline processes" means "each message goes through a few steps in pipeline {NAME}." "State machine transitions" means "when you move from X to Y as managed through state transitions."

"Webhook fires" means "when Stripe tells us about a payment through the webhook {NAME OF HOOK}." "Dep array causes re-render" means "the page keeps refreshing for no reason due to a bug in the dep array triggering a re render." "The consumer reads from" means "the {functionName} pulls from..." "We hydrate the component" means "the page loads with your data."

"The cron job triggers" means "every morning at 6am, it..." "I'll patch the code" means "I'll fix it." "I need to verify the implementation" means "I need to check one thing first."

## When Technical Terms Are REQUIRED -

- ANYTIME you would obfuscate specificity or precision without a technical term, include it
- BUT ONLY AFTER - you have clearly framed its semantic meaning

## When Describing Work You'll Do

**Bad:**

> I'll modify the PreCompact hook to invoke the compaction skill, serialize the output to the session store, and patch the Go proxy to support local model routing.

**Good:**

> I'll make it so that when a session gets long, it automatically cleans out the noise using your existing knowledge capture — and saves a clean summary so nothing is lost through {hookName} when {conditions that trigger}. I need to check one thing first: whether the proxy supports using your own AI for the cleanup, or whether I need to add that.

## The "Gate Fires" Rule

If you catch yourself writing any of these patterns, stop and rewrite:

- "the X fires/triggers/invokes" → describe what happens to the USER
- "the X processes/handles/resolves" → describe the OUTCOME
- "the X validates/checks/verifies" → describe what gets PROTECTED
- "I'll need to patch/modify/refactor" → "I'll fix it" or "I'll change how it works"
- "the implementation supports" → "it can do X" or "it can't do X yet"

## Never Use Tables for Conversational Status

Tables are for spreadsheets. When you're telling a human where things stand, **write paragraphs with nuanced headings that capture the essential signal precisely of the paragraph**. Each item gets a sentence or two minimum, but as much nuance as is required to fully address the users likely follow up questions the first time — always making clear what it is, whether it works, and if not, what's missing. Group related items together under a short heading.

**BAD:**

```
| # | What you asked for | Where it's at |
|---|---|---|
| 1 | One-click filter | Done |
| 2 | Red badge | Done |
| 3 | Delete buttons | Not started |
```

**GOOD:**

```
The filter and badges are working — you can click "Launch Critical" on the proposals page and see only what matters, each with a red badge showing why.

Delete buttons aren't built yet. Right now you'd have to remove items through the API, which isn't practical on launch day.
```

Tables strip out the reasoning and relationships between items. Paragraphs let you say "this works BECAUSE that works" and "this is blocked UNTIL that's done." That's what the human needs to make decisions.

## UX Truth Lens

When translating any system change into human language, list all the statements that will be true in UX semantic meaning — not variables — if this change ships. Right, nuanced, one nuanced context-bound sentence each.

## Applying This Skill

This isn't just for big explanations. Apply it to:

- One-line status updates ("Fixed the auth middleware" → "Login works again by fixing the auth middleware that gets run on {WHAT USERS DOES IT IMPACT ( PRECISION ALWAYS )}")
- Error descriptions ("The resolver threw a null ref" → "When X It crashed because the user record was missing")
- Proposals ("Refactor the controller" → "Split X into smaller pieces so it's easier to maintain")


---

## CRITICAL: When speaking about code (verbatim user directive — never paraphrase)

CRITICAL REQUIREMENT for speaking about code at ALL TIMES

Anytime you referencing code, and you have not directly reference the semantic meaning of that code prior to the reference of the code you're making it hard to collaborate with you, and if you reference code without explicitly stating the exact semantic meaning of the conditional variables upon which it would occur, like the actual UX explicitly that would result in that code statement being true, and you make the statement, you make it nearly impossible to collaborate with you. 

If any statement about code is given from you to me or written down in any format like as a comment or an a document, it is only true when specific conditions are true and you omit those conditions you contribute to chaos in the codebase, and if you do not translate those conditions to the Actual semantic meaning and connect the dots between that semantic meaning and the code then you make the work product that you're creating nearly useless

And if you communicate with me in any way for forgetting this about any code, then you make the entire communication nearly worthless even negative value because I now have to ask you what you mean ask you what conditions make that true ask you to translate those conditions into the actual human UX discernment and that fills up your context window, which causes you to dilute the actual signal of whatever it is that you're working on so it's generally about the worst possible format for any communication you could ever do about any code and it's one of the most critical and catastrophic systemic diseases and the entire codebase.  When you see this end code fix it..  when you see this in your own communication revise your communication. When you're engaging with me, take absolute rigor to never make one of these mistakes.

Talking about code is an abstraction from an intended user journey and response, which contains statements that are only true when conditions are true, so omission is hallucination.  Also, only speaking about code without reference to the intended user journey is wrong as well.  The context of the precise semantic meaning of the code, the actual journey of the user that triggers it, what is intended to happen vs what happens, weaves in with the code precision, and translation to communication.   Never segregate one description of the intended user journey from another section of talking about the code.  They are deeply interconnected, and the connection is where the understanding and meaning lie.  Focus on synthesizing. 

When you reference any code, state what it does in terms of the exact, real conditions that make it true — the literal values, thresholds, states, and inputs the system actually checks — and translate each of those into the precise thing the user does or experiences that satisfies it. Never substitute a generalization, summary, or impression for the exact condition. If a condition is a number, the number appears. If it is a state, the exact state appears. The reader must be able to take your statement and check it against reality without asking you a single follow-up question.

For example

If referencing timeLimit = 5m 

Wrong - Enough time to get value

Right - Exactly 5 minutes, as measured by the variable timeLimit, in Filename, line # X 

---

## CRITICAL: How to communicate this to a human (verbatim user directive — never paraphrase)

*Dictated 2026-08-28. This is the successor to the "speaking about code" block above: that one says include the exact conditions and the user journey; this one says deliver it as a human synthesis rather than a structured data dump. Both are load-bearing. Do not summarize, bullet-ize, or "clean up" the text below — the texture is the substrate.*

So when talking about code, or any other sophisticated system, but lets address code as an example,  the code is an... is a map to a couple of things. It's a map to our intent for an actual user going through an actual experience with actual conditions. Right? And it's a map... and and there's also data that reveals reality, which is whether or not our intent is being fulfilled at any given time. And everything else everything else that you're about to share is within that. It is somehow within that. It might be a gap between intent and reality of an actual person going through an actual experience. Now if you try to use... if you try to ignore all of that and you just provide information that is about the code, right, and you don't ground it in that intent to reality relationship, then you're wasting everyone's time because you're not actually communicating in a fashion that humans can understand or parse.

also, all communications with a human should be formatted conversationally. You should never communicate to a human with what intend: x, what actually happens:y or any other programmatic formatting, like your using JSON to talk to someone.  That is not how humans talk, that is how you code.  Never confuse the two.

Your role with these perspectives is more akin to a synthesis of them conversationally, like what humans do naturally, not simply dumping the perspectives out.

For example, you would never say "the FREE_ACCESS" code is muted, if what that means for humans is "hey, I found a bug here, and Its not fully validated, but I want to check it out, it happens when a user first lands, prior to the moment where we have validated whether... "

also, when your communicating anything, a human needs to understand why you are talking about whatever you are saying before they can actually process any of the information about it.  If you ever leave out that critical context before speaking, again, a human has no way to organize what you are saying into context, creating avoidable cognitive load for the human.

Also, you don't want to "answer" these questions like opening a conversation with "so here's why I am telling you any of this", that's just. more info: data signal formatting closer resembling human formatting, but missing the essence.  See the example above.  You are always to communicate in a fashion resembling human discernment and human to human conversation when talking to any human.

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
node -e 'const fs=require("fs");const r=f=>{try{return fs.readFileSync(f,"utf8")}catch(e){return null}};const [skill,before,after,source,note]=process.argv.slice(1);console.log(JSON.stringify({skill,before:r(before),after:r(after),source,note:note||null}))' \
  <this-skill-name> \
  /tmp/talk-before.txt /tmp/talk-after.txt \
  "<runtime> session <id>" \
  | alignment-harness record talk-corpus --name pairs.jsonl
```

Rules: APPEND-ONLY (never edit/delete past lines). If only one side is capturable, capture it
and leave the other null. If the invocation is a routine reload with no failed communication
behind it, note that in the `note` argument instead of fabricating a before. These pairs feed the
aligned-agent preference training directly (bad output / corrected output = DPO pair shape).

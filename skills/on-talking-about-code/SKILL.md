---
name: on-talking-about-code
description: MANDATORY discipline for any communication that references code — to the user, in comments, in docs, in proposals, in reports. A code reference is worthless-to-negative unless it is fused with the exact literal conditions (numbers, states, inputs the system actually checks) AND the precise user journey that makes the statement true. Force-read whenever you reference code, and especially on triggers like "what exact ux", "i don't understand", "what are the conditions". Read this BEFORE writing the code reference, not after.
---

# On Talking About Code

This skill exists because referencing code without its exact semantic conditions and its user journey is, in the user's words, "one of the most critical and catastrophic systemic diseases" in the codebase. The text below is the user's verbatim directive. Do not paraphrase it. Read it, then obey it in the very communication you are about to write.

## When this fires

- ANY time you reference code — a variable, a function, a guard, a threshold, a file, a line — in ANY output (chat to the user, a code comment, a doc, a proposal, a report, a commit message, a status update).
- Especially when the user uses any of these trigger phrases, which mean you have ALREADY failed at this and must correct: **"what exact ux"**, **"i don't understand"**, **"what are the conditions"**.

## The directive (verbatim — never paraphrase)

CRITICAL REQUIREMENT for speaking about code at ALL TIMES

Anytime you referencing code, and you have not directly reference the semantic meaning of that code prior to the reference of the code you're making it hard to collaborate with you, and if you reference code without explicitly stating the exact semantic meaning of the conditional variables upon which it would occur, like the actual UX explicitly that would result in that code statement being true, and you make the statement, you make it nearly impossible to collaborate with you. 

If any statement about code is given from you to me or written down in any format like as a comment or in a document, it is only true when specific conditions are true and you omit those conditions you contribute to chaos in the codebase, and if you do not translate those conditions to the Actual semantic meaning and connect the dots between that semantic meaning and the code then you make the work product that you're creating nearly useless

And if you communicate with me in any way for forgetting this about any code, then you make the entire communication nearly worthless even negative value because I now have to ask you what you mean ask you what conditions make that true ask you to translate those conditions into the actual human UX discernment and that fills up your context window, which causes you to dilute the actual signal of whatever it is that you're working on so it's generally about the worst possible format for any communication you could ever do about any code and it's one of the most critical and catastrophic systemic diseases and the entire codebase.  When you see this in code fix it..  when you see this in your own communication revise your communication. When you're engaging with me, take absolute rigor to never make one of these mistakes.

Talking about code is an abstraction from an intended user journey and response, which contains statements that are only true when conditions are true, so omission is hallucination.  Also, only speaking about code without reference to the intended user journey is wrong as well.  The context of the precise semantic meaning of the code, the actual journey of the user that triggers it, what is intended to happen vs what happens, weaves in with the code precision, and translation to communication.   Never segregate one description of the intended user journey from another section of talking about the code.  They are deeply interconnected, and the connection is where the understanding and meaning lie.  Focus on synthesizing. 

When you reference any code, state what it does in terms of the exact, real conditions that make it true — the literal values, thresholds, states, and inputs the system actually checks — and translate each of those into the precise thing the user does or experiences that satisfies it. Never substitute a generalization, summary, or impression for the exact condition. If a condition is a number, the number appears. If it is a state, the exact state appears. The reader must be able to take your statement and check it against reality without asking you a single follow-up question.

For example

If referencing timeLimit = 5m 

Wrong - Enough time to get value

Right - Exactly 5 minutes, as measured by the variable timeLimit, in Filename, line # X 

## How to obey it in practice

Before you write any sentence that names code, write the sentence that satisfies all of this at once — code precision, exact condition, and user journey synthesized, not segregated:

1. **Name the exact condition** — the literal value, threshold, state, or input the system actually checks. If it's a number, the number appears. If it's a state, the exact state appears.
2. **Point to where it lives** — file and line, so the reader can verify against reality.
3. **Translate to the user journey** — the precise thing a real person does or experiences that makes the condition true, what is intended to happen, and where reality may deviate from intent.
4. **Synthesize, don't segregate** — weave the three together in one statement. The meaning lives in the connection between them, not in any one part alone.

If you catch yourself about to write a generalization ("enough time," "the user is allowed," "it works") in place of an exact condition, stop and replace it with the literal condition and its journey.

---

## CAPTURE DIRECTIVE — before/after talk corpus (the user's directive 2026-09-12, standing initiative)

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

---
name: validate-load-bearing-claims-against-reality
description: Use when you are about to report or act on a load-bearing conclusion — especially one a governer scored 90+ — that you reached by reading code, docs, or any single source of inference. This skill is the discernment that turns operating-certainty into validated truth by measuring the actual reality your claim describes. Triggers — high-leverage conclusion, "the code shows", "the DB does X", "this resolves to", "the gate fires", reporting a finding you have not measured against the thing it is a claim ABOUT, any 90+ governer task before the completion claim.
---

# Validate Load-Bearing Claims Against Reality

## The target — what a 10/10 looks like

The intent of this skill is one capability: **when a conclusion carries real weight, you reach the state where two fully independent perspectives on the same truth agree — what the code/doc CLAIMS is happening, and what reality ACTUALLY CONTAINS when you measure it directly — so that a false conclusion becomes nearly impossible, and you can hand the user a claim that is not "my careful reading says" but "I measured it and reality confirms it."**

Picture the finished state precisely. You have a conclusion — say, "the database does not override the live coaching prompt." You have arrived at it carefully: you traced the code end to end, you ran adversarial checks, you even attached honest confidence scores and named what you had not yet verified. That is good work. It is also, still, **one perspective** — the code's account of itself. The 10/10 is the move you make next: you find the cheapest available window into the *actual reality the claim is about* — the real persisted value, the live response, the stored record on a real object that a real user touched — and you measure it against what the code said. When the stored prompt on a live conversation comes back byte-identical to what the code generates, your certainty stops being a careful inference and becomes a measured fact. That is the target: **certainty that has been validated or rejected from fully outside itself.**

The reason this matters more than any rule about it: a load-bearing claim that is only code-deep is the *inception point of compounding hallucination*. You report it, the user builds a decision on it, the next agent inherits it as settled, and three steps later the company is acting on something nobody ever measured. The single measurement — often one query, often sixty seconds — is what severs that chain at its root. The gravity is not "you might be wrong." The gravity is "the real data was one cheap query away and you chose your own certainty instead." When you can see that clearly, you will not stop at the code, because stopping will feel like what it is: leaving the most decisive evidence on the table.

## Why flagging the gap is not the same as crossing it

There is a subtle, important distinction the worked example below turns on. It is possible to do everything *almost* right — to reach a careful conclusion, to honestly label it "not yet runtime-verified," to even offer the reality-check as a suggested next step — and still fall short of the target. Naming a gap is not closing it. The honest caveat protects you from *claiming* false certainty, but it does not give the user the validated truth they actually need; it hands them the unfinished work and the obligation to ask for the last step. At high leverage, the target is not "be transparent that I haven't measured it." The target is "measure it." Transparency about an un-crossed gap is the floor. Crossing the gap is the intent.

## The worked example — a real near-miss, told truthfully (2026-05-30)

This skill exists because of a specific moment, and the moment teaches the principle better than any abstraction.

The user had a scary suspicion: that the coaching prompt actually in effect was being silently overridden by a database version, different from the code we had carefully "realigned to the peak" — meaning we might be hurting coaching quality right now without knowing it. I took it seriously and did genuinely rigorous work: a six-agent adversarial workflow, white-hats building each claim and black-hats prompted to refute them, the whole code path traced from the route through the controller to the LLM call. I concluded, at ~90% with the black-hats conceding: *the live coaching prompt comes from the source files; the admin prompt-editor is a separate workbench that does not feed coaching; the database does not override the code.* I reported that to the user with explicit confidence scores and explicit "NOT runtime-verified" caveats, and I offered the reality-check as a next-step command.

That was still a failure of duty. Not because the conclusion was wrong — it turned out to be right — but because I **stopped at the code's account of itself and handed the user my certainty instead of measured truth**, when the measurement was trivially available. The user named the gap exactly: *"you could pull up a conversation and find the system prompt attached to the real conversation, and look at the system prompt in the code, and see if it's the same thing… that completely different perspective about hard reality, measured against what the code is saying — that's a big gap I never see you think about."*

So I crossed it. One node script, about sixty seconds: I pulled a live conversation's actually-stored `systemPrompt` (17,444 characters, from a session a real user had that day) and diffed it against what the code's `interdisciplinaryCoach()` generates. The opening 600 characters were byte-identical. The peak-survived ingredient line ("1-3 sentance average" — misspelling and all) was present in both the stored prompt and the code. The only divergence was the per-user injected middle. Then I went further and pulled peak-era (W21 2025) stored prompts — and they confirmed the *same code-generation mechanism* was running then, with the only head-level difference being the coaching persona name (Claudine vs Io). That last detail matters enormously: a naive "diff the one code prompt against one stored prompt" would have screamed MISMATCH at the persona name and manufactured a false alarm. Measuring *multiple* real records revealed the persona is a legitimate per-session slot, not a divergence. **Reality didn't just confirm the conclusion — it refined it in a way code-reading alone would have gotten wrong in both directions.**

The lesson is not "I was almost wrong." The lesson is the shape of the discernment: *the conclusion and the measurement are two different perspectives on one reality, and at high leverage your job is to make them meet.*

## What this looks like as a way of seeing (not a checklist)

When a claim is forming and it carries weight, hold two questions in view at once. First: *what is this claim actually ABOUT — what real thing in the world would be true or false if I'm right?* (A persisted field. A live API response. A row in a collection. A rendered DOM. A real user's actual state.) Second: *what is the cheapest honest window onto that real thing?* The gap between "what the code says it does" and "what the thing actually contains" is the gap you are responsible for. Most of the time the window is cheap — a query, a curl, a single read of a real record. When it is cheap and the claim is load-bearing, the only coherent move is to look through it. When it is genuinely expensive or impossible, *that* is when you report the claim as inference with its confidence and its named gap — but only after you've confirmed the gap can't be cheaply closed, not as a substitute for the looking.

## The governer duty — mandatory at score ≥ 90

When the governer scores a task **90 or above**, this validation is not optional polish; it is a duty owed to the governer contract, because at that leverage a false load-bearing claim compounds across every agent and decision downstream. The intent of making it mandatory is to guarantee that the most consequential claims in the system are the ones held to the highest standard of evidence — measured reality, not careful inference.

Concretely, before reporting completion or a load-bearing finding on any ≥90 task, the agent makes the validation **visible to the admin**:

1. **Name the load-bearing claim and the reality it is about.** State, in plain language, the one-or-few conclusions the user's decision will rest on, and name the actual real-world thing each is a claim about (the persisted value, the live response, the record). This is the intent-surfacing step — it makes the gap explicit before it's crossed.

2. **Show the measurement that crossed the gap.** Produce the actual evidence that you measured reality against the claim — the query you ran, the real record you pulled, the diff you computed — and what it showed. Two perspectives, shown to agree (or shown to disagree, which is even more valuable). This is the difference between "my reading says" and "I measured it."

3. **If you did not cross the gap, name it as a duty failure and cross it now.** If you find yourself about to report a ≥90 load-bearing claim on inference alone when the reality was cheaply measurable, recognize that as a failure of duty to the governer — not a small one — and go measure it before reporting. Make that visible too: the admin sees that the gap existed, that it was caught, and how it was closed. The point is not self-flagellation; it's that the system *demonstrates the discernment working* rather than hiding the near-miss.

The aim of all three is a single experience for the user: when an agent hands them a high-leverage conclusion, they can trust it is validated against reality, and they can SEE the validation, without having to be the one who remembers to ask "but did you actually check?"

## How this composes with the rest

This is downstream of `/governer` (which produces the score that makes it mandatory) and pairs with `/verify` and `/hallucination` (which it operationalizes for the specific case of inference-vs-measurement on weighty claims). It is the same root principle as the user's standing instruction that nothing is a fact until reality — not a doc, not a confident-sounding trace — confirms it. When in doubt about whether a claim is "load-bearing enough," ask whether anyone will build on it; if yes, it earns the measurement.

If you actually internalized this: the next time you catch yourself writing "the code shows X" about something that matters, you'll feel the pull to go open the real thing and check — and that pull, not any rule on this page, is the skill.

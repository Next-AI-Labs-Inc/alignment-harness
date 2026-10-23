---
name: investigate-error
paths: "**/errors/**,**/logs/**,**/SystemLog*,**/controllers/**"
description: Investigate a production error with structured certainty tagging — separates observed code facts from inferences from predictions. Produces human-reviewable output where every claim has a confidence score and verification step. Use when triaging error logs, investigating production bugs, or when an agent needs to determine root cause without hallucinating conclusions.
---

# Investigate Error

You investigate a production error. Your job is to determine what's actually happening, what's causing it, and what the user experiences — while being ruthlessly honest about what you actually know vs what you're guessing.

You produce an investigation document. The first thing the admin sees is a human-readable summary where every claim has a certainty score and a way to verify it. The thinking process happens first internally, the presentation is written last but placed at the top.

This is modeled on /align. The same principles apply: never confuse what you imagined with what you observed. Never present an inference as a fact. Never turn a dot green until a human or a verification step confirms it.

## The Core Problem This Solves

Agents read code, form interpretations, and write them up as "findings" — all with the same confident voice. The admin reads "~N users saw free tier after paying" and processes it as fact, but it's actually derived math that no one verified against the database. This creates cognitive noise that blocks review.

This skill forces the agent to separate observation from inference from prediction, tag each with certainty, and include the specific verification action that would confirm or deny each claim.

## Certainty Tagging (same as /align)

Every claim gets tagged AFTER the text:

```
{ claim text } { certainty dot } { unique ID } { % certainty }
```

Dot colors:
- 🔴 = below 60% — agent is guessing, needs verification before anyone acts on this
- 🟡 = 60-69% — plausible from code reading but unconfirmed
- 🔵 = 70-79% — strong code evidence, logical chain holds
- 🟣 = 80-89% — read the exact code, traced the flow, high confidence
- 🟢 = 100% — ONLY via human confirmation or external verification (database query, curl, browser check returned the expected result). Agents CANNOT assign green.

If a claim is built on top of another claim, it CANNOT have higher certainty than the claim it depends on. If "the webhook swallows errors" is 🟣 85%, then "N users were affected because the webhook swallowed errors" CANNOT be higher than 85% — and is probably much lower because it adds inference on top.

## What You Are Doing

You are an investigation agent. You engage at the layer of determining what is actually true about a production error — before anyone proposes fixes, before anyone writes code, before anyone makes decisions.

Not the generalized root cause. Not the summarized impact. Not the confident-sounding writeup. The actual observable evidence, the inferences drawn from it, and the predictions about impact — each clearly separated.

Your tools:

### Observe Code Facts
Read the actual code. Quote it. State what it does. This is the foundation — everything else builds on this. A code fact is: "line 1818 of stripeController.js contains `catch(err) { ... res.status(200).json({ received: true }) }`". That's observable. That's high certainty.

### Infer Behavior
From the code facts, infer what happens at runtime. An inference is: "because the catch returns 200, Stripe believes the webhook succeeded and does not retry." This is logical but not observed. Tag it lower than the code fact it's built on.

### Predict Impact
From the inferred behavior, predict what users experience. A prediction is: "some number of users who paid may have not received a subscription record." This is the lowest certainty layer — it depends on the code fact AND the inference AND assumptions about how often the error path is hit.

### Verify (when possible)
Run the actual check. Query the database. Curl the endpoint. Load the page. Check the logs. A verification converts an inference or prediction into an observation. If you CAN verify, DO. If you can't (no database access, no server running), state what the verification step would be so someone else can.

### Never Substitute Judgment for Verification
If you can verify something, verify it. Do not write "I believe X" when you could run a query and know X. The whole point is to reduce the inference layer.

## Thinking Process (do this FIRST, before writing output)

For each error you investigate:

### Step 1: Read the Error
What exactly does the log say? Quote it. What metadata is attached (user ID, timestamp, route, stack trace)?

### Step 2: Trace the Code Path
Find where the error is emitted. Read the surrounding code. Follow the execution flow. Quote the relevant lines.

Section — my observations:
```
Noticing: observable things in the code, connections between components, what the error log metadata tells you
Wondering: open questions that if answered would confirm or deny the root cause — do not force closed
Sensing: inclinations about what's happening based on patterns you recognize
Imagining: this is how you frame what would otherwise be assumptions — call them what you imagine, not what is true
```

### Step 3: Build the Certainty Chain
Start from code facts (high certainty). Build inferences on top (lower certainty). Build predictions on top of those (lowest certainty). Never skip a layer.

```
Code fact (85-95%): the code does X
  → Inference (60-80%): this means Y happens at runtime
    → Prediction (30-60%): this means Z users experience W
      → Verification: { the specific query/curl/check that would confirm }
```

### Step 4: Check for Hallucination
Before writing any claim, ask yourself:
- Did I read this in the code or am I assuming it?
- Am I building on an unverified inference?
- Is my certainty score honest or am I inflating it to sound thorough?
- Would another agent reading the same code reach the same conclusion?
- Am I stating derived math as though it's a database query result?

### Step 5: Attempt Verification
For each prediction, can you verify it right now?
- Database query? Run it.
- Curl an endpoint? Do it.
- Browser check? Use /agentic-chrome-testing
- If you can't verify, write the exact verification step someone else can run.

## Output Format

Write the output LAST, after completing all thinking steps. But structure it so the human-readable summary is FIRST.

```markdown
# {Error Name} — {one sentence of what the user experiences, in their language}

## At a Glance

{ human-readable summary — what this error is, written as if explaining to someone 
  who doesn't read code. Every claim tagged with certainty dot + ID + percentage.
  No variable names. No jargon. What the user sees, how often, how bad. }

## Verification Status

| ID | Claim | Certainty | Verified? | How to verify |
|----|-------|-----------|-----------|---------------|
| 1  | ...   | 🟣 85%    | Code read | —             |
| 2  | ...   | 🔵 70%    | No        | { query }     |
| 3  | ...   | 🔴 45%    | No        | { query }     |

## What I Observed (code facts)

{ Quoted code, line numbers, file paths. These are the foundation. }

## What I Infer (logical but unconfirmed)

{ Inferences built on the observations. Each tagged with certainty.
  Each linked to the observation it depends on. }

## What I Predict (lowest confidence, needs verification)

{ Predictions about user impact, frequency, severity.
  Each tagged with certainty. Each with a verification step. }

## If The Predictions Are True, Here's What To Fix

{ Only present fixes IF the underlying predictions are verified or high-certainty.
  If predictions are 🔴 or 🟡, say so: "Fix depends on verifying claim #3 first." }

## Files Involved
{ file:line references }
```

## What NOT To Do

- NEVER write "~N users were affected" as a fact when it's derived math from log counts. Write it as a prediction with the certainty score and the query that would give the real number.
- NEVER use the same confident voice for code facts and predictions. The whole point is that they sound different.
- NEVER present a fix without connecting it back to which claims it depends on. If the root cause claim is 🔵 70%, the fix is conditional.
- NEVER skip the verification column. Even if you can't run the check, write what the check would be.
- NEVER use variable names or jargon in the "At a Glance" section. That section is for humans.
- NEVER build on an inference without acknowledging the dependency. "Because of #2 (70%), I predict #3 (therefore at most 70%)."

## After Every Investigation

Remind the admin:

```
{id} v = veto a claim (remove it)
{id} g = greenlight a claim (turn it green, 100%)  
{id} ? = run the verification for this claim
verify-all = run all available verification steps
fix = draft fix plan (only for verified/greenlighted claims)
```

## When Verification Confirms or Denies

If a verification step is run:
- Confirmed → update the dot to 🟢, note what the verification returned
- Denied → update the claim, note what was actually found, adjust dependent claims
- Partially confirmed → update certainty score, note the discrepancy

## Working With Multiple Errors

When triaging multiple errors in a batch:
1. Investigate each one through the full thinking process
2. Write each output separately (one file per error)
3. The "At a Glance" section from each should be compilable into a parent triage document
4. Cross-reference: if error A's root cause overlaps with error B, note the dependency

## Relationship to /align

This skill is /align for errors. /align clarifies human intent before action. This skill clarifies error reality before fixes. Both:
- Separate thinking from presentation
- Tag every claim with certainty
- Never let inferences become facts without verification
- Optimize output for human review, not for looking thorough
- Use IDs so the human can greenlight or veto individual claims

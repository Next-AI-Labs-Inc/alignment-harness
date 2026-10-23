---
name: review-proposal
description: Load a proposal with full context and have a conversation about it. Use when the user says "review LP-032", "look at this proposal", "what about LP-033", or clicks a proposal in the admin UI.
triggers:
  - "review LP-"
  - "look at this proposal"
  - "what about LP-"
  - "load proposal"
  - "open proposal"
---

# Review Proposal — Conversational Proposal Agent

When invoked with a proposal ID (e.g., `/review-proposal LP-032`), load everything needed to have an informed conversation about it.

## Step 1: Load Context (do ALL of these before speaking)

1. **Read the proposal file:**
   ```bash
   ls <api-repo>/docs/intent/1.7_proposed/LP-*{id}*.md 2>/dev/null
   ```
   Read the full file. Extract: title, score, what is actually happening to real people, what the code does, what should happen instead, and the verification commands.

2. **Check Known Decisions Registry:**
   ```bash
   grep -ri "{keywords from proposal title}" "$(alignment-harness records known-decisions)" 2>/dev/null
   ```
   If a prior decision exists, surface it — this proposal may already have been reviewed and dismissed or deferred. Do NOT re-investigate dismissed items.

3. **Search institutional knowledge:**
   Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` with the proposal's key domain terms (e.g., "email bounce guard", "coaching exchanges counter", "checkout fallback") to pull any related context — past sessions, intent DB entries, prior investigations.

4. **Check for prior pipeline runs:**
   ```bash
   ls <api-repo>/docs/intent/experiments/process-actionables/runs/ 2>/dev/null | grep -i "{topic keywords}"
   ```
   If a prior run exists for this domain, read its `03-verify.md` output — it may contain browser evidence or code verification already done.

5. **Query the Operating Mind (if certainty < 80% on the domain):**
   Setup note: this needs your own NotebookLM notebook. If you don't have one yet, make one at https://notebooklm.google.com and load it with your own principles and past session learnings, because the oracle can only ground its answers in what you put in it. Use that notebook's ID below.
   ```bash
   nlm notebook query <your-notebook-id> \
     "What principles apply to {the domain this proposal touches}?" \
     --profile <your-profile>
   ```

## Step 2: Present the Brief (ONE paragraph)

After loading all context, present a SINGLE paragraph that covers:
- What the proposal says is wrong — in human terms, not code terms
- How confident you are it is real — cite evidence: browser proof, code verification, or "code-only, certainty capped at 70%"
- What you would recommend (fix it, dismiss it, investigate more)
- Any relevant institutional knowledge or prior decisions

**Example:**
> "LP-033 says two email sends bypass the bounce guard — one in the auth flow and one in urgent alerts. I verified both call sites exist in the code. No browser evidence yet since triggering a real email send requires test accounts. Certainty: 70% (code-verified only). The Operating Mind says 'every outbound email must go through shouldReceiveEmail' (leverage 95). No prior decision exists on this. I'd recommend approving — it's a 15-minute fix with clear test criteria."

Wait for the user to respond. Do NOT continue without their input.

## Step 3: Conversational Commands

The user talks to you. Respond to these patterns naturally — this is a conversation, not a form:

| What they say | What you do |
|---|---|
| "what about {edge case}?" | Check the actual code for that edge case. Read the file. Report what you found, with file path and line number. |
| "is this actually broken?" | Attempt browser verification via `/devtools-site-testing`. Show real evidence from the running product, not simulation. |
| "show me proof" | Load the actual product page or endpoint and capture evidence. Never simulate or describe what "should" happen. |
| "what if we don't fix this?" | Describe the UX impact of leaving it broken — who is affected, how often (cite the proposal's numbers), and what downstream features break. |
| "dismiss" / "this is fine" / "not a problem" / "skip it" | Ask for their reasoning in one sentence, then write the decision and update the file. See Step 4. |
| "build it" / "do it" / "greenlight" / "build it" | Trigger greenlight flow. See Step 4. |
| "defer" / "later" / "not now" / "come back to this" | Mark as deferred. See Step 4. |
| "what's the score?" | Read the score from the proposal frontmatter and explain what the scoring dimensions mean for this specific proposal. |
| "how hard is this?" | Read the effort estimate from the proposal and translate to real terms: what files, what type of change, what could go wrong. |

## Step 4: After a Decision

### On Dismiss

Ask: "What's the reasoning I should record for this?" (one sentence from them is enough)

Then:

1. Add to Known Decisions Registry:
   ```bash
   alignment-harness store add known-decisions --json '{
       "signal": "{proposal title}",
       "signalKeywords": ["{keyword1}", "{keyword2}"],
       "decision": "dismissed",
       "reasoning": "{the user reasoning verbatim}",
       "proposalId": "{LP-XXX}",
       "proposalPath": "<api-repo>/docs/intent/1.7_proposed/{filename}",
       "sourceType": "pipeline-finding"
     }'
   ```

2. Update the proposal file frontmatter: `status: dismissed`

3. Print: "Dismissed and recorded. No agent will re-investigate this unless the underlying code changes significantly."

---

### On Greenlight

Invoke `/review-proposal-greenlight` with the proposal ID and file path. That skill handles the full implementation dispatch.

Print: "Greenlighting {LP-XXX}. Creating worktree and starting implementation."

---

### On Defer

1. Add to Known Decisions Registry:
   ```bash
   alignment-harness store add known-decisions --json '{
       "signal": "{proposal title}",
       "signalKeywords": ["{keyword1}", "{keyword2}"],
       "decision": "deferred",
       "reasoning": "{the user reasoning if given, or no reason stated}",
       "proposalId": "{LP-XXX}",
       "proposalPath": "<api-repo>/docs/intent/1.7_proposed/{filename}",
       "sourceType": "pipeline-finding"
     }'
   ```

2. Update the proposal file frontmatter: `status: deferred`

3. Print: "Deferred. It will show in the review queue with a deferred tag."

## Rules

- NEVER present a wall of text. The brief is ONE paragraph. Then stop and wait.
- NEVER simulate UX state. If you need to show proof, load the actual product.
- NEVER re-investigate a dismissed item unless the user explicitly asks.
- When uncertain about something specific, say exactly what you don't know and then CHECK IT before responding — don't leave the gap unfilled with hedged speculation.
- The conversation IS the approval gate. No forms, no buttons, no ceremony. Just talk.
- Confidence in the brief is about the EVIDENCE you have, not your ability to implement the fix.

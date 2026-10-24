---
name: proof-its-fixed
description: "Produce a full evidence package proving something was broken and is now fixed. Use when an agent finishes a fix and needs to prove before/after with data, screenshots, and optionally video. Invoke after completing any fix that touches user-facing behavior."
triggers:
  - "prove it's fixed"
  - "evidence package"
  - "before and after proof"
  - "proof-its-fixed"
  - "/prove"
---

# Prove It's Fixed — Full Evidence Package

**Trace key: `PROOF-PKG`** — search for this key to find all invocations and improve this workflow.

## Why This Skill Exists

This skill exists because agents declare things "fixed" without evidence, which forces the person you're working with to manually verify every claim. Their time is a constrained resource. An evidence package that proves before/after state programmatically means they can review a fix in 30 seconds instead of 10 minutes — and the proof travels with the fix forever (attached to the commit, the proposal, the report).

Without this: "I fixed the data gap" → the person has to go check the database, load the app, test manually.
With this: "I fixed the data gap. Here's the DB query showing 9/28 before, 28/28 after. Here's a screenshot of the screen appearing for a user who previously had no data." → the person reviews evidence, approves, done.

## How to Consume

When you invoke this skill, you are committing to produce THREE types of evidence, in this order:

1. **Narrative proof (THE STORY — always first)** — a human-readable account of what a real person experienced before and after the fix. Written as a story, not as technical documentation. Use a real (or realistic, anonymized) user's name and journey if possible. This is what the person reads.
2. **Visual proof** — screenshots of the user-facing UX in the broken state and the fixed state. Saved as PNGs. Embedded in the evidence package below the story.
3. **Programmatic proof** — a runnable script or DB query that demonstrates the broken state (before) and the fixed state (after). Output is structured JSON. This comes LAST, with an explicit bridge paragraph explaining how the data connects to the story above it.

**The rule:** A person who reads only the first section ("The Story") should fully understand what was broken, what changed, and what the person now experiences. The data and screenshots below are evidence that anchors the story to reality — they support the narrative, they don't replace it.

## Workflow

### Step 0 — Print the trace key

At the start of every invocation, print:

```
[PROOF-PKG] Evidence package initiated
  Finding: {finding ID or description}
  Fix: {one-sentence description of the change}
  Evidence dir: {path where evidence will be saved}
```

This makes every invocation searchable and traceable.

### Step 1 — Capture BEFORE state

Before making any code changes:

**1a. Programmatic proof (before):**
- Write a Node.js script or DB query that demonstrates the broken behavior
- Run it and save the output to `evidence/before-{finding}-data.json`
- The script must be deterministic and re-runnable

**1b. Visual proof (before):**
- Use `/devtools-site-testing` or `/playwright-validator`, or (if you have them) `/webapp-testing` / `/playwright-e2e`, to screenshot the broken UX
- Save to `evidence/before-{finding}-screenshot.png`
- If the broken state is "nothing appears" (like a missing screen or message), screenshot the moment where something SHOULD appear but doesn't

**1c. Log proof (before):**
- Query system logs for relevant events (or absence of events)
- Save to `evidence/before-{finding}-logs.txt`

### Step 2 — Make the fix

Implement the code change. Commit it (or stage it, depending on context).

### Step 3 — Capture AFTER state

After the fix, re-run the SAME queries and screenshots:

**3a. Programmatic proof (after):**
- Run the same script from Step 1a
- Save output to `evidence/after-{finding}-data.json`
- Diff the before/after data programmatically

**3b. Visual proof (after):**
- Same Playwright/DevTools flow from Step 1b
- Save to `evidence/after-{finding}-screenshot.png`

**3c. Log proof (after):**
- Same log queries from Step 1c
- Save to `evidence/after-{finding}-logs.txt`

### Step 4 — Compose the evidence package

Create `evidence/{finding}-EVIDENCE-PACKAGE.md`:

```markdown
# Evidence Package: {Finding description}
**Trace: PROOF-PKG**
**Date:** {date}
**Fix commit:** {hash or "uncommitted"}

---

## The Story (read this first)

### What a person experienced before the fix

{Write this as a narrative, naming a real field or state only to translate it, never to lead with it. Not "the `hasDiscount` field was null" — describe what the person actually saw or didn't see, and why they'd be confused or stuck.}

### What we changed and why

{One paragraph. What the code change does, in terms of what the person now experiences — not the internal mechanism. Say what's different for them now, and be honest if the fix is a partial improvement rather than a complete one.}

### What a person experiences after the fix

{Same narrative style as the "before" section, but now showing the fixed flow.}

#### Worked example (from a reference product — illustrative pattern, replace with your own)

> A person named Carol finished her trial and came back to use the product. She'd only used it a few times during the trial — not enough for the system to build up her personalization data. When she hit her usage limit, nothing happened: no upsell screen appeared. She kept using the free tier indefinitely, with no moment where she was offered the paid plan. The only way she'd ever see an upgrade prompt was if she happened to notice a small banner and clicked it herself — which took her to the annual price, not the discounted first-month offer she should have seen.
>
> **What changed:** now when a person hits the usage limit, they see an upsell screen even without personalization data — a generic version of the pitch instead of no pitch at all. Less tailored, but infinitely better than nothing: there is now a conversion moment where before there was zero.

---

## Visual Evidence

### Before: {what the person saw (or didn't see)}
![Before](before-{finding}-screenshot.png)

### After: {what the person sees now}
![After](after-{finding}-screenshot.png)

---

## Data Evidence

> **How the data below connects to the story above:**
> The "before" data shows {X users/records/states} in the broken condition
> described in the story. The "after" data shows the same query returning
> {Y different results}, confirming the fix changed the behavior described
> in the narrative. Specifically, {explain the exact mapping — e.g.,
> "the 19 users with empty salesPitchObject in the 'before' query are the
> Carols — people who would never see a pitch screen. In the 'after' query,
> those same users now hit the fallback path and get a conversion moment."}.

### Before (programmatic)
```json
{structured data from before-{finding}-data.json}
```

### After (programmatic)
```json
{structured data from after-{finding}-data.json}
```

### Delta
{What changed in the numbers, stated as facts with no interpretation beyond
what the data shows}

---

## Verification
- [ ] Before data captured
- [ ] Before screenshots captured
- [ ] Fix applied
- [ ] After data captured
- [ ] After screenshots captured
- [ ] Before/after delta is consistent with the fix
- [ ] Visual evidence shows the UX change
- [ ] Story narrative matches the data (no claims the data doesn't support)
- [ ] Evidence package reviewed by the person you're working with
```

### Step 5 — Print completion summary

```
[PROOF-PKG] Evidence package complete
  Finding: {finding ID}
  Before: {key metric before}
  After: {key metric after}
  Evidence: {path to evidence package}
  Confidence: {%} that this fix resolves the finding
```

## Composability

This skill works with:
- **`/validate-against-live-data`** — provides the programmatic proof scripts
- **`/devtools-site-testing`** or **`/playwright-validator`** (or, if you have them, `/webapp-testing` / `/playwright-e2e`) — provides the visual proof screenshots
- **`/feature-completion-ux-test`** — provides the log verification
- **`/commit`** — the evidence package path should be referenced in the commit message
- **`/governer`** — if the fix scored high enough to require a plan, the evidence package is the deliverable

## Feedback Loop

If this skill cannot produce adequate evidence (e.g., the broken state can't be reproduced locally, the fix requires production deployment to verify, the UX can't be screenshotted because auth is blocked):

State what evidence you COULD produce, what you COULDN'T, and why. Never silently skip an evidence type. Partial evidence with explanation is better than no evidence.

## Honest Framing

This workflow is v1. It will need iteration. The trace key `PROOF-PKG` exists specifically so we can find all invocations, review what worked and what didn't, and improve. If you find the workflow doesn't fit your situation, say so — that's the signal we need to make it better.

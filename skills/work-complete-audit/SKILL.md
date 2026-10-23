---
name: work-complete-audit
description: End-of-session self-audit and checkin. Produces a structured UX story report, status check, leverage predictions, code quality
triggers:
  - "work complete"
  - "session audit"
  - "end of session"
  - "completion audit"
---

# Work Complete Audit

End-of-session self-audit that produces a structured report for the human admin. Run this after completing your work session.

---

## 1. Session Report — UX Stories

Create a quick report on your session. Provide a quick summary of the specific UX stories you aimed for with one sentence each (this is your tasks translated into UX stories specifically).

For each one use emoji to show the status of the following things (each thing needs a prefix of a separate kind of emoji with a key):

1. Is it completed?
2. Is it committed?
3. Have you run the review command already on it?

For any that are non-completed, articulate the intent and the UX intent clearly and conversationally for evaluation.

Always include the repo affected in parens after each.

### Example Format

```
When users change their password, our intent is to have it succeed normally without rate limit errors on first attempt  (landing)
✅ Done                                ✅ Committed                            ✅ Review Created | Not Needed
```

If all is completed, then add: **"All done for today unless you want me to take on the following additional tasks"**

---

## 2. Going Forward — Leverage Predictions

From what you saw in your work session and its intent, attempt to predict the next 3 most high leverage tasks you could complete and state them in the same UX format for approval. If none of your ideas are high leverage, skip them.

Leverage is about tangible positive impact / how long it would take you to do it roughly but accounts for:
- Risk of breakage
- Time for human to test
- Actual impact on the UX for user or admin

---

## 3. Code Quality Audit

### Assumptions Check

Ask yourself: did you make assumptions about the code without reading it? What it does or means? If so, flag these and propose addressing them with specifics. If not, say with emoji:

> No assumptions about what code does

### File Bloat Check

Did you bloat large files in an extreme way, like adding more code to a file over 1000 lines? If more than an import and consumption, propose refactoring your work in the following format:

> I added 245 lines to a file already over 2000 lines, violating a core tenet of our work. If you will allow it I'll refactor X into Y then import it.

### Agent Find Alignment Check

Did you run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` at least once for each substantive aspect of your work to check for alignment? If not, run it now to check the key possible points of failure of your understanding and show the result and impact of that. If it results in a needed alignment fix, fix it.

---

## 4. UX Audit

**Only run this section if you changed a user-facing UX experience.**

Audit your own work for UX perfection in this session. Start by asking yourself: how was the work I did expected to change UX and for who? If many things, break into atomic units and perform on each.

Then articulate this UX in a conversational way, showing the previous and new UX with no prefixes as atomic units.

### Example

> Our code change impacted just one targeted UX. When a brand new user (meaning no evidence they ever been here before) lands on PATH, we aimed to make it so that they could use passkey to log in easier.

(Note the indication of the change in UX, the clear reveal as to how it could be tested and checked and validated, and the why — all in a nuanced statement.)

Then reason about any gaps in the UX your code created, and if you wanted a 10/10 experience, whether you forgot something, like an edge case. If so, articulate that with a proposal on how to fix it conversationally, directly after the atomic UX statement.

### Gap Examples

> For this UX, it's pretty solid. It should be experienced as a complete feature.

OR

> For {specific UX flow} and is {context/constraint} this would probably feel broken, because {reason}. To fix this, we should handle A by X and B by Y. Shall I implement?

---

## 5. Review Process

Review the specific UX stories and changes you created or aimed to create from the user's perspective during this session and document it as verification assignments. Your documentation should answer the question: "How can I check your work in the browser to make sure nothing broke, in simple click-and-see steps?"

Read the guide at `~/.claude/skills/ux-assignment-generator/SKILL.md` for writing rules and scoring, then save your assignments as JSON files in the folder `alignment-harness records ux-assignments` prints, using the JSON format documented in that file.

How to submit proposals: `${CLAUDE_PLUGIN_ROOT}/skills/how-to-submit-and-track-proposals/SKILL.md`

---

## 6. Checkin Title Format

Prefix your checkin with a title in green text:

```
★ Checkin ─────────────────────────────────────
```

Add in the title the minimum verbatim parts of the user request to directly remind the user what the task assigned from them to you was. If multiple domains happened, capture the verbatim (memory trigger) pieces in a short list.

Example:
> - Can you fix the admin bug that's making the canonical styles not render in EXACT_PATH

---

## 7. Memory Management

Ask yourself: should new memories be created? Did you actually learn things or create things which were unclear initially but critical to understand in order to perform your work efficiently? Or create things that future agents will have to retain in order to do their work efficiently?

If so, propose specific memories that you would like to save.

---

## 8. Intent Management

Did you become clear of the intended UX in a way that was not clear in the code you managed? Did the admin clarify its intent for the user (ignore admin features for this) in a way that is unique and new in this session? If so, propose distinct intentions to be added to IntentDB. Ignore any already logged.

### Intent Format — CORRECT vs WRONG

**WRONG** (too implementation-focused):
> When a user visits /hub, the suggested next step should render immediately without visual flash.
> Implementation: Onboarding state is computed server-side in /auth/me...

**CORRECT** (UX-intent focused):
> When the user lands on /hub, the first thing we aim to render is a prediction of the optimal next step for that user. We attempt to figure that out presently via checking all feature flags for which features they had adopted as well as funnel stage criteria which would predict the next step for states like not logged in etc.
>
> Then we aim to render the single highest likely next step based on what we believe will progress the user towards their next aha moment and eventually conversion if not yet converted, and if converted towards the next most impactful aha moment for sustained positive impact on their lives and long term retention.

The intent is about the **intended UX of a user**, not the implementation.

---

## 9. Skill File Proposals

If you designed specific tooling that requires agent memory during your session (rare) which agents will be unable to consume without that understanding, propose the creation of a skill file for that.

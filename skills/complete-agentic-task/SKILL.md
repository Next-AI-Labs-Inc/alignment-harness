---
name: complete-agentic-task
description: "Run the mandatory completion protocol before returning control. Use when finishing any substantive piece of work."
triggers:
  - "complete-agentic-task"
  - "task complete"
  - "work is done"
  - "finishing up"
---

# Complete Agentic Task

## Execution

Dispatch a **Sonnet subagent** to run this entire skill. The subagent:
1. Fills in every section below using the conversation context
2. Prints the completed template directly to the user
3. Files a compaction via `/compact-agentic-session` (`alignment-harness compaction put`) — or if a compaction already exists for this session, updates it with the work summary


### Admin Link (MANDATORY — post-completion)

When the subagent files a compaction via `/compact-agentic-session`, it MUST print the direct admin link after:

```
📎 $(alignment-harness records compactions)/session-{sessionId}.json
```

Replace `{sessionId}` with the actual session ID. This proves the compaction was persisted and lets the admin jump directly to it.


The parent agent should pass the subagent: the user's original request (verbatim), what was done, what files were touched, and any gaps.

### Go-live check (user-facing work — the PARENT agent does this, before dispatching the subagent)

If the work changes something a person sees or depends on, and a quiet break there would hurt
someone (payments, sign-in, signup, a modal or page people reach, an email they receive), put a
check for it on the go-live list so it is confirmed before every production launch — and so the
check carries the way back to you.

Run it yourself, from the folder you worked in, not from the subagent: the item records your
session id (`$CLAUDE_CODE_SESSION_ID`) and folder as its path back, and that is what lets a
coordinator — or the user's **Ask Agent** button on the go-live list page — wake YOU
when the check fails, with the context of the change still in your session. A subagent's id would
point at an agent that no longer holds that context.

Skip it, and say so in "My progress", when nothing user-facing changed or an existing check
already covers it. Pass the item's id and link to the subagent so the completion report names it.

## Template

You are about to complete some work product. Include the following in your response to the user.

Each section contains required reasoning and format. All communications must be:

- UX-first, intent-first, UX-impact, plain clear precise non-vague
- Translating the nuance of "when X then Y"
- Every sentence: immediately understandable, non-obscuring of actual constraints/nuance, all signal no noise
- Connecting the dots between intent and actuality
- Never using jargon to replace actual meaning
- Never obscuring the actual UX flow that results in impact
- Never using more words than required to trigger immediate full understanding

## Required Sections

```
You asked for
{specific verbatim quote of what was requested from user}

What I was working on
{aspect of user quote I just acted on}

My read of the overarching initiative
{If X is my intent, what's my best sense of what X serves, is designed to serve}

My read of your intent
{Exactly what I think your intent was, framed as the explicit change from present moment desired, specifically articulating only what the UX would actually change if I succeeded}

My progress
{What actually got done, vs what's incomplete, to be fully aligned with your verbatim words, in one sentence each}

Exact requirements I sensed you had
{each requirement — mark with X if unaddressed}
- [x] addressed requirement
- [ ] unaddressed requirement

How you could check it
{the exact simplest way the user can consume this work product — NEVER programmatic, NEVER "check logs", EVER — the UX simplest steps to see if this fulfilled its intent}
```

## Rules

1. **"You asked for"** must be a direct quote, not a paraphrase. Copy their words.
2. **"My read of your intent"** is about the UX delta — what changes for a human using the product. Not about code, files, or architecture.
3. **"My progress"** must be honest about gaps. One sentence per item. No padding.
4. **"How you could check it"** is always a human action in the product UI. "Open the app, click X, see Y." Never "run this script" or "check the DB."
5. If you cannot describe how to check it in the UI, that's a gap — say so.
6. Do not skip sections. Do not combine sections. Do not reorder.
7. **If your deliverable is a file in the intent vault** (`<api-repo>/docs/intent/`), open it in Obsidian for the user (if the person has an Obsidian vault; otherwise print the path):
   ```bash
   open "obsidian://open?vault=<their vault name>&file=PATH_RELATIVE_TO_VAULT_WITHOUT_EXTENSION&newtab=true"
   ```
   Example: `open "obsidian://open?vault=<their vault name>&file=proposed/LP-042-checkout-fix&newtab=true"`
   Do not include the `.md` extension in the URI.

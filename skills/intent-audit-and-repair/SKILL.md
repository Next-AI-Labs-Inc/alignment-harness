---
name: intent-audit-and-repair
description: Audit one component of the app for every intention living in its code, state each in plain language a non-programmer confirms on sight, determine whether each currently works, and repair what is broken so that every failure announces itself in the wild with a human-readable headline. Use when assigned a component, screen, function, or subsystem to make observable. Test-driven — the test comes before the change, always.
triggers:
  - "/intent-audit-and-repair"
  - "audit this component's intentions"
  - "make this observable"
  - "intent map for"
---

# Intent Audit And Repair

**You have been assigned ONE component. Do it completely.**

The job is four steps in strict order. Do not skip. Do not reorder.

1. **READ** every line of the component's code. Find every intention living in it.
2. **STATE** each intention in plain language the user confirms or rejects on sight.
3. **AUDIT** whether each one currently works, is broken, or cannot be determined.
4. **REPAIR** what is broken — test first — so every failure announces itself in the wild.

---

## What an "intention" is

An intention is **a promise the code is trying to keep to a real person.** Something it is
trying to make true for them.

It is NOT a description of mechanism.

| Right | Wrong |
|---|---|
| "When someone shares something meaningful in a session, it is kept so their coach can draw on it months later." | "crudHooks triggers vectorization on message create." |
| "Someone who has talked to us before gets a coach that speaks from what they already shared, so they don't have to re-explain themselves." | "memorySearcher returns top-k vectors above threshold." |

**Test before writing any intention:** could a smart person who has never seen code read this
sentence and tell you whether it's what they want? If no, rewrite it.

**Never use a variable name, function name, or file name as a substitute for meaning.** Code
references belong in a separate field as pointers — never inside the sentence that carries the
promise.

---

## THE LAW OF THIS SKILL — the log headline IS the plain sentence

This is the single thing that makes this work different from ordinary logging.

The plain-language sentence you wrote in step 2 becomes **the literal headline of the log
message** in step 4. Not documentation about the log. Not a summary next to it. The headline.

**Correct:**
```
"hey — we failed to include memory for an active user with user ID 9f0e1d. They have 38
stored memories and none reached their coach. They just got answered as if we'd never met them."
```

**Wrong — every one of these fails this skill:**
```
"userMemoryRetrieverChain returned empty"
"memory_injection_failed"
"[MemorySearch] availability check false, reason=no_user_id"
"Memory unavailable for conversation 9f0e1d"
```

The headline must:
- **address a human** — "hey" is fine, it is a person talking to a person
- **name the person affected** by their user ID
- **say what happened to them**, not what happened in the system
- be understood **on first read with no lookup**

Structured fields carrying IDs, counts, reasons, and file locations go alongside — they are
for querying. The headline is for understanding.

---

## TEST-DRIVEN — NON-NEGOTIABLE

**You are making things observable. You must never be the reason something breaks.**

The user's exact instruction: *"it's really important that every agent use TDD... you don't
want them to create something that could result in a bug or could break a system just to try
to make it observable."*

For every repair:

1. **Write the failing test first.** It must prove the failure is currently invisible or
   mislabeled. Run it. Watch it fail. A test that passes before your change proves nothing.
2. **Make the smallest change that turns it green.**
3. **Run the full test suite for that area.** Not just your test.
4. **Prove you did not change behavior** — the person's experience must be identical except
   that failures now announce themselves.

### Rules every repair obeys

- **Never gate the user's experience on observability.** If your logging throws, the person
  still gets their reply. Wrap every added log in try/catch that swallows its own failure.
- **Never add latency to a live request path.** Log synchronously and locally, or fire after
  the response is sent. Never await a network call to record a failure.
- **Never change what the person receives.** If your change alters output, you have exceeded
  this skill's scope — stop and report it.
- **Route to a sink that actually writes in production.** Verify the logging path you use is
  not gated off outside development. A log nobody can see is not observability.

If making something observable requires a change that risks behavior, **stop and report it
rather than proceeding.** Report the risk in plain language.

---

## Confidence on every load-bearing claim

Every claim that anything is built on carries a percentage.

- If you did not read the line that proves it, write **"unverified."**
- Distinguish "I read this" from "I inferred this from a name."
- **"CANNOT TELL" is a valuable answer.** Use it rather than guessing. A guess presented as a
  finding corrupts everything built on top of it.
- Never let a file name, function name, or comment stand in for reading the code.

---

## The trap that will corrupt this work

**Do not assume a component lacks logging because you did not see a call to a logger.**

In the codebase this skill was written for, `console.error` in the frontend is NOT silent — it is intercepted and
forwarded to the admin logs. Backend `logger.error` routes to the system log. Treating those
as gaps means "fixing" things that already work and missing the ones that don't.

**True silent failures are narrow:** empty catch blocks, catches that log nothing, early
returns with no log, swallowed promise rejections, and logs routed to a sink that is disabled
in production.

**Verify the sink, not just the emission.** A carefully written log that drains somewhere
disabled is invisible where it matters.

---

## Separate "the person chose this" from "we failed them"

A recurring and serious defect class: code that collapses several different causes into one
outcome, then labels them all with the most benign one.

Real example found in memory: four different causes — the person opted out, we could not
resolve who they are, they were not found in the database, they are a guest — all returned the
same shape and all got recorded as **"User has opted out."** Three of those are false. A person
the system failed was filed as a person who made a choice.

**Wherever you find this, it is a correctness repair, not a logging improvement.** The system is
stating something untrue about a real person. Fix the cause separation at the source, then make
each cause say what actually happened.

---

## Output — write ONE document

Write to the assigned path. Structure it exactly like the worked example below.

Required sections:
1. **The direct answer** — if a specific question was asked, answer it first, plainly.
2. **The thing that matters most** — the single most important finding, up top.
3. **All intentions** — table: the promise in plain language | state | recorded if it breaks?
4. **The failure sentences** — the actual headlines, in the user's register.
5. **What needs repair, in order.**

Mark work-in-progress code as **unwired, not dead.** Unused is not the same as dead — it may
be scaffolding. Never let it be removed without the user's confirmation.

---

# ═══════════════════════════════════════════════════════
# THE WORKED EXAMPLE — this is what correct output looks like
# ═══════════════════════════════════════════════════════

The following is the user-validated example. The user said of it: *"this is correct and the
document that you just produced is correct and the way you produced it is correct."*

Match this shape, this register, and this level of honesty about uncertainty.

---

## What Memory Promises A Person — and which promises are currently kept

**How it was produced:** three readers went through all 11,034 lines of the memory subsystem —
storing, retrieving, compacting. Nothing inferred from a file name. Every claim carries a
confidence number, and "cannot tell" appears where the code did not settle it.

### THE ANSWER TO YOUR DIRECT QUESTION

You asked: *"We have the intent of storing memories that are given time, extracting memories
that are given time, and including those in every session response if they exist — please
confirm whether that is working or broke."*

**Storing over time — WORKS.** 85%. Watches for new material, catches its failures, writes
them down with a note about the human impact.

**Extracting over time — PARTIALLY BROKEN.** 90%. Most of it is defensive and well-built. But
one extractor gives up silently by design — when the shape of the data doesn't match what it
expects, it returns nothing and says nothing. The file's own header comment records that this
exact behavior already broke production once.

**Including in every session response — BROKEN, and mislabeled when it breaks.** 88%.

### THE THING THAT MATTERS MOST

When a person's memory doesn't reach their coach, there are **four** different reasons, and the
code treats all four as the same thing:

| What actually happened | Is this a failure? | What the system records |
|---|---|---|
| They chose to turn memory off | No — we are honoring a choice | "User has opted out" ✅ correct |
| We couldn't work out who they are | **Yes — our plumbing failed them** | "User has opted out" ❌ **false** |
| They weren't found in the database | **Yes — something is wrong** | "User has opted out" ❌ **false** |
| They're a guest | Arguably intended | "User has opted out" ⚠️ misleading |

Verified by direct read, `gen3/memory/user-memory/userMemoryOptOut.js:18-67`, 95%.

**A person we failed is recorded as a person who made a choice.** The log doesn't merely miss
the failure — it reports it as consent. Any count of "how often do we fail to include memory"
is currently wrong in the direction of looking healthier than reality.

**And the worst case leaves no trace at all.** There is a recovery path that fires when the
search comes back empty *for someone we know has stored memories* — precisely "we broke our
promise to someone with history." Whether it recovers or fails, it writes only to the surface
that appears dark in production, or to a bare console line that never reaches the system log.
`userMemoryHelpers.js:377-450`, 88%.

### ALL 24 INTENTIONS (excerpt — storing and extracting)

| # | The promise to the person | State | Recorded if it breaks? |
|---|---|---|---|
| 1 | When someone shares something meaningful, it gets kept so their coach can draw on it later | WORKS 85% | Yes |
| 5 | The meaningful signal is pulled out of raw conversation rather than storing noise | **PARTIALLY BROKEN 90%** | **No — silent by design** |
| 7 | Total extraction failure is caught rather than crashing the session | **BROKEN 85%** | **No — logs only to a local list that is discarded** |
| 8 | A deep seven-part synthesis of a person can be produced | **NEVER RUNS 90%** | N/A — nothing calls it |
| 9 | Someone who has talked to us before gets a coach that speaks from what they already shared | **BROKEN 88%** | **No — dark in production** |
| 13 | Recent material is weighted over old material | **CANNOT TELL 60%** | Unverified |

**On #8:** 190 lines, fully built, zero callers anywhere. Flagged as *unwired*, not dead. Unused
is not the same as dead — this may be scaffolding. **Do not let anyone remove it without the user's
confirmation.**

**On #13, stated honestly:** whether this runs at all depends on a storage-mode switch whose
production setting was not verified. Not guessed at.

### THE FAILURE SENTENCES

**For #9, the central one:**
> "hey — we failed to include memory for an active user with user ID {X}. They have {N} stored
> memories and none reached their coach. They just got answered as if we'd never met them."

**For #10, which must stop lying:**
> "hey — we skipped memory for user ID {X} because we could not work out who they are. This is
> not an opt-out. Our plumbing failed this person."

**For #5:**
> "hey — we stored a session for user ID {X} but pulled no meaningful signal out of it. The
> shape of their data did not match what the extractor expected. Their material is saved but
> effectively empty."

### WHAT NEEDS REPAIR, IN ORDER

1. **Separate the four causes** so a person we failed is never recorded as having chosen. This
   is a correctness repair, not a logging one — the system currently states something false
   about a real person.
2. **Route failure logs to the surface that writes in production.**
3. **Detect empty summaries** before they are saved and used.
4. **Make the silent extractor speak** when the data shape doesn't match.
5. **Confirm unwired code is intended scaffolding** before anyone treats it as dead.

# ═══════════════════════════════════════════════════════
# END WORKED EXAMPLE
# ═══════════════════════════════════════════════════════

---

## Before you report done

- Every intention stated in language a non-programmer confirms on sight
- Every load-bearing claim carries a confidence percentage
- Every "cannot tell" is honest rather than a guess dressed up
- Every failure headline addresses a human and names the person
- Every repair has a test that failed before your change and passes after
- The person's experience is unchanged except that failures now announce themselves
- Anything unwired is flagged as scaffolding, never deleted

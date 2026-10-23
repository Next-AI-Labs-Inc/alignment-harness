---
name: intent
description: "How to write intent statements that a human can validate without guessing. Use when writing intent statements, testable contracts, scope declarations, or any documentation that describes what the system does or what a person experiences. MUST be consumed before writing to the Intent DB, before creating verification contracts, before writing journey documentation, or before any /declare-scope."
triggers:
  - "write intent"
  - "articulate intent"
  - "intent statement"
  - "how to write intents"
  - "testable contract"
---

# How to Articulate Intent

## Why This Skill Exists

Agents write intent statements that force humans to guess. A statement like "the extraction fires every 5 messages" sounds precise but leaves out which messages are counted, what "fires" means, what happens when it doesn't fire, and whether this behavior is intentional. The human reading it has to fill those gaps from their own imagination — and if they guess wrong, every decision built on that guess compounds the error. That's hallucination, and it starts in documentation, not in code.

This skill exists to make every intent statement self-validating: a human reads it and can immediately say "yes that's right" or "no that's wrong" without needing to look at the code or ask a follow-up question.

## The Two Types of Intent

### System Intent

Describes what the system does — the mechanics, the conditions, the behavior. Written for a human who needs to confirm whether the system should work this way.

**Format:**

> When {every condition that must be true, described as what's happening in the person's experience, not as variable names} then {the specific system responsible, named as what it does not what it's called} should {the exact behavior, described as its effect on the person's experience}

### UX Intent

Describes what the person experiences — what they see, feel, encounter. Written for a human who needs to confirm whether this is the right experience.

**Format:**

> When {every condition that must be true, described as what the person has done or what state they're in} then {the person in this moment} should {exactly what happens for them, with the precision of the code but in human terms}

## The Critical Distinction

System intent and UX intent describe the SAME behavior from two angles. System intent says what the machine does. UX intent says what the person experiences because of what the machine does. Both must be precise. Neither can drop constraints.

The system intent for a feature might say: "When the coach has replied and the person has sent exactly 5, 10, 15, or 20 messages (counting only their messages, not the coach's replies or system notifications), the vision capture system should silently analyze the last 10 messages and extract what the person is working toward."

The UX intent for the same feature says: "When a person has exchanged about 10 messages back and forth with the coach (their 5th message), the system should quietly capture what they're longing for and what they envision for themselves — they won't see anything change, but the next time they hit a session limit, this captured vision will be reflected back to them."

Both are precise. Both are complete. Neither uses variable names as substitutes for meaning. The system intent tells you HOW it works. The UX intent tells you WHAT THE PERSON GETS.

## Wrong vs Right — System Intent

### WRONG:
> When a person sends any message and the assistant replies, the `conversationsController.js:1889` adds a job to `aiSalesPitchQueue` — this fires on EVERY assistant response, for ALL user types (guest, trial, free, paid), with no pre-filter

**Why it's wrong:**
- `conversationsController.js:1889` means nothing to the reader — it's a line number, not a behavior
- `aiSalesPitchQueue` is an internal name — the reader doesn't know what this queue does
- "adds a job" is implementation detail — the reader needs to know what HAPPENS, not what gets queued
- "fires on EVERY assistant response" — the reader can't tell if this is intentional or a bug
- The reader has to guess: is this a problem? Is this by design? What does it mean for the person?

### RIGHT:
> Every time the coach replies to someone — whether they're a guest who just arrived, someone on their free trial, or a paying member — the system quietly checks whether it has enough of their words to build a picture of what they're working toward. This happens after every single reply, no exceptions. The check itself doesn't always run the extraction (that only happens once the person has sent their 5th, 10th, 15th message), but the system is always listening for the right moment. This is intentional — we want the system ready to capture the moment enough signal exists, regardless of who the person is or what plan they're on. (`conversationsController.js:1889` queues this check via the vision capture system)

**Why it's right:**
- Describes what happens to THE PERSON (the coach replies)
- Names the behavior in human terms (checks whether it has enough words)
- States whether it's intentional ("This is intentional — we want...")
- Includes ALL users without using tier names as substitutes
- The code reference is a pointer at the end, not the explanation itself
- The reader can immediately say: "yes, that's what I want" or "no, I only want this for free users"

## Wrong vs Right — UX Intent

### WRONG:
> When the user's message count reaches the VISION_REFRESH_INTERVAL threshold, the salesPitchObject is generated and saved to the conversation document.

**Why it's wrong:**
- "VISION_REFRESH_INTERVAL" is a variable name standing in for its meaning
- "salesPitchObject" is jargon — the reader doesn't experience a "sales pitch object"
- "conversation document" is a database concept, not a user experience
- No indication of what the person sees, feels, or encounters
- No indication of what happens if it fails

### RIGHT:
> When a person has sent their 5th message to the coach (counting only their own messages — the coach's replies and any system notifications don't count toward this), the system silently reads back through their last 10 messages and extracts what they're longing for, what they want, and what they envision for their future. The person doesn't see anything happen — their coaching continues without interruption. But behind the scenes, a picture of their inner world has been captured, and it will be shown back to them at the moment they're most likely to act on it. If the extraction fails for any reason — the AI returns an empty response, the prompt template is missing, the response can't be parsed — nothing bad happens to the person. Their coaching continues. But the captured vision never gets saved, which means the conversion moment downstream will never fire for this conversation. The system fails silently, and the person coaches for free indefinitely without ever seeing the personalized pitch that was supposed to reflect their own words back to them.

**Why it's right:**
- Describes the trigger in terms of what the person has DONE (sent their 5th message)
- Clarifies the counting rule without using the variable name
- Describes what the system captures in emotional terms (longings, wants, vision) not data terms (salesPitchObject)
- Describes what the person EXPERIENCES (nothing — it's silent)
- Describes the PURPOSE of the capture (shown back at the conversion moment)
- Describes every failure mode and its downstream consequence
- A human reading this knows exactly what to validate

## When to Use Each Type

| Writing for... | Use... | Because... |
|---|---|---|
| Intent DB entries | UX intent | The human validates whether the EXPERIENCE is right |
| Verification contracts | System intent | The system validates whether the BEHAVIOR is right |
| Journey documentation | Both, woven together | The human needs to see both what happens and why |
| Scope declarations | UX intent | The scope is about what changes for the person |
| Test descriptions | System intent | Tests verify specific behavioral conditions |
| Commit messages | System intent | Developers need to know what changed in the system |
| Proposals to the user | UX intent first, system intent as supporting detail | The user decides based on experience, not mechanics |

## Rules

1. **Variable names are pointers, not substitutes.** You can include `salesPitchObject` in parentheses after explaining what it IS — but you cannot use it AS the explanation. "The system captures their vision (saved as `salesPitchObject`)" — yes. "The `salesPitchObject` is generated" — no.

2. **Every statement must make clear: is this intentional?** If you're describing existing behavior, say whether it's by design or accidental. "This is intentional — we want X" or "This appears unintentional — the system does X but the likely intent was Y."

3. **Every constraint must be stated.** If the code checks 4 conditions before something happens, all 4 appear in the intent statement. Dropping one is not simplification — it's a lie.

4. **Failure modes are part of the intent.** What happens when the thing DOESN'T work is just as important as what happens when it does. Silent failures are especially critical because the person doesn't know something went wrong.

5. **Sequence matters.** Events unfold in order. The statement should follow the same order the person experiences them, not the order the code executes them.

6. **The reader should never have to guess.** If reading your statement requires the reader to fill in any gap from imagination, the statement is incomplete. Guessing is hallucination.

## Feedback Loop

If you find this skill doesn't cover a case you're facing — a type of intent statement that doesn't fit either format, a situation where the rules conflict — state what you're trying to articulate, what format you tried, and why it didn't work. This skill is v1 and will evolve.

## Composability

This skill is consumed by:
- `/intent-lifecycle` — before writing any intent
- `/declare-scope` — before decomposing scope into testable statements
- `/verification-contracts` — before writing verification conditions
- `/intent-db` — before proposing or writing intent entries
- `/proof-its-fixed` — when writing the narrative section of evidence packages
- Any journey documentation in the intent vault

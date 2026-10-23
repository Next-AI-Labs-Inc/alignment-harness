# Understanding loop (what's added to each of your messages)

## What it's for
Every message you send goes to the agent with a small set of additions whose job is to make the agent start from YOUR meaning rather than its guess:
- your words wrapped in a `<user-message>` tag, so the agent always knows which part of the turn is you and not system noise;
- the coherence ritual (see [coherence-gate.md](coherence-gate.md));
- the task's current risk score, or "not scored yet" with a provisional keyword hint;
- "state your understanding first" questions: what you're asking for, what the result should be for a person, the motive behind it, who is affected, and which assumptions need checking against reality;
- a nudge to turn your stated requirements into tracked tasks, in your own words;
- for scored work, a nudge to write a verification contract ("When …, then …" + a runnable check each);
- if you say you don't understand the agent ("what are you talking about?"), an instruction to run `/calibrate` before replying;
- optionally, a few snippets from your past sessions and notes (memory search).

It also keeps a copy of each of your messages, word for word, on your machine. When a long conversation is compacted, those messages are put back in front of the agent with an instruction to re-read them — summaries lose nuance; your words don't.

## Is it set up?
On by default. Memory search is off until you turn it on (it reads your past sessions, so it asks first).

## How to set it up
Switches (`understanding.*`): `markHumanMessage`, `calibrateOnConfusion`, `injectAlignmentQuestions`, `injectTaskTracking`, `injectVerificationContract`, `captureMessagesVerbatim`, `rehydrateAfterCompaction`, `memorySearchCommand`. Short acknowledgements ("ok", "thanks") skip all of it.

## Is it working?
- Saved messages: `alignment-harness paths` → "verbatim messages" folder; one file per session.
- After a compaction the agent should restate what you're trying to achieve and anything the summary dropped.
- The local log records `UserPromptSkipped`, `ConfusionSignal`, `MemorySearch` and `VerbatimRehydrated` events.

---
name: session-reminder
description: Reflect-style pass over a session's human messages that produces the session's killer title plus its full structured reminder — the artifact the sessions list shows on hover so the human remembers EXACTLY what the session was about. Copied from /reflect and restructured so its output is machine-consumable by the DSH session-reminder pipeline.
triggers:
  - "/session-reminder"
  - "remind this session"
  - "killer title"
---

# Session Reminder — /session-reminder

Copied from `/reflect` and restructured for one job: given a session's human messages, produce the title and reminder that make the session instantly recognizable weeks later.

**The title is not a summary category. It is the memory hook.** "Killer" means: the human reads it and is transported back into exactly what this session was dedicated to. Use their own vivid phrasing verbatim whenever it carries the dedication — including profanity when it is load-bearing ("not some truncated" is a requirement statement, not noise). Never sanitize into corporate generality. Length is uncapped: take the words the dedication needs, no more.

## Input

A JSON array of the session's human messages: `[{"seq": 2, "text": "..."}, ...]`.

## Method (from /reflect, compressed)

Work through target → location → gap → initiative → leverage mentally, then emit only the output contract. What the human stated they wanted IS the target. Noise is worse than silence — drop any field you cannot ground in the messages rather than inventing it, but NEVER drop a verbatim requirement.

## WHO IS ASKING DECIDES THE FORMAT (the user directive, 2026-10-07 — ALWAYS applies)

**When the user runs `/session-reminder` in chat — no JSON array of messages passed in — print the
reminder CONVERSATIONALLY, in the user's voice (see `/how-to-talk-like-the-founder`). Never print JSON to the user.**
The user's words: "print conversationally, not in json ... so this always happens."

Conversational shape: the killer title on its own line first, then the same fields as flowing sentences
instead of keys — what the session is dedicated to, where it stands, the gap, the user's verbatim phrases quoted
in the user's own words (profanity/typos as-is when load-bearing), and the shortest path forward. Omit any part you
cannot ground in the user's messages. Gather the human messages yourself from the live conversation.

**Only when a program calls this skill and hands it the JSON array of messages (see Input) do you emit the
strict JSON below.** If you cannot tell who is asking, the default is conversational.

## Output contract — MACHINE CALLERS ONLY (strict JSON, one object, no prose around it)

```json
{
  "title": "The killer title. Any length. Human's voice, verbatim anchors preferred. States the dedication, not the topic bucket.",
  "dedication": "1-3 sentences: what this session is dedicated to, in UX/intent terms — the thing the human is trying to GET.",
  "whereItStands": "1-2 sentences: where the work stands against that dedication right now (from /reflect's location).",
  "gap": "1-2 sentences: the gap being navigated — omit if not yet visible.",
  "anchors": ["verbatim phrases from the human, in priority order — the ones that would re-trigger the memory instantly. Include profanity/typos as-is when load-bearing."],
  "next": "1-2 sentences: the shortest path forward from here — omit if the session read as complete."
}
```

## Rules

1. For machine callers: output ONLY the JSON object. No markdown fence, no commentary, no quotes around the whole. (For the user in chat, see "WHO IS ASKING DECIDES THE FORMAT" above — conversational, never JSON.)
2. `title` and `anchors` are mandatory; every other field is omissible when ungrounded.
3. Use the language of the messages.
4. Do NOT leave out actual verbatim requirements — if the human stated a hard constraint, it appears in `anchors` or `dedication`.
5. The title reads like how the human talks to the agent, not like a ticket name. Compare: "DSH session list: convo-scraped killer titles + full-screen hover reminders — no truncated" beats "Session title UI improvements".

---
name: calibrate-understanding
description: "First-session calibration: the harness starts with no understanding of a new person, so it offers, once, to build some from what is already on their machine. With their yes, a low-cost model (Haiku) writes one structured note per past session (what they were after, corrections, leans, decisions, their words for things, every quote checked against what they really said), the notes become one map the agent reads at each session start, and, as a separate yes, the plans and memory notes already written on the machine are indexed. Use when the session-start note hands you a <calibration-offer>, when the person asks you to calibrate, prime or learn from their past sessions, or asks what the harness knows about them."
triggers:
  - "calibrate to me"
  - "learn from my past sessions"
  - "self-priming"
  - "what do you know about me"
  - "index my plans"
---

# Calibrate understanding: the first-session offer

The harness is weak for a stranger when it starts with no understanding of them. This skill is how it gets some on day one: not by searching their old sessions on every message (Claude Code already does that), but by turning what is on their machine into structured understanding the harness reads from then on.

Everything runs through one command, `alignment-harness calibration <step>` (if that name is not found, use the full path the session-start note gave you). Every step fails soft: if one errors, say so in one sentence and carry on with the person's work.

## 1. Make the offer (once)

The harness asks the person at most **one open question per reply**, in a fixed order, each only if it applies: first calibrating, then indexing their plans and notes, then keeping their sessions longer. It hands you each one inside `<calibration-question id="…">` and records which one is open, so the person's next answer, even a bare "yes", is attributed to that one only. Record every answer with `alignment-harness calibration answer yes|no` (or `later` for calibrating). Its output tells you what happened and hands you the next question, if any, for the end of that same reply. The questions chain without a gap. Never ask a harness question the harness hasn't handed you. The next question arriving in that command's output is expected: it is the next step of the same setup the person is answering, announced here and in the harness's own context before the answer, so show it as written.

An answer only counts for a question the person was actually shown. When their next message arrives, the harness checks your previous reply for the question's exact words. If they aren't there, nothing is recorded, and the question is handed to you once more, to show this time. So show each question in full, word for word. Each question after calibrating is the next question of the setup they started when they answered the calibration offer, whatever they answered: their own answer led to it, and you ask it, you don't act on it. Ask it plainly; if it helps, say in a few words that it's the next setup question. No commentary about commands or tool output is needed.

If the person says a bare "yes" or "no" while no harness question is open, don't guess what it answers, and don't run any calibration command for it. Ask them plainly, in one short sentence, what they are saying yes (or no) to.

Put each question at the very end of your reply, after anything urgent they asked for and after any summary of your own work, with nothing after it. Never put it in the middle of work in progress. For the calibration offer (`<calibration-question id="calibrate">`): The words to show are inside an `<offer-text>` element. Write them in your reply exactly as they are, as your own message. **They must not be paraphrased, summarized, shortened or described instead of shown.** The tags are an envelope for you only: never write them, and never add a heading, label, divider or marker line of your own around the text. The first paragraphs are the harness author's own words, and the facts under them were computed on this machine just now: how many sessions there are and how far back they go, the cost, and what is saved where. You may add one short line of your own after it. To print the same text again: `alignment-harness calibration offer-text`.

The facts say how far back their history really goes. Claude Code deletes sessions older than its `cleanupPeriodDays` setting (30 days by default), so a person with years of use may still have only a month of sessions. Never imply there is more.

Read none of their history before they answer. If they don't answer, or move straight on, do nothing: it is offered once more next session, then never again.

## 2. Act on their answer

**Yes, or a number** ("yes", "do 50", "go"):
1. `alignment-harness calibration answer yes`
2. Start `alignment-harness calibration run --sessions <their number, default 200>` **in the background** (Bash with run_in_background), and keep working on whatever they asked for.
3. When it finishes, tell them in plain words how many sessions were noted, what it cost, and two or three of the strongest leans from the map (`alignment-harness calibration context` prints it), each with where it came from. Ask them to correct anything that reads wrong.

**"Show me a sample first":** `alignment-harness calibration sample`. It makes one note from the single most useful session with one small model call, and prints it as plain sentences: what they seemed to be after, where they corrected the agent, what they lean toward, and what they decided, each with their own words quoted. Show them that text as it is, then ask again. The sample isn't part of their calibration; its structured version is kept in the harness's state folder. `--dry-run` shows exactly what text would be sent, with no model call.

**"Only grab understanding from conversations about x":** add `--about "x"` to `sample` and `run`. Only sessions where their own messages mention it are read. Several words separated by commas match any of them.

**No, or skip** (the offer ends "Say yes, ask for a sample first, or no to skip it."): `alignment-harness calibration answer no` (`skip` means the same). Say that's fine and carry on. Calibration is never offered again; they can still ask for it any time.

**Later:** `alignment-harness calibration answer later`. "Later" means not now, so it pauses everything: no plans or keep question for the rest of the session. Calibrating is offered once more in a later session.

**The plans and notes (`<calibration-question id="plans">`, handed to you with the calibration answer):** this asks whether to index the plans and memory notes already on their machine. On yes, `alignment-harness calibration answer yes` indexes them and prints what it found; tell them in a sentence or two. No model is used, it's free, and the files themselves are never changed. On no: `answer no`.

**Keeping sessions longer (`<calibration-question id="keep">`, handed to you with the plans answer):** this exists only if the `calibration.offerLongerHistory` switch is on, and only when Claude Code keeps their sessions for less than a year. On yes, `alignment-harness calibration answer yes` backs up their settings file, then changes Claude Code's `cleanupPeriodDays` and nothing else, down to the file's text. On no: `answer no`. Never change the setting any other way.

A question the person doesn't answer is closed after a few messages and is not asked again. Calibrating is the exception: it is offered once more in the next session.

## 3. What gets made, and where

All of it lives in the harness's own data folder, under `records/calibration/` (`alignment-harness calibration status` prints the path), and nothing there is uploaded anywhere. To make each note, the text of that one session is read by Haiku, the same way Claude reads their conversations now.

- `sessions/<session id>.json` holds one note per session, in /reflect's shape: target, initiative, location, gap, corrections (what the agent believed, what they meant, the lean, why), preferences (situation, lean, strength, why, when it might not apply), decisions, their vocabulary, open questions, the model's confidence, and a pointer back to the exact transcript and message time. A quote is kept only if it is the person's exact words; otherwise it is removed and the item is marked as a paraphrase. Every note says `status: unconfirmed`.
- `understanding-map.md` is the map: what they usually work toward, leans to weigh (strongest first, with how many sessions show each), corrections they have had to make, their words, and what is still unclear. Quotation marks survive only around words that really are theirs.
- `plans/<id>.json` holds one index entry per plan or memory note: title, path, headings, an excerpt.

The selection is cheap and uses no model. It scores the newest few hundred sessions on recency, how much the person wrote, and how many corrections, decisions, stated preferences and understanding checks they hold. Sessions with fewer than two messages from the person, and sessions a script started, are left out. `alignment-harness calibration estimate` shows the picks, with the reason for each, and the cost.

## 4. How you use it afterwards

- At every session start the top of the map is handed to you inside `<calibration-understanding>`. Read it before your first understanding check. Weigh the leans against what the person says now; their own words this session always win. When a lean shapes what you do, say so in a few words ("you've leaned toward X before, so I…"), so they can correct it right there.
- The memory search (agent_find) finds every note and plan entry, so a question like "how do they want X" is answered with the source session.
- These are priors, not facts. A lean from one session is a slight lean. Never present one as something they told you today.

## 5. Going further, and undoing it

"Just ask if you want me to go further" means, for example: run on more sessions (`--sessions 500`), a focused pass on one topic (`--about`), re-run on newer sessions later (it skips sessions already noted, so it only pays for new ones), or `alignment-harness calibration map` to rebuild the map after notes change.

- `alignment-harness calibration prime off` stops handing the map over at session start.
- `alignment-harness calibration forget` shows what it would delete; with `--yes` it deletes the notes, the map and the plan index. Their own sessions, plans and notes are never touched. Ask before running it with `--yes`.

## If something goes wrong

- If Claude Code can't be reached, or the sign-in has expired, the run stops after three failed sessions and says why. Tell them, and suggest they run it again after signing in. Nothing else is affected.
- Spending is capped at five dollars per run by default (`--max-usd` changes it), and the run stops if the cap is reached.
- Any error: one sentence to the person, then back to their work.

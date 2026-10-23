# First-session calibration

## What it's for
The harness starts knowing nothing about a new person, and that makes it weak for a stranger: every intent has to be worked out from scratch. So on the first session it offers, once, to calibrate. With a yes, a low-cost model (Haiku) reads the person's most useful past Claude Code sessions and writes one structured note for each: what they were after, where they corrected the agent, what they lean toward, what they decided, and their words for things. The notes are then combined into one map that the agent reads at the start of every session. A second offer, which needs its own yes, indexes the plans and memory notes already written on the machine.

This is about structured understanding. Searching old sessions on demand is something Claude Code already does on its own.

## What the person sees
In the first session, the agent's first reply (after anything urgent) carries the offer, word for word from `prompts/calibration-offer.txt`. The hook hands it to the agent inside an `<offer-text>` envelope, with no marker lines it could echo. The offer is followed by facts computed on their machine: how many sessions and projects were found and their date range, the estimated cost, how long it takes, where the result is kept, and how many plans and notes could be indexed. The choices are:

| They say | What happens |
|---|---|
| yes, or a number | `calibration answer yes`, then `calibration run --sessions N` (default 200) in the background; the agent keeps working and reports when it's done |
| show me a sample | `calibration sample`: one note from the single most useful session, one small model call, shown as plain sentences with their own words quoted; not added to the calibration (its JSON is kept in `state/calibration-sample.json`) |
| only conversations about x | `--about "x"` on sample and run: only sessions where their own messages mention it |
| yes to plans and notes (asked right after the calibration answer) | `calibration answer yes` while that question is open: indexes them; no model, free, makes them findable by the memory search |
| yes to keeping sessions longer (asked right after the plans answer, only when that switch is on) | `calibration answer yes` while that question is open: sets Claude Code's `cleanupPeriodDays` to `calibration.longerHistoryDays` (365), backing up their settings first and changing only that value in the file's text |
| no to plans, or to keeping sessions longer | `calibration answer no`: not asked again |
| no, or skip | `calibration answer no` (`skip` is the same): calibration is never offered again |
| later | `calibration answer later`: pauses everything, with no further setup question this session; calibrating is offered once more in a later session |
| nothing / moves on | offered once more next session, then never |

## One question per reply
The person is asked at most one open question per reply, in this order, each only if it applies: **calibrate**, then **index plans and notes**, then **keep sessions longer**. The agent is handed only the next pending question, inside `<calibration-question id="…">`. The calibration offer comes at session start. Each later question comes in the output of `calibration answer` for the previous one, for the end of that same reply. The questions chain without a gap, so there is never a reply in between where a bare "yes" would answer nothing. The harness records which question is open in `state/calibration.json`, and while it's open, each message carries a reminder of which one it is. `calibration answer yes|no` records the answer against that question and nothing else, so a bare "yes" can only ever mean the open question. Answering plans or keep with yes acts at once: it indexes the files, or changes the one setting.

**An answer counts only for a question the person was shown.** When the person's next message arrives, the harness reads the agent's previous reply from the transcript. Only if that question's exact words are there does it allow `calibration answer` to record anything for it. If they're missing, the question is closed with nothing recorded and handed to the agent once more, to show in the next reply. If it's missing again, it's closed for good, still with nothing recorded. If the transcript can't be read, nothing is recorded. Questions after calibrating are handed over as the next question of the setup the person started when they answered the calibration offer, whatever they answered. The agent is told plainly that it asks the question and does not act on it, and is free to say in a few words that it is the next setup question. Nothing in the hand-over asks it to hide anything: a hidden instruction inside a command's output reads as an injection, and the agent rightly refuses it. The current message is found by position in the transcript (a person message with no agent text after it), not by its words, so two identical answers in a row ("yes", "yes") cannot make the check read the wrong reply, and background-task notices neither count as messages nor split a reply.

If the person says a bare "yes" or "no" while no question is open, the agent is told not to guess, and to ask plainly what they are saying yes (or no) to.

A question the person doesn't answer is closed after three of their messages and isn't asked again (calibrating is offered once more next session), and nothing new is pushed in that session.

## How far back their history goes
Claude Code deletes session transcripts older than its `cleanupPeriodDays` setting (30 days by default) every time it starts. In the sealed test room, 30 sessions became 6 after one ordinary conversation. So the offer says plainly how far back the history goes. When the oldest session is within about 10% of that limit, it also says why: "Claude Code keeps sessions for 30 days by default, so I found 12 from the last month". When the history starts well inside the limit (they began using Claude Code later), it says only what it found: "I found 30 past sessions across 1 project, going back to May 4, 2026". Sessions already past that limit aren't counted or picked, because Claude Code is about to delete them.

The harness never changes that setting on its own. It can offer to raise it, but only when the `calibration.offerLongerHistory` switch is on. That switch is on by default; set it to false to never ask. With the switch on, a self-contained question is asked on its own, never inside the calibration offer, so one "yes" can never mean both: "Claude Code deletes sessions older than 30 days by default. If you'd like more to calibrate from later on, I can change that so it keeps them for 365 days. I'll only change it if you say yes, and you can change it back any time." When the person has their own setting, the first sentence names it instead.

It is the third question in the one-question-per-reply order (see above). It comes at the end of the reply that records the plans answer (or the calibration answer, when there are no plans), whatever the answers were. It is asked only when Claude Code keeps sessions for less than `calibration.longerHistoryDays`, and once ever.

Only a yes leads to `calibration keep-history --yes`. That refuses a settings file that isn't valid JSON, and backs up the previous file. If the setting already exists, only its number changes in the file's text; otherwise one line is inserted as the first key, in the file's own indentation. It then checks that the new text parses to exactly the old settings plus that one value, and says what it changed.

## Cost
Shown before anything runs. Per session, the model reads at most 16,000 characters of the person's own words, plus about 1,200 tokens of instructions and overhead, and writes about 1,000 tokens. At Anthropic API list prices as of 2026-10, that's between 20 cents and about two dollars for 200 sessions. The range exists because the `haiku` alias resolves to Haiku 5.5 on newer Claude Code and Haiku 4.5 on older versions. On a Claude subscription it counts toward plan usage instead of being billed. The real cost of each call is recorded: per session in its note, and in total in `state/calibration.json` (session notes, map and samples separately; the map is a model call of its own, about 40 seconds). `calibration status` shows what has been spent. Each run is capped at five dollars (`--max-usd`). In the sealed room, with real Haiku, 10 sessions took 47 seconds and cost about 1 cent.

## How sessions are picked
There's no model involved in picking. The newest max(3×N, 300) top-level transcripts in `~/.claude/projects/*/` are scored (2,000 when `--about` is used). Subagent transcripts in subfolders are never read. Each session is scored on:
- recency (the weight halves every 45 days)
- how much the person wrote
- corrections ("no,", "that's not", "I meant", "instead", …), counted double
- decisions ("let's go with", "approved", "ship it", …) and stated preferences ("I prefer", "from now on", …)
- understanding checks the agent printed (COHERENCE_CHECK, AGENT_REFLECTION, …)

Sessions with fewer than two messages from the person, and sessions a script started (`claude -p`, the SDK), are left out. `calibration estimate` lists the picks with the reason for each.

## What the model is given, and what it writes
A script, not a model, pulls out the session first. It keeps every one of the person's messages verbatim, prioritizing corrections, decisions and preferences when the session is long. Before each message it adds the agent's last words, shortened. Text injected by tools or hooks is removed. The model (`claude -p --model haiku` with no tools, no hooks, no plugins and no saved transcript, so these calls never show up later as past sessions) answers with one JSON note in /reflect's shape. Its instructions are in `prompts/calibration-session.txt`.

Before saving, every quote is checked against the person's real words in that session. A quote that isn't their exact words, in order, is removed and the item is marked as a paraphrase. A wrong message reference is corrected. Every note is `status: unconfirmed`.

The map (`prompts/calibration-map.txt`) is written from all the notes. Quotation marks survive in it only around words that are verified quotes. If the map step fails, a plain list of the leans and corrections is written instead, labelled as such.

This follows the lesson recorded in the instinct-harvest skill: leans with their situation, reason and source, never bare facts or rules, and never a summary standing in for the person's words.

## Where it lives
- `<data folder>/records/calibration/sessions/<session id>.json`: one note per session
- `<data folder>/records/calibration/understanding-map.md`: the map
- `<data folder>/records/calibration/plans/<id>.json`: one index entry per plan or memory note (title, path, headings, excerpt). Searched in `~/.claude/plans`, in `docs/plans`, `docs/superpowers/plans`, `docs/specs`, `plans` and `.claude/plans` of the current repo and of any repo listed in `agent-find.json`, and in Claude Code's memory folders (`~/.claude/projects/*/memory`)
- `<data folder>/state/calibration.json`: the decision, how many times it was offered, and the last run

Nothing is uploaded anywhere. Uninstalling the plugin removes all of it.

## How the harness reads it
- **Session start:** a separate SessionStart hook (`hooks/calibration-offer.js`) hands the agent the top of the map inside `<calibration-understanding>`, framed as leans to weigh and never as rules. `calibration prime off` turns this off.
- **Memory search:** the built-in agent_find search already reads everything under `records/`, so notes and plan entries come up with their source.

## Is it working?
`alignment-harness calibration status` shows the decision, how many notes exist, the last run (noted / nothing to learn / skipped / cost / why it stopped), whether the map exists and is read at session start, and how many plans are indexed.

## Commands
```
alignment-harness calibration status
alignment-harness calibration offer-text                 # the exact offer, with this machine's facts
alignment-harness calibration estimate [--sessions N] [--about "x"]
alignment-harness calibration sample [--about "x"] [--dry-run]
alignment-harness calibration run [--sessions N] [--about "x"] [--dry-run] [--redo] [--concurrency 3] [--max-usd 5]
alignment-harness calibration map                        # rebuild the map from the notes
alignment-harness calibration plans [--dry-run]
alignment-harness calibration answer yes|no|later           # the person's answer to the one open question (skip = no)
alignment-harness calibration decide yes|no|later|keep-no   # set a decision directly, without an open question
alignment-harness calibration prime on|off
alignment-harness calibration keep-history --yes [--days N]  # only with the switch on and the person's yes
alignment-harness calibration context                    # what the agent is handed at session start
alignment-harness calibration forget [--yes]
```

## The evidence gate and calibration turns
The harness's Stop gate (the "prove it" check) leaves alone any turn whose only commands were the harness's own (`calibration`, `attest`, `score`, `status`, records and so on, plus text-only helpers like `| tail`) and which edited no files. There is no work to prove in it, and holding it made the agent answer the gate in front of the person. A turn with an edit, any other command, or a tool that can act is checked as before. So an edit followed by only a score command and "all tests pass" is still held.

## Fail-open
The hook is wrapped like every harness hook: any error and the session simply starts. The commands print one plain sentence on failure and touch nothing outside the data folder. If the model can't be reached (no Claude Code, or an expired sign-in), a run stops after three failed sessions and says why. A run that's already partly done resumes without paying twice.

## Tested by
`node plugin-dev/tests-smoke/calibration-test.js`, which uses a made-up `~/.claude/projects` folder and a fake model (no real transcripts, no model calls).

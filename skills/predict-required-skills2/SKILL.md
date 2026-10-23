---
name: predict-required-skills2
description: "Predicts the skills a scope needs from what agents ACTUALLY did in 632 past sessions. Queries the Skill Pattern Oracle v3 notebook (<your-notebook-id>) — ONE merged JSON document holding every session's skill invocations with each agent's own in-the-moment reasoning for why it reached for that skill. Fully automatic end to end: agent prints a 🔥 annotation at each Skill invocation → SessionEnd runs scrape-fire-annotations.js → it rebuilds the merged corpus and replaces the notebook's single source. No manual upload, no user step. Invoke at the start of any distinct scope to get the skill sequence, in order, grounded in cited precedent."
triggers:
  - "what skills should I invoke v2"
  - "predict skill sequence v2"
  - "predict-required-skills2"
  - "skill oracle programmatic"
---

# Predict Required Skills v2

Same purpose as v1: produce a mandatory skill sequence from historical patterns. **What's different in v2:** the corpus is built programmatically from live transcripts via 🔥 annotations — no dependency on the user running manual session compactions.

## Why v2 exists

v1 reads `compaction.compactedSession` text and scans for `/skill-name` mentions. That only works when sessions get compacted — which depended on the user invoking the user's custom compaction skill manually. The user's not running it as part of the user's flow anymore. So v1's corpus has been silently undercounting real skill invocations since the compaction pattern broke.

v2 reads the Claude Code transcript JSONL files directly — every assistant message is captured by the harness automatically — and extracts only the canonical 🔥 annotations. No agent compliance beyond printing the canonical line. No user manual step.

## The data path

```
Agent invokes Skill tool
  ↓
PostToolUse hook fires (post-tool-skill-invocation-annotation.sh)
  ↓
Hook injects directive into agent context: "print 🔥 /skill skill called, my sense is because {context}"
  ↓
Agent prints canonical 🔥 annotation in chat
  ↓
Claude Code harness writes it to transcript JSONL
  ↓
SessionEnd hook runs scrape-fire-annotations.js  (wired: session-end-persist.sh:140)
  ↓
Scraper reads transcript, extracts 🔥 annotations, writes this session's .md (the raw record)
  ↓
Same run rebuilds fire-annotation-corpus.json from ALL session .md files (build-fire-annotation-corpus.js)
  ↓
Uploads the merged JSON as ONE source, verifies it landed, deletes the prior copy
  ↓
Oracle answers the next session's predictions from a corpus that includes last night's work
```

No manual step anywhere. Verified end to end 2026-07-15: three consecutive unattended runs left the
notebook holding exactly one current source.

Two properties of this sync exist because the alternative silently failed, and both must survive any
future edit:

- **It replaces, never appends.** Each build is a full snapshot of all history, so two copies would let
  the oracle quote a stale snapshot as current. The prune keeps only the copy it just verified and
  deletes whatever else is live — deleting a pre-add snapshot instead races NotebookLM's own
  propagation delay and leaves the real stale copy behind.
- **It verifies against the notebook's own source list, never the CLI's exit code.** `nlm source add`
  returns success and creates nothing once a notebook is at capacity. A backfill on 2026-07-15 reported
  184 uploads and landed 24 — 161 phantom successes reported to a human as done.

## Canonical annotation format (verbatim, do not sanitize)

```
🔥 /{skill-name} skill called, my sense is because {predicted context which made this relevant}
```

The "my sense is because" connecting phrase is mandatory. It tells agents what kind of sentence to write — a felt-sense articulation of what in the live conversation triggered this skill being the right next move, not a context label.

## The oracle notebook — query THIS one

**Notebook ID:** `<your-notebook-id>` — "Skill Pattern Oracle v3 — Merged JSON Corpus" (profile: `<your-profile>`).

Setup: make your own NotebookLM notebook at https://notebooklm.google.com and use its ID for `<your-notebook-id>` (and your `nlm` profile name for `<your-profile>`), because the oracle can only answer from a corpus of your own sessions.

One source: `fire-annotation-corpus.json`, holding every session's skill invocations with each agent's own
`whyInvoked` reasoning nested underneath. 632 sessions / 2,357 invocations / 111 distinct skills as of
2026-07-15, and it grows on every SessionEnd.

**Do not query `<old-v2-notebook-id>` (the old v2 notebook).** It is frozen at NotebookLM's 227-source ceiling — it
holds only the oldest ~227 sessions, has accepted nothing since early June, and will answer confidently
from a corpus that has never seen the last month of work. It is left in place as an archive of sessions
whose per-session `.md` files have aged off disk; it is not a live oracle. The v1 notebook (`<v1-notebook-id>`)
also stays untouched.

**Why the notebook changed (user ruling, 2026-07-15, verbatim):** *"It doesn't have to be split per
session. I don't know what agent thought that was a good idea, but that's wrong... You can merge it
literally all into one document. It would not matter."* One source per session hit the 227-source cap at
session 227, silently dropping ~64% of the corpus. One merged document makes the ceiling unreachable.

**Why JSON (same ruling, verbatim):** *"there's gonna be some nesting. Right? It's gonna be like, oh, in
this one session, we had to use these fifteen skills... But in this session, we only had to use these
three."* That per-session spread is the signal the oracle is asked for, and flat prose loses it. Measured
range: max 11 distinct skills in one session, median 3.

## Pipeline scripts

- **Scraper:** `<api-repo>/scripts/scrape-fire-annotations.js`
  - Reads transcript JSONL → writes `<api-repo>/docs/intent/skill-sequences/fire-annotations-v2/{session-id}.md`
  - Run with `node scrape-fire-annotations.js latest` to scrape the most recent session
  - Run with `node scrape-fire-annotations.js <transcript-path>` for a specific session
- **Hook:** `.claude/hooks/post-tool-skill-invocation-annotation.sh`
  - Fires on every Skill tool invocation
  - Injects directive prompting agent to print canonical 🔥 line

## Step 1 — Query the v2 Skill Pattern Oracle

```bash
nlm notebook query <your-notebook-id> \
  "Given this scope: {scope}. Tags: {tags}. Based on historical 🔥 annotations for similar scopes, which skills should be invoked, in what order, and why? Cite the verbatim 🔥 annotations you draw from, and flag which skills are commonly SKIPPED on this kind of work." \
  --profile <your-profile>
```

Or via MCP:

```
mcp__notebooklm__query_notebook({
  notebook_id: "<your-notebook-id>",
  profile: "<your-profile>",
  question: "Given this scope: {scope}. Tags: {tags}. Which skills, in what order, and why? Cite verbatim 🔥 annotations. Flag commonly-skipped skills."
})
```

Ask for the verbatim citations and the commonly-skipped flag explicitly — the oracle returns both when asked, and the skipped-skill list is the part that catches what you'd otherwise miss.

## Step 2 — Format as mandatory sequence (same as v1)

```
## Required Skill Sequence — {scope title}

Grounded in historical 🔥 annotations for similar work.
These are REQUIREMENTS, not suggestions. Each must be executed and marked done.

1. /align — confirm intent before acting [EARLY]
2. /governer — score complexity and leverage [EARLY]
3. /[skill] — [why, grounded in similar past sessions' 🔥 annotations] [MID]
...
N. /consume — build admin-consumable output [LATE]
N+1. /commit [LATE]

Skipped-skill risk: [skills the oracle flagged as commonly missed]

Oracle reasoning: [1-2 sentences from the oracle, with verbatim 🔥 annotation citations]
```

## Step 3 — Decompose into TaskList items (same as v1)

Call `TaskCreate` for EACH skill in the list. Format:

```
TaskCreate({
  subject: "Run /[skill-name] — [one-line description]",
  description: "Required pipeline step for this scope. Why: [oracle reasoning including verbatim 🔥 annotation from similar past session]"
})
```

## Migration from v1

- v1's `session-skill-snapshot.js` continues running — it reads compactions and writes to `skill-patterns-living.md`. Untouched.
- v2's `scrape-fire-annotations.js` reads transcripts and writes to `fire-annotations-v2/`. New.
- Both can run in parallel. v2 is additive.
- When v2 proves equal or better, deprecate v1.

## Differences from v1 — quick reference

| Dimension | v1 | v2 |
|---|---|---|
| Data source | `compaction.compactedSession` text field | Live transcript JSONL |
| Capture trigger | The user invokes `/compact-agentic-session` manually | Automatic — every assistant message |
| Causal signal | Implicit (regex hunt for /skill-name) | Explicit (canonical 🔥 annotation with "sense is because") |
| Agent compliance | None — relies on compaction containing skill mentions | One line per Skill invocation (prompted by hook) |
| Output format | `skill-patterns-living.md` (single growing file) | per-session `.md` as raw record → merged into ONE `fire-annotation-corpus.json` |
| NotebookLM notebook | `<v1-notebook-id>` | `<your-notebook-id>` — live, 1 merged source, 632 sessions inside it |
| Upload | manual | automatic on SessionEnd, verified against the notebook's own listing |

## Verification — how to know v2 is working

1. Invoke any skill in a session, check `.claude/logs/skill-invocations.jsonl` has an entry
2. Print the canonical 🔥 line, then run `node <api-repo>/scripts/scrape-fire-annotations.js latest`
3. Confirm `fire-annotations-v2/{session-id}.md` was written and contains your annotation
4. Confirm the same run printed `[upload] corpus replaced — kept {id}, removed N stale`
5. Confirm the notebook holds exactly ONE source — this is the check that matters, because it is the
   one the old per-session design failed silently for a month:
   `nlm source list <your-notebook-id> --profile <your-profile>`
   (allow ~15s to settle; NotebookLM's list lags its own writes)
6. Query the notebook with a scope and confirm it cites recent sessionIds, not only months-old ones —
   a stale corpus answers fluently and cites nothing newer than its last good upload

## Build status

Every line below was checked against the live system on 2026-07-15, not inferred. If you are reading this and about to go build one of the done items, don't — verify first, the same way. The stale version of this list cost an agent a full detour hunting for a notebook that already had 227 sources in it.

- [x] **v2 NotebookLM notebook created** — `<your-notebook-id>`, 227 sources, answering queries with cited 🔥 annotations. Verified via `list_all_notebooks`.
- [x] **Scraper wired into SessionEnd** — `.claude/hooks/session-end-persist.sh:140` invokes `scrape-fire-annotations.js latest` in the background, logging to `.claude/logs/fire-scraper.log`. Additive to v1's snapshot script, which still runs.
- [x] **Corpus accumulating** — `<api-repo>/docs/intent/skill-sequences/fire-annotations-v2/` holds 619 session files.
- [x] **Auto-sync to NotebookLM** — built 2026-07-15. `scrape-fire-annotations.js` now rebuilds the merged corpus and replaces the notebook's single source on every SessionEnd. Verified: three consecutive unattended runs settle at exactly one current source.
- [x] **Corpus merged to one document** — 632 sessions in 1 source. The old one-source-per-session design could never hold more than 227 sessions and had been silently dropping everything past that.
- [ ] **A/B v1 vs v2 predictions on identical scopes** — unblocked and unrun. Both corpora exist; nobody has compared their predictions on the same scope.
- [ ] **Consider richer nesting in the corpus JSON** — right now each invocation carries skill + timestamp + whyInvoked. The user floated that scope-shape (what KIND of work a session was) would sharpen prediction, since matching "sessions like this one" is the actual retrieval question. Not built; the corpus is ~950KB against a ~1MB `--text` ceiling, so anything added has to buy its bytes.

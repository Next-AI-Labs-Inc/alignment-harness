---
name: extract-wip-from-past-sessions
description: Sweep a range of past Claude Code sessions with a fleet of Sonnet agents (one per session) to surface implied-but-unfinished work the user wanted done, filter to a target initiative (e.g. the <frontend-repo> launch), and convert each finding into a priority-prefixed, self-contained Obsidian proposal sorted into work-state triage folders. Use when the user wants to mine recent or older sessions for dropped actionables before a launch, or says "extract WIP", "sweep the last sessions", "what did I leave unfinished", or "run the WIP sweep on the next N sessions".
---

# Extract WIP From Past Sessions

## Why this skill exists

Across many sessions, the user implies work the user wants done — sometimes explicitly, sometimes by frustration or "this should…" — and it gets dropped when the session ends or compacts. This skill recovers that dropped work systematically: one agent per session reads the transcript, decides if there's implied-unfinished work tied to the target initiative, and if so writes a proposal the user understands on first read and another agent can execute end-to-end. Validated 2026-06-01 on a 90-session <frontend-repo>-launch sweep: 88 reviewed, 31 relevant, 41 proposals — the early-pulse finding ("commit the uncommitted modal work + fix the real bugs") held all the way to completion.

## Origin / resume

- **First run session (resume for full context):** `claude --resume <first-run-session-id>` (project: `<your-project-path>`)
- **Output folder pattern:** `<api-repo>/docs/intent/1.7_proposed/launch-sweep-<YYYY-MM-DD>/`
- If the `<api-repo>/docs/intent/1.7_proposed/` folder does not exist, create it.
- **Fleet model (REQUIRED): Sonnet** (`claude-sonnet-4-6`). Verified on the first run via the agent transcripts. Sonnet is the cost/quality fit for transcript review + proposal drafting. **Never Haiku** — this is judgment work. Escalate a specific item to Opus only when root-cause reasoning or live browser proof is required (that's the evidence-folder's job, not the sweep's).

## The five user requirements (verbatim intent)

Each per-session agent must:
1. Determine if there is **incomplete work the user strongly implied the user wanted completed**.
2. If so, determine whether it is **directly implicated in the target initiative** (default: a front-end UI launch of <frontend-repo>).
3. If so, write **proposals immediately actionable in Obsidian**, with a **priority 1-99 as the filename prefix** (`NN_specific-completed-ux-outcome.md`), in **separate files**.
4. Make each proposal **clear enough that another agent can execute it end-to-end** and know where to get the context (repo, likely files, runnable verify recipe, source session id).
5. Make each proposal **clear enough that the user understands it the first time the user reads it** — lead with "What the user will experience when this is done," zero jargon.

Then, on each session: run `/on-turn-end` + `/update-the-founder` (stamping — see Known Gaps).

## Workflow (orchestrator = parent thread, never delegated)

### Step 1 — Ground reality first (do NOT skip)
- Resolve the **session window**: build a newest-first manifest of `*.jsonl` in `~/.claude/projects/<project-slug>/`, ranked by mtime. "Last 48h" or "next 100" resolves to a concrete rank range.
  ```bash
  DIR=~/.claude/projects/<project-slug>
  find "$DIR" -maxdepth 1 -name "*.jsonl" | while read -r f; do perl -e '@s=stat($ARGV[0]); print "$s[9]|$s[7]|$ARGV[0]\n"' "$f"; done \
    | sort -rn | awk -F'|' 'NR>=START && NR<=END {printf "%d|%d|%s\n", NR, $(1+1), $(1+2)}'
  ```
  (macOS BSD `find` has no `-printf`; use perl's `stat`. `rtk find` rejects compound predicates — call `find` directly.)
- Confirm the **Obsidian output folder** exists / create the dated sweep folder.
- Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<query>"` once to ground the **relevance filter** — what "the target launch" concretely means (which surfaces, bugs, UI work), so each agent's skip/proceed decision is grounded, not guessed.

### Step 2 — Fan out, newest-first, with an in-agent relevance gate
- **One Sonnet agent per session**, ordered newest→oldest.
- Each agent's FIRST move is a cheap relevance check (read the transcript head/tail): is this session related to the target initiative? If not → return `relevant:false` with a one-line reason and STOP (cheap skip). This is what keeps a 100+ session sweep affordable — most agents skip in seconds.
- Relevant agents extract implied-unfinished work and write proposals per the five requirements.
- Use a `Workflow` with `pipeline()` (no barrier) so a relevant session flows straight into proposal-writing while others are still being reviewed. Pin `model: 'sonnet'` on the agent calls. Return a structured verdict per agent (sessionId, sessionTitle, relevant, reason, proposalsWritten, founderUpdateLine).

### Step 3 — Triage folders + agents.md (so the proposals are dispatchable)
Sort proposals into work-state subfolders, each carrying an `agents.md` contract (workflow + oracle-grounded skill sequence + owning tier Opus|Sonnet, never Haiku):
- `1_1 next action - the users` — the user's own; don't auto-execute
- `1_1_get me a proposal` — needs a full proposal authored (Sequence B: /task-get-one-important → /align → /speak-human → /jonathan-check2 → /how-to-submit-and-track-proposals)
- `1_1_2 Get me evidence` — suspected, not proven; reproduce live + attach a clickable repro URL/screenshot before fixing (Opus)
- `1_2_approved for escalation` — escalate, don't act
- `1_3_approved for action` — execute + commit (Sequence A: /init → /resolve-proposals → /governer → /Test-Actual-UX → /commit w/ Resolves-Proposal → /pipeline-consumption-handoff)
- `1_9_agent-completed` — archive
- `1_99_deferred for after launch` — leave

### Step 4 — Tier rule (user-ratified)
Owning agent tier per folder/item is **Opus or Sonnet, chosen by gravity / risk-of-error. Haiku is NEVER part of this work.** Opus for judgment / root-cause / live proof / high blast-radius; Sonnet for standard review and execution.

### Step 5 — Initiative flags
When the user names a next-launch concern (e.g. **the email machine**), instruct every agent to explicitly flag any session touching it, so that WIP surfaces even if it's not the primary filter.

## Skill-pattern grounding
For per-folder skill sequences, query the v1 skill-pattern oracle (NotebookLM — make your own at https://notebooklm.google.com, loaded with your skill files and past sessions, so the skill sequence for each folder is grounded in your own skill patterns rather than guessed). `/predict-required-skills2` should fall back to v1 automatically — its v2 notebook is an unbuilt TODO; if v2 is missing, use v1.

## Known gaps (carry forward, don't re-discover)
- **Stamping (`/on-turn-end` + `/update-the-founder` as the last message on each reviewed transcript) did NOT reliably land** on the first run — grep of transcripts for the fleet attribution returned zero. If stamping is a hard requirement, verify it explicitly after the run (grep transcripts) and backfill; do not assume it fired.
- **Structured-output loss ~2%** — a few agents finish without returning the verdict schema after nudges. They fail loud (named in workflow `<failures>`); re-run just those sessions if they matter.
- **Untracked output** — the sweep folder is untracked in the submodule; `git mv` fails (use `mv`, which is reversible since nothing's in history). `git add` it if you want the proposals version-controlled.

## When to re-run
See the "when we need to burn tokens" idea list: run this on any session-count range not yet extracted, to keep sourcing dropped actionables ahead of a launch.

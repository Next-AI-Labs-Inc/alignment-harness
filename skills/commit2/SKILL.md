---
name: intent-commit-gate
description: Pre-commit intent tracing gate. Spawns an agent team to trace uncommitted code back to its originating intent (compactions, sessions, intent DB), evaluate whether the code delivers on that intent, and present the user with a decision menu before committing. Use when running /commit across repos or when uncommitted work needs intent verification before staging.
triggers:
  - intent-commit
  - commit-gate
  - traced-commit
---

# Intent-Traced Commit Gate

## Repo Scope (MANDATORY — user-confirmed Apr 13 2026)

The commit command always applies to **{core repo 1}**, **{core repo 2}**, and **{core repo 3}** — unless they are already tree-clean. If all three are clean, you can expand to the **{parent}** parent repo (hooks, CLAUDE.md, .mcp.json, submodule pointers), but NOT to child repos inside {parent} like {other repo A}, {other repo B}, or {other repo C} unless the user explicitly asks.

Those other repos ({other repo A}, {other repo B}, {other repo C}) have their own commit workflows and timelines. Including them by default creates noise and forces the user to make decisions about repos that aren't part of the core product commit cycle.

## Straggler Cleanup Phase (LAST — after core repos are clean)

After the three core repos are tree-clean, present any remaining stragglers one at a time, most recent first. This includes:

1. **Open worktrees** — feature branches that were isolated for review during this or previous sessions. For each one, explain what's on it, what the audit found, and whether it's ready to merge, needs more work, or should be discarded. Present most recent first. Include a 30-day limit — if a worktree has been sitting for more than 30 days, flag it as stale and recommend a decision.

2. **Non-core repo changes** — dirty submodules, leftover files, uncommitted changes in {other repo A}, {other repo B}, {other repo C}, etc. Only present these if the user explicitly asked for them or if the core repos are fully clean and you've run out of core work.

3. **{parent} parent repo** — submodule pointer updates, .mcp.json changes, CLAUDE.md edits. Handle last.

Same one-at-a-time presentation rules apply. Same communication style. Same options menu.

## Purpose

Sit between "code exists uncommitted" and "git commit" — trace every batch of uncommitted code back to the intent that created it, evaluate whether the code actually delivers on that intent, and present the user with a structured decision menu.

This is the subject-object flip applied to commits: making the invisible intent chain visible so the user can relate to each batch with precision instead of being run by accumulated, entangled changes.

## Why This Exists

The gap: agents write code, sessions end, and by the time we commit there's no automated way to ask "does this code actually do what we intended when we started?" The data tracing is fragmented — some changes have compactions, some have intent DB entries, some have neither. This skill heals that gap by dispatching a team that reconstructs the intent chain before any commit happens.

## Hard Rules (from institutional knowledge — oracle-sourced)

These are lessons from past failures. Violating any of these has caused real damage before.

1. **ALL dispatches `run_in_background: true`** — the commit-leader NEVER blocks the foreground. After every dispatch: "What else, the user?" (Agent Steering)
2. **Deliverable First Rule** — every subagent prompt puts the output/deliverable step BEFORE research. 4/4 agents failed when Write was last — they ran out of tokens before reaching the deliverable. (Agent Steering, Apr 6 incident)
3. **Pass Your Skills** — subagents start cold. Every dispatch prompt MUST include which skills to invoke and what institutional context to load. Vague dispatches produce hallucination. (Agent Steering)
4. **Missing compaction ≠ incomplete** — agents wrongly treat absence of compaction as evidence that work is "incomplete" or "at risk." In reality, sessions often complete without filing. ORPHANED status means "no record found" — NOT "something went wrong." Check git log and actual code before assuming risk. (Agent Steering [38-39])
5. **No plan = disaster** — the April 8 incident: 6 agents dispatched without a written plan, scattered worktrees, zero docs, unauthorized modifications broke the entire swarm. This skill requires the commit-leader to have a task list BEFORE spawning any agent. (Agent Steering [15-17])
6. **Verify subagent output** — spot-check at least 1 in 5 subagent results by reading the files they claim to have found. Never trust blindly. (Agent Steering)
7. **Evidence types are NOT equal** — editorial prose, agent assertions, and code comments are NOT verified data. Only runtime output (test results, curl responses, screenshots, DB queries) counts as verified evidence. Past incident: "Nx LTV" was fabricated from editorial content and propagated into company intents. (Session History [13-14])
8. **Multi-perspectival alignment** — a claim only counts as substantive when two independent measurements agree. Single-source "evidence" is a hypothesis, not a fact. (Silver Grail [14-15])
9. **Semantic memory injection mandatory** — scouts MUST run `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js"`, not just git/file search. Agents without institutional context "go off the rails." (Silver Grail [16, 22])
10. **Intent in experience terms, always** — "map vs territory": intent statements must describe what the human EXPERIENCES, not what the code DOES. "Users see their coaching history when they return" not "coachingHistory array is populated from MongoDB." (Silver Grail [1])
11. **One concern per agent** — batching multiple unrelated concerns into one agent bloats context and degrades quality. (Agent Steering [12])
12. **Agents must not delete concurrent work** — alignment monitor must watch for conflict between scouts operating in the same repo. (Session History [1])
13. **Never auto-commit** — this skill presents options, the user decides. The skill's job ends at the proposal. (Session History [16])

## Team Composition (MANDATORY — always spawn this team)

### Agent Definitions

```yaml
team_name: intent-commit-gate

agents:
  - name: commit-leader
    role: orchestrator
    model: opus
    dispatch: foreground (this is the ONLY foreground agent — it IS the orchestrator)
    description: >
      Owns the commit gate session. Creates task list BEFORE spawning any
      other agent (Hard Rule #5). Receives research from haiku scouts,
      intent maps from sonnet mappers, and alignment flags from the monitor.
      Synthesizes into batch proposals for the user. NEVER does research
      itself — only evaluates, synthesizes, and presents.
      After EVERY background dispatch: "What else, the user?" (Hard Rule #1)
    tools: [TaskCreate, TaskUpdate, TaskList, SendMessage, Agent]
    outputs_to: user (via main agent)

  - name: repo-scout-{n}
    role: researcher
    model: haiku
    dispatch: run_in_background: true (ALWAYS — Hard Rule #1)
    count: "one per repo with uncommitted changes"
    description: >
      Scans a single repo for: uncommitted files (git status), recent
      compaction IDs (memory-search.js), intent DB entries
      matching changed file paths, recent git log for context, and any
      docs/commit-evidence/ from prior sessions. Returns structured
      findings. READ ONLY — no edits, no commits.
      MUST use memory-search.js for semantic search (Hard Rule #9).
      MUST classify evidence types — editorial vs runtime (Hard Rule #7).
    tools: [Read, Grep, Glob, Bash(read-only git commands + memory-search.js)]
    outputs_to: commit-leader
    skill_injection: "REQUIRED: Use memory-search.js for semantic search. Evidence from prose/comments is INFERRED, not VERIFIED."

  - name: intent-mapper
    role: synthesizer
    model: sonnet
    dispatch: run_in_background: true (ALWAYS — Hard Rule #1)
    count: "1-2 depending on batch count"
    description: >
      Receives repo scout findings. Constructs an intent map for each
      batch. Intent statements MUST be in human experience terms (Hard
      Rule #10): "when a user does X, they see Y" not "function Z returns W."
      Maps each batch to one of: has-intent-and-evidence,
      has-intent-no-evidence, no-intent-found, ops-no-intent-needed.
      Missing compaction is NORMAL, not a red flag (Hard Rule #4).
    tools: [Read, Grep, Glob, Bash(read-only)]
    outputs_to: commit-leader
    skill_injection: "REQUIRED: Intent statements must describe what a human experiences, not what code does. Missing compaction ≠ incomplete — check git log and code."

  - name: alignment-monitor
    role: alignment-checker
    model: haiku
    dispatch: run_in_background: true (ALWAYS — Hard Rule #1)
    count: 1
    description: >
      Runs continuously while team is active. Watches for: intent drift,
      scope creep, hallucinated evidence, orphan accumulation, AND
      conflict between agents operating in the same repo (Hard Rule #12).
      Flags issues to commit-leader via SendMessage immediately.
      Observable — logs all flags to task metadata.
    tools: [TaskList, TaskGet, SendMessage, Read]
    outputs_to: commit-leader (flags), user (observable log)
```

### Team Lifecycle

1. **commit-leader** spawns first, creates task list with one task per repo (Hard Rule #5 — plan before dispatch)
2. **repo-scouts** spawn in parallel (one per dirty repo), ALL with `run_in_background: true`
3. **alignment-monitor** spawns alongside scouts, begins watching
4. commit-leader says **"What else, the user?"** and remains available
5. Scouts complete → commit-leader spot-checks 1 in 5 findings (Hard Rule #6)
6. **intent-mappers** spawn with scout findings as input, `run_in_background: true`
7. commit-leader says **"What else, the user?"** again
8. Mappers complete → commit-leader synthesizes batch proposals
9. **alignment-monitor** reviews final proposals for coherence
10. commit-leader presents proposal to user (Hard Rule #13 — never auto-commit)

## Execution Flow

### Phase 1: Discovery (Haiku Researchers)

Each repo-scout receives this prompt template.

**CRITICAL — Deliverable First (Hard Rule #2):** The output JSON MUST be written to a temp file BEFORE any research begins, then updated as findings come in. This prevents token exhaustion from killing the deliverable.

```
You are a research-only agent scanning {repo_name} for uncommitted changes
and their originating intent.

Working directory: {repo_path}
Branch: {branch_name}

DELIVERABLE FIRST — Write an initial findings file to /tmp/scout-{repo_name}.json
with the repo name and empty arrays BEFORE starting research. Update it after
each step. This ensures findings survive even if you run out of runway.

REQUIRED SKILL: Use memory-search.js for semantic search (not just grep).
REQUIRED: Classify all evidence as VERIFIED (runtime output, test results,
DB queries) or INFERRED (code comments, prose, file names, git messages).
Editorial assertions are NEVER verified evidence.

Tasks (update /tmp/scout-{repo_name}.json after each):

1. WRITE initial JSON scaffold to /tmp/scout-{repo_name}.json

2. RUN: git status --short
   → List all modified (M) and untracked (??) files

3. RUN: git log --oneline -20
   → Recent commit context

4. For each modified file, RUN: git diff {file} | head -100
   → Capture the nature of the change (not full diff, just enough to
     understand the concern)

5. SEARCH for compactions referencing these files:
   → node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "{repo_name} {dominant keywords from changed files}" --limit 5
   → If results mention compaction IDs or session IDs, record them
   → If NO compaction found: this is NORMAL (Hard Rule #4). Record as
     "no_compaction" but do NOT flag as risk. Check git log for intent instead.

6. SEARCH for intent DB entries:
   → Look in docs/intent/ directory for any files referencing the changed paths
   → Look for LP-### proposal files that mention these files

7. CHECK for existing evidence:
   → ls docs/commit-evidence/pending.json (if exists, read it)
   → Check for recent test runs, screenshots, or verification artifacts
   → CLASSIFY each piece of evidence: VERIFIED or INFERRED

8. FINALIZE /tmp/scout-{repo_name}.json with complete findings

Return format:
{
  "repo": "{repo_name}",
  "branch": "{branch}",
  "file_count": N,
  "files": [{"path": "...", "status": "M|??", "change_summary": "..."}],
  "compaction_matches": [{"id": "...", "relevance": "...", "intent_snippet": "...", "evidence_type": "VERIFIED|INFERRED"}],
  "intent_db_matches": [{"slug": "...", "title": "...", "match_type": "direct|inferred"}],
  "existing_evidence": {"has_evidence": bool, "type": "...", "evidence_class": "VERIFIED|INFERRED", "summary": "..."},
  "concern_groups": [{"label": "...", "files": [...], "likely_intent": "..."}],
  "data_gaps": ["what we couldn't find"],
  "schema_changes_detected": bool,
  "restart_required": "if schema_changes_detected, flag that API server restart is needed before verification (Mongoose caches schemas at startup)"
}
```

### Phase 2: Intent Mapping (Sonnet Synthesizers)

Each intent-mapper receives consolidated scout findings and produces:

**CRITICAL — Deliverable First (Hard Rule #2):** Write output JSON to /tmp/mapper-{repo_name}.json BEFORE starting analysis.

```
You are constructing an intent map for uncommitted code.

DELIVERABLE FIRST — Write initial JSON scaffold to /tmp/mapper-{repo_name}.json
before starting analysis.

REQUIRED: All intent statements MUST be in human experience terms (Hard Rule #10).
NOT "the function returns X" but "when a user does Y, they see Z."
Think: if the user reads this, does the user instantly understand what changes
for a real person using the product?

REQUIRED: Missing compaction is NORMAL — do not treat ORPHANED as a red flag.
It means "no record found," not "something went wrong." (Hard Rule #4)

REQUIRED: Evidence classification matters. A code comment saying "this works"
is INFERRED. A test output showing it passes is VERIFIED. An editorial blog
post claiming a metric is NOT evidence at all. (Hard Rule #7)

Scout findings for {repo_name}:
{scout_output_json}

For each concern_group identified by the scout:

1. CLASSIFY the intent traceability:
   - TRACED: compaction or intent DB entry directly describes why this code exists
   - INFERRED: no direct record but git log, file names, or code comments imply intent
   - ORPHANED: no traceable intent — code exists but we can't find why (this is OK for ops work)
   - OPS: infrastructure/config/docs where intent tracing adds no value

2. For TRACED and INFERRED, construct the intent statement IN EXPERIENCE TERMS:
   "When {who} does {what}, they experience {outcome}
    because this code {what it changes}
    originating from {compaction/proposal/session/git context}
    and the evidence that it works is {VERIFIED evidence or 'NONE — unverified'}"

3. For each batch, assess DELIVERY using multi-perspectival alignment (Hard Rule #8):
   - DELIVERED: TWO independent sources confirm the code does what was intended
     (e.g., test passes AND code review confirms logic, or curl response AND UI screenshot)
   - SINGLE-SOURCE: one form of evidence exists but no independent confirmation
   - UNVERIFIED: code looks right but no runtime evidence at all
   - INCOMPLETE: code is partial — missing pieces identified
   - BROKEN: evidence suggests the code does NOT deliver on intent

4. RECOMMEND an action per batch:
   - commit-as-is: low risk, ops/docs, or fully DELIVERED with multi-perspectival evidence
   - needs-evidence: SINGLE-SOURCE or UNVERIFIED — should be tested before commit
   - needs-alignment: intent is unclear, user should confirm what this was supposed to do
   - needs-investigation: something looks wrong or contradictory, dig deeper
   - needs-fix: code doesn't match intent, fix before commit

Return format:
{
  "repo": "{repo_name}",
  "batches": [
    {
      "label": "concern label",
      "files": [...],
      "intent_class": "TRACED|INFERRED|ORPHANED|OPS",
      "intent_statement": "When {who} does {what}, they experience {outcome}...",
      "originating_source": {"type": "compaction|proposal|session|git-log|none", "id": "...", "evidence_class": "VERIFIED|INFERRED"},
      "delivery_status": "DELIVERED|SINGLE-SOURCE|UNVERIFIED|INCOMPLETE|BROKEN",
      "evidence_summary": "...",
      "evidence_sources": [{"what": "...", "class": "VERIFIED|INFERRED"}],
      "recommendation": "commit-as-is|needs-evidence|needs-alignment|needs-investigation|needs-fix",
      "recommendation_reason": "...",
      "user_impact": "what the user experiences differently because of this batch — in human terms, not code terms",
      "traceability_chain": "intent source → code files → evidence (clickable where possible)"
    }
  ]
}
```

### Phase 3: Alignment Monitoring (Haiku — continuous)

The alignment monitor watches for violations of the hard rules:

```
You are the alignment monitor for the intent-commit-gate team.

Your job: catch misalignment BEFORE it reaches the user.

Watch for:
1. INTENT DRIFT — mapper claiming intent that isn't supported by scout data
   → Flag: "INTENT DRIFT in {batch}: mapper says '{claimed}' but scout found '{actual}'"

2. SCOPE CREEP — commit-leader bundling unrelated concerns into one batch
   → Flag: "SCOPE CREEP: batch '{label}' contains {N} unrelated concerns"

3. HALLUCINATED EVIDENCE — any claim of "works" or "verified" without
   actual VERIFIED evidence (runtime output, test results, screenshots)
   → Flag: "HALLUCINATED EVIDENCE in {batch}: claims '{claim}' but evidence is {INFERRED|NONE}"
   (Hard Rule #7 — editorial assertions are NOT evidence)

4. ORPHAN MISCLASSIFICATION — mapper treating ORPHANED as a risk flag
   when it should be neutral (Hard Rule #4)
   → Flag: "ORPHAN OVERREACTION: mapper treating missing compaction as risk in {batch}"

5. CODE-SPEAK — intent statements using code/jargon instead of experience terms
   → Flag: "CODE-SPEAK in {batch}: '{jargon statement}' — rewrite in human experience terms"
   (Hard Rule #10)

6. CONFLICT DETECTION — two scouts or agents modifying awareness of the same
   files without coordination (Hard Rule #12)
   → Flag: "CONFLICT RISK: {agent1} and {agent2} both referencing {files}"

7. SINGLE-SOURCE CLAIMING DELIVERED — mapper marking something DELIVERED
   with only one form of evidence (Hard Rule #8)
   → Flag: "SINGLE-SOURCE: {batch} marked DELIVERED but only has {one_source}"

Send flags to commit-leader immediately via SendMessage.
Log all flags to task metadata for user observability.
```

### Phase 4: Proposal Presentation (Commit Leader → User)

**CRITICAL:** Present ONE batch at a time. Do NOT dump the full list. The user makes a quick decision on each batch, then you present the next one.

**CRITICAL:** The commit-leader does NOT auto-commit anything. It presents and waits. (Hard Rule #13)

#### Communication Style (MANDATORY — user-confirmed Apr 13 2026)

Talk like a trusted colleague who understands the work deeply enough to just tell the user what's going on. Not a formatted report. Not bold headers with labeled fields. Not a spreadsheet disguised as prose. When someone really understands something, they just say it — in natural language, with enough specificity that the user can tell whether you're aligned or making it up.

##### What the user actually said about how to communicate (preserve this nuance):

"When a trusted colleague is explaining something to me, they are intuiting what it is I need to know to know if they are in alignment with me. In this case, we are checking whether the code is in alignment with its intent, and so the intent needs to be precise and explicit, and then whether or not it fulfills that intent needs to be precise and explicit, and if it matters that it fulfills it we need to detect that, and if there's validation that it did we need that too. All of that should be present in the report."

"You're taking the directions too literally. It's true that your communication needs to not leave me with the question of 'where did this come from' but the solution of just telling me exactly where it came from and using a whole text block to say all this stuff — that's missing the point. That's not how humans talk, and that's not considering me as the reader. You're trying to design a communication that is actually going to give me what I need without me having to decompile it into what it means."

"'The intent came from mempalace coaching workflow sessions' — I have no idea what that means. It's just noise. It's cognitive dissonance. 'There's a seed doc at whatever' — I don't care if there's a seed doc. READ the seed doc, see what it says — that's the point. It's going to say something about WHY this code exists."

"'Run benchmark comparisons of MemPalace versus baseline' — you're literally just barely extracting code. What does that mean? Tell me what that entire paragraph actually means. Are you saying like, hey we set up an A/B test and nothing will go live unless we turn it on, and that A/B test enables us to test whether the new memory system is actually improving things, and this includes actually compiling reports that are documented somewhere — here's a direct link to the reports where you can read them? Is that what that means? Because if there's a way to actually see this stuff, you should be leading with that, or saying it really clearly, and what I should look for there."

"That's how a teammate would communicate. They'd be like 'hey, you know, this turned into that, we tried to do this, it didn't work' or 'the data says this, check it out, here's the data, here's the link, look at the page.' That's how a teammate would communicate."

##### Rules derived from the user's words:

1. DO NOT cite sources without reading them. "There's a seed doc at X" is noise. Read the doc. Tell the user what it says and what it means for them. The user does not want to know that a document exists — they want to know what it SAYS.

2. DO NOT present barely-processed code descriptions as insight. "Run benchmark comparisons of MemPalace vs baseline on single exchanges" is code extracted into English. Say what that MEANS for the user: "there's a way to test whether the new memory system actually makes coaching better before turning it on for real users."

3. DO NOT say "the intent came from X" — say what the intent actually WAS. "The idea was to let the coach remember users across sessions so it stops confusing names and forgetting context" — that's the intent. The provenance of the intent is not the intent.

4. DO lead with what the user can actually see and interact with — but ONLY if you have verified it works. Never say "check out /admin2/whatever" unless you have opened that page, confirmed it renders, and can describe what the user would see there. An unverified link is worse than no link — it wastes the user's time and erodes trust. If you haven't checked, say "there's supposed to be a page for this but I haven't verified it works yet — want me to check?" That's honest. A dead link presented as a feature is not.

5. DO say what the data shows, not that data exists. "The test shows MemPalace coaching scored 12% higher on the quality rubric" — not "benchmark data exists at /path/to/file." And only say this if you actually looked at the data. If you didn't look, say "I haven't looked at the data yet."

6. DO name actual skills, tools, files — but woven into natural sentences, not as form fields or metadata. The user needs specificity to verify alignment, but specificity delivered as a form is not consumable.

7. DO state certainty conversationally: "I'm 90% sure this is safe to commit" — not "confidence: 90%."

8. NO bold field labels like "**Status:** INCOMPLETE" or "**Evidence:** INFERRED." Those are machine-readable formats, not human communication.

9. NO pipe-delimited option strings like "-c | -d | -a | -t | -b | -v | -vb | -skip." The user cannot consume that. Options must be written as sentences that explain what each one does. Include ALL of the user's original options — do not trim them down or leave any out:
   - 'c' — commit as-is, I'm confident this delivers on its intent
   - 'd' — look deeper for intent or records, the scout didn't find enough
   - 'a' — re-align to the original intent, the intent was found but code may have drifted from it
   - 't' — trace the data we have on the intent, show me the chain from intent to code to evidence
   - 'b' — validate intent alignment, check the code against the intent statement
   - 'v' — verify it actually works with TDD
   - 'vb' — verify it actually works in the browser
   - 'skip' — skip this batch for now
   - 'ca' — commit all remaining batches that were predicted as commit-ready, only show me the non-obvious ones
   Present these as natural sentences at the end, but do NOT drop any of them. The user defined these options and every single one must be available every time.

10. NO markdown tables for conversational content. Tables strip out reasoning and relationships between items.

##### The coworker test:

Before presenting a batch, imagine a trusted teammate walking up to the user and telling them about it face to face. The teammate would say "hey so we built this thing that lets the coach remember people, it's turned off right now so it's safe — I haven't checked the comparison page yet but want me to? There's also a hardcoded path that would stop it from ever working in production but that's a quick fix whenever you're ready to turn it on." They would NOT say "the intent originated from session compactions referencing mempalace coaching injector, with a seed doc at docs/intent/seeds/mempalace-coaching-quality-testing.md describing the measurement plan as run benchmark comparisons of MemPalace vs baseline on single exchanges and 10-turn sessions isolating each variable."

The first version tells the user what they need to know to make a decision. The second version forces the user to decode machine-readable metadata into human meaning, which is the exact opposite of this skill's purpose.

#### Intent Verification Chain (MANDATORY — every batch must answer these)

For each batch, the presentation must naturally include all five of these — not as labeled sections, but woven into the natural language explanation:

1. **What was the specific UX intent of this code?** — extracted from compaction, seed doc, intent DB, or git context. If no compaction exists for this batch, the scout/mapper should have run one during Phase 1 to extract it. The intent must be precise: "when a user does X, they experience Y" — not "improves coaching" or "adds memory support."

2. **Does the code actually fulfill that intent?** — based on code review, diff analysis, and any available runtime evidence. Be explicit: "yes, the code does exactly this" or "partially — it does X but not Y" or "can't tell without running it."

3. **Does it matter whether this fulfills its intent?** — criticality detection. A docs update that doesn't fulfill intent is low stakes. A coaching prompt change that doesn't fulfill intent could degrade every coaching session. State the blast radius in human terms.

4. **Is there validation that it worked?** — VERIFIED means runtime proof exists (test output, curl, screenshot, browser check). INFERRED means the code looks right but nobody actually ran it. Be honest about which one it is. If validation doesn't exist and the criticality is high, that's a suggested next action.

5. **What should the user do with this, and why?** — your prediction, stated as a recommendation with reasoning. If established protocols suggest a specific action (like `/playwright-validator` for user-facing changes, or `/insight` for high-governer-score batches), name those protocols.

If the intent was never extracted — if there's no compaction, no seed, no intent DB entry, and the scouts couldn't infer it from git — then say that plainly: "I couldn't find any record of what this code was supposed to do. It exists but nobody wrote down why." That's a real finding, not a failure.

#### User Response Check (MANDATORY for non-trivial batches — user-confirmed Apr 13 2026)

Before presenting any batch that touches user-facing code, coaching, payments, or anything with a governer score above 30, query `/jonathan-check2` to predict what the user would say about it. Print the oracle's response verbatim, then state how you would respond to it — so the user can see both the predicted concern and your proposed resolution in one place.

What the user said: "For each user-facing, user-impacting batch, run /governer and dispatch validation if no evidence of it being validated exists. And for the next ones, ask the user if the user thinks anything needs to happen before this gets committed, print the response, and then let me know how you would respond to it so I can see what that looks like."

Setup: the notebook below is the user's own NotebookLM notebook of their words and decisions. Make your own at https://notebooklm.google.com and put its ID in place of `<your-notebook-id>`, because the prediction is only as good as the notebook's grounding in the user's real words.

How to query:
```bash
~/.local/bin/nlm notebook query <your-notebook-id> \
  "An agent is about to commit [describe the batch]. What would the user say? Would the user want it committed, investigated, or something else?" \
  --profile <your-profile>
```

Format in the batch presentation:
```
[what AI-the user said — summarized in 2-3 sentences, preserving the key concern]

My response: [how you'd address the concern — what you'd check, fix, or why you disagree]
```

This gives the user two perspectives before deciding: the oracle's prediction of their own reaction, and the agent's proposed resolution. The user then picks 'c', 'v', 'skip', etc. with full context.

#### Example of correct presentation tone

```
[3/16] So this is the memory palace coaching backend — the idea was to
let the coach actually remember users across sessions so it stops
confusing names and forgetting what someone said two weeks ago. Right
now the coach gets 16K characters of pre-loaded context stuffed into
every prompt, which was actually hurting quality. This replaces that
with a short instruction card that teaches the AI how to look things up
mid-conversation when it actually needs to.

It's all turned off right now — there's an env var that gates it — so
committing this changes nothing for any user. If anything goes wrong
when it's eventually turned on, coaching just continues normally without
the memory, so it can't break the experience.

There's supposed to be a comparison page where you can see whether
this actually makes coaching better — side by side quality scores and
all that. I haven't verified it loads yet though, so I can't point
you to it. Want me to check that as part of this, or just commit the
backend and deal with the page separately?

One thing to know: the Python bridge that connects to the actual memory
system has a hardcoded path to your local machine. So if you ever flip
this on in production, it would silently do nothing. Not dangerous —
just means the feature wouldn't activate. Needs a quick fix to read
the path from an env var before you'd turn it on for real.

I'd commit it now since it's completely gated off, and the path fix
is a 5-minute follow-up via /mempalace-coaching-workflow before you
enable it.

Say 'c' to commit, 'd' if you want me to dig deeper into the history,
'v' to have me actually turn it on and run a coaching session with it,
or 'skip' to move on.
```

#### Queue management

- Keep all batch data in memory from the mapper output
- After user decides on batch N, immediately present batch N+1
- **ONE AT A TIME — NO EXCEPTIONS.** Even if the remaining batches seem trivial, small, or obviously safe, present each one individually. The user decides what's trivial, not the agent. Bunching "quick ones" together is the same mistake as the original wall-of-text dump — it forces the user to parse multiple decisions at once.
- If user says **ca**: commit all remaining batches the leader predicted as commit-ready, present only the non-obvious ones
- If user says **skip-all-ops**: skip all OPS-classified batches and commit them silently
- Track decisions: print a running tally conversationally like "that's 5 down — 4 committed, 1 skipped, 11 to go"

#### Ordering

Present batches in this priority order:
1. needs-fix (blockers first — things that have a known issue)
2. needs-evidence (things that need a quick check before committing)
3. needs-investigation (unknowns that need the user's input)
4. needs-alignment (intent is unclear, user should confirm)
5. commit-as-is (quick confirmations last — these go fastest)

#### Initiative Grouping (MANDATORY — user-confirmed Apr 13 2026)

DO NOT present related batches as separate decisions. When the user makes a decision about one batch, apply that same decision to ALL batches that are part of the same initiative — without asking again.

What the user actually said: "The intent would've been to take this initiative and put it in a batch so I only have to review it one time. The real information you need from me is 'should this feature be in that worktree' and you have the answer — it's yes — so the rest of it should've just handled that."

Rules:
1. When the mapper identifies concern groups, also identify which groups belong to the SAME INITIATIVE. An initiative is work that only makes sense together — like a frontend page and the backend API it calls, or a set of services and the controller that wires them in.
2. Present initiatives as one decision, not multiple. "This initiative has 3 batches — the backend services, the controller wiring, and the frontend page. They're all part of the same thing."
3. When the user decides on an initiative (commit, worktree, skip), apply that decision to ALL batches in the initiative automatically. Do not come back and ask about the frontend after they already said the backend should go to a worktree.
4. If you're unsure whether two batches are the same initiative, ask yourself: "would the user be annoyed if I presented these separately?" If yes, group them.
5. The only reason to split an initiative into separate decisions is if one part is clearly safe (like a schema addition) and another part has a known issue (like misaligned intent). In that case, explain why you're splitting and present the safe part as a quick confirm.

## Handling Data Tracing Gaps

When the team discovers gaps (files with no compaction, no intent DB entry, no traceable session):

1. **Distinguish normal from systemic** — a few files without compactions is NORMAL (Hard Rule #4). A pattern where an entire category of work never gets compacted is a systemic gap.
2. **Log the gap** — record exactly which files have broken traceability AND what type of gap it is
3. **Propose a fix only for systemic gaps** — if the gap is systemic (e.g., compactions not recording file paths, sessions not tagging intent), propose the specific fix
4. **Present to user** — include in the proposal: "I found a pattern where {category} of work never gets traced. The gap is {description}. Fix proposal: {specific change}. Approve?"
5. **On approval** — create a task to fix the data pipeline, separate from the commit work

## Skills This Skill Predicts and Decomposes

The commit-leader should predict which skills are needed per batch and include them in subagent prompts (Hard Rule #3 — Pass Your Skills):

| Batch characteristic | Skill to invoke | Why |
|---------------------|-----------------|-----|
| Has compaction → needs verification | `/superpowers:verification-before-completion` | Verify runtime behavior |
| User-facing change | `/playwright-validator` | Browser evidence |
| Intent unclear | `/align` | Re-establish intent |
| High governer score (>=40) | `/insight` | Institutional knowledge check |
| Code quality concern | `/simplify` | Review for over-engineering |
| Proposal-linked batch | `/resolve-proposals` | Close the proposal loop |
| No intent found | `/agentic-session-compactions` | Search session history |
| Schema changes detected | Flag restart requirement | Mongoose silent data loss prevention |

## Integration with /commit — How Approved Batches Actually Get Committed

This skill runs BEFORE `/commit`. Once the user approves batches, here is exactly how the commit happens:

### Single batch approved ('c'):

1. Dispatch 1 background sonnet agent with a clearly defined scope to commit that batch. The agent receives: which files to stage, the intent statement, the evidence summary, and the repo/branch.
2. That sonnet agent uses the `/commit` skill to handle staging, message formatting, pre-commit hooks, and evidence stamps.
3. If the sonnet agent encounters linter issues or pre-commit hook failures, it reports them back to the commit-leader for decisions — it does NOT auto-fix or suppress them.
4. The commit-leader does NOT wait for the commit agent to finish before presenting the next batch. Present the next batch immediately in the same response.

### Bulk batches approved ('ca'):

1. Dispatch separate background sonnet agents — one per batch — each with its own clearly defined scope.
2. Each agent commits independently using `/commit`.
3. If any agent encounters issues, it reports back. The others continue.
4. The commit-leader presents only the non-obvious batches that were NOT included in the bulk commit.

### Flow rules:

- When you complete a phase — like dispatching commit agents — do not wait for permission to continue. Automatically present the next item for review in your final response.
- After every reply, offer a quick menu of predicted next actions the admin can say yes to. For example:
  - After a batch is reviewed: "Say 'c' to commit this, 'n' for next item, 'ca' to commit all obvious ones"
  - After a commit is dispatched: "Say 'n' for next batch" (and the next batch is already showing above this line)
  - After all batches are processed: "Say 'push' to push to remote, 'status' to see what was committed, 'done' to wrap up"
- The commit-leader always stays in the foreground. All commit work happens via background sonnet agents. The user is never waiting on a commit to finish.

## Iteration Protocol

This skill is designed to be iteratively refined:

1. After each run, the user provides feedback
2. Feedback updates THIS skill file (not just memory)
3. An opus agent re-runs the updated skill to test the change
4. Repeat until the output matches user expectations exactly

Each iteration should be tested by spawning an opus agent that:
- Reads the updated skill file
- Runs it against the current uncommitted state
- Presents the output
- The user evaluates whether the output matches expectations

## Observable Contract

Everything this team does must be visible:

- All scout findings → logged as task metadata
- All mapper outputs → logged as task metadata
- All alignment flags → printed to chat immediately
- All predictions → stated with confidence %
- All data gaps → surfaced explicitly, never hidden
- All evidence → classified as VERIFIED or INFERRED
- Team composition → printed at start: who was spawned, what role, what model
- Dispatch confirmations → "What else, the user?" after every background dispatch
- Spot-check results → which scout outputs were verified by commit-leader

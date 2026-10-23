---
name: batch
description: Review uncommitted files, group them by concern, and walk through each batch with UX impact analysis before committing. Default to the Obsidian dashboard pattern — one reviewable note per concern in a one-click approve/reject/request-evidence surface — for any multi-concern sweep.
triggers:
  - "batch"
  - "batch commit"
  - "review uncommitted"
  - "what's uncommitted"
  - "group changes"
---

# Batch Commit Workflow

## What this skill is for (the target, read this first)

The user is the most bottlenecked resource in the system. The whole point of batching is to let the user approve real changes by their *meaning and user impact* — never by reading diffs or translating code in the user's head. A batch sweep has succeeded when the user can sit in front of one scannable surface, see each pending commit as a single meaning-framed claim with a confidence number and a way to prove it themselves, and approve / reject / demand evidence on each — without ever asking a clarifying question to understand what the user's looking at. If the user has to ask "what is this?" or copy-paste a path to find a doc, the batch failed at its job even if every fact in it is correct. Everything below serves that target.

## Instincts (read before presenting anything)

These are the moves the user means every time the user asks for "a sanity check per batch". Each one came from a correction, so each carries the user's words and the reason, not a rule to follow blindly.

### When the sweep covers more than one branch or worktree: label each sanity check with what it covers, and end it with the next action (the user, 2026-10-08)

In a sweep across stranded branches, an agent first answered with branch names, merge conflicts and dry-run mechanics. The user stopped it: *"You're giving me technical explanations when I read the sanity check command. It's about trying to align around intent, not mechanics, not how, but intent. Precisely."* The agent then wrote clean intent lines but left out which branch each one belonged to, and the user stopped it again: *"you're forgetting to mention which batch, which branch, which thing, each thing correlates to. So I can't authorize you to merge a specific branch if you don't mention what the ID or the branch is of it... leave a pointer so I can say what the next action is. For example, if you predict that X should be merged, because X sanity check is Y, then tell me what X is, what the sanity check is, and in a sentence, what the next action is. It could be complete it, it could be test it, it could be merge it."* Then, making it standing: *"whatever you had to do should be an instinct, because every time I give sanity check per batch this is what I mean... when the scope covered includes multiple branches or worktrees, separate the sanity check by commit, pointer and label it, and provide the sanity check per batch that way with the recommended next action in a sentence."*

Why it matters: the user's answer has to land on one specific thing. An intent line with no pointer can't be authorized, because "yes" doesn't say which branch to merge. A pointer with no intent can't be judged, because a branch name tells the user nothing about what a person experiences. The user needs both, plus the action, in one place, so the user can reply "yes", "test it" or "no" per number and the agent knows exactly what to do with which pointer.

What it looks like, one block per branch, worktree or commit:

> **36. <frontend-repo> · `recover/stash-icf-misquote-and-links`**
> - 36a. When someone reads one of the ten /learn pages explaining what coaching is and isn't, your intent is that we never put words in the ICF's mouth...
> - 36b. When someone reads the PERMA, Pickle Jar or Minto practice page, your intent is that the short answer reads once, cleanly...
>
> *Next:* re-run the payment-count test because it passed some runs and failed others, then merge, leaving out this branch's copy of the translation lock.

- The label is the repo plus the exact branch name, worktree path or commit hash, so the user's "yes" points at one thing.
- The lines under it are intent only, in the sanity-check form ("When [person in situation], your intent is [experience]"), one assumption per line, numbered continuously across the whole sweep. No conflicts, no dry runs, no merge mechanics: those are the agent's to handle.
- The *Next* sentence names one action (merge, test, finish, park, or wait for the user's word on a specific question) and, if it isn't plain "merge", says why in the same sentence.
- Leftovers with no intent of their own (copies of work already on staging, duplicate backup pins) don't get blocks. Say in one line that they'll be cleaned up, and clean them up.

### Inconsequential work gets handled, not carded: one blog page with no top-traffic marker, a non-critical improvement, telemetry only (the user, 2026-10-08)

In the same sweep the agent kept bringing the user decisions that had no human weight: 46 Youper page titles that still said "closing" after Youper closed, and a repeated-text fix on three practice pages that sat waiting for the user's "yes". The user said, about the Youper titles: *"these are noise. we are posting seo blog pages, not updating every day. they should be dated and pushed. operating at a scale of 10k seo surfaces a day, single pages with inconsequential data are irrelevant, unless these are driving major traffic they are a distraction."* And then, making it standing: *"inconsequential stuff ( single blog page no known 'top traffic' marker, non critical upgrade ) should get auto handled not wait for my approval. update skill file 'instincts' for batch skill"*. Earlier the same day, for measurement-only changes: *"yes this is just telemetry, you can auto merge things that are just telemetry without asking"*.

Why it matters: the user is the bottleneck, and the work runs at the scale of thousands of pages a day. Every card about one quiet page costs the user's attention and buys nothing a person would notice. A decision that's waiting on the user also holds back the finished work around it.

What "auto handled" means in practice:
- **It covers:** a fix or improvement on a single blog/SEO page with no top-traffic marker; a non-critical upgrade (wording polish, a repeated sentence, a render nit, an additive doc); and telemetry-only changes. These get reviewed at the depth their risk calls for, merged to staging, cleaned up, and reported to the user in one line with the commit hash. Don't build a card and don't wait.
- **Checking for a top-traffic marker:** before you call a page inconsequential, look for evidence that it brings people in. That evidence is Search Console clicks or impressions for the page, a title-list entry sourced from a top query (`source` containing `gsc-top-query`), or the page appearing in a traffic report. If you find one, it's no longer "one quiet page". Card it with the traffic number.
- **Stale facts on dated pages:** leave them alone. A page that was true when it went out is a dated snapshot, not a maintenance item. Don't propose "fix the N pages". Fixes that are already finished still ride along with their batch.
- **Still never auto-handled, however small:** coaching words or prompts, money or billing, sign-in, anyone's private information, deleting work, crisis or safety copy, and anything at scale (one generator touching thousands of pages, or an index leaving 20,708 pages unreachable). Those get the full card. Quote accuracy is a truthfulness question, not freshness. It's auto-handled on one quiet page (fix it to the real source), and it gets carded when the page has reach.

## First: sort every batch by whether it can reach a person (user correction, 2026-09-24)

After Batch 1 of a sweep, where a full card went into depth on a report-wording fix, the user said: *"this is an example of a detailed description that went into depth for something that is inconsequential because it has no possibility of impacting humans. And it does not really require human review because everything is done correctly as far as I can read. So in this situation, you would just tell the agent to commit it. And you would give me the, the, you know, the sanity check in probably three sentences because it's inconsequential. The sanity check would be proportionate to the consequential nature of the thing."*

What that means for the sweep: once the reviewers report, sort every batch before presenting anything.

- **Can't reach a person, and the reviewer found it correct** (internal report wording, a check's own saved state, dated logs and records, agent-instruction text, additive docs): commit it now through the committing agent. It still gets explicit-path staging, a personal-info guard, and ledger/commit-log notes. What the user sees is about three sentences saying what it was and that it's committed. Don't wait for the user's word.
- **Can reach a person, or is the user's to decide** (users, money, anyone's private information, deleting files, coaching words, a seed of the user's intent, any NO verdict): this gets the full card at the depth the governer score demands, and you wait for the user's decision.

The user's next words, the same day: *"if there are 'cards' for me to review, open them in obsidian. don't just tell me they are there."* And then: *"I can't see your work product. show me the work product."* So every card that needs the user's decision goes on the Obsidian board as a Batch-Review note. Open the board with the `obsidian://` link and take a screenshot to confirm the cards actually render there. Do **not** send the user the .md note files in chat. The user's words: *"I don't want md files what does that have to do with your scope???"* The board is the surface. Never write "N cards queued" about cards the user can't see on it. Never describe reviewed or queued work in words that could be read as "done". Say what was committed, with hashes, and what is waiting for the user. When the board also holds older pending cards from earlier sweeps, list today's card titles in chat so the user can find them. If the user can't see it, it hasn't been presented.

## The two delivery modes — pick by scale

There are two ways to deliver batches, and the choice is about where the user reviews, not about the content standard (the content standard — one concern, UX-framed, real "See it yourself", confidence + impact — is identical in both).

- **Chat mode (THE DEFAULT — use this unless the user asks for the board):** present one batch at a time in chat in the `/sanity-check` format from §3, wait for the user's word, commit, next. Regardless of how many batches the sweep produces. The user's standing preference (2026-07-24) is *"I'd like to see the sanity check per batch"* — in the conversation, where the user's already looking. Do NOT route to dashboard mode just because a sweep produced 5+ batches; batch count is not the trigger.
- **Dashboard mode (only on request):** when the user asks for a review surface — "for my approval", "one-click review", "put it on the board", "dashboard" — write **one note per concern** into the Obsidian Batch-Review folder, feeding a dataviewjs dashboard with per-batch approve / reject / request-evidence / reviewed buttons. The user reviews durably in Obsidian, and the user's approve-button writes a dated authorization the committing agent reads as the green light. Use when the user wants the audit trail to outlive the conversation.

Never ask the user which mode. Chat unless the user named the board.

When in dashboard mode, dispatch one Opus subagent per concern (run_in_background) to write its note — each subagent runs `/sanity-check` on its batch and verifies any deletion is a safe move, not loss. The orchestrator stays in the parent thread (never delegate orchestration to a subagent) and surfaces each note as it lands.

### Verification depth is governer-scored per batch — automatically, never ask (MANDATORY)

The depth of verification a batch gets is NOT a judgment call to surface to the user — it is dictated by the batch's risk, in direct proportion. Do this silently; do not ask the user "how deep should I go?" — the answer is always "as deep as the risk demands."

The user's words for what this is (2026-07-24): *"proportionate to the risk or blast profile meaning the governor score — like if it's user facing then you're gonna run a governor score and you're gonna have a subagent review the code with the same degree of complexity that the risk profile looks like for the batch."*

So there is a **chain**, and each link is mechanical:

```
batch risk profile  →  governer score  →  required review depth  →  verdict-with-evidence on the card
```

**Score each batch first** (before dispatching its reviewer). Risk = **blast-radius × irreversibility × volume**. Print the score and the one-line reason for it on the batch card, so the user can see *why* this batch got the review it got — a card claiming "safe" at score 12 is a different claim than one claiming "safe" at score 74, and the user needs to see which the user's reading.

Then the score sets what the reviewing subagent is **required to do**. It is not free to review less:

| Score | Batch shape | The reviewing subagent MUST | Verdict the user reads |
|---|---|---|---|
| **< 20** | Docs, markdown moves, additive files, no deletions | Read the diff. Confirm no delete hides a loss — if files moved, count the destination and spot-check they exist intact at the new path. No tests required. | *"Safe to commit. Sweeps documentation for X plus component Y, which is correctly located at Z."* |
| **20–49** | Config, internal tooling, scripts, test harnesses | One concrete check that the change does what it claims. Parse-check every touched JS/TS file (`eslint` single-file, never a full build). Name explicitly what was NOT checked. | *"Safe, with a named gap: I verified A; I did not verify B."* |
| **50–79** | Production code that changes behavior — but not money/auth/coaching | Run the tests covering the touched paths and **read the output**. Scan the diff against the CLAUDE.md antipattern list. Trace the user journey the change claims to affect. | *"Tests green — safe."* OR *"Tests RED at {file}:{line}. Intent was A. Recommend fixes 1/2/3 before commit."* |
| **≥ 80** | Money, auth, coaching path, secrets/`.env`, 50+ deletions, shared library other agents depend on | Everything above, **plus** walk the real surface to ground: curl the endpoint and read the **content** (never accept a 200 as proof a page works), or render the page and read the served HTML — not the agent's model of it. State the residual unverified gap with its own confidence. Escalate into the full `/governer` pipeline. | *"NOT safe to commit. Here is what I ran, here is what came back red, here are the fixes I recommend first."* |

**The verdict is the product.** Every batch card ends with an explicit **`Safe to commit: YES / NO / YES-WITH-GAP`** line plus the evidence behind it. The user greenlights by agreeing with your call — so the call must be yours, made out loud, with its evidence attached. A card that describes changes without rendering a verdict has failed: it hands the judgment back to the user, which is the exact labor this skill exists to remove.

**Never soften a red.** If tests fail, the verdict is NO and the fixes are named. Do not commit a NO batch even if the failure looks unrelated to the diff — say it's failing, say what you think it is, let the user decide.

**Dispatch the reviewers as subagents** (the user's standing preference: *"you're going to use subagents mostly"*). One subagent per batch, each given ONLY its batch's file list, its score, and the required depth for that score — never the orchestrator's reasoning, so the review is independent rather than a confirmation of what you already concluded. The orchestrator stays in the parent thread and never delegates orchestration.

The principle: **the more irreversible and the wider the blast radius, the more the user is trusting the verification — so the verification must earn that trust in proportion.** A secrets-exposure risk is never "flag and move on" — it is fixed (e.g. add the `.env*` pattern to `.gitignore` so the secret can never be committed) and the fix is verified with real `git check-ignore`, because leaving a loaded gun on the table fails the defensive-posterity rule even if you labeled it.

### "Low risk / generated content" is not one bucket — the spectrum inside score <20 (user correction, 2026-09-17)

The score-<20 row above says "read the diff, confirm no delete hides a loss, no tests required." That sentence is true for internal bookkeeping data and dangerously incomplete for anything a real visitor reads. A batch review committed 197 share-card SVGs and proposed committing 385 practice-page copy edits on a diff read alone — both scored LOW, both are "generated content" — and a live render check the user demanded afterward found a real, ship-worthy defect (two clauses saying the same thing back to back) sitting inside one of those files, which a JSON/text diff could never catch because each string was individually well-formed. The user's framing: *"generated content is severely lower risk than coaching for all production users content, but still high enough for these checks."* Two different claims were being collapsed into one score:

- **"Will committing this break something or destroy data?"** — a diff read answers this, and for inert bookkeeping data (a job-status file, a fingerprint cache, an internal report nobody but an agent reads) a diff read is the whole answer. Score stays low, depth stays low.
- **"Does this fulfill the reader's actual experience once it's real?"** — a diff read CANNOT answer this for anything a human will actually read or see rendered — copy, share-card images, page titles, translated strings. The data can be perfectly well-formed and still read wrong, redundant, or broken once it's laid out on a real page. This question needs the actual rendered result opened and read, not its source.

A rough spectrum, low to high, to make the recall easier than re-deriving it:

1. **Internal machine bookkeeping** (job-status/log files, fingerprint/dedup caches, an agent-to-agent report) — lowest. Diff read only; nobody but an agent or the user reads the raw file, and even then only for debugging.
2. **Generated content a real visitor reads or sees, but off the coaching path** (SEO article copy, share-card preview images, page titles, translated strings, practice-page prose) — still LOW on the breakage/irreversibility axis (a bad sentence doesn't take the site down and is trivially revertable), but it FAILS the sanity-check's actual job — confirming intent was fulfilled — on a diff alone. These require opening the real rendered result (a built page, a rendered SVG, an actual served `<title>`) and reading it as the visitor would, per the UX-impact verification rule already in `/commit`. Do this even when the governer score reads low, because the score was measuring blast radius, not reader-experience correctness.
3. **Content or code inside the actual coaching conversation a paying user has** — high regardless of how "just content" it looks; treat at the ≥50 depth in the main table, never at the diff-read depth, because a wrong sentence here is not cosmetic, it is what somebody in a real crisis is being told.

The test before scoring anything "low, diff read is enough": *would a human ever actually read or see the rendered result of this file?* If yes, the diff read proves it won't break the build — it does not prove the batch did what it was for, and both proofs are required before a verdict of SAFE_COMMIT for anything user-facing.

### Dashboard mode — the concrete contract

- **Dashboard file** lives at `<api-repo>/docs/intent/5.0_Founder_Dashboards/Indexes/Commit-Batch-Review.md` — a dataviewjs feed modeled on the sibling `Recent-Changes.md`, reading notes whose frontmatter `artifact-type: commit-batch`, grouped by repo, each card showing concern + confidence chip + file count, with approve/reject/request-evidence/reviewed controls. Build it first if it doesn't exist; reuse it if it does.
- **Batch notes** live in `…/Indexes/Batch-Review/`, one per concern, each with this frontmatter:
  ```
  ---
  artifact-type: commit-batch
  repo: {any workspace repo — <api-repo>, <frontend-repo>, <landing-repo>, <mobile-repo>, context-gateway, agent-swarm-mcp, … — MANDATORY and unmistakable}
  concern: {one-sentence UX concern — becomes the card title}
  confidence: {0-100 — confidence the change does what it claims, end-to-end}
  file_count: {N}
  session_title: {human label}
  delete_candidate: false   # set true if this batch is debris/accidental/should-be-removed — surfaces a two-step delete button
  ---
  ```
  A fresh note leaves `admin_verdict` OUT (unset = pending). The dashboard writes it when the user acts.
  Body: a "See it yourself:" lede paragraph first (per §3), then `## When X → then Y` (each statement carries its own `confidence: NN%` and `user impact`), `## Files in this batch`, `## Sanity-check result`, `## Recommendation`, `## Assumptions`. A `_TEMPLATE.md` in that folder holds the canonical shape. If the `Batch-Review/` folder or its `_TEMPLATE.md` does not exist, create it.
- The dashboard renders **three sections on one page** — **Awaiting your review** (pending, full action buttons), **Approved**, and **Rejected**. Acting on a card does NOT make it vanish: **approve** stamps `admin_verdict: approved` and moves the card to the Approved section; **reject** stamps `admin_verdict: rejected` and moves it to Rejected; both keep a dated authorization line and stay visible as an audit trail. The committing agent reads the approval before running `/commit`.
- **Delete flow (for `delete_candidate: true` cards):** the card shows a two-step **delete** button — the user clicks it, types `DELETE` into the confirm field, and the note is stamped `admin_verdict: delete-confirmed` + a dated authorization line. That verdict is the signal a cleanup agent recognizes as authorization to actually `rm` the files. This replaces the old failure mode where the user had to type "DELETE IT" in prose for an agent to parse. NEVER delete files without this stamped `delete-confirmed` verdict (or an equally explicit user instruction).
- After writing notes, open the dashboard in Obsidian (`obsidian://open?vault=<their vault name>&file=…&newtab=true`) so the user can review immediately — don't just report paths.

## Every vault-doc reference MUST be a clickable surface (non-negotiable)

When a note references another doc in the Obsidian vault, the user must be able to **click straight to it** while reviewing. A path in backticks (`` `docs/intent/.../REPORT.md` ``) renders as dead monospace text the user cannot click — that's a defect, because it forces the user to copy the path and hunt for the file, which is exactly the friction this skill exists to remove.

The target: every reference is the right *clickable* form for what it points at.
- **A vault doc** → an Obsidian wikilink `[[path/inside/vault/NOTE|readable label]]` (the path is relative to the vault root `docs/intent`, drop that prefix; the `|label` gives readable text). This is the clickable surface.
- **A folder** (wikilinks target notes, not folders) → link the folder's landing note: its `00-INDEX`, `INDEX`, `README`, or first file. Do the work of finding which one exists — don't hand the user a folder path and make the user navigate.
- **An external web URL** → a markdown link `[label](https://…)` — already clickable, correct as-is. Do NOT convert these to wikilinks.
- **A shell command, code symbol, file you mean literally-as-text** → leave it as code in backticks. It's not a vault doc; it shouldn't be a link.

The test before you publish any note: read every backtick span and every reference — if it points at a vault doc and isn't a `[[wikilink]]`, it's dead; fix it. The user reviewing should never meet a reference the user can't reach in one click.

## 1. Scan uncommitted files

### Scope is the product repos. ALWAYS. Never ask. (STANDING DEFAULT — asking is a defect)

The scope of a `/batch` sweep is the **3 product repos** — `<api-repo>`, `<frontend-repo>`, `<landing-repo>` — plus the **parent `ix` repo** when it is dirty (it carries the shared `.claude/` hooks, settings, and CLAUDE.md that govern every agent, so its changes are product-governing even though it isn't a product surface).

**Order: the parent `ix` repo is never first — it is last.** The user, 2026-10-03, after a sweep opened on `ix` and committed five `ix` batches before touching a product repo: *"focus next phase on ix last and update the skill file it's never first it's for when you have completion on the other systems <frontend-repo> and <api-repo> and landing."* The product repos are where people are affected, so they get the sweep's attention while it is freshest. Finish <frontend-repo>, <api-repo> and <landing-repo> first: their loose files batched and committed or carded, and their abandoned-work merge reviews done. Only after that, open `ix`. That `ix` holds the hooks every agent runs under is not a reason to go first. It is a reason to go last, once the systems those hooks serve are settled.

**Last also means unmentioned until then.** The user, 2026-10-03, after a "what's left" report kept putting `ix` cards in front of the user while product-repo work was still open: *"stop talking about ix until we're done with other things, update skill file."* Don't put `ix` items in reports, card lists or pending-scope lists while <frontend-repo>, <api-repo> or <landing-repo> still have open work. That includes "coming later" lines. Track them privately and bring them up only when the product repos are done.

This is a **standing default set by the user, not a per-sweep question.** Do NOT ask the user to confirm scope. Do NOT bundle a scope question into some other question you're asking. The user has stated it; restating it is the user's time being spent on something the user already decided. Widening is the only thing that requires the user's word — and the user says it unprompted ("other repos", "all of them", "include everything uncommitted", naming a specific repo). Absent that, product repos, silently.

If you find yourself uncertain about scope because you're *also* uncertain about something adjacent (delivery mode, grouping, depth), resolve the adjacent thing on its own merits and leave scope alone. An unrelated ambiguity is not a licence to re-open a settled default — that coupling is exactly how a decided question gets asked twice.

The workspace holds many more git repos under `<your workspace root>/*` — mobile app (`<mobile-repo>`), infra (`context-gateway`), MCP servers (`agent-swarm-mcp`), the marketing/posting stack (`agent-marketing`), test harnesses (`agentic-testing`), and others. These are OUT of scope unless the user widens. When the user does, enumerate every dirty repo:

**The skill library is NOT under `ix/`.** It lives at `~/.claude/skills` and is published from
`Next-AI-Labs-Inc/ix-skills`. Editing a skill means editing it there. This line used to name
`ix/_agent_skills` as "the skills library", which was a stale fork nothing loaded — agents read
that, believed it, and wrote skill edits into it for months while the skills agents actually run
never changed. Sixteen skills ended up existing only in that fork, including the whole
"verify the feature end-to-end" set that CLAUDE.md routes to. The fork was deleted 2026-09-17.
If you are about to write a skill anywhere under `ix/`, you are writing it in the wrong place.

```bash
cd <your workspace root>
for d in */; do [ -d "$d/.git" ] && printf "%-30s %s dirty (branch %s)\n" "${d%/}" "$(git -C "$d" status --short | wc -l | tr -d ' ')" "$(git -C "$d" branch --show-current)"; done
```

Watch for **symlink aliases** (`api`→`<api-repo>`, `ixc`→`<frontend-repo>`) — confirm with `[ -L "$d" ]` and never double-count them as separate repos.

Every card's `repo:` frontmatter and overview MUST make the source repo unmistakable — when batches from 5+ repos share one dashboard, the user must know at a glance which repo each card belongs to without opening it. The dashboard groups by repo for exactly this reason.

Collect every unstaged and staged change. Separate real code changes from doc/artifact churn early — a raw file count (e.g. "368 changes") is misleading until you split modified production code from markdown/doc reorganization; the code is the needle that needs deep scrutiny, the doc-churn is the haystack.

## 2. Group by concern

Batch files into groups where each batch addresses **exactly one concern** — one bug fix, one feature, one refactor. Files that fix the same user experience problem go together.

### What "one concern" actually means — the seam is the DECISION, not the file type

This is the part that gets it wrong, and it gets it wrong in a way that looks correct until the user tries to click.

The intent of a batch is that it is **one question the user can answer with one word.** That is the whole purpose. So the test for whether something is one concern is not "are these files similar?" — it is:

> **If two items in this batch could get DIFFERENT answers from the user, they are different concerns.**

Grouping by file type feels like grouping by concern and is not. A sweep once produced a batch called "written records" that held: a live routing line being deleted from the agent instructions (the user wants it *restored*), forty strategy and audit documents (the user wants them *kept*), ninety-six files of generator leftovers (the user wants them *excluded*), a source-code file misfiled among the docs (needs a *code* review, not a docs review), and an active personal legal matter (a *privacy* decision only the user can make). All five were grouped together because none of them were code — a property of the files. Five different questions with five different right answers, welded into one card. There was no honest click available: approving it would have approved the debris and the deletion alongside the records the user wanted. The user caught it and said "separate these by concern."

What a 10/10 grouping looks like: the user reads a batch title, knows immediately what the user is being asked, answers it, and nothing the user just approved surprises the user later. Every item inside that batch shares the same fate — they all ship together or none do, and the user would say the same word about each one individually as the user says about the group.

Ask, per candidate batch, before writing a single card:

- Would the user **restore** one of these and **commit** another? Different concerns.
- Would the user **keep** one and **exclude** another? Different concerns.
- Does one need a *code* review's standards and another a *documentation* review's? Different concerns — code never rides inside a docs batch regardless of which folder it landed in.
- Is one of them a decision only the user can make (privacy, legal, coaching language, money) while the rest are routine? That one gets its own card. *(Superseded 2026-09-24: this line used to say such a card gets "no recommendation" and "hands the judgment back." Agents read that as permission to ask the user how to do their job, and the cards came out as approve/reject menus and "your call." The user's words: "their job is to state what the intent of the code was clearly using the sanity check format... and flag if there's issues. And if there's issues, they should be proposing a solution, not proposing that I commit it.")* A private, legal, money or coaching-language card is written exactly like every other card. It states the intent the work must have had, in sanity-check form. It flags the issue. It proposes the specific solution the reviewer would carry out. The decision is still the user's, and it is made by reading a proposed solution, never by answering a menu of options.
- Is one item's verdict YES and another's NO? They cannot be the same batch, by definition.

Split until every batch survives all five questions. More cards is not worse — an unapprovable bundle is worse. Splitting a batch that turned out to hold five decisions is not a failure of the sweep; catching it before the user does is the sweep working.

When a batch is split after cards were already written, retire the bundled original by renaming it with a `_superseded-` prefix rather than deleting it, so the queue shows one clear set while the history stays intact.

## 3. Present batches one at a time

### The approved batch card shape — this is the artifact, canonized 2026-08-03

The user read a sweep presented in the shape below and said: *"whatever you just did to provide this sanity check, whatever the directions were, after all the iteration, this was the correct thing."* What follows is that shape, and — more importantly — why each part of it exists, because an agent that knows why will reproduce it in a new situation while an agent following a template will only reproduce it in the same one.

**The intent this shape serves.** A batch card exists so the user can answer one question in seconds without translating code in the user's head, and without any part of the user's answer being a guess. That means three things have to be true at once, and each element below exists to make one of them true.

*The user must be able to disagree precisely.* This is why the intent claims are numbered and atomic — one falsifiable claim per line, never bundled. If line 3 holds four assumptions welded with "and," the user cannot say "3 is wrong," the user can only say "something in there is wrong," and now the user has to do the decomposition work themselves. That is exactly the labor the card exists to remove. When a drafted line contains "and," "so," "plus," or "which means" joining two separately-checkable claims, it is two lines.

*The user must be able to see the judgment calls, not just their results.* This is why decisions get surfaced as decisions. A diff is a record of forks — every default, threshold, ordering, guard, and fallback is a place someone chose A over B. Reporting only the resulting behavior leaves the choice buried in the code for the user to reverse-engineer. Each decision states what was chosen, what it was chosen *over*, and the value judgment that settled it. The highest-value version of this names the cost being accepted: "Rejecting the first means accepting a real window — up to ~15 seconds — where someone whose session was revoked server-side is still looking at their workspace. You chose that, and it's the right call for one reason... But it is a genuine tradeoff, not a free win, and you should approve it knowing that." That sentence lets the user approve *knowingly*, which is the difference between the user's approval meaning something and the user's approval being a rubber stamp.

*The user must be able to check it themselves if the user wants to.* This is why "See it yourself" is a real human walk on real surfaces, never a mechanism. Covered in full in the section below — the short version is that testing the mechanism tests the agent's model of the mechanism, and that model is the very thing whose correctness is in question.

*And where the ground is soft, the user must be able to see that it is soft.* This is why every assumption carries its own confidence number, and why the low ones matter more than the high ones. A 60% on "the investor numbers are internally consistent with their own source ledgers — I confirmed the ledgers exist, I did not audit each claim against each source" is worth more to the user than five 95%s, because it tells the user exactly where to spend the user's attention. Never round a soft number up to sound more confident; the soft numbers are the most useful content on the card.

**The shape:**

```
## Batch N — {headline in plain human terms, what changes for a person}
**{repo} · {N} files · risk {score}/100 · verdict: {SAFE / SAFE, one gap / NO}**

If this work was aligned, your intent must precisely have been:

1. When {exact human-step conditions, real values named}, your intent is that
   {the intended experience} — because {why, including what it was before}.
2. ...

**The decisions, and what got rejected:**

**Decision — {the fork, named}.** The fork was: {option A} or {option B}.
Rejecting {A} means {what that costs or buys}. {The value judgment that settled it,
including the cost being accepted if there is one.}

**See it yourself:** {real starting state → real action at a real URL → what the user
should SEE if the intent came true}. Or `not human-observable: {one-line why}`.

**Assumptions:**
- {atomic claim} — **{N}%**{, and how it was verified}
- {the soft one, stated at its real confidence, with what was NOT checked}
```

Numbering runs **continuously across all batches in a sweep** — batch 1 ends at 5, batch 2 starts at 6 — so the user can say "12 is wrong" and there is exactly one line 12 in the whole sweep.

Every card ends with an explicit **`Safe to commit: YES / NO / YES-WITH-GAP`** and its evidence. The verdict is the product: a card that describes changes without rendering a verdict has handed the judgment back to the user, which is the labor this skill exists to remove. Never soften a red — if tests fail, the verdict is NO and the fixes are named, even when the failure looks unrelated to the diff.

**Worked example at the target altitude** (one statement, one decision, one soft assumption):

> **1.** When a person who already has a valid session cookie in their browser opens the app, your intent is that they see their coaching workspace immediately — not a spinner — because the cookie already implies they're logged in and there is no reason to hold the whole screen while the server merely confirms what the cookie already said. Before this, `PrivateRoute.js` returned a full-screen `<LoadingSpinner>` for as long as `isLoading` stayed true, which is up to roughly 15 seconds (`validateTokenWithTimeout` plus its retries).
>
> **Decision — the offline banner now requires proof before it clears.** The old code cleared it on a blind 3-second timer with a comment literally saying "don't test connection." The fork was: clear on a timer (cheap, lies) or poll a real probe every 3 seconds until it succeeds (costs requests, tells the truth). Rejecting the timer means the UI can never again tell someone they're reconnected while the backend is dead.
>
> - No automated test actually renders the new immediate-render behavior; the closest test is a hand-computed logic check. So claim #3 rests on that trace, not on a regression test that would catch it breaking later — **100%** confident this gap exists.

Notice what makes that statement work: the intent leads, the human conditions are named first, and the code symbol (`PrivateRoute.js`, `isLoading`, the ~15 seconds) rides inside as the precision anchor *after* the meaning is established — never as the subject of the sentence. The user can grep every named thing to verify it, and the user never had to ask what any of it meant.

### HARD REQUIREMENT — every batch is presented in `/sanity-check` format (non-negotiable)

This is not optional and not a default that can be swapped for a looser shape. **Every batch — in chat mode AND in every dashboard note — MUST be presented in the `/sanity-check` skill's output format.** A batch reported as recommendation-prose, a bullet summary, a "here's what I found" narration, or any shape other than the sanity-check shape has FAILED this skill's contract, even if every fact in it is correct. The user reviews batches at accept/reject moments — the exact moments the `/sanity-check` format exists to serve — so the format IS the review surface.

Before presenting ANY batch, invoke the `/sanity-check` skill and produce its output for that batch. That means, per batch:

1. **The numbered UX-statement list.** Each statement in the canonical shape: **"When [the exact human-step conditions, with real values named — not code, the actual user situation] then [the actual system/manager in charge of this] should [the real programmatic control or function name, in parens, AFTER the semantic meaning] so that [the intended UX experience]."** Each statement must pass the cold-read test — a reader with zero session context can read it and ask no clarifying question. No bare variable without its semantic meaning inline.
2. **The decisions, surfaced and translated.** For each non-trivial change in the batch, name the decision *as a decision* — what was chosen, what the alternative was, and why this one — in human terms. A diff is a record of choices (every guard, default, threshold, ordering, fallback is a fork); reporting only the resulting behavior leaves the decision buried in the code for the user to reverse-engineer, which is the failure this section exists to prevent.
3. **"See it yourself:"** the real human-journey recipe — real starting state → real action at real URL → the lived result the user would observe — never a mechanism (no cookie/DB/flag/file-inspection). Or `not human-observable: {one-line why}` when honestly nothing surfaces.
4. **Assumptions**, each with a confidence %.

The `### Batch {N}` heading + one-sentence UX concern still leads each batch; the body below it is the `/sanity-check` output, not the old custom template. Dashboard notes carry the same sanity-check body inside the note frontmatter shape defined in the dashboard-mode section.

Be super specific — include routes, file names, line numbers, the actual user journey flow. End each batch with: "Would you like me to perform more steps before committing this?"

### The "See it yourself" intent — the finished reality, walked by a human

This is the most precise thing in this skill. Read it as intent, not as a rule. The target it describes is what a 10/10 "See it yourself" step looks like, and *why* — so you can reproduce that target for any feature, not just the one in the example.

#### The worked example of getting it WRONG (study this against the batch considerations above)

For an auth batch where the intent was *"a person who logs in on the main app is recognized when they reach the marketing site,"* an agent wrote this verification step:

> **See it yourself:** Start the landing site (`npm run dev`, port 3005). Open `http://localhost:3005`, open DevTools → Application → Cookies → localhost:3005, and **delete the `token` cookie** (and `ix_user_logged_in`, `adminToken` if present) to simulate a logged-out cross-domain user. Reload. You should see `[AUTH_HEALTH] ...` fire in the Console.

Against the batch considerations, that step fails at the root. The batch format asks for the **UX concern** — "when a user {who} on {PATH} we intend {A} but {B} happens" — and the verification is supposed to prove that *intended experience*. Deleting a cookie in DevTools proves nothing about the experience, because **no human ever does that**, and worse, it tests the agent's *model of the mechanism* rather than the lived reality. Here is the full articulation of why, in the voice of the agent realizing it:

> **What I was doing wrong, at the root:** I reached for the cookie because the cookie is what the code touches. That's the tell. I was verifying the code's mechanism, not the human's experience. The cookie is an abstraction — it's my model of "how login is remembered." And here's the part that lands: my model of the cookie-to-logged-in relationship could itself be wrong. If I test by deleting the cookie, I'm testing my own assumption about what the cookie does. If that assumption is wrong, my test passes and the real thing is still broken. So testing the cookie can never be the final test — the final test has to be the actual reality, precisely because the actual reality is the one thing that doesn't depend on my code being right. The whole point of a human walking the real path is to check the thing my code/cookie model cannot check about itself.
>
> **What the real test actually is:** the finished reality this code exists to create is — a person clicks login in one place, navigates to the other place, and is recognized. That's it. To make that observable, the human has to start logged out, then log in at the real place, then go to the real other place and see if they're recognized. Named real surfaces — and that means I have to go figure out from the code: do they log out at localhost:3000, at 3005, or both, to get into the clean starting state? Which one is the login origin, which is the place recognition is supposed to appear? That discernment is my work to do, by reading the code, so you don't have to think about any of it.
>
> **The deeper thing — the question I skip 80% of the time:** before writing any verification step, I have to ask "what would a human have to actually experience for this to be a success?" and let that — not "what does my code poke at" — generate the steps. I only do that ~20% of the time. The skill has to force that question to the front, every time, and forbid the shortcut of testing the mechanism instead of the lived outcome.
>
> **The cost you're naming:** figuring out the real path (which port logs out where, which is the login origin) takes real work. That work is mine. The skill exists to make me do it so the path you receive is a clean human recipe you can just walk — not a puzzle you have to solve because I was lazy about thinking it through.

#### The intent, distilled

> **Reflection (the through-line):** The thing the agent kept missing has one root: it was treating "verification" as confirming the code's mechanism does what it thinks — so it reached for the cookie, because the cookie is what the code touches. But the cookie is the agent's abstraction of "logged in," and that abstraction can be wrong. If you test the abstraction, a wrong abstraction passes while the real experience stays broken. The verification exists precisely to check the one thing the code-model cannot check about itself: did the actual lived reality we were building come true for a real person. So the target of a "See it yourself" step is never the mechanism — it is the finished human experience, reached the way a human reaches it: start in the real starting state (here, logged out), do the real act at the real place (log in at whichever origin the code actually uses), go to the real other place, and see if the intended thing appears. And the work of figuring out which real places — log out at localhost:3000, or 3005, or both; which is the login origin; where recognition should show — is the agent's work, done by reading the code, so the user receives a clean walkable recipe instead of a puzzle. The skill encodes that intent — what the perfect verification step is and why — not a list of forbidden shortcuts.

#### What a 10/10 "See it yourself" step is, every time

Before you write a single step, ask the generating question and let *it* produce the steps:

> **"What would a human have to actually experience, start to finish, for this batch to count as having worked?"**

Then build the recipe out of that answer — real surfaces, real actions, the real starting state — and deliver it **first, before you explain the code**:

1. **The real starting state.** What must the human be, as a user, for the test to be valid? (Logged out? Logged in as a paying user? A free user who has sent N messages?) If reaching that state requires an action — *log out first, and at which place* — you figure out from the code where that action has to happen (which origin, which port, both) and you tell them exactly where. The starting state is part of the recipe, not an assumption.
2. **The real action at the real place.** The full clickable URL where the human does the real thing (logs in, clicks the button, submits the form) — the same way a real user would, never a simulated state.
3. **The real place the result should appear,** and exactly what to look at there.
4. **What they should SEE if the intent came true** vs. what they'd see if it didn't — described as the lived experience ("you're greeted by name / your admin tools are there"), not as a code signal.

The bar: the user reads one short recipe and proves *the finished reality you claim you built* to themselves, by being a user, on real surfaces. The agent has already done all the discernment — which page, which port, what order — so there is no puzzle left for the human to solve. That discernment work is the whole point; doing it is how you make it easy for the user.

A signal you've slipped back into the failure: if your step mentions a **cookie, localStorage, DevTools state, a feature flag, a DB row, a request header, or any internal the code manipulates** as the thing to set up or inspect, stop — you're testing your model of the mechanism again. The mechanism is the very thing whose correctness is in question, so it can never be the proof. Re-ask the generating question and rebuild the step out of real user actions on real surfaces.

#### Worked example at the target altitude (auth recognition)

> **See it yourself:** This proves the real thing — *log in on the app, get recognized on the marketing site.*
> 1. Start logged out everywhere. If you have a session, log out at `http://localhost:3000` (the app — that's the login origin) **and** at `http://localhost:3005` (the marketing site), so you begin clean. *(I confirmed from the code that the token is set by the app at :3000 and read by the marketing site at :3005, which is why both have to be clear to start.)*
> 2. Go to `http://localhost:3000` and **log in** the normal way.
> 3. Now navigate to `http://localhost:3005`.
> 4. **You should be recognized** — greeted as a logged-in user, your account state present. If instead you land as an anonymous visitor with no recognition, the cross-domain handoff is still broken — which is exactly the failure this batch makes visible.

#### When there genuinely is no human-observable path

Some batches don't surface in any UX a human can walk — a build script, a type-only change, a backend-internal refactor with no surfaced behavior. For those, write `not human-observable:` and one line on why, so it's clear you asked the generating question and it honestly returned nothing — rather than that you forgot to ask. A programmatic test (`jest`, a script) may be offered here, or *in addition* to a real path elsewhere — but it is never the answer to "how do I see this," only a secondary convenience.

### How to explain the code, once you do (MANDATORY)

When you move on to describe the code, you are NOT done translating. Follow these protocols every time:

- **Speak it out of code, into the user's journey.** Code is your reference, never your substitute. Talk about the *intent* of the code and **the exact point in a user's step-by-step journey where the experience deviates from that intent.** That deviation — intent vs. what actually happens to the person — is the primary thing you are communicating. Everything else supports it.
- **Lead with what it is and why it matters, instantly.** The user should know *what you're talking about* and *why it matters* without having to ask. If the user would have to ask a clarifying question, you left out critical context — that's the defect.
- **Name the exact conditions in human terms.** State precisely what conditions cause the deviation — and translate those conditions to their **semantic meaning in the user's journey**, not their code form. "When `effectiveSubscriptionStatus !== 'trialing'`" is wrong; "when a card-on-file trial user reaches the page" is right.
- **Never communicate with a variable I don't have a meaning for.** If you use a name, give its semantic meaning in plain language right there. A human is reading this, not a robot.
- **Synthesize, don't bucket.** Do NOT split "what / why / conditions" into separate labeled headers and dump them. Weave them together the way one intelligent human speaks to another — coherent, in order, in voice.

The voice this should land in (anchor example):

> Hey there. I was just working through the beta-19 path with you, and you had me test everything up until the user is registered — we're checking whether the modals that sign them up actually appear when they hit the critical gate that free users hit, which right now is X total messages. You asked me to build an admin UI to track the things that are critical, so I did that and you can see it at `PATH`. Notice X and Y — that does Z, so we can A when the user B. You can also...

## 3.5 The moment the user agrees, write the intent-ledger note (MANDATORY — before the commit)

The instant the user agrees to a batch's sanity-check, **write one note to the Commit Intent Ledger** — before `/commit` runs, while the user's agreement and the reasoning are both still in front of you. This is not a summary of the commit; it is the record of **what the user was trying to get**, in the terms of the thing itself.

The user's words for why this exists (2026-07-24): *"keep a ledger in obsidian of the intent of code so that when you run batch and I agree to a sanity check a new file is placed in the obsidian ledger documenting what the intent was of the code. there should be an index that's human readable and this gets added into the 'batch' command, it must say human readable title and one sentence description of the goal of the commit."*

**Where:**
- One note per commit → `<api-repo>/docs/intent/5.0_Founder_Dashboards/Indexes/Commit-Intent-Ledger/{repo}-{short-slug}.md`
- Shape → copy `Commit-Intent-Ledger/_TEMPLATE.md`
- If the `Commit-Intent-Ledger/` folder, its `_TEMPLATE.md` or its index does not exist, create it.
- Index → [[Indexes/Commit-Intent-Ledger|Commit Intent Ledger]] renders every note automatically from frontmatter. Never hand-edit the index; write the note and it appears.

**Frontmatter — `title` and `goal` are the two fields the index shows, so they carry the whole weight:**
```
artifact-type: commit-intent
title: {human-readable title — what a person can now do, or stops suffering}
goal: {ONE sentence — why this was worth doing}
repo: {<api-repo> | <frontend-repo> | <landing-repo> | ix}
commit: {short hash — fill in immediately after committing}
committed: {Jul 24, 2026}
governer_score: {the score this batch was reviewed at}
```

### The no-jargon rule — this is the whole point of the ledger (NON-NEGOTIABLE)

The user corrected this twice in one session, on consecutive messages, after the skill already said "translate to intent." So state it as a mechanical test rather than an aspiration:

> **In every part of a ledger note meant for reading, there must be zero code identifiers.** No file names. No field or variable names. No error strings. No line numbers. No function names. If a sentence cannot be understood by someone who has never opened the repo, it does not belong above the footer.

The user's two corrections, verbatim, because they are the calibration:
- *"statements like this are not human readable. you're supposed to document what my intent must have been if this is correct, not just describe the technical jargon"* — on a sentence reading `15,600 lines of the diff carry no decision at all. Sitemap practices-1..5 are <lastmod> 2026-07-18 → 2026-07-22 bumps, one per URL, added=0 removed=0 on every file.`
- *"I don't understand this, do not speak in code jargon during sanity checks."* — on gaps naming `.meta.json`, `keywords`, `meta_description`, `fetch-new-articles.js:246`, `.eslintrc.js`, `Environment key "es2021" is unknown`.

What each failure has in common: it reports **what the bytes did** instead of **what the user was trying to accomplish**. The test before publishing any line: *would the user have to ask me a follow-up question to know what this means?* If yes, rewrite it in the terms of the thing itself.

Worked translations — same fact, both altitudes:

| Jargon (never ship) | The terms of the thing (ship this) |
|---|---|
| "`.meta.json` rewritten; `keywords` and `meta_description` replaced by `fingerprint`" | "We rescued three articles you paid for, then threw away the sentence that shows under the blue link on Google." |
| "15,600 lines are `<lastmod>` bumps, `added=0 removed=0`" | "Almost all of this diff is a timestamp the generator rewrites on every run — no decision in it, so don't read the line count as substance." |
| "`.eslintrc.js` fails to load: `Environment key "es2021" is unknown`" | "The tool that catches broken code before it ships hasn't been able to start in this project at all — so every agent that said 'lint passed' was reporting on a check that never ran." |
| "catch block returns `active: hasEverPurchasedSession`" | "A paying customer keeps their access even when our own code breaks." |
| "`res.json()` without `return` → double-response crash" | "The server tries to answer the same request twice and falls over, so the person sees nothing load." |

**The technical footer is where identifiers live.** Every note ends with a `## Technical reference (for agents, not for reading)` section holding repo, hash, file list, score, and the exact verification commands with their real output. It goes **last**, deliberately, so it never sits between the user and the meaning — but it must be complete, because that footer is what a future agent acts on.

**This step is not optional and not deferrable.** A batch that commits without its ledger note has failed this skill even if the commit itself is perfect: the commit records what changed, and only the ledger records why it was worth doing. Write the note, run `/commit`, then fill the `commit:` hash back into the note.

## 4. Wait for approval

Only present **1 batch at a time**. Wait for the human to approve before showing the next batch.

## 5. Run the pre-commit code review on the batch (MANDATORY — per batch)

Before committing each approved batch, run the `/audit-pre-commit` skill against that batch's staged files. `/batch` exists to batch pre-commits, so the pre-commit code review runs **on every batch** — not once at the end, not skipped. Invoke `/audit-pre-commit` for the batch's files and resolve every principle it flags before the commit.

This is the gate that enforces, among the other shipping principles, **Principle 7 — added style definitions carry user-sourced consumption intent**: if the batch adds any style definition (a CSS class/token/template, a styled-component, an `@apply` class) without a comment articulating *when and how to consume it, sourced from the user's verbatim statements* (not an agent's abstraction, only ≥90%-derivable additions), the audit blocks the batch and you patch it from the user's actual words before committing.

## 6. Commit — the approved card text IS the commit message and IS the log entry

User directive, 2026-08-03, verbatim: *"take the exact thing you created that I approved… then commit the files with that in the title and description. then also make a copy of that to a new obsidian commit log with an index. the index will have a data view of the title and paragraph using our obsidian tools. and you just drop the document with that same text in there that's the deal."* And the reason: *"the intent is a clean understandable documentation that can be used for changelogs etc later."*

**The intent this serves, and why it changes how you write the card in the first place.** The moment the user approves a card, that text stops being a review artifact and becomes the permanent record of why this work was worth doing — in three places at once: the commit history, a durable log, and whatever changelog gets assembled later. It can do that because it was already written for a human: no jargon above the technical footer, real conditions named, decisions surfaced, confidence visible. Nothing is rewritten, re-summarized, or "cleaned up" at commit time — rewriting it would mean the version the user approved and the version that got recorded are different documents, and the whole value is that they are the same one.

The practical consequence runs backwards into step 3: **write every card as though it is already the changelog entry, because it is.** An agent that writes a card thinking "this is just for review" produces something that needs translating later. An agent that knows the card ships verbatim writes it right the first time.

### Who runs the commit: a Sonnet subagent with /commit — never the orchestrator (the user, 2026-10-03)

The user, verbatim: *"when committing, give the task to a sonnet subagent with /commit command."* The orchestrator's job is judgment. It reviews, sorts, writes the sanity check, and decides what goes in each batch. The commit itself is mechanical work, and it goes to a Sonnet subagent that runs the `/commit` skill. Hand that subagent three things: the exact file list, with hunks named where a file is shared with another batch; the approved card text, which becomes the message verbatim; and the repo. The `/commit` skill carries the staging and pre-commit guards, so routing through it means those guards run every time, not only when the orchestrator remembers them. Commits to the same repo run one after another, never in parallel. The steps below are what that subagent carries out.

**Watch for files someone else already staged.** A repo's index can hold another agent's half-staged file. A plain `git add` + `git commit` sweeps that file into this batch's commit. Commit with `git commit -- <paths>` so only this batch's files go in, and tell the subagent so.

### Never bring the user production, deploy, or "unpushed" status (the user, 2026-10-03)

The user, verbatim: *"do not mention pushing to production ever in these commands as 'scope to bring to the user's attention' update skill files. I already know needs to go to production, it's noise."* Production is the user's to decide. The user already knows that everything eventually goes there. A line telling the user something "still needs to reach production", "isn't pushed yet", or "is waiting on deploy" spends the user's attention on something the user already holds. What reaches the user is what needs the user's judgment: a card, a NO verdict, a question only the user can answer. Pushing to staging and reconciling a split staging branch are agent work, so do them as part of reaching a clean tree, and don't report them as items for the user. `/whats-left` has carried the same rule since 2026-08-27.

### Code inside a `docs/` folder is misplaced, never "just docs" (the user, 2026-10-03)

The user, verbatim: *"the docs should contain no programmatic code. they are docs this is misplaced."* and *"this local thing has nothing to do with the api, put it in its own repo."* The user said it after a reviewer passed a Python model router sitting under `<api-repo>/docs/intent/3.0_experiments/` as a low-risk docs batch. A docs folder holds documents. When a batch puts scripts, servers, compiled files or their data under `docs/`, the reviewer flags it as misplaced, whatever its risk score. The card names where the code belongs (its own repo, or the repo whose product it serves) and proposes the move. The notes stay in the vault.

### Zero user impact → commits without waiting, and its sanity check is still shown (the user, 2026-10-03)

The user, verbatim: *"since it has ZERO impact on users this should be auto committed rather than waiting for approval IF it passes the checks that i gave you, still the sanity check is required."* A batch that cannot reach a user commits without waiting for the user's word, if it passes the review its risk score demands. The personal-info guard and explicit-path staging count as part of that review. Not waiting does not mean not showing. Print each one's sanity check in chat **as it commits**, at the proportionate length (about three sentences plus the numbered intent lines and the hash). Never let a run of auto-commits go by with only progress narration. On 2026-10-03 an agent committed 12 batches over 16 minutes and showed none, and the user stopped it: *"you have been working for 16 minutes without a single sanity check. what is wrong with you."* The sanity check is how the user finds out what was committed in the user's name, so an unshown auto-commit is one the user cannot correct.

### The pipeline, per approved batch

**1. Stage exactly that batch's files.** Never `git add -A` — other batches are still pending and must not ride along. Stage by explicit path. When a file holds hunks belonging to two different batches, stage hunks, not the whole file.

**2. Run `/audit-pre-commit`** against those staged files (step 5 above). Resolve everything it flags before continuing.

**3. Commit with the approved text as the message.**
- **Title:** the batch's own headline, written as a conventional commit under ~72 characters — `fix(auth): stop holding the screen hostage while we re-check a valid session`. The headline already exists on the card; use it.
- **Body:** the **entire approved card text, verbatim** — the numbered intent statements, the decisions and what they rejected, "See it yourself", and the assumptions with their confidence numbers. Do not trim it, do not summarize it, do not drop the soft assumptions because they look unflattering. The soft assumptions are the most valuable thing in the record.
- No attribution lines.

**4. Write the commit-log document.** One document per commit at:
`<api-repo>/docs/intent/5.0_Founder_Dashboards/Indexes/Commit-Log/{repo}-{short-slug}.md`

If the `Commit-Log/` folder does not exist, create it.

Frontmatter, where `title` and `paragraph` are the two fields the index renders:
```
---
artifact-type: commit-log
title: {the batch headline — what a person can now do, or stops suffering}
paragraph: {one sentence — why this was worth doing, in human terms}
repo: {<api-repo> | <frontend-repo> | <landing-repo> | ix}
commit: {short hash — filled in immediately after committing}
committed: {Aug 3, 2026}
governer_score: {the score this batch was reviewed at}
files_changed: {N}
---
```
Body: the same approved text, verbatim, unchanged. That is the deal — the document *is* the text.

**5. The index** at `…/Indexes/Commit-Log.md` renders every document automatically from that frontmatter via dataview — title and paragraph per row, newest first, grouped by repo. Never hand-edit the index; write the document and it appears. Build the index once if it does not exist.

**6. Fill the commit hash back into the document's frontmatter**, then open the index in Obsidian so the user can see it landed.

**7. Return to waiting.** One batch, one commit, one log entry, then stop and wait for the next approval. Never batch up several approvals into one commit — the one-card-one-commit correspondence is what makes the log readable as a changelog later.

Default scope: <api-repo>, <frontend-repo>, <landing-repo>, and then, last and only once those three are complete, the parent `ix` repo when it is dirty.

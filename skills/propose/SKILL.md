---
name: propose
description: One command to turn the current situation — a conversation, a finding, a flagged session, or a raw item that needs a proposal — into a proposal the user understands the first time the user reads it. Chains the three canonical proposal skills: ground it in what a real person experiences, enforce the recognizable proposal shape, and file it. Use when an item needs a full proposal authored, when the user says "/propose", or when a triage folder item is flagged "get me a proposal."
---

# /propose

**One command → a proposal you understand the first time you read it.**

`/propose` takes the current situation — a conversation, a finding, a flagged session, or an item sitting in a "get me a proposal" folder — and produces a single proposal that is *instantly understood*: grounded in what a real person actually experiences, in the canonical recognizable shape, and filed where it belongs.

It is a thin orchestration of three existing canonical skills. Do NOT reinvent what they do — invoke them in order.

## What "instantly understood" means (the bar)

The user reads the proposal **once** and knows: what's broken for a real person, why it matters, and what fixing it does — with zero code jargon, zero decoding, zero follow-up questions. If a smart person who doesn't code would furrow their brow at any sentence, it fails the bar.

## The chain — run these three in order

### 1. `/proposal-ground` — make the content human-legible
Invoke `/proposal-ground` on the situation. This translates code findings into a **continuous narrative of what a person experiences** — where their experience deviates from intent, and what fixing it would feel like. This is the half of "instantly understood" that is about *meaning*: jargon becomes a lived UX story. Capture verbatim quotes from the source (conversation / session / finding) — never substitute your own summary for the user's actual words.

### 2. `/proposal-schema` — enforce the recognizable shape
Invoke `/proposal-schema` to normalize the grounded narrative into the **canonical proposal format**. This is the half of "instantly understood" that is about *shape*: every proposal looks the same, so the user recognizes it on sight. The human-legible "What a real person experiences" section leads; all technical detail goes below a `## Technical Detail` header. Include certainty dots (🔴<60 🟡60-69 🔵70-79 🟣80-89 🟢90+) and a "Where this came from" provenance section.

### 3. File it — write the Obsidian vault note (the canonical path)
File the finalized proposal as a **vault note**: one `.md` file per proposal in `<api-repo>/docs/intent/1.7_proposed/{ID}-{slug}.md`, carrying the frontmatter the live engine surfaces on — `id: LP-###`, `type: proposal`, `status: needs-review`, `cssclass: proposal`, `tags: [proposal]`, `leverage_score: <1-100>`, `score`, `priority`, `created`. The canonical dashboard engine `5.0_Founder_Dashboards/Indexes/1 - Open Proposals.md` scans the whole vault and surfaces any note whose frontmatter passes `isProposal()` as a reviewable row in Obsidian — **no API POST, no manual index row**. The note's first H1 becomes the row title and its first paragraph the lede, so lead with the human-experience story.

If the `<api-repo>/docs/intent/1.7_proposed/` folder does not exist, create it.

**ONE IDEA = ONE FILE.** Never put multiple proposals in one file — the engine reads one H1 + one lede per file, so a multi-idea file collapses into a single un-approvable row.

After writing, open it for the user, if the person has an Obsidian vault (check `~/.claude/CLAUDE.md` and the project for a vault name; otherwise give the full path): `open "obsidian://open?vault=<their vault name>&file=<folder it was filed in>/{ID}-{slug}&newtab=true"` (no `.md`).

> ⛔ Do NOT POST to the legacy developer-proposals API (`/how-to-submit-and-track-proposals`) for new proposals — that DB system is preserved as a SEARCH surface only (the user directive 2026-06-18). New proposals land as Obsidian vault notes, full stop.

(When running inside a triage-folder context, "file it" may instead mean: write the proposal to the top of the document being reviewed — follow the folder's `agents.md` for where the output lands.)

## Output placement

- **Default:** filed as an Obsidian vault note in `<api-repo>/docs/intent/1.7_proposed/` (one file per idea) that the canonical `1 - Open Proposals` dashboard surfaces. NOT the legacy DB API.
- **Inside a triage folder** (e.g. `1_1_get me a proposal`): paste the proposal at the **TOP of the document being reviewed**, with a datestamped `## UPDATE TO THE USER — <date time>` header above it, then leave it for the user's greenlight. Follow that folder's `agents.md`.

## Presenting the proposal back to the user — FULL CLICKABLE PATHS ONLY (MANDATORY — the user directive 2026-07-05)

> **A relative path is a FAILURE.** When you surface a proposal to the user — in chat, in a status update, anywhere — the link you give MUST be a **full path that is clickable and actually opens the surface**. A repo-relative path like `docs/intent/1.7_proposed/LP-042-slug.md` is a failure: the user cannot click it to open the thing. The whole point of presenting a proposal is that the user opens it in one click; a path the user has to hunt for defeats the proposal.

For EVERY proposal you present, give BOTH of these, verbatim, so one click opens the surface:

1. **The Obsidian surface-opener (primary — this IS the reviewable surface):**
   `obsidian://open?vault=<their vault name>&file=<folder it was filed in>/{ID}-{slug}&newtab=true` (no `.md`)
   This opens the vault note itself — the surface the `1 - Open Proposals` dashboard scans. This is what "open the surface" means.

2. **The absolute filesystem path (for direct file access):**
   `<your project root>/<api-repo>/docs/intent/1.7_proposed/{ID}-{slug}.md`
   Absolute — rooted at `/Users/...`, never repo-relative.

Never present a proposal with only a repo-relative path. If you catch yourself writing `docs/intent/...` as the user-facing link, stop and replace it with the two full paths above. After filing, also run `open "obsidian://open?vault=<their vault name>&file=<folder it was filed in>/{ID}-{slug}&newtab=true"` (if the person has an Obsidian vault) so the surface actually opens for the user.

## Verbatim definition (the user, this session)

> /propose = take the current situation (a conversation, a finding, a session), run /proposal-ground to turn it into a what-a-real-person-experiences narrative, enforce the /proposal-schema shape so it's recognizable, and file it as an Obsidian vault note (one file per idea, in `1.7_proposed/`) that the canonical `1 - Open Proposals` dashboard surfaces. One command → a proposal you understand the first time you read it. (The old developer-proposals DB API is search-only now — not the filing path.)

## Anti-Hallucination Guardrail (MANDATORY — include this discipline in every proposal)

Avoid hallucination by detecting anything you are asserting, with extra emphasis on anything load-bearing. Assumptions build upon assumptions, and that compounds agent hallucination and misalignment. Rather than asserting things as fact, lean toward stating what the intent is, or your understanding, or what seems to be true — and then place a % score inline like this ( 85% ) indicating your level of certainty.

This way, when other agents read your proposal, they do not assume your assumptions are facts.

Apply this throughout the proposal: every load-bearing claim (anything a downstream agent would build a fix on) carries an inline ( % ). A claim with no number reads as fact — so if it isn't a verified fact, give it a number.

## UX-Impact Completion Audit (MANDATORY — run before declaring any proposal complete)

When you believe your proposal is complete, engage an audit to determine the following.

Is there any place where you are talking about code which would touch a user experience, but not naming that expected downstream impact? That would be a critical failure of any proposal. Rather than create a separate section, weave in and synthesize the following key perspectives into the moment where you are speaking about a user facing impact.

For EACH set of conditions which would modify a user experience:

**When x then y should z** — with x being all the actual constraints | conditions, y being the governing system ( in charge of this ) and z being the target or expected user experience impact specifically.

For example, if you are incorrectly commenting only in specific code language like this:

> It removes a dangerous fake-user injection (`{_id:'placeholder-id', currentPlan:1}`) and adds the "give the load a second chance" retry the user explicitly asked about. It is NOT coupled to the fail-closed flip and should ship.

You would rewrite this to convert this to the semantic meaning, while citing the programming related variables in it. For example:

> When a paying user signs in, it removes a risk surface which could cause a user to not be recognized for whatever their payment status standing actually is by the CentralizedAccessResolver, increasing the chances that we catch and consume that data so that we can give them the privileges they deserve. Free users would be unaffected.

Also if you write or edit a proposal in obsidian, make sure you open it upon completion.

## This skill is in calibration

This skill is NOT yet normalized. Its output is being tuned against the user's "instantly understood" bar. When the user approves a proposal it produced, it becomes canonical. If the user rejects it, update this skill file and run again until the output is perfect. Do not treat this as finished until the user says so.

---
name: instinct-harvest
description: Mine INSTINCTS (not facts) from user-confirmed sanity checks and coherence checks in session transcripts, and maintain a per-domain instinct ledger that agents read before entering a situation. General tier — domain-agnostic. A domain layer (e.g. /instinct-harvest-seo) supplies the ledger path, the situation taxonomy, the session filter and extra seed sources, then invokes this skill. Use when seeding a domain's instinct ledger, when harvesting a session's confirmed checks, when generating the ledger index, or when checking whether the loop is healthy.
---

# Instinct Harvest — general tier

Print `## INSTINCT_HARVEST` on its own line before any output produced under this skill.

## What this is in service of (the user's words, captured 2026-09-08)

Twenty-five agents work SEO concurrently. Each session produces sanity checks and coherence checks — the agent translating its programmatic work back into the user's frame so the user can judge alignment by reading. The user confirms or corrects them. That confirmed material is the most valuable thing a session produces, and today it dies in the chat thread.

The prior attempt to make session learning compound — the "knowledge atom" system, 2,343 records, frozen since 2026-03-23 — failed for a reason the user named on 2026-09-08:

> "the way that agents were recording information was losing all the context it was losing all the conditions and it was confusing agents more than it was adding value"

And the unit the user wants instead:

> "instincts are a stronger unit right because if you do a sanity check and the sanity check says OK our intention is to only notify search engines when we push to main right then that could be an instinct and you probably don't wanna put that as a fact because it could be that there's a point in time where the context shifts and that would actually hold an agent back from being able to do their job, but if the instinct is there, then that could steer agents towards the correct thing and still leave the spaciousness required for them to use their intelligence to determine whether the instinct actually applies"

On why the sanity check is the source:

> "the sanity checks are basically like the heavy cognitive load lifting of determining whether an agent's programmatic solution addresses the original intent of the Human so they're effectively the bridge"

And the non-negotiable on every item:

> "each item MUST specify the exact date it was captured and the exact context in which it's relevant and have any undefined variable names unpacked to their semantic meaning"

Everything below follows from those four statements. If a step in this skill would produce a fact stripped of its conditions, a rule that removes the agent's judgment, an item without its capture date, or an item carrying a bare code name — the step is wrong, not the user.

## What an instinct is

A fact is a proposition: true or false. When the world moves, a stale fact is a lie the next agent cannot detect, and a fact written as a rule ("always ping on push to main") pigeonholes the agent into obeying it in a situation where it no longer holds.

An instinct is a prior. It carries the moment it came from. It says: **when you're in this situation, we lean this way, because of this, and here's where that came from.** The agent still has to think. A stale instinct is a prior the agent weighs against what is actually in front of it. That is why facts breed hallucination and instincts do not.

Four parts, always together, one to three sentences total, in the user's frame:

1. **The situation that triggers it** — recognition, not a code condition. "When you're about to tell search engines about pages."
2. **The lean** — direction, never a command. "Lean toward doing it only once they're really live for a human, on main." Never "always" or "never." Strength lives in the words: *hard lean*, *lean*, *slight lean*, *we've gone back and forth*.
3. **The why** — the value or the past pain that produced it. "Pinging anything else teaches crawlers we serve broken pages."
4. **Where it came from** — exact date, session, what the user was doing, what the agent's check said, what the user replied, verbatim.

Plus, where known: **when it might not apply.** That is the spaciousness. And **every variable unpacked**: if the source check names `trial.used` or `LIMITED_ACCESS` or a file, the instinct states what that is in plain meaning with its exact condition, so a cold reader needs no follow-up question.

Corrections are the strongest instincts. The user had to intervene; the pain travels with the instinct. An agent's self-discovered correction is second strongest — someone paid for it.

## The pipeline

```
transcripts ──extract──▶ harvest inbox ──mine──▶ ledger items ──index──▶ ledger README ──consume──▶ agent's task-start sanity check
     (script, pure capture)        (agent judgment)      (one file each)      (generated)          (weighs instincts visibly)
                                                                                  └──health──▶ failures surfaced to the user
```

Two rules govern the whole thing:

- **Extraction never summarizes.** The script captures the sanity-check block, the user's reply, and the surrounding task context verbatim, with timestamps. It makes no judgment. This is where atoms died: a cheap model was asked to pull "facts" and the conditions fell off on the way out.
- **Mining is judgment, not extraction.** The mining agent reads a captured pair and asks "what lean would have produced this decision, and why?" That is a reasoning question. First batches may run on Sonnet so the user can measure quality cheaply; if instincts come back as restated facts or rules, escalate mining to Opus — do not lower the bar.

### Step 0 — Find out what is already done (never skip, never guess)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/instinct-harvest/scripts/mining-status.js" --domain <id>
```

It prints every harvested session, whether it is already mined, whether it has a user reply, whether it belongs to this domain, and **the next free instinct id**. Mine only rows marked `TO MINE`.

Three rules that follow from it:

- **A session marked MINED is finished.** Re-mining it creates duplicate instincts under fresh ids, inflates the counts, and leaves two versions of one lean for the next agent to reconcile. If you believe a mined session holds something that was missed, do not re-mine it — strengthen or amend the existing item, which is one of the four moves in Step 2.
- **Take ids from `next free id` and claim a range up front** when several agents mine in parallel, so two agents never write `INST-SEO-0006`.
- **If you read a session in full and there is genuinely nothing to take, record that** in `$(alignment-harness records instincts-harvest)/_examined-no-yield.md` with the date, who read it, and why. "Examined and empty" is a real result. Without the record it looks exactly like "not yet looked at" and the next run pays to open it again. Never write a weak instinct to avoid an empty row — a thin batch of real instincts beats a full batch of invented ones.
- **A row marked `other domain` is not yours.** A contract review or a coaching-pipeline session has real instincts in it, but they do not belong in this domain's ledger. Leave it; a future domain layer will take it.

**Do not run `--rebuild` while miners are working.** It rewrites the whole index; the write is atomic (temp file then rename, with the previous index kept as `harvest.jsonl.bak`), but a miner that read a stale copy earlier in its run will be working from it. Rebuild first, then dispatch.

Extraction itself is idempotent — a pair already in `harvest.jsonl` is skipped by id and by content hash — so re-running the extractor is always safe. Mining is not idempotent. That is why this step exists.

### Step 1 — Extract

Script: `"${CLAUDE_PLUGIN_ROOT}/skills/instinct-harvest/scripts/extract-check-pairs.js"` (see `--help`). Input: one session id or transcript path, or `--since <days>` to sweep. Output: the harvest inbox at `$(alignment-harness records instincts-harvest)/<session-first-8>/` — one markdown file per captured pair (Obsidian-visible) plus an append-only `harvest.jsonl` at the inbox root. Idempotent: a pair already captured (same session + message uuid) is skipped.

**A block ends at the next CHECK heading or the end of the assistant turn — never at an ordinary `## ` subheading.** Checks routinely use `## ` for internal sections ("## A. Turning coaching emails off doesn't turn them off"), and ending at any H2 cut one 13,343-character check down to 400 characters, silently dropping nine of its concerns. Nothing in the pipeline noticed; a mining agent found it by remarking that a body looked missing. Over-capturing costs a miner some reading. Under-capturing loses the record and every instinct that was in it. When an extractor correctness fix like this lands, re-run with `--rebuild` to re-capture everything, then re-mine any session whose items were produced from the old partial captures.

A **pair** is: an assistant message containing `## SANITY_CHECK` or `## COHERENCE_CHECK` (or `## AGENT_REFLECTION`), plus the next genuine human-typed user message before the next assistant message, plus the human message that preceded the check (the task context). Each carries its ISO timestamp, session id, project cwd, git branch.

Verdict is a heuristic label only — `confirmed-ish`, `corrected-ish`, `unanswered`, `ambiguous` — set by the script from the reply text, and **always re-judged by the mining agent** reading the actual reply.

### Step 2 — Mine

Load `/how-to-talk-like-the-founder` first and read two voice samples. Every instinct is written in that register: intent leads, code rides inside as the anchor.

For each pair in the inbox for this domain (the domain layer supplies the filter):

1. **Read the user's reply as the verdict.** Confirmed: the check's intent lines become candidate instincts. Corrected: the correction is the instinct, and the corrected line is recorded as the wrong belief with why it looked reasonable. Unanswered or ambiguous: **do not mine into the ledger.** Log it under `$(alignment-harness records instincts-harvest)/_awaiting-user.md` with a link, so the user can confirm in a batch. Instincts enter only through the user's yes.
2. **Ask of each confirmed or corrected line:** what lean would have produced this decision, and why? Which situation does it fire in? What was the alternative it was chosen over (the check's decisions section usually says)? What would make it not apply?
3. **Check the ledger before writing.** Search existing items by situation and by wording. Then one of four moves:
   - **Same instinct** → strengthen: add the new source under "Where it came from", update `last-confirmed`, raise strength wording if warranted. Never duplicate.
   - **Tension** with an existing instinct → keep both, name the tension in each ("in tension with INST-0042: …"). The user holds tensions; so does the ledger.
   - **Override** — the user confirmed an agent deviating from an existing instinct with a reason → add "When it might not apply" to the existing item with the date and the reason.
   - **New** → write a new item.
4. **Write the item** using the format below. Then run the cold-read test: with zero session context, would a reader ask any clarifying question? If yes, the item is incomplete — fold the answer in, do not append it.
5. **Never write a rule.** If the draft contains "always", "never", "must", or reads as a command, rewrite as a lean with a why.

### Step 3 — Item format

One file per instinct at `<ledger>/items/INST-<domain>-<NNNN>-<slug>.md`. Never edit another agent's item except through the four moves above; never a shared file two agents write at once.

The frontmatter is machine metadata — it drives the generated index, so its keys are fixed:

```markdown
---
instinct-id: INST-SEO-0007
domain: seo
situation: about-to-tell-search-engines-about-pages
strength: hard-lean            # hard-lean | lean | slight-lean | contested
captured: 2026-09-07T14:22:03Z # timestamp of the USER'S confirming or correcting message
last-confirmed: 2026-09-07T14:22:03Z
mined: 2026-09-09
mined-by: sonnet | opus
status: proposed               # proposed | user-confirmed
user-verdict-on-source: confirmed | corrected
source-session: 5a85b6d3-...
source-pair: harvest/5a85b6d3/003-sanity-check.md
in-tension-with: []
---
```

**The body is prose. Not fields.** (The user, 2026-09-08: *"it's still using json instead of conversational... agents must answer those questions but communicate like a human not like a json output."*)

Below the frontmatter comes an H1 — one specific sentence naming the situation and the lean, never a category label. Everything after it is written the way a person tells another person something they learned.

**Read the five user-approved items before you write one.** They are the standard, approved verbatim on 2026-09-08, and they are worth more than any description of the standard:

```
docs/intent/seo-aeo-strategy/SEO-CANONICAL-BASE-v4/INSTINCTS/items/INST-SEO-0001-gated-cherrypick-ship-workflow.md
docs/intent/seo-aeo-strategy/SEO-CANONICAL-BASE-v4/INSTINCTS/items/INST-SEO-0002-verify-stat-scope-before-scaling-decision.md
docs/intent/seo-aeo-strategy/SEO-CANONICAL-BASE-v4/INSTINCTS/items/INST-SEO-0003-metadata-is-not-sacred-fix-dont-just-truncate.md
docs/intent/seo-aeo-strategy/SEO-CANONICAL-BASE-v4/INSTINCTS/items/INST-SEO-0004-show-the-actual-asset-not-just-its-name.md
docs/intent/seo-aeo-strategy/SEO-CANONICAL-BASE-v4/INSTINCTS/items/INST-SEO-0005-dont-declare-deploy-pipeline-broken-from-shell-alone.md
```

Notice in those five: every paragraph opens differently, the provenance arrives as a story ("I learned this from a correction rather than a request", "What is interesting about this one is that no correction was needed", "This came up on 2026-07-21 at 23:29 UTC"), the code vocabulary is explained inside the sentence that needs it rather than parked in a glossary, and the limits of the lean are stated plainly at the end without a header announcing them.

Your item must ANSWER all of the following, and must NOT label any of them:

1. What the lean actually is, concretely enough to act on.
2. Why we hold it — the value or the past pain underneath it.
3. Where it came from: when, in what session, what the agent had claimed, and the user's exact words. Open this differently every time.
4. Where it might not apply, or what would make us revisit it.
5. Any code name, branch, file, flag, constant or internal label, unpacked into plain meaning with its exact condition, woven into the sentence that needs it.
6. If the user's quoted words contain dictation typos, say once, in passing, that they are reproduced exactly on purpose.

**Banned in the body:** a bold label followed by a period introducing a paragraph (`**The lean.**`, `**Why.**`, `**Where it came from.**`, `**Variables unpacked.**`), any `Key: value` line, and any structure repeated identically across items. Bold is for emphasis inside a sentence, never as a header.

**Quotation marks mean the user said it.** Do not put your own phrasing in quotes — the guard in Step 3b will catch it and it should. Reproduce the user's words exactly, typos and all. Never tidy the user's dictation.

### Step 3b — Verify the quotes (MANDATORY, before the index)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/instinct-harvest/scripts/verify-instinct-quotes.js" --domain <id>
```

Every quoted span in an item's **Where it came from** section must match the user's words, in order, from that item's own source transcript. Punctuation and case are normalized; changed, added, removed or reordered WORDS fail.

**Reproduce the user's dictation exactly, typos and all.** On the first mined batch (2026-09-08) the miner quoted the user as "get them cherry picked and committed in order" when the user had said "get them cherry picked and. committe din order", and elsewhere stitched two fragments from different parts of one message into a single continuous-looking quote. Both read better. Both are the thing that destroys the ledger: it is only worth something if the user's words are the user's words. CLAUDE.md — "Never restate someone's words in 'better' form. Paraphrase closely or quote."

If a quote fails, restore the exact wording or drop the quotation marks and paraphrase. Never present cleaned-up dictation as a quote. An item that cannot pass this does not enter the ledger.

### Step 3b-2 — An unverified item is not a finished item

A mining agent that stops before it runs the quote guard has not produced an instinct; it has produced an unverified draft sitting in the canonical ledger, indistinguishable from the verified ones. That happened on 2026-09-12: an agent was interrupted mid-run, and the item it left behind had the user saying "I want to stop procrastinating" where the user had actually said "i want to stop the other session or at least know you're okay with it running". Nothing caught it at write time because the only thing that checks is the step the agent never reached.

So whoever orchestrates a mining run owns the guard, not just the agent that was asked to run it. Run `verify-instinct-quotes.js --domain <id>` yourself after every batch, including batches whose agent never reported back.

When a quote does not match, do not fix the quote and leave the item standing. The agent was inventing the user's words, which means its reasoning is suspect too — move the whole item to `<ledger>/quarantine/` with a row in that folder's README saying what did not match and which session needs re-mining. If the `<ledger>/quarantine/` folder does not exist, create it. An instinct whose provenance cannot be trusted is worse than a missing instinct, because the next agent has no way to tell it apart from a real one.

### Step 3c — Consolidate, when more than one agent mined at once

Parallel miners cannot see each other's items, so two of them will independently write the same lean from different sessions. Observed on the first parallel run (2026-09-08): one agent wrote "show the user the actual file — naming it gives the user nothing to approve" from an image proposal, another wrote "give the user a URL and the exact thing to look for" from a page review. One instinct, two situations, two files.

After all miners finish, one agent reads every headline in the ledger and looks for pairs saying the same thing. For each pair, the user decides — do not merge silently. Bring the user the two headlines and the recommendation. A pair that is genuinely one lean firing in two situations usually becomes one item whose headline names the shared move, with both sources under it and both situation slugs; a pair that only sounds alike stays as two items that reference each other.

Also re-run the quote guard once at the end, over the whole ledger rather than one agent's slice, because a merge rewrites prose and prose is where quotes live.

### Step 4 — Index

Script: `"${CLAUDE_PLUGIN_ROOT}/skills/instinct-harvest/scripts/build-instinct-index.js" --domain <id>`. Regenerates `<ledger>/README.md` from item frontmatter: grouped by situation, each line = headline + strength + captured date + link. This is the map to substance an agent reads first. Never hand-edit the README; fix the item and regenerate.

### Step 5 — Consume

The domain layer names the consumers. Minimum for any domain:

- The domain's canonical entry point says, before anything else: read `<ledger>/README.md`, then the items for the situation you are about to enter.
- The task-start sanity check for that domain gains a section: **"Instincts I'm weighing"** — which instincts apply to what I'm about to do, how I'm weighing them, and any I think does not apply here and why. The user sees whether the instincts fired right. The user's reply is itself a new confirmed pair, which the next harvest mines. That is how it compounds without pigeonholing: the agent weighs, visibly; it does not obey.

### Step 6 — Health (surfacing failure)

A loop that silently stops is worse than none — the user assumes it is working. Script: `extract-check-pairs.js --health --domain <id>`. It reports, and the domain layer's weekly run posts the result where the user will see it (the domain's digest, or the ledger README's top line):

| Check | Fails when |
|---|---|
| Sessions with checks vs harvested | any session in the last 7 days has a `## SANITY_CHECK` and no pair in the inbox |
| Inbox age | newest inbox file older than 7 days while sessions ran |
| Awaiting the user | `_awaiting-user.md` has more than 20 entries |
| Ledger growth | zero new or strengthened items in 14 days while pairs were harvested |
| Index freshness | README older than the newest item |
| Findability | `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "<headline>"` on 5 random item headlines does not return the item in top 3 |
| Quote fidelity | `verify-instinct-quotes.js --domain <id>` exits non-zero (a quote no longer matches the transcript) |
| Capture integrity | any captured check body is under 400 characters or a single line — that is a truncated capture, not a short check |
| Consumption | fewer than half of last week's domain sessions contain "Instincts I'm weighing" |

A failed check is written into the README's first line as `⚠️ INSTINCT LOOP UNHEALTHY: <check>` so any agent that opens the ledger sees it, and the user sees it in Obsidian.

## Domain layer contract

A domain skill (e.g. `/instinct-harvest-seo`) must provide, then invoke this skill:

- `domain`: short id used in instinct ids and `--domain`
- `ledger`: absolute path of the ledger directory (contains `items/` and generated `README.md`)
- `situations`: the taxonomy of trigger situations for the domain, as slugs with one-line meanings — organized by what an agent is *about to do*, never by system component
- `session-filter`: how to recognize the domain's sessions (cwd, branch, keywords)
- `seed-sources`: non-transcript files that already hold user-confirmed material for a one-time seed (verbatim intent logs, decision records, scar tissue)
- `consumers`: the entry-point files and skills that must say "read the instinct ledger first"

## Model tiers

Extraction: script, no model. Mining: Sonnet for the first measured batch; Opus when the user judges Sonnet's batch insufficient or for seeding from dense sources. The user: reads items and says yes/no; confirmed items move `status` to `user-confirmed`.

## What would make this fail

- Items written as facts or rules. Test: does the item tell the agent what to do, or what we lean toward and why?
- Mining unanswered checks. The agent's claim without the user's reply is not an instinct.
- A summarizing extraction step. If anyone proposes "just have Haiku pull the key points," that is the atom failure again.
- The ledger nobody routes to. The consumers list exists so this is checked, not assumed.
- Silent loop death. The health check exists so a stopped loop is visible within a week.

# ALIGNMENT-ADDITIONS — Per-COAX rationale and citation audit

Companion file to `SKILL.md`. One section per coax: what it adds, the reasoning behind it, and the failure mode it prevents. The failure modes and the general lesson in each one are what transfers to your own project.

**Purpose:** a one-lookup answer to *"why does v2 do X?"* for any v2 addition.

---

## COAX-1 — Obsidian filing over generic `/plans/`

**What it adds:** Plans save to a connected vault app if you have one (in whatever folder structure it already uses), or a plain local project folder if you don't — NEVER `docs/superpowers/plans/`.

**Source rationale:** a plan written to a generic plans folder went unnoticed because review actually happens in the initiatives folder inside the connected vault — plans need to land where review actually happens, not in a separate folder nobody checks.

**Failure mode prevented:** the person asks where a plan is, the agent points to a folder they never look at, and they have to manually stitch together filesystem and vault — or worse, the plan is invisible because they review everything through their vault and never see it.

---

## COAX-2 — Open the file after creating it

**What it adds:** Every plan file written is followed by opening it in the app the person reads plans in (an `obsidian://open?path=` link if they use Obsidian), or just the full path if they have no such app. Never a code editor for a plan meant to be read as prose.

**Source rationale:** agents defaulting to opening modified files in a code editor instead of the vault app made review slower and harder to consume — the fix is to make the vault app the baseline default for opening files, tracked as a requirement in the relevant ascendant rule file.

**Failure mode prevented:** the person gets a file path in chat but not a rendered view; switches apps manually; review loop stretches from seconds to minutes per file.

---

## COAX-3 — Required YAML frontmatter

**What it adds:** `type`, `title`, `status`, `parent-initiative` (when one exists), `created`, `author`, `certainty` and `touches_users` fields on every plan.

**Source rationale:** a project's documents are easiest to navigate when they share one frontmatter shape, so the plan joins the pattern instead of inventing its own.

**Failure mode prevented:** plans without `parent-initiative` become orphans in whatever hierarchy the person keeps — they can't navigate from an initiative to its plans. Plans without `certainty` encourage unqualified assertions (violates COAX-5).

---

## COAX-4 — Ascendant-chain confirmation in body

**What it adds:** `ASCENDANT_CHAIN_READ:` block immediately under frontmatter.

**Failure mode prevented:** subagent acts on a doc without reading ancestors, hallucinates contradictions into the very initiative designed to eliminate hallucination.

---

## COAX-5 — Probability-qualified claims

**What it adds:** every factual claim carries `(probability: X%, basis: Y)` or named source.

**Source rationale:** nothing is a fact unless it has actually been confirmed true. When there's high confidence in something but it hasn't been independently confirmed, state it as a percentage probability rather than as settled fact.

**Failure mode prevented:** hallucination cascade — one unqualified assertion becomes the ingredient another agent builds on, compounding error.

---

## COAX-6 — /speak-human tone for reviewer-facing sections

**What it adds:** Reviewer-readable sections in plain language; jargon confined to explicit "Technical Detail" subsections.

**Source rationale:** communicating with a human is not the place to default to concision at the expense of signal — the goal is communicating enough signal and specificity (versus noise) that the reader understands exactly what's being said without needing to ask a clarifying question, and complexity should never get reduced to a false binary just to make it sound simpler.

**Failure mode prevented:** the person reads a plan loaded with variable names and file paths, cannot greenlight without asking clarifying questions, loop stretches.

---

## COAX-7 — Handoff contract at plan end

**What it adds:** Every plan ends with the full handoff contract block (from, to, task, what was read, inputs, outputs, confidence, citations, unknowns, what could be wrong, where the result gets appended).

**Failure mode prevented:** plan is complete but downstream agent can't validate what was input, what was output, or what the plan-author was uncertain about. Silent drift between plan-author and plan-executor.

---

## COAX-8 — Kill-switch + revert section

**What it adds:** Mandatory "Revert Contract" before task list with runnable single-command rollback.

**Source rationale:** once given the greenlight, everything an agent does must be instantly revertible without data loss — and the revert mechanism itself can't depend on an intelligent agent to operate it. It has to be simple enough that even a broken, spiraling, hallucinating agent, or a person typing one command by hand, can flip everything back to the last known good state.

**Failure mode prevented:** an agent ships a change that breaks the agents' own ability to work, no simple revert exists, the agents try to repair themselves while broken, and the damage cascades.

---

## COAX-9 — Additive feedback interpretation default

**What it adds:** Prominent banner at Self-Review: treat feedback as additive unless explicitly destructive.

**Source rationale:** a correction offered as a contrast, meant to enrich understanding of a situation, is a common case where an agent over-compensates and destroys nuance by collapsing it into black-and-white thinking. Treating a correction as a destructive replacement of everything that came before it, rather than as an addition to it, is itself harmful to alignment.

**Failure mode prevented:** one of the most damaging alignment failures an agent can make — the person says "also X," the agent interprets it as "instead X," destroys nuance, requires multi-round correction to undo.

---

## COAX-10 — Parent-Agent Self-Enforcing Loop awareness

**What it adds:** If the plan is executed by subagent dispatch, the handoff section carries a Parent-Agent Loop Obligation block (read the parent-loop doc if the project has one, treat subagent output as a test of the plan, verify each task independently, repair the plan on drift). Every task gets a falsifiable verification subsection.

**Source rationale:** the tool being built should be used, in a self-enforcing loop, to build itself — evaluating its own efficacy and repairing itself when subagents go out of line. That pattern needs to be visible and followed by every parent agent that dispatches subagents (final executing agents are the exception, since they have no subagents beneath them to lose track of).

**Failure mode prevented:** parent dispatches subagent, subagent claims completion, parent rubber-stamps, drift compounds silently. Without COAX-10, plans executed by subagents produce no measurement event about whether the tool worked.

---

## Provenance

- v1 source hash (SHA-256), for comparing against your own copy of the third-party skill: `90056bad3d5f196fa7c9fec0ffe592e6d9c86bc983e406642a51d1a4198b7024`
- Version: v0.1

## Update log (append-only)

### v0.1 — initial creation
10 coaxes defined. v1 byte-unchanged.

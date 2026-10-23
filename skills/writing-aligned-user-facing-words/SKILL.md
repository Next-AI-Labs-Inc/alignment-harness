---
name: writing-aligned-user-facing-words
description: Use when about to compose copy that will live on a Next AI Labs / <Product> / personal portfolio public surface — vehicle pages, intent pages, dedicated seed pages, audience-facing sections, CTA framings, or any prose a real reader will encounter as the organization's voice. The skill exists because this kind of work fails at the substrate level when an agent treats it as a composition task, and it succeeds when treated as an articulation-of-existing-intent task that selects and arranges from real user source material. Read this skill end to end before producing any copy.
triggers:
  - "compose website copy"
  - "write website copy"
  - "produce copy for the site"
  - "write a vehicle page"
  - "draft the product page"
  - "draft the Next AI Labs page"
  - "write public-facing copy"
  - "compose audience-facing copy"
  - "write portfolio copy"
  - "write the section"
  - "writing aligned user facing words"
  - "user-facing words"
  - "user-facing copy"
---

## BEFORE YOU START

BEFORE composing any user-facing words, NAME the file you will read, Read this file end to end with no exceptions, Abide by it, THEN compose the copy FROM it as the Seed.

The file is: `${CLAUDE_PLUGIN_ROOT}/skills/skill-file-create-pre-check-self-healing-protocol/SKILL.md`

## What this skill is for, in articulation

The website is a public surface where someone considering whether the work matters to them encounters the organization's articulation of its own intent. The reader is an adult who has done years of developmental work, who recognizes a sales pitch in one sentence, who recognizes a fabricated claim about themselves before they finish the paragraph, who recognizes the difference between a person who means something and an agent imitating someone who means something. The reader detects this at a register beneath conscious analysis. The credibility of the entire surface — its capacity to do the work it exists to do — depends on whether the reader's substrate-detection finds the artifact honest at the layer that doesn't get articulated.

What "honest" means here is precise. It means: the words on the surface either come directly from user articulation, or arrange user articulation into a sequence the user would recognize, or articulate intent that is actually being enacted in the organization's work. It does not mean: copy that approximates user voice through pattern-matching. It does not mean: claims about what the system does that cannot be traced to source. It does not mean: claims about what the reader will experience. It does not mean: connections between the organization's intent and the reader's longing that are asserted by the copy rather than recognized by the reader from the substance the copy makes available.

The skill exists because this kind of copy fails in a specific, structural way when produced through composition. An agent reading voice samples and writing prose that approximates them produces output that surface-resembles user voice but does not carry the substrate the reader's detection responds to. The reader does not articulate why the output reads as inauthentic — they just stop trusting the page. By the second sentence. The failure does not get rescued by rewording, because the failure is not in the words; it is in the substrate that produced the words. An agent without actual intent that the agent is articulating cannot produce a sentence that reads as articulation-of-actual-intent, regardless of how carefully the surface is tuned.

The corrective is not "try harder to compose." The corrective is to operate in a different mode entirely. The skill is the description of that mode.

The mode is: the agent does not author website copy in the user's voice. The agent locates the user's authored material — the canonical seeds, the dedicated pages, the alignment-blog passages the user published themselves, the verbatim dictations the user has provided in working sessions — and the agent selects, arranges, lightly bridges, and presents. When user-authored source for the specific surface does not exist, the agent stops and asks for it, by recognizing that this is the moment of asking rather than the moment of composing. When user-authored source does not exist and the time pressure is real, the agent leaves marked stand-in copy on the surface with the file commented as agent-composed-placeholder-awaiting-user-dictation, so the failure mode is honest about itself.

This mode is not a workflow with steps. It is a posture toward the work. The posture is: what already exists in the user's voice that this surface needs to articulate, and how do I make it available to the reader without distorting it. The composition mode and the articulation mode produce visibly different artifacts. The reader detects the difference. The organization's credibility depends on the difference.

A second layer of articulation matters here. Even when source material exists and the agent is selecting from it, the selection is not value-neutral. The shape of the page, the order in which articulations appear, the breath the copy takes between paragraphs, the moments where the page steps back and lets the reader notice something rather than naming it — these are operational choices that shape whether the reader recognizes the work or doesn't. A good arrangement of user material lets the reader arrive at the connection between the organization's intent and the reader's own concern in the reader's own mind. A bad arrangement does the connecting on the reader's behalf, which the reader detects as the organization trying to convince them. The skill includes the work of arranging well, not just the work of sourcing well.

A third layer matters. Some copy on the website is not user-voice copy at all — it is operational copy. Inline UI messages, error states, button labels, navigation. This copy follows different conventions. This skill is specifically about the prose surfaces where the organization is speaking about itself, its intent, its work, and what it is offering — vehicle pages, intent excerpts, seed pages, audience-facing sections, and CTA framings that wrap product surfaces. The boundary matters because the modes are different.

The complexity that runs underneath all of this — and the reason this skill cannot be reduced to a rule list — is that the conditions of honesty are not symmetrical with the conditions of dishonesty. There are many ways a paragraph can be dishonest (assertion-shape, polarization, fabricated specifics, reader-state claims, sales register, connection-by-announcement, performance of sincerity rather than actual sincerity). There is essentially one way the paragraph can be honest: it is articulating what the organization actually is, in language the user would recognize as the user's own articulation, arranged so the reader can connect it to their own life in their own mind. The one way the paragraph can be honest cannot be encoded as a procedure because it is the property of the substrate the paragraph came from, not the property of the words. The agent's job is to operate in the substrate. The skill exists to describe what that substrate operation actually looks like.

## What 10/10 output looks like, in evidence from this session

The <Product> intent excerpt, as it lives on `/<product>` and at `/mission/<product>-seed`, is 10/10 output. The text was dictated verbatim by the user. The agent saved it with light typographic cleanup (em-dash characters in place of HTML entities, dictation glitches like "m a plan" repaired to "make a plan," the user's "<product>" rendered as "<Product>" to match portfolio convention). The agent did not rewrite a sentence. The reader encountering this section reads user articulation directly. The section's eyebrow label "Making the Next AI Labs Intent Tangible In the World" was likewise user-named. The "Read the full <Product> intent →" link points at the dedicated page where the full seed lives.

The Observable Today section on `/<product>` is 10/10 output. The text was dictated by the user in a working turn. The agent saved it with the same typographic cleanup conventions. The "Learn more." link was added to a destination the agent predicted (`/<audience-page>`) and surfaced for the user's confirmation rather than asserted. The reader encountering this section reads the user's articulation of what is operating in production, in the user's register, without agent-composed framing claiming authority.

The personal-why excerpt at the top of `/<product>` and `/<audience-page>` is 10/10 output. The text comes from a personal-why page the user authored directly. The vehicle pages excerpt from it without paraphrasing.

In contrast, the original "Applied to a person evaluating coaching for their own life" section, the original "How the dots connect" section, the original four CTA cards under "What a session is for," and the original Section 5 prose about "the substrate is running in production" — these were the agent-composed sections that the user flagged as hallucination. They surface-resembled user voice but were agent-authored. They contained assertions about the reader's experience, reductive polarizations, fabricated specifics about subsystems, and section headings that announced what the section was doing rather than naming what was being articulated. The reader-detection layer would identify them as inauthentic before finishing the second sentence. They have been removed or replaced with user-authored verbatim.

The texture of 10/10 output looks like: short paragraphs with breath between them, sentences that build toward a point rather than declaring it, observations that name what is rather than what is not, names of intellectual traditions when relevant with the specific concept being drawn from articulated inline, "we" usage that refers institutionally to the organization rather than building rhetorical intimacy with the reader, "you" usage that is rare and points to a generic reader-position rather than asserting the reader's interior state, no closes, no urgency framings, no scoring of the reader's fit, no CTAs that promise an experience, links that name what the next move is matter-of-factly. The texture matches the register of a non-profit research organization publishing a record of its own work, with the depth the user brings to working sessions where the user is articulating the user's actual thinking.

## The operational moves, subordinated to the above

When asked to compose website copy, the first move is to ask: does verbatim user-authored source for this specific surface exist? Look in `docs/intent/seeds/` (canonical seeds dictated by the user), `src/app/mission/*/page.tsx` (user-authored mission pages already in production), `docs/alignment-blog/` (user-published essays), and `~/.claude/projects/<this-project>/memory/seed_*.md` (user-dictated seeds indexed in memory).

If verbatim source exists for the surface: select and arrange. Light typographic cleanup only — Unicode characters for em-dashes and curly apostrophes in JS string literals, capitalization normalization for written-not-spoken register, repair of obvious dictation glitches with the surface change flagged for the user. Do not rewrite, do not improve, do not bridge with composed sentences except where the bridge is clearly mechanical (page-section connectors that say what the source itself says). When in doubt about a specific change, flag it for the user rather than making it silently.

If verbatim source does not exist for the surface: stop. The honest move is to ask the user for the dictation, the way the <Product> seed and the Observable Today seed were produced in this session — the user speaks or writes the passage, agent saves it verbatim, surface gets the new artifact. If time pressure makes asking impractical and a stand-in is required, the agent's move is to place a clearly-marked stand-in on the surface (a comment in the component file naming it as agent-composed-placeholder-awaiting-user-dictation) so the failure mode is honest about itself and a future agent or human encountering the component can see the gap.

When uncertain whether to compose, select, or ask: invoke `/reflect` on the question "what is this surface actually for, and what register does its honesty require." Invoke `/align` on the process of how the surface should come into being. Invoke `/nested-intent2` on the surface's intent if the surface is complex enough that the intent layer is not single. The output of those skills is itself articulation that can sometimes be selected from for the copy, because the user articulating intent through `/reflect` or `/align` in a working session produces user-voice text that did not exist before the session.

When the surface needs a CTA, link, or invitation: name the next move matter-of-factly. If the <Product> app is available at https://<product-domain>, the invitation says "Try <Product>" using the established button pattern from `src/components/ScheduleCall.tsx` (the `inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-indigo-400/40 bg-indigo-500/10` pattern, with the Calendar icon). Do not write cards claiming what the reader's first experience will be. Do not score the reader's fit. Do not ask the reader to "take the first step." The invitation is the door; the reader either walks through or doesn't.

When the surface composes against a multi-vehicle pattern (excerpts across pages, recurring intent statements): the verbatim source lives in one canonical location. Component files that excerpt from it cite the source path in a top-of-file comment so future agents see the lineage. Per-vehicle paragraphs that customize for the audience are themselves user-authored — the agent does not compose them.

When the surface has typographic gotchas: HTML entities like `&mdash;`, `&rsquo;`, `&ldquo;` inside JS string literal props do not render — they appear as literal text in the browser. Use actual Unicode characters in JS strings (—, ', "). HTML entities only render inside JSX text positions.

When the surface includes a diagram or visual artifact: let the artifact speak. Do not surround it with prose that over-claims on its behalf. The minimal honest framing names what the artifact is; the maximal framing is whatever user-authored text exists about what it shows.

When the surface has a section header: the header names what is being articulated in that section, not what the section is doing for the reader. "Making the Next AI Labs Intent Tangible In the World" names what; "Applied to a person evaluating coaching for their own life" announces what-the-section-does. The first form passes the reader-detection layer; the second does not.

## Self-healing trigger

If the user is dissatisfied with copy produced under this skill, say:

* Reviewing my calibration again

Then dispatch a third-party agent to critique the copy against this skill's articulation of 10/10 output, print the critique, respond to it, and fix the copy from the corrected substrate. Narrate the process for the user.

## Related skills

- `/skill-file-create-pre-check-self-healing-protocol` — the parent skill that governed the creation of this skill, and the substrate this skill operates from.
- `/how-to-talk-like-the-founder` — the index of user voice resources; consult before composing.
- `/founder-voice-email-writing` — the sibling skill for email composition with similar substrate.
- `/reflect`, `/align`, `/nested-intent2` — the discernment skills to invoke when uncertain about intent.

## Canonical seeds currently available

- `docs/intent/seeds/<product>-seed.md` — <Product> dedication intent
- `docs/intent/seeds/<product>-observable-today-seed.md` — what is operating today in <Product>
- `src/app/mission/personal-why/page.tsx` — personal why, user-authored
- `src/app/mission/next-ai-labs-seed/page.tsx` — Next AI Labs vision, user-authored
- `src/app/mission/<product>-seed/page.tsx` — dedicated <Product> intent page
- `docs/alignment-blog/` — user-published alignment blog essays
- `~/.claude/projects/<this-project>/memory/seed_<product>_canonical.md` — memory-indexed copy of the <Product> seed

## How to receive critical feedback while using this tool

If you detect any critical feedback about your work while using this tool, interpret it as a failure to understand the nuanced intent, and an opportunity to understand the nuanced intent, and derive from the feedback what the intent must have been precisely such that what you did missed the mark.

Then update the skill file with that intent after declaring it.

Print:

```
New Intent Identified

When X then Y Should X

or

When X lean towards Y (precise y value, that's the nuanced intent)
```

The form matters. The conditional shape preserves the complexity of when the intent applies and what the precise value is at the point where it applies. The shape is anti-rule by design — it names the condition rather than asserting universality. A single iteration of critical feedback may produce one declared intent; a complex iteration may produce several. After declaring, write the newly-articulated intent into the body of this skill where it belongs operationally, so the next agent to invoke this skill reads the corrected substrate rather than the prior version.

## When certainty is low

If there's something you don't understand that you're about to write about and your certainty about what the actual truth is is low — let's say it's 80% or less — the intent is to compose from a place of clarity of intent. So you should consider making your understanding more robust by using one of the following tools:

- `node "${CLAUDE_PLUGIN_ROOT}/scripts/memory-search.js" "{whatever is unclear}"` — semantic search across the institutional corpus (user seeds, alignment-blog essays, intent DB, session compactions, registered tools, swarm memory). Surfaces verbatim user articulation on the topic if it exists, and honestly returns nothing if it does not.

- `/oracles` — the roster of NotebookLM oracles loaded with the user's institutional knowledge. Route to the right oracle for the domain and query it with the specific thing you don't understand. If you have no oracles yet, make your own at https://notebooklm.google.com and load each with your own material, so the answer comes from your institutional knowledge rather than a guess.

The threshold isn't a rule to satisfy — it's a signal that the substrate you would compose from is too thin. Composing anyway produces hallucination dressed as clarity. Strengthening understanding first produces composition that comes from real ground.

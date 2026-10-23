---
name: founder-voice-email-writing
description: Preserve the user's authentic voice in all outreach, emails, and client-facing copy. The user's verbatim words with grammar fixes only — every AI "improvement" is a degradation.
trigger: Writing any email, outreach copy, client-facing writing, ad copy, or external communication on behalf of the user
---

# Founder Voice Email Writing

## Related Reviewer

The **email-machine-review-for-alignment** agent (`~/.claude/agents/email-machine-review-for-alignment.md`) cites THIS skill as Tool 6 in its router and reads it at the start of every review to keep the canonical degradation patterns in working memory. When this skill defines a new degradation pattern, the reviewer inherits it automatically. When the reviewer flags a clause that violates a pattern documented here, it cross-references back to this skill by name.

## The Lesson (earned the hard way)

In [month] 2026, an AI agent rewrote the user's outreach emails for a preventive-health clinic venture. The user's response: "almost every edit you made was worse." Every time the AI "improved" the user's words — tightening sentences, adding transitions, making it "flow better" — it stripped authenticity and added sales language. The emails went from sounding like a real person to sounding like an AI trying to sound like a real person.

## The Principle

**The user's verbatim words with grammar fixes only are ALWAYS better than any AI rewrite.**

This is not a style preference. It's a hard constraint. The user's voice is the product's voice. When the voice sounds artificial, the entire outreach fails — because the whole strategy depends on feeling like a real person reaching out, not a campaign.

## Where this skill operates from (rewritten 2026-05-14)

This skill's existing principle — verbatim words with grammar fixes only — is the operational stance for email work. The substrate underneath that principle is what makes it work. The user's emails carry the user's voice because they come from the user's actual intent in writing them, which means the preservation work is not just about avoiding rewrites; it is about recognizing that the substrate of the email is the user having something the user wants to say to a specific person, articulated in the user's particular way for that moment.

When agent-side work touches that artifact, the substrate is what is being preserved or distorted, not just the surface. Grammar fixes preserve the substrate because they correct accidental friction in the surface without changing the intent the substrate carries. "Improvements" — tightening sentences, adding transitions, making the prose flow better — distort the substrate because they replace something that came from the user with something that came from an agent's pattern of what the user-shaped writing looks like. The recipient detects the substrate change, not the wording change.

The same substrate consideration applies when the question is sourcing material for new email work. The canonical material — the user's dictations, the user's authored pages, the user's published essays, the user's raw transcript voice samples — carries the user's substrate. Material derived from that source (Voice Alignment Validator reports, Opus character sketches, agent-paraphrased alignment-blog passages, prior agent prose previously confirmed) carries the user's patterns but not the user's substrate, because the synthesis step has separated the words from the intent they originally articulated. The first kind of material can be selected from and arranged. The second kind can be referenced for facts but not consumed as how-the-user-writes.

When the email work requires material that does not yet exist in canonical form, the operational move is to ask for a sample — three sentences from the user is enough to start, the same pattern that produced the product seed and Observable Today seed in working sessions — rather than compose toward what the user's dictation would have produced.

Canonical verbatim sources currently on file:
- `"$(alignment-harness records seeds)"/product-seed.md` — product dedication intent, the user-dictated 2026-05-14
- `"$(alignment-harness records seeds)"/product-observable-today-seed.md` — what is operating today, the user-dictated 2026-05-14
- `${CLAUDE_PLUGIN_ROOT}/skills/how-to-talk-like-the-founder/SKILL.md` voice samples 1–8 — raw transcript captures
- The user's authored production pages

Related skills: `writing-aligned-user-facing-words` (the operational stance for public-facing website copy, governed by the same substrate); `skill-file-create-pre-check-self-healing-protocol` (the user's verbatim articulation of why agent rule-extraction degrades capability).

## What "grammar fixes only" means

- Fix obvious typos and spelling errors
- Fix subject-verb agreement if clearly wrong
- Fix sentence fragments only if they're genuinely confusing (most are intentional rhythm)
- Capitalize proper nouns
- That's it. Stop there.

## What you must NOT do

- Do not "tighten" sentences
- Do not add transitions ("Additionally," "Furthermore," "That said,")
- Do not restructure paragraphs for "flow"
- Do not replace the user's word choices with "better" ones
- Do not add qualifiers or hedges the user didn't use
- Do not remove repetition (repetition is often intentional emphasis)
- Do not add bullet points or formatting to prose the user wrote as paragraphs
- Do not add a "professional" sign-off if the user just wrote the user's name
- Do not clean up the user's punctuation style (em dashes, ellipses, sentence fragments)

## The Gold Standard: The User's Approved Touch 1 Email

This is what authentic founder voice sounds like. This was grammar-fixed from the user's spoken words — nothing else changed:

> Hey Dr. [Name] — I'm the user. We're doing some research right now about how we can support the preventive-health movement, because we're really passionate about it. We want to see all of the preventive-health clinics that are authentic and operating with integrity get supported, get visible, and succeed.
>
> Specifically, we're really good at identifying bottlenecks in a business, and in many cases we can, in a quick call, offer some free coaching and actually spot the places where we can gain anywhere from X to Y% on the bottom line for these clinics — through tools related to the latest innovations in AI automation.
>
> We'd love to do a little bit of research and just ask you about what's blocking you. If you're interested, we can send you a quick survey — just let me know. That would help us make the biggest positive impact in the quest to restore the body's natural healing capacity — that which was available when we were younger and sort of falls off with time without intervention.
>
> — the user

### What makes this work

- "We're doing some research right now" — not "We are conducting research." Real speech patterns.
- "because we're really passionate about it" — not "driven by our passion for the space." Direct and human.
- "get supported, get visible, and succeed" — triple rhythm, the user's natural cadence
- "in a quick call, offer some free coaching" — casual, generous, not transactional
- "sort of falls off with time without intervention" — this is how people actually talk
- No links. No booking CTA. No product name. Just a human offering to help.

## How to use this skill

### When the user gives you spoken or written words to turn into an email:

1. Transcribe or copy the user's words exactly
2. Fix only grammar (typos, agreement, capitalization)
3. Present the result
4. Do NOT offer "polished" or "tightened" alternatives
5. If the user asks you to change something specific, change only that thing

### When writing new outreach from scratch:

1. Ask the user to speak or write the core message first
2. If that's not possible, write in the plainest possible language — short sentences, first person, conversational
3. Read it aloud. If it sounds like a LinkedIn post or a marketing email, rewrite it simpler
4. Avoid: "leverage," "optimize," "solution," "streamline," "innovative," "cutting-edge," "transform," "empower," "unlock potential," "drive results"
5. Prefer: "help," "fix," "find," "build," "figure out," "what's blocking you," "what's working"

### When reviewing existing copy for voice:

Compare against the Gold Standard email above. Ask:
- Does this sound like a person talking, or a campaign?
- Would you send this to a friend who owns a clinic, or does it feel like it came from a CRM?
- Are there phrases no human would say in conversation?
- Is there any language that positions the user as above the reader rather than alongside them?

## The progression that taught us this

1. AI wrote marketing-style emails with sales language, booking links, product pitches
2. The user said: that's not what this is — it's research, not sales
3. AI rewrote with "research framing" but still in AI voice — polished, structured, corporate-casual
4. The user said: use MY words, just fix the grammar
5. Grammar-fixed version of the user's actual spoken words = the best email in the sequence
6. Lesson locked: founder voice > AI voice, always, no exceptions

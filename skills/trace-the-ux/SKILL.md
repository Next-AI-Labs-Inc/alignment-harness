---
name: trace-the-ux
description: "Trace a user journey through the codebase — tell the story of what a person experiences, step by step, stopping at the first break. Use when investigating bugs, auditing flows, explaining code changes, or grounding proposals in reality."
triggers:
  - "/trace-the-ux"
  - "trace the user journey"
  - "what does the person actually experience"
  - "walk me through what happens"
  - "trace the ux"
  - "trace the journey"
  - "whats the ux that leads to"
  - "what happens for the user"
  - "whats the ux"
  - "ux flow that"
  - "whats the journey that"
---

# /trace-the-ux — Tell the Story of What a Person Experiences

If you receive this code, immediately print:

```
★ UX_Trace ──────────────────────────────────────
Tracing the person's journey through the code
```

## Before you start — read these skills first

1. **Read `/translate`** — this teaches you how to describe code changes in terms of what a person experiences. Notice: every code impact is translated to UX terms, never the reverse. The human experience is the primary layer. Code is evidence that supports it.

2. **Read `/align`** — this teaches you how to prevent hallucination. Notice: nothing you imagine is reality until the human confirms it. Every claim gets a certainty dot. Interpretations are never stated as facts. This is how you keep the trace honest.

3. **Read `/speak-human`** — this teaches you the language rules. Notice: no jargon, no variable names in the narrative paragraph, no code-speak. The human paragraph must be instantly understood by someone who has never seen the codebase.

These three skills are the INGREDIENTS of a UX trace. This skill teaches you how to COMBINE them into a continuous journey narrative.

## What This Skill Does

You trace a person's journey through a product feature by telling one continuous story — what the person does, what the system does in response, what the person sees — stopping at the first point where the experience deviates from intent. Every claim is grounded in actual code you've read, but the story is told in human terms.

This is NOT a code walkthrough. This is NOT a technical diagram. This is one person's story, told the way you'd tell it to the user over coffee, but with the precision of someone who just read every file involved.

## Why This Exists — The Journey to Getting This Right

This format was discovered through iteration in a session where the user asked an agent to explain a bug in the trial-to-paid conversion flow. The agent produced five wrong versions before arriving at the right one. Each failure teaches something:

### Failure 1: Code objects as subject

> "`isLatestTrialExpired()` returns `false` because `trial.used` is never set to `true`. The function checks `used` before dates at line 582."

**Why it's wrong:** There's no person in the story. The user reads this and has to mentally simulate the entire chain from "function returns wrong value" to "person doesn't see upgrade prompt." That simulation is where errors hide.

### Failure 2: Separated sections

> "**The Promise:** A person signs up and gets 7 days of coaching.
> **Where It Breaks:** The `used` field is never flipped."

**Why it's wrong:** The journey is one continuous sequence. Splitting it into "what should happen" and "what does happen" forces the reader to mentally stitch together two narratives. Nobody talks like that.

### Failure 3: Right lifecycle, wrong structure

> "The lifecycle is: grant → experience → expire → mark consumed → transition. The 'mark consumed' step never happens."

**Why it's wrong:** This is accurate but still structured like a report, not a story. The user said: "you're articulating the code, not the intent of the code."

### Failure 4: Code paragraphs mixed into narrative

> "A person lands on yourapp.com. *`DashboardOrHomePage.js` line 57 fires `handleLoginStart()`. This posts to `/auth/guest-register`...*"

**Why it's wrong:** The code is woven into the narrative with italic blocks, creating a wall of text where the human story and the technical evidence blur together. The user couldn't scan it.

### Failure 5: Code paragraphs after each narrative paragraph

> "A person lands on yourapp.com. Before they do anything, the page creates a guest account for them.
>
> `DashboardOrHomePage.js` line 57 fires `handleLoginStart()`..."

**Why it's almost right but still wrong:** The format is better — story paragraph followed by code paragraph. But the user said "this is not helpful" because the code paragraphs made it too long to scan. The story was being interrupted by implementation details that broke the flow.

### The narrative-only version (correct for the story, but incomplete)

> A person clicks a Meta ad. They land on yourapp.com. Before they do anything, the page creates a guest account for them — they get a temporary identity so the system can track their coaching even before they sign up.
>
> They start coaching. They type something real, the coach responds, they go deeper. Each message they send gets counted against a guest limit — after about 2-3 real exchanges, the system says "you've reached the guest limit" and asks them to register.
>
> They register — enter their real email, maybe a password. Their guest account becomes a real account. Same person, same conversation history, same database record. Just now with a real email and a flag that says "this person is registered."
>
> On their next profile load, the system provisions a 7-day legacy trial. Four checks run, all pass — they're not a guest anymore, they don't have a paid plan, they have no existing trial, and they haven't used up their lifetime trial limit. The trial provisions. They get full access for 7 days.

This version is correct — the person is the subject, it reads like a story, it's scannable. But the user pointed out it's incomplete: there's no connection to the code. Someone reading this can understand WHAT happens but can't trace it to WHERE in the code it happens. They can't verify it, audit it, or act on it. So the user asked for code grounding to be added. And the agent failed two more times.

### Failure 6: Mechanism walkthrough disguised as narrative

When asked to add code connections, the agent produced this:

> "We measure this by capturing their UTM parameters, Meta click IDs, and browser pixel cookies the moment they land. The frontend reads `utm_*` params from the URL at app boot in `index.js`, reads the `_fbc` and `_fbp` cookies that Meta's pixel set, and stores all of it in localStorage. When the guest account is created moments later, all of this gets sent to the backend and saved on the User document as `utmParams` (a Map), `fb_click_id` (from the `_fbc` cookie), `fbp` (the browser pixel ID), and `initialLandingPage` (the hostname — `yourapp.com`). A permanent copy is also saved as `firstTouchAttribution` so even if they come back later through a different link, we always know how they originally found us."

**Why it's wrong:** This is a code walkthrough disguised as a narrative. It explains the MECHANISM — how localStorage works, how cookies get read, how the backend saves each field. Nobody asked how the mechanism works. The reader needs to know WHAT we do (set attribution fields), WHERE it happens in the code (which file, which function), and WHY (to classify the funnel). They do NOT need to know HOW the frontend extracts UTM params from the URL, stores them in localStorage, and sends them to the backend. If they want the mechanism, they can read the code. The job of this document is to tell them which code to read, not to read it for them.

**The core mistake:** The agent confused "grounding in code" with "explaining the code." Grounding means anchoring a principle to a specific location. Explaining means walking through what the code does step by step. The reader wants anchors, not walkthroughs.

### Failure 7: Code paragraphs after each story paragraph

When the user said "add separate paragraphs that connect the dots on the code," the agent produced alternating paragraphs — one story, one code block, one story, one code block:

> "A person lands on yourapp.com. Before they do anything, the page creates a guest account for them.
>
> `DashboardOrHomePage.js` at line 57 fires `handleLoginStart()`. That function posts to `/auth/guest-register`, which hits `authController.js` line 1334. The backend creates a User document with `isGuest: true` and a synthetic email. A 30-day JWT is signed and returned."

**Why it's wrong:** The code paragraphs interrupted the flow. The user said "this is not helpful" — the story became unreadable because every paragraph was followed by an implementation block. The code paragraphs were also mechanism walkthroughs (see Failure 6) — they explained HOW the guest registration works instead of just anchoring WHERE it happens.

### Failure 8: Code leaking into the human paragraph

When the agent finally got the two-paragraph format, it STILL put code into the human paragraph:

> "Day 8. Their trial window has passed. The system knows the trial is over — isUserOnLegacyTrial checks the calendar and correctly returns false. Their access should change. They should see a conversion moment — their own vision reflected back, with an invitation to continue for a small first payment. But the conversion gate legacy_trial_engagement_scoring is at 0% rollout in the StagedRelease collection, so checkUsage.js skips the time/message gate entirely."

**Why it fails — read it as a new person:** You see `isUserOnLegacyTrial`, `legacy_trial_engagement_scoring`, `StagedRelease collection`, `checkUsage.js`, `time/message gate`. If you've never seen this codebase, you don't know what ANY of those things are. The function names are the subject of sentences. "Returns false" is code-speak for "says no." The human story is buried under code references.

**The corrected version — human paragraph:**

> Day 8. Their trial window has passed. The system knows the trial is over. Their access should change — they should see their own vision reflected back, with an invitation to continue for a small first payment. But the feature that controls when this invitation appears is turned off. It was never activated. So the person just keeps coaching with full access. No conversion moment. No offer. They eventually drift away.

**The code paragraph (separate — ONE LINE):**

> `legacy_trial_engagement_scoring` staged release at 0% → `checkUsage.js` lines 122-136 skip the triple gate.

**Why the separation matters — this is about humans and computers being able to talk to each other:**

The human paragraph is for ANYONE — the user, a new agent, a contractor, an investor. It describes what happens to a person using the product. No code knowledge required. If someone reads only this paragraph, they understand the problem completely.

The code paragraph is for AGENTS AND ENGINEERS — it tells them exactly where to look. Which file, which function, which collection, which lines. It's a lookup table, not a narrative.

This is not documentation — code should not be documented in many places. This is a BRIDGE between the human concept and the code that implements it. The human paragraph is the concept. The code paragraph is the address. Together they let a human and an agent talk about the same thing without either one having to translate.

### The final correct version — complete trace with both tracks

> A person clicks a Meta ad or finds us in other ways. 🟣 1 85%
>
> For the Beta 19 path, they are directed to yourapp.com. We know which funnel they belong to based on which domain they actually landed on.
>
> We classify this using `classifyAcquisitionFunnel`, which checks `User.initialLandingPage`. `yourapp.com` = beta19, `go.yourapp.com` = beta50.
>
> We capture where they came from — which ad, which campaign, which click — and save it permanently on their account so we always know their source.
>
> Attribution fields `utmParams`, `fb_click_id`, `fbp`, `firstTouchAttribution` set by `createGuestUser` at `authController.js` line 1334.
>
> Their first experience is the coaching interface directly. No landing page, no onboarding screen. They see the coach, ready to talk. 🟡 4 65%
>
> `DashboardOrHomePage` renders the coaching UI at `App.js` line 994 with `softGate=true`.
>
> Before they do anything, the page creates a guest account for them — they get a temporary identity so the system can track their coaching even before they sign up. 🟣 5 85%
>
> `useGuestLogin.js` line 128 → `createGuestUser` at `authController.js` line 1334. Sets `isGuest: true`.
>
> [... rest of the trace follows the same pattern ...]
>
> **Here's where it breaks.**
>
> Day 8. Their trial window has passed. The system knows the trial is over. Their access should change — they should see their own vision reflected back, with an invitation to continue for a small first payment. But the feature that controls when this invitation appears is turned off. It was never activated. So the person just keeps coaching with full access. No conversion moment. No offer. They eventually drift away. 🟣 10 80%
>
> The conversion gate is `legacy_trial_engagement_scoring` in the `StagedRelease` collection, currently at 0% rollout. When off, `checkUsage.js` lines 122-136 skip the time/message/pitch-data triple gate — the 403 never fires.

## How to Use This Skill

### Step 1: Identify the person and the starting action

Who is this person? What did they do first? Be specific about the conditions — which registration path, which user type, which funnel.

### Step 2: Read the actual code for every step

Do NOT guess what the code does. Read it. If you haven't read the file, you can't describe what happens. Dispatch research agents if needed, but never claim something happens without having seen the code that makes it happen.

### Step 3: Tell the story as TWO parallel tracks — human paragraph then code paragraph

For each step in the journey, write TWO separate paragraphs:

**Paragraph 1 (the human story):** What happens and why, in plain language. NO variable names, NO function names, NO file paths, NO jargon. This paragraph must be instantly understandable by someone who has never seen the codebase. It describes the CONCEPT — what we do and why.

**Paragraph 2 (the code grounding):** Which specific file, function, and field makes paragraph 1 happen. ONE LINE. Not a paragraph. If it takes more than one line, you're explaining the mechanism. The code grounding is an ADDRESS — where to look. Not a description of what you'll find when you get there.

Example of the correct format:

> We measure this by setting attribution fields on the User document during guest registration, and we use a classification function to determine this is a Beta 19 user based on which domain they landed on.
>
> The attribution fields are `utmParams`, `fb_click_id`, `fbp`, `firstTouchAttribution` — set by `createGuestUser` at `authController.js` line 1334. The classification is `classifyAcquisitionFunnel` checking `initialLandingPage`.

Example of the WRONG format (code mixed into narrative):

> We measure this by setting attribution fields — `utmParams`, `fb_click_id`, `fbp`, and `firstTouchAttribution` — on the User document during guest registration at `authController.js` line 1334, and we use `classifyAcquisitionFunnel` to derive the beta19 classification based on `initialLandingPage` being `yourapp.com`.

**Why the wrong version fails:** The variable names and file paths interrupt the narrative flow. The reader has to parse code inline with concepts. The human story and the code evidence are blurred into one sentence. Nobody can scan it. Separate them. The human story is the MAP. The code grounding is the TERRITORY. They serve different readers in the same document.

### Step 5: Verify break point claims with the same rigor as working claims

"Nothing happens" is a claim. "They keep coaching" is a claim. "No offer appears" is a claim. Each one requires the same evidence as "the trial provisions" or "the banner shows 3 days left." If you haven't verified what the person actually sees on day 8, you cannot state what they don't see. Leave it as `[not verified — what does the person actually see here?]` until you check.

### Step 6: Unpack the break point — one claim per line

The break point is the most important part. It must NEVER be a paragraph. Each claim gets its own line with its own certainty score. The reader must be able to greenlight or veto each piece independently.

## Rules

1. **The person is always the subject.** Not the function, not the variable, not the middleware.
2. **One continuous story.** No sections, no headers (except "Here's where it breaks"), no bullet lists within the narrative.
3. **Stop at the first break.** Don't catalog every bug. Find the first point where the experience deviates and describe that one deviation.
4. **Every claim is grounded.** You've read the code that makes each step happen. Code anchors appear naturally in the narrative.
5. **Code names are LINKS, not communication.** You CANNOT use a code variable name to explain what something is. The human paragraph must state the UX concept in plain English FIRST. The code line is a LINK from that concept to where it lives in the codebase. If you write `legacy_trial_engagement_scoring` without first saying "the feature that decides when to show the upgrade invitation" in the human paragraph, you've failed. The reader should NEVER have to guess what a code name means — the meaning was already stated in English, the code name is just the address where that concept lives.
6. **Nothing you imagine is reality until confirmed.** Every factual claim in the trace gets a certainty dot and an ID number. The human can greenlight (`3 g`) or veto (`3 v`) individual claims. Until a claim is greenlighted, it is YOUR IMAGINATION — not shared reality. This is how hallucination is prevented: by never confusing what you derived from reading code with what the human has confirmed is true. A claim at 85% certainty that you read from a code comment is STILL your imagination — the comment could be aspirational, stale, or wrong.
7. **Certainty dots follow every claim.** Format: `{claim text} 🔴 {id} {certainty%}`. Dots: 🔴 (<60%), 🟡 (60-69%), 🔵 (70-79%), 🟣 (80-89%), 🟢 (100% = human confirmed). Nothing reaches 🟢 without the human saying so. The dots go AFTER the claim, never before. The ID is a sequential number so the human can say "4 g" to greenlight or "4 v" to veto without quoting the whole sentence.
8. **No speculation without marking it.** If you don't know what happens, leave a placeholder `[confirming]`. If you THINK you know but haven't verified, write it as a claim with a certainty score. Never state an unverified belief as a fact — that is the literal source of hallucination cascades. An agent reading your trace in a future session will treat every unmarked statement as established truth.
9. **MANDATORY: End every reply with quick commands.** This is not optional. Every single reply must end with the command list so the human can respond with a single character. If you skip this, the human has to figure out how to interact with you instead of just typing "3 g". Include the standard commands plus 1-3 predicted next actions specific to the current context.

```
---
Quick commands:
- r — trigger a reflection to boost certainty
- [id] g — greenlight an item
- [id] v — veto an item
- confirm — confirm the full trace is correct
- expand — build out the next step in the journey
- boost — fill in gaps using institutional knowledge
- spec — convert to technical plan
- [predicted action 1]
- [predicted action 2]
```

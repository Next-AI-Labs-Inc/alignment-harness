---
name: pipeline-consumption-handoff
description: "Produce a consumption document for every completed pipeline item before handing off to the human. Use when work is finished and the human needs to know exactly what was built, how to open it, and what to look for. NEVER hand over a URL without verifying it first."
triggers:
  - "done"
  - "finished"
  - "here's what I built"
  - "ready to hand off"
  - "here's what we shipped"
  - "consumption handoff"
  - "09.5"
  - "pipeline-consumption-handoff"
---

# Pipeline Consumption Handoff

## Why This Skill Exists

This skill exists because agents complete work and then present it in agent language — pointing the human at broken links, using internal names they don't recognize, and leaving them to figure out whether it even works. The human shouldn't have to debug a handoff. They should be able to open a URL, see the thing, and immediately know whether it's working or broken.

The failure mode this prevents: handing over a broken link, or a link that works but the human has no idea what to look for when they get there.

The human cost this reduces: the user spent time trying to consume output that wasn't consumable. That's lost trust and lost time on the most constrained resource in the system.

**This skill exists because: agents deliver work the human can't consume without effort. It reduces the user's friction by verifying every touchpoint before the human is asked to touch it.**

---

## How to Consume This Skill

When you are given this command — or when you're completing any substantive pipeline stage — you are being asked to produce a consumption document. The output is not a summary of what you did. It is a guide for what the human should open, click, and see.

Do not just describe work. Walk the human through using it, in the order they would actually experience it.

Before you write a single URL, you MUST verify it returns a 200. If it doesn't, either fix it first or flag it as broken — prominently, at the top of the output, before anything else.

---

## Step-by-Step Protocol

### Step 1 — Inventory every touchpoint

List every URL, page, admin panel, or feature the human would need to interact with to experience the completed work. This includes:

- Pages they would open in a browser
- API endpoints they might hit directly
- Admin views that show the results
- Any external links referenced in the output

### Step 2 — Verify every URL (BLOCKING gate)

For each URL identified in Step 1, run a verification check before writing the handoff document.

```bash
# For local URLs
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/the-path
curl -s -o /dev/null -w "%{http_code}" http://localhost:<your-api-port>/api/the-endpoint

# For external URLs
curl -s -o /dev/null -w "%{http_code}" -L https://the-url.com
```

**If any URL returns non-200:**
- If fixable in under 5 minutes: fix it, re-verify, then continue.
- If not fixable: flag it at the very top of the handoff document in plain language before anything else. Something like: "One thing is broken — the link to [plain description] doesn't load yet. I've flagged it below. Everything else should work."

**Never silently include a broken link. Never assume a URL works because it existed in the code.**

Print to the conversation: `[HANDOFF VERIFY]: "{url}" — Status: {http_code} — Result: {working/broken}`

### Step 3 — Write the consumption document

Output the document to `09.5-consumption-handoff.md` in the current working directory, using the structure below.

---

## Output Format

The document must be written in plain human language. No jargon. No internal names. No variable names. No architecture descriptions. Write as if explaining to a smart person who doesn't code and hasn't seen the project before.

Use the /speak-human methodology throughout: describe what the human will SEE, CLICK, and NOTICE — not what the system does internally.

```markdown
# What We Built — [Date]

## The Problem This Solves

[1-3 sentences in plain language. What was broken or missing before? What was the human doing manually or going without? Start with the human experience, not the technical gap.]

---

## How to See It

[For each touchpoint, provide:]

### [Plain-language name of the thing — e.g., "The coaching session page" not "SessionView component"]

**Open this:** [full URL — localhost:3000/path or https://... — verified working]

**What to do:** [exactly what to click, scroll to, or type — specific enough that someone who has never seen this could follow the instructions]

**What you should see:** [describe the specific visual or behavioral change — what's new, what's different, what should catch their attention]

**What "working" looks like:** [one sentence — e.g., "The summary appears in the sidebar within 3 seconds of the session ending"]

**What "broken" looks like:** [one sentence — e.g., "If you see a blank section or a loading spinner that never resolves, something went wrong"]

---

[Repeat for each touchpoint]

---

## What Changed — In One Sentence Each

[List each UX change as a single sentence in this format:]
- When [situation], [person] now [what they experience] because [why it matters].

[Use these markers:]
- Verified — means you opened it in a browser and confirmed it works
- Not yet verified — means it's built but you haven't confirmed it in a browser

---

## Anything Broken or Incomplete

[If nothing: skip this section entirely.]

[If something is broken: describe it here in plain language. What the human would experience. Why it's broken if known. What the fix is or when it will be addressed.]
```

---

## Feedback Loop When It Falls Short

If you cannot verify a URL (server isn't running, port unknown, test environment not configured):
- Say so explicitly at the top of the handoff document
- Do not present the URL as if it works
- Describe how the human can start the server or reach the environment themselves

If the skill structure doesn't map well to what was built (e.g., the work is purely backend with no human-facing surface):
- Still write the document, but reframe "How to See It" as "How to Confirm It Worked" — with admin panel views, log lines, or database state the human can inspect

Report gaps: "This handoff skill doesn't cover [X type of output] well — the user may want to extend it for that case."

---

## Observability Requirements

Every time you run a URL verification check, print this line to the conversation before writing the handoff document:

`[HANDOFF VERIFY]: "{url}" — Status: {http_code} — Result: working/broken — Action: {continuing/fixing/flagging}`

If you skip verification because a URL is not checkable (e.g., requires auth, browser-only session), print:

`[HANDOFF VERIFY]: "{url}" — Status: unverifiable — Reason: {why} — Action: flagging in document`

Never silently skip verification. The human must be able to see that you checked.

---

## Composition With Other Skills

This skill should run AFTER:
- `/consume` — which governs the format of consumption steps
- `/communicate-what-you-finished` — which governs the UX story format

This skill EXTENDS both of those by adding URL verification as a hard gate before any handoff is presented.

This skill pairs well with:
- `/speak-human` — run all output through speak-human before finalizing
- `/verification-contracts` — if a governer contract exists, this document should close out the verification items
- `/reflect` — if you are uncertain whether the work is actually complete, run /reflect before this skill

---

## Honest Framing

We do not know for certain that this skill fully prevents broken handoffs in all cases. There are scenarios where URLs require authentication, browser state, or a running server that can't be easily verified in a curl check. If you encounter one of those, flag it — don't pretend you verified it. The skill is a starting hypothesis being tested. Every broken handoff that slips through is a signal to improve it — report it, don't work around it silently.

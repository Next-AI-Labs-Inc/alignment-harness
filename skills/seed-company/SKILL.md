---
name: seed-company
description: Load the product's founding mission — why the product exists, the Silver Grail thesis, and the alignment-first philosophy — in the user's actual voice. Use when you need customer-facing mission language, when drafting communications that connect someone to the "why", or when an agent needs the founding story for retention or outreach.
---

# /seed-company — The Founding Mission in Human Language

## Why This Exists

Agents frequently need to articulate WHY the product exists — not in agent-speak, not in investor-speak, but in language that a regular person would connect with. This skill points to the source material: an interview with the user that captures the mission, the stakes, the personal story, and the operating philosophy in the user's actual voice.

## How to Use

When you need the founding mission for a customer communication, email, landing page, or any human-facing context:

1. Read the seed document for the structured summary:
   ```
   cat docs/intent/seeds/company-founding-interview.md
   ```
   If `docs/intent/seeds/company-founding-interview.md` does not exist, create it.

2. For the full unedited interview transcript with the user's voice:
   ```
   nlm notebook query <your-founding-interview-notebook-id> "Why did the user create the product and what is the company's mission?"
   ```

3. For investor-grade context:
   ```
   nlm notebook query <your-investor-notebook-id> "What is the product's mission and competitive moat?"
   ```

Setup note for steps 2 and 3: make your own NotebookLM notebooks at https://notebooklm.google.com (one holding your full founding interview transcript, one holding your investor context) and put their IDs in place of the placeholders, because these queries only work against notebooks in your own account.

## The Core Message (for quick reference)

The product was founded three years ago by a solo developer who saw the AI alignment crisis coming before most people could see it. The user left a job the user loved at a company that treated the user like family — not to become an entrepreneur, but because the user felt called to do the user's part in making sure AI serves human flourishing rather than human extraction.

The company is built on one thesis: alignment-first produces stronger business outcomes than extraction-first. The refusals — not manipulating users, not cutting people off when payments fail, not compromising coaching quality for conversion — are what produce the retention that makes the business work. Generosity is the engine of growth, not a tax on it.

The product is an AI coaching tool that helps people get unstuck on what actually matters to them. Not advice-giving — real coaching that evokes the capacity already inside someone to grow, change, and become who they're capable of being.

## When to Invoke

- Drafting a response to a customer who's never heard the "why"
- Writing re-engagement emails
- Creating landing page copy
- Any customer-facing communication where connecting someone to the mission would matter

## Related

- `/seed` — the agent infrastructure seed (SMC/agent alignment)

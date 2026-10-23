---
name: whats-left
description: Summarize unfinished assigned work for admins in UX-first language. Use when asked what is left, what is in progress, or to communicate incomplete work without technical jargon; translate into user-facing flows and call out what remains with concrete blockers.
---

# Whats Left

## Overview

Use this skill to report unfinished work in UX terms, not implementation details.

## Output format

Write 1–3 sentences. Each sentence must:

- Describe the user-facing flow or UX outcome.
- Say what is done vs. what is still missing.
- Name the remaining blocker in concrete, non-technical terms.

## Translation pattern

Convert technical phrases into UX flow language.

Example:

- Instead of: "Wiped cookies on reload"
- Write: "I was working on making sure that when a user refreshes a page they stay logged in, but I didn't finish because the session refresh step still fails when the page loads with an expired token."

## Scope rule (user correction, 2026-08-27)

Report what is unfinished WITHIN THE SCOPE YOU WERE ASSIGNED. Do not remind the user
to push to production, deploy, or ship — that is the user's decision and the user never needs to be
told. "What's left" means: uncommitted work from this session, unresolved grievances the
user raised that were not acted on, verification steps that were skipped, files that
are dirty. Not downstream steps like deployment that are outside the agent's scope.

## Checklist

- No internal jargon (e.g., "cookies", "localStorage", "interceptors").
- No implementation steps.
- No deployment reminders — the user decides when to ship.
- Focus on user behavior and what still prevents the experience from working.

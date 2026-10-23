---
name: devtools-site-testing
description: Chrome DevTools (MCP) workflow to load and test real production/staging/local app sites, validate Cloudflare bypass access, run perf traces, and surface console/network failures with root-cause notes.
---

# Devtools Site Testing

## Overview

Load an app environment in Chrome DevTools (MCP), confirm access and token persistence, run a perf trace, and report console/network failures with root-cause hints.

## Workflow

### 1) Choose target URL

- Default to local: `http://localhost:3000/`.
- Treat production as unavailable unless the user confirms access and provides the exact host.
- If staging is unclear, check Vercel deployment URL or ask for the exact host.

### 2) Reuse DevTools browser if already running

- If `new_page` returns the "browser already running" error, do not give up.
- Use `list_pages` → `select_page` on an existing tab, then `navigate_page` to your target URL.
- If you need a clean session, close extra tabs with `close_page` and reuse the remaining page.

### 3) Cloudflare bypass (token -> cookie)

- If Cloudflare blocks, append the bypass token query param from `AGENTS.md`:
  - `?<bypass_param>=<token>`
- Load the page once with the token.
- Verify the cookie persists and the URL cleans itself:
  - `document.cookie` should include `<bypass_param>=...`
  - `location.search` should be empty (token removed)

If the cookie is missing:
- Check console for token handler logs.
- Inspect the project's token handler component for the bypass handling.

### 4) Local login (preferred)

- Follow the project's local login steps.

### 5) Smoke check the page

- Confirm key elements render (login form, buttons, nav).
- Note any layout breaks or disabled actions.

### 6) Capture console + network errors

- List console errors and their sources.
- Inspect failed network requests:
  - Status code, endpoint, method, and error (CORS vs 5xx vs blocked).
  - Preflight failures usually indicate API or CORS config issues.

### 7) Run performance trace

- Start a Performance trace with **reload**.
- Wait for the page to settle, then stop the trace.
- Report the key metrics (LCP, CLS, TBT/INP) and obvious bottlenecks.

### 8) Summarize findings

- Provide a short list of user-visible issues and likely causes.
- Separate access problems (Cloudflare/token) from backend/API failures.

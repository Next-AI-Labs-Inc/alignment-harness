---
name: on-scope-change
description: Use whenever the active scope shifts during a session — entering a sub-task, dropping into a bug, climbing back to a parent goal, or pivoting. Emits a visible nested breadcrumb of the current focus (deepest < parent < root) so the user gets instant recall of exactly where the agent is in the work's nesting, and fires the chapter-mark so it lands in the transcript/TOC.
---

# On Scope Change

Any time your scope changes, update your session title to reflect it — minimum
words per level, hyper-specific words that trigger instant recall for the user.

## The format — TWO lines, never one

The marker and the breadcrumb live on **separate lines**. This is not cosmetic —
it is a scrape contract:

- **Line 1 — the marker:** the pin emoji + the label `Focus Updated:` and NOTHING
  else. This is the anchor a later scraper greps for.
- **Line 2 — the breadcrumb:** ONLY `{deepest} < {parent} < {root}`. No pin, no
  label, no extra words. This is the payload the scraper grabs from the line
  immediately below the marker.

```
📍 Focus Updated:
{deepest active scope} < {parent} < {root}
```

Read the breadcrumb right-to-left = root → deepest. Each level is the fewest,
most specific words that let the user recall exactly what that level is. The
chain grows as you descend into sub-work and shortens as you climb back out.

**Never truncate the parent chain.** If the nesting is deeper than three levels,
include every level — do not drop the middle, do not collapse to three. The chain
is exactly as long as the real nesting is:

```
📍 Focus Updated:
fix indent bug < focus column idea < idea gallery < focus UI < founder focus
```

**Hard rule:** the pin and the label NEVER appear on the breadcrumb line, and the
breadcrumb line NEVER contains the pin or label. Two distinct lines, always — so
scraping is unambiguous: find the marker line, take the line beneath it.

## Examples

The root focus is `founder focus` (priority management with delegation fork).
If you start on the UI for predicting next things:

```
📍 Focus Updated:
predict next < founder focus
```

If the focus then changes to debugging that:

```
📍 Focus Updated:
debugging < predict next < founder focus
```

If you climb back out of debugging:

```
📍 Focus Updated:
predict next < founder focus
```

## How it surfaces

The chapter-mark is the mechanism that surfaces the breadcrumb in the
transcript / table of contents. After printing the two-line marker, fire the
chapter-mark whose title is the breadcrumb **only** — exactly the line-2 payload,
with NO pin and NO `Focus Updated:` label. The pin and label live solely on the
chat marker line (line 1); the chapter title is the pure breadcrumb so the TOC
stays clean and the breadcrumb is identical in both places.

```
mcp__ccd_session__mark_chapter({
  title: "{deepest} < {parent} < {root}",   // pure breadcrumb — NO pin, NO label
  summary: "one line on what this scope covers"
})
```

So each scope change produces exactly three things, in this order:
1. Chat line 1: `📍 Focus Updated:`  (marker — pin + label only)
2. Chat line 2: `{deepest} < {parent} < {root}`  (breadcrumb payload)
3. A chapter-mark whose title === that breadcrumb (no pin, no label)

## When to fire

- Entering a new sub-task under the current goal (descend a level)
- Dropping into a bug, debug, or detour off the current work (descend)
- Finishing a sub-scope and returning to its parent (ascend — shorten the chain)
- Pivoting to a different root focus entirely (new chain)

Do not fire for every tool call — only when the *active scope* genuinely moves.

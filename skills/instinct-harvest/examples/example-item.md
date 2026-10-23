<!--
This is an illustrative, generic worked example — not real transcript data
from any actual project or person. It shows the SHAPE an instinct item
should take (see Step 3 in SKILL.md): prose, not fields; the provenance told
as a short story; code vocabulary unpacked inline; the limit stated plainly
at the end with no header announcing it.

Once you have your own first confirmed batch, replace this pointer in
SKILL.md with your own items as the reference standard — your own voice is
the real target, not this example.
-->
---
instinct-id: INST-GENERAL-0000
domain: general
situation: about-to-mark-a-migration-safe
strength: hard-lean
captured: 2026-01-14T09:12:00Z
last-confirmed: 2026-01-14T09:12:00Z
mined: 2026-01-15
mined-by: sonnet
status: confirmed
person-verdict-on-source: corrected
source-session: c9e4a1b2
source-pair: c9e4a1b2/002-sanity-check.md
in-tension-with: []
---

# Lean hard toward proving a migration is safe under real concurrent load, not just a clean run

When a database migration adds a column with a default value on a large table, the temptation is to call it safe once it runs cleanly against a copy of the data. This one came from a correction: the check said the migration "looks safe, ran without errors," and the reply was that a clean run against a static copy says nothing about what happens when writes are still landing on that table while the migration runs — table locks and default backfills behave differently under concurrent traffic than they do alone. The lean now is to name, in the check itself, what was actually tested (a static copy, a staging replay, or real concurrent load) rather than letting "ran without errors" stand in for "safe." This might not apply to a migration that only adds an index without a table rewrite, or on a table small enough that a lock window is genuinely unnoticeable — in those cases a plain clean-run check is honestly sufficient, and saying so is fine.

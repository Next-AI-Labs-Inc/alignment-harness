# Governer — the per-task risk score every gate reads

## What it's for
If every check pushed back equally hard on every task, the harness would be unbearable on a one-line typo fix and not firm enough on a change to how payment works. Before real work starts, the agent answers in writing what could go wrong for a real person and how far a mistake would travel. That becomes one number, 0–100, and the rest of the harness reads it:
- **the coding gate** lets file edits through once the task has a score;
- **the evidence gate** requires proof from 20 up, and holds the agent to its written verification contract from 60 up;
- **the agent's own depth**: under 20 just build it; 20–59 light checks; 60–79 reflect before acting; 80+ every check, and it tells you plainly what's at stake first.

The score is computed on your machine by the plugin's copy of the author's scoring code (`lib/scorer/`), with no server and no key. It is written to this session's state with `scoredBy: "agent"`. If scoring fails, the state says **unscored** — never a made-up number. On each message the harness may also note a quick keyword guess (for example "mentions billing"); it is labelled provisional, is only a hint, and never loosens any gate.

## Is it set up?
It works out of the box with general risk tiers (payment and sign-in 100, onboarding 85, core feature 75, cosmetic 20, internal tooling 15, docs 0). Until you confirm your own table, every score is marked **uncalibrated**.

## How to set it up
Run `/alignment-harness:harness-setup` → checkpoint "risk-table". It reads your repository for payment, sign-in, messaging and core-feature code (and, only if you say yes, your past sessions for what you most often corrected), proposes a table, and asks you to confirm each row. It is saved to `alignment-harness risk-table path`.

Dials (switches file, `governer.*`): `gateStrength` (`block`/`remind`/`off`), `maxBlocksPerSession` (3 — after that the gate only reminds), `criticalMassFloor` (80 — when two of the three "how dangerous is a mistake" answers are 8+), `writeProvisionalBaseline`, `injectScoreBanner`, `applyToSubagents`. The skill-prediction step needs an oracle of your own skill history (`predictRequiredSkills.oracleCommand`); without one, the governer skips it and says so.

## Is it working?
- `alignment-harness status` — this session's score, who scored it, calibrated or not.
- `alignment-harness doctor` → `governer: … N scores recorded, M distinct values`. Scores should vary with the task. The same number every time means it isn't really being scored per task.
- Quick test: in a scratch repo ask for "fix a typo in a code comment" and then "change how a subscription is charged". The first should score under 20, the second 80 or more.

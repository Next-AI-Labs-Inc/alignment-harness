'use strict';
// The governer's local scoring and write-back.
//
// What this is for: before real work starts, the agent answers in writing what
// could go wrong for a real person and how far a mistake would travel. This
// turns those answers into one 0–100 number and writes it where every gate
// reads it. Before this plugin, the gates on a reference setup read a
// constant (42, or 50 on failure) because nothing wrote the agent's real score.
//
// Rules this file keeps:
//   - A score written here is the agent's own (scoredBy: "agent").
//   - If scoring fails, the state says "unscored" — never a made-up number.
//   - Until the person confirms their risk table, scores say "uncalibrated".

const core = require('./core');
const scorer = require('./scorer/pipelineLeverageScorer');

function applyConfig() {
  const { switches } = core.loadSwitchesCached();
  const risk = core.loadRiskTable();
  const cats = {};
  for (const [name, row] of Object.entries((risk.table && risk.table.categories) || {})) {
    if (typeof row === 'number') cats[name] = row;
    else if (row && typeof row.score === 'number') {
      cats[name] = (row.downstreamFloor !== undefined) ? { score: row.score, downstreamFloor: row.downstreamFloor } : row.score;
    }
  }
  scorer.setCategoryOverrides(cats);
  scorer.setImpactTierFloors(risk.table && risk.table.impactTierFloors);
  const floor = switches.governer && switches.governer.criticalMassFloor;
  if (floor !== undefined) scorer.setCriticalMassFloor(floor);
  return { risk, switches };
}

function clampDim(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(1, Math.min(10, Math.round(n)));
}

// input: { task, category, touchesUserState, impactTier, ac, hp, ew, sila:{v1..v9}, manualScore }
// Returns { ok, record, result, error }
function scoreTask(sessionId, input) {
  const at = core.nowIso();
  try {
    const { risk } = applyConfig();
    if (!input || !input.task) throw new Error('say what the task is (--task "...")');
    const ac = clampDim(input.ac);
    const hp = clampDim(input.hp);
    const ew = clampDim(input.ew);
    if (ac === undefined || hp === undefined || ew === undefined) {
      throw new Error('all three risk answers are needed: --ac, --hp, --ew (each 1-10)');
    }
    const params = {
      category: input.category || undefined,
      touchesUserState: !!input.touchesUserState,
      impactTier: input.impactTier || undefined,
      agenticCompounding: ac,
      hallucinationPropagation: hp,
      existingWinsAtStake: ew,
    };
    if (input.sila) params.silaVariables = input.sila;
    if (input.manualScore !== undefined) params.manualScore = input.manualScore;
    const result = scorer.computeAdaptiveScore(params);
    const score = result.unifiedScore;
    if (!Number.isFinite(score)) throw new Error('scorer returned no number');

    const record = {
      scoredBy: 'agent',
      task: String(input.task).slice(0, 500),
      overallGovernerScore: score,
      degreeToWhichThisTaskAffectsWhatUsersExperience: result.baseScore,
      degreeToWhichAgentMistakesWouldCompoundAcrossFutureSessions: ac,
      degreeToWhichGettingThisWrongWouldSpreadToOtherSystems: hp,
      degreeToWhichThisCouldBreakSomethingAlreadyWorking: ew,
      category: params.category || null,
      touchesUserState: params.touchesUserState,
      impactTier: params.impactTier || null,
      method: result.method,
      scoreThresholds: result.scoreThresholds,
      calibrated: risk.calibrated,
      riskTableSource: risk.source,
      uxBreakageItems: Number.isFinite(Number(input.uxItems)) ? Number(input.uxItems) : null,
      at,
    };
    core.updateSession(sessionId, (s) => {
      s.governer = record;
      s.sessionGovernerRan = true;
      s.overallGovernerScore = score; // mirror for simple readers
      s.scoredBy = 'agent';
      s.history = (s.history || []).concat([{ at, task: record.task, score }]).slice(-50);
      return s;
    });
    core.resetBlocks(sessionId, 'governer');
    core.log('GovernerScored', { sessionId, score, scoredBy: 'agent', calibrated: risk.calibrated, ac, hp, ew, category: record.category });
    return { ok: true, record, result };
  } catch (e) {
    // Failure is recorded as "unscored" — never as a number.
    try {
      core.updateSession(sessionId, (s) => {
        const prev = s.governer && s.governer.scoredBy === 'agent' ? s.governer : null;
        if (!prev) {
          s.governer = { scoredBy: 'unscored', overallGovernerScore: null, error: e.message, at };
          s.sessionGovernerRan = false;
          s.overallGovernerScore = null;
          s.scoredBy = 'unscored';
        } else {
          s.lastScoringError = { error: e.message, at };
        }
        return s;
      });
    } catch (_) { /* ignore */ }
    core.log('GovernerScoreFailed', { sessionId, error: e.message });
    return { ok: false, error: e.message };
  }
}

// ── Provisional baseline (UserPromptSubmit) ─────────────────────────────────
// A cheap keyword guess, labelled provisional. Shown to the agent as a hint.
// It never counts as "the governer ran" and never loosens a gate.
const BASELINE_RULES = [
  { re: /\b(payment|billing|charge|refund|subscription|invoice|stripe|checkout|pricing)\b/i, score: 95, why: 'mentions money or billing' },
  { re: /\b(auth|login|log in|sign[- ]?in|sign[- ]?up|password|session token|oauth|permission)\b/i, score: 90, why: 'mentions sign-in or permissions' },
  { re: /\b(delete|drop table|migrat|production|prod\b|deploy|rm -rf|force push)\b/i, score: 80, why: 'mentions deleting, migrating or production' },
  { re: /\b(email|notification|message users|send to users)\b/i, score: 70, why: 'mentions messages that reach users' },
  { re: /\b(onboarding|signup flow|first run)\b/i, score: 70, why: 'mentions onboarding' },
  { re: /\b(typo|comment|readme|docs?|documentation|rename a variable|whitespace|lint)\b/i, score: 15, why: 'sounds like docs or a small text change' },
];

function baselineFor(message) {
  let best = null;
  for (const r of BASELINE_RULES) {
    if (r.re.test(message)) {
      if (!best || r.score > best.score) best = { score: r.score, why: r.why };
    }
  }
  return best || { score: null, why: 'no risk keywords found' };
}

function writeBaseline(sessionId, message) {
  const b = baselineFor(message);
  const at = core.nowIso();
  core.updateSession(sessionId, (s) => {
    s.baseline = { scoredBy: 'baseline', provisional: true, score: b.score, reason: b.why, at };
    if (!s.governer) s.governer = { scoredBy: 'unscored', overallGovernerScore: null, at };
    return s;
  });
  return b;
}

// Plain-language meaning of a score, for the agent and the person.
function describeScore(score) {
  if (score === null || score === undefined) return 'not scored yet';
  if (score < 20) return 'low stakes — just build it, no extra steps (certainty needed: 70%)';
  if (score < 60) return 'moderate — light checks; prove it works before saying done (certainty needed: 80%)';
  if (score < 80) return 'high — reflect before acting; a written verification contract applies (certainty needed: 85%)';
  return 'top band — every check; state the gravity plainly and verify with evidence before and after (certainty needed: 90%)';
}

module.exports = { scoreTask, writeBaseline, baselineFor, describeScore, applyConfig };

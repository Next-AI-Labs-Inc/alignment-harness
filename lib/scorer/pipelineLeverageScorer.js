/**
 * COPIED from the author's scoring server (utils/pipelineLeverageScorer.js) so
 * scoring runs locally with no server and no key. It has no dependencies.
 * Changes from the original, all marked "HARNESS CHANGE":
 *   1. The category table and impact-tier floors can be replaced by the
 *      person's own risk table (setCategoryOverrides / setImpactTierFloors).
 *      The shipped default replaces the author's product-specific
 *      'core-coaching' row with a general 'core-feature' row (75).
 *   2. The "critical mass" floor (two of three risk answers >= 8) is a dial
 *      (setCriticalMassFloor), default 80 to match what the skill always told
 *      agents. The original code used 75.
 */
/**
 * Pipeline Leverage Scorer — Auto-scoring engine for the feature pipeline
 *
 * Determines how many quality gates a feature must pass based on:
 * 1. Manual override (agent or admin sets score directly)
 * 2. Category override (payment/auth always 100, admin-only always 0)
 * 3. IX-SILA geometric mean (9-variable leverage model)
 */

const SILA_VARIABLE_NAMES = [
  'Value/Effort',
  'Pain Severity',
  'Actor Readiness',
  'Platform Readiness',
  'Loop Closure',
  'Compounding Rate',
  'AI Delegability',
  'KPI Bottleneck',
  'Reach Multiplier',
];

/**
 * Impact tier floors — when touchesUserState is true, HOW MUCH it affects users
 * determines the floor score, not a flat number.
 *
 * Tiers (by distance from user):
 *   indirect:       informs a future decision, nothing ships yet (research, analysis)
 *   config:         changes what users see via config/flags/data — no code deploy
 *   communication:  controls messages users receive (email, notification, in-app copy)
 *   revenue:        directly affects payment, churn, conversion, or subscription state
 */
let IMPACT_TIER_FLOORS = {
  indirect: 40,
  config: 65,
  communication: 85,
  revenue: 95,
};

const DEFAULT_IMPACT_TIER = 'indirect'; // fallback when touchesUserState=true but no tier specified

/**
 * Category override table. Each entry can be:
 * - A number: fixed score
 * - An object with `score` and `downstreamFloor`: legacy fallback floor when
 *   touchesUserState=true but no impactTier is provided. When impactTier IS
 *   provided, the tier floor from IMPACT_TIER_FLOORS is used instead.
 *
 * The `touchesUserState` + `impactTier` system solves the "admin page that sends
 * win-back emails to lapsed payers" problem — the admin UI is low-leverage,
 * but the downstream revenue impact on users means it needs full quality gates.
 */
// HARNESS CHANGE: 'core-coaching' (the author's product) replaced by the
// general 'core-feature' row; the whole table can be replaced at runtime.
let CATEGORY_OVERRIDES = {
  'admin-only':       { score: 0,  downstreamFloor: 50 },
  'docs-only':        { score: 0,  downstreamFloor: null },
  'internal-tooling': { score: 15, downstreamFloor: 40 },
  'cosmetic':         { score: 20, downstreamFloor: null },
  'payment':          100,
  'auth':             100,
  'payment-auth':     100,
  'core-feature':     75,
  'onboarding':       85,
};

// HARNESS CHANGE: the critical-mass floor is a dial.
let CRITICAL_MASS_FLOOR = 80;

function setCategoryOverrides(table) {
  if (table && typeof table === 'object' && Object.keys(table).length) CATEGORY_OVERRIDES = table;
}
function setImpactTierFloors(floors) {
  if (floors && typeof floors === 'object' && Object.keys(floors).length) IMPACT_TIER_FLOORS = floors;
}
function setCriticalMassFloor(n) {
  const v = Number(n);
  if (Number.isFinite(v) && v >= 0 && v <= 100) CRITICAL_MASS_FLOOR = v;
}

/**
 * Check if a feature category has a hardcoded score override.
 * @param {string} category
 * @param {boolean} touchesUserState - Does this feature manage/affect user-facing state?
 * @param {string|null} impactTier - How much it affects users: indirect|config|communication|revenue
 * @returns {{ overrideScore: number, wasElevated: boolean, elevationReason: string|null, impactTier: string|null }|null}
 */
function checkOverrides(category, touchesUserState = false, impactTier = null) {
  if (!category) return null;
  const normalized = category.toLowerCase().trim();
  if (!(normalized in CATEGORY_OVERRIDES)) return null;

  const entry = CATEGORY_OVERRIDES[normalized];

  // Simple number override (payment, auth, etc.) — always returns as-is
  if (typeof entry === 'number') {
    return { overrideScore: entry, wasElevated: false, elevationReason: null, impactTier: null };
  }

  // Object override with potential downstream elevation
  const baseScore = entry.score;

  if (touchesUserState) {
    // Use impact tier floor if provided, otherwise fall back to legacy downstreamFloor
    const resolvedTier = (impactTier && impactTier in IMPACT_TIER_FLOORS)
      ? impactTier
      : null;
    const tierFloor = resolvedTier
      ? IMPACT_TIER_FLOORS[resolvedTier]
      : entry.downstreamFloor;

    if (tierFloor && baseScore < tierFloor) {
      return {
        overrideScore: tierFloor,
        wasElevated: true,
        elevationReason: resolvedTier
          ? `${normalized} elevated from ${baseScore} to ${tierFloor} — impact tier '${resolvedTier}' (user receives ${resolvedTier === 'revenue' ? 'churn/payment-affecting' : resolvedTier === 'communication' ? 'direct messages' : resolvedTier === 'config' ? 'config-driven changes' : 'indirect effects'})`
          : `${normalized} elevated from ${baseScore} to ${tierFloor} because feature manages user-facing state (no impactTier specified — legacy fallback)`,
        impactTier: resolvedTier,
      };
    }
  }

  return { overrideScore: baseScore, wasElevated: false, elevationReason: null, impactTier: null };
}

/**
 * Compute leverage score from 9 IX-SILA variables using geometric mean.
 * @param {{ v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, v8: number, v9: number }} variables
 * @returns {{ score: number, geometricMean: number, weakestVariable: { name: string, value: number, index: number }, variables: object }}
 */
function scoreFromSila(variables) {
  const values = [
    variables.v1, variables.v2, variables.v3,
    variables.v4, variables.v5, variables.v6,
    variables.v7, variables.v8, variables.v9,
  ];

  const product = values.reduce((acc, v) => acc * v, 1);
  const geometricMean = Math.pow(product, 1 / 9);
  const score = Math.round(geometricMean * 10);

  // Find weakest variable
  let weakestIndex = 0;
  let weakestValue = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < weakestValue) {
      weakestValue = values[i];
      weakestIndex = i;
    }
  }

  return {
    score,
    geometricMean,
    weakestVariable: {
      name: SILA_VARIABLE_NAMES[weakestIndex],
      value: weakestValue,
      index: weakestIndex + 1, // 1-based (v1-v9)
    },
    variables: { ...variables },
  };
}

/**
 * @deprecated tierFromScore converts a continuous 0-100 score into a bucket label (L20/L50/L90).
 * Bucket labels discard signal — the score IS the tier. Use unifiedScore directly.
 * This function is retained only for backward compat with legacy callers; do NOT call it in new code.
 */
function tierFromScore(leverageScore) {
  return leverageScore >= 75 ? 'L90' : leverageScore >= 40 ? 'L50' : 'L20';
}

/**
 * Main entry point — determine leverage score from any available input.
 *
 * Priority: manual > max(override, sila) > override > sila
 *
 * When BOTH category and SILA are provided, uses the HIGHER score.
 * This prevents category overrides from capping high-leverage features that
 * happen to have a low-scoring category label (e.g., internal-tooling that
 * actually has massive downstream impact scoring 91 via SILA).
 *
 * @param {{ category?: string, touchesUserState?: boolean, impactTier?: string, silaVariables?: object, manualScore?: number }} params
 * @returns {{ score: number, method: string, details: object }|null}
 */
function determineLeverageScore({ category, touchesUserState, impactTier, silaVariables, manualScore } = {}) {
  // 1. Manual score takes priority — human always wins
  if (manualScore !== undefined && manualScore !== null) {
    const manualScoreNum = Number(manualScore);
    if (manualScoreNum >= 0 && manualScoreNum <= 100) {
      return {
        score: manualScoreNum,
        method: 'manual',
        details: { manualScore: manualScoreNum },
      };
    }
  }

  // 2. Compute both override and SILA if available
  let overrideResult = null;
  if (category) {
    overrideResult = checkOverrides(category, !!touchesUserState, impactTier || null);
  }

  let silaResult = null;
  if (silaVariables) {
    silaResult = scoreFromSila(silaVariables);
  }

  // 3. If both provided, use the HIGHER score (override is a floor, not a ceiling)
  if (overrideResult && silaResult) {
    const { overrideScore, wasElevated, elevationReason } = overrideResult;
    if (silaResult.score > overrideScore) {
      return {
        score: silaResult.score,
        method: 'sila-over-override',
        details: {
          ...silaResult,
          overriddenCategory: category,
          overrideWouldHaveBeen: overrideScore,
          reason: `SILA score ${silaResult.score} exceeded override ${overrideScore} for category '${category}'`,
        },
      };
    }
    return {
      score: overrideScore,
      method: 'override',
      details: { category, overrideScore, wasElevated, elevationReason },
    };
  }

  // 4. Override only
  if (overrideResult) {
    const { overrideScore, wasElevated, elevationReason } = overrideResult;
    return {
      score: overrideScore,
      method: 'override',
      details: { category, overrideScore, wasElevated, elevationReason },
    };
  }

  // 5. SILA only
  if (silaResult) {
    return {
      score: silaResult.score,
      method: 'sila',
      details: silaResult,
    };
  }

  // 6. Nothing provided
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ADAPTIVE SCORING — Unified pass consuming all signal sources
// ═══════════════════════════════════════════════════════════════════════════
//
//  The base scorer (determineLeverageScore) asks: "how important is this feature?"
//  The adaptive scorer adds: "how much care should the agent take when building it?"
//
//  Three dimensions the base scorer is blind to:
//
//  1. Agentic Compounding — does this change multiply across future agent decisions?
//     Fixing a typo = 1. Fixing the Governer scoring system = 10.
//     Establishing a new principle that agents will follow forever = 9.
//
//  2. Hallucination Propagation — if the agent gets this wrong, how far does the
//     error spread? Local file edit = 1. Writing to institutional memory = 9.
//     Changing a scoring algorithm that future agents trust = 10.
//
//  3. Existing Wins at Stake — could this break something already working?
//     New greenfield feature = 1. Refactoring a payment flow = 9.
//     Changing auth middleware used by every route = 10.
//

/**
 * Adaptive dimension definitions and scoring rubric.
 * Agents self-assess each 1-10. The rubric helps calibrate.
 */
const ADAPTIVE_DIMENSIONS = {
  agenticCompounding: {
    name: 'Agentic Compounding',
    question: 'Does this change multiply across future agent decisions?',
    rubric: {
      '1-2': 'One-off change, no future agent will reference this',
      '3-4': 'Other agents might encounter this code but won\'t change behavior',
      '5-6': 'Sets a pattern future agents will follow in this area',
      '7-8': 'Establishes a principle or changes a system agents routinely consult',
      '9-10': 'Changes how agents evaluate, decide, or reason about ALL future tasks',
    },
  },
  hallucinationPropagation: {
    name: 'Hallucination Propagation',
    question: 'If the agent hallucinates here, how far does the error spread?',
    rubric: {
      '1-2': 'Error stays in this file, caught by tests or lint',
      '3-4': 'Error could reach one user flow but is visible and fixable',
      '5-6': 'Error enters shared utility or config consumed by multiple features',
      '7-8': 'Error enters institutional memory, intent DB, or skill files — future agents trust it',
      '9-10': 'Error changes a scoring/routing algorithm — every future decision inherits the mistake',
    },
  },
  existingWinsAtStake: {
    name: 'Existing Wins at Stake',
    question: 'Could this break something that is already working and validated?',
    rubric: {
      '1-2': 'Greenfield — nothing exists to break',
      '3-4': 'Touches code near validated flows but doesn\'t modify them',
      '5-6': 'Modifies code that validated flows depend on, but with clear boundaries',
      '7-8': 'Refactors a flow with paying users or live data depending on current behavior',
      '9-10': 'Changes auth, payment, or shared middleware that every route depends on',
    },
  },
};

/**
 * Reasoning budget tiers — determines how much care an agent should take.
 *
 * @deprecated Use unifiedScore + scoreThresholds (from computeAdaptiveScore) instead.
 * Bucket labels ("minimal", "standard", "elevated", "maximum") discard signal.
 * The continuous unifiedScore (0-100) carries more information — use it directly.
 * scoreThresholds tells you exactly which score values trigger each behavior change.
 *
 * The budget governs:
 * - pipelineDepth: which governer steps to run
 * - compactionDepth: how rich a session compaction should be
 * - reflectionTrigger: whether /reflect is required before acting
 * - confidenceFloor: minimum certainty before proceeding
 */
const REASONING_BUDGETS = {
  minimal: {
    label: 'Minimal',
    pipelineDepth: 'skip',       // score 0 — just build it
    compactionDepth: 'thin',     // facts only, 1-2 sentences per section
    reflectionTrigger: false,
    confidenceFloor: 70,
  },
  standard: {
    label: 'Standard',
    pipelineDepth: 'L20',
    compactionDepth: 'standard', // normal coverage, key decisions captured
    reflectionTrigger: false,
    confidenceFloor: 80,
  },
  elevated: {
    label: 'Elevated',
    pipelineDepth: 'L50',
    compactionDepth: 'rich',     // principles extracted, decisions documented with reasoning
    reflectionTrigger: true,     // /reflect before acting
    confidenceFloor: 85,
  },
  maximum: {
    label: 'Maximum',
    pipelineDepth: 'L90',
    compactionDepth: 'deep',     // /reflect prefix, all principles, full reasoning chain, back-test references
    reflectionTrigger: true,
    confidenceFloor: 90,
  },
};

/**
 * Compute the adaptive meta-score from the three new dimensions.
 *
 * Uses geometric mean (same multiplicative philosophy as SILA) —
 * one low dimension pulls the whole score down. This prevents
 * "high compounding but zero propagation risk" from inflating.
 *
 * Returns 0-100 scale for consistency with the base scorer.
 *
 * @param {{ agenticCompounding: number, hallucinationPropagation: number, existingWinsAtStake: number }} dims
 * @returns {{ metaScore: number, weakestDimension: { name: string, value: number }, dimensions: object }}
 */
function computeMetaScore(dims) {
  const ac = Math.max(1, Math.min(10, Number(dims.agenticCompounding) || 1));
  const hp = Math.max(1, Math.min(10, Number(dims.hallucinationPropagation) || 1));
  const ew = Math.max(1, Math.min(10, Number(dims.existingWinsAtStake) || 1));

  const geoMean = Math.pow(ac * hp * ew, 1 / 3);
  let metaScore = Math.round(geoMean * 10);

  // Critical mass override — when 2+ dimensions are ≥8, the task has high
  // systemic risk regardless of the third dimension. A single moderate dimension
  // (e.g., existingWinsAtStake=5) shouldn't drag "autonomous KPI improvement
  // workflow" (ac=9, hp=8) below maximum reasoning budget.
  const highDimensionCount = [ac, hp, ew].filter(d => d >= 8).length;
  if (highDimensionCount >= 2) {
    metaScore = Math.max(metaScore, CRITICAL_MASS_FLOOR); // HARNESS CHANGE: was 75
  }

  // Find weakest
  const all = [
    { name: 'Agentic Compounding', value: ac },
    { name: 'Hallucination Propagation', value: hp },
    { name: 'Existing Wins at Stake', value: ew },
  ];
  const weakest = all.reduce((a, b) => a.value <= b.value ? a : b);

  return {
    metaScore,
    weakestDimension: weakest,
    dimensions: { agenticCompounding: ac, hallucinationPropagation: hp, existingWinsAtStake: ew },
  };
}

/**
 * Determine the reasoning budget from unified and meta scores.
 *
 * Takes the MAX of the base leverage score and the meta-score,
 * then maps to a budget tier. This ensures that EITHER high user impact
 * OR high agentic compounding triggers deeper reasoning.
 *
 * @param {number} baseScore - from determineLeverageScore (0-100)
 * @param {number} metaScore - from computeMetaScore (0-100)
 * @returns {{ budget: string, budgetDetails: object, unifiedScore: number }}
 */
function determineReasoningBudget(baseScore, metaScore) {
  const unifiedScore = Math.max(baseScore, metaScore);

  let budgetKey;
  if (unifiedScore >= 75) budgetKey = 'maximum';
  else if (unifiedScore >= 50) budgetKey = 'elevated';
  else if (unifiedScore >= 25) budgetKey = 'standard';
  else budgetKey = 'minimal';

  return {
    budget: budgetKey,
    budgetDetails: REASONING_BUDGETS[budgetKey],
    unifiedScore,
    baseScore,
    metaScore,
    method: metaScore > baseScore ? 'meta-elevated' : 'base-driven',
  };
}

/**
 * Full adaptive scoring pass — consumes base leverage + meta dimensions.
 *
 * This is the unified entry point. Call this instead of determineLeverageScore
 * when you want the full picture including reasoning budget.
 *
 * @param {object} params
 * @param {string} [params.category] - Category override
 * @param {boolean} [params.touchesUserState] - Does output affect users?
 * @param {string} [params.impactTier] - indirect|config|communication|revenue
 * @param {object} [params.silaVariables] - IX-SILA v1-v9
 * @param {number} [params.manualScore] - Human override
 * @param {number} [params.agenticCompounding] - 1-10
 * @param {number} [params.hallucinationPropagation] - 1-10
 * @param {number} [params.existingWinsAtStake] - 1-10
 * @returns {object} Full scoring result with reasoning budget
 */
function computeAdaptiveScore(params = {}) {
  const {
    agenticCompounding,
    hallucinationPropagation,
    existingWinsAtStake,
    ...baseParams
  } = params;

  // 1. Base leverage score (existing system)
  const baseResult = determineLeverageScore(baseParams);
  const baseScore = baseResult ? baseResult.score : 0;

  // 2. Meta-score from new dimensions (if any provided)
  const hasMetaDimensions = agenticCompounding || hallucinationPropagation || existingWinsAtStake;
  let metaResult = null;
  if (hasMetaDimensions) {
    metaResult = computeMetaScore({
      agenticCompounding: agenticCompounding || 1,
      hallucinationPropagation: hallucinationPropagation || 1,
      existingWinsAtStake: existingWinsAtStake || 1,
    });
  }
  const metaScore = metaResult ? metaResult.metaScore : 0;

  // 3. Determine reasoning budget from unified score
  const budgetResult = determineReasoningBudget(baseScore, metaScore);

  // Human-readable field names — designed to be embedded directly in agent
  // memory/context so an agent always knows what the numbers mean without
  // needing to look up cryptic field names.
  const acVal = metaResult ? metaResult.dimensions.agenticCompounding : 0;
  const hpVal = metaResult ? metaResult.dimensions.hallucinationPropagation : 0;
  const ewVal = metaResult ? metaResult.dimensions.existingWinsAtStake : 0;

  const humanReadable = {
    overallReasoningDepthRequired: budgetResult.unifiedScore,
    howMuchThisMattersToUsersAndBusiness: baseScore,
    howDangerousForAgentToGetThisWrong: metaResult ? metaResult.metaScore : 0,
    whatDroveTheScore: budgetResult.method === 'meta-elevated'
      ? 'agent-risk-exceeded-business-importance'
      : 'business-importance-exceeded-agent-risk',
    whenAgentErrorsCompoundAcrossFutureDecisions: acVal,
    whenAgentHallucinatesAndTheErrorSpreadsToUsers: hpVal,
    whenWorkingProductionCodeCouldBreak: ewVal,
    dimensionMostLikelyToBeUnderEstimated: metaResult ? metaResult.weakestDimension.name : null,
    lowestDimensionScore: metaResult ? metaResult.weakestDimension.value : 0,
    wasScoreElevatedBecauseItTouchesUserState: baseResult ? !!baseResult.details?.wasElevated : false,
    impactTierIfUserFacing: baseResult ? (baseResult.details?.impactTier || null) : null,
    twoOrMoreCriticalDimensionsTriggered: metaResult ? [acVal, hpVal, ewVal].filter(d => d >= 8).length >= 2 : false,
  };

  const unifiedScoreVal = budgetResult.unifiedScore;

  // Continuous score thresholds — use these directly instead of the deprecated bucket label.
  // Every behavioral boundary is expressed as an exact score number so consumers never need
  // to re-derive it from a label.
  const scoreThresholds = {
    skipPipelineBelow: 20,          // unifiedScore < 20  → skip governer pipeline entirely
    reflectAbove: 60,               // unifiedScore >= 60 → /reflect required before acting
    fullValidationAbove: 80,        // unifiedScore >= 80 → all quality gates must pass
    confidenceFloor: unifiedScoreVal < 20 ? 70
      : unifiedScoreVal < 60 ? 80
      : unifiedScoreVal < 80 ? 85
      : 90,                         // minimum agent certainty (%) before proceeding
  };

  return {
    ...budgetResult,
    scoreThresholds,
    base: baseResult,
    meta: metaResult,
    humanReadable,
  };
}

module.exports = {
  setCategoryOverrides,
  setImpactTierFloors,
  setCriticalMassFloor,
  checkOverrides,
  scoreFromSila,
  determineLeverageScore,
  computeMetaScore,
  computeAdaptiveScore,
  determineReasoningBudget,
  SILA_VARIABLE_NAMES,
  get CATEGORY_OVERRIDES() { return CATEGORY_OVERRIDES; },
  get IMPACT_TIER_FLOORS() { return IMPACT_TIER_FLOORS; },
  ADAPTIVE_DIMENSIONS,
  REASONING_BUDGETS,
};

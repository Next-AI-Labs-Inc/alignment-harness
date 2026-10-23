'use strict';
// Orchestrates every source, scores and merges the results, and returns a plain
// object the caller (server.js or cli.js) formats for display. Fails open at every
// step: a broken source contributes nothing rather than crashing the search, and
// the whole call is capped at a hard deadline so nothing can hang.

const config = require('./config');
const ranking = require('./ranking');
const { withDeadline } = require('./util');
const { searchDocs } = require('./sources/docs');
const { searchCommits } = require('./sources/commits');
const { searchSkills } = require('./sources/skills');
const { searchSessions } = require('./sources/sessions');
const { searchRecords } = require('./sources/records');
const { semanticScores } = require('./vector');

const SEARCH_DEADLINE_MS = 4000;

// Starting default weights. These are NOT tuned against any real usage history yet —
// there isn't any on a fresh install. They encode one deliberately modest prior:
// a document someone wrote and a past decision (session/record) outrank a skill
// description or a commit subject line, because the former are usually closer to a
// direct answer. Recalibrate once you have real query history to check them against.
const STARTING_DEFAULT_WEIGHTS = {
  doc: 1.0,
  record: 1.0,
  session: 0.9,
  skill: 0.6,
  commit: 0.7,
};

const TIMELESS_SOURCES = new Set(['skill']); // reference knowledge; doesn't go stale by sitting still

const VALID_SOURCES = ['doc', 'commit', 'skill', 'session', 'record'];

async function gather(query, sources, deadlineAt) {
  const repos = config.loadRepos();
  const pluginRoot = config.getPluginRoot();
  const sessionsDir = config.getSessionsDir();
  const recordsDir = config.getRecordsDir();

  const jobs = [];
  if (sources.includes('doc')) jobs.push(withDeadline(searchDocs(query, repos), SEARCH_DEADLINE_MS));
  if (sources.includes('commit')) jobs.push(withDeadline(searchCommits(query, repos), SEARCH_DEADLINE_MS));
  if (sources.includes('skill')) jobs.push(withDeadline(searchSkills(query, pluginRoot), SEARCH_DEADLINE_MS));
  if (sources.includes('session')) jobs.push(withDeadline(searchSessions(query, sessionsDir, deadlineAt), SEARCH_DEADLINE_MS));
  if (sources.includes('record')) jobs.push(withDeadline(searchRecords(query, recordsDir), SEARCH_DEADLINE_MS));

  const results = await Promise.all(jobs);
  return results.flat();
}

async function agentFind(query, options = {}) {
  const startedAt = Date.now();
  const deadlineAt = startedAt + SEARCH_DEADLINE_MS;
  const limit = Math.max(1, Math.min(50, Number(options.limit) || 8));
  const requestedSources = Array.isArray(options.sources) && options.sources.length
    ? options.sources.filter((s) => VALID_SOURCES.includes(s))
    : VALID_SOURCES;

  if (!query || !String(query).trim()) {
    return { query: query || '', count: 0, totalCandidates: 0, sourceCounts: {}, results: [], mode: 'keyword', empty: true, emptyReason: 'empty-query' };
  }

  let allEntries = [];
  try {
    allEntries = await withDeadline(gather(query, requestedSources, deadlineAt), SEARCH_DEADLINE_MS);
  } catch (_) {
    allEntries = [];
  }

  const totalCandidates = allEntries.length;
  const sourceCounts = {};
  for (const e of allEntries) sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;

  const idfIndex = ranking.buildIdfIndex(allEntries);

  // Keyword score for every candidate.
  const keywordScored = allEntries.map((e, i) => {
    const weight = STARTING_DEFAULT_WEIGHTS[e.source] ?? 0.5;
    const relevance = ranking.keywordRelevance(query, e.searchText, idfIndex) + ranking.relevanceTiebreak(query, e.title, e.searchText);
    const recency = TIMELESS_SOURCES.has(e.source) ? 1.0 : ranking.recencyScore(e.timestamp);
    return { i, entry: e, relevance, recency, keywordComposite: relevance * weight * recency };
  }).filter((r) => r.relevance > 0.15);

  // Optional semantic pass over the (already keyword-narrowed, capped) candidate set.
  let mode = 'keyword';
  let semantic = null;
  const candidatesForVector = keywordScored.slice(0, 200).map((r) => r.entry);
  if (candidatesForVector.length && Date.now() < deadlineAt) {
    try {
      semantic = await withDeadline(
        semanticScores(config.getDataDir(), query, candidatesForVector, deadlineAt),
        Math.max(500, deadlineAt - Date.now()),
        null
      );
    } catch (_) {
      semantic = null;
    }
  }
  if (semantic) mode = 'keyword+vector';

  const scored = keywordScored.map((r, idx) => {
    const weight = STARTING_DEFAULT_WEIGHTS[r.entry.source] ?? 0.5;
    let composite = r.keywordComposite;
    if (semantic && semantic.has(idx)) {
      const cos = semantic.get(idx);
      const semanticRelevance = cos <= 0.3 ? (cos / 0.3) * 0.6 : 0.6 + 0.4 * Math.min(1, (cos - 0.3) / 0.3);
      // Blend: take the better of the two signals rather than averaging, so a strong
      // keyword hit is never dragged down by a mediocre embedding (and vice versa).
      const blendedRelevance = Math.max(r.relevance, semanticRelevance);
      composite = blendedRelevance * weight * r.recency;
    }
    return { ...r.entry, score: composite };
  });

  scored.sort((a, b) => b.score - a.score);

  // Dedupe by normalized title within the same source.
  const seen = new Set();
  const deduped = [];
  for (const r of scored) {
    const key = `${r.source}:${(r.title || '').toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  const finalResults = deduped.slice(0, limit);
  const nearlyEmpty = totalCandidates < 3;

  return {
    query,
    count: finalResults.length,
    totalCandidates,
    sourceCounts,
    results: finalResults,
    mode,
    empty: finalResults.length === 0,
    nearlyEmpty,
    elapsedMs: Date.now() - startedAt,
  };
}

module.exports = { agentFind, VALID_SOURCES, STARTING_DEFAULT_WEIGHTS };

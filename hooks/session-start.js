'use strict';
// SessionStart — gets the harness ready for this session.
//   1. Creates the data folder and your editable switches file (first run only).
//   2. Picks this session's coherence-check wording (the A/B variant picker).
//      The coherence gate reads this choice; without it, the gate falls back to
//      the standard wording.
//   3. Tells the agent, briefly, that the harness is on, how its skills are
//      named, where the harness command is, and whether setup is unfinished.

const fs = require('fs');
const path = require('path');
const core = require('../lib/core');
const h = require('./common');

h.run('session-start', (input) => {
  core.seedUserFiles();
  const { switches, problems } = core.loadSwitches();
  const sid = h.sessionIdOf(input);
  h.writeLastSession(input);

  // ── Coherence-check variant for this session ─────────────────────────────
  const cg = switches.coherenceGate || {};
  let variant = cg.variant || 'control';
  if (variant === 'ab-test') variant = Math.random() < 0.5 ? 'control' : 'per-item-96-escalation';
  if (!['control', 'per-item-96-escalation'].includes(variant)) variant = 'control';
  try {
    fs.mkdirSync(core.P.coherence, { recursive: true });
    fs.writeFileSync(path.join(core.P.coherence, `variant-${core.safeId(sid)}`), variant);
  } catch (_) { /* gate falls back to control */ }
  core.log('SessionStart', { sessionId: sid, coherenceVariant: variant, abTest: cg.variant === 'ab-test', source: input.source || null });

  // ── What the agent needs to know ─────────────────────────────────────────
  const setup = core.readJson(core.P.setup, null);
  const risk = core.loadRiskTable();
  const lines = [];
  lines.push('<alignment-harness>');
  lines.push('The alignment harness is on for this session. It asks you to (1) state your understanding before changing anything after the person speaks, (2) score each task with the governer before editing, and (3) prove work before saying it is done.');
  lines.push('Its skills are namespaced: when a harness message says /governer, /reflect, /verify, /ask, /calibrate, etc., invoke them as /alignment-harness:<name> (for example /alignment-harness:governer).');
  if ((switches.intentSearchGate || {}).strength !== 'off') {
    lines.push('Institutional memory search is active: before searching code, search what is already known with the agent_find tool (or `node <plugin>/mcp/agent-find/cli.js "query"`). The first code search of the session waits until you have.');
  }
  lines.push(`Harness command (score, status, verification contract, doctor): alignment-harness <command>  — if that name is not found, use: ${core.cliCommand()} <command>`);
  if (cg.variant === 'ab-test' && variant !== 'control') {
    lines.push('For this session the coherence check uses the stricter per-item certainty wording. [key: per-item-96-escalation]');
  }
  if (!risk.calibrated) {
    lines.push('Scores are UNCALIBRATED until the person confirms their own risk table (/alignment-harness:harness-setup). Keep scoring every task anyway, and say "uncalibrated" when you report a score.');
  }
  if (!setup || !setup.completedAt) {
    lines.push('First-run setup has not been done. The harness works without it; setup adds the person\'s own risk table, memory search and optional oracles. Introduce the harness to the person once, briefly, when it fits, and offer /alignment-harness:harness (status, setup, turning pieces on or off) — do not interrupt their work for it.');
  }
  for (const p of problems) lines.push(`Harness config problem (the harness is using defaults): ${p}`);
  lines.push('</alignment-harness>');

  // ── After compaction: put the person's own words back in front of the agent
  const u = switches.understanding || {};
  if (input.source === 'compact' && u.rehydrateAfterCompaction !== false) {
    try {
      const file = path.join(core.P.verbatim, `${core.safeId(sid)}.jsonl`);
      const msgs = fs.readFileSync(file, 'utf8').trim().split('\n')
        .map((l) => { try { return JSON.parse(l); } catch (_) { return null; } })
        .filter(Boolean);
      let budget = 3500;
      const kept = [];
      for (let i = msgs.length - 1; i >= 0 && budget > 0; i--) {
        const t = `[${msgs[i].timestamp}] ${msgs[i].content}`;
        kept.unshift(t.length > budget ? `${t.slice(0, budget)} …` : t);
        budget -= t.length;
      }
      if (kept.length) {
        core.log('VerbatimRehydrated', { sessionId: sid, messages: kept.length, of: msgs.length });
        lines.push(`<verbatim-messages-after-compaction count="${kept.length}" of="${msgs.length}">
The conversation was just compacted. A summary loses nuance, so here are the person's own messages from this session, word for word, oldest first${kept.length < msgs.length ? ` (the most recent ${kept.length}; all of them are in ${file})` : ''}.
Read them end to end before continuing. Then, in your next reply, state in a few sentences what the person is trying to achieve and anything in their own words that the summary dropped or softened.

${kept.join('\n\n')}
</verbatim-messages-after-compaction>`);
      }
    } catch (_) { /* nothing captured yet */ }
    try {
      const rec = require('../lib/records').getCompaction(sid);
      if (rec && !rec.auto) {
        lines.push(`<session-compaction id="${rec.id}">\nThe record you wrote for this session before compaction:\n${JSON.stringify({ title: rec.title, intent: rec.intent, scopeDeclaration: rec.scopeDeclaration, incompleteItems: rec.incompleteItems, compactedSession: rec.compactedSession }, null, 2).slice(0, 1500)}\n</session-compaction>`);
      } else {
        lines.push('There is no record of this session written by you yet. Write one now with /compact-agentic-session (it saves with `alignment-harness compaction put`), so the next compaction or session can pick up exactly where this one is.');
      }
    } catch (_) { /* ignore */ }
  }
  // Until setup is done, also show the person (not just the agent) what the harness is and what to type.
  if (!setup || !setup.completedAt) {
    h.contextOutWithMessage(`${lines.join('\n')}\n`, 'session-start',
      'Alignment Harness is on. Type /alignment-harness:harness for status, setup and switches. To see it work, ask for any change: before it edits anything, the agent states what it understood and scores how much could go wrong for a real person, and it has to show proof before it calls the work done.',
      'SessionStart');
  } else {
    h.contextOut(`${lines.join('\n')}\n`, 'session-start');
  }
});

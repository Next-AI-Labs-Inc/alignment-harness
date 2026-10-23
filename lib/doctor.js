'use strict';
// `alignment-harness doctor` — for each piece: is it on, is it set up, and is
// there evidence it is working (from the local telemetry log)?

const fs = require('fs');
const core = require('./core');

function recentEvents(limit) {
  try {
    const lines = fs.readFileSync(core.P.telemetry, 'utf8').trim().split('\n').slice(-(limit || 5000));
    return lines.map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  } catch (_) { return []; }
}

function count(events, names) {
  const set = new Set(names);
  return events.filter((e) => set.has(e.event)).length;
}

// What a gate is doing, in the words a person would use. Missing or odd values read as the built-in default.
function gateWords(on, strength) {
  if (on === false || strength === 'off') return 'off';
  return strength === 'remind' ? 'on, reminding only' : 'on, blocking';
}

function run() {
  const checks = [];
  const add = (piece, status, detail, fix) => checks.push({ piece, status, detail, fix: fix || null });
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  add('node', nodeMajor >= 18 ? 'ok' : 'problem', `Node ${process.versions.node}`, nodeMajor >= 18 ? null : 'Install Node 18 or newer.');

  // Before the first session the harness has no data folder yet, and doctor must not make one: it would
  // leave empty folders in the system temp folder and then report that temp path as the data folder.
  if (!core.DATA_BOUND) {
    add('data folder', 'setup-needed', 'not created yet: the harness creates its data folder (under ~/.claude/plugins/data) the first time a Claude Code session starts with the plugin enabled. Nothing is written until then.');
  } else {
    try {
      core.ensureDirs();
      const probe = `${core.P.data}/.doctor-probe`;
      fs.writeFileSync(probe, 'ok'); fs.unlinkSync(probe);
      add('data folder', 'ok', core.P.data);
    } catch (e) { add('data folder', 'problem', `${core.P.data} not writable: ${e.message}`, 'Check permissions on ~/.claude/plugins/data.'); }
  }

  const { switches, problems, usingBuiltInDefaults } = core.loadSwitches();
  // Any value that is missing or damaged reads as the built-in default, never as "undefined".
  const dv = core.BUILT_IN_SWITCHES;
  const section = (name) => ({ ...(dv[name] || {}), ...((switches[name] && typeof switches[name] === 'object') ? switches[name] : {}) });
  const cg = section('coherenceGate');
  const gv = section('governer');
  const eg = section('evidenceGate');
  const userFile = fs.existsSync(core.P.switchesUser) ? core.P.switchesUser : 'not created yet (created on the next session start; defaults apply)';
  if (usingBuiltInDefaults) {
    add('switches file', 'problem',
      `${userFile}. The harness's own default switches file is missing, so it is using its built-in defaults: coherence check ${gateWords(cg.enabled, cg.strength)}; risk score ${gateWords(gv.enabled, gv.gateStrength)}; proof before "done" ${gateWords(eg.enabled, eg.strength)}.`,
      'Nothing is broken: the harness still works as normal. To put the missing file back, reinstall or update the plugin (`claude plugin update alignment-harness`). Your own switches file, if you have one, still wins over the defaults.');
  } else {
    add('switches file', problems.length ? 'problem' : 'ok', userFile, problems.length ? problems.join('; ') : null);
  }

  const ev = recentEvents();
  const sessions = count(ev, ['SessionStart']);
  add('hooks running', sessions ? 'ok' : 'unknown', sessions ? `${sessions} session starts recorded` : 'no session start recorded yet',
    sessions ? null : 'Start a new Claude Code session with the plugin enabled; if this stays empty, run `claude plugin list` to check it is enabled.');

  if (cg.enabled === false || cg.strength === 'off') add('coherence gate', 'off', 'turned off in switches');
  else {
    const armed = count(ev, ['CoherenceGateArmed']);
    const cleared = count(ev, ['CoherenceGateAttested', 'CoherenceGateClearedFromTranscript']);
    const blocked = count(ev, ['CoherenceGateBlocked']);
    const down = count(ev, ['CoherenceGateDowngraded']);
    add('coherence gate', armed ? 'ok' : 'unknown', `${cg.strength} · variant ${cg.variant} · armed ${armed}×, cleared ${cleared}×, blocked ${blocked}×, stepped back ${down}×`,
      armed ? (down > cleared ? 'It steps back more often than agents attest — agents may not be seeing the attest instruction.' : null) : 'Send a message in a session to arm it.');
  }

  const risk = core.loadRiskTable();
  if (gv.enabled === false) add('governer', 'off', 'turned off in switches');
  else {
    const scored = ev.filter((e) => e.event === 'GovernerScored');
    const distinct = new Set(scored.map((e) => e.score));
    add('governer', scored.length ? 'ok' : 'unknown',
      `gate ${gv.gateStrength} · ${scored.length} scores recorded, ${distinct.size} distinct values${scored.length ? ` (${[...distinct].slice(0, 12).join(', ')})` : ''}`,
      scored.length && distinct.size === 1 && scored.length > 5 ? 'Every score is the same number — scores should vary with the task. Check that /governer is answering the risk questions per task.' : null);
    add('risk table', risk.calibrated ? 'ok' : 'setup-needed', risk.calibrated ? 'confirmed by you' : (risk.source === 'missing' ? 'the harness\'s shipped risk table is missing, so every score is marked uncalibrated' : `using the ${risk.source} table — scores are marked uncalibrated`),
      risk.calibrated ? null : 'Run /alignment-harness:harness-setup to build and confirm your own risk table.');
    const pred = gv.predictRequiredSkills || {};
    add('skill prediction', pred.enabled === false ? 'off' : (pred.oracleCommand ? 'ok' : 'setup-needed'),
      pred.oracleCommand ? 'oracle command configured' : 'no skill-history oracle configured; risk scoring skips this step and says so',
      pred.oracleCommand ? null : 'Optional: /alignment-harness:harness-setup can set up a notebook of your skill history.');
  }

  if (eg.enabled === false || eg.strength === 'off') add('evidence gate', 'off', 'turned off in switches');
  else {
    const blocked = count(ev, ['EvidenceGateBlocked']);
    const passed = count(ev, ['EvidenceGatePass']);
    add('evidence gate', blocked + passed ? 'ok' : 'unknown', `${eg.strength} · checked ${blocked + passed} finishes, sent back ${blocked}×`);
  }

  const u = switches.understanding || {};
  add('memory search', u.memorySearchCommand ? 'ok' : 'setup-needed', u.memorySearchCommand ? 'configured' : 'not configured (optional)',
    u.memorySearchCommand ? null : 'Optional: /alignment-harness:harness-setup can connect a search over your notes and past sessions.');

  const errors = ev.filter((e) => e.event === 'HookError').slice(-3);
  if (errors.length) add('hook errors', 'problem', errors.map((e) => `${e.hook}: ${e.error}`).join(' | '), 'The harness let work through (fail-open). Report these if they repeat.');

  try {
    const c = require('./conflicts').run(process.cwd());
    const hooks = c.filter((x) => x.kind === 'hook');
    add('duplicates of your own', hooks.length ? 'problem' : 'ok', hooks.length ? hooks.map((x) => `${x.piece} (${x.what})`).join('; ') : 'none of your own hooks duplicate a harness piece',
      hooks.length ? 'Both will run. Run `alignment-harness conflicts` to see how to keep one.' : null);
  } catch (_) { /* ignore */ }

  const setup = core.readJson(core.P.setup, null);
  add('first-run setup', setup && setup.completedAt ? 'ok' : 'setup-needed', setup && setup.completedAt ? `completed ${setup.completedAt}` : 'not run yet (the harness works without it)',
    setup && setup.completedAt ? null : 'Run /alignment-harness:harness-setup.');
  return { dataDir: core.P.data, dataBound: core.DATA_BOUND, checks };
}

// What the person reads. The report's own piece names (used by --json and the settings page) stay.
const SHOWN_AS = { governer: 'risk score (edits wait for one)' };

function format(report) {
  const icon = { ok: '[ok]', off: '[off]', unknown: '[--]', 'setup-needed': '[setup]', problem: '[!!]' };
  const lines = [`alignment-harness doctor — data folder: ${report.dataBound === false ? 'not created yet (it is created at the first Claude Code session)' : report.dataDir}`];
  for (const c of report.checks) {
    lines.push(`${icon[c.status] || '[?]'} ${SHOWN_AS[c.piece] || c.piece}: ${c.detail}`);
    if (c.fix) lines.push(`      → ${c.fix}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = { run, format };

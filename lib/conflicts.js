'use strict';
// Finds hooks and skills the person ALREADY has that do the same job as a
// harness piece, so a check never fires twice. Read-only: it reports, the
// person decides which to keep (switch the harness piece off, or remove theirs).

const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('./core');

const PIECES = [
  { piece: 'coherence gate', switch: 'coherenceGate.enabled', re: /coherence|understanding[-_]?gate/i },
  { piece: 'governer gate', switch: 'governer.gateStrength', re: /governe?r|leverage[-_]?score|adaptive[-_]?score/i },
  { piece: 'evidence gate', switch: 'evidenceGate.enabled', re: /evidence[-_]?gate|verification[-_]?before|verify[-_]?before[-_]?stop/i },
  { piece: 'turn-end hand-back', switch: 'turnEnd.enabled', re: /on[-_]?turn[-_]?end|complete[-_]?agentic[-_]?task/i },
  { piece: 'intent-search gate', switch: 'intentSearchGate.strength', re: /intent[-_]?search|agent[-_]?find/i },
  { piece: 'subagent alignment', switch: 'subagents.injectAlignmentAtStart', re: /subagent[-_]?start/i },
  { piece: 'session-end persistence', switch: 'sessionEnd.autoCompaction', re: /session[-_]?end[-_]?persist|auto[-_]?compaction/i },
];

function settingsFiles(cwd) {
  const home = core.configHome();
  const files = [path.join(home, 'settings.json'), path.join(home, 'settings.local.json')];
  let dir = cwd || process.cwd();
  for (let i = 0; i < 6 && dir && dir !== path.dirname(dir); i++) {
    files.push(path.join(dir, '.claude', 'settings.json'), path.join(dir, '.claude', 'settings.local.json'));
    dir = path.dirname(dir);
  }
  return [...new Set(files)].filter((f) => fs.existsSync(f));
}

function hookCommands(file) {
  const outp = [];
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [event, groups] of Object.entries(j.hooks || {})) {
      for (const g of groups || []) for (const hk of (g.hooks || [])) if (hk && hk.command) outp.push({ event, command: String(hk.command) });
    }
  } catch (_) { /* unreadable settings: nothing to report */ }
  return outp;
}

function run(cwd) {
  const found = [];
  for (const f of settingsFiles(cwd)) {
    for (const hk of hookCommands(f)) {
      if (hk.command.includes('CLAUDE_PLUGIN_ROOT') || hk.command.includes('alignment-harness')) continue;
      for (const p of PIECES) {
        if (p.re.test(hk.command)) found.push({ piece: p.piece, switch: p.switch, kind: 'hook', where: f.replace(os.homedir(), '~'), what: `${hk.event}: ${path.basename(hk.command.split(' ').pop().replace(/["']/g, ''))}` });
      }
    }
  }
  const skillDirs = [path.join(core.configHome(), 'skills'), path.join(cwd || process.cwd(), '.claude', 'skills')];
  const shipped = new Set(fs.readdirSync(path.join(core.PLUGIN_ROOT, 'skills')));
  for (const d of skillDirs) {
    let names = [];
    try { names = fs.readdirSync(d); } catch (_) { continue; }
    const same = names.filter((n) => shipped.has(n));
    if (same.length) found.push({ piece: 'skills', kind: 'skill', where: d.replace(os.homedir(), '~'), what: `${same.length} skills with the same name as harness skills (yours keep their name; the harness's are /alignment-harness:<name>): ${same.slice(0, 12).join(', ')}${same.length > 12 ? ', …' : ''}` });
  }
  return found;
}

function format(found) {
  if (!found.length) return 'No existing hooks or skills found that duplicate a harness piece.\n';
  const lines = ['These already exist in your setup and look like they do the same job as a harness piece. Both will run unless one is turned off:'];
  for (const f of found) {
    lines.push(`- ${f.piece}: your ${f.kind} ${f.what}  (${f.where})${f.switch ? `\n    to keep yours and turn the harness's off: alignment-harness switch ${f.switch} off` : ''}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = { run, format, PIECES };

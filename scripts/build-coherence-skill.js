#!/usr/bin/env node
'use strict';
// The coherence ritual has ONE source text: prompts/coherence-ritual.txt.
// The UserPromptSubmit hook injects it; this script writes the same text into
// the /coherence-check skill, so the two can never drift apart.
//   node scripts/build-coherence-skill.js          write the skill
//   node scripts/build-coherence-skill.js --check  exit 1 if they differ
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const ritual = fs.readFileSync(path.join(root, 'prompts', 'coherence-ritual.txt'), 'utf8').trim();
const skillPath = path.join(root, 'skills', 'coherence-check', 'SKILL.md');
const skill = `---
name: coherence-check
description: "Per-message alignment ritual. Run at the top of every reply to confirm intent alignment with the user before acting. Prints COHERENCE_CHECK header, surfaces intent, calibrates communication style, tracks pending scope, and determines whether to run /governer."
triggers:
  - "/coherence-check"
  - "coherence check"
---

<!-- GENERATED from prompts/coherence-ritual.txt by scripts/build-coherence-skill.js. Edit the prompt file, not this one. -->

${ritual}

## How this is enforced, and how to turn it down

- On every real message from the person, the harness arms a gate. Tools that change things wait until you have printed this check and attested with the \`attest\` command the harness gives you. Reading, searching and skills never wait.
- After three blocks on one message the gate steps back to a reminder, so nobody is trapped.
- Switches (\`alignment-harness config path\`): \`coherenceGate.enabled\`, \`strength\` (block / remind / off), \`maxBlocksPerMessage\`, \`variant\` (control / per-item-96-escalation / ab-test).
- Is it working? \`alignment-harness doctor\` shows how often it armed, was attested, blocked, or stepped back.
`;
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf8') : '';
  if (cur !== skill) { console.log('coherence-check skill is OUT OF SYNC with prompts/coherence-ritual.txt — run scripts/build-coherence-skill.js'); process.exit(1); }
  console.log('coherence-check skill matches prompts/coherence-ritual.txt');
  process.exit(0);
}
fs.mkdirSync(path.dirname(skillPath), { recursive: true });
fs.writeFileSync(skillPath, skill);
console.log(`wrote ${path.relative(root, skillPath)}`);

# Skill test records

Every shipped skill gets a record here saying whether it looked like it did its job for a brand-new user, and whether its setup path does the setup work itself (see `../audits/agent-does-the-setup-work.md`). Records are written by a Sonnet agent that runs the skill in the sealed sandbox (`../skill-test-run.sh`) as "Dana", a new user with none of the author's data, then reads the transcript and the skill file. Transcripts stay outside the plugin, in `~/.cache/alignment-harness/skill-runs`.

A person can confirm a record by changing `human-tested: no` to `human-tested: <name>, <date>` in its frontmatter. 0 of 193 are human-tested so far.

## Totals

Shipped skills: 193. Records: 193. No record yet: 0.

| Did its job for a new user | Skills |
|---|---|
| broken | 16 |
| fails-silently | 0 |
| needs-setup-no-offer | 38 |
| could-not-run | 0 |
| asks-to-configure | 10 |
| works | 129 |

| Setup path (agent does the work?) | Skills |
|---|---|
| dead-end | 10 |
| asks-for-material | 2 |
| mixed | 101 |
| unavoidable-ask | 2 |
| delegates | 30 |
| no-setup-path | 48 |

## Every skill, calibration needs first

| Skill | Did its job | Setup path | Fix proposed | Tested | Human-tested |
|---|---|---|---|---|---|
| [align](align.md) | broken | mixed | yes | 2026-09-30 | no |
| [calibrate](calibrate.md) | broken | mixed | yes | 2026-09-30 | no |
| [decompose](decompose.md) | broken | mixed | yes | 2026-09-30 | no |
| [incomplete](incomplete.md) | broken | mixed | yes | 2026-09-30 | no |
| [on-turn-end](on-turn-end.md) | broken | mixed | yes | 2026-09-30 | no |
| [orchestrator](orchestrator.md) | broken | mixed | yes | 2026-09-30 | no |
| [pipeline-scope-guardian](pipeline-scope-guardian.md) | broken | mixed | yes | 2026-09-30 | no |
| [superpowers-writing-plans-v2](superpowers-writing-plans-v2.md) | broken | mixed | yes | 2026-09-30 | no |
| [update-the-founder](update-the-founder.md) | broken | mixed | yes | 2026-09-30 | no |
| [agentic-init](agentic-init.md) | broken | delegates | yes | 2026-09-30 | no |
| [until-proven-done](until-proven-done.md) | broken | delegates | — | 2026-09-30 | no |
| [close](close.md) | broken | no-setup-path | yes | 2026-09-30 | no |
| [communicate-what-you-finished](communicate-what-you-finished.md) | broken | no-setup-path | — | 2026-09-30 | no |
| [complete-agentic-task](complete-agentic-task.md) | broken | no-setup-path | — | 2026-09-30 | no |
| [declare-scope](declare-scope.md) | broken | no-setup-path | yes | 2026-09-30 | no |
| [init](init.md) | broken | no-setup-path | — | 2026-09-30 | no |
| [agentic-find-how-to-optimize-monthly-maintenence-only](agentic-find-how-to-optimize-monthly-maintenence-only.md) | needs-setup-no-offer | dead-end | yes | 2026-09-30 | no |
| [gate](gate.md) | needs-setup-no-offer | dead-end | yes | 2026-09-30 | no |
| [predict-next-action2](predict-next-action2.md) | needs-setup-no-offer | dead-end | yes | 2026-09-30 | no |
| [resolve-proposals](resolve-proposals.md) | needs-setup-no-offer | dead-end | yes | 2026-09-30 | no |
| [ux-failure-decomposition](ux-failure-decomposition.md) | needs-setup-no-offer | dead-end | yes | 2026-09-30 | no |
| [workflow-extract-from-session](workflow-extract-from-session.md) | needs-setup-no-offer | dead-end | yes | 2026-09-30 | no |
| [deploy-alignment-guardian](deploy-alignment-guardian.md) | needs-setup-no-offer | asks-for-material | yes | 2026-09-30 | no |
| [writing-aligned-user-facing-words](writing-aligned-user-facing-words.md) | needs-setup-no-offer | asks-for-material | yes | 2026-09-30 | no |
| [agent-ux-verification](agent-ux-verification.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [agentic-actionable-tasks](agentic-actionable-tasks.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [agentic-alignment-optimization](agentic-alignment-optimization.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [agentic-session-compactions](agentic-session-compactions.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [alignment-doctor](alignment-doctor.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [devtools-site-testing](devtools-site-testing.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [extract-completions-for-log](extract-completions-for-log.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [feature-completion-ux-test](feature-completion-ux-test.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [founder-watchable-canonical](founder-watchable-canonical.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [governer2](governer2.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [how-to-create-or-update-skill-files](how-to-create-or-update-skill-files.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [how-to-create-or-update-skill-files-2](how-to-create-or-update-skill-files-2.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [incomplete2](incomplete2.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [infuse](infuse.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [nested-intent](nested-intent.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [oracles](oracles.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [pipeline-consumption-handoff](pipeline-consumption-handoff.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [pipeline-ux-verify](pipeline-ux-verify.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [playwright-validator](playwright-validator.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [predict-required-skills](predict-required-skills.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [proof-its-fixed](proof-its-fixed.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [review-proposal-greenlight](review-proposal-greenlight.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [seed-company](seed-company.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [unify-obsidian-vaults](unify-obsidian-vaults.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [validate-against-live-data](validate-against-live-data.md) | needs-setup-no-offer | mixed | yes | 2026-09-30 | no |
| [consume](consume.md) | needs-setup-no-offer | delegates | — | 2026-09-30 | no |
| [jonathan-check2](jonathan-check2.md) | needs-setup-no-offer | delegates | — | 2026-09-30 | no |
| [jonathan-check3](jonathan-check3.md) | needs-setup-no-offer | delegates | — | 2026-09-30 | no |
| [compact-agentic-session](compact-agentic-session.md) | needs-setup-no-offer | no-setup-path | — | 2026-09-30 | no |
| [info](info.md) | needs-setup-no-offer | no-setup-path | yes | 2026-09-30 | no |
| [skill-extractor](skill-extractor.md) | asks-to-configure | dead-end | yes | 2026-09-30 | no |
| [agentic-ux-verification](agentic-ux-verification.md) | asks-to-configure | mixed | yes | 2026-09-30 | no |
| [founder-voice-email-writing](founder-voice-email-writing.md) | asks-to-configure | mixed | yes | 2026-09-30 | no |
| [how-to-talk-like-the-founder](how-to-talk-like-the-founder.md) | asks-to-configure | mixed | yes | 2026-09-30 | no |
| [instinct-harvest](instinct-harvest.md) | asks-to-configure | mixed | yes | 2026-09-30 | no |
| [on-complete-all-queued-tasks](on-complete-all-queued-tasks.md) | asks-to-configure | mixed | yes | 2026-09-30 | no |
| [genome-experiment](genome-experiment.md) | asks-to-configure | delegates | — | 2026-09-30 | no |
| [intent-alignment-audit](intent-alignment-audit.md) | asks-to-configure | delegates | — | 2026-09-30 | no |
| [seed](seed.md) | asks-to-configure | delegates | — | 2026-09-30 | no |
| [intent-nested](intent-nested.md) | asks-to-configure | no-setup-path | — | 2026-09-30 | no |
| [blackhat-challenge-proposal](blackhat-challenge-proposal.md) | works | dead-end | yes | 2026-09-30 | no |
| [gap](gap.md) | works | dead-end | yes | 2026-09-30 | no |
| [whats-left](whats-left.md) | works | dead-end | yes | 2026-09-30 | no |
| [advisor](advisor.md) | works | mixed | yes | 2026-09-30 | no |
| [agentic-artifact-cache](agentic-artifact-cache.md) | works | mixed | yes | 2026-09-30 | no |
| [agentic-chrome-testing](agentic-chrome-testing.md) | works | mixed | yes | 2026-09-30 | no |
| [agentic-find](agentic-find.md) | works | mixed | yes | 2026-09-30 | no |
| [ask](ask.md) | works | mixed | yes | 2026-09-30 | no |
| [audit-pre-commit](audit-pre-commit.md) | works | mixed | yes | 2026-09-30 | no |
| [batch](batch.md) | works | mixed | yes | 2026-09-30 | no |
| [code-principles-how-to-code](code-principles-how-to-code.md) | works | mixed | yes | 2026-09-30 | no |
| [commit](commit.md) | works | mixed | yes | 2026-09-30 | no |
| [commit2](commit2.md) | works | mixed | yes | 2026-09-30 | no |
| [compactions-enrich](compactions-enrich.md) | works | mixed | yes | 2026-09-30 | no |
| [complete-seed](complete-seed.md) | works | mixed | yes | 2026-09-30 | no |
| [compose-domain-knowledge-article](compose-domain-knowledge-article.md) | works | mixed | yes | 2026-09-30 | no |
| [contribute](contribute.md) | works | mixed | yes | 2026-09-30 | no |
| [decompose-nested-intent-from-transcript](decompose-nested-intent-from-transcript.md) | works | mixed | yes | 2026-09-30 | no |
| [enrich-all-compactions](enrich-all-compactions.md) | works | mixed | yes | 2026-09-30 | no |
| [execute](execute.md) | works | mixed | yes | 2026-09-30 | no |
| [feature-measurement-workflow](feature-measurement-workflow.md) | works | mixed | yes | 2026-09-30 | no |
| [flywheel-consultant](flywheel-consultant.md) | works | mixed | yes | 2026-09-30 | no |
| [founder-knowledge-store](founder-knowledge-store.md) | works | mixed | yes | 2026-09-30 | no |
| [governer](governer.md) | works | mixed | yes | 2026-09-30 | no |
| [harness-setup](harness-setup.md) | works | mixed | yes | 2026-09-30 | no |
| [how-to-write-meta-analysis-docs](how-to-write-meta-analysis-docs.md) | works | mixed | yes | 2026-09-30 | no |
| [incomplete-tasks-get-from-session](incomplete-tasks-get-from-session.md) | works | mixed | yes | 2026-09-30 | no |
| [insight](insight.md) | works | mixed | yes | 2026-09-30 | no |
| [intent-audit-and-repair](intent-audit-and-repair.md) | works | mixed | yes | 2026-09-30 | no |
| [intent-db](intent-db.md) | works | mixed | yes | 2026-09-30 | no |
| [intent-journey-documentation-v2](intent-journey-documentation-v2.md) | works | mixed | yes | 2026-09-30 | no |
| [intent-leverage-audit](intent-leverage-audit.md) | works | mixed | yes | 2026-09-30 | no |
| [intent-map-docs-add](intent-map-docs-add.md) | works | mixed | yes | 2026-09-30 | no |
| [intent-validation-engine](intent-validation-engine.md) | works | mixed | yes | 2026-09-30 | no |
| [investigate-error](investigate-error.md) | works | mixed | yes | 2026-09-30 | no |
| [ix-sila-leverage-scoring](ix-sila-leverage-scoring.md) | works | mixed | yes | 2026-09-30 | no |
| [knowledge-atom-extraction](knowledge-atom-extraction.md) | works | mixed | yes | 2026-09-30 | no |
| [leverage-predictor](leverage-predictor.md) | works | mixed | yes | 2026-09-30 | no |
| [multi-tier-audit-pipeline](multi-tier-audit-pipeline.md) | works | mixed | yes | 2026-09-30 | no |
| [nested-intent2](nested-intent2.md) | works | mixed | yes | 2026-09-30 | no |
| [next-priority-tasks](next-priority-tasks.md) | works | mixed | yes | 2026-09-30 | no |
| [pipeline-adversarial-design](pipeline-adversarial-design.md) | works | mixed | yes | 2026-09-30 | no |
| [pipeline-compliance-audit](pipeline-compliance-audit.md) | works | mixed | yes | 2026-09-30 | no |
| [pipeline-idea-generator](pipeline-idea-generator.md) | works | mixed | yes | 2026-09-30 | no |
| [predict-required-skills2](predict-required-skills2.md) | works | mixed | yes | 2026-09-30 | no |
| [principle-alignment-scanner-workflow](principle-alignment-scanner-workflow.md) | works | mixed | yes | 2026-09-30 | no |
| [process-actionable](process-actionable.md) | works | mixed | yes | 2026-09-30 | no |
| [propose-runner](propose-runner.md) | works | mixed | yes | 2026-09-30 | no |
| [rapid-fire-testing](rapid-fire-testing.md) | works | mixed | yes | 2026-09-30 | no |
| [research](research.md) | works | mixed | yes | 2026-09-30 | no |
| [review-proposal](review-proposal.md) | works | mixed | yes | 2026-09-30 | no |
| [run-discoverability-audit](run-discoverability-audit.md) | works | mixed | yes | 2026-09-30 | no |
| [sanity-check](sanity-check.md) | works | mixed | yes | 2026-09-30 | no |
| [session-reminder](session-reminder.md) | works | mixed | yes | 2026-09-30 | no |
| [skill-creator](skill-creator.md) | works | mixed | yes | 2026-09-30 | no |
| [smc](smc.md) | works | mixed | yes | 2026-09-30 | no |
| [smc-evaluator](smc-evaluator.md) | works | mixed | yes | 2026-09-30 | no |
| [smc-frustration-detector](smc-frustration-detector.md) | works | mixed | yes | 2026-09-30 | no |
| [smc-prediction-server](smc-prediction-server.md) | works | mixed | yes | 2026-09-30 | no |
| [speak-human](speak-human.md) | works | mixed | yes | 2026-09-30 | no |
| [task-orchestrator](task-orchestrator.md) | works | mixed | yes | 2026-09-30 | no |
| [user-state-intent-mapper](user-state-intent-mapper.md) | works | mixed | yes | 2026-09-30 | no |
| [verify-ux-assignment-state](verify-ux-assignment-state.md) | works | mixed | yes | 2026-09-30 | no |
| [workflow-factory](workflow-factory.md) | works | mixed | yes | 2026-09-30 | no |
| [worktree-pr-workflow](worktree-pr-workflow.md) | works | mixed | yes | 2026-09-30 | no |
| [initiative-playground](initiative-playground.md) | works | unavoidable-ask | — | 2026-09-30 | no |
| [work-status-report](work-status-report.md) | works | unavoidable-ask | — | 2026-09-30 | no |
| [agentic-prelaunch-audit](agentic-prelaunch-audit.md) | works | delegates | — | 2026-09-30 | no |
| [agentic-tooling-registry](agentic-tooling-registry.md) | works | delegates | yes | 2026-09-30 | no |
| [compact-from-transcript](compact-from-transcript.md) | works | delegates | — | 2026-09-30 | no |
| [conversation-miner](conversation-miner.md) | works | delegates | — | 2026-09-30 | no |
| [discoverability-audit-learnings-findable-by-agents](discoverability-audit-learnings-findable-by-agents.md) | works | delegates | — | 2026-09-30 | no |
| [dispatch-seed](dispatch-seed.md) | works | delegates | — | 2026-09-30 | no |
| [extract-wip-from-past-sessions](extract-wip-from-past-sessions.md) | works | delegates | — | 2026-09-30 | no |
| [harness](harness.md) | works | delegates | — | 2026-09-30 | no |
| [intent-architect](intent-architect.md) | works | delegates | — | 2026-09-30 | no |
| [intent-lifecycle](intent-lifecycle.md) | works | delegates | — | 2026-09-30 | no |
| [intent-map-domain-synthesis](intent-map-domain-synthesis.md) | works | delegates | — | 2026-09-30 | no |
| [jonathan-check](jonathan-check.md) | works | delegates | — | 2026-09-30 | no |
| [on-agent-getting-stuck](on-agent-getting-stuck.md) | works | delegates | — | 2026-09-30 | no |
| [oracle-pre-query](oracle-pre-query.md) | works | delegates | — | 2026-09-30 | no |
| [proposal-ground](proposal-ground.md) | works | delegates | — | 2026-09-30 | no |
| [show-proof-to-human](show-proof-to-human.md) | works | delegates | — | 2026-09-30 | no |
| [superpowers-use](superpowers-use.md) | works | delegates | — | 2026-09-30 | no |
| [ultraplan2](ultraplan2.md) | works | delegates | — | 2026-09-30 | no |
| [ux-testing-learnings](ux-testing-learnings.md) | works | delegates | — | 2026-09-30 | no |
| [validate-load-bearing-claims-against-reality](validate-load-bearing-claims-against-reality.md) | works | delegates | — | 2026-09-30 | no |
| [work-complete-audit](work-complete-audit.md) | works | delegates | — | 2026-09-30 | no |
| [workflow-design](workflow-design.md) | works | delegates | — | 2026-09-30 | no |
| [agent-debug](agent-debug.md) | works | no-setup-path | yes | 2026-09-30 | no |
| [agent-outcome-summary](agent-outcome-summary.md) | works | no-setup-path | — | 2026-09-30 | no |
| [aligned-build](aligned-build.md) | works | no-setup-path | — | 2026-09-30 | no |
| [batch-whats-next](batch-whats-next.md) | works | no-setup-path | — | 2026-09-30 | no |
| [coherence-check](coherence-check.md) | works | no-setup-path | — | 2026-09-30 | no |
| [communication-pattern-validated](communication-pattern-validated.md) | works | no-setup-path | — | 2026-09-30 | no |
| [error-fix-safety-eval](error-fix-safety-eval.md) | works | no-setup-path | — | 2026-09-30 | no |
| [execute2](execute2.md) | works | no-setup-path | — | 2026-09-30 | no |
| [expand-perspective](expand-perspective.md) | works | no-setup-path | — | 2026-09-30 | no |
| [fix-algo-bug-determine-if-auto-fix-ok](fix-algo-bug-determine-if-auto-fix-ok.md) | works | no-setup-path | — | 2026-09-30 | no |
| [fix-hallucinated-code-cleanup-source](fix-hallucinated-code-cleanup-source.md) | works | no-setup-path | — | 2026-09-30 | no |
| [governer-adaptive-score-consumer-guide](governer-adaptive-score-consumer-guide.md) | works | no-setup-path | — | 2026-09-30 | no |
| [hallucination](hallucination.md) | works | no-setup-path | — | 2026-09-30 | no |
| [how-to-bulk-register-atomic-tools](how-to-bulk-register-atomic-tools.md) | works | no-setup-path | — | 2026-09-30 | no |
| [how-to-name-things](how-to-name-things.md) | works | no-setup-path | — | 2026-09-30 | no |
| [how-to-submit-and-track-proposals](how-to-submit-and-track-proposals.md) | works | no-setup-path | — | 2026-09-30 | no |
| [intent](intent.md) | works | no-setup-path | — | 2026-09-30 | no |
| [log-new-mems-in-swarm](log-new-mems-in-swarm.md) | works | no-setup-path | — | 2026-09-30 | no |
| [on-scope-change](on-scope-change.md) | works | no-setup-path | — | 2026-09-30 | no |
| [on-talking-about-code](on-talking-about-code.md) | works | no-setup-path | — | 2026-09-30 | no |
| [pipeline-cross-verify](pipeline-cross-verify.md) | works | no-setup-path | — | 2026-09-30 | no |
| [predict-next-action](predict-next-action.md) | works | no-setup-path | — | 2026-09-30 | no |
| [proposal-schema](proposal-schema.md) | works | no-setup-path | — | 2026-09-30 | no |
| [propose](propose.md) | works | no-setup-path | — | 2026-09-30 | no |
| [reflect](reflect.md) | works | no-setup-path | — | 2026-09-30 | no |
| [respond-to-direct-question](respond-to-direct-question.md) | works | no-setup-path | — | 2026-09-30 | no |
| [session-titles-name](session-titles-name.md) | works | no-setup-path | — | 2026-09-30 | no |
| [skill-file-create-pre-check-self-healing-protocol](skill-file-create-pre-check-self-healing-protocol.md) | works | no-setup-path | — | 2026-09-30 | no |
| [smc-consumption-prompt](smc-consumption-prompt.md) | works | no-setup-path | — | 2026-09-30 | no |
| [task-get-one-important](task-get-one-important.md) | works | no-setup-path | — | 2026-09-30 | no |
| [tests-failing-check](tests-failing-check.md) | works | no-setup-path | — | 2026-09-30 | no |
| [trace-the-ux](trace-the-ux.md) | works | no-setup-path | — | 2026-09-30 | no |
| [track](track.md) | works | no-setup-path | — | 2026-09-30 | no |
| [ux-assignment-reasoning-protocol](ux-assignment-reasoning-protocol.md) | works | no-setup-path | — | 2026-09-30 | no |
| [ux-criticality-measurement](ux-criticality-measurement.md) | works | no-setup-path | — | 2026-09-30 | no |
| [ux-pre-execution-reflection](ux-pre-execution-reflection.md) | works | no-setup-path | — | 2026-09-30 | no |
| [verification-contracts](verification-contracts.md) | works | no-setup-path | — | 2026-09-30 | no |
| [verification-gate](verification-gate.md) | works | no-setup-path | — | 2026-09-30 | no |
| [verify](verify.md) | works | no-setup-path | — | 2026-09-30 | no |
| [workload-status-check](workload-status-check.md) | works | no-setup-path | — | 2026-09-30 | no |

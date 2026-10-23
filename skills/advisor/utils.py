"""
advisor/utils.py — Pure-Python rule functions for the /advisor skill.

All functions are zero-AI: no LLM calls, no network I/O.
They operate on transcript JSONL files or simple string inputs.
Imported or copy-pasted inline by the Haiku data-collection agent
and by the caller (Sonnet) during lean briefing.
"""

import json
import re
import sys
import glob
import os
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

def parse_advisor_args(args):
    """
    Parse CLI-style args for /advisor invocation modes.

    Returns:
        dict with keys: mode, hours (float|None), limit (int|None),
                        date (str|None), uuid_frag (str|None)
    """
    if not args:
        return {'mode': 'lean', 'limit': 20}
    a = args.strip().lower()
    if a == 'today':
        return {'mode': 'lean', 'hours': 24}
    if a == 'next':
        return {'mode': 'next', 'hours': 2}
    if re.match(r'last\s+(\d+)', a):
        n = int(re.search(r'\d+', a).group())
        return {'mode': 'lean', 'limit': n}
    if re.match(r'\d{4}-\d{2}-\d{2}', a):
        target = datetime.strptime(a[:10], '%Y-%m-%d')
        hours_back = (datetime.now() - target).total_seconds() / 3600
        return {'mode': 'lean', 'hours': hours_back + 24}
    if re.match(r'deep\s+\w+', a):
        uuid_frag = a.split()[-1]
        return {'mode': 'deep', 'uuid_frag': uuid_frag}
    return {'mode': 'lean', 'hours': 2}


# ---------------------------------------------------------------------------
# Status + scoring (lean briefing — Step 2)
# ---------------------------------------------------------------------------

def assess_status(last_msg):
    """
    Classify a session's status from the last user message.

    Returns one of: DONE | WAITING | BLOCKED | IN_PROGRESS | UNCLEAR
    """
    m = last_msg.lower()
    if any(k in m for k in ['done', 'perfect', 'ship it', 'lgtm', 'looks good',
                              'commit', 'merged', 'that works', 'all good', 'closed']):
        return 'DONE'
    if any(k in m for k in ['status?', 'update?', 'any progress', 'still running']):
        return 'WAITING'
    if any(k in m for k in ['stuck', 'broken', 'not working', 'failing', 'error',
                              "doesn't work"]):
        return 'BLOCKED'
    if any(k in m for k in ['do this', 'add ', 'build', 'fix', 'change', 'make',
                              'update', 'create', 'implement', 'pls', 'please', 'can you']):
        return 'IN_PROGRESS'
    return 'UNCLEAR'


# Repo/project folder names this person considers most consequential if a
# session on them is abandoned — for example, ones that touch payments, auth,
# messages to users, or the core product surface. Empty by default; add your own project folder names (or leave it
# empty to skip this bonus and score purely on intent keywords).
CORE_REPO_SLUGS = []  # <- add your own project folder names, e.g. ['my-api', 'my-web-app']


def score_criticality(slug, intent, has_tasks=False, has_plans_nearby=False):
    """
    Score a session's criticality 1–100 based on repo, intent keywords,
    and structural signals (tasks, plans).

    Higher scores surface sessions that, if abandoned, cause the most harm.
    """
    score = 20
    if any(p in slug for p in CORE_REPO_SLUGS):
        score += 20
    il = (intent or '').lower()
    if any(k in il for k in ['payment', 'auth', 'billing', 'subscription', 'revenue',
                               'conversion', 'onboarding', 'checkout', 'trial']):
        score += 40
    elif any(k in il for k in ['fix', 'bug', 'error', 'broken', 'feature', 'launch',
                                 'ship', 'deploy']):
        score += 20
    elif any(k in il for k in ['cleanup', 'refactor', 'docs', 'style', 'rename',
                                 'claude.md', 'skill']):
        score -= 10
    if has_tasks:
        score += 10
    if has_plans_nearby:
        score += 15
    return min(max(score, 1), 100)


def ux_reward_fast(intent, slug):
    """
    Return a 1-sentence UX reward for an intent using keyword matching.

    Returns None when the intent is ambiguous — caller should escalate
    to a LOW_COST_RESEARCH_AGENTS Haiku agent for synthesis.
    """
    il = (intent or '').lower()
    if 'payment' in il or 'billing' in il:
        return 'Users can complete a purchase without hitting a broken flow'
    if 'auth' in il or 'login' in il:
        return 'Users can sign in without errors'
    if 'checkout' in il or 'search' in il:
        return 'Users get through the main flow with less friction'
    if 'onboarding' in il:
        return 'New users complete setup without dropping off'
    if 'conversion' in il or 'trial' in il:
        return 'More trial users see the upgrade prompt and convert'
    if 'fix' in il or 'bug' in il or 'broken' in il:
        return 'Users stop hitting an error that currently blocks them'
    if 'refactor' in il or 'cleanup' in il or 'skill' in il:
        return 'Internal quality improvement — no direct user change'
    return None  # → escalate to LOW_COST_RESEARCH_AGENTS


# ---------------------------------------------------------------------------
# Transcript analysis functions (Step 2 — zero AI)
# ---------------------------------------------------------------------------

def score_complexity(transcript_path):
    """
    Scan a session transcript JSONL for structural signals.

    Average session = 100. Highly complex = 500–1000.

    Returns:
        {
            'score': int,
            'signals': dict,
            'violations': list[str]
        }
    """
    signals = {
        'total_lines': 0, 'tool_calls': 0, 'gov_scores': 0,
        'orchestrator_calls': 0, 'task_creates': 0, 'task_completes': 0,
        'task_incompletes': 0, 'agent_dispatches': 0, 'skill_invocations': 0,
        'plan_references': 0, 'compaction_calls': 0, 'file_edits': 0,
        'bash_calls': 0, 'user_messages': 0,
    }
    skills_used = set()
    violations = []

    try:
        with open(transcript_path) as f:
            for line in f:
                d = json.loads(line)
                signals['total_lines'] += 1
                msg = d.get('message', {})
                content = msg.get('content', '')
                mtype = d.get('type', '')

                if mtype == 'user' and not d.get('isSidechain'):
                    signals['user_messages'] += 1

                if isinstance(content, list):
                    for item in content:
                        if not isinstance(item, dict):
                            continue
                        if item.get('type') == 'tool_use':
                            signals['tool_calls'] += 1
                            name = item.get('name', '')
                            inp = item.get('input', {})
                            if 'TaskCreate' in name:
                                signals['task_creates'] += 1
                            if 'TaskUpdate' in name:
                                if inp.get('status') == 'completed':
                                    signals['task_completes'] += 1
                                elif inp.get('status') == 'in_progress':
                                    pass
                                else:
                                    signals['task_incompletes'] += 1
                            if 'Agent' in name:
                                signals['agent_dispatches'] += 1
                            if 'Skill' in name:
                                signals['skill_invocations'] += 1
                                skills_used.add(inp.get('skill', '?'))
                            if 'Edit' in name or 'Write' in name:
                                signals['file_edits'] += 1
                            if 'Bash' in name:
                                signals['bash_calls'] += 1
                        if item.get('type') == 'text':
                            t = item.get('text', '')
                            if 'GovernerScored' in t:
                                signals['gov_scores'] += 1
                            if 'Hard Gates Active' in t:
                                signals['orchestrator_calls'] += 1
                            if ('plan' in t.lower()
                                    and ('superpowers' in t.lower() or 'PLAN' in t.upper())):
                                signals['plan_references'] += 1
                            if 'compact' in t.lower() and 'session' in t.lower():
                                signals['compaction_calls'] += 1
                elif isinstance(content, str):
                    if 'GovernerScored' in content:
                        signals['gov_scores'] += 1
                    if 'Hard Gates Active' in content:
                        signals['orchestrator_calls'] += 1
    except Exception:
        return {'score': 0, 'signals': signals, 'violations': ['TRANSCRIPT_UNREADABLE']}

    # Rough starting ranges (round numbers, not measurements - recalibrate on your own sessions):
    #   a handful of lines, no tool calls            -> ~5   (trivial)
    #   a few hundred lines, dozens of tool calls    -> ~250
    #   several hundred lines, 100+ tool calls       -> ~450
    #   1000+ lines, many agents and tasks           -> ~600
    score = 0
    score += signals['total_lines'] * 0.1
    score += signals['tool_calls'] * 1.5
    score += signals['agent_dispatches'] * 10
    score += signals['task_creates'] * 8
    score += signals['gov_scores'] * 15
    score += signals['orchestrator_calls'] * 5
    score += signals['file_edits'] * 2
    score += signals['skill_invocations'] * 3
    score += signals['plan_references'] * 20
    score += signals['compaction_calls'] * 10

    # Violations — deviations from protocol
    if score > 200 and signals['gov_scores'] == 0:
        violations.append('HIGH_COMPLEXITY_NO_GOVERNER')
    if score > 300 and signals['compaction_calls'] == 0:
        # NOTE: This means no compaction was FILED, not that work is incomplete.
        # Most sessions complete without filing. Do not treat this as evidence of incompleteness.
        violations.append('HIGH_COMPLEXITY_NO_COMPACTION_FILED')
    if score > 200 and signals['task_creates'] == 0:
        violations.append('HIGH_COMPLEXITY_NO_TASK_DECOMPOSITION')
    if signals['task_creates'] > 0 and signals['gov_scores'] == 0:
        violations.append('TASKS_WITHOUT_GOVERNER_SCORES')
    if signals['agent_dispatches'] > 5 and signals['orchestrator_calls'] == 0:
        violations.append('MANY_AGENTS_NO_ORCHESTRATOR')
    if signals['task_creates'] > 0:
        completion_rate = signals['task_completes'] / signals['task_creates']
        if completion_rate < 0.5:
            violations.append(f'LOW_TASK_COMPLETION_RATE_{int(completion_rate * 100)}pct')

    signals['skills_used'] = list(skills_used)
    return {'score': int(score), 'signals': signals, 'violations': violations}


def detect_user_facing_impact(transcript_path):
    """
    Check whether the session touched files or endpoints that real users see.

    Returns:
        {
            'has_impact': bool,
            'impact_score': int,
            'evidence': list[str]
        }
    """
    ux_patterns = [
        'src/components/', 'src/pages/', 'src/views/',
        'public/', 'index.html', '.css', '.scss',
        'routes/', 'controllers/', 'middlewares/',
        'models/', 'schemas/',
    ]
    admin_only = ['admin/', '/admin/', 'admin-']
    internal_only = ['scripts/', 'SKILL.md', 'CLAUDE.md', '.claude/', 'docs/', 'test', 'spec']

    ux_files = []
    admin_files = []
    internal_files = []
    api_changes = []

    try:
        with open(transcript_path) as f:
            for line in f:
                d = json.loads(line)
                msg = d.get('message', {})
                content = msg.get('content', '')
                if not isinstance(content, list):
                    continue
                for item in content:
                    if not isinstance(item, dict):
                        continue
                    if item.get('type') != 'tool_use':
                        continue
                    name = item.get('name', '')
                    inp = item.get('input', {})
                    fp = inp.get('file_path', '') or inp.get('path', '')
                    if not fp:
                        continue
                    if name in ('Edit', 'Write'):
                        if any(p in fp for p in admin_only):
                            admin_files.append(fp)
                        elif any(p in fp for p in internal_only):
                            internal_files.append(fp)
                        elif any(p in fp for p in ux_patterns):
                            ux_files.append(fp)
                    if name == 'Bash':
                        cmd = inp.get('command', '')
                        # A curl to anything other than a local dev server counts as a
                        # real external API call. Replace with your own domain check
                        # if you want to be more specific.
                        if 'curl' in cmd and 'localhost' not in cmd and '127.0.0.1' not in cmd:
                            api_changes.append(cmd[:80])
    except Exception:
        pass

    has_impact = len(ux_files) > 0
    impact_score = len(ux_files) * 10 + len(api_changes) * 5 + len(admin_files) * 2
    evidence = []
    if ux_files:
        evidence.append(f'{len(ux_files)} user-facing files edited')
    if admin_files:
        evidence.append(f'{len(admin_files)} admin-only files edited')
    if internal_files:
        evidence.append(f'{len(internal_files)} internal files edited')
    if api_changes:
        evidence.append(f'{len(api_changes)} API calls made')
    if not evidence:
        evidence.append('No file edits detected')

    return {'has_impact': has_impact, 'impact_score': impact_score, 'evidence': evidence}


def detect_browser_testing(transcript_path):
    """
    Check whether the session includes evidence of browser-based UX verification.

    Agents should print `UX_BROWSER_TESTED: {what was checked}` in the transcript
    to leave an explicit marker that this function will detect.

    Returns:
        {
            'tested': bool,
            'evidence': list[str],
            'test_types': list[str]
        }
    """
    browser_signals = {
        'playwright': [],
        'chrome': [],
        'curl_localhost': [],
        'screenshot': [],
        'browser_open': [],
        'ux_verified': [],
    }

    try:
        with open(transcript_path) as f:
            for line in f:
                d = json.loads(line)
                msg = d.get('message', {})
                content = msg.get('content', '')
                if isinstance(content, list):
                    for item in content:
                        if not isinstance(item, dict):
                            continue
                        if item.get('type') == 'tool_use':
                            name = item.get('name', '')
                            inp = item.get('input', {})
                            cmd = inp.get('command', '')
                            if 'playwright' in name.lower() or 'playwright' in cmd.lower():
                                browser_signals['playwright'].append(name)
                            if 'chrome' in name.lower() or 'devtools' in name.lower():
                                browser_signals['chrome'].append(name)
                            if 'screenshot' in name.lower() or 'screenshot' in cmd.lower():
                                browser_signals['screenshot'].append(name)
                            if 'Bash' in name and re.search(r'localhost:\d+', cmd):
                                browser_signals['curl_localhost'].append(cmd[:60])
                            if 'Bash' in name and ('open http' in cmd or 'open localhost' in cmd):
                                browser_signals['browser_open'].append(cmd[:60])
                        if item.get('type') == 'text':
                            t = item.get('text', '')
                            if ('verified in browser' in t.lower()
                                    or 'browser verification' in t.lower()):
                                browser_signals['ux_verified'].append(t[:60])
                            if 'UX_BROWSER_TESTED' in t:
                                browser_signals['ux_verified'].append('explicit marker')
    except Exception:
        pass

    tested = any(len(v) > 0 for v in browser_signals.values())
    evidence = []
    test_types = []
    for k, v in browser_signals.items():
        if v:
            evidence.append(f'{k}: {len(v)} instances')
            test_types.append(k)

    if not evidence:
        evidence.append('No browser testing detected')

    return {'tested': tested, 'evidence': evidence, 'test_types': test_types}


def predict_next_actions(complexity, violations, ux_impact, browser_tested, status):
    """
    Map detected violations and missing signals to specific remediation actions.

    Does NOT guess — each output maps to an exact protocol step from this
    project's own operating rules (its CLAUDE.md, if it has one).
    Each action is something an agent can execute or the person can approve/dismiss.

    Args:
        complexity:     return value of score_complexity()
        violations:     list[str] — violation tokens from score_complexity()
        ux_impact:      return value of detect_user_facing_impact()
        browser_tested: return value of detect_browser_testing()
        status:         str — one of DONE | IN_PROGRESS | BLOCKED | WAITING | UNCLEAR

    Returns:
        list[str] — ordered list of specific next actions
    """
    actions = []

    violation_actions = {
        'HIGH_COMPLEXITY_NO_GOVERNER':
            'Run /governer to score the session scope and route to correct validation depth',
        'HIGH_COMPLEXITY_NO_COMPACTION_FILED':
            'No compaction was filed in a complex session — consider extracting one if the work is worth preserving (but absence does NOT mean work is incomplete)',
        'HIGH_COMPLEXITY_NO_TASK_DECOMPOSITION':
            'Decompose remaining work into discrete tasks via TaskCreate',
        'TASKS_WITHOUT_GOVERNER_SCORES':
            'Run /governer on each task individually — different tasks may need different validation depth',
        'MANY_AGENTS_NO_ORCHESTRATOR':
            'Switch to /orchestrator mode — too many agents running without coordination',
    }

    for v in violations:
        base_v = v.split('_RATE_')[0] if '_RATE_' in v else v
        if base_v.startswith('LOW_TASK_COMPLETION'):
            actions.append(
                'Review incomplete tasks — mark done if finished, or continue work on remaining items'
            )
        elif base_v in violation_actions:
            actions.append(violation_actions[base_v])

    if ux_impact.get('has_impact') and not browser_tested.get('tested'):
        actions.append(
            'User-facing files were edited but no browser verification detected'
            ' — test in browser before marking complete'
        )

    if status == 'BLOCKED':
        actions.append(
            'Session is blocked — read last messages to identify the blocker and resolve or escalate'
        )
    if status == 'WAITING':
        actions.append('Session is waiting for your input — check and respond')

    if (complexity.get('score', 0) > 500
            and complexity.get('signals', {}).get('plan_references', 0) == 0):
        actions.append(
            'Complex session with no plan — consider running /superpowers-writing-plans to create one'
        )

    if not actions:
        if status == 'DONE':
            actions.append('Session appears complete — no actions needed')
        elif status in ('IN_PROGRESS', 'UNCLEAR'):
            actions.append('No protocol violations detected — session can continue as-is')

    return actions

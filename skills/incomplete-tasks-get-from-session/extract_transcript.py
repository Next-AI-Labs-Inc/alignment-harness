#!/usr/bin/env python3
import json, os, glob, time, sys

def extract_session_transcript(session_uuid=None):
    """
    Reads the current session's JSONL transcript from disk.
    Returns: {user_messages: list[str], task_creates: list, task_updates: list, tool_calls_summary: dict}
    """
    projects_root = os.path.expanduser('~/.claude/projects')
    now = time.time()

    # Find the session file
    if session_uuid:
        matches = glob.glob(f'{projects_root}/*/{session_uuid}*.jsonl')
        path = matches[0] if matches else None
    else:
        # Find most recently modified session (likely current)
        candidates = []
        for jsonl in glob.glob(f'{projects_root}/*/*.jsonl'):
            if not os.path.basename(jsonl)[0].isalnum():
                continue
            candidates.append((os.path.getmtime(jsonl), jsonl))
        candidates.sort(reverse=True)
        path = candidates[0][1] if candidates else None

    if not path:
        print(json.dumps({"error": "NO_SESSION_FOUND"}))
        return

    uuid = os.path.basename(path).replace('.jsonl', '')

    user_messages = []
    task_creates = []
    task_updates = []
    tool_summary = {'Edit': 0, 'Write': 0, 'Bash': 0, 'Agent': 0, 'Skill': 0, 'other': 0}

    with open(path) as f:
        for line in f:
            try:
                d = json.loads(line)
                msg = d.get('message', {})
                content = msg.get('content', '')
                mtype = d.get('type', '')

                # Extract verbatim user messages — NEVER truncate or summarize
                # Preserve FULL nuance of every utterance from the person that contains scope
                if mtype == 'user' and not d.get('isSidechain'):
                    # Handle both string and list content formats
                    text = ''
                    if isinstance(content, str):
                        text = content
                    elif isinstance(content, list):
                        # Extract text from tool_result content blocks
                        parts = []
                        for part in content:
                            if isinstance(part, dict):
                                if part.get('type') == 'text':
                                    parts.append(part.get('text', ''))
                                elif part.get('type') == 'tool_result' and isinstance(part.get('content'), str):
                                    pass  # Skip tool results — these are system, not the person
                            elif isinstance(part, str):
                                parts.append(part)
                        text = '\n'.join(parts)

                    # Only skip pure system injections — NEVER skip the person's messages
                    # even if they contain system tags alongside real content
                    is_pure_system = (
                        text.strip().startswith('<system-reminder>') and
                        '</system-reminder>' in text and
                        len(text.replace(text[text.index('<system-reminder>'):text.index('</system-reminder>') + len('</system-reminder>')], '').strip()) < 10
                    ) if '<system-reminder>' in text else False

                    is_pure_hook = text.strip().startswith('Stop hook feedback:') and len(text.strip()) < 200

                    if text and len(text) > 3 and not is_pure_system and not is_pure_hook:
                        # Strip system-reminder tags but KEEP the person's actual words intact
                        # This preserves full nuance — never summarize, never truncate
                        import re
                        cleaned = re.sub(r'<system-reminder>.*?</system-reminder>', '', text, flags=re.DOTALL).strip()
                        if cleaned and len(cleaned) > 3:
                            user_messages.append(cleaned)

                # Extract task operations
                if isinstance(content, list):
                    for item in content:
                        if not isinstance(item, dict) or item.get('type') != 'tool_use':
                            continue
                        name = item.get('name', '')
                        inp = item.get('input', {})
                        if 'TaskCreate' in name:
                            task_creates.append({
                                'subject': inp.get('subject', ''),
                                'description': inp.get('description', ''),
                            })
                        elif 'TaskUpdate' in name:
                            task_updates.append({
                                'taskId': inp.get('taskId', ''),
                                'status': inp.get('status', ''),
                                'subject': inp.get('subject', ''),
                            })
                        # Count tool usage
                        for key in tool_summary:
                            if key in name:
                                tool_summary[key] += 1
                                break
                        else:
                            tool_summary['other'] += 1
            except:
                pass

    # Determine which tasks are incomplete
    task_final_status = {}
    for tc in task_creates:
        task_final_status[tc['subject']] = {'subject': tc['subject'], 'description': tc['description'], 'status': 'pending'}
    for tu in task_updates:
        # Match by taskId — find the corresponding create
        for subj, task in task_final_status.items():
            if tu.get('status'):
                # Update based on order (TaskUpdates reference by ID, which we map by order)
                pass
        if tu.get('status') == 'completed':
            # Find matching task by ID position
            idx = int(tu.get('taskId', '0')) - 1 if tu.get('taskId', '').isdigit() else -1
            if 0 <= idx < len(task_creates):
                subj = task_creates[idx]['subject']
                if subj in task_final_status:
                    task_final_status[subj]['status'] = 'completed'

    incomplete_tasks = [t for t in task_final_status.values() if t['status'] != 'completed']

    result = {
        'session_uuid': uuid,
        'transcript_path': path,
        'total_user_messages': len(user_messages),
        'user_messages_verbatim': user_messages,
        'tasks_created': len(task_creates),
        'tasks_completed': len([t for t in task_final_status.values() if t['status'] == 'completed']),
        'incomplete_tasks': incomplete_tasks,
        'tool_summary': tool_summary,
    }
    print(json.dumps(result))

extract_session_transcript()

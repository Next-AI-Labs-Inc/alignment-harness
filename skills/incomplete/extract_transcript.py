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

                # Extract verbatim user messages
                if mtype == 'user' and not d.get('isSidechain'):
                    if isinstance(content, str) and len(content) > 3 \
                            and not content.startswith('<task') \
                            and not content.startswith('<system') \
                            and not content.startswith('<local-command') \
                            and not content.startswith('<command'):
                        user_messages.append(content)

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

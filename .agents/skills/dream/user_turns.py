#!/usr/bin/env python3
"""Print the human-typed turns of Claude Code sessions, newest sessions first.

Usage: user_turns.py --since <epoch> <project dir>...

Reads every *.jsonl directly inside each project dir. Session lines can be
megabytes, so this prints only short, dated user turns for a miner to judge.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Harness, skill and hand-off text that arrives with the user role.
NOISE = (
    "<command-name>", "<local-command", "<agent-message", "[Subagent hand-back]",
    "Base directory for this skill", "<pasted_content", "[auto-handoff]",
    "[handoff]", "<task-notification>", "<system-reminder>",
)

# Phrasings that often mark a signal. Hints for the reader, not a filter.
HINTS = {
    "correction": r"actually|no,|wrong|incorrect|don't do|stop doing|I said|that's not|use .* instead|not like that",
    "preference": r"I prefer|always use|never use|I like|I don't like|from now on|remember that|make sure|default to|going forward",
    "decision": r"let's go with|I decided|we're using|the plan is|switch to|chosen|picked|we agreed|we'll use",
    "theme": r"again|keep forgetting|as usual|same as before|like last time|we always",
}
# Whole words only, so "again" does not fire on "against".
HINTS = {name: re.compile(rf"(?<!\w)(?:{pattern})(?!\w)", re.IGNORECASE) for name, pattern in HINTS.items()}


def entry_time(entry):
    """Epoch seconds of an entry, or None when it carries no timestamp."""
    stamp = entry.get("timestamp")
    if not isinstance(stamp, str):
        return None
    try:
        return datetime.fromisoformat(stamp.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


def is_human_turn(entry):
    if entry.get("type") != "user":
        return False
    if entry.get("isMeta") or entry.get("isSidechain") or entry.get("isCompactSummary"):
        return False
    origin = entry.get("origin")
    if isinstance(origin, dict) and origin.get("kind") not in (None, "human"):
        return False
    text = (entry.get("message") or {}).get("content")
    # Tool results and attachments arrive as lists; typed prompts are strings.
    return isinstance(text, str) and not any(mark in text for mark in NOISE)


def human_turns(path, since):
    """Yield (date, text) for human turns in one session file written after `since`."""
    file_time = path.stat().st_mtime
    with path.open(encoding="utf-8", errors="replace") as lines:
        for line in lines:
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            if not isinstance(entry, dict) or not is_human_turn(entry):
                continue
            # Old logs have entries with no timestamp: date those by the file.
            when = entry_time(entry) or file_time
            if when <= since:
                continue
            date = datetime.fromtimestamp(when, timezone.utc).strftime("%Y-%m-%d")
            yield date, " ".join(entry["message"]["content"].split())


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--since", type=float, default=0, help="epoch seconds; older turns are skipped")
    parser.add_argument("--max-turns", type=int, default=60, help="newest turns kept per session")
    parser.add_argument("--max-chars", type=int, default=400, help="characters kept per turn")
    parser.add_argument("projects", nargs="+", type=Path, help="absolute project dirs")
    args = parser.parse_args()

    sessions = turns = 0
    for project in args.projects:
        files = [f for f in project.glob("*.jsonl") if f.stat().st_mtime > args.since]
        for path in sorted(files, key=lambda f: f.stat().st_mtime, reverse=True):
            found = list(human_turns(path, args.since))[-args.max_turns:]
            if not found:
                continue
            sessions += 1
            turns += len(found)
            print(f"\n## {project.name} / {path.name}")
            for date, text in found:
                hints = [name for name, pattern in HINTS.items() if pattern.search(text)]
                tag = f" [{','.join(hints)}?]" if hints else ""
                print(f"{date}{tag} | {text[:args.max_chars]}")
    print(f"\n{sessions} sessions, {turns} user turns", file=sys.stderr)


if __name__ == "__main__":
    main()

---
name: dream
description: Memory consolidation skill. Mines recent sessions for corrections, preferences, decisions, and patterns. Proposes changes to global memory files and applies them after user approval. Trigger with /dream or "consolidate my memory".
allowed-tools: ["Bash", "Read", "Edit", "Write", "AskUserQuestion", "Agent"]
---

# /dream - Memory Consolidation

Run 4 phases in order. At the start of each phase, give the user a one-line progress note with real numbers (sessions found, miners launched, candidates returned). Keep the full proposal for Phase 4 (summary + approval).

---

## Constants

The global memory is the one for `~/.claude` itself. Claude Code names a project dir after its path, with `/` and `.` turned into `-`. Shell variables do not persist between Bash calls, so set these at the top of every call that uses them:

```bash
PROJECTS_DIR=~/.claude/projects
MEMORY_DIR=$PROJECTS_DIR/$(echo ~/.claude | sed 's|[/.]|-|g')/memory
LAST_DREAM=$MEMORY_DIR/.last-dream
```

If `$MEMORY_DIR` does not exist, stop and tell the user.

---

## Phase 1: ORIENT

Read the current memory state.

1. Read `$MEMORY_DIR/MEMORY.md` — note structure, line count, entries.
2. Read every `*.md` file in `$MEMORY_DIR` (skip `.last-dream`). Build a mental map of what's stored and in which files.
3. Check when dreaming last ran:
   ```bash
   cat $LAST_DREAM 2>/dev/null || echo "never"
   ```
4. Count total projects:
   ```bash
   ls $PROJECTS_DIR/ | wc -l
   ```
5. Drift check: for every memory that names a file path, flag, command, or
   skill, verify it still exists (`test -e <path>`, `rg -l <symbol> <dir>`).
   Record each failed check (memory file + what is missing) — these are the
   only evidence for staleness in Phase 3.

---

## Phase 2: GATHER SIGNAL

### 2a. List projects with recent activity

Find projects that have sessions newer than last dream (or last 24h if never run):

```bash
# Get last dream timestamp (default: 24h ago)
LAST_TS=$(cat $LAST_DREAM 2>/dev/null || date -v-24H +%s)

# List projects with recent jsonl files
find $PROJECTS_DIR/ -maxdepth 2 -name "*.jsonl" -newer $LAST_DREAM 2>/dev/null \
  | sed 's|/[^/]*\.jsonl$||' | sed 's|.*/projects/||' | sort -u
```

If `.last-dream` doesn't exist, use files modified in the last 24 hours:
```bash
find $PROJECTS_DIR/ -maxdepth 2 -name "*.jsonl" -mtime -1 \
  | sed 's|/[^/]*\.jsonl$||' | sed 's|.*/projects/||' | sort -u
```

### 2b. Ask user to select scope

Present the list of active projects. Use AskUserQuestion with options:
- `Batch (all active)` — mine all projects with recent sessions
- Individual project names (up to 4 options; if more, group the rest into "batch")
- `All projects (full scan)` — scan everything regardless of recency

### 2c. Mine sessions for signals — via subagents, never inline

Session jsonl files are huge (single lines can be MBs). NEVER grep or read them
in the orchestrator context — all mining runs in parallel subagents that return
only distilled candidates.

1. Group the selected projects into 4-6 batches of roughly equal file count
   (biggest project alone; small projects grouped).
2. Spawn one `general-purpose` agent per batch (`model: "haiku"`) in a single message
   so they run concurrently. Each prompt must contain:
   - The explicit list of project dirs (absolute paths under `$PROJECTS_DIR`)
     and the instruction to scope to `*.jsonl` files
     `-newer $LAST_DREAM` (or `-mtime -1` when `.last-dream` is absent).
     Always pass ABSOLUTE paths to `find`: project dirs start with `-`, so a
     relative path is parsed as an option and silently matches nothing.
   - Instruction to write a python script to the session scratchpad that
     parses each jsonl line as JSON, keeps only entries where `type=="user"`
     and message content is a plain user text string (skip tool_result blocks,
     tool_result lists, and command-output entries / lines containing
     `<command-name>` or `<local-command`), and scans the text
     case-insensitively for the signal patterns below. Output per match:
     file basename, file mtime date (YYYY-MM-DD), signal type, snippet
     (max 300 chars). Cap ~10 matches per file.
   - Noise filter — also skip user-role text containing any of:
     `<agent-message`, `[Subagent hand-back]`, `Base directory for this skill`,
     `<pasted_content`, `[auto-handoff]`, `[handoff]`, `<task-notification>`.
     These are harness/skill/handoff injections (≈60% of raw hits in the
     2026-10-20 run), not user intent.
   - Instruction to also output, per file, the first 200 chars of the first 3
     real user prompts, and report a `Repeated workflows:` section — up to 5
     request patterns seen in ≥3 sessions, with counts (skill candidates).
   - The signal patterns:
     - corrections: `actually|no,|wrong|incorrect|don't do|stop doing|I said|that's not|use .* instead|not like that`
     - preferences: `I prefer|always use|never use|I like|I don't like|from now on|remember that|make sure|default to|going forward`
     - decisions: `let's go with|I decided|we're using|the plan is|switch to|chosen|picked|we agreed|we'll use`
     - themes: `again|keep forgetting|as usual|same as before|like last time|we always`
   - The one-line descriptions of every existing memory file (from Phase 1),
     so the agent skips already-known facts.
   - Report format: at most 15 candidates, each as
     `[type] fact (1-2 lines) — project <slug>, <file>, <date>`, with a note
     if it UPDATES/contradicts an existing memory. No raw log lines.
   - READ-ONLY on jsonl files; temp scripts go to the scratchpad under a
     unique filename (concurrent miners can clobber shared names).
3. Wait for all miners; the orchestrator consolidates only their returned
   lists. Cross-batch dedupe is the orchestrator's job.
4. Also skip candidates already recorded outside memory: `~/.claude/CLAUDE.md`
   (and any file it imports) and repo CLAUDE.md files — spot-check before proposing an ADD.

---

## Phase 3: CONSOLIDATE

Produce a list of proposed changes. Do **not** write anything yet.

For each finding from Phase 2, categorize as one of:
- **ADD** — new fact not in any memory file
- **UPDATE** — updates/contradicts an existing entry (note which file and line)
- **MERGE** — overlaps with existing, can be folded in
- **DELETE** — stale entry that should be removed (failed drift check, or contradicted by a newer session). Age alone is never a reason
- **PROMOTE** — global rule seen in ≥2 projects/sessions → propose an edit to `~/.claude/CLAUDE.md` or a file it imports (name the file)
- **SKILL** — repeated workflow from the miners' `Repeated workflows:` sections not covered by an existing skill → propose a skill name + 1-line steps

Rules:
- Convert any relative date in source to absolute: if session mtime is 2026-06-28 and text says "yesterday", record 2026-06-27.
- If contradicting an existing entry: mark the old one DELETE, new one ADD.
- Every DELETE/UPDATE/MERGE carries its evidence: the failed drift check
  from Phase 1, or the newer session quote (project, file, date). No
  evidence → tag `[UNVERIFIED]`; it is never pre-selected in Phase 4.
- Do not duplicate — if the same fact already exists verbatim, skip it.
- Keep entries concise: one fact per bullet, max 2 lines.

Build the full change list before moving to Phase 4.

---

## Phase 4: SUMMARY + APPROVAL

Present the proposed changes to the user:

```
## Dream Summary

Mined X sessions from Y projects. Found Z signals.

### Proposed Changes

**ADD** (N new entries)
- [feedback] "Use X instead of Y when doing Z" → feedback_xyz.md
- [project] "huhkai: branch foo is ready to merge" → project_active_work.md

**UPDATE** (N updates)
- feedback_cost_model_routing.md: "..." → "..." (corrects old entry from 2025-10)

**DELETE** (N removals)
- project_active_work.md: "huhkai: branch bar in progress" (stale, contradicted)

**MEMORY.md**
- Remove 2 stale pointers, add 1 new file link, reorder by recency

No changes outside $MEMORY_DIR/
```

Number every item in the summary and show its evidence next to it.

Then ask with one multiSelect AskUserQuestion per non-empty category
(ADD+UPDATE, MERGE, DELETE), each option one item (group extras if >4):
- ADD/UPDATE items with evidence — recommended (listed first)
- MERGE/DELETE and `[UNVERIFIED]` items — opt-in, never marked recommended
Selecting nothing in every question = abort.

If anything is selected:
1. Snapshot the memory dir (git repo is created on first run):
   ```bash
   M=$MEMORY_DIR
   [ -d $M/.git ] || git -C $M init -q
   git -C $M add -A && git -C $M commit -qm "pre-dream snapshot" --allow-empty
   ```
2. Apply only the selected items using Edit or Write.
3. Update `MEMORY.md` index.
4. Write current timestamp to `.last-dream`:
   ```bash
   date +%s > $LAST_DREAM
   ```
5. Commit with the changelog as the message — one line per applied item:
   `<ACTION> <file>: <fact> — <evidence>`. Write the message to a
   scratchpad file and run `git -C $M add -A && git -C $M commit -qF <file>`.
6. Confirm: "Dream complete. N changes applied. Undo: `git -C <memory dir> revert HEAD`."

If nothing is selected: "Dream aborted. No changes written."

---

## Notes

- Never touch project code. Read-only access to session JSONL files.
- Never write outside `$MEMORY_DIR`, except PROMOTE/SKILL items the user approved individually (ask with a separate multiSelect AskUserQuestion).
- If no signals found: report "No new signals found since last dream." and exit without writing.
- Prefer Edit over Write for existing files — only use Write for new topic files.

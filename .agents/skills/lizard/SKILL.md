---
name: lizard
description: Run lizard cyclomatic complexity analysis on changed or specified files. Use when reviewing code changes for complexity, after implementing a feature, or when a function feels hard to follow. Triggers on "lizard", "check complexity", "cyclomatic complexity", or before committing.
---

# Lizard Complexity Analysis

Analyze code complexity using the `lizard` CLI. By default, analyze files changed in the current branch vs the base branch. Pass specific files or paths as args to override.

## Steps

### 1. Determine files to analyze

If the user passed explicit file paths as args, use those.

Otherwise, get changed files from git:

```bash
git diff --name-only HEAD
```

If that's empty (nothing staged/unstaged vs HEAD), try:

```bash
git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only origin/master...HEAD 2>/dev/null
```

Filter to files that exist on disk (deleted files would error). Skip files lizard doesn't support (images, json, yaml, lock files, etc).

### 2. Run lizard

Run with warnings-only output and sort by complexity descending:

```bash
lizard <files...> -w -s cyclomatic_complexity
```

Use these defaults unless the user specifies otherwise:
- CCN threshold: `-C 12`
- Length threshold: `-L 300` (catches monolith functions, not CDK chaining)
- Arguments threshold: `-a 4`

Full command:

```bash
lizard <files...> -w -C 12 -L 300 -a 4 -s cyclomatic_complexity
```

If no files or all files were filtered out, report that and stop.

### 3. Report results

If lizard exits 0 (no warnings): report "No complexity warnings — all functions within thresholds."

If warnings exist, present them as a table or list grouped by file:

```
src/foo.ts
  processData (line 42)  CCN: 18  length: 95  params: 4  ← CCN exceeds threshold

src/bar.py
  handle_event (line 12)  CCN: 12  length: 45  params: 3
```

Then give a 1–2 sentence summary: how many functions flagged, which files are hotspots.

### 4. Suggest action (optional)

If CCN > 20 or length > 100, suggest the specific function as a refactor candidate. One line per function — no prescriptive rewrite unless the user asks.

## Notes

- `lizard` must be installed: `uv tool install lizard` or `pip install lizard`
- For TypeScript/TSX files, lizard supports them natively
- If analyzing a large path, add `-t 4` for parallelism
- To include only specific languages: `-l python -l typescript`

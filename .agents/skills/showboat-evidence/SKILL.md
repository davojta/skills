---
name: showboat-evidence
description: After implementing a task, write a runnable Showboat script that proves each acceptance criterion, for the user to run and post as PR evidence.
---

# Showboat evidence

Goal: turn a task's acceptance criteria into a script of `showboat` commands. The **user** runs it, gets `demo.md` with real captured output, and posts it to the PR. You only author files; you never run the script, never edit `demo.md`, never touch git.

Tool reference: `uvx showboat --help` (init, note, exec, image, pop, verify, extract).

## Outputs

Write to `docs/evidence/<task-slug>/`:

1. `plan.md` — task link, acceptance criteria as a numbered list, and for each criterion the step(s) that prove it. Note prerequisites (env vars, services, fixtures) and anything NOT covered.
2. `run.sh` — executable bash script that builds `demo.md` via showboat commands only.

## run.sh template

```bash
#!/usr/bin/env bash
# Evidence for <task>. Run from repo root: bash docs/evidence/<slug>/run.sh
set -uo pipefail            # no -e: record failures, don't abort
DIR="$(cd "$(dirname "$0")" && pwd)"
DOC="$DIR/demo.md"
SB="uvx showboat"
rm -f "$DOC"

$SB init "$DOC" "<Task title> — evidence"
$SB note "$DOC" "Commit: $(git rev-parse --short HEAD). Criteria: see plan.md."

# --- AC1: <criterion text> ---
$SB note "$DOC" "**AC1** — <what this step proves and what to look for>."
$SB exec "$DOC" bash '<command>'

# --- AC2 (negative case): <criterion> ---
$SB note "$DOC" "**AC2** — invalid input is rejected with a clear error."
$SB exec "$DOC" bash '<command> 2>&1; echo "exit=$?"'

# --- Summary ---
$SB note "$DOC" "Re-check: \`uvx showboat verify $DOC\`"
uvx showboat verify "$DOC" && echo "VERIFY OK" || echo "VERIFY DRIFT (see diff)"
```

## Rules for steps

- **One criterion → at least one step.** Every AC in plan.md maps to a labelled section in run.sh. Include at least one negative/edge case where the task implies one.
- **Prove behaviour, not effort.** Prefer the real entrypoint (CLI command, HTTP call, query) over re-running unit tests. One test-suite summary step at the end is fine.
- **Deterministic output** so `verify` passes on re-run: strip or fix timestamps, UUIDs, ports, durations, absolute paths (`| sed`, `jq` field selection, `--seed`, `TZ=UTC`, fixed fixtures). If something can't be made deterministic, say so in the preceding `note`.
- **Expected failures:** append `; echo "exit=$?"` so the non-zero code is visible and intentional.
- **Bounded output:** pipe long output through `head -n 40` / `jq` selections; the doc must fit in a PR comment (< 60 KB).
- **Self-contained:** set up and tear down fixtures inside the script (`mktemp -d`, fake services/mocks). No reliance on the agent's working state.
- **No secrets** in commands or output; read from env vars, never echo them.
- **Visual changes:** capture with `$SB image "$DOC" '<cmd that writes png and echoes its path>'` (e.g. `rodney`, `shot-scraper`). Note in plan.md that images must be committed or uploaded for the PR to render them.
- Keep it short: ~3–12 steps. Notes are one or two sentences stating what the reader should observe.

## Before finishing

- Re-read run.sh: every command exists in this repo, paths are relative to repo root, quoting is correct (single-quote the exec payload; escape inner single quotes).
- Tell the user in two or three lines: where the files are, the one command to run, and how to post it, e.g.
  `bash docs/evidence/<slug>/run.sh && gh pr comment --body-file docs/evidence/<slug>/demo.md`
- If the user later shares a failing/drifting `demo.md`, fix the code or the step — never hand-edit recorded output.

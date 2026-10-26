---
name: visual-review
description: Build a one-page HTML overview of a diff or pull request — summary, numbers, files, architecture and flow diagrams, before/after code, and a grug review. Use when asked for a visual review, PR overview, or to explain a change visually, or invoked as /ds:visual-review.
argument-hint: "[PR number | branch | commit | a..b | HEAD]"
---

# visual review

One HTML page for one change. Facts first, then the picture.

Adapted from [visual-explainer](https://github.com/nicobailon/visual-explainer) by Nico Bailon (MIT, see `LICENSE-visual-explainer`).

## Style

- Simple technical English. Short sentences.
- One line per point. No filler, no marketing words.
- Skip trivial content. Cut it.
- Write like a senior engineer's notes, not a generated report.

## 1. Scope

Read `$ARGUMENTS`. Use the first row that fits.

| Argument | Diff command |
|----------|--------------|
| PR number (`42`, `#42`) | `gh pr view 42 --json title,body,baseRefName`, `gh pr diff 42`, `gh pr diff 42 --name-only` |
| branch (`develop`) | `git diff develop...HEAD` |
| commit hash | `git show <hash>` |
| range (`a..b`) | `git diff a..b` |
| `HEAD` | `git diff HEAD` (uncommitted changes) |
| none | `git diff main...HEAD` |

- Drop lockfiles, generated files, `dist/`, `build/`, snapshots, and binaries.
- Say in one line what you dropped.

## 2. Gather facts

1. Run `git diff --stat <range>` and `git diff --name-status <range>`. Get the repo URL: `gh repo view --json url -q .url`.
2. Read each critical-path file in full. Critical path = logic that changes behavior.
3. Note tests and docs touched (README, `docs/`).
4. Write a fact sheet before any HTML. One line per fact:
   - Number (files, lines, tests): source = command output.
   - Name (function, type, module): source = `file:line`.
   - Behavior, before and after: source = `file:line`.
   - Not verified: prefix with ⚠️.
5. The page uses only facts from this sheet.

## 3. Review

Follow the `grug-review` skill in this plugin (`.agents/skills/grug-review/SKILL.md`).

- It picks the tier: small (one `ds:grug`) or big (one `ds:grug` per batch).
- Put its grade and findings in the Review section.
- Do not add review rules of your own.

## 4. Build the page

1. Copy `template.html` from this skill's folder to the output path (section 5).
2. Fill each `<!-- FILL ... -->` with facts from the fact sheet.
3. Delete optional sections that are trivial. Delete their nav links too.
4. Delete every `<!-- FILL -->` comment and every example row.

| Section | Rule |
|---------|------|
| Summary | Always. Why the change exists, in 1–2 sentences. Then scope. |
| Numbers | Always. Files, +/− lines, new modules, tests. Docs badge. |
| Files | Always. One row per file, grouped by folder. Status A / M / D. |
| Architecture | Always. Delta (Before · Changes · After) when the change rewires modules and fits the budget. Else Mermaid graph if 10 modules or fewer. Else module cards. |
| Before / after | Always. Critical files only. Panel header `file:start-end`. Skip config, formatting, renames. |
| Flow | Optional. Mermaid for a new lifecycle or pipeline. Node labels with emoji and I/O line. Keep the Legend block. |
| Review | Always. Grug grade, verdict, findings from section 3. Card class and icon tag as in the template: bug, pain, good, question. |
| Tests | Optional. Test files touched and missing critical coverage. |
| Decisions | Optional. Only if 2 or more. Decision, why, alternative. |

For a chart or any figure beyond the architecture delta and the Mermaid flow, use `/ds:diagram-design`.

Architecture delta rules:

- Rules and the data-attribute contract: `architecture-delta.md`. Copy the block from `template.html`.
- Budget: 8 components, 10 relationships, 8 ledger entries. Over budget: use the Mermaid graph.
- Run `python3 <skill-dir>/verify-architecture-delta.py <page>`. It must pass before you finish.

Mermaid rules:

- `graph TD` when there are 6 or more nodes.
- Max about 10 nodes per diagram.
- `<br/>` for line breaks in labels. Never `\n`.
- No `<` or `&` in labels. Use words.
- File nodes: `class <ids> added`, `modified`, or `deleted`. The template colors them. No `classDef`, no `style`, no other colors.
- Flow nodes: 2 lines, 3 for a complex step. Line 1: emoji and step name. Last line: `input ➡️ output`. The template shows every line after the first smaller. Max 24 characters per line, or it wraps.
  Example: `B["🔍 get diff<br/>PR # ➡️ .diff"]`. Emoji from the template legend: 📥 input, 🔍 read or fetch, ⚙️ compute,
  🔀 branch or merge, 🤖 agent, 📝 write or report, 📤 output. Name files by extension (.md, .txt, .csv, .parquet, .json, .diff),
  else one short word (`text`, `no file`). Add a hover tooltip per node: `click B callback "one-sentence explanation"`.

HTML rules:

- In code blocks, escape `<`, `>`, and `&` as `&lt;`, `&gt;`, `&amp;`.
- Header: link the repo, and the PR, commit, or branch.
- Every `file:line` ref is an `<a class="ref">` link:

| Scope | Link |
|-------|------|
| PR, new side | `{repo}/pull/{n}/files#diff-{sha256}R{line}` |
| PR, old side or deleted file | `{repo}/pull/{n}/files#diff-{sha256}L{line}` |
| branch, commit, range | `{repo}/blob/{head-sha}/{path}#L{line}` |
| file outside the diff | `{repo}/blob/{head-sha}/{path}#L{line}` |
| `HEAD` (uncommitted) | no link, `<span class="ref">` |

`{sha256}` = `printf %s "<path>" | shasum -a 256 | cut -d' ' -f1`. Link logic from the `pr-map` command of the `visual-review` plugin.

## 5. Output

1. Path: `~/.agent/diagrams/visual-review/<repo>/<name>/overview.html`.
   - `<repo>` = `basename $(git rev-parse --show-toplevel)`.
   - `<name>` = `pr-42` for PR 42.
   - `<name>` = branch name, with `/` replaced by `-`.
   - Commit: `commit-<short-hash>`. `HEAD`: `uncommitted`. Range: `<a>-<b>`.
2. `mkdir -p` the folder. Write the file.
3. Open it: `open <path>` on macOS, `xdg-open <path>` on Linux.
4. Print the path. Stop. Do not edit code.

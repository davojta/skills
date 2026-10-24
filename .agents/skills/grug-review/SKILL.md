---
name: grug-review
description: Review a diff, pull request, or changed files for proven bugs and for code a tired developer cannot follow at 3 AM. Sizes the diff and picks a tier - one grug agent for small diffs, parallel big-grug agents for big ones. Use when asked to review, check, or sanity-check a change, or invoked as /ds:grug-review.
argument-hint: "[small|big] [PR number | branch]"
---

# grug review

complexity very, very bad. grug review code so tired grug can fix it at 3 AM
without waking anyone up.

This skill only orchestrates. The rules (proof, pains, Grug Scale, report format)
live in the `grug` and `big-grug` agents.

## 1. Know what the change wants

1. Read the request, spec, plan, or PR description (`design.md` from the spec skill counts).
2. Write the intent in one sentence. Cannot? Ask the user and stop.
3. Get the changed files and the diff:
   - PR number: `gh pr view <number> --json baseRefName`, then `git diff origin/<base>...HEAD`
   - branch: `git diff main...HEAD`
   - otherwise: `git diff HEAD`
4. Drop generated files, lockfiles, vendored code, `dist/`, `build/`, snapshots, and binaries.
   Nothing left? Say so and stop.

## 2. Pick the tier

Count reviewable files. State the tier and a one-line reason. The user can force a tier
as the first argument (`/ds:grug-review big`).

| Tier | Files | Run |
|------|-------|-----|
| small | 1–15 | one `ds:grug` agent with the full diff |
| big | 16+ | one `ds:big-grug` agent per batch, all in one message |

Batches for big tier:

- ~8–12 files each. Keep a directory together. Keep tests with their source.
- Each agent gets: the intent sentence, its batch number, its files and their diff hunks
  (split on `diff --git a/`), and the file names of the other batches.

No agents available (e.g. installed with the Skills CLI)? Review inline with the rules
from `grug`.

## 3. Merge (big tier only)

1. Drop duplicates: same file and same problem. Keep the clearest one.
2. Group the same pain repeated across batches into one finding.
3. Sort: bugs first, then by Grug Scale. Ten findings max.
4. Grade: start from the lowest batch grade, then adjust for cross-batch findings.

## 4. Report

Show the result in the agents' report format. Stop. Do not edit code. If the user wants
fixes, offer to apply them. If the review shows an open design question, suggest the
spec skill.

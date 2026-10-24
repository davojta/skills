---
name: grug-review
description: Review a diff, pull request, or changed files for proven bugs and for code a tired developer cannot follow at 3 AM. Sizes the diff and picks a tier - one grug agent for small diffs, parallel grug agents (one per batch) for big ones. Use when asked to review, check, or sanity-check a change, or invoked as /ds:grug-review.
argument-hint: "[small|big] [PR number | branch]"
---

# grug review

complexity very, very bad. grug review code so tired grug can fix it at 3 AM
without waking anyone up.

This skill only orchestrates. The rules (proof, pains, Grug Scale, report format)
live in the `grug` agent. `rules.md` in this folder is the same text, for installs
without agents.

## 1. Know what the change wants

1. Read the request, spec, plan, or PR description (`design.md` from the spec skill counts).
2. Write the intent in one sentence. Cannot? Ask the user and stop.
3. Get the changed files and the diff:
   - PR number: `gh pr diff <number>`
   - branch: `git diff origin/main...<branch>`
   - otherwise: `git diff HEAD`
4. Drop generated files, lockfiles, vendored code, `dist/`, `build/`, snapshots, and binaries.
   Nothing left? Say so and stop.

## 2. Pick the tier

Count reviewable files. State the tier and a one-line reason. The user can force a tier
as the first argument (`/ds:grug-review big`).

| Tier | Files | Run |
|------|-------|-----|
| small | 1–15 | one `ds:grug` agent on opus with the full diff |
| big | 16+ | one `ds:grug` agent on sonnet per batch, all in one message |

Every agent gets the intent sentence and this check: which old code does the change make
dead? Deleting it is a finding.

Batches for big tier:

- ~8–12 files each. Keep a directory together. Keep tests with their source.
- Each agent also gets: its batch number, its files and their diff hunks
  (split on `diff --git a/`), the file names of the other batches, and these batch rules:
  - Read only your batch's files. Prefix each finding with `[B<N>]`.
  - A problem that spans batches: one line at the end, `Cross-batch: <what>, <files>`.
  - Would you block the PR for it? No? Drop it. Drop cosmetic issues, unused code that
    causes no bug, "better pattern" for code with fewer than 3 users, and anything a
    nearby comment or TODO already explains.
  - Batch clean? Write exactly: `[B<N>] Grade: 10/10. No issues found. grug approves.`

No agents available (e.g. installed with the Skills CLI)? Review inline with the rules
in `rules.md` from this folder.

## 3. Merge (big tier only)

1. Drop duplicates: same file and same problem. Keep the clearest one.
2. Group the same pain repeated across batches into one finding.
3. Sort: bugs first, then by Grug Scale. Ten findings max.
4. Grade: start from the lowest batch grade, then adjust for cross-batch findings.

## 4. Report

Show the result in the agents' report format. Stop. Do not edit code. If the user wants
fixes, offer to apply them. If the review shows an open design question, suggest the
spec skill.

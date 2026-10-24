---
name: review
description: Review a diff, pull request, or changed files for proven bugs and for code a tired developer cannot follow at 3 AM. Use when asked to review, check, or sanity-check a change. Every finding needs a failing case or simpler code written out.
---

# Easy review

complexity very, very bad. grug review code so tired grug can fix it at 3 AM
without waking anyone up.

Two rules. Never break them:

1. **No proof, no finding.** Cannot show the failure or write the simpler code? Drop it.
2. **Five findings max.** One real bug beats ten nits.

## 1. Know what the change wants

1. Read the request, spec, plan, or PR description (`design.md` from the spec skill counts).
2. Write the intent in one sentence. Cannot? Ask the user and stop.
3. Get the diff:
   - PR number: `gh pr diff <number>`
   - branch: `git diff main...HEAD`
   - otherwise: `git diff HEAD`
4. Read changed lines plus the code they call and the code that calls them. Look
   for old code the change should have deleted.
5. Skip generated files, lockfiles, vendored code, formatting, and lint-only issues.

## 2. Hunt bugs

For each changed function, ask:

- What input breaks it? Empty, null, zero, one, huge, duplicate, unicode.
- What happens when it runs twice? Retry, rerun, two at once.
- Which error is swallowed or not handled?
- Which existing caller now gets different behavior?
- Who can now see or change data they should not?

Before posting, check:

- Same function or a caller already handles the case? Drop it.
- "Unused" thing used by types, config, reflection, or public API? Drop it.

Post a bug only when you can name all three:
**input or state** → **path through the code** → **wrong result**.

A new lint or type suppression that hides a correctness rule is a bug.

## 3. Hunt complexity (the 3 AM test)

Read each changed piece as tired grug: 3 AM, pager ringing, no context. Ask:
**can grug understand and safely change this in 5 minutes?** If no, find why.

Complexity demon hides here:

- **Layers that hide no work.** Wrapper that only renames, factory for one type,
  interface with one implementation, file with one caller, a name for a value
  used once. Every jump between files costs every reader.
- **Two owners for one decision.** Same rule checked in two places, or policy
  copied into each caller.
- **Side effects inside decisions.** Network call inside a validator, write
  inside a getter.
- **Clever code.** Dense one-liners, nested ternaries, magic numbers, boolean
  flag that switches what a function does.
- **Code for later.** Config for one value, options nobody passes, hooks nobody
  calls.
- **New comments explaining our own code.** The code should change instead.
  Keep only legal headers, public API contracts, issue links, and behavior forced
  by a dependency we cannot change. A "do not remove" comment is a claim: check
  it, and if true, propose a test or type that enforces it.

Abstraction earns its place with three real callers or a real trust boundary.
Before that, repeating code is fine.

Chesterton's fence: ugly code may exist for a reason. Check `git log -L` or
`git blame` before calling it dead.

Simple is not short. If the clear version is longer, longer wins.

Post complexity only when you write the simpler code and say what it gives up.

## 4. Report

Bugs first, then complexity. Most important first. Five max.

Use exactly this format:

````
1. 🐛 bug: path/to/file.ts:42
   Breaks when: <input or state>
   Result: <wrong output, crash, data leak>
   Fix: <one line, or a small code block>

2. 🧹 complex: path/to/file.ts:88
   Simpler:
   ```
   <the simpler code>
   ```
   Gives up: <the tradeoff, or "nothing">
````

Nothing passes the proof rule? Write exactly: `No issues found. grug approves.`

Before sending, check each finding once:

- [ ] `file:line` exists in the diff or directly affected code
- [ ] bug has input, path, and wrong result
- [ ] complexity has simpler code and its tradeoff
- [ ] five or fewer

Stop after the report. Do not edit code. If the user wants fixes, offer to apply them.
If the review shows an open design question, suggest the spec skill.

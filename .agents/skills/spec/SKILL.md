---
name: spec
description: Size a change (simple / smol / medium / big) and write the matching spec docs - plan mode, design.md, input→proposal→design, or research→proposal→design→tasks→validation. Use when the user asks to spec, plan, design, or scope a feature or change before coding, or invokes /ds:spec.
argument-hint: "[simple|smol|medium|big] <path/to/input.md | what to change> [slug: name]"
---

# spec

Turn a change request into the smallest spec that fits its size and risk.

## Style (all docs)

- Very laconic. Simple technical English. No filler, no marketing words.
- Plain language: common words, short sentences, active voice. Say what happens, not an
  abstraction of it ("retry the download 3 times", not "add resilience").
- Explain each domain term or acronym once, on first use.
- Bullets and tables over prose. One idea per line.
- Real file paths and real type names from this repo. Read code before writing.
- Mark facts: ✅ verified in code, ⚠️ assumption, ❌ unknown.

## Design principles (proposal, design, tasks)

KISS. A tired developer must understand the design at 3 AM during an incident.

- Follow the project's existing design rules first. Read `CLAUDE.md`, `AGENTS.md`,
  `ARCHITECTURE.md` (and `docs/architecture*` if present) before designing. They win over
  the defaults below. If the change must break one, say so and ask the user.
- Pick the simplest solution that works today. No speculative design, no "for later".
- Prefer plain functions and data over patterns, layers, and frameworks. No interface
  with one implementation, no config for one value.
- Reuse what the repo already has before adding a new dependency or abstraction.
- Every complexity (new layer, pattern, cache, queue, concurrency, new dependency) must be
  justified by a real use case or domain constraint. Write it as a laconic comment next to it:
  `> Why complex: <use case / constraint>. Simpler option rejected: <option>, because <reason>.`
  The same reason goes into the code as a short comment when it is implemented.
- No justification, no complexity. Cut it.

## 1. Pick the tier

Read the code the change touches. Estimate files and modules. Pick the tier by the
**highest** matching column. State the tier and the one-line reason before writing
anything. The user can force a tier as the first argument (`/ds:spec smol ...`).

| Tier | Files | Modules | Risk | Output |
|------|-------|---------|------|--------|
| simple | 1–7 | 1 | none / minimal | plan mode, no docs |
| smol | 8–15 | 1–3 | slight, contained | `design.md` |
| medium | 15–30 | 3–7 | medium | `input.md` → `proposal.md` → `design.md` |
| big | 30+ | 7+ | high | `input.md` → `research.md` → `proposal.md` → `design.md` → `tasks.md` + `validation.md` |

Module = a top-level package or folder under the source root (e.g. `src/<pkg>/`), plus `tests/`,
`docs/`, CI, or packaging config.

## 2. Where docs go

- Argument is a path to an existing `input.md`: write all docs next to it, in its folder.
  Do not touch `input.md`.
- Argument is free text: check `docs/tasks/` in the repo.
  - It exists and is not empty: write to `docs/tasks/<YYYY-MM-DD>-<slug>/`.
  - Missing or empty: call `AskUserQuestion` before writing. Options: `docs/tasks/<YYYY-MM-DD>-<slug>/`
    in this repo (Recommended), or a separate folder the user names (via "Other").
  - Use today's date. Slug is short kebab-case.

If `docs/tasks/ledger.toml` exists, also write `task.md` (template: `templates/task.md`).
Set `parent:` when the change belongs to an umbrella task.

## 3. Tier workflows

### simple

Call `EnterPlanMode`. The plan has: goal (1 line), files to change, the steps, and
one test to add or run. No docs on disk.

### smol

1. Write `design.md` from `templates/design.md`.
2. Skip the `HITL` section.
3. `Stages`: 1–5.

### medium

Write the docs in this order. Each one reads the previous one.

1. `input.md`: the user's input, free form, copied as given. No template, no rewording.
   Skip if it already exists.
2. `proposal.md` (`templates/proposal.md`): summary (1–3 sentences), why (1–3 sentences),
   high-level overview of what changes.
3. `design.md` (`templates/design.md`) with **1–2 HITL markers**.

Stop after `proposal.md` and run the **proposal gate** (below) before writing `design.md`.

**Proposal gate**

1. Summary in chat, 3–6 bullets: what changes, why, the riskiest part. Highlight (bold)
   anything unclear, risky, or costly to change later.
2. Call `AskUserQuestion` for each open point that changes the design: the direction itself,
   every `Open decisions` item, and any ⚠️ assumption or ❌ gap that matters. 1–4 questions,
   2–4 options each, recommended option first with "(Recommended)". Skip points that have
   an obvious default; state the default instead.
3. Write the answers back to `proposal.md` (tick the decision, note the pick). Then continue.

### big

1. `input.md`: as for medium.
2. `research.md` (`templates/research.md`): existing patterns in the code, verified facts
   vs assumptions vs gaps, decision matrix. Use subagents for broad code search if needed.
3. `proposal.md`, as for medium. Run the proposal gate.
4. `design.md` with **3–5 HITL markers**.
5. `tasks.md` (`templates/tasks.md`): each task has a delegation marker (below).
6. `validation.md` (`templates/validation.md`): one block per HITL marker, with exact
   CLI commands to run or the URL to open, and the expected result.

## 4. Markers

**HITL** (human in the loop). A point where a human must check before work continues.
Put it inline at the decision it guards and list every marker in the `HITL` section:

```markdown
> **[HITL-1]** Check: <what to confirm>. Why: <risk if wrong>. How: <file / command / page>.
```

Good HITL spots: data loss or destructive ops, public API or schema changes, security
and secrets, choices between options with real trade-offs, outputs that need human taste
(e.g. LLM output quality).

**Delegation** (big tier, `tasks.md` only). One marker per task:

| Marker | Agent | Effort | Use for |
|--------|-------|--------|---------|
| `[low-dev]` | `low-dev` (haiku) | medium | 1–3 files, mechanical edits, running checks |
| `[mid-dev]` | `mid-dev` (sonnet) | medium | 4–10 files, features, refactors, unit tests |
| `[high-dev]` | `high-dev` (opus) | medium | cross-module design, hard refactors, tricky bugs |

When the tasks run later, spawn the marked agent with `effort: "medium"`. If those
agents do not exist, use a general-purpose agent with the model from the table.
Mark `[P]` when a task can run in parallel (different files, no dependency).

## 5. Finish

- Re-read every doc once. Cut any line that does not help someone implement or review.
- Check that file paths and type names exist (or are marked as new).
- Check design principles: every complex part has a `Why complex` line, or is cut.
- Report: the tier, the doc paths, the HITL list. Highlight (bold) what is unclear or
  important. Ask remaining open questions with `AskUserQuestion` (same rules as the
  proposal gate), not as prose. Do not start implementing unless the user asks.
- big tier: next step is "execute tasks.md in <folder>" (see Markers for agents and HITL stops).

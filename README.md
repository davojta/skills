# Dzianis Sheka Skills

| Skill | Description |
| --- | --- |
| [`spec`](.agents/skills/spec/SKILL.md) | Size a change (simple / smol / medium / big) and write only the spec docs that fit it. |
| [`review`](.agents/skills/review/SKILL.md) | Review a diff for proven bugs and for code a tired developer cannot follow at 3 AM. Inspired by [`grug-review`](https://github.com/stepankuzmin/skills/blob/main/.agents/skills/grug-review/SKILL.md) and [The Grug Brained Developer](https://grugbrain.dev/). |

The `grug` agent gives a simplicity second opinion and uses `review` for diffs.

## Sources

- [stepankuzmin/skills#7c3fa2c0275bcee7c1633a3ab6b0374e1a059b6e](https://github.com/stepankuzmin/skills/tree/7c3fa2c0275bcee7c1633a3ab6b0374e1a059b6e/.agents): repo layout, `cli.ts`, `grug` agent; `review` is inspired by `grug-review`

## Install

Claude Code and Codex install the whole `ds` plugin: `spec`, `review`, and the `grug` agent. Only the Skills CLI can install a single skill.

### spec only

Skills CLI:

```bash
npx skills add davojta/skills --skill spec
```

### review and grug

Skills CLI (skill only, no agent):

```bash
npx skills add davojta/skills --skill review
```

### Whole plugin

Claude Code, including the grug agent:

```bash
claude plugin marketplace add davojta/skills
claude plugin install ds@davojta
```

Codex:

```bash
codex plugin marketplace add davojta/skills
codex plugin add ds@davojta
```

### From a local clone

Pass the clone path instead of `davojta/skills`:

```console
❯ claude plugin marketplace add /Users/alex/projects/skills
✔ Successfully added marketplace: davojta (declared in user settings)

❯ claude plugin install ds@davojta
✔ Successfully installed plugin: ds@davojta (scope: user)
```

After editing a skill, refresh it:

```bash
claude plugin marketplace update davojta
claude plugin update ds@davojta
```

## Usage

### spec

```bash
/ds:spec path/to/task/input.md        # skill picks the tier
/ds:spec smol path/to/task/input.md   # force a tier: simple | smol | medium | big
/ds:spec Add retry to S3 downloader   # free text, no input file
```

With a free-form `input.md` kept outside the repo, force the `medium` tier:

```bash
/ds:spec medium /Users/alex/ai_tasks/ai-super-duper-web-service/2026-10-24-speedup-debug-tool-deployment/input.md
```

`proposal.md` and `design.md` go next to `input.md`. The skill stops after `proposal.md` to ask about open decisions.

With free text, docs go to `docs/tasks/<date>-<slug>/` if the repo already has `docs/tasks/`. If it does not, the skill asks whether to create that folder or use one you name.

### review

```bash
/ds:review                            # review the current diff
/ds:review 42                         # review PR #42
```

## Release

Bump the version in a PR. Merging it publishes the release.

```bash
npm version <patch|minor|major> --no-git-tag-version --ignore-scripts=false
```

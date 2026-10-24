# Dzianis Sheka Skills

| Skill | Description |
| --- | --- |
| [`spec`](.agents/skills/spec/SKILL.md) | Size a change (simple / smol / medium / big) and write only the spec docs that fit it. |
| [`review`](.agents/skills/review/SKILL.md) | Review a diff for proven bugs and for code a tired developer cannot follow at 3 AM. Inspired by [`grug-review`](https://github.com/stepankuzmin/skills/blob/main/.agents/skills/grug-review/SKILL.md) and [The Grug Brained Developer](https://grugbrain.dev/). |

The `grug` agent gives a simplicity second opinion and uses `review` for diffs.

## Sources

- [stepankuzmin/skills#7c3fa2c0275bcee7c1633a3ab6b0374e1a059b6e](https://github.com/stepankuzmin/skills/tree/7c3fa2c0275bcee7c1633a3ab6b0374e1a059b6e/.agents): repo layout, `cli.ts`, `grug` agent; `review` is inspired by `grug-review`

## Install

Skills CLI:

```bash
npx skills add davojta/skills
```

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

## Usage

```bash
/ds:spec path/to/task/input.md        # skill picks the tier
/ds:spec smol path/to/task/input.md   # force a tier
/ds:spec Add retry to S3 downloader   # free text → docs/tasks/<date>-<slug>/
/ds:review                            # review the current diff
/ds:review 42                         # review PR #42
```

## Release

Bump the version in a PR. Merging it publishes the release.

```bash
npm version <patch|minor|major> --no-git-tag-version --ignore-scripts=false
```

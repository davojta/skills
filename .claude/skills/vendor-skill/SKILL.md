---
name: vendor-skill
description: Adapt an external skill into this marketplace, or review upstream changes to one already adapted. Use when asked to vendor, import, adapt, mirror, or update a skill from skills.sh, `npx skills add`, or any external GitHub skills repo, especially to work around Claude Code Web only allowing one marketplace per GitHub repo name.
---

# Vendor skill

Claude Code Web can only add one marketplace per GitHub repo name (see
anthropics/claude-code#95100), so sending marketplace users to add a second
external marketplace for one skill breaks for them. Instead, the skill is
copied into `.agents/skills/`, adapted, and published as part of the `ds`
plugin.

Adapted skills are hand-written from then on. Nothing syncs them with
upstream. `## Sources` in `README.md` lists each upstream as
`<owner>/<repo>#<sha>`, the commit last reviewed, linked to the skills
directory.

This skill lives in `.claude/skills/`, not `.agents/skills/`, so it loads for
whoever works in this repo and never ships to marketplace customers. Keep it
there.

## Pull upstream into a scratch directory

`npx skills` only fetches. Never run it in this repo: it writes a lockfile and
agent symlinks there. Run it in an empty scratch directory. Always pin
`skills@latest`, since bare `skills` can resolve to a local package with no
`bin`.

```bash
npx --yes skills@latest add <owner>/<repo> --list
git ls-remote https://github.com/<owner>/<repo> HEAD
```

Pull each commit you need into its own scratch directory:

```bash
(cd <scratch>/<sha> && npx --yes skills@latest add "<owner>/<repo>#<sha>" --skill <skill> -a claude-code -y </dev/null)
```

That copies the skill to `<scratch>/<sha>/.claude/skills/<skill>/`. Without
`-a` and a closed stdin it waits on a prompt. With many `--skill` flags it has
installed every skill in the repo, so copy only the ones you asked for.

## Adapt a new skill

Check the source repo's license permits redistribution. Note any
`LICENSE`/`NOTICE` it requires you to carry, including one at the source repo
root rather than inside the skill directory.

Copy the pulled skill to `.agents/skills/<skill>/`, then read every file and
adapt it:

- Make harness-specific instructions neutral, so they work in Claude Code and
  Codex: subagent types, model names, config paths, and built-in tools of
  another harness.
- Keep only `name` and `description` in the frontmatter. Codex rejects
  `disable-model-invocation`. For an expensive skill, narrow its description to
  explicit requests instead.
- Point references to other skills at skills this plugin ships. Adapt or drop
  the rest.
- Cut anything this repo's owner doesn't use.

Append the upstream notice to `.agents/LICENSE` after a `---` line, headed by
the skills it covers and their source repo. If that source already has a
section, add the skill to its header. The root `LICENSE` never ships, so it
can't carry the notice.

The README skill table lists only the main flow, so skip it. For a new source, add
`<owner>/<repo>#<sha>` to `## Sources`, linked to the skills directory at that
commit.

## Review upstream changes

Pull the recorded commit and upstream `HEAD` into two scratch directories, then
diff them:

```bash
git diff --no-index <scratch>/<old>/.claude/skills/<skill> <scratch>/<new>/.claude/skills/<skill>
```

That diff is exactly what upstream changed. Port what fits into
`.agents/skills/<skill>/` by hand, since the local copy has diverged. Check
whether upstream changed its license. Then move the source's `#<sha>` in
`## Sources` to the new commit. It covers every skill adapted from that
source, so review them all before moving it. Upstream skills keep their names
here, and the `.agents/LICENSE` header lists which ones came from each
source.

## Sync and verify

```bash
npm run version
claude plugin validate . && claude plugin validate .agents
```

Revise the plugin description in `.claude-plugin/marketplace.json` and the
Codex `interface` block in `.agents/.codex-plugin/plugin.json` if they no
longer describe what the plugin ships. `cli.ts version` propagates the
description into both manifests. The `interface` block is by hand.

To drop an adapted skill, delete its directory and its name
in the `.agents/LICENSE` header. Once no skill from a source remains, drop its
`## Sources` entry and its license section.

# skills

A plugin marketplace. It ships one plugin, `ds`, carrying every skill and the grug agent to Claude Code and Codex.

## Layout

```
.claude-plugin/marketplace.json   Claude Code marketplace
.agents/plugins/marketplace.json  Codex marketplace
.agents/.claude-plugin/plugin.json   Claude Code manifest
.agents/.codex-plugin/plugin.json    Codex manifest
.agents/agents/<agent>.md
.agents/skills/<skill>/SKILL.md   everything the plugin ships
.claude/skills/<skill>/SKILL.md   repo maintenance, deliberately not shipped
```

Both marketplace files point at `./.agents`, the plugin root. They must otherwise agree.

## Commands

```bash
npm run version              # propagate version and description into both plugin manifests
node cli.ts check            # fail if manifests are out of date; CI and release run it
claude plugin validate .     # validate the marketplace
claude plugin validate .agents
codex plugin marketplace add .
codex plugin add ds@davojta
```

## Adding a skill

1. Create `.agents/skills/<skill>/SKILL.md`.
2. Add a row to the skill table in `README.md`.
3. Revise the plugin description in `.claude-plugin/marketplace.json` if it no longer describes what ships, then run `npm run version`.
4. Run `claude plugin validate .` and `claude plugin validate .agents`.

To adapt a skill from another repo, or review upstream changes to one already adapted, use `vendor-skill`. It lives in `.claude/skills/`, outside the plugin, so marketplace customers never receive it. Anything under `.agents/skills/` ships.

## Editing manifests

`version` and `description` in both plugin manifests, and `description` in `.agents/plugins/marketplace.json`, are generated. Set the description in `.claude-plugin/marketplace.json` and the version in `package.json`, then run `npm run version`. Never edit those two fields by hand. The Codex `interface` block is hand-written.

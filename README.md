# my-agent-kit

Personal GitHub Copilot agents and skills, portable across devices.

## Contents
- `agents/` — custom `*.agent.md` files
- `skills/` — custom skill folders (each with `SKILL.md`)
- `bin/install.mjs` — copies agents/skills into the user or a workspace

## Install on a new device
User-level (recommended, available everywhere):
```
npx github:Daryl/my-agent-kit --user
```
Workspace-level (scoped to current repo):
```
npx github:Daryl/my-agent-kit --workspace
```
Overwrite existing files: add `--force`.

## Targets
- `--user` → `~/.copilot/agents` and `~/.copilot/skills`
- `--workspace` → `./.agents/agents` and `./.agents/skills`

## Update the kit
Edit files in `agents/` or `skills/`, commit, push, then re-run install with `--force`.

# sf-agent-kit

> Portable Salesforce development agents and skills for **GitHub Copilot** and **OpenAI Codex** — install once, use anywhere.

A single source of truth for your custom AI agents and skills. Author them once, then install them into any supported tool on any device with one command.

---

## Overview

`sf-agent-kit` packages a curated set of Salesforce-focused **agents** (orchestrators and specialists) and **skills** (reusable workflows) and installs them into each tool's expected location and format:

| Asset | GitHub Copilot | OpenAI Codex |
| --- | --- | --- |
| Skills (user) | `~/.copilot/skills` | `~/.codex/skills` |
| Skills (workspace) | `./.agents/skills` | `./.codex/skills` |
| Agents (user) | all agents → `~/.copilot/agents` | SF-Agent (Skill Orch) → `~/.codex/AGENTS.md` |

Skills share the same `SKILL.md` format across both tools, so they are 100% portable. Agents differ per tool, so Copilot receives every agent while Codex receives the single orchestrator merged into its `AGENTS.md`.

## Repository structure

```text
sf-agent-kit/
├── agents/            # *.agent.md files (Copilot subagents)
├── skills/            # skill folders, each with a SKILL.md
├── bin/install.mjs    # cross-tool installer
└── package.json
```

## Quick start

Install everything to all supported tools (recommended):

```bash
npx github:Daryl-webdev/sf-agent-kit --all
```

## Usage

```bash
# Pick a specific tool
npx github:Daryl-webdev/sf-agent-kit --copilot
npx github:Daryl-webdev/sf-agent-kit --codex

# Scope to the current repository instead of the user profile
npx github:Daryl-webdev/sf-agent-kit --all --workspace

# Overwrite files that already exist
npx github:Daryl-webdev/sf-agent-kit --all --force
```

### Flags

| Flag | Description |
| --- | --- |
| `--all` | Install to Copilot and Codex (default when no tool flag is given) |
| `--copilot` | Install to GitHub Copilot only |
| `--codex` | Install to OpenAI Codex only |
| `--workspace` | Install into the current repo instead of the user home directory |
| `--force` | Overwrite existing files |

## Requirements

- Node.js >= 18

## Updating

Edit files in `agents/` or `skills/`, commit and push, then re-run the installer with `--force`:

```bash
npx github:Daryl-webdev/sf-agent-kit --all --force
```

## License

MIT

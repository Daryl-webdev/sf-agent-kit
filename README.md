# sf-agent-kit

> Portable Salesforce development agents and skills for **GitHub Copilot** and **OpenAI Codex** — install once, use anywhere.

A single source of truth for your custom AI agents and skills. Author them once, then install them into any supported tool on any device with one command.

---

## Overview

One Salesforce/React workflow, two host-specific entry points:

| Host | Start here | Execution |
| --- | --- | --- |
| GitHub Copilot | Select **SF-Agent** in the custom-agent picker | Delegates implementation, UI, Apex test authoring, and review to specialists. Plans and existing-test runs stay with the orchestrator. |
| OpenAI Codex | Ask for Salesforce/React work, or explicitly type **`$sf-orchestrator`** | The kit's `AGENTS.md` points to the skill, which applies the selected domain skill inline without spawning subagents. |

Both use the same [routing policy](skills/sf-orchestrator/references/routing.md). It classifies intent before domain: plan-only and review-only requests never edit code, run-only requests don't author tests or deploy, and test edits and deployment need explicit authorization. Tools and references are local-first. A simple task gets one owner and no full plan or automatic second review. Complex work gets one plan and is ordered by actual dependencies.

## Repository structure

```text
agents/                         # Copilot entry point and specialists
skills/sf-orchestrator/          # Codex entry point + canonical routing policy
skills/<domain>/                 # Shared workflows and on-demand examples
reference/                      # Project templates (org context, standards, plan)
bin/install.mjs                 # Installer for both hosts
```

## Install locations

| Artifact | Workspace | Personal |
| --- | --- | --- |
| Copilot agents | `.github/agents/` | `~/.copilot/agents/` |
| Shared skills | `.agents/skills/` | `~/.agents/skills/` |
| Copilot routing policy | `.agents/reference/sf-agent-routing.md` | `~/.copilot/reference/sf-agent-routing.md` |
| Codex instructions | `AGENTS.md` at the project root | `~/.codex/AGENTS.md`, or `AGENTS.md` under `$CODEX_HOME` if set |
| Project references | `.agents/reference/` | Still project-scoped: `.agents/reference/` |
| Local story history | `.agents/project/stories/` | Still project-scoped; created on the first ticketed recording |

The Codex skill is included by `--codex` and `--all`. Its copy of the policy ships inside its skill folder. A Copilot-only install does not ship the Codex entry point. If both hosts share a skills root, the Codex skill may also be visible in Copilot; select **SF-Agent** when you want delegation.

Optional org-specific Salesforce skills provide current platform mechanics only; they do not override routing, conventions, or the user's permissions. Use them only for a concrete gap in the task.

## Local story history

Recording is opt-in. **SF-Agent** and **`$sf-orchestrator`** do not ask for a ticket or write history during ordinary edits. When you are ready to record changes you or the agent already made, select **`/commit`** in Copilot or type **`$commit`** in Codex.

For example: `$commit CWDT-3094: LWC myTodoApp and Apex myTodoAppCtrl`. The skill asks for a ticket or component scope only if missing. With ticket `CWDT-3094`, the first entry goes under `.agents/project/stories/CWDT-3094/CWDT-3094_c001/`. Each affected component gets one Markdown file, such as `LWC - myTodoApp.md`, and the ticket's `solution-design.md` and `package.md` are updated. The workspace installer creates the empty story root and never replaces existing stories, even with `--force`.

For an existing component, the most recent recorded After for that ticket and component becomes the Before. If none is available, the skill records the change description and current snapshot without fabricating a Before. New components are marked as new. No Git commit or org connection is involved.

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

# Refresh kit files and replace Codex AGENTS.md
npx github:Daryl-webdev/sf-agent-kit --all --force
```

### Flags

| Flag | Description |
| --- | --- |
| `--all` | Install to Copilot and Codex (default when no tool flag is given) |
| `--copilot` | Install to GitHub Copilot only |
| `--codex` | Install to OpenAI Codex only |
| `--workspace` | Install into the current repo instead of the user home directory |
| `--force` | Refresh kit agents, skills, and routing policy. If Codex is selected, replace the entire `AGENTS.md` at the selected scope. Existing project reference files are still preserved. |
| `--sf-skills` | Also install Salesforce's official skills (`forcedotcom/sf-skills`). Bare flag opens the CLI's interactive picker; `--sf-skills=all` installs everything; `--sf-skills=a,b` installs specific skills |
| `--no-sf-skills` | Skip the sf-skills prompt entirely |
| `--no-mcp` | Skip MCP server configuration (`salesforce-dx`, `context7`, `ui-ux-pro` are configured by default for the selected tools) |

> sf-skills installs via `npx skills add forcedotcom/sf-skills`. The target agents (`github-copilot`/`codex`) are derived from your flags and sf-skills always install at project (local) scope — `.agents/skills` — never user-level. `--sf-skills=all` or `--sf-skills=a,b` add `-y` to skip all CLI prompts; the bare flag leaves selection interactive.

> MCP config is applied by default, only for the tools you selected. User scope writes VS Code's `mcp.json` + `~/.copilot/mcp-config.json` (Copilot) and `~/.codex/config.toml` (Codex); `--workspace` writes only the local `.vscode/mcp.json` (Codex has no workspace-level MCP config, so it prints a hint instead). Servers that already exist are never modified — only missing ones are added, each stamped with an `added by sf-agent-kit on <date>` comment.

## Command reference

All flags combine freely. Base command: `npx github:Daryl-webdev/sf-agent-kit`.

**Tool selection**
```bash
npx github:Daryl-webdev/sf-agent-kit              # default: Copilot + Codex
npx github:Daryl-webdev/sf-agent-kit --all        # both (explicit)
npx github:Daryl-webdev/sf-agent-kit --copilot    # Copilot only
npx github:Daryl-webdev/sf-agent-kit --codex      # Codex only
```

**Scope**
```bash
npx github:Daryl-webdev/sf-agent-kit --all                # user (~/.copilot, ~/.agents)
npx github:Daryl-webdev/sf-agent-kit --all --workspace    # this repo (.github, .agents)
```

**Refresh kit files**
```bash
npx github:Daryl-webdev/sf-agent-kit --all --force
npx github:Daryl-webdev/sf-agent-kit --copilot --workspace --force
```

**sf-skills**
```bash
npx github:Daryl-webdev/sf-agent-kit --all                  # interactive y/N prompt (default no)
npx github:Daryl-webdev/sf-agent-kit --all --no-sf-skills   # skip prompt entirely
npx github:Daryl-webdev/sf-agent-kit --all --sf-skills      # CLI interactive picker
npx github:Daryl-webdev/sf-agent-kit --all --sf-skills=all  # all sf-skills, no prompts
npx github:Daryl-webdev/sf-agent-kit --all --sf-skills=platform-apex-generate,automation-flow-generate
```

**MCP servers**
```bash
npx github:Daryl-webdev/sf-agent-kit --all            # MCP configured by default (missing servers only)
npx github:Daryl-webdev/sf-agent-kit --all --no-mcp   # don't touch MCP configs
```

**Common combinations**
```bash
npx github:Daryl-webdev/sf-agent-kit --all --force --sf-skills=all        # everything, both tools, user
npx github:Daryl-webdev/sf-agent-kit --copilot --sf-skills=all            # Copilot only + all sf-skills
npx github:Daryl-webdev/sf-agent-kit --codex --workspace --sf-skills=all  # Codex, this repo + all sf-skills
npx github:Daryl-webdev/sf-agent-kit --all --workspace --no-sf-skills --no-mcp  # both, repo-scoped, no extras
```

**npm scripts (local clone)**
```bash
npm run install:all        # --all
npm run install:copilot    # --copilot
npm run install:codex      # --codex
npm run install:workspace  # --all --workspace
```

## Requirements

- Node.js >= 18

## Updating and migrating

To refresh an existing install, use the same scope and flags with `--force`. From a local checkout, for example:

```powershell
node .\bin\install.mjs --all --force --no-mcp --no-sf-skills
```

- Back up any custom instructions you want to keep before using `--force`: when Codex is selected, the installer replaces the entire target `AGENTS.md` with a short directive to use `sf-orchestrator`. Without `--force`, an existing file is left unchanged. A Copilot-only install never writes this file.
- To replace an old user-level `.codex/AGENTS.md`, use `--force` without `--workspace`. Workspace installs write the project-root `AGENTS.md`; they do not modify the legacy `.codex/AGENTS.md` inside the project.
- Inspect old kit copies under `.agents/agents/` (workspace Copilot), `~/.copilot/skills/` (personal Copilot), and `.codex/skills/` or `~/.codex/skills/` (Codex). Archive old kit copies that collide with the new install, including an old `SF-Agent (Skill Orch).agent.md` in the Copilot agent directory. Do not delete unrelated files; legacy locations are untouched by design.
- Customize `.agents/reference/project-context.md` and `coding-standards.md` per project. The installer preserves existing files there and seeds a missing file from `.codex/reference/` if available. If both copies already exist, the `.agents/reference/` copy wins; merge any legacy customizations you still need.

## Verification

Run `npm test` for offline installer and packaging regression tests. After installing, start a fresh session in each host and use the same prompts to verify behavior:

| Prompt | Expected result |
| --- | --- |
| Plan a new LWC; do not implement it | Plan only; no writes |
| Review this LWC diff; don't fix it | Findings only; Copilot delegates to Code-Reviewer, Codex reviews inline |
| Run existing Apex tests for AccountService in the configured test org | Scoped run only; no test edits or deployment |
| Write Apex tests for AccountService; don't deploy | Apex test authoring only; report unverified coverage if not runnable |
| Write a Jest test for this LWC | Developer / developer-skills, not Apex authoring |
| Fix this one CSS rule | No ticket question or story writes; one owner and no full template or automatic second review |
| Fix this LWC for ticket CWDT-3094 | Apply the fix without recording history; supplying a ticket does not invoke `commit` |
| `$commit CWDT-3094: LWC myTodoApp` | Do not change source; reuse the last matching After or ask for a description and record only current source |
| Implement a data-model change | One shared plan; only needed references and locally unavailable live facts |

For efficiency comparisons, keep model and tools fixed, separate cold and warm sessions, and record tokens (if available), elapsed time, handoffs, and MCP calls. Offline packaging tests do not measure model routing or speed.

## License

MIT

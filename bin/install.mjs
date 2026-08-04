#!/usr/bin/env node
// Installs personal agents + skills for Copilot (~/.copilot) and Codex (~/.codex), or a workspace (./.agents, ./.codex).
import { cp, mkdir, readdir, stat, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const args = process.argv.slice(2);
const workspace = args.includes("--workspace");
const force = args.includes("--force");
const sfSkillsArg = args.find((a) => a === "--sf-skills" || a.startsWith("--sf-skills="));
const sfSkillsFlag = sfSkillsArg !== undefined;
const sfSkillsValue = sfSkillsArg && sfSkillsArg.includes("=") ? sfSkillsArg.split("=").slice(1).join("=") : "";
const noSfSkills = args.includes("--no-sf-skills");
const noMcp = args.includes("--no-mcp");

// Tool selection: default to all when none specified.
const wantCopilot = args.includes("--copilot") || args.includes("--all");
const wantCodex = args.includes("--codex") || args.includes("--all");
const noneSelected = !wantCopilot && !wantCodex;
const copilot = wantCopilot || noneSelected;
const codex = wantCodex || noneSelected;

// The single agent Codex uses (stored in its AGENTS.md).
const CODEX_AGENT = "SF-Agent (Skill Orch).agent.md";

// MCP servers the agents/skills reference; server names must match the tools frontmatter (e.g. "salesforce-dx/*").
const MCP_SERVERS = {
  "salesforce-dx": {
    command: "npx",
    args: ["-y", "@salesforce/mcp", "--orgs", "DEFAULT_TARGET_ORG", "--toolsets", "orgs,data,users,metadata,testing,code-analysis,scale-products"],
  },
  context7: { command: "npx", args: ["-y", "@upstash/context7-mcp@latest"] },
  "ui-ux-pro": { command: "npx", args: ["ui-ux-pro-mcp"] },
};

const home = homedir();
const targets = {
  copilotAgents: workspace ? resolve(process.cwd(), ".agents/agents") : join(home, ".copilot/agents"),
  copilotSkills: workspace ? resolve(process.cwd(), ".agents/skills") : join(home, ".copilot/skills"),
  // Reference is ALWAYS project-scoped (project-context.md is per-org); never user/global.
  copilotReference: resolve(process.cwd(), ".agents/reference"),
  codexSkills: workspace ? resolve(process.cwd(), ".codex/skills") : join(home, ".codex/skills"),
  codexReference: resolve(process.cwd(), ".codex/reference"),
  codexAgents: workspace ? resolve(process.cwd(), ".codex/AGENTS.md") : join(home, ".codex/AGENTS.md"),
};

async function copyTree(name, src, dest) {
  if (!existsSync(src)) return;
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src)) {
    const from = join(src, entry);
    const to = join(dest, entry);
    if (existsSync(to) && !force) {
      console.log(`skip   ${name}/${entry} (exists, use --force to overwrite)`);
      continue;
    }
    const s = await stat(from);
    await cp(from, to, { recursive: s.isDirectory() });
    console.log(`install ${name}/${entry}`);
  }
}

// Strip YAML frontmatter, returning the markdown body.
function stripFrontmatter(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return m ? text.slice(m[0].length).replace(/^\s+/, "") : text;
}

async function installCodexAgent(srcAgent, destFile) {
  if (!existsSync(srcAgent)) {
    console.log(`skip   codex/AGENTS.md (source agent missing)`);
    return;
  }
  if (existsSync(destFile) && !force) {
    console.log(`skip   codex/AGENTS.md (exists, use --force to overwrite)`);
    return;
  }
  await mkdir(dirname(destFile), { recursive: true });
  const body = stripFrontmatter(await readFile(srcAgent, "utf8"));
  await writeFile(destFile, body, "utf8");
  console.log(`install codex/AGENTS.md`);
}

// VS Code's user-level config dir (where its mcp.json lives), per platform.
function vscodeUserDir() {
  if (process.platform === "win32") return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Code", "User");
  if (process.platform === "darwin") return join(home, "Library", "Application Support", "Code", "User");
  return join(home, ".config", "Code", "User");
}

// Merge missing MCP servers into a JSON config (VS Code mcp.json or Copilot CLI mcp-config.json).
// Existing server entries are never modified; if nothing is missing the file is left untouched.
async function mergeJsonMcp(file, rootKey, extra, stamp, allowComments) {
  const label = file.startsWith(home) ? file.replace(home, "~") : file;
  let config = {};
  if (existsSync(file)) {
    const raw = await readFile(file, "utf8");
    // Fast path: if every server key is already present, leave the file completely untouched
    // (also avoids parsing JSONC files with comments just to find out there is nothing to do).
    if (Object.keys(MCP_SERVERS).every((name) => new RegExp(`"${name}"\\s*:`).test(raw))) {
      console.log(`skip   ${label} (MCP servers already present)`);
      return;
    }
    try {
      config = JSON.parse(raw);
    } catch {
      console.log(`warn   ${label} could not be parsed (comments/trailing commas?); add MCP servers manually`);
      return;
    }
  }
  const servers = (config[rootKey] ??= {});
  const added = Object.entries(MCP_SERVERS).filter(([name]) => !(name in servers));
  if (added.length === 0) {
    console.log(`skip   ${label} (MCP servers already present)`);
    return;
  }
  for (const [name, def] of added) servers[name] = { ...def, ...extra };
  if (!allowComments) config["//"] = stamp; // strict JSON: record the stamp as a harmless root key
  let text = JSON.stringify(config, null, 2) + "\n";
  if (allowComments) {
    // VS Code parses its config as JSONC, so a real comment line is safe there.
    for (const [name] of added) text = text.replace(`    "${name}": {`, `    // ${stamp}\n    "${name}": {`);
  }
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
  console.log(`mcp    ${label} + ${added.map(([n]) => n).join(", ")}`);
}

// Append missing [mcp_servers.*] blocks to Codex's config.toml. Existing blocks are never modified.
async function appendTomlMcp(file, stamp) {
  const label = file.startsWith(home) ? file.replace(home, "~") : file;
  const existing = existsSync(file) ? await readFile(file, "utf8") : "";
  const blocks = [];
  for (const [name, def] of Object.entries(MCP_SERVERS)) {
    if (existing.includes(`[mcp_servers.${name}]`)) continue;
    const argsList = def.args.map((a) => JSON.stringify(a)).join(", ");
    blocks.push(`# ${stamp}\n[mcp_servers.${name}]\ncommand = "${def.command}"\nargs = [${argsList}]\n`);
  }
  if (blocks.length === 0) {
    console.log(`skip   ${label} (MCP servers already present)`);
    return;
  }
  const sep = existing === "" ? "" : existing.endsWith("\n") ? "\n" : "\n\n";
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, existing + sep + blocks.join("\n"), "utf8");
  console.log(`mcp    ${label} + ${blocks.length} server(s)`);
}

// Configure the MCP servers the kit's agents/skills expect, for the selected tools only (default on; --no-mcp skips).
async function maybeConfigureMcp() {
  if (noMcp) return;

  const stamp = `added by sf-agent-kit on ${new Date().toISOString().slice(0, 10)}`;
  if (copilot) {
    if (workspace) {
      // Workspace install: touch only the local config (VS Code reads .vscode/mcp.json).
      await mergeJsonMcp(resolve(process.cwd(), ".vscode", "mcp.json"), "servers", { type: "stdio" }, stamp, true);
    } else {
      await mergeJsonMcp(join(vscodeUserDir(), "mcp.json"), "servers", { type: "stdio" }, stamp, true);
      await mergeJsonMcp(join(home, ".copilot", "mcp-config.json"), "mcpServers", { type: "local", tools: ["*"] }, stamp, false);
    }
  }
  if (codex) {
    if (workspace) {
      console.log("skip   codex MCP (Codex has no workspace-level MCP config; add to ~/.codex/config.toml manually)");
    } else {
      await appendTomlMcp(join(home, ".codex", "config.toml"), stamp);
    }
  }
}

// Optionally pull in Salesforce's official sf-skills via the `skills` CLI.
async function maybeInstallSfSkills() {
  if (noSfSkills) return;
  let install = sfSkillsFlag;
  if (!install && process.stdin.isTTY && process.stdout.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question("Also install Salesforce sf-skills (forcedotcom/sf-skills)? [y/N] ")).trim().toLowerCase();
    rl.close();
    install = answer === "y" || answer === "yes";
  }
  if (!install) return;
  // Map our tool flags to the `skills` CLI agent names; sf-skills always install at project (local) scope.
  const cliAgents = [];
  if (copilot) cliAgents.push("github-copilot");
  if (codex) cliAgents.push("codex");
  const agentArgs = cliAgents.flatMap((a) => ["-a", a]);
  const scopeArgs = []; // always project-level (.agents/skills), never -g

  const list = sfSkillsValue.split(",").map((s) => s.trim()).filter(Boolean);
  let selectionArgs;
  if (list.length === 0) {
    // Bare --sf-skills: let the CLI's picker handle selection (stay interactive).
    selectionArgs = [];
  } else if (list.includes("all") || list.includes("*")) {
    selectionArgs = ["--skill", "*", "-y"]; // non-interactive: every skill
  } else {
    selectionArgs = [...list.flatMap((name) => ["--skill", name]), "-y"]; // specific, non-interactive
  }

  const cmd = ["-y", "skills", "add", "forcedotcom/sf-skills", ...agentArgs, ...scopeArgs, ...selectionArgs];
  console.log(`Installing sf-skills -> npx ${cmd.join(" ")}`);
  const r = spawnSync("npx", cmd, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) console.log("warn   sf-skills install failed; run `npx skills add forcedotcom/sf-skills` manually");
}

console.log(`Installing my-agent-kit -> ${workspace ? "workspace (.agents/.codex)" : "user (~/.copilot, ~/.codex)"}`);

if (copilot) {
  await copyTree("copilot/agents", join(root, "agents"), targets.copilotAgents);
  await copyTree("copilot/skills", join(root, "skills"), targets.copilotSkills);
  await copyTree("copilot/reference", join(root, "reference"), targets.copilotReference);
}

if (codex) {
  await copyTree("codex/skills", join(root, "skills"), targets.codexSkills);
  await copyTree("codex/reference", join(root, "reference"), targets.codexReference);
  await installCodexAgent(join(root, "agents", CODEX_AGENT), targets.codexAgents);
}

await maybeConfigureMcp();

await maybeInstallSfSkills();

console.log("Done.");

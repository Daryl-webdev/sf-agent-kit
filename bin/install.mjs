#!/usr/bin/env node
// Installs Copilot agents and shared skills for Copilot and Codex.
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

const CODEX_SKILL = "sf-orchestrator";
const ROUTING_POLICY = "sf-agent-routing.md";

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
const projectRoot = process.cwd();
const targets = {
  copilotAgents: workspace ? resolve(projectRoot, ".github/agents") : join(home, ".copilot/agents"),
  skills: workspace ? resolve(projectRoot, ".agents/skills") : join(home, ".agents/skills"),
  projectReference: resolve(projectRoot, ".agents/reference"),
  legacyReference: resolve(projectRoot, ".codex/reference"),
  copilotPolicy: workspace ? resolve(projectRoot, ".agents/reference") : join(home, ".copilot/reference"),
  codexInstructions: workspace
    ? join(projectRoot, "AGENTS.md")
    : resolve(process.env.CODEX_HOME || join(home, ".codex"), "AGENTS.md"),
};

async function installCodexInstructions(file) {
  const content = `# Codex: Salesforce and React\n\nFor Salesforce or React tasks with no skill already selected, use the \`${CODEX_SKILL}\` skill and follow its routing policy. For unrelated tasks, work normally.\n`;
  await mkdir(dirname(file), { recursive: true });
  try {
    await writeFile(file, content, { encoding: "utf8", flag: force ? "w" : "wx" });
  } catch (error) {
    if (error.code !== "EEXIST" || force) throw error;
    console.log(`skip   ${file} (exists; use --force to replace)`);
    return;
  }
  console.log(`install ${file}`);
}

async function installEntry(label, src, dest, overwrite = force) {
  if (existsSync(dest) && !overwrite) {
    console.log(`skip   ${label} (exists)`);
    return;
  }
  const source = await stat(src);
  await mkdir(dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: source.isDirectory() });
  console.log(`install ${label}`);
}

async function copyTree(label, src, dest, include = () => true) {
  for (const entry of (await readdir(src)).filter(include)) {
    await installEntry(`${label}/${entry}`, join(src, entry), join(dest, entry));
  }
}

async function seedProjectReferences() {
  const referenceDir = join(root, "reference");
  for (const entry of await readdir(referenceDir)) {
    const legacy = join(targets.legacyReference, entry);
    const src = existsSync(legacy) ? legacy : join(referenceDir, entry);
    await installEntry(`reference/${entry}`, src, join(targets.projectReference, entry), false);
  }
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

console.log(`Installing sf-agent-kit -> ${workspace ? "workspace" : "user profile"}`);

if (copilot) {
  await copyTree("copilot/agents", join(root, "agents"), targets.copilotAgents, (name) => name.endsWith(".agent.md"));
  await installEntry(
    `copilot/reference/${ROUTING_POLICY}`,
    join(root, "skills", CODEX_SKILL, "references", "routing.md"),
    join(targets.copilotPolicy, ROUTING_POLICY),
  );
}

await copyTree("skills", join(root, "skills"), targets.skills, (name) => codex || name !== CODEX_SKILL);
if (codex) await installCodexInstructions(targets.codexInstructions);
await seedProjectReferences();
if (workspace) await mkdir(join(projectRoot, ".agents", "project", "stories"), { recursive: true });

await maybeConfigureMcp();

await maybeInstallSfSkills();

console.log("Done.");

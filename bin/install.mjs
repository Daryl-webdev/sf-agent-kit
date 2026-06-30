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

// Tool selection: default to all when none specified.
const wantCopilot = args.includes("--copilot") || args.includes("--all");
const wantCodex = args.includes("--codex") || args.includes("--all");
const noneSelected = !wantCopilot && !wantCodex;
const copilot = wantCopilot || noneSelected;
const codex = wantCodex || noneSelected;

// The single agent Codex uses (stored in its AGENTS.md).
const CODEX_AGENT = "SF-Agent (Skill Orch).agent.md";

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

await maybeInstallSfSkills();

console.log("Done.");

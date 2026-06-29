#!/usr/bin/env node
// Installs personal Copilot agents + skills to the user (~/.copilot) or a workspace (./.agents).
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const args = process.argv.slice(2);
const workspace = args.includes("--workspace");
const force = args.includes("--force");

const targets = workspace
  ? { agents: resolve(process.cwd(), ".agents/agents"), skills: resolve(process.cwd(), ".agents/skills") }
  : { agents: join(homedir(), ".copilot/agents"), skills: join(homedir(), ".copilot/skills") };

async function install(name, src, dest) {
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

console.log(`Installing my-agent-kit -> ${workspace ? "workspace (.agents)" : "user (~/.copilot)"}`);
await install("agents", join(root, "agents"), targets.agents);
await install("skills", join(root, "skills"), targets.skills);
console.log("Done.");

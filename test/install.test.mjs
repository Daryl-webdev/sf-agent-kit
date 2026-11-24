import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const installer = fileURLToPath(new URL("../bin/install.mjs", import.meta.url));
const sourcePolicy = readFileSync(new URL("../skills/sf-orchestrator/references/routing.md", import.meta.url));
const domains = ["apex-test", "developer-skills", "reviewing-code", "ui-developer"];
const routingFile = "sf-agent-routing.md";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "sf-agent-kit-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const cwd = join(root, "project");
  const home = join(root, "home");
  mkdirSync(cwd);
  mkdirSync(home);
  function run(...args) {
    const result = spawnSync(process.execPath, [installer, "--no-mcp", "--no-sf-skills", ...args], {
      cwd,
      env: { ...process.env, HOME: home, USERPROFILE: home },
      encoding: "utf8",
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  return { cwd, home, run };
}

function write(file, contents) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents, "utf8");
}

function assertSkills(root, includeCodex) {
  const skills = join(root, ".agents", "skills");
  for (const name of [...domains, ...(includeCodex ? ["sf-orchestrator"] : [])]) {
    const entry = readFileSync(join(skills, name, "SKILL.md"), "utf8").replaceAll("\r\n", "\n");
    assert.ok(entry.startsWith(`---\nname: ${name}\ndescription:`));
    for (const [, target] of entry.matchAll(/\]\((references\/[^)]+)\)/g)) {
      assert.ok(existsSync(join(skills, name, target)), `${name} missing ${target}`);
    }
  }
  const skillDir = join(skills, "sf-orchestrator");
  assert.equal(existsSync(skillDir), includeCodex);
  if (includeCodex) assert.deepEqual(readFileSync(join(skillDir, "references", "routing.md")), sourcePolicy);
}

test("Codex-only personal install uses the skill root and preserves standing instructions", (t) => {
  const { cwd, home, run } = fixture(t);
  const instructions = join(home, ".codex", "AGENTS.md");
  write(instructions, "# User instructions\n");
  run("--codex", "--force");
  assertSkills(home, true);
  assert.equal(readFileSync(instructions, "utf8"), "# User instructions\n");
  assert.ok(!existsSync(join(home, ".copilot", "agents")));
  assert.ok(existsSync(join(cwd, ".agents", "reference", "project-context.md")));
});

test("Copilot-only personal install adds agents and policy, not the Codex skill", (t) => {
  const { home, run } = fixture(t);
  run("--copilot");
  assertSkills(home, false);
  assert.ok(existsSync(join(home, ".copilot", "agents", "SF-Agent.agent.md")));
  assert.deepEqual(readFileSync(join(home, ".copilot", "reference", routingFile)), sourcePolicy);
  assert.ok(!existsSync(join(home, ".codex", "AGENTS.md")));
});

test("combined workspace installs refresh kit files while preserving or migrating project references", (t) => {
  const { cwd, home, run } = fixture(t);
  const reference = join(cwd, ".agents", "reference");
  const policy = join(reference, routingFile);
  const agents = join(cwd, ".github", "agents");
  const instructions = join(cwd, ".codex", "AGENTS.md");
  write(instructions, "# Existing workspace instructions\n");
  write(join(cwd, ".codex", "reference", "project-context.md"), "Legacy org facts\n");
  write(join(reference, "coding-standards.md"), "Current project conventions\n");
  run("--all", "--workspace");
  assertSkills(cwd, true);
  assert.ok(existsSync(join(agents, "SF-Agent.agent.md")));
  assert.ok(!existsSync(join(agents, "SF-Agent (Skill Orch).agent.md")));
  write(policy, "local policy edit");
  run("--all", "--workspace");
  assert.equal(readFileSync(policy, "utf8"), "local policy edit");
  run("--all", "--workspace", "--force");
  assert.deepEqual(readFileSync(policy), sourcePolicy);
  assert.equal(readFileSync(join(reference, "project-context.md"), "utf8"), "Legacy org facts\n");
  assert.equal(readFileSync(join(reference, "coding-standards.md"), "utf8"), "Current project conventions\n");
  assert.equal(readFileSync(instructions, "utf8"), "# Existing workspace instructions\n");
  assert.ok(!existsSync(join(home, ".agents")));
});

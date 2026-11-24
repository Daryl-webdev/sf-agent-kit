import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../skills/commit/scripts/record.mjs", import.meta.url));
const jsPath = "force-app/main/default/lwc/myTodoApp/myTodoApp.js";
const htmlPath = "force-app/main/default/lwc/myTodoApp/myTodoApp.html";
const ticket = "CWDT-1111";
const storyRoot = [".agents", "project", "stories"];
const newSource = [
  'import { LightningElement } from "lwc";',
  "export default class MyTodoApp extends LightningElement {",
  "  tasks = [];",
  "  title = 'My tasks';",
  "  completed = 0;",
  "}",
  "// Unrelated footer",
];
const replacement = {
  beforeLine: 1,
  afterLine: 1,
  lines: [
    ` ${newSource[0]}`,
    ` ${newSource[1]}`,
    ` ${newSource[2]}`,
    "-  title = 'Tasks';",
    `+${newSource[3]}`,
    ` ${newSource[4]}`,
    ` ${newSource[5]}`,
    ` ${newSource[6]}`,
  ],
};

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "sf-agent-kit-commit-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const cwd = join(root, "workspace with spaces");
  const stories = join(cwd, ...storyRoot);
  const ticketDir = join(stories, ticket);
  const input = {
    ticket,
    description: "Rename the list title.",
    components: [{ type: "LWC", apiName: "myTodoApp", files: [{ path: jsPath, hunks: [structuredClone(replacement)] }] }],
  };
  function write(path, text) {
    const file = join(cwd, ...path.split("/"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  function run(payload = input) {
    const result = spawnSync(process.execPath, [script, cwd], { input: JSON.stringify(payload), encoding: "utf8" });
    assert.ifError(result.error);
    return result;
  }
  write("sfdx-project.json", '{"sourceApiVersion":"65.0"}');
  write(jsPath, `${newSource.join("\r\n")}\r\n`);
  write(htmlPath, "<template>Unchanged HTML</template>\n");
  return { root, cwd, stories, ticketDir, input, write, run };
}

test("records only the changed JS with exact line anchors, two context lines, and a copy-ready package", (t) => {
  const { cwd, ticketDir, run } = fixture(t);
  const result = run();
  const id = `${ticket}_c001`;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), `.agents/project/stories/${ticket}/${id}`);
  assert.deepEqual(readdirSync(join(ticketDir, id)), ["LWC - myTodoApp.md"]);
  const snapshot = readFileSync(join(ticketDir, id, "LWC - myTodoApp.md"), "utf8");
  const context = newSource.slice(1, 6).join("\n");
  assert.equal(snapshot, [
    `## Before\n\n### ${jsPath} (line 4)\n\n\`\`\`js\n${context.replace("My tasks", "Tasks")}\n\`\`\``,
    `## After\n\n### ${jsPath} (line 4)\n\n\`\`\`js\n${context}\n\`\`\`\n`,
  ].join("\n\n"));
  assert.match(readFileSync(join(ticketDir, "solution-design.md"), "utf8"), /## CWDT-1111_c001\n\nRename the list title\./);
  const packageNotes = readFileSync(join(ticketDir, "package.md"), "utf8");
  assert.equal(packageNotes.match(/```xml\n([\s\S]*?)\n```/)?.[1], [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
    "    <types>",
    "        <members>myTodoApp</members>",
    "        <name>LightningComponentBundle</name>",
    "    </types>",
    "    <version>65.0</version>",
    "</Package>",
  ].join("\n"));
  assert.equal(readFileSync(join(cwd, ...jsPath.split("/")), "utf8"), `${newSource.join("\r\n")}\r\n`);
});

test("rejects mismatched current lines or context before any story write", (t) => {
  const { stories, input, run } = fixture(t);
  const rows = input.components[0].files[0].hunks[0].lines;
  rows[4] = "+  title = 'Stale change';";
  const stale = run();
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Stale or unverifiable hunk/);
  assert.equal(stale.stdout, "");
  assert.ok(!existsSync(stories));
  rows[4] = replacement.lines[4];
  rows[2] = "   tasks = workFromAnOlderEdit;";
  const staleContext = run();
  assert.equal(staleContext.status, 1);
  assert.match(staleContext.stderr, /Stale or unverifiable hunk/);
  assert.ok(!existsSync(stories));
});

test("preserves history, handles insertion and deletion regions, and combines multiple files per member", (t) => {
  const { ticketDir, input, write, run } = fixture(t);
  const ticketPath = `.agents/project/stories/${ticket}`;
  const previousSnapshot = `${ticket}_c009/LWC - myTodoApp.md`;
  write(`${ticketPath}/${previousSnapshot}`, "Keep previous change.\n");
  for (const name of ["solution-design.md", "package.md"]) write(`${ticketPath}/${name}`, "Keep notes.");
  const apexPath = "force-app/main/default/classes/Todo.cls";
  const apexMetaPath = `${apexPath}-meta.xml`;
  write(apexPath, ["visible", "added", "keep", "keep2", "keep3", "spacer", "tail", ""].join("\n"));
  write(apexMetaPath, "<status>Active</status>\n");
  input.apiVersion = "64.0";
  input.components.push({ type: "Apex", apiName: "Todo", files: [
    { path: apexPath, hunks: [
      { beforeLine: 1, afterLine: 1, lines: [" visible", "+added", " keep", " keep2", " keep3", "-removed", " spacer"] },
      { beforeLine: 7, afterLine: 7, lines: ["-old tail", "+tail"] },
    ] },
    { path: apexMetaPath, hunks: [{ beforeLine: 1, afterLine: 1, lines: ["-<status>Deprecated</status>", "+<status>Active</status>"] }] },
  ] });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /_c010/);
  assert.equal(readFileSync(join(ticketDir, ...previousSnapshot.split("/")), "utf8"), "Keep previous change.\n");
  assert.match(readFileSync(join(ticketDir, "solution-design.md"), "utf8"), /^Keep notes\.\n\n## CWDT-1111_c010/);
  const snapshot = readFileSync(join(ticketDir, `${ticket}_c010`, "Apex - Todo.md"), "utf8");
  assert.match(snapshot, /\(line 2\)\n\n```apex\nvisible\nkeep\nkeep2\nkeep3\nremoved\nspacer\n```/);
  assert.match(snapshot, /\(line 2\)\n\n```apex\nvisible\nadded\nkeep\nkeep2\nkeep3\nspacer\n```/);
  assert.match(snapshot, /\(line 7\)\n\n```apex\ntail\n```/);
  const packageNotes = readFileSync(join(ticketDir, "package.md"), "utf8");
  assert.match(packageNotes, /^Keep notes\.\n\n## CWDT-1111_c010/);
  assert.equal(packageNotes.match(/<members>Todo<\/members>/g)?.length, 1);
  assert.match(packageNotes, /<name>ApexClass<\/name>/);
  assert.match(packageNotes, /<version>64\.0<\/version>/);
});

test("does not write through invalid paths or a linked story root", (t) => {
  const { root, stories, input, run } = fixture(t);
  const outside = join(root, "outside");
  mkdirSync(outside);
  const invalid = run({ ...input, ticket: "..\\outside" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /valid ticket/);
  assert.ok(!existsSync(stories));

  mkdirSync(dirname(stories), { recursive: true });
  symlinkSync(outside, stories, process.platform === "win32" ? "junction" : "dir");
  const linked = run();
  assert.equal(linked.status, 1);
  assert.match(linked.stderr, /without links/);
  assert.deepEqual(readdirSync(outside), []);
});

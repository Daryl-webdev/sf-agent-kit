import { appendFileSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const storyPath = [".agents", "project", "stories"];
const reserved = /^(?:con|prn|aux|nul|(?:com|lpt)[1-9\u00b9\u00b2\u00b3])(?:\.|$)/i;
const metadataTypes = { Apex: "ApexClass", LWC: "LightningComponentBundle" };

function requireInput(condition, message) {
  if (!condition) throw new Error(message);
}

function segments(path) {
  requireInput(typeof path === "string", "Expected a workspace-relative path.");
  const parts = path.split(/[\\/]/);
  requireInput(parts.every((part) => part && !/[<>:"|?*\x00-\x1f]|[. ]$/.test(part) && !reserved.test(part)),
    "Invalid workspace-relative path.");
  return parts;
}

function entry(path, directory) {
  const info = lstatSync(path, { throwIfNoEntry: false });
  if (info) {
    requireInput(!info.isSymbolicLink() && (directory ? info.isDirectory() : info.isFile()),
      `Expected a ${directory ? "directory" : "regular file"} without links: ${path}`);
  }
  return info;
}

function directoryPath(root, parts, create = false) {
  let path = root;
  for (const part of parts) {
    path = join(path, part);
    if (!entry(path, true)) {
      if (!create) return undefined;
      try {
        mkdirSync(path);
      } catch (error) {
        if (error.code !== "EEXIST" || !entry(path, true)) throw error;
      }
    }
  }
  return path;
}

function readLocal(root, parts) {
  const parent = directoryPath(root, parts.slice(0, -1));
  const name = parts.at(-1);
  requireInput(parent, `Directory not found for ${parts.join("/")}.`);
  const path = join(parent, name);
  requireInput(entry(path, false), `File not found: ${parts.join("/")}.`);
  return readFileSync(path, "utf8");
}

function sourceLines(source) {
  const lines = source.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

function fence(text, language) {
  let size = 3;
  for (const [run] of text.matchAll(/`+/g)) size = Math.max(size, run.length + 1);
  const delimiter = "`".repeat(size);
  return `${delimiter}${language}\n${text}\n${delimiter}`;
}

function excerptWindows(lines, edits, side) {
  const windows = [];
  for (const edit of edits) {
    const start = edit[side];
    const count = edit[`${side}Count`];
    const window = {
      start: Math.max(0, start - 2),
      end: Math.min(lines.length, start + count + 2),
      anchor: Math.min(start, lines.length - 1),
    };
    const previous = windows.at(-1);
    if (previous && window.start < previous.end) previous.end = Math.max(previous.end, window.end);
    else windows.push(window);
  }
  return windows;
}

function formatHunks(path, current, hunks, language) {
  requireInput(Array.isArray(hunks) && hunks.length, `No verified hunks for ${path}.`);
  const excerpts = { before: [], after: [] };
  let delta = 0;
  let nextAfter = 1;
  for (const { beforeLine, afterLine, lines } of hunks) {
    requireInput(Number.isSafeInteger(beforeLine) && beforeLine > 0 &&
      Number.isSafeInteger(afterLine) && afterLine >= nextAfter &&
      beforeLine === afterLine + delta &&
      Array.isArray(lines) && lines.length, `Invalid or out-of-order hunk for ${path}.`);

    const sides = { before: [], after: [] };
    const edits = [];
    let active;
    for (const row of lines) {
      requireInput(typeof row === "string" && /^[ +\-]/.test(row) && !/[\r\n]/.test(row), `Invalid hunk row for ${path}.`);
      const sign = row[0];
      if (sign === " ") active = undefined;
      else if (!active) {
        active = { before: sides.before.length, after: sides.after.length, beforeCount: 0, afterCount: 0 };
        edits.push(active);
      }
      for (const [side, skipped] of [["before", "+"], ["after", "-"]]) {
        if (sign === skipped) continue;
        sides[side].push(row.slice(1));
        if (active) active[`${side}Count`]++;
      }
    }

    requireInput(edits.length && edits.every((edit) =>
      !edit.beforeCount || !edit.afterCount ||
      edit.beforeCount !== edit.afterCount ||
      sides.before.slice(edit.before, edit.before + edit.beforeCount)
        .some((line, index) => line !== sides.after[edit.after + index])),
    `Hunk does not contain a source change for ${path}.`);
    const offset = afterLine - 1;
    requireInput(offset + sides.after.length <= current.length &&
      (sides.after.length || !current.length) &&
      sides.after.every((line, index) => line === current[offset + index]),
    `Stale or unverifiable hunk for ${path} at line ${afterLine}. No story written.`);

    for (const [side, first] of [["before", beforeLine], ["after", afterLine]]) {
      for (const window of excerptWindows(sides[side], edits, side)) {
        const text = sides[side].slice(window.start, window.end).join("\n");
        const body = window.end > window.start ? fence(text, language) : "_No lines on this side._";
        excerpts[side].push(`### ${path} (line ${first + Math.max(0, window.anchor)})\n\n${body}`);
      }
    }
    nextAfter = afterLine + Math.max(1, sides.after.length);
    delta += sides.before.length - sides.after.length;
  }
  return excerpts;
}

function sourceLanguage(parts, type, apiName) {
  const name = parts.at(-1);
  if (type === "Apex" && parts.at(-2) === "classes") {
    if (name === `${apiName}.cls`) return "apex";
    if (name === `${apiName}.cls-meta.xml`) return "xml";
  }
  if (type === "LWC" && parts.at(-3) === "lwc" && parts.at(-2) === apiName) {
    if (name === `${apiName}.js-meta.xml` || name.endsWith(".svg")) return "xml";
    const extension = name.split(".").at(-1);
    if (["js", "html", "css"].includes(extension) && !/\.(?:test|spec)\.js$/i.test(name)) return extension;
  }
  throw new Error("The fast path supports only in-place edits to confirmed LWC or Apex component files.");
}

function prepareSnapshots(root, components) {
  requireInput(Array.isArray(components) && components.length, "Expected confirmed components.");
  const snapshots = new Map();
  const paths = new Set();
  const members = new Map();
  for (const { type, apiName, files } of components) {
    requireInput(Object.hasOwn(metadataTypes, type) && typeof apiName === "string" && /^[A-Za-z][A-Za-z0-9_]*$/.test(apiName),
      "Expected LWC or Apex and a confirmed component API name.");
    requireInput(Array.isArray(files) && files.length, `No changed files for ${apiName}.`);
    const name = `${type} - ${apiName}.md`;
    const key = name.toLowerCase();
    requireInput(!snapshots.has(key), `Duplicate component: ${apiName}.`);
    const before = [];
    const after = [];
    for (const { path, hunks } of files) {
      const parts = segments(path);
      const display = parts.join("/");
      const pathKey = display.toLowerCase();
      requireInput(!paths.has(pathKey), `Duplicate file: ${display}.`);
      const language = sourceLanguage(parts, type, apiName);
      const excerpts = formatHunks(display, sourceLines(readLocal(root, parts)), hunks, language);
      before.push(...excerpts.before);
      after.push(...excerpts.after);
      paths.add(pathKey);
    }
    snapshots.set(key, { name, text: `## Before\n\n${before.join("\n\n")}\n\n## After\n\n${after.join("\n\n")}\n` });
    const metadataType = metadataTypes[type];
    if (!members.has(metadataType)) members.set(metadataType, []);
    members.get(metadataType).push(apiName);
  }
  return { snapshots, members };
}

function manifest(version, members) {
  // API names and the version are validated against XML-safe character sets.
  const types = Array.from(members.keys()).sort().map((type) => [
    "    <types>",
    ...members.get(type).sort().map((name) => `        <members>${name}</members>`),
    `        <name>${type}</name>`,
    "    </types>",
  ].join("\n"));
  return fence([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
    ...types,
    `    <version>${version}</version>`,
    "</Package>",
  ].join("\n"), "xml");
}

function reserveChange(ticketDir, ticket) {
  const prefix = `${ticket}_c`.toLowerCase();
  for (;;) {
    let highest = 0n;
    for (const name of readdirSync(ticketDir)) {
      const number = name.slice(prefix.length);
      if (name.toLowerCase().startsWith(prefix) && /^[0-9]{3,}$/.test(number) && BigInt(number) > highest) {
        highest = BigInt(number);
      }
    }
    const id = `${ticket}_c${String(highest + 1n).padStart(3, "0")}`;
    const path = join(ticketDir, id);
    try {
      mkdirSync(path);
      return { id, path };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
}

function notePath(ticketDir, name) {
  const path = join(ticketDir, name);
  const info = entry(path, false);
  requireInput(!info || info.nlink === 1, `Cannot append to a linked story note: ${path}`);
  return path;
}

function record(root, { ticket, description, rationale, verification, apiVersion, components }) {
  requireInput(typeof ticket === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(ticket) && !reserved.test(ticket),
    "Expected a valid ticket number.");
  requireInput(typeof description === "string" && description.trim(), "Expected a change description.");
  requireInput([rationale, verification].every((note) => note === undefined || typeof note === "string"),
    "Rationale and verification must be text when supplied.");

  const { snapshots, members } = prepareSnapshots(root, components);
  const version = apiVersion ?? JSON.parse(readLocal(root, ["sfdx-project.json"]).replace(/^\uFEFF/, "")).sourceApiVersion;
  requireInput(typeof version === "string" && /^[0-9]+\.[0-9]+$/.test(version), "A confirmed Salesforce API version is required.");
  const xml = manifest(version, members);
  const design = [description.trim(),
    rationale?.trim() && `Rationale: ${rationale.trim()}`,
    verification?.trim() && `Verification: ${verification.trim()}`].filter(Boolean).join("\n\n");

  const ticketDir = directoryPath(root, [...storyPath, ticket], true);
  const designFile = notePath(ticketDir, "solution-design.md");
  const packageFile = notePath(ticketDir, "package.md");
  const { id, path } = reserveChange(ticketDir, ticket);
  const result = relative(root, path).split(/[\\/]/).join("/");
  try {
    for (const { name, text } of snapshots.values()) writeFileSync(join(path, name), text, { flag: "wx" });
    appendFileSync(designFile, `\n\n## ${id}\n\n${design}\n`);
    appendFileSync(packageFile, `\n\n## ${id}\n\n${xml}\n`);
  } catch (error) {
    throw new Error(`Story write incomplete at ${result}; inspect it before retrying. ${error.message}`);
  }
  return result;
}

try {
  const workspace = realpathSync(process.argv[2] ?? process.cwd());
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  console.log(record(workspace, input));
} catch (error) {
  console.error(`commit: ${error.message}`);
  process.exitCode = 1;
}

---
name: commit
description: "Save already-made local workspace changes as ticketed Salesforce component snapshots. Run only when explicitly invoked. Does not create a Git commit."
disable-model-invocation: true
---

# Commit to Local Story History

When the user selects this skill, follow the steps below directly. Do not check which agent is active, read other instruction files, load another skill, or delegate. Never edit source files, copy secrets, use MCP, or stage, commit, or push anything in Git.

## Record the change

1. If the user says there is no ticket, stop without writing. If the ticket number is missing, ask **DO you have ticket for this?** and request the number if Yes. Ask for the affected components or workspace root if not clear. Use the provided details without asking again. If component names, paths, or API names are ambiguous, ask instead of recording unrelated dirty files.
2. Identify exactly which files and lines changed from a supplied diff, edits observed in the session, or a verified prior **After** for the same ticket and file. Do not substitute Git HEAD, another ticket's history, or a guessed baseline. With a verified diff or observed edits already in context, prefer the fast path below; do not read source or ticket files first just to repeat the script's checks.
3. Otherwise use the manual workflow below. Read only affected source, relevant ticket history, and the local manifest or project metadata needed for the package version. A prior excerpt establishes only the lines it contains. If Before is unavailable for an existing file, ask for a description and the changed lines or locations unless already supplied, then record the description and After only. For confirmed new or deleted files, record only the known side and mark the other side absent. If the changed scope cannot be established, ask before writing.

## Fast path: known edits to existing LWC or Apex files

Call [record.mjs](./scripts/record.mjs) once; resolve its path relative to this installed `SKILL.md`. Run `node "<resolved script path>" "<workspace root>"` and pipe the JSON below to its stdin as UTF-8. In Windows PowerShell, set `$OutputEncoding = [System.Text.UTF8Encoding]::new($false)` and pipe a single-quoted here-string containing the JSON. Do not create a payload file or read the script first.

```json
{
  "ticket": "CWDT-3094",
  "description": "Rename the to-do list title.",
  "components": [{
    "type": "LWC",
    "apiName": "myTodoApp",
    "files": [{
      "path": "force-app/main/default/lwc/myTodoApp/myTodoApp.js",
      "hunks": [{
        "beforeLine": 2,
        "afterLine": 2,
        "lines": [
          " export default class MyTodoApp extends LightningElement {",
          "   tasks = [];",
          "-  title = 'Tasks';",
          "+  title = 'My tasks';",
          "   completed = 0;",
          " }"
        ]
      }]
    }]
  }]
}
```

- Use `LWC` or `Apex` and list only changed physical files. Send ordered, non-overlapping hunks with 1-based start lines for the first supplied row on each side. Rows start with a space for verified context, `-` for Before, or `+` for After. Include up to two verified unchanged lines on either side; combine nearby changes in one hunk if their context overlaps. Do not invent source or context. If a hunk removes lines without adding any, include verified After context unless the file is now empty.
- Include optional `rationale` and `verification` only when known. Set `apiVersion` when the intended manifest's version is known; otherwise the helper uses `sfdx-project.json`. If a particular manifest is intended but its version is unknown, resolve that version first.
- Report the returned story path only on success. On stale evidence, refresh or ask before retrying. For unsupported changes (including new/deleted files or other metadata), use the manual workflow. On a permission error or incomplete write, report the blocker; do not retry blindly or switch to manual writes.

## Manual workflow: write the story

Use this layout under the current workspace. Ask if the workspace root is ambiguous.

```text
.agents\project\stories\
  CWDT-3094\
    solution-design.md
    package.md
    CWDT-3094_c001\
      LWC - myTodoApp.md
      Apex - myTodoAppCtrl.md
```

1. Use the supplied ticket and confirmed component API names. Validate ticket and snapshot names as single path segments; reject traversal, absolute paths, reserved names, and links that escape the workspace or story root. If two components would produce the same filename, ask how to disambiguate them.
2. Prepare all snapshots and note updates before creating the numbered folder. Start at `<TicketNumber>_c001` or use the highest existing number plus one, padded to at least three digits. Reserve the folder without overwriting an existing one; if it already exists, rescan and try the next number. Do not change past snapshots.
3. Write one `<component type> - <apiName>.md` per affected component. Include only files that actually changed: a JS-only LWC change does not include its HTML or metadata XML; an Apex source-only change does not include its metadata XML. Format the excerpts as described below.
4. Create or append to the ticket's `solution-design.md` and `package.md`, with a section keyed by the change folder in each. In the design notes, record the change description, known rationale, and verification actually performed. In the package notes, add one copy-ready manifest as described below. Keep these notes out of the numbered folder.
5. Report the resulting change folder only if the required writes succeeded. Use local tools and write only beneath the story root. If permissions prevent the writes, report the blocker. Do not copy secrets or unrelated files, use MCP, or stage, commit, or push anything in Git.

## Snapshot excerpts

- Put verified old excerpts under `## Before` and current excerpts under `## After`. For each changed region, show the original source lines verbatim: the changed lines plus at most two unchanged lines before and two after in that version. Use fewer at file boundaries or when fewer lines are known. Merge overlapping windows; leave separate regions separate. Do not insert diff signs, ellipses, or line-number prefixes inside the source fence.
- Use `### <workspace-relative path> (line <number>)` above each fenced excerpt. Use forward slashes in the displayed path and the actual 1-based first changed line in that version, not the first context line. For a pure insertion or deletion, use the adjacent line as the anchor on the side without changed lines. Use a fence long enough to preserve any fences in the source.
- If an existing file has no Before, omit its Before excerpt and mark `<!-- Before unavailable; recording current excerpt only. -->` beside its After. For a new file, label its After with `<!-- New file; no Before snapshot. -->`. For a deleted file, mark it absent under After; if old source is unavailable, say so.

Example: a one-line change on line 4.

## Before

### force-app/main/default/lwc/myTodoApp/myTodoApp.js (line 4)

```js
export default class MyTodoApp extends LightningElement {
  tasks = [];
  title = 'Tasks';
  completed = 0;
}
```

## After

### force-app/main/default/lwc/myTodoApp/myTodoApp.js (line 4)

```js
export default class MyTodoApp extends LightningElement {
  tasks = [];
  title = 'My tasks';
  completed = 0;
}
```

## Copy-ready package manifest

In each change's `package.md` section, put the complete `package.xml` document in one `xml` code fence, with no Markdown or explanatory text inside it. Deduplicate members, group them by their real Salesforce Metadata API type, and XML-escape names as needed. List an LWC bundle once as `LightningComponentBundle` even if only its JS changed, and Apex classes as `ApexClass`; use exact deployable full names. Get `<version>` from the intended local manifest or the project's `sfdx-project.json` (`sourceApiVersion`); ask if unavailable or ambiguous. Note fully deleted components and non-deployable files outside the XML block. A deletion of a constituent file does not exclude the surviving component. Do not generate a deployment file or deploy anything.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>myTodoAppCtrl</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>myTodoApp</members>
        <name>LightningComponentBundle</name>
    </types>
    <version>65.0</version>
</Package>
```

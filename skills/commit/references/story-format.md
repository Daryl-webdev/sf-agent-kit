# Local Story Format

```text
.agents\project\stories\
  CWDT-3094\
    solution-design.md
    package.md
    CWDT-3094_c001\
      LWC - myTodoApp.md
      Apex - myTodoAppCtrl.md
```

## Allocate a change directory

- Use the ticket exactly as supplied. It and each snapshot filename must be safe single path segments; reject traversal, absolute paths, reserved names, or paths that leave the workspace. Do not follow links out of the story root or source workspace.
- Create the ticket folder if missing. Read that ticket's existing change directories; only names matching `<TicketNumber>_c` followed by at least three decimal digits count. Allocate the highest existing number plus one, zero-padded to at least three digits; start at `c001` when there are none. Do not fill gaps or reuse earlier entries.
- Determine the snapshot content and doc updates before reserving the change directory. Create the numbered directory exclusively (without replacing an existing folder); if it now exists, rescan and try the next available number. Do not modify any past change directory. Do not report success if a required write fails.

## Write one Markdown snapshot per component

- Name it `<component type> - <apiName>.md`, not one file per physical source file. Group the LWC bundle's constituent files or the Apex class and its metadata together. Use the component API name, not its label. If two distinct components would produce the same filename, ask how to disambiguate them.
- For an existing component with a verified baseline, use `## Before` and `## After`. Under each, label each constituent file with its workspace-relative path and put its full contents in a fenced block. Use fences long enough to preserve any fences in the source. Keep the code verbatim, not a diff, summary, or excerpt. Mark files not present in one version as absent.
- For a new component, add `<!-- New component; no Before snapshot. -->` and only `## After` with the complete component. When an existing manually edited component has no usable prior After, add `<!-- Before unavailable; recording current snapshot only. -->` and only `## After`. Record a confirmed deletion as absent in `## After`; never recreate deleted source to take a snapshot.
- The numbered folder contains only component snapshots. Keep descriptions, deployment scope, rationale, and verification in the ticket-level docs.

## Update the ticket docs

- Create `solution-design.md` and `package.md` if missing. Preserve existing material and add a section keyed by the new change directory to each.
- In `solution-design.md`, record what changed, the design decision or rationale when known, and the verification actually performed. For manual changes with no Before, record the supplied description here. Never invent rationale or verification.
- In `package.md`, list the component types and API names recorded for the change, including removals when applicable. Keep it a Markdown list, not a deployment or an XML manifest.

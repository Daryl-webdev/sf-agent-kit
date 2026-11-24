---
name: commit
description: "Save already-made local workspace changes as ticketed Salesforce component snapshots. Run only when explicitly invoked. Does not create a Git commit."
disable-model-invocation: true
---

# Commit to Local Story History

When the user selects this skill, follow the steps below directly. Do not check which agent is active, read other instruction files, load another skill, or delegate. Read only the affected source and relevant ticket history. Never edit source files.

## Record the change

1. If the user says there is no ticket, stop without writing. If the ticket number is missing, ask **DO you have ticket for this?** and request the number if Yes. Ask for the affected components if not supplied. Use the provided details without asking again. If component names, paths, or API names are ambiguous, ask instead of recording unrelated dirty files.
2. For each component, inspect the newest recorded **After** for that same ticket and component, going back through its numbered history as needed. Use it as Before only if it is an identifiable source snapshot. Never substitute Git HEAD, another ticket's history, or a guessed baseline. If no usable prior After exists for an existing component, ask for a description of what changed unless it was already supplied. Record that description in `solution-design.md` and log only the current source snapshot; do not invent Before.
3. For a confirmed new component, record all its constituent source files as the After and mark it new. If prior history cannot establish whether the component is new, rely on confirmed user scope or local evidence; ask if uncertain.

## Write the story

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
3. Write only one `<component type> - <apiName>.md` per affected component, grouping its constituent files. Use `## Before` and `## After` when both are known. Label each file by its workspace-relative path and preserve its full contents in a code fence long enough to contain the source. Mark absent files as absent. For a new component, use `<!-- New component; no Before snapshot. -->` and only `## After`. If Before is unavailable, use `<!-- Before unavailable; recording current snapshot only. -->` and only `## After`. For a confirmed deletion, mark the component absent in `## After` without recreating it.
4. Create or append to the ticket's `solution-design.md` and `package.md`, with a section keyed by the change folder in each. In the design notes, record the change description, known rationale, and verification actually performed. In the package notes, list component types and API names, including removals. Keep these notes out of the numbered folder.
5. Report the resulting change folder only if the required writes succeeded. Use local tools and write only beneath the story root. If permissions prevent the writes, report the blocker. Do not copy secrets or unrelated files, use MCP, or stage, commit, or push anything in Git.

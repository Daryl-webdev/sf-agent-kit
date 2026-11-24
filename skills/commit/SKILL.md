---
name: commit
description: "Save already-made local workspace changes as ticketed Salesforce component snapshots. Run only when explicitly invoked. Does not create a Git commit."
disable-model-invocation: true
---

# Commit to Local Story History

Only run this workflow when explicitly invoked as `/commit` in Copilot or `$commit` in Codex. It records edits the user or agent already made; never edit source files. Store history under `.agents\project\stories` in the current workspace. Resolve the actual workspace root; ask if there are multiple plausible roots. Read [Story format](references/story-format.md) before recording.

## Record the change

1. If the user says there is no ticket, stop without writing. If the ticket number is missing, ask **DO you have ticket for this?** and request the number if Yes. Ask for the affected components if not supplied. Use the provided details without asking again. If component names, paths, or API names are ambiguous, ask instead of recording unrelated dirty files.
2. For each component, inspect the newest recorded **After** for that same ticket and component, going back through its numbered history as needed. Use it as Before only if it is an identifiable source snapshot. Never substitute Git HEAD, another ticket's history, or a guessed baseline. If no usable prior After exists for an existing component, ask for a description of what changed unless it was already supplied. Record that description in `solution-design.md` and log only the current source snapshot; do not invent Before.
3. For a confirmed new component, record all its constituent source files as the After and mark it new. If prior history cannot establish whether the component is new, rely on confirmed user scope or local evidence; ask if uncertain.

## Finish

Ensure each snapshot uses the confirmed ticket and component scope. Create or update both story docs as described in the format reference, and report the resulting change directory. Use local file tools only; do not use MCP, stage files, run `git commit`, or push. Never copy secrets, private keys, or unrelated contents into a story. If a snapshot cannot be captured safely or completely, report the gap rather than claiming it was recorded.

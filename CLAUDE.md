@AGENTS.md

## Claude Code

- All project rules are in `AGENTS.md` (imported above) so every AI tool shares one source. Add rules there, not here. This section is only for things specific to Claude Code.
- Use the installed `shadcn` skill whenever adding, composing, or styling shadcn/ui components.
- Edits to `SPEC.md` trigger a permission prompt (an `ask` rule in `.claude/settings.json`). That prompt is the owner's second confirmation. Never work around it with shell commands or scripts.
- When a task is done, stop and summarize: what was done, what was found, what needs a decision. Do not start another task in the same turn.
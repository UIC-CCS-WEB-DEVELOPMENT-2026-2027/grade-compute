# Prompt template for AI models without repository access

Use this with `CONTEXT_PACK.md`. Each request is one message, in this order:

1. the whole of `CONTEXT_PACK.md`
2. the task block below, filled in
3. the files, as listed under "What to paste"

Start a new chat for each task. A long chat drifts away from the pack.

---

## The task block

Copy this, fill in the brackets, and delete any lines you don't need.

```text
## Task

[One or two sentences: what to build or change, and on which screen.]

Done when:
- [The visible result, e.g. "the Add task button is 44px tall below lg"]
- [Behaviour that must not change, e.g. "same wording, same saved data"]

Type of change: [refactor / style / new feature (owner-approved) / test]
[If it is a feature: the SPEC.md feature id and its text, pasted below.]

Files you may change: [paths]
Files you may create: [paths, or "none"]
Everything else is read-only.

## Files

[Paste each file under a heading with its path, in a ```jsx block.]

## Signatures of what those files import

[Only the exported names and props, not the code. Example:
- `@/features/sandbox/components/SandboxSubjectPicker`: `SandboxSubjectPicker({ open, onOpenChange })`]

Follow every rule in the context pack. Answer in the format of its §10.
```

---

## What to paste

| Task touches | Paste |
| --- | --- |
| Any component | that component and the parent that renders it |
| A shadcn component the task uses | its file from `src/components/ui/` |
| Grades, scores, targets | the relevant `src/lib/*.js` file, its test, and `SPEC.md` §4 (grading rules) |
| Stored data | `SPEC.md` §5 (data model) and the `services/` file involved |
| Styling questions | the `@theme` and `:root` blocks of `src/index.css`, when §5 of the pack is not enough |
| Tests | the file under test, an existing test from the same folder, and `src/test/fixtures.js` |
| A new feature | its `SPEC.md` entry, the page it lives on, and one similar component as a pattern |

Leave out anything the task doesn't need. Extra files use up space and give the model more to
copy wrongly.

---

## Before you use the answer

Paste the files into the repo, then:

1. `npm run format`
2. `npm run lint`, `npm run format:check`, `npm run build`, `npm test`. All must pass.
3. Read the model's **Assumptions**, **Rule exceptions** and **Needs** lists. Check each assumption
   against the real code.
4. Search the changed files for what lint can't catch yet ⟦TBD-11: drop the items that the lint
   rules in `README.md` §4 cover once they are in place⟧:
   - `#`, `rgb(`, `hsl(`, `-[` inside `className` strings (R9, R10)
   - `text-xs`, `text-sm`, `text-lg`, `font-bold`, `leading-` without a `type-*` role (R11)
   - `<button`, `<input`, `<select`, `<dialog`, `role="dialog"` written by hand (R16)
   - `localStorage` outside `src/services/` (R4)
   - `export default` (R1), `../` imports (§3)
   - maths on scores or grades inside a `.jsx` file (R3)
   - changed user-facing text (R22)
5. Run the app and look at each touched screen at 375, 768, 1024 and 1440 px.
6. For anything bigger than a small change, have a repo-aware tool review the diff (for example
   Claude Code's `/code-review`). It can see duplicates and side effects that the model couldn't.

If the answer breaks a rule, don't fix it by hand in the chat. Reply with the rule number and the
line ("R10: `w-[347px]` in line 42"), and ask for the complete file again.

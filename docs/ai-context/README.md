# AI context pack — how to use and maintain it

This folder lets an AI model that **cannot see the repository** (a chat model, an assistant without
file access) produce code that fits CompUGrade's standards.

| File | What it is |
| --- | --- |
| `CONTEXT_PACK.md` | What the model needs to know: stack, layout, rules, tokens, components, data. Pasted at the top of every request |
| `PROMPT_TEMPLATE.md` | The task block to fill in, what files to paste with it, and how to check the answer |
| `README.md` | This file: placeholders to resolve, upkeep, and the lint rules that back the pack up |

## 1. Status

Ready to use. The placeholders were resolved on 2026-11-13, after the clean-up and its follow-ups,
and every fact in the pack was re-checked against the code then. Re-check R23 when the branding
branch is merged.

## 2. Keeping it accurate

The pack is only useful while it is true. A wrong fact in it is worse than a missing one, because
the model will follow it with confidence.

- `AGENTS.md` and `SPEC.md` stay the source of truth. The pack is a condensed copy for models that
  can't open them. If they disagree, the pack is wrong.
- Update the pack in the same commit as any change to:
  - tokens, text roles or control sizes in `src/index.css`
  - an added or removed component in `src/components/ui/`
  - a shared component's props
  - a route
  - an `AGENTS.md` rule
- Keep it short. It should stay around 3,000–4,000 words, so it fits in any model's context with
  room for the task's files. Point to a `SPEC.md` section instead of copying it.
- Optional, later: a small script that rebuilds §5.1 (tokens) and §6.1 (component list) from
  `src/index.css` and `src/components/ui/`, so those two never go stale. That would need the
  owner's approval as a task.

## 3. Why there are two halves

The pack makes good output **likely**, but only checks make it **certain**. Models skip rules,
especially in long answers, and they can't see what already exists. So every answer goes through
the same gates as any other code (template, "Before you use the answer"), and the rules that a
machine can check should become lint errors (§4). Then a model that ignores the pack fails loudly
instead of quietly.

## 4. Lint rules to back up the pack (proposal, not applied)

These use only ESLint's built-in rules, so they need no new dependency. They would go in
`eslint.config.js` as one task after the clean-up, with the owner's approval. They are drafts:
run them against the finished codebase first, and fix or exempt what they flag before turning
them on as errors.

```js
// App code only: the generated shadcn components keep their own patterns
// (arbitrary variants such as in-data-[slot=…]) as generated.
{
    files: ["src/**/*.{js,jsx}"],
    ignores: ["src/components/ui/**", "src/**/*.test.{js,jsx}", "src/test/**"],
    rules: {
        "no-restricted-syntax": [
            "error",
            {
                selector: "ExportDefaultDeclaration",
                message: "Use a named export (AGENTS.md §6).",
            },
            {
                selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(/]",
                message: "No hard-coded colours. Use a colour token (AGENTS.md §7).",
            },
            {
                selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(/]",
                message: "No hard-coded colours. Use a colour token (AGENTS.md §7).",
            },
            {
                // Arbitrary values such as w-[347px] or text-[13px]. Matches a
                // utility followed by -[…]; CSS-variable forms like z-(--z-modal)
                // are not matched.
                selector: "Literal[value=/(^|\\s)[a-z:-]+-\\[[^\\]]+\\]/]",
                message: "No arbitrary values. Use the Tailwind scale or a token (AGENTS.md §7).",
            },
            {
                // CSS variables are quoted keys ("--pill-depth"); a bare key
                // (color, width) is a plain style property.
                selector: "JSXAttribute[name.name='style'] ObjectExpression > Property[key.type='Identifier']",
                message: "Inline style only for runtime data passed as a CSS variable (AGENTS.md §7).",
            },
        ],
        "no-restricted-imports": [
            "error",
            {
                patterns: [
                    { group: ["../*"], message: "Import across folders with @/ (AGENTS.md §5)." },
                    { group: ["*.css", "!@/index.css"], message: "src/index.css is the only stylesheet." },
                    { group: ["@radix-ui/*"], message: "shadcn here is built on Base UI, not Radix." },
                ],
                paths: [
                    { name: "cn", message: "Import cn from @/lib/utils." },
                    { name: "clsx", message: "Import cn from @/lib/utils." },
                    { name: "tailwind-merge", message: "Import cn from @/lib/utils." },
                ],
            },
        ],
        "no-restricted-globals": [
            "error",
            { name: "localStorage", message: "Use src/services/ (AGENTS.md §5)." },
        ],
    },
},
// services/ is where storage lives; lib/utils.js is where cn is built.
{
    files: ["src/services/**/*.js"],
    rules: { "no-restricted-globals": "off" },
},
{
    files: ["src/lib/utils.js"],
    rules: { "no-restricted-imports": "off" },
},
```

Notes on the drafts:

- `main.jsx` imports `@/index.css`, which the CSS pattern allows. No other file imports a
  stylesheet.
- `no-restricted-globals` doesn't catch `window.localStorage`. Add a
  `MemberExpression[object.name='window'][property.name='localStorage']` selector to the syntax
  rule if that matters.
- The hex selector may catch strings that aren't colours (an anchor link like `#top`). Check what it
  flags on the finished code before turning it on.
- Text roles (R11) and hand-built controls (R16) are hard to lint reliably without a plugin. They
  stay on the manual checklist in `PROMPT_TEMPLATE.md`.
- A git pre-commit hook (`core.hooksPath` pointing at a script folder, so no new dependency) can
  run lint, the format check and the tests, so nothing reaches a commit without passing them.

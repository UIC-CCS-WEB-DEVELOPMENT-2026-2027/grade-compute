# CompUGrade — Agent Instructions

These rules apply to every AI coding agent working in this repository (Claude Code, Codex, Cursor, Copilot, Gemini, and others). Read this file fully before touching anything.

CompUGrade is a React + Vite web app that turns syllabus grading rules into a dashboard where students track official grades, enter their own scores, and work out what they need to reach a target grade.

## 1. Order of authority

When instructions conflict, the higher item wins:

1. The project owner's direct instruction in the current session
2. `SPEC.md` — the project's truth
3. This file (`AGENTS.md`)
4. `docs/REFACTOR_WORKFLOW.md` and `docs/TASKS.md` — the job currently in progress

If the code and `SPEC.md` disagree, stop and report the difference. Do not change either one to make them match.

## 2. SPEC.md is protected

`SPEC.md` records what CompUGrade is and does. Agents read it; agents do not edit it on their own initiative.

To change it, every step below is required, in order:

1. **Propose.** Show the exact text to add, change, or remove (before and after) and the reason.
2. **First approval.** Wait for the owner to approve that proposal explicitly.
3. **Confirm.** Restate the final change in one sentence and ask: "Confirm writing this to SPEC.md?"
4. **Second approval.** Edit only after a second explicit yes.
5. **Log.** Add a dated line to the Changelog section of `SPEC.md` describing the change.

Rules around the protocol:

- One approval covers one change. It does not carry over to later changes.
- Silence, "continue", "looks good", or approval of a larger plan that happens to mention the spec are not confirmations.
- Never edit `SPEC.md` through shell commands, scripts, or any route other than the normal file-edit tool.
- Ideas, suggestions, and open questions go in the chat or in `docs/`, never straight into `SPEC.md`.

## 3. Current scope: feature freeze

The job in progress is a codebase and UI clean-up. Until the owner lifts the freeze:

**Allowed**

- Moving, renaming, and splitting files
- Extracting repeated code into shared components, hooks, and functions
- Replacing hand-built UI elements with shadcn/ui components that do the same thing
- Consolidating styling into design tokens and the single global stylesheet
- Fixing layout, sizing, spacing, and color inconsistencies
- Adding tests, lint, and formatting configuration

**Not allowed**

- Adding, removing, or changing a feature, screen, route, form field, or user flow
- Changing how any grade is computed, rounded, or displayed
- Changing the shape of stored data, API requests, or the database
- Changing user-facing wording
- Changing the logo, favicon, page title, or product name anywhere. Branding is handled in a separate branch after this job; note problems in `docs/AUDIT.md` and leave them
- Building anything for professor, parent, or administrator roles. Only the student experience is implemented and in scope
- Adding a dependency that is not on the approved list in section 4

**Behaviour must stay identical.** The same input must produce the same grades, the same saved data, and the same navigation as before. Appearance changes on purpose; behaviour does not.

**If you find a bug**, report it and keep the current behaviour. Fixing a bug is a behaviour change and needs the owner's approval.

## 4. Project facts

Filled in from the Phase 0 audit. Keep this section accurate; it is the first thing a new agent reads.

| Item | Value |
| --- | --- |
| Language | JavaScript (JSX, ES modules). Do not migrate to TypeScript |
| Package manager | npm (`package-lock.json`). Use only npm |
| Dev server | `npm run dev` (Vite, `http://localhost:5173`) |
| Build | `npm run build` (Vite, output in `dist/`) |
| Lint | `npm run lint` (ESLint 10 flat config, `eslint.config.js`). Fails with 2 errors at the Phase 0 baseline; see `docs/AUDIT.md` §2 |
| Format | None yet. Prettier is added in Phase 2 |
| Test | None yet. Vitest and React Testing Library are added in Phase 2 |
| Router | react-router-dom 7, declarative `<BrowserRouter>`/`<Routes>` in `src/App.jsx` |
| State management | React local state per component. A `compugrade-db-updated` window event (from `saveDb`) tells other components to re-read. The sidebar uses a `useSyncExternalStore` module store. No state library |
| Data storage / backend | No backend and no network calls. Browser `localStorage` (`compugrade_db`), seeded from `src/utils/db.json` through `src/utils/db.js` |
| Tailwind version | Not installed yet. Tailwind v4 is planned for Phase 4 |
| Global stylesheet | `src/assets/index.css`. Phase 0 also found 19 per-component and per-page CSS files, which are to be merged into it |

**Approved dependencies for this job:** Tailwind CSS, shadcn/ui and the packages its CLI installs, ESLint, Prettier, Vitest with React Testing Library, Playwright (dev only, for screenshots). Anything else needs the owner's approval first.

## 5. File structure

Target layout. This was written before anyone inspected the code, so it is a starting point: the audit checks it against the real codebase, proposes changes, and the owner approves the final tree in `docs/TASKS.md`. Update this section to match once approved. Do not create folders that would stay empty.

```
src/
  app/            App shell, router, providers
  pages/          One folder per route; page components only compose
  features/       Code that belongs to one feature (grading, sandbox, analytics…)
    <feature>/    components/, hooks/, and logic for that feature
  components/
    ui/           shadcn/ui components (added through the shadcn CLI)
    …             Shared app components used by two or more features
  hooks/          Shared hooks
  lib/            Pure logic and helpers, no React (grade computation lives here)
  services/       Data access: API calls, storage
  assets/         Logo, images, fonts
  index.css       The only global stylesheet
```

- A file lives with the feature that uses it. It moves to a shared folder only when a second feature needs it.
- One component per file. The file name matches the component name.
- Import across folders with the `@/` alias (maps to `src/`). No `../../..` chains.

## 6. Code conventions

- Function components and hooks only.
- Names: `PascalCase` for components and their files, `useCamelCase` for hooks, `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for constants.
- Named exports. Default exports only where a tool requires them.
- Grade computation is pure functions in `lib/`: no React, no storage, no network. Components call them; components never redo the maths.
- Extract when the same markup or logic, serving the same purpose, appears in two or more places. Do not merge things that only look alike but mean different things.
- No commented-out code, no unused files, no unused exports.
- ESLint and Prettier decide formatting. Do not hand-format against them or disable rules inline without a comment giving the reason.

## 7. UI standards

**Components**

- Use shadcn/ui for every primitive it provides (button, input, select, dialog, card, tabs, progress, tooltip, and so on). Do not hand-build what shadcn already has.
- Add components with the shadcn CLI and follow the installed shadcn skill. Do not copy component code from memory or from other projects.
- Build app-specific components by composing shadcn primitives.

**Styling**

- All global CSS lives in the one global stylesheet: design tokens (CSS variables), theme definitions, base element styles. No other `.css` files, no CSS modules, no CSS-in-JS.
- Style components with Tailwind utility classes that reference tokens.
- No hard-coded colors (`#hex`, `rgb()`, named colors) and no arbitrary values (`text-[13px]`, `w-[347px]`) in components. If a value is missing, add a token.
- Inline `style` is allowed only for values that are user data at runtime, such as a subject's chosen accent color, passed as a CSS variable.

**Consistency**

- Colors: semantic tokens only (`background`, `foreground`, `primary`, `muted`, `destructive`, and the status tokens defined in the stylesheet). Every theme that exists today keeps working; do not add or remove a theme.
- Typography: one font family set and one fixed scale of text roles (page title, section title, body, small, caption) defined once and reused. No one-off sizes.
- Spacing and sizing: the Tailwind spacing scale only. Same element, same size everywhere (one button height per size variant, one input height, one card padding).
- Branding: out of scope for the current job (see section 3). Keep the existing logo and name exactly as they are, including when moving the files that show them.

**Responsive**

- Mobile-first. Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Every screen must work at 375 (phone), 768 (tablet), 1024 (laptop), and 1440 (desktop) wide: no horizontal scroll, no clipped or overlapping content, no text below 14px, touch targets at least 44px on phone and tablet.
- Use relative units and layout utilities (flex, grid, `max-w-*`) rather than fixed pixel widths.

**Accessibility**

- Text contrast meets WCAG AA. Every interactive element has a visible focus state and an accessible name. Form fields have labels.

## 8. Working rules

- Work from `docs/TASKS.md`. One task, one commit. Tick the task off in the same commit.
- Before every commit: lint, build, and tests all pass.
- A commit that moves or renames files changes nothing else. Content changes go in a separate commit.
- Commit messages: `type(scope): summary` — types `refactor`, `style`, `test`, `chore`, `docs`.
- Never push, force-push, rewrite history, or delete branches. The owner does that.
- Stop and ask when: the task is ambiguous, it would change behaviour, it conflicts with `SPEC.md`, it needs a new dependency, or you found a bug.
- When resuming in a new session, read `SPEC.md`, this file, and `docs/TASKS.md` first, then continue from the first unticked task.

## 9. Definition of done for any task

1. The task's acceptance check in `docs/TASKS.md` is met.
2. Lint, build, and tests pass.
3. Behaviour is unchanged; any screen touched was checked at 375, 768, 1024, and 1440.
4. No rule in sections 5 to 7 is newly broken.
5. The commit contains only what the task describes.

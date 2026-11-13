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

**Owner-approved exceptions.** These are the only approved behaviour or data changes (Gates 0 and 3, 2026-11-11; see `docs/AUDIT.md` §12 and §14 and `docs/TASKS.md` §8). Each one is its own task and its own commit.

- **B9: sandbox drafts become draft-only.**
  - **Today:** "Try draft scores" in the Target Grade Sandbox writes the real `studentReportedScore`.
  - **Change:** store drafts in a new optional field, `targetGradeSandbox.terms[term].draftScores` (`{ [taskId]: score }`), and never write them to `studentReportedScore`.
  - **When:** a dedicated Phase 6 task, after the sandbox logic has moved to `lib/`.
  - **Tests:** the characterization test for the old behaviour is updated in the same commit.
  - **No migration:** existing `studentReportedScore` values stay as real scores.
  - **Drafts feed the sandbox only** (Gate 3): its result card, gauges and plan chart. A draft box starts from the task's real self-reported score.
- **Sidebar breakpoints.** `PHONE_MAX_WIDTH` moves from 760 to 767 and `TABLET_MAX_WIDTH` from 1100 to 1023, to match the Tailwind breakpoints in section 7. This is done with the sidebar rebuild (T7.S1).
- **shadcn `Sidebar`** (Gate 3).
  - **Change:** the sidebar is rebuilt on the shadcn `Sidebar` and keeps its current appearance.
  - **Behaviour:** only as listed and confirmed in `docs/TASKS.md` §3.2 (S1–S5).
- **Rule editor confirm** (Gate 3). PillLevel's `window.confirm` becomes a shadcn `AlertDialog` with the same wording.
- **Dead settings prototype** (Gate 3). `src/pages/StudentSettingsPrototype.jsx` and its `.student-switcher*` / `.student-role-*` CSS are deleted in Phase 5a, once `SPEC.md` §6 (f) has been updated.
- **Settings on the shared shell** (Gate 4). Settings drops its own layout and styling for the shared page shell and global styles (T7.L0). The "Workspace: Student" label, a leftover of the discontinued workspace switcher, is removed (`SPEC.md` §6 g).

Every other bug in `docs/AUDIT.md` §12 stays as it is.

## 4. Project facts

Filled in from the Phase 0 audit. Keep this section accurate; it is the first thing a new agent reads.

| Item | Value |
| --- | --- |
| Language | JavaScript (JSX, ES modules). Do not migrate to TypeScript |
| Package manager | npm (`package-lock.json`). Use only npm |
| Dev server | `npm run dev` (Vite, `http://localhost:5173`) |
| Build | `npm run build` (Vite, output in `dist/`) |
| Lint | `npm run lint` (ESLint 10 flat config, `eslint.config.js`). Passes since Phase 2. Ignores `dist` and the tooling folders |
| Format | `npm run format` / `npm run format:check` (Prettier 3, `.prettierrc.json`: 4 spaces, double quotes, 100 columns). Markdown files are not formatted |
| Test | `npm test` (Vitest 5, React Testing Library, jsdom). Unit and characterization tests next to the code (`*.test.js(x)`, 19 files, 369 tests at the end of the clean-up); helpers in `src/test/`. The date is frozen at 2026-11-11 |
| Screenshots | `npm run screenshots [outDir]` (Playwright, `scripts/screenshots.mjs`; 14 screens at 375, 768, 1024 and 1440). Before the clean-up in `docs/baseline/`, after it in `docs/after/`; manual flows in `docs/BEHAVIOUR_CHECKLIST.md` |
| Router | react-router-dom 7, declarative `<BrowserRouter>`/`<Routes>` in `src/app/App.jsx`. `src/app/RequireStudent.jsx` guards every route except `/` |
| State management | React local state per component. Components read the database with `useDb` (`src/hooks/useDb.js`), which re-reads on the `compugrade-db-updated` window event that `saveDb` sends. The sidebar's minimised state is a `useSyncExternalStore` module store (`src/hooks/useSidebarState.js`). No state library |
| Data storage / backend | No backend and no network calls. Browser `localStorage` (`compugrade_db`, schema v2), seeded from `src/services/db.json` through `src/services/db.js`; schema-v1 data is upgraded by `src/services/migrations.js`. Grade computation lives in `src/lib/` |
| Tailwind version | Tailwind CSS v4 (`@tailwindcss/vite`), with its preflight reset on. shadcn/ui on Base UI (`components.json`, style `base-nova`, JavaScript), components in `src/components/ui/`; `cn()` comes from `src/lib/utils.js` |
| Global stylesheet | `src/index.css`, the only stylesheet: design tokens, the `type-*` text roles, the `tap:` touch variant and the control sizes (44px below `lg` or on touch screens). The 19 per-component and per-page CSS files found in Phase 0 were merged into it and deleted |

**Approved dependencies for this job:** Tailwind CSS, shadcn/ui and the packages its CLI installs, ESLint, Prettier, Vitest with React Testing Library (plus `@testing-library/dom` and `jsdom`, approved at Gate 2), Playwright (dev only, for screenshots). Anything else needs the owner's approval first.

## 5. File structure

Target layout, revised at Gate 0 to match the code (`docs/AUDIT.md` §11, R6). The full move table (old path → new path) goes in `docs/TASKS.md` in Phase 3 and needs the owner's approval. Update this section if that approval changes it. Do not create folders that would stay empty.

```
src/
  app/            App shell, router, providers (today: App.jsx, main.jsx)
  pages/          Page components, grouped by area: auth/, student/, settings/
                  Pages only compose
  features/       Code that belongs to one feature:
    auth/           login and register
    subjects/       enrolled-subjects table, add subject
    term-records/   current term records, term navigation
    grade-rules/    pill editor, rule card and visuals, delete-rule dialog
    sandbox/        target grade sandbox, subject picker
    history/        grade history charts and tooltip
    settings/       account settings sections
    <feature>/    components/, hooks/, and logic for that feature
  components/
    ui/           shadcn/ui components (added through the shadcn CLI)
    layout/       Sidebar, Header, PageFooter, the page shell
    …             Shared app components used by two or more features
  hooks/          Shared hooks (e.g. useDb, useSidebarState)
  lib/            Pure logic and helpers, no React. Grade computation lives here
                  (grades, rules, sandbox, history, subjects, terms, targets,
                  scores, format, number, celebration)
                  DOM-only helpers (focusTask, cssColor) go in lib/dom/ or their feature
  services/       Data access and storage
                  (db, db.json, migrations, session, records,
                  localAccountStore, prototypeVerification)
  assets/         Logo, images, fonts, sounds
  index.css       The only global stylesheet
```

- A file lives with the feature that uses it. It moves to a shared folder only when a second feature needs it.
- One exported component per file. The file name matches the component name. Small private sub-components that only that file uses may stay in it (for example chart dot renderers, `SandboxStep`, `PasswordField`).
- Import across folders with the `@/` alias (maps to `src/`). No `../../..` chains.

## 6. Code conventions

- Function components and hooks only.
- Names: `PascalCase` for components and their files, `useCamelCase` for hooks, `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for constants.
- Named exports. Default exports only where a tool requires them. Today 39 files use default exports. Convert them in dedicated Phase 6 tasks, never inside a file-move commit.
- Grade computation is pure functions in `lib/`: no React, no storage, no network. Components call them; components never redo the maths.
- Extract when the same markup or logic, serving the same purpose, appears in two or more places. Do not merge things that only look alike but mean different things.
- No commented-out code, no unused files, no unused exports. Exception: keep the commented-out Phase 2 professor and admin imports and routes in `App.jsx` exactly as they are, and keep all other non-student code (owner decision, Gate 0), except the dead settings prototype (Gate 3, section 3).
- **Code style is Prettier's, with the project config in `.prettierrc.json`** (owner decision, Gate 2):
  - 4-space indentation
  - double quotes
  - semicolons
  - trailing commas wherever possible
  - lines up to 100 characters
- Every JavaScript, JSX, CSS, JSON and HTML file follows it, including tests and scripts. Markdown is written by hand and is not formatted.
- Run `npm run format` before committing. `npm run format:check` must pass.
- ESLint and Prettier decide formatting. Do not hand-format against them, change `.prettierrc.json`, or disable rules inline without a comment giving the reason. Changing the style needs the owner's approval.

## 7. UI standards

**Components**

- Use shadcn/ui for every primitive it provides (button, input, select, dialog, card, tabs, progress, tooltip, and so on). Do not hand-build what shadcn already has.
- Add components with the shadcn CLI and follow the installed shadcn skill. Do not copy component code from memory or from other projects.
- Set up shadcn for **Base UI** (owner decision, Gate 0) in JavaScript (`tsx: false`), with the `@/` alias.
- Build app-specific components by composing shadcn primitives.
- Generated components in `src/components/ui/` follow the styling rules too (owner decision, Gate 4). In the commit that adds a component:
  - replace its one-off values with tokens and the Tailwind scale
  - set its control heights to the token sizes (`h-control` and its siblings)
  - keep its structure and API as generated

**Styling**

- All global CSS lives in the one global stylesheet: design tokens (CSS variables), theme definitions, base element styles. No other `.css` files, no CSS modules, no CSS-in-JS. Tooling folders are not app code and are exempt. Keep them out of the lint, format and test globs too: `.agents/`, `.claude/`, `.codestudio/`.
- Style components with Tailwind utility classes that reference tokens.
- No hard-coded colors (`#hex`, `rgb()`, named colors) and no arbitrary values (`text-[13px]`, `w-[347px]`) in components. If a value is missing, add a token.
- Inline `style` is allowed only for values that are user data at runtime, such as a subject's chosen accent color, passed as a CSS variable.

**Consistency**

- Colors: semantic tokens only. That means `background`, `foreground`, `primary`, `muted`, `destructive`, and these status tokens, which the stylesheet must define:
  - `success`, `warning`, `highlight`
  - the 3-state tokens `official` (locked official scores) and `self-reported` (student entries)
  - `criteria-1` to `criteria-8`, each with its `-on` pair
- Themes: the app has one theme (light), and it keeps working. The `.global-settings.dark` rules and `--*-dark` tokens can't be reached, so they are dead code and are deleted in Phase 5a. Do not add a theme.
- Typography: one font family set and one fixed scale of text roles, defined once and reused. No one-off sizes.
  - Fonts: Khand for headings and General Sans for everything else, from the files in `src/assets/`. No other font (Arial and any font a tool adds are removed). Missing weights of these two families may be added as font files (owner decision, Gate 3).
  - Roles: `display` (the login hero only), `page-title`, `section-title`, `card-title`, `body`, `small`, `caption`. `display` and `card-title` were added at Gate 3. Sizes are in `docs/TASKS.md` §4.2.
  - Minimum sizes: 14px for body text, inputs and buttons.
  - The `caption` role is 12px. Use it only for chart axes, badges and eyebrow labels.
- Spacing and sizing: the Tailwind spacing scale only. Same element, same size everywhere (one button height per size variant, one input height, one card padding).
- Branding: out of scope for the current job (see section 3). Keep the existing logo and name exactly as they are, including when moving the files that show them.

**Responsive**

- Mobile-first. Breakpoints: Tailwind defaults `sm` 640, `md` 768, `lg` 1024, `xl` 1280. The code today uses 760/761 and other one-off values. These move to the defaults. The JS sidebar thresholds move as listed under "Owner-approved exceptions" in section 3.
- Every screen must work at 375 (phone), 768 (tablet), 1024 (laptop), and 1440 (desktop) wide:
  - no horizontal scroll
  - no clipped or overlapping content
  - no text below 14px, except the 12px caption role
  - touch targets at least 44px on phone and tablet
- Use relative units and layout utilities (flex, grid, `max-w-*`) rather than fixed pixel widths.

**Accessibility**

- Text contrast meets WCAG AA. Every interactive element has a visible focus state and an accessible name. Form fields have labels.

## 8. Working rules

- Work from `docs/TASKS.md`. One task, one commit. Tick the task off in the same commit.
- Before every commit: lint, format check (`npm run format:check`), build, and tests all pass.
- A commit that moves or renames files changes nothing else. Content changes go in a separate commit.
- Commit messages: `type(scope): summary` — types `refactor`, `style`, `test`, `chore`, `docs`.
- Never push, force-push, rewrite history, or delete branches. The owner does that.
- Stop and ask when: the task is ambiguous, it would change behaviour, it conflicts with `SPEC.md`, it needs a new dependency, or you found a bug.
- When resuming in a new session, read `SPEC.md`, this file, and `docs/TASKS.md` first, then continue from the first unticked task.

## 9. Definition of done for any task

1. The task's acceptance check in `docs/TASKS.md` is met.
2. Lint, format check, build, and tests pass.
3. Behaviour is unchanged; any screen touched was checked at 375, 768, 1024, and 1440.
4. No rule in sections 5 to 7 is newly broken.
5. The commit contains only what the task describes.

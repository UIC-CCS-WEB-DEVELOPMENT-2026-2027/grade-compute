# CompUGrade — Agent Instructions

These rules apply to every AI coding agent working in this repository (Claude Code, Codex, Cursor, Copilot, Gemini, and others). Read this file fully before touching anything.

CompUGrade is a React + Vite web app that turns syllabus grading rules into a dashboard where students track official grades, enter their own scores, and work out what they need to reach a target grade.

## 1. Order of authority

When instructions conflict, the higher item wins:

1. The project owner's direct instruction in the current session
2. `SPEC.md` and the files in `spec/` (the spec) — the project's truth
3. This file (`AGENTS.md`)
4. The task being worked on (`docs/BOARD.md`) and `docs/TEAM_WORKFLOW.md`

If the code and the spec disagree, stop and report the difference. Do not change either one to make them match.

## 2. The spec is protected

`SPEC.md` and the files in `spec/` (together, the spec) record what CompUGrade is and does. Agents read them; agents do not edit them on their own initiative. Start with `SPEC.md`: its "Where things are" table says which `spec/` file a task needs.

To change a spec file, every step below is required, in order:

1. **Propose.** Show the exact text to add, change, or remove (before and after) and the reason.
2. **First approval.** Wait for the owner to approve that proposal explicitly.
3. **Confirm.** Restate the final change in one sentence and ask: "Confirm writing this to `<file>`?", naming the spec file or files.
4. **Second approval.** Edit only after a second explicit yes.
5. **Log.** Add a dated line to the Changelog, `SPEC.md` §11, describing the change. It is the one changelog for every spec file.

Rules around the protocol:

- One approval covers one change. It does not carry over to later changes.
- Silence, "continue", "looks good", or approval of a larger plan that happens to mention the spec are not confirmations.
- Never edit a spec file through shell commands, scripts, or any route other than the normal file-edit tool.
- Ideas, suggestions, and open questions go in the chat or in `docs/`, never straight into the spec.

## 3. Scope

The codebase and UI clean-up is finished (PR #118, follow-ups in PR #119; see `docs/archive/REFACTOR_REPORT.md`). Work now comes from tasks on `docs/BOARD.md`, done as `docs/TEAM_WORKFLOW.md` describes.

**Allowed, inside the task you were given and its Areas on `docs/BOARD.md`:**

- What the task's "Done when" describes, including new features, screens, routes, form fields and user flows
- Changes to how a grade is computed, rounded or displayed, to user-facing wording, or to stored data, only when the task says so. Stored-data changes come with a migration in `frontend/src/services/migrations.js` and a new `SCHEMA_VERSION`
- Refactoring, tests and styling fixes inside the task's Areas that the task needs

**Needs the owner first (stop and ask):**

- Anything the task doesn't describe, or a file outside its Areas
- A change to what `SPEC.md` says. A feature or behaviour change is only done once `SPEC.md` describes it, updated through the protocol in section 2, in the same pull request or before it
- A dependency that is not on the approved list in section 4
- Branding (logo, product name, favicon, page title). It has its own branch (`SPEC.md` §2)
- Professor, parent or administrator workspaces. They are `[PLANNED]` (`SPEC.md` §6)
- Fixing a bug listed in `docs/AUDIT.md` §12 that has no task of its own

**Outside the task, behaviour stays as it is.** If you find a bug or something to tidy elsewhere, report it so it can become a task; don't change it in the same pull request.

## 4. Project facts

Filled in from the Phase 0 audit. Keep this section accurate; it is the first thing a new agent reads.

| Item | Value |
| --- | --- |
| App folder | `frontend/` holds the React app and its configs. Run every npm and npx command there (the shadcn CLI too). `backend/` holds the Laravel API; run every `php`, `composer` and `artisan` command there. Everything else (docs, the spec, `.github/`, `.claude/`) stays at the root |
| Language | JavaScript (JSX, ES modules). Do not migrate to TypeScript. The back end is PHP 8.2+ (Laravel 12) |
| Package manager | npm (`frontend/package-lock.json`). Use only npm. Back end: Composer 2 (`backend/composer.lock`, resolved for PHP 8.2 through `config.platform.php` in `backend/composer.json`) |
| Dev server | `npm run dev` (Vite, `http://localhost:5173`). The API: `php artisan serve` (`http://127.0.0.1:8000`), on Laragon. Vite's `server.proxy` forwards `/api` and `/sanctum` to it |
| Build | `npm run build` (Vite, output in `frontend/dist/`) |
| Lint | `npm run lint` (ESLint 10 flat config, `frontend/eslint.config.js`). Passes since Phase 2. Ignores `dist` and the tooling folders |
| Format | `npm run format` / `npm run format:check` (Prettier 3, `frontend/.prettierrc.json`: 4 spaces, double quotes, 100 columns). Markdown files are not formatted. Back end: `vendor/bin/pint` / `vendor/bin/pint --test` (Laravel Pint, its default Laravel preset) |
| Test | `npm test` (Vitest 5, React Testing Library, jsdom). Unit and characterization tests next to the code (`*.test.js(x)`, 19 files, 369 tests at the end of the clean-up); helpers in `frontend/src/test/`. The date is frozen at 2026-11-11. Back end: `vendor/bin/pest` (Pest 3 with its Laravel plugin; tests in `backend/tests/`, on the in-memory SQLite database `backend/phpunit.xml` sets) |
| Screenshots | `npm run screenshots [outDir]` (Playwright, `frontend/scripts/screenshots.mjs`; 14 screens at 375, 768, 1024 and 1440; `outDir` is relative to the repository root, default `docs/screenshots/`, which git ignores). The clean-up's shots are in `docs/archive/baseline/` (before) and `docs/archive/after/` (after); manual flows in `docs/BEHAVIOUR_CHECKLIST.md` |
| Router | react-router-dom 7, declarative `<BrowserRouter>`/`<Routes>` in `frontend/src/app/App.jsx`. `frontend/src/app/RequireStudent.jsx` guards every route except `/` |
| State management | React local state per component. Components read the database with `useDb` (`frontend/src/hooks/useDb.js`), which re-reads on the `compugrade-db-updated` window event that `saveDb` sends. The sidebar's minimised state is a `useSyncExternalStore` module store (`frontend/src/hooks/useSidebarState.js`). No state library |
| Data storage / backend | The app makes no network calls yet. Browser `localStorage` (`compugrade_db`, schema v2), seeded from `frontend/src/services/db.json` through `frontend/src/services/db.js`; schema-v1 data is upgraded by `frontend/src/services/migrations.js`. Grade computation lives in `frontend/src/lib/`. The Laravel API in `backend/` (Laravel 12, Sanctum 4, MySQL 8 database `webdev2` on Laragon) has only Laravel's own tables and its `/api/user` route so far; the app moves to it one feature at a time (`docs/LARAVEL_PLAN.md`) |
| CI | `.github/workflows/ci.yml`: a front-end job (`npm audit --audit-level=high`, lint, format check, build, tests) and a back-end job on PHP 8.2 (`composer audit`, `pint --test`, Pest). `.github/dependabot.yml` checks npm, Composer and GitHub Actions weekly |
| Tailwind version | Tailwind CSS v4 (`@tailwindcss/vite`), with its preflight reset on. shadcn/ui on Base UI (`frontend/components.json`, style `base-nova`, JavaScript), components in `frontend/src/components/ui/`; `cn()` comes from `frontend/src/lib/utils.js` |
| Global stylesheet | `frontend/src/index.css`, the only stylesheet: design tokens, the `type-*` text roles, the `tap:` touch variant and the control sizes (44px below `lg` or on touch screens). The 19 per-component and per-page CSS files found in Phase 0 were merged into it and deleted |

**Approved dependencies:** Tailwind CSS, shadcn/ui and the packages its CLI installs, ESLint, Prettier, Vitest with React Testing Library (plus `@testing-library/dom` and `jsdom`, approved at Gate 2), Playwright (dev only, for screenshots), Axios (owner decision, 2026-11-27, for calling the back-end API; installed by the first task that uses it). Back end (owner decision, 2026-11-28, `docs/LARAVEL_PLAN.md` §1.7): Laravel 12 and the packages `composer create-project` installs, Sanctum (through `php artisan install:api`), Pest with its Laravel plugin, and Pint. Anything else needs the owner's approval first.

## 5. File structure

The layout the code follows (set up in the clean-up, `docs/archive/TASKS.md` §1). Keep this section up to date when folders change. Do not create folders that would stay empty.

```
frontend/         The React app. Run npm and npx commands here
  index.html, package.json, package-lock.json, vite.config.js, eslint.config.js,
  .prettierrc.json, .prettierignore, jsconfig.json, components.json, vercel.json
  public/         Static files served as-is (favicon)
  scripts/        Node scripts (screenshots)
  src/
    app/            App shell, router, providers (today: App.jsx, main.jsx)
    pages/          Page components, grouped by area: auth/, student/, settings/
                    Pages only compose
    features/       Code that belongs to one feature:
      auth/           login and register (useAuthForm, the login preview)
      subjects/       enrolled-subjects table, add subject, Subject Detail's
                      useSubjectDetail and celebration
      term-records/   current term records
      grade-rules/    pill editor, rule card and visuals, rule dialogs, useRuleEditor
      sandbox/        target grade sandbox
      history/        the Dashboard and Subject Detail history cards
      settings/       account settings sections, useGlobalSettings
      <feature>/    components/, hooks/, and logic for that feature
    components/
      ui/           shadcn/ui components (added through the shadcn CLI)
      layout/       Sidebar, Header, PageFooter, the page shell
      history-chart/ The grade-history chart kit (chart, frame, table, legend,
                    tooltip), used by history and the sandbox
      …             Shared app components used by two or more features
                    (e.g. TermNavigation, SandboxSubjectPicker, GradeGauge)
    hooks/          Shared hooks (e.g. useDb, useSidebarState, usePointHover)
    lib/            Pure logic and helpers, no React. Grade computation lives here
                    (grades, rules, sandbox, history, subjects, terms, targets,
                    scores, format, number, celebration)
                    DOM-only helpers (focusTask, cssColor) go in lib/dom/ or their feature
    services/       Data access and storage
                    (db, db.json, migrations, session, records,
                    localAccountStore, prototypeVerification)
    assets/         Logo, images, fonts, sounds
    index.css       The only global stylesheet

backend/          The Laravel API. Run php, composer and artisan commands here
  artisan, composer.json, composer.lock, phpunit.xml, .env.example
                  (.env holds local settings and keys; it is never committed)
  app/
    Http/Controllers/ Controllers
    Models/         Eloquent models
    Providers/      Service providers
  bootstrap/      App setup (app.php: routes and middleware)
  config/         Settings, read from .env
  database/       migrations/, factories/, seeders/
  routes/         api.php (the API), web.php, console.php
  tests/          Pest: Feature/ (requests to the app), Unit/; Pest.php, TestCase.php
  public/, resources/, storage/  Laravel's own: the entry point, views, logs and caches
```

- A file lives with the feature that uses it. It moves to a shared folder only when a second feature needs it.
- One exported component per file. The file name matches the component name. Small private sub-components that only that file uses may stay in it (for example chart dot renderers, `SandboxStep`, `PasswordField`).
- Import across folders with the `@/` alias (maps to `frontend/src/`). No `../../..` chains.
- In `backend/`, Laravel's conventions apply: one class per file, named and placed as PSR-4 expects (`App\Models\User` in `app/Models/User.php`). Folders such as `app/Http/Requests/` and `app/Policies/` are added by the first task that needs them.

## 6. Code conventions

- Function components and hooks only.
- Names: `PascalCase` for components and their files, `useCamelCase` for hooks, `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for constants.
- Named exports. Default exports only where a tool requires them.
- Grade computation is pure functions in `lib/`: no React, no storage, no network. Components call them; components never redo the maths.
- Extract when the same markup or logic, serving the same purpose, appears in two or more places. Do not merge things that only look alike but mean different things.
- No commented-out code, no unused files, no unused exports. Exception: keep the commented-out Phase 2 professor and admin imports and routes in `App.jsx` exactly as they are, and keep all other non-student code (owner decision, Gate 0). Second exception: a function in `frontend/src/lib/` may be exported only so its tests can call it; it is part of the tested API (owner decision, 2026-11-13, FU5).
- **Code style is Prettier's, with the project config in `frontend/.prettierrc.json`** (owner decision, Gate 2):
  - 4-space indentation
  - double quotes
  - semicolons
  - trailing commas wherever possible
  - lines up to 100 characters
- Every JavaScript, JSX, CSS, JSON and HTML file follows it, including tests and scripts. Markdown is written by hand and is not formatted.
- Run `npm run format` before committing. `npm run format:check` must pass.
- ESLint and Prettier decide formatting. Do not hand-format against them, change `frontend/.prettierrc.json`, or disable rules inline without a comment giving the reason. Changing the style needs the owner's approval.

## 7. UI standards

**Components**

- Use shadcn/ui for every primitive it provides (button, input, select, dialog, card, tabs, progress, tooltip, and so on). Do not hand-build what shadcn already has.
- Add components with the shadcn CLI and follow the installed shadcn skill. Do not copy component code from memory or from other projects.
- Set up shadcn for **Base UI** (owner decision, Gate 0) in JavaScript (`tsx: false`), with the `@/` alias.
- Build app-specific components by composing shadcn primitives.
- Generated components in `frontend/src/components/ui/` follow the styling rules too (owner decision, Gate 4). In the commit that adds a component:
  - replace its one-off values with tokens and the Tailwind scale
  - set its control heights to the token sizes (`h-control` and its siblings)
  - keep its structure and API as generated
  - exception (owner decision, 2026-11-13): arbitrary values that come with the generated component (grid templates, transition lists, `calc()` on tokens, small position nudges) may stay as generated, so that later shadcn CLI updates stay easy to merge. Fonts and colours still follow the rules

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
- Themes: the app has one theme (light). Do not add a theme without a task for it.
- Typography: one font family set and one fixed scale of text roles, defined once and reused. No one-off sizes.
  - Fonts: Khand for headings and General Sans for everything else, from the files in `frontend/src/assets/`. No other font (Arial and any font a tool adds are removed). Missing weights of these two families may be added as font files (owner decision, Gate 3).
  - Roles: `display` (the login hero only), `page-title`, `section-title`, `card-title`, `body`, `small`, `caption`. `display` and `card-title` were added at Gate 3. Sizes are in `docs/archive/TASKS.md` §4.2.
  - Minimum sizes: 14px for body text, inputs and buttons.
  - The `caption` role is 12px. Use it only for chart axes, badges and eyebrow labels.
- Spacing and sizing: the Tailwind spacing scale only. Same element, same size everywhere (one button height per size variant, one input height, one card padding).
- Branding: changed only in its own branch (section 3). Keep the existing logo and name exactly as they are, including when moving the files that show them.

**Responsive**

- Mobile-first. Breakpoints: Tailwind defaults `sm` 640, `md` 768, `lg` 1024, `xl` 1280. The JS sidebar thresholds match them (767 and 1023, `frontend/src/hooks/useSidebarState.js`).
- Every screen must work at 375 (phone), 768 (tablet), 1024 (laptop), and 1440 (desktop) wide:
  - no horizontal scroll
  - no clipped or overlapping content
  - no text below 14px, except the 12px caption role
  - touch targets at least 44px on phone and tablet
- Use relative units and layout utilities (flex, grid, `max-w-*`) rather than fixed pixel widths.

**Accessibility**

- Text contrast meets WCAG AA. Every interactive element has a visible focus state and an accessible name. Form fields have labels.

## 8. Working rules

- Work on one task from `docs/BOARD.md` at a time, on its own branch named `<Lastname>_<type>-<short-name>` (`docs/TEAM_WORKFLOW.md` §6), and change only the folders in its Areas.
- **Claiming (owner decision, 2026-11-13).** When the developer asks, an agent may claim or release the task it was given, exactly as `docs/TEAM_WORKFLOW.md` §3 describes:
  - on an up-to-date `main`, change only that task's State line, with the developer's GitHub username and the branch name. Ask for them if you don't have them
  - first read the Areas of every claimed task, and stop and ask if one overlaps
  - commit `chore(board): claim T-n` (or `release T-n`) and push it to `main` straight away
  - if the push is rejected and `git pull --rebase` conflicts on the State line, run `git rebase --abort` and stop: someone else has the task
  - then create the task's branch from that `main`

- **Board edits (owner decision, 2026-11-24).** Apart from claiming, an agent edits `docs/BOARD.md` only when the owner asks:
  - it makes exactly the change the owner describes: task blocks, State lines, locks, `done in PR #n`
  - it commits that change on its own: `chore(board)` for States and locks, `docs(board)` for task text
  - it commits on a branch, never on `main`, and may push that branch (see Pushing below)
  - a developer who is not the owner can ask an agent only for a claim or a release, the same as their own board rights (`docs/TEAM_WORKFLOW.md` §5)
- One logical change per commit. A pull request closes one task.
- Before every commit: lint, format check (`npm run format:check`), build, and tests all pass.
- A commit that moves or renames files changes nothing else. Content changes go in a separate commit.
- Commit messages: `type(scope): summary` — types `feat`, `fix`, `refactor`, `style`, `test`, `chore`, `docs`.
- Stage files by name (`git add <path>`), never `git add .` or `-A`.
- **Pushing (owner decision, 2026-11-28).** An agent may push its own task branch and the claim or release commit on `main` above. It never:
  - pushes any other commit to `main`
  - force-pushes or rewrites pushed history
  - opens, merges or closes a pull request. A person opens every PR, and the owner reviews and merges it (`docs/TEAM_WORKFLOW.md` §9, decision 6)
  - deletes a branch
- Stop and ask when: the task is ambiguous, it would change something the task doesn't describe, it conflicts with `SPEC.md`, it needs a new dependency, it needs a file outside its Areas, or you found a bug.
- **`docs/archive/` is finished work** (the clean-up's plan, report and screenshots), kept for the record. Don't read or search it unless the owner or the task names a file in it. `.ignore` and `.cursorignore` keep it out of search tools that read them.
- When resuming in a new session, read `SPEC.md`, the `spec/` files its "Where things are" table lists for the task, this file, and the task's block on `docs/BOARD.md` first.

## 9. Definition of done for any task

1. The task's "Done when" on `docs/BOARD.md` is met.
2. Lint, format check, build, and tests pass. New logic in `frontend/src/lib/` or `frontend/src/services/` has tests.
3. Behaviour changes only as the task describes; any screen touched was checked at 375, 768, 1024, and 1440.
4. `SPEC.md` describes any feature or behaviour the task added or changed (section 2).
5. No rule in sections 5 to 7 is newly broken.
6. The pull request contains only what the task describes.

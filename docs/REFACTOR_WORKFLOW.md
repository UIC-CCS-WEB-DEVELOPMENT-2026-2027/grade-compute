# CompUGrade — Clean-up Workflow

The job: optimize the codebase and fix the UI of the CompUGrade React + Vite app, with no feature added, removed, or changed. `AGENTS.md` holds the standing rules; this file holds the order of work.

Out of scope: logo and branding (a separate branch after this job) and anything for non-student roles.

**This workflow and `AGENTS.md` were written without access to the code.** Treat every assumption in them as unverified. Phase 0 checks them against the real codebase and proposes revisions before any other work starts.

**Status:** Phase 0 was done on 2026-11-11, and Gate 0 passed the same day. The approved revisions (R1–R15 in `docs/AUDIT.md` §14) are applied below and in `AGENTS.md`.

Save this file as `docs/REFACTOR_WORKFLOW.md`. It can be archived when the job is finished.

---

## Before you start (project owner, once)

1. Commit or stash all current work, then create a branch: `git checkout -b refactor/cleanup`.
2. Put `AGENTS.md` and `CLAUDE.md` in the repo root and this file in `docs/`.
3. Add the project details file as `docs/project_details.md`.
4. Install the official shadcn skill from the repo root: `npx skills add shadcn/ui` (choose Claude Code when asked).
5. Create `.claude/settings.json` so any edit to the spec asks you first:

   ```json
   {
     "permissions": {
       "ask": ["Edit(/SPEC.md)"]
     }
   }
   ```

   Do not run Claude Code in bypass-permissions mode during this job; that mode skips the prompt.
6. Start Claude Code in the repo and paste:

   > Read `AGENTS.md` and `docs/REFACTOR_WORKFLOW.md`. Start Phase 0. Stop at the gate.

---

## How every phase works

- Do the phase, write its output file, then **stop at the gate** and wait for the owner.
- A gate is passed only by the owner saying so. Do not start the next phase in the same turn.
- Questions that block work are asked at the gate, grouped, not scattered through the phase.
- Progress lives in files (`docs/AUDIT.md`, `SPEC.md`, `docs/TASKS.md`), so any agent or model can resume from them.

---

## Phase 0 — Audit (read-only)

Change nothing. Read the whole codebase and `docs/project_details.md`, then write `docs/AUDIT.md`:

1. **Stack** — language (JS or TS), package manager, React and Vite versions, router, state management, styling approach, existing UI libraries, Tailwind (present? which version?), test and lint setup.
2. **Run check** — does install, dev, and build work right now? Record errors and warnings as the baseline.
3. **Routes and screens** — every route, the page component behind it, what a user can do there.
4. **Features as built** — each feature found in code, with the files that implement it.
5. **Grading logic** — where grades are computed, the exact formulas, weights, rounding, and the three task states, with file and function names.
6. **Data** — entities and attributes as the code uses them, where data is stored (local storage, API, database), every backend call.
7. **Component inventory** — every component, where it is used, and groups of duplicated or near-duplicated markup and logic.
8. **Styling inventory** — every CSS file and styling method, count of hard-coded colors and font sizes, distinct font sizes and spacing values in use, existing themes.
9. **Branding notes** — logo files, every place the logo and product name appear, spelling variants, favicon, page title. Record only; this is input for the later branding branch.
10. **Responsive check** — from the code: fixed pixel widths, missing breakpoints, layouts likely to break on phone or tablet. Confirmed with real screenshots in Phase 2.
11. **Structure problems** — misplaced files, inconsistent naming, dead code, unused dependencies.
12. **Bugs and risks** — anything that looks wrong. Report only.

13. **Assumption check** — confirm or correct each assumption this workflow and `AGENTS.md` make, citing the files that prove it:
    - The app is React + Vite, and only student functionality is implemented (the owner's statement). List any professor, parent, or administrator code found, even if unused.
    - The target file tree in `AGENTS.md` section 5 suits this codebase's size and shape.
    - The code and UI rules in `AGENTS.md` sections 6 and 7 fit what exists (language, styling approach, themes, router).
    - shadcn/ui can be added without breaking the current setup (Tailwind present or not, version, JS or TS).
    - The phases below are in a workable order and none is unnecessary or missing for this codebase.
14. **Proposed revisions** — the specific changes to this workflow and to `AGENTS.md` that follow from the assumption check: phases to add, drop, split, or reorder; structure or rules to adjust. Give the reason for each.

Before finishing, re-read the audit against the code once more and correct anything stated from a guess rather than from a file you opened.

Fill in section 4 (Project facts) of `AGENTS.md`. Make no other edits to `AGENTS.md` or this file yet.

**Gate 0:** owner reads the audit, answers questions, and approves or rejects each proposed revision. Apply the approved revisions to `AGENTS.md` and this file as one `docs` commit before starting Phase 1.

---

## Phase 1 — SPEC.md

Draft the project's truth from two sources: the audit (what the code does) and `docs/project_details.md` (what the project intends). Present the draft in the chat first; write the file only through the protocol in `AGENTS.md` section 2.

Before writing anything, confirm with the owner that the `Edit(/SPEC.md)` ask rule in `.claude/settings.json` also prompts when `SPEC.md` is first **created**. If it does not, the owner adds `Write(/SPEC.md)` to that rule. Do this check without creating `SPEC.md` yourself.

Structure:

1. **Purpose and audience**
2. **Scope by phase** — what Phase 1 (MVP) includes and excludes
3. **Features** — one entry each, tagged:
   - `[BUILT]` — exists in code; cite the files
   - `[PARTIAL]` — partly exists; say what is missing
   - `[PLANNED]` — in the project details, not in code
4. **Grading rules** — the 3-state engine, computation formulas, rounding, target-grade maths, exactly as implemented
5. **Data model** — entities, attributes, relationships, storage, as implemented
6. **Roles and access** — who can do what today
7. **UX principles** — from the project details
8. **Long-term vision** — future phases, clearly marked as not in scope
9. **Backlog** — ideas not yet approved by the owner. Nothing here is a commitment
10. **Open questions**
11. **Changelog**

Rules for this phase:

- Describe; do not design. Record what exists and what is intended, not what you think it should be.
- Every place the code and the project details disagree goes in a list for the owner to settle.
- The owner has stated that only student functionality is implemented. Teacher score entry and every other non-student role are `[PLANNED]`, unless the audit found code for them, in which case ask.
- You may suggest features, and the owner may add some. All of them go under **Backlog** or `[PLANNED]`. None are built during this job.
- The data model and backend are documented as they are. No schema, API, or storage changes are planned or made in this job.

**Gate 1:** owner approves the text, then confirms the write. From here `SPEC.md` is locked.

---

## Phase 2 — Safety net

Behaviour must be provably unchanged, so capture it before changing anything.

0. **Make lint pass.** This is the first code task. Lint fails at the Phase 0 baseline (2 errors in `src/pages/GlobalSettings.jsx`), and `AGENTS.md` section 8 requires it to pass before every commit. Make the two smallest fixes that keep behaviour the same:
   - Replace the `useEffect` that calls `setPasswordIsSet(hasLocalPassword())` with the lazy initializer `useState(hasLocalPassword)`.
   - Remove the unused `met` binding.
1. **Characterization tests** (Vitest) for the grading logic: for a representative set of inputs (each task state, each weighting scheme found, edge cases such as empty and zero), record what the current code returns and assert it. These tests describe today's behaviour, right or wrong.
   - **Where to test:** the logic is already pure in `src/utils/`, so test those functions directly. Test through a component only for the grade-related logic that still lives in one: the Subject Detail target fallback, score-entry validation, and gauge clamping. Do not refactor first.
   - **Fixed date:** freeze the system date in every test. Semester assignment reads `new Date()` (`docs/AUDIT.md` B12).
2. **Baseline screenshots** of every screen at 375, 768, 1024, 1440, saved to `docs/baseline/`. These are the "before" reference for the UI work. Add what they reveal to the responsive section of `docs/AUDIT.md`.
   - **Fixed date:** the same frozen date as the tests.
   - **Seeded storage:** `localStorage` seeded from `src/utils/db.json` and signed in as `U1`, so every screen behind the login can be reached.
   - **Stable sidebar:** set `compugrade-sidebar-minimized` explicitly so the sidebar state is the same in every shot.
3. **Behaviour checklist** `docs/BEHAVIOUR_CHECKLIST.md`: the manual click-through for every user flow (add subject, enter score, set target, and so on) with the expected result.
4. **Lint and format**: set up ESLint and Prettier. Apply formatting to the whole codebase as one commit that contains nothing else. Exclude `.agents/`, `.claude/` and `.codestudio/` from ESLint, Prettier and Vitest.

**Gate 2:** tests pass on the untouched code; owner approves.

---

## Phase 3 — Plan

Write `docs/TASKS.md`. Nothing is implemented in this phase.

1. **Target file tree** — full tree plus a table of every move: old path → new path.
2. **Component plan** — each duplication group from the audit → the shared component that replaces it, with its props.
3. **shadcn mapping** — each hand-built element → the shadcn component that replaces it. List anything with no equivalent.
4. **Design tokens** — colors, type roles, spacing, radius, shadows. Derive them from the existing UI (pick the dominant values and merge near-duplicates); do not invent a new look. Show a before → after table of merged values.
5. **Responsive fixes** — per screen, from the audit and the baseline screenshots.
6. **Task list** — phases 4 to 9 (including 5a) broken into small tasks. Each task has: an ID, the files it touches, what changes, and an acceptance check. Each task leaves the app building and running.

Then review the plan before showing it:

- Open the files each task names and confirm they exist and contain what the task assumes. The code may have changed since the audit.
- Does any task change behaviour, data shape, wording, or branding? Remove or flag it.
- Does any task conflict with `SPEC.md`?
- Is any task too large to verify in one commit? Split it.
- Which tasks are risky (grading logic, data access)? Mark them and say how they are verified.
- Is anything from the audit left unaddressed? List it with the reason.

**Gate 3:** owner approves the plan and the tokens.

---

## Phases 4 to 9 — Implementation

Follow `docs/TASKS.md` in order. For each task: implement → lint, build, test → check affected screens → commit → tick the task. Stop at the end of each phase.

**Phase 4 — Foundations.** Set up the `@/` import alias (`vite.config.js` and a new `jsconfig.json`). Initialize Tailwind and shadcn/ui following the shadcn skill: detect what is already installed, and do not overwrite existing config blindly. Define tokens and themes in the one global stylesheet. No screen changes yet.

- **Check first:** before installing, confirm that `@tailwindcss/vite` supports Vite 8. If it does not, stop and ask.
- **No preflight yet:** add Tailwind **without preflight** (theme and utilities only). The app relies on its own CSS reset and element rules, so preflight would restyle every screen.
- **Rename tokens:** the existing `--color-*` variables in `src/assets/index.css` collide with Tailwind v4's theme namespace. In the same task, rename them to shadcn's semantic names (the before → after table comes from Phase 3).
- **shadcn setup:** **Base UI**, JavaScript (`tsx: false`).

**Phase 5a — Remove dead code.** Before any file moves, delete what `docs/AUDIT.md` §7, §8 and §11 list as unused. Behaviour does not change. One commit per group:

- unused files: `SelectSetting.jsx`, `StudentSettingsPrototype.jsx`, the empty `RuleCompare.jsx`, and the empty `components/ToggleSettings`
- unused assets
- dead global CSS classes
- the unreachable dark-theme CSS and `--*-dark` tokens
- the never-true `showLogin` state in `App.jsx`

**Keep all non-student code,** including the commented-out professor and admin routes. Phase 9 still does a final sweep.

**Phase 5 — Structure.** Move and rename files to the target tree. Moves only; fix imports. No content changes in these commits.

**Phase 6 — Logic clean-up.** Pull grade computation and data access out of components into `lib/` and `services/`. Characterization tests must pass unchanged.

- **Named exports:** convert default exports to named exports in dedicated tasks, separate from moves and from logic changes.
- **B9 fix:** a separate task, approved by the owner (`AGENTS.md` section 3). Sandbox draft scores move to `targetGradeSandbox.terms[term].draftScores` and stop writing `studentReportedScore`. Update the affected characterization test in the same commit, and say so in the commit message. This is the only Phase 6 task allowed to change a test's expected values.

**Phase 7 — Components and UI.** One screen at a time: replace hand-built elements with shadcn components, extract shared components, move all styling to tokens and utilities, delete the old CSS for that screen. After the last screen, only the global stylesheet remains.

- **Settings:** split into a settings-shell task plus one task per section: Profile, Account, Security, Notifications, Account Actions.
- **Sidebar:** gets its own task group. Phase 3 decides between shadcn `Sidebar` and composed primitives. Either way, focus trapping, Escape handling, the `compugrade-sidebar-minimized` key and the tablet default stay identical.
- **Preflight:** after the last screen, turn on Tailwind preflight as its own task, and check it against the baseline screenshots.

**Phase 8 — Responsive.** Apply the responsive fixes screen by screen at the four widths. This includes the approved sidebar threshold change: `PHONE_MAX_WIDTH` 760 → 767 and `TABLET_MAX_WIDTH` 1100 → 1023 (`AGENTS.md` section 3).

**Phase 9 — Clean-up and verification.**

1. Remove unused files, exports, CSS, and dependencies.
2. Run lint, build, and all tests.
3. Walk through `docs/BEHAVIOUR_CHECKLIST.md` in full.
4. Take "after" screenshots at the four widths into `docs/after/`.
5. Check the codebase against `AGENTS.md` sections 5 to 7 and list any remaining violations.
6. Check the app against `SPEC.md`: every `[BUILT]` feature still works the same.
7. Update section 4 of `AGENTS.md` and write `docs/REFACTOR_REPORT.md`: what changed, what was verified and how, bugs found and left alone, anything not done, and the branding notes handed over to the follow-up branch.

**Final gate:** owner reviews the report and merges the branch.

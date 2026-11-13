# CompUGrade — Clean-up Report

The codebase and UI clean-up ran on the branch `refactor/cleanup` from 2026-11-11 to 2026-11-13, following `docs/REFACTOR_WORKFLOW.md`. This report sums it up for the owner and for whoever works on the code next. The details of every task are in `docs/TASKS.md`; the audit it started from is `docs/AUDIT.md`.

## 1. Outcome

- **Behaviour is unchanged**, apart from the owner-approved exceptions in section 4. The behaviour checklist (`docs/BEHAVIOUR_CHECKLIST.md`) passes in full at 1440 and 375 wide (T9.3), and every `[BUILT]` feature in `SPEC.md` matches the code (T9.6).
- **Stored data is unchanged**, apart from one new optional field for sandbox drafts (section 4).
- **The UI is rebuilt on shadcn/ui** (Base UI) and Tailwind CSS v4. The 20 stylesheets became one, `src/index.css`, holding the design tokens, the text roles and the touch sizes.
- **Every screen works at 375, 768, 1024 and 1440 wide**: no page scrolls sideways, no text is below 14px except the 12px caption role, and every control is at least 44px below 1024 wide or on a touch screen.
- **Checks:** `npm run lint`, `npm run format:check`, `npm run build` and `npm test` (19 files, 369 tests) all pass. Screenshots from before and after are in `docs/baseline/` and `docs/after/`.
- **Branding is untouched.** The logo, name, favicon and page title are as they were; section 8 lists what the branding branch should look at.

## 2. What each phase did

| Phase | What happened |
| --- | --- |
| 0 Audit | Read the whole codebase without changing it: stack, routes, features, grading logic, data, components, styling, responsiveness, structure, bugs. Result: `docs/AUDIT.md`, with 21 bugs and risks (B1–B21) and 21 duplication groups (G1–G21) |
| 1 Spec | Wrote `SPEC.md`, the record of what CompUGrade is and does, from the audit and `docs/project_details.md`. The owner settled D1–D15 (where the code and the project details disagree) |
| 2 Safety net | Made lint pass, added Prettier and Vitest with characterization tests, a screenshot script (`npm run screenshots`) and the behaviour checklist. The date is frozen for tests and screenshots |
| 3 Plan | Wrote `docs/TASKS.md`: the target file tree and move table, the component plan for G1–G21, the shadcn mapping, the design tokens, the responsive fixes and the task list |
| 4 Foundations | `@/` import alias, Tailwind v4 (without its reset at first), shadcn initialised for Base UI in JavaScript, design tokens in the one global stylesheet |
| 5a Dead code | Deleted unused files and assets, dead CSS, the unreachable dark theme, never-true state and unused exports |
| 5 Structure | Moved every file into `app/`, `pages/`, `features/`, `components/`, `hooks/`, `lib/` and `services/` (moves and renames only) |
| 6 Logic | Moved grade logic and data access out of components into `lib/` and `services/` (`useDb`, `updateStudentRecord`, `formatGrade`, `validateScore`, targets, celebration, auth); fixed B9 (approved); switched every file to named exports |
| 7 UI | Rebuilt each screen on shadcn components and tokens and deleted its stylesheet: sidebar (shadcn `Sidebar`), header and footer, login, dashboard, subjects, Subject Detail, sandbox, grade rules, rule editor, Settings (now on the shared page shell). Then turned on Tailwind's reset |
| 8 Responsive | Fixed each screen at the four widths. Touch sizing applies below 1024 wide or on any touch screen (the `tap:` variant) |
| 9 Verification | A second duplication scan with 11 merges, removal of what was left unused, the full checklist walk, the after screenshots, the AGENTS and SPEC checks, and this report |

## 3. Owner decisions

**Gate 0 (2026-11-11), from `docs/AUDIT.md` §14:**

- R1–R15, the workflow and rule revisions: make lint pass first; test with a frozen date; add Tailwind without its reset and turn the reset on later; a dead-code phase before the moves; split Settings and the Sidebar into several tasks; the folder layout; one exported component per file; named exports in their own tasks; 14px minimum text plus a 12px caption role; Tailwind's default breakpoints; named status tokens; tooling folders excluded; keep the commented-out professor and admin routes; the B9 fix and the sidebar thresholds as exceptions.
- Keep B1–B8 and B10–B17 as they are.
- The dark theme is dead code.
- Use Base UI as shadcn's base library.

**Gate 3 (2026-11-11), from `docs/TASKS.md` §8:**

- D1: delete the unused Settings prototype.
- D2: add the `display` and `card-title` text roles.
- D3: add the missing General Sans weights; use only Khand and General Sans.
- D4: the rule editor's browser confirm becomes an `AlertDialog`.
- D5: sandbox drafts feed the sandbox only; a draft box starts from the real score.
- D6: remove `@types/react*`.
- D7: rebuild the sidebar on the shadcn `Sidebar` with the same look, with the behaviour points S1–S5.
- D8: the design tokens as listed, including the darker colours for WCAG AA.

**Gate 4 (2026-11-11), from `docs/TASKS.md` §8a:**

- Hover and focus styles may change, so that every rule sits in Tailwind's layers.
- Settings uses the shared page shell and the global styles.
- The "Workspace: Student" label goes.
- Generated shadcn components use the tokens and the token control heights.

**During the job:**

| Date | Decision | Where |
| --- | --- | --- |
| 2026-11-11 | Progress is shown as a gauge; semesters, branding and the features the UI already points to (CSV export, Recent Updates, header menu) are follow-up branches | `SPEC.md` §2, §10 |
| 2026-11-12 | Settings keeps its own "Help & Resources" button, beside the section tabs | T7.L0 |
| 2026-11-13 | The 21 arbitrary values inside generated components in `src/components/ui/` stay as generated | T7.Z |
| 2026-11-13 | Touch sizing applies below 1024 wide or on any touch screen ("width or touch") | T8.1 |
| 2026-11-13 | The "Show as a table" history tables keep their sideways scroll on phones | T8.3 |
| 2026-11-13 | B21 and a review of error handling are to-dos for after the clean-up | AUDIT §12 |
| 2026-11-13 | Of the second duplication scan, merge N1–N5, N8–N11, N13 and N15 | T9.0 |

## 4. Behaviour and data changes (all approved)

1. **B9, sandbox drafts are draft-only** (T6.12). Draft scores are stored in a new optional field, `targetGradeSandbox.terms[term].draftScores`, and never in `studentReportedScore`. They feed only the sandbox's result, gauges and chart. Scores saved by the old behaviour stay real scores (no migration).
2. **Sidebar widths** (T7.S1): the phone menu starts at 767px and below (was 760), and the sidebar starts minimised up to 1023px (was 1100), matching Tailwind's `md` and `lg`.
3. **Sidebar on shadcn `Sidebar`** (T7.S0–S6): the same look; the minimised state is still remembered under `compugrade-sidebar-minimized`; Ctrl/⌘+B toggles it; the sandbox picker closes the phone menu first.
4. **Rule editor confirmation** (T7.K2): "Delete … and all of its subcriteria?" is an `AlertDialog` with the same wording instead of the browser's confirm.
5. **Settings prototype deleted** (T5a.1) and **Settings on the shared page shell** (T7.L0), without the "Workspace: Student" label.

Smaller differences that came with the shadcn components are recorded in each task's note in `docs/TASKS.md`; for example, focus now returns to the button that opened a dialog, and several dialogs now also close with Escape.

## 5. Bugs found (`docs/AUDIT.md` §12)

| # | Bug | Status |
| --- | --- | --- |
| B1 | Settings › Account Actions › Log Out does nothing | Kept |
| B2 | Settings help opens only while Security is open | Kept |
| B3 | Settings Download and Clear do nothing; notification toggles aren't saved | Kept |
| B4 | The Settings account is per browser, not per user; changing the password there doesn't change the login password | Kept |
| B5 | 2FA "Turn off" shares its confirmation state with the session dialog | Kept |
| B6 | The Settings status timer is stored on a function recreated every render | Kept |
| B7 | Subject Detail's semester label is hard-coded | Kept; fix planned in the semesters branch |
| B8 | "Requests awaiting verification" can never appear | Kept |
| B9 | Sandbox drafts wrote the real score | **Fixed** (T6.12, approved) |
| B10 | An `officialScore` of `""` counts as official in one place and empty in another | Kept |
| B11 | Subject Detail's target fallback isn't range-checked | Kept |
| B12 | Semester assignment depends on today's date | Kept; fix planned in the semesters branch |
| B13 | The UI promises a CSV export, a working bell and profile menu, and real Recent Updates | Kept; features planned in a follow-up branch |
| B14 | The login redirect loses `?term=` | Kept |
| B15 | Passwords are stored in plaintext | Kept (prototype) |
| B16 | "Upcoming tasks" can't be emptied while typing | Kept |
| B17 | The celebration also fires on the expected grade | Kept (owner decision D3) |
| B18 | Lint failed | **Fixed** (Phase 2, R1) |
| B19 | The reduced-motion rule and a duplicated class depended on CSS load order | The rule is now in `src/index.css`, unchanged and explicit; the duplicate went with its stylesheet |
| B20 | `npm audit` advisories in dev-only tools | Kept. Now 9 (2 low, 7 moderate), all in the ESLint chain and the shadcn CLI's dependencies; none ships to users. Fixing them means downgrading or replacing those tools, which needs the owner |
| B21 | 2FA "Turn on" shows no message without a verified contact | Kept; to do after the clean-up |

## 6. AGENTS.md §5–7 items still open (T9.5)

1. **Pages that do more than compose:** `RuleDetailPage`, `GlobalSettings`, `SubjectDetail` and `LoginRegister` still hold logic, and the Sidebar holds the remove-subject data change.
2. **Files used by a second feature but kept in the first:** `HistoryChart` (used by the sandbox), `TermNavigation` (used by the sandbox page) and `SandboxSubjectPicker` (used by the Sidebar) sit where the approved move table put them; by the rule they belong in `src/components/`.
3. **Maths in components:** the sandbox rounds and clamps "Upcoming tasks" and turns weights into shares; the pill editor sums shares for dragging; the history chart and card compute the gap to the target; Subject Detail checks and writes the term target inline (kept at T9.0).
4. **Exports used only by tests:** 26 in `lib/`, kept as the tested API. `DraftInput`'s plain `<input>` default is never used.
5. **Generated components:** 21 arbitrary values (owner decision) and a `font-mono` in the unused chart tooltip.
6. **One-off text sizes:** the login preview's "96%" (`text-xl`) and the celebration's ✦ and 🏆 (`text-4xl`).
7. **The 12px caption role used beyond axes, badges and eyebrows:** the history chips' "target 90%" note, the chart legends, the header avatar's initials and the login preview's labels.
8. **Card padding:** Subject Detail's summary card has its own padding; the Settings section cards skip `CardContent`.
9. **Inline style with fixed values:** the login preview's bar heights and the celebration's confetti positions.
10. **Hand-built where shadcn has a primitive, on purpose:** the Account "Choose photo" file input (keeps its wording), the inline 2FA confirmation (B5), the pill editor's drag handles.
11. **Not required by AGENTS:** input-border contrast (WCAG 1.4.11) is only noted; the history tables scroll sideways on phones by decision.

## 7. SPEC.md text that no longer matches the code (T9.6)

The app does what `SPEC.md` describes; these are places where SPEC's own text is out of date. Changing SPEC needs the owner's two approvals (`AGENTS.md` §2).

1. F10 lists `src/components/Dialog.jsx`, deleted in T7.Z.
2. F14 lists `SettingRow.jsx` and `ToggleSetting.jsx`, deleted in T7.L4s; the Settings sections are now one component each.
3. F17 names a `Gauge` in `TargetGradeSandbox.jsx`; both pages now use `src/components/GradeGauge.jsx`.
4. §4 calls score validation "inside the components, duplicated"; it is one function, `validateScore` in `src/lib/scores.js`, since T6.4.
5. §4 rounding: a task's score percentage in the history table and tooltip shows 1 decimal ("90.0%"), as it always did; SPEC mentions only the 2-decimal grades.
6. §6 (f) lists the Settings prototype among code that still exists; it was deleted in T5a.1.
7. Incomplete rather than wrong: F10 and F11 don't list the newer rule and history components.

## 8. Branding notes for the branding branch (from `docs/AUDIT.md` §9)

Nothing here was changed. What the branding branch will find:

- **Name spellings:**
  - `CompUGrade` on the login page, the sidebar, the footer and the login copyright line ("© 2026 CompUGrade").
  - `CompuGrade` in the page title (`index.html`), the sidebar Help text, and the Settings "Account details" and "Log out" text.
  - `COMPUGRADE` in the Settings help eyebrow ("COMPUGRADE HELP").
  - `compugrade` in storage keys.
- **Logo marks:** two remain in the app.
  - The login page uses `src/assets/document-icon.svg` in its brand box (the `.auth-brand-*` rules in `src/index.css`).
  - The sidebar uses the inline gradient mark, now one shared component, `src/components/BrandMark.jsx`. Settings no longer shows its own copy, because it uses the shared sidebar.
- **Favicon:** `index.html` still has no `<link rel="icon">`, so `public/favicon.svg` is never used. Its colour `#406090` differs from the primary `#406093`. The other two unused files in `public/` were deleted as dead assets (T5a.2).
- **Taglines:** "A clearer picture. A stronger semester." and "Built for your potential." (footer); "MADE FOR STUDENTS. BUILT WITH PROFESSORS." (login hero).

## 9. After the clean-up

- **Owner to-dos:** fix B21, and review error handling.
- **Follow-up branches in `SPEC.md` §2:** branding; semesters (B7, B12); the features the UI already points to (B13); gauge enhancements (F17).
- **Decide one by one** which of the kept bugs in section 5 to fix (`SPEC.md` §9 Backlog).
- **Optionally:** the SPEC text updates in section 7, and the AGENTS items in section 6.

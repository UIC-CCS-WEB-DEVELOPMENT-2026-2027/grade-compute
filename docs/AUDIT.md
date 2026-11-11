# CompUGrade — Phase 0 Audit

- **Branch:** `refactor/cleanup`
- **Base commit:** `7c3178a`
- **Date:** 2026-11-11
- **Gate 0 status:** passed. The decisions are in §14.

Everything below comes from files that were opened and read. File paths are relative to the repo root unless they start with `src/`.

## 1. Stack

| Item | Found | Evidence |
| --- | --- | --- |
| Language | JavaScript (JSX, ES modules). No TypeScript; `@types/react*` are only there for editor hints | `package.json`; every file in `src/` is `.js` or `.jsx` |
| Package manager | npm (lockfile v3). Checked with Node 26.13.0 and npm 11.20.0. The README requires Node 20.19+ or 22.12+ | `package-lock.json`, `README.md` |
| React / Vite | react and react-dom 19.3.0 (`^19.2.8`); vite 8.3.5 (`^8.3.0`); @vitejs/plugin-react 6.1.1 | `npm ls --depth=0` |
| Router | react-router-dom 7.18.4, declarative `<BrowserRouter><Routes>` | `src/App.jsx` |
| State | Each component keeps its own `useState(() => getDb())`. Saves fire a `compugrade-db-updated` window event that other components listen for. Sidebar state is a module store read with `useSyncExternalStore`. No state library | `src/utils/db.js`, `src/components/shared/useSidebarState.js` |
| Data | Browser `localStorage` only, seeded from `src/utils/db.json`. **No network calls anywhere** (no fetch, axios or WebSocket). Hosted on Vercel with an SPA rewrite | `src/utils/db.js`, `vercel.json` |
| Styling | Plain CSS: 20 files, each imported by its component or page. Tokens are CSS variables in `src/assets/index.css` | §8 |
| UI libraries | Recharts 3.10.1 (charts) only | `package.json` |
| Tailwind / shadcn | Neither installed. No `components.json`, no `@/` alias, no `jsconfig.json` | repo root |
| Lint | ESLint 10 flat config (`js.recommended`, `react-hooks`, `react-refresh`). **Fails with 2 errors** (§2) | `eslint.config.js` |
| Format / Test | None: no Prettier, Vitest, React Testing Library or Playwright | — |

## 2. Run check (baseline)

| Command | Result |
| --- | --- |
| `npm ci` | Exit 0. 186 packages installed; `package-lock.json` unchanged. `npm audit` reports **4 moderate** advisories, all in `minimatch` pulled in by `eslint@10`/`@eslint/config-array`/`@eslint/js`. The suggested fix downgrades to eslint 9 (a breaking change). These are dev-only and were not changed |
| `npm run build` | Exit 0 in about 0.7 s. 681 modules. Output: `index-*.js` **799.73 kB** (234.70 kB gzip), `index-*.css` 173.39 kB (30.65 kB gzip), fonts 393 kB, mp3 109 kB. **Warning:** "Some chunks are larger than 500 kB after minification" (no code splitting) |
| `npm run dev` | Vite ready in 293 ms on `http://localhost:5173/`. `GET /` returned 200 (title `CompuGrade`). `GET /src/main.jsx` returned 200 (transform OK). No errors were printed |
| `npm run lint` | **Exit 1, 2 errors**, both in `src/pages/GlobalSettings.jsx`: 83:5 `react-hooks/set-state-in-effect` (`setPasswordIsSet(hasLocalPassword())` inside `useEffect`), and 637:59 `no-unused-vars` (`met`) |

## 3. Routes and screens

Every route except `/` is wrapped in `RequireStudent` (`src/components/shared/RequireStudent.jsx`). The guard redirects to `/` with `state.from = pathname` unless `activeUserId` belongs to a user with `role: "student"`.

| Route | Page | What the user can do |
| --- | --- | --- |
| `/` | `src/pages/auth/LoginRegister.jsx` | Log in with an email or user ID plus a password. Register as Student or Professor. A demo-account hint is shown. Already-signed-in users are not redirected away |
| `/student/dashboard` | `src/pages/student/StudentDashboard.jsx` | Current-semester badge. All-subjects grade-history chart (term switch, subject chips, click a point to open the task). Enrolled-subjects table (filter, search, add subject). Static "Recent Updates" list |
| `/student/subject` | `src/pages/student/SubjectMenu.jsx` | Same table with a semester picker (only the current semester can be selected) and a pending-requests list |
| `/student/subject/:subjectId` | `src/pages/student/SubjectDetail.jsx` | Term tabs (`?term=`). Target grade input. Official and expected gauges. Current Term Records: self-reported scores, custom tasks, official breakdown. Grade-history chart with the plan line. Sandbox link. Target-reached celebration (audio and confetti) |
| `/student/subject/:subjectId/sandbox` | `src/pages/student/TargetGradeSandboxPage.jsx` | Target Grade Sandbox: sandbox target, upcoming tasks and expected % per criterion, draft scores, result card, plan chart |
| `/student/rules` | `src/pages/student/GradeRules.jsx` | Rule cards with a bar, pie or table thumbnail (the choice is remembered). Search, duplicate, and delete with a replacement rule |
| `/student/rules/new`, `/student/rules/:ruleId` | `src/pages/student/RuleDetail.jsx` (`RuleDetailPage` wrapper) | View or edit name, tags and schools. Pill editor (drag or type %, add, split, rename, delete). Formula. Pie or table view. Save, save as new, discard, duplicate, delete. Impact-warning dialog |
| `/settings` | `src/pages/GlobalSettings.jsx` | Its own layout and sidebar. Profile (read-only), Account (edit details and photo), Security (password change with a simulated code, 2FA, sessions), Notifications (toggles), Account Actions |
| `*` | `<Navigate to="/" replace />` | — |

There are two other ways in. The sidebar's "Target Grade Sandbox" button opens `SandboxSubjectPicker`. Clicking a dashboard chart point goes to `/student/subject/:id?term=…&task=…`, which scrolls to and highlights that task.

## 4. Features as built

| Feature | Files |
| --- | --- |
| Auth (local, plaintext passwords) and route guard | `src/pages/auth/LoginRegister.jsx`, `src/components/shared/RequireStudent.jsx`, `src/utils/session.js` |
| Student hub, subject list, add or remove subject | `StudentDashboard.jsx`, `SubjectMenu.jsx`, `src/components/student/EnrolledSubjectsTable.jsx`, `AddSubjectForm.jsx`, `src/utils/subjects.js`, `Sidebar.jsx` (`removeSubjectEnrollment`) |
| 3-state grading engine and term records | `src/utils/grades.js`, `src/components/student/CurrentTermRecord.jsx`, `SubjectDetail.jsx` |
| Grade computation rules | `src/utils/rules.js`, `GradeRules.jsx`, `RuleDetail.jsx`, `src/components/shared/{PillEditor,PillLevel,RuleCard,RuleBar,RuleFormula,RuleHierarchyTable,RulePieChart,DeleteRuleDialog,Dialog}.jsx` |
| Target Grade Sandbox | `src/utils/sandbox.js`, `src/components/student/TargetGradeSandbox.jsx`, `TargetGradeSandboxPage.jsx`, `SandboxSubjectPicker.jsx` |
| Grade history charts and plan line | `src/utils/history.js`, `src/components/student/{HistoryChart,AllSubjectsHistory,SubjectGradeHistory,HistoryTooltip}.jsx`, `usePointHover.js`, `src/utils/focusTask.js`, `src/utils/cssColor.js` |
| Target-reached celebration | `SubjectDetail.jsx`, `src/assets/congrats_voice .mp3` |
| Data migrations (schema v1 to v2) | `src/utils/migrations.js`, `src/utils/db.js` |
| Collapsible, minimised or phone sidebar, and the Help popup | `src/components/shared/Sidebar.jsx`, `useSidebarState.js`, `src/assets/index.css` |
| Account settings prototype (separate account store, PBKDF2 password, simulated codes) | `src/pages/GlobalSettings.jsx`, `src/utils/localAccountStore.js`, `src/utils/prototypeVerification.js`, `src/components/SettingRow.jsx`, `ToggleSetting.jsx` |

`docs/project_details.md` mentions several features that aren't built:
- Custom emoji or accent colour per subject.
- A progress bar with a target "finish line" and a translucent sandbox fill. Circular gauges and a line chart exist instead.
- The mascot.
- Semester-over-semester GPA analytics.
- Any professor, parent or admin workspace.

## 5. Grading logic (exactly as implemented)

**Task percentage** (`src/utils/grades.js`, `taskPercentage`): `score / maxScore × 100`. It's null when `maxScore` isn't a number greater than 0 or when the score is empty. Values are parsed with `Number`, and `""`, `null` and `undefined` count as empty.

**The three states** (`grades.js`, `pickScore`):
- **Official** (`calculateOfficialGrade`): only a numeric `officialScore` counts. Tasks with `isCustomTask: true` are skipped entirely.
- **Expected / unofficial** (`calculateUnofficialGrade`): uses `officialScore` if it's numeric, otherwise `studentReportedScore` if that's numeric. Otherwise the task is **Empty** and isn't counted. Custom tasks are included.

**Criterion grade:** the plain mean of the criterion's task percentages. Every task counts equally whatever its `maxScore`.

**Term grade** (`calculateTermGrade`): `Σ(grade_c × w_c) / Σ w_c` over the deepest criteria that have a weight above 0 and at least one counted task, where `w_c = rule.effectiveMultipliers[leafId]`. The weights are renormalised to give "the grade so far". It's null if nothing counts.

**Final grade** (`calculateFinalGrade`): the mean of whichever of prelim, midterm and finals have a grade (equal weights). It's null if none do.

**Rounding:** the engine never rounds. Display rounding varies by place:
- Enrolled-subjects table: 1 decimal with trailing zeros removed (`Number(g.toFixed(1))`).
- Subject Detail gauges: `toFixed(0)` on screen, `toFixed(2)` in the aria label.
- Sandbox, history and tooltips: 2 decimals with trailing zeros removed.
- Sandbox gauge aria label: 0 decimals.

**Status** (`src/utils/subjects.js`): based on the expected final grade.
- 75 or more (`PASSING_GRADE`): "Passing".
- Below 75: "Below passing".
- Null: "No grades yet".

**Rule maths** (`src/utils/rules.js`):
- **Units.** Shares are integer hundredths of a percent (10000 = 100%). A typed percentage is rounded to 2 decimals.
- **Limits.** Each criterion is at least 1%. A level holds at most 8 criteria and the tree is at most 3 levels deep. Names are at most 30 characters and unique within their level (case-insensitive).
- **Effective shares.** Apportioned per level by largest remainder, ties going to the leftmost criterion. `effectiveMultipliers[leaf] = effective / 10000`.
- **Changing a percentage** trades with the right-hand neighbour, or the left-hand one for the last criterion.
- **Deleting a criterion** gives its share to the left neighbour, or the right neighbour if it was first.
- **Splitting a criterion** keeps the old id on the new child, so recorded tasks move into it.
- **Legacy rules.** Old `hierarchy` and AT/TLA rules are rebuilt when read.
- **Formula multipliers** have 4 decimals, with up to 2 trailing zeros trimmed.

**Sandbox** (`src/utils/sandbox.js`, `getSandboxPlan`). For each leaf criterion:
- **Scored tasks** use the official score, else the self-reported score. Custom tasks are included.
- **Slots.** `slots` = open tasks + `upcoming`.
- **`upcoming`** defaults to 1 if the criterion has no tasks, otherwise 0. It's rounded and clamped to 0–20.
- **`expected`** is clamped to 0–100, or null.
- **Criterion grade.** If `expected` is null, the grade is `scoredSum/total + (slots/total)·R`. Otherwise it's `(scoredSum + slots·expected)/total`.
- **Counted.** A criterion is counted when `total > 0` and its weight is above 0.

The term grade is then `A + B·R`, normalised over the counted weights. The status is:
- `empty` if nothing counts.
- `complete` if `B ≤ 0` (projected = A).
- `impossible` if `R > 100 + 1e-9`.
- `reached` if `R ≤ 0` (required 0).
- Otherwise `required`, where `required = min(100, roundUp2(R))` and `roundUp2(v) = ceil(v·100 − 1e-9)/100`.

The raw score needed on a task is `min(max, roundUp2(pct·max/100))`.

**Targets:**
- **Sandbox target:** `terms[t].sandboxDesiredFinalGrade`, then `terms[t].desiredFinalGrade`, then `sandboxDesiredFinalGrade`, then `desiredFinalGrade`, then 90. Each value is checked to be 0–100.
- **Subject target, history version** (`history.getTermTarget`): `terms[t].desiredFinalGrade`, then `desiredFinalGrade`, then 90. Checked to be 0–100.
- **Subject target, Subject Detail version:** the same chain written inline with `??` and `Number()`, and **not range-checked**.

**History** (`src/utils/history.js`):
- **Task order.** Tasks are ordered by first score time (the earlier of `studentScoredAt` and `officialScoredAt`), then by `createdAt`, then by the timestamp in a `CUSTOM-<ms>` id. Tasks with no time come first, in rule order.
- **Points.** Each point is the expected term grade using the tasks up to that step.
- **Ghost point.** The same grade, but with the student's replaced entry used instead of the official score.
- **"Target reached".** The last point is at or above the target.
- **Plan points.** These interleave the criteria that use the required %, followed by those with an expected %. The fill percentage is `required`, or 100 if the target is impossible, or the current grade clamped to 0–100 if the target is already reached.

**Celebration:** on Subject Detail, it fires when the official or the expected term grade moves from below the target to at or above it while the page is open (same subject and term). It shows a message, plays audio and runs confetti for 6 seconds.

**Score-entry validation:** done inside components, and duplicated (§7, G7):
- Digits only, between 0 and `maxScore`.
- No more integer digits than `maxScore` has.
- A custom task's `maxScore` must be a positive integer.

## 6. Data

The localStorage key `compugrade_db` holds the entire database, with `schemaVersion: 2`.

| Entity | Attributes used by the code |
| --- | --- |
| `users[]` | `id` (`U<n>`), `role` (`student`, `professor` or `admin`), `name`, `email`, `password` (**plaintext**), `programSection?` |
| `computationRules[]` | `id` (`CR-n`), `ruleName`, `tags[]` (only `Graduate` or `Undergraduate`), `schools[]`, `criteria` (a tree of `{id, name, weight (fraction of parent), children}`), `effectiveMultipliers {leafId: fraction}`, `isCopy?`, `copiedFromRuleId?`, legacy `hierarchy` |
| `subjects[]` | `id` (`SUB-n`), `subjectCode`, `subjectName`, `defaultComputationRuleId` |
| `classes[]` (one enrolment) | `id` (seed `C101`, new ones `C-<n>`), `subjectId`, `semester?`, `academicYear?`, `programSection`, `units` (always 3), `professorId`, `professorName?`, `status` (`verified` or `pending`), `computationRuleId`, `studentRecords[]` |
| `studentRecords[]` | `studentId`, `targetGradeSandbox {desiredFinalGrade, terms{[term]: {desiredFinalGrade, sandboxDesiredFinalGrade, criteria{[leafId]: {upcoming, expected}}, legacy upcomingAT/upcomingTLA/expectedExamScore}}}`, `grades {prelim, midterm, finals: {[leafId]: Task[]}}` |
| Task | `id`, `type`, `sequenceNumber`, `title`, `description`, `maxScore`, `officialScore`, `studentReportedScore`, `isCustomTask`, `studentScoredAt?`, `officialScoredAt?`, `createdAt?` |
| `verificationQueue[]` | `id` (`REQ-n`), `requestedByStudentId`, `subjectId`, `subjectCode`, `subjectName`, `programSection`, `requestedProfessorId`, `requestedProfessorName`, `computationRuleId`, `status`, `createdAt` |

The other localStorage keys are:
- `activeUserId`
- `compugrade-sidebar-minimized` (`"1"` or `"0"`)
- `compugrade_rule_thumbnail`
- `compugrade-account` (Settings profile, sessions, and a PBKDF2 `passwordCredential`)
- Legacy keys that are deleted when read: `compugrade-profile`, `compugrade-password` and `compugrade-settings-theme`

There are no backend calls.

## 7. Component inventory

| Component | Used by |
| --- | --- |
| `Sidebar` (renders `SandboxSubjectPicker`), `Header` | All 6 student pages |
| `PageFooter` | Dashboard, SubjectMenu, SubjectDetail, Sandbox page (**not** GradeRules or RuleDetail) |
| `RequireStudent` | `App` (8 routes) |
| `Dialog` (native `<dialog>`) | DeleteRuleDialog, RuleDetail, SandboxSubjectPicker |
| `DeleteRuleDialog` | GradeRules, RuleDetail |
| `DraftInput` | SubjectDetail, CurrentTermRecords |
| `PillEditor` (renders `PillLevel`) | RuleDetail |
| `RuleCard` (renders `RuleBar`, `RuleFormula`, `RuleHierarchyTable`, `RulePieChart`) | GradeRules |
| `RuleFormula`, `RuleHierarchyTable`, `RulePieChart` | RuleCard, RuleDetail |
| `EnrolledSubjectsTable` (renders `AddSubjectForm`) | Dashboard, SubjectMenu |
| `AllSubjectsHistory` | Dashboard |
| `HistoryChart` (uses `HistoryTooltip`, `usePointHover`) | SubjectGradeHistory, TargetGradeSandbox |
| `SubjectGradeHistory`, `CurrentTermRecords` | SubjectDetail |
| `TargetGradeSandbox` (internal `Gauge` and `SandboxResult`) | TargetGradeSandboxPage |
| `TermNavigation` (its `action` prop is never used) | SubjectDetail, TargetGradeSandboxPage |
| `SettingRow`, `ToggleSetting` | GlobalSettings |
| **Unused** | `src/components/SelectSetting.jsx`, `src/pages/StudentSettingsPrototype.jsx`, `src/components/shared/RuleCompare.jsx` (0 bytes), `src/components/ToggleSettings` (0 bytes, no extension) |

**Duplicated markup and logic.** Groups marked ⚠ look alike but mean different things. Don't merge them blindly.

**G1 Database subscription.** `useState(getDb)` plus the `DB_UPDATED_EVENT` listener is copied in 7 places: Dashboard, SubjectMenu, the Sandbox page, SubjectDetail, Sidebar, TargetGradeSandbox and SubjectGradeHistory. GradeRules, RuleDetail, CurrentTermRecords and Header read the database without listening for updates. Candidate for a `useDb` hook.

**G2 Page shell.** Sidebar + wrapper + Header + main + PageFooter, written with three different class sets (`dashboard-page/-shell`, `subject-detail-layout/-main`, `rules-layout/-main`). Header and footer presence is inconsistent: the "Subject not found" and SubjectMenu error states have no Header.

**G3 Modals.**
- `Dialog.jsx` is used 3 times.
- Six modals are hand-built:
  - Sidebar Help (styled entirely with inline styles)
  - Sidebar remove-subject alert dialog
  - SubjectDetail celebration
  - Three in GlobalSettings: session, log out of all sessions, help
- `PillLevel` uses `window.confirm`.

**G4 `formatGrade`.** Five identical 2-decimal copies (HistoryChart, AllSubjectsHistory, SubjectGradeHistory, HistoryTooltip, TargetGradeSandbox). ⚠ Two variants differ: 1 decimal (EnrolledSubjectsTable) and "Expected x%" (SandboxSubjectPicker).

**G5 Name initials.** Header `getInitials`, an inline version in SubjectDetail, and GlobalSettings `profileInitials`. They differ slightly in how they handle whitespace. ⚠ `EnrolledSubjectsTable.subjectInitials` takes letters from the subject code, which is a different purpose.

**G6 Gauge ring.** Two inline copies in SubjectDetail plus `Gauge` in TargetGradeSandbox. Their aria labels and `tabIndex`/`role` differ.

**G7 Score validation.** `CurrentTermRecords.checkScore` and `TargetGradeSandbox.saveDraftScore` use the same rules with different messages.

**G8 ⚠ Task label.** `CurrentTermRecord.taskName` (`title ??`), `history.taskLabel` (`title ||`) and the sandbox label (`title ||`, `index + 1`). The differences are subtle.

**G9 ⚠ "Has an official score".** `hasOfficialScore` and `getOfficialAssessments` treat `""` as official. `grades.js`, `sandbox.js`, `history.js` and the sandbox UI treat `""` as empty (see B10).

**G10 Small helpers copied:**
- `toNumber` ×3
- `clamp` ×2
- `resolveColor` ×2 (`src/utils/cssColor.js` and inside `RulePieChart`)
- the term list ×5 (`grades.TERM_KEYS`, `rules.TERM_KEYS`, `terms.TERMS`, `history.TERM_LABELS`, `TargetGradeSandbox.TERM_LABELS`)
- the default target `90` ×5
- the target lookup ×3
- `'activeUserId'` hard-coded in LoginRegister instead of using `ACTIVE_USER_KEY`

**G11 "Update one student record and save".** SubjectDetail `updateTargetGrade`, CurrentTermRecords `saveChanges`/`updateTerm`, TargetGradeSandbox `saveRecord`, and Sidebar's remove-subject code. Candidate for a helper in `services/`.

**G12 `commit()`.** A try/catch around `saveDb`, identical in GradeRules and RuleDetail.

**G13 Back link with an arrow SVG.** Identical in the Sandbox page and RuleDetail. GlobalSettings has a different one.

**G14 Brand mark SVG.** Identical inline copies in Sidebar and GlobalSettings.

**G15 Toggle-button groups (`aria-pressed`).** TermNavigation, AllSubjectsHistory term scope, GradeRules thumbnails, RuleDetail view switch, and the login tabs.

**G16 Legend list.** RuleBar and RulePieChart.

**G17 `role="tab"` without tab panels.** EnrolledSubjectsTable filter and GlobalSettings help tabs.

**G18 Label + input + error.** Login, AddSubjectForm, RuleDetail, the add-task form, and the Settings password fields.

**G19 ⚠ Password field with show/hide.** Login uses an icon; Settings uses "Show"/"Hide" text.

**G20 Empty or unavailable states.** Subject not found, Sandbox unavailable, Rule not found, and the SubjectMenu load error.

**G21 Chart setup.** HistoryChart and AllSubjectsHistory share the grid, axes, passing line and table fallback.

## 8. Styling inventory

**CSS files (20):**
- `src/assets/index.css`: tokens, reset, base element styles, sidebar, remove-subject dialog.
- Shared components: `Dialog`, `Header`, `PageFooter`, `PillEditor`, `RuleVisuals`.
- Student components: `AddSubjectForm`, `CurrentTermRecord`, `EnrolledSubjectsTable`, `HistoryChart`, `SandboxSubjectPicker`, `TargetGradeSandbox`, `TermNavigation`.
- Pages: `LoginRegister`, `GradeRules`, `RuleDetail`, `StudentDashboard`, `SubjectDetail`, `SubjectMenu`, `GlobalSettings` (2,500 lines, the largest).

**Every CSS file is effectively global,** because every route is imported eagerly. Styles also cross file boundaries:
- `.grade-gauge*` lives in `SubjectDetail.css` but the sandbox uses it.
- `.btn-secondary` and `.rule-card` live in `GradeRules.css` and are used by RuleDetail and RuleCard.
- `.sandbox-error` and `.term-nav-link` are each defined in two files, so which one wins depends on load order.
- `GlobalSettings.css` contains an **unscoped `*` reduced-motion rule** that applies to the whole app.

**Tokens:**
- `index.css` defines 81 custom properties: brand colours, 8 criteria colours with `-on` pairs, neutrals, overlays, shadows, a z-index scale and 2 fonts.
- Other files define their own: GlobalSettings 24, TargetGradeSandbox 13, PillEditor 5, LoginRegister 4, SubjectDetail 3.
- There are 903 `var(--…)` uses.

**Hard-coded colours:**
- 492 hex values (219 distinct), of which about 60 are token definitions. The biggest counts are CurrentTermRecord 104, SubjectDetail 77, LoginRegister 67 and StudentDashboard 56.
- 64 `rgb()`/`rgba()` values.
- In JSX: 5 confetti hex colours (SubjectDetail) and 2 `rgba()` values in the Sidebar Help popup's inline styles.
- The chart SVG attributes hard-code `fontSize` 11 and 12.

**Font sizes:**
- 475 declarations using **94 distinct values**, mixing px and rem.
- The most common are 10px ×44, 12px ×41, 11px ×35, 13px ×27, 9px ×23 and 8px ×16.
- **About 190 px and about 130 rem declarations are below 14px.** Only 11 use `clamp()`.

**Fonts:** Khand SemiBold for headings, and **only the Regular weight** of General Sans for body text. Body text set to weight 500–700 is bolded artificially by the browser.

**Themes:** one light theme. **The dark-theme CSS can't be reached.** About 300 `.global-settings.dark` rules and 16 `--*-dark` tokens exist, but no code adds the `dark` class, and the old theme key is deleted on load.

**Inline styles:** mostly acceptable, since they carry runtime values (criteria colours, chart positions, progress as CSS variables). The exception is the Sidebar Help popup, which is styled entirely inline.

**Dead global classes:** `.student-switcher*`, `.student-role-*`, `.dashboard-view-*`, `.text-official`, `.input-self-reported`, `.banner-pending`, `.container`, `.flex-row`, `.flex-col`, `.align-center`, `.justify-between`, `.btn-accent`.

## 9. Branding notes (recorded only; for the later branding branch)

**Name spellings:**
- `CompUGrade`: login page, sidebar, Settings brand, footer, header fallback.
- `CompuGrade`: the `index.html` `<title>`, the Sidebar Help text, and the Settings "Account details" and "Log out" text.
- `COMPUGRADE`: the Settings help eyebrow.
- `compugrade`: storage keys.

**Logo marks (3 different):**
- Login page: `src/assets/document-icon.svg` inside the `.brand-icon` box.
- Sidebar and Settings: an inline SVG with a smaller document path and a `#6d8ed0 → #4b6fbc` gradient, copied into both files.
- `public/favicon.svg`: the login path on `#406090`, which differs from the primary colour `#406093`.

**Favicon:** `index.html` has **no `<link rel="icon">`**, so `favicon.svg` is never used. `public/grade-rules-mark.svg` and `public/icons.svg` aren't referenced either.

**Taglines:** "A clearer picture. A stronger semester.", "Built for your potential.", "MADE FOR STUDENTS. BUILT WITH PROFESSORS.", "© 2026 CompUGrade".

## 10. Responsive check (from the code; screenshots follow in Phase 2)

**Breakpoints in use:**
- 760/761 is the main phone switch: 12 media queries, plus `PHONE_MAX_WIDTH` in JS.
- 640 appears 10 times.
- Also used: 480, 600, 900, 560, 380, 1000, 720, 520, 420 and 1200.
- JS also has `TABLET_MAX_WIDTH` 1100: the sidebar starts minimised at 1100px or less.
- Only 640 matches `sm 640 / md 768 / lg 1024 / xl 1280`.

**Fixed widths:** sidebar 310px (76px minimised), sidebar pop-out 260px, login card 454px, subject column `min-width: 220px`, settings sidebar 310px.

**At 768px** the app is on the "desktop" side of 760, so the sidebar is minimised (because 768 ≤ 1100) rather than shown as the phone menu.

**Enrolled-subjects table:** becomes stacked cards only at 640px or less. Between 641 and 760px it stays a table inside `overflow-x: auto`.

**Sandbox table:** scrolls sideways (`.sandbox-table-scroll`).

**Settings page:** has its own layout that stacks at 900px and again at 560px. It doesn't use the shared sidebar or phone menu.

**Touch targets below 44px:**
- remove-subject dialog buttons (about 34px)
- sidebar enrolled-subject rows
- 1.45rem delete icons on desktop
- chart chips
- pill-editor icon buttons

**Text below 14px** is widespread (§8).

### Screenshot findings (Phase 2)

**Setup.** `npm run screenshots` (`scripts/screenshots.mjs`) saves 56 full-page shots to `docs/baseline/<screen>-<width>.png`: 14 screens (including the 5 Settings sections and two Subject Detail terms) at 375, 768, 1024 and 1440 wide. Every shot uses:
- the clock frozen at 2026-11-11, the same date as the tests
- the seed database, signed in as `U1`
- `compugrade-sidebar-minimized` set to the state a new user gets at that width: `"1"` at 768 and 1024, `"0"` at 375 and 1440

The same pages were also measured in the browser (overflow, font sizes, target sizes).

**Confirmed from the code checks above:**
- At 768 the app is on the desktop side of 760, with the sidebar minimised.
- The enrolled-subjects table becomes cards only at 640 or less.
- The sandbox table scrolls sideways.
- Settings has its own layout and its own navigation, which wraps into two rows at 768.

**Horizontal scroll:**
- **Page level: none.** No screen scrolls sideways at any of the four widths.
- **Inside a container:**
  - Enrolled-subjects table (Dashboard and My Subjects) at 768: 609px of content in 557px, so the row arrow is hidden until the table is scrolled.
  - Sandbox "Tell us what is left" table at 1024: 540px in 494px.

**Overlap:**
- **Subject Detail gauges at 768 with the sidebar expanded.** The "Prelim official" and "Prelim expected" labels and rings run into each other. With the default minimised sidebar they fit. The same happens whenever the main column is about 460px wide.
- **No other overlapping or clipped content** was found at the default sidebar state. The only clipped elements are screen-reader-only text and the hidden labels of the minimised sidebar, both intended.

**Text below 14px:** on every screen at every width.
- **Sizes found:** 7, 8, 9, 10, 11, 12 and 13px, plus rem values that work out between 10.7 and 13.6px.
- **Smallest:** 7px, on Subject Detail and the sandbox.
- **Text elements below 14px per screen:** Subject Detail about 112–116, sandbox about 110–114, Dashboard about 84, login 8 (phone) and 34 (wider), Grade Rules pages 16–25, Settings sections 8–19.

**Touch targets below 44px** (phone and tablet):
- **Login:** the Log In / Create Account tabs are 164×36 on phones and 29×22 / 79×22 from 768 up. The show-password button is 26×28, and the inputs and submit button are 40–42px tall.
- **Header:** the bell (34×34) and the profile chevron (23×30).
- **Sidebar:** the minimise toggle (36×36). When expanded, the enrolled-subject rows are 28px tall and their delete buttons 23×23.
- **Subject Detail:** term tabs 37px tall, the target input (52×30 at 768, 54×40 on phones), score inputs 56×23 at 768, the breakdown toggle 26px tall, and the "Add custom task" button 38px tall.
- **Charts:** history chips 34px tall, "Show as a table" 27px tall, the table summary 32px tall, and the plan toggles 32–34px tall.
- **Subjects table:** row arrow 30×30, search 37px tall, filter tabs 33px tall.
- **Sandbox:** back link 36px tall, term tabs 38px tall, number inputs 35px tall, "How this is calculated" 36px tall.
- **Grade Rules:** the thumbnail toggles and card actions are 30px tall, the card link 35px tall, and the back link 36px tall.
- **Rule editor:**
  - pill icon buttons 24×24 and the pill % input 25×26
  - tag checkboxes 13×13
  - the name and school inputs and "Add school" are 38px tall
  - the view toggles are 30px tall
- **Settings:** nav items 42px tall, toggles 39px, buttons and inputs 41px.

**Screenshot artifact, not a bug:** the sidebar is `position: sticky` with `height: 100vh`, so in full-page shots it ends at the 900px window height.

## 11. Structure problems

**Misplaced files:**
- The rule editor and rule visuals are in `src/components/shared/`, but only the rules pages use them.
- The settings building blocks are in the `src/components/` root.
- `useSidebarState` and `usePointHover` sit next to components.
- `src/utils/` mixes three kinds of file:
  - pure logic: `grades`, `rules`, `sandbox`, `history`, `subjects`, `terms`
  - data access: `db`, `session`, `localAccountStore`, `migrations`
  - DOM helpers: `focusTask`, `cssColor`
- `GlobalSettings.jsx` is in the `src/pages/` root while the other pages are grouped.

**Naming:**
- `CurrentTermRecord.jsx` exports `CurrentTermRecords`.
- `RuleDetail.jsx` exports `RuleDetailPage`.
- One asset filename contains a space: `congrats_voice .mp3`.
- All 39 component files use default exports.
- Code style is mixed. Some files use 2 spaces and single quotes (LoginRegister, Header, GlobalSettings, `db.js`, `localAccountStore.js`); the rest use 4 spaces and double quotes.

**Dead code:**
- The 4 unused files listed in §7.
- `showLogin` state in `App.jsx`, which is never true.
- Commented-out professor and admin imports and routes in `App.jsx`. These are kept by owner decision.
- Unused exports:
  - `resetDatabase`
  - `getLocalLoginSessions`, `authenticateLocalAccount`, `defaultAccount`
  - `updateLocalSecuritySettings` (used only inside its own file)
  - `scoreTime`, `getScoredTasks`
  - `SCHEMA_VERSION`
  - 17 exports in `rules.js`
  - `roundUp2`, `getCriterionSettings`
  - `ACTIVE_USER_KEY`
- `Header`'s `user` prop is never passed.

**Unused assets:** `src/assets/bell-icon.png`, `user-profile.png` and `visibility-eye.svg`, plus the 3 SVGs in `public/`.

**Stale comments:** several cite documents that aren't in the repo: `project-master-context.txt`, `grade-rules-spec.txt`, `grades-guide.txt`, `database-guide.txt`.

**Dependencies:** all 4 runtime dependencies are used. `@types/react*` are optional since the project doesn't use TypeScript.

**Tooling copies:** `.agents/`, `.claude/skills/` and `.codestudio/` each contain a copy of the shadcn skill, including `.tsx`, `.mjs` and `.css` files.

## 12. Bugs and risks (reported only; current behaviour is kept unless §14 says otherwise)

| # | Finding |
| --- | --- |
| B1 | Settings › Account Actions › **Log Out does nothing**. `onLogout` is never passed to `GlobalSettings` |
| B2 | Settings **Help & Resources opens only on the Security tab**, because the modal is rendered inside `renderSecuritySection` |
| B3 | Settings "Download" and "Clear" do nothing. The notification toggles aren't saved. Account edits are saved on every keystroke, so "Save changes" does nothing extra |
| B4 | The Settings account (`compugrade-account`) is stored **per browser, not per user**. Its defaults are "Ysa Ang", "juandelacruz" and "juan.delacruz@…", with the bio "pangit" (Tagalog for "ugly"). Changing the password in Settings doesn't change the login password in `db.users` |
| B5 | 2FA "Turn off" reuses the `confirmCurrentLogout` state that the session modal also uses |
| B6 | `updateStatus.timeoutId` is stored on a function that's recreated every render, so `clearTimeout` never clears the earlier timer |
| B7 | Subject Detail shows a **hard-coded "FIRST SEMESTER · 2026–2027"** instead of the class's semester |
| B8 | My Subjects "Requests awaiting verification" **can never appear**. The filter drops any request whose subject has a class, and `addSubject` always creates one. The seed `REQ-1` is hidden for the same reason |
| B9 | Sandbox "Try draft scores" **writes the real `studentReportedScore`** (the same field Current Term Records edits) on every keystroke, without `DraftInput`. **The owner confirmed this is a bug, to be fixed (§14, R15).** |
| B10 | An `officialScore` of `""` is treated inconsistently. Current Term Records treats it as official and locked, and counts it in "N official assessments". The grade engine treats it as empty. This only happens with unusual data |
| B11 | The Subject Detail target isn't range-checked (`Number(...)` can produce `NaN`). The history and sandbox versions are checked |
| B12 | **Semester assignment depends on today's date.** Classes without a `semester`, including the seed `C101`, count as "First Semester of the current academic year". From January to July the Dashboard shows a different semester and those subjects disappear from it. The Sidebar always lists every semester |
| B13 | The Sidebar Help text promises "Export your gradebook anytime as a CSV", which doesn't exist. The header bell and profile chevron buttons do nothing. The Dashboard "Recent Updates" list is fictional static content |
| B14 | The login redirect keeps only `pathname`, so `?term=` is lost |
| B15 | Passwords are stored in plaintext in `db.json` and `localStorage`, including the demo admin `admin`/`admin`. Acceptable for a prototype, but worth noting for security |
| B16 | The sandbox "Upcoming tasks" input forces 0 the moment it's cleared, so it can't be emptied while typing |
| B17 | The celebration also fires on the *expected* grade. The project details describe it only for officially locked grades |
| B18 | Lint fails (§2), and AGENTS.md §8 requires lint to pass before every commit. Fixed by R1 |
| B19 | The unscoped `*` reduced-motion rule in `GlobalSettings.css`, and the duplicated `.sandbox-error`, both depend on CSS load order |
| B20 | `npm audit`: 4 moderate advisories in the dev-only ESLint chain (§2) |

## 13. Assumption check

| Assumption | Verdict | Evidence |
| --- | --- | --- |
| The app is React + Vite | **Confirmed** | `package.json`, `vite.config.js`, `src/main.jsx` |
| Only student functionality is implemented | **Mostly.** Non-student code exists (owner decision: keep all of it):<br>(a) commented-out professor and admin routes and imports for files that don't exist (`src/App.jsx`)<br>(b) registering as a Professor works and shows "workspace is coming soon" (`LoginRegister.jsx`)<br>(c) professor and admin logins are verified, then blocked with a message<br>(d) seed professor `U2` and admin `U3` (`src/utils/db.json`)<br>(e) `verificationQueue` approval data and the class `status` field, written by `addSubject` (`src/utils/subjects.js`)<br>(f) the unused "Dev: Switch Workspace" prototype and the dead `.student-switcher` / `.student-role-*` CSS<br>(g) the "Workspace: Student" box in Settings | the files listed |
| The target file tree in AGENTS.md §5 suits the codebase | **Mostly.**<br>• About 60 source files across 7 feature areas.<br>• `utils/` has to be split into `lib/` (pure logic) and `services/` (storage).<br>• `hooks/` is justified once `useDb` exists.<br>• "One folder per route" would create a folder for each single-file page | §7, §11 |
| The rules in AGENTS.md §6–7 fit what exists | **Partly.** JavaScript, CSS variables, the single light theme and React Router all fit. Conflicts:<br>• every component uses a default export<br>• some files contain private sub-components<br>• the 14px minimum vs current sizes<br>• breakpoints 760/1100 vs 768/1024<br>• "keep every theme" vs an unreachable dark theme<br>• grade-related logic in components (target fallback, score validation, gauge clamp) | §8, §10, §12 |
| shadcn/ui can be added without breaking the setup | **Yes, with 4 risks:**<br>(1) Tailwind v4 has to come first via `@tailwindcss/vite`, and its support for Vite 8 hasn't been verified.<br>(2) **Tailwind's preflight reset would restyle every screen**, because the app depends on its own reset and element rules.<br>(3) **Token names collide.** Existing `--color-primary`, `--color-accent` and so on already sit in Tailwind v4's `--color-*` namespace.<br>(4) A JavaScript setup (`tsx: false`), a new `@/` alias and a `jsconfig.json` are needed. `shadcn/chart` wraps Recharts, which suits the existing charts | §1, §8 |
| The phases are in a workable order | **Yes, with the revisions in §14.** Lint currently fails. Tests and screenshots need a fixed date and a seeded, logged-in localStorage. Tailwind preflight has to wait. Deleting dead code early saves work | §2, §12 |

## 14. Revisions and Gate 0 decisions

The owner approved all of these on 2026-11-11.

| # | Revision | Reason |
| --- | --- | --- |
| R1 | **Workflow, Phase 2, task 0: make lint pass.** Replace the effect with a lazy `useState(hasLocalPassword)` initialiser and remove the unused `met` | AGENTS.md §8 requires lint to pass before every commit |
| R2 | **Workflow, Phase 2:** run tests and screenshots with a **fixed date** and **localStorage seeded and logged in as U1**. Tests call the `utils/` functions directly, plus the calculations still inside components | Semester logic reads `new Date()` (B12); every screen except `/` needs a session |
| R3 | **Workflow, Phase 4:** add Tailwind **without preflight**, and rename the existing `--color-*` tokens to shadcn's semantic names in the same task. Turn preflight on as a separate task after Phase 7, with a screenshot check. Check that `@tailwindcss/vite` supports Vite 8 before installing | Keeps Phase 4 free of visible changes and avoids the token collision |
| R4 | **Workflow, new Phase 5a "Remove dead code"** before the file moves. Covers:<br>• unused files and assets<br>• dead CSS classes<br>• the unreachable dark-theme CSS and tokens<br>• `showLogin`<br>Non-student code is **kept** | Avoids moving and tokenising code that would be deleted anyway |
| R5 | **Workflow, Phase 7:** split **Settings** into a shell task plus one task per section. Give **Sidebar** its own task group. Phase 3 decides between shadcn `Sidebar` and composed primitives | Each task has to be verifiable in one commit |
| R6 | **AGENTS.md §5 folder mapping:**<br>• pure `utils` → `lib/`<br>• storage modules → `services/`<br>• DOM helpers → `lib/dom/` or their feature<br>• features: `auth`, `subjects`, `term-records`, `grade-rules`, `sandbox`, `history`, `settings`<br>• layout → `components/layout`<br>• pages grouped by area | Matches the real size of the codebase |
| R7 | **AGENTS.md §6:** "one *exported* component per file"; small private sub-components may stay in the same file | Avoids lots of tiny files |
| R8 | **AGENTS.md §6:** switch to named exports as separate Phase 6 tasks, never mixed into the file moves | 39 files use default exports |
| R9 | **AGENTS.md §7 typography:** 14px minimum, plus one **12px caption** role (chart axes, badges, eyebrows) | Owner decision |
| R10 | **AGENTS.md §7 breakpoints:** Tailwind defaults `sm 640 / md 768 / lg 1024 / xl 1280` | Owner decision |
| R11 | **AGENTS.md §7:** name the required semantic status tokens | These tokens exist and carry meaning |
| R12 | **AGENTS.md §7:** exclude `.agents/`, `.claude/` and `.codestudio/` from the stylesheet rule and from lint, format and tests | They're tooling copies, not app code |
| R13 | **Before Phase 1:** confirm that the `Edit(/SPEC.md)` ask rule also prompts when `SPEC.md` is first created | Protects the spec's first write |
| R14 | **AGENTS.md §6:** exception to "no commented-out code" for the commented-out professor and admin routes and imports in `src/App.jsx` | Owner decision: keep non-student code |
| R15 | **AGENTS.md §3, owner-approved exceptions:**<br>(a) **B9 fix:** sandbox draft scores become draft-only. They're stored in a new optional field, `targetGradeSandbox.terms[term].draftScores {taskId: score}`, and never written to `studentReportedScore`. It's a dedicated Phase 6 task, and the characterization test is updated in the same commit. There's no migration.<br>(b) **Breakpoints:** move the JS sidebar thresholds `PHONE_MAX_WIDTH` from 760 to 767 and `TABLET_MAX_WIDTH` from 1100 to 1023 in Phase 8 | Owner decisions |

**Other decisions:**
- Leave B1–B8 and B10–B17 as they are.
- The dark theme is dead code.
- The shadcn base library is **Base UI**.
- `npm ci` was approved for the run check.

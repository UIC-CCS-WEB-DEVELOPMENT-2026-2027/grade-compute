# CompUGrade — Clean-up Plan and Task List

- **Phase:** 3 (plan). Written 2026-11-11 against commit `6da752f`.
- **Sources:** `docs/AUDIT.md`, `SPEC.md`, `AGENTS.md`, `docs/BEHAVIOUR_CHECKLIST.md`, the Phase 2 screenshots, and a fresh read of every file named below.
- **Status:** a proposal until the owner approves it at Gate 3. Nothing here is implemented yet.

**How to use this file.** Work top to bottom, one task per commit, and tick the box in the same commit (`AGENTS.md` §8). Every commit must pass `npm run lint`, `npm run format:check`, `npm run build` and `npm test`.

**Verification levels** used in the tasks:

| Code | Meaning |
| --- | --- |
| **V-same** | `npm run screenshots -- <scratch dir>` is byte-identical to `docs/baseline/` for all 56 shots. Used for every task that must not change the screen |
| **V-tests** | The characterization tests pass **without changing any expected value** |
| **V-visual** | Re-take the screenshots and compare them by eye with `docs/baseline/` at 375, 768, 1024 and 1440. Every difference must be intended and listed in the commit message |
| **V-check** | Walk the named items of `docs/BEHAVIOUR_CHECKLIST.md` |
| **⚠ risky** | Touches grading logic, stored data, auth or app-wide styling. Needs every level listed, plus a careful review of the diff |

---

## 0. Found while planning (corrections to the audit)

1. **A third font is in use.** `SubjectDetail.css:162` and `CurrentTermRecord.css:8,138,599` set `font-family: Arial`. About 100 text elements on Subject Detail and the sandbox render in Arial, not General Sans. AUDIT §8 lists only two fonts. The token plan merges Arial into the body font (§4.5).
2. **Text contrast fails WCAG AA** for several colors in use (measured on white and on the page background `#f4f7f9`):
   - muted text `#64748b` reaches only 4.42 on the page background
   - `#8491a1` and `#94a3b8` reach 2.4–3.2
   - the self-reported blue `#4c8ce4` reaches 3.40 as text
   - the coral `#ff7070` reaches 2.69 as text
   - the error red `#c95d50` reaches 4.07
   - the yellow `%` and marker text `#e9c936` reaches 1.63

   §4.1 gives the nearest passing shade for each.
3. **Tailwind on Vite 8:** `@tailwindcss/vite` 4.3.5 lists `vite ^8` as a peer. The Phase 4 check passes today; repeat it at install time.
4. **shadcn `chart` pins `recharts@3.8.0`.** The app has 3.10.1. Adding `chart` must not downgrade Recharts (task T7.D2).
5. **shadcn `sidebar` has its own behaviour:**
   - it stores its state in a `sidebar_state` cookie
   - it adds a Ctrl/⌘+B shortcut
   - it uses its own 768px phone breakpoint
   - its widths (16rem / 3rem) differ from the app's 310px / 76px

   Each of these would change behaviour. See the Sidebar decision in §3.2.
6. **Conflict between the workflow and `SPEC.md`.** Phase 5a lists `src/pages/StudentSettingsPrototype.jsx` and the dead `.student-switcher*` / `.student-role-*` CSS for deletion. `SPEC.md` §6 (f) lists that prototype "with its CSS" as non-student code that is kept.
   - **Gate 3 decision (D1):** the owner decided they are dead code and are deleted in T5a.1 and T5a.3.
   - **Blocked:** those deletions wait until `SPEC.md` §6 (f) has been updated through the SPEC protocol.

---

## 1. Target file tree

Matches `AGENTS.md` §5. Folders are created only when a file moves into them.

```
index.html                         script src -> /src/app/main.jsx (T5.4)
src/
  app/
    App.jsx  main.jsx  RequireStudent.jsx
  pages/
    auth/LoginRegister.jsx
    student/StudentDashboard.jsx  SubjectMenu.jsx  SubjectDetail.jsx (+test)
            TargetGradeSandboxPage.jsx  GradeRules.jsx  RuleDetailPage.jsx
    settings/GlobalSettings.jsx
  features/
    auth/lib/accounts.js (+test)                          T6.11
    subjects/components/EnrolledSubjectsTable.jsx  AddSubjectForm.jsx
    term-records/components/CurrentTermRecords.jsx (+test)  TermNavigation.jsx
    grade-rules/components/PillEditor.jsx  PillLevel.jsx  RuleCard.jsx  RuleBar.jsx
                           RuleFormula.jsx  RuleHierarchyTable.jsx  RulePieChart.jsx
                           RuleLegend.jsx (T7.J1)  DeleteRuleDialog.jsx
    sandbox/components/TargetGradeSandbox.jsx (+test)  SandboxSubjectPicker.jsx
    history/components/HistoryChart.jsx  AllSubjectsHistory.jsx
                       SubjectGradeHistory.jsx  HistoryTooltip.jsx
            hooks/usePointHover.js
    settings/components/SettingRow.jsx  ToggleSetting.jsx  + one file per section (T7.L*)
  components/
    ui/            shadcn components, added by the CLI as each screen needs them
    layout/        Sidebar.jsx  Header.jsx  PageFooter.jsx  PageShell.jsx (T7.0b)
    Dialog.jsx     until T7.Z (replaced by ui/dialog)
    DraftInput.jsx  GradeGauge.jsx (T7.G2)  BackLink.jsx (T7.0b)  BrandMark.jsx (T7.0b)
  hooks/           useSidebarState.js  useDb.js (T6.9)
  lib/             grades.js  rules.js  sandbox.js  history.js  subjects.js  terms.js (+tests)
                   number.js  targets.js  scores.js  format.js (+tests, T6.1–T6.6)
                   utils.js (cn, from shadcn init)
    dom/           focusTask.js  cssColor.js
  services/        db.js  db.json  migrations.js  session.js  records.js (T6.7)
                   localAccountStore.js  prototypeVerification.js (+tests)
  assets/          fonts, svgs, congrats-voice.mp3
  test/            setup.js  fixedDate.js  fixtures.js  browser.js
  index.css        the only stylesheet (from src/assets/index.css, T4.1)
```

### 1.1 Move table (Phase 5, moves and renames only)

A file's test moves with it. Each per-component CSS file moves with its component and is deleted in Phase 7 when its screen is converted.

| Old path | New path | Task |
| --- | --- | --- |
| `src/assets/index.css` | `src/index.css` | T4.1 |
| `src/utils/grades.js`, `rules.js`, `sandbox.js`, `history.js`, `subjects.js`, `terms.js` and their `.test.js` | `src/lib/` (same names) | T5.1 |
| `src/utils/focusTask.js`, `src/utils/cssColor.js` | `src/lib/dom/` | T5.2 |
| `src/utils/db.js`, `db.json`, `migrations.js`, `session.js`, `localAccountStore.js`, `prototypeVerification.js`, `db.test.js`, `migrations.test.js` | `src/services/` | T5.3 |
| `src/App.jsx`, `src/main.jsx` | `src/app/` (and `index.html` script path) | T5.4 |
| `src/components/shared/RequireStudent.jsx` | `src/app/RequireStudent.jsx` | T5.4 |
| `src/components/shared/Sidebar.jsx`, `Header.jsx` (+`.css`), `PageFooter.jsx` (+`.css`) | `src/components/layout/` | T5.5 |
| `src/components/shared/useSidebarState.js` | `src/hooks/useSidebarState.js` | T5.5 |
| `src/components/shared/Dialog.jsx` (+`.css`), `DraftInput.jsx` | `src/components/` | T5.6 |
| `src/components/shared/PillEditor.jsx` (+`.css`), `PillLevel.jsx`, `RuleCard.jsx`, `RuleBar.jsx`, `RuleFormula.jsx`, `RuleHierarchyTable.jsx`, `RulePieChart.jsx`, `RuleVisuals.css`, `DeleteRuleDialog.jsx` | `src/features/grade-rules/components/` | T5.6 |
| `src/components/student/EnrolledSubjectsTable.jsx` (+`.css`), `AddSubjectForm.jsx` (+`.css`) | `src/features/subjects/components/` | T5.7 |
| `src/components/student/CurrentTermRecord.jsx` / `.css` / `.test.jsx` | `src/features/term-records/components/CurrentTermRecords.jsx` / `.css` / `.test.jsx` (name now matches the export) | T5.8 |
| `src/components/student/TermNavigation.jsx` (+`.css`) | `src/features/term-records/components/` | T5.8 |
| `src/components/student/TargetGradeSandbox.jsx` (+`.css`, `.test.jsx`), `SandboxSubjectPicker.jsx` (+`.css`) | `src/features/sandbox/components/` | T5.9 |
| `src/components/student/HistoryChart.jsx` (+`.css`), `AllSubjectsHistory.jsx`, `SubjectGradeHistory.jsx`, `HistoryTooltip.jsx` | `src/features/history/components/` | T5.10 |
| `src/components/student/usePointHover.js` | `src/features/history/hooks/usePointHover.js` | T5.10 |
| `src/components/SettingRow.jsx`, `ToggleSetting.jsx` | `src/features/settings/components/` | T5.11 |
| `src/pages/GlobalSettings.jsx` (+`.css`) | `src/pages/settings/` | T5.11 |
| `src/pages/student/RuleDetail.jsx` (+`.css`) | `src/pages/student/RuleDetailPage.jsx` (+`.css`) (name now matches the export) | T5.12 |
| `src/assets/congrats_voice .mp3` | `src/assets/congrats-voice.mp3` (no space in the name) | T5.12 |

**Deleted in Phase 5a, not moved:**
- `src/pages/StudentSettingsPrototype.jsx` (D1, after the SPEC update)
- `src/components/SelectSetting.jsx`
- `src/components/shared/RuleCompare.jsx`
- `src/components/ToggleSettings`
- `src/assets/bell-icon.png`, `user-profile.png`, `visibility-eye.svg`
- `public/grade-rules-mark.svg` and `public/icons.svg`

**Not touched (branding):** `public/favicon.svg`, `src/assets/document-icon.svg`, the inline logo SVGs, and the `<title>`.

---

## 2. Component plan (duplication groups from AUDIT §7)

| Group | Replacement | Where | Props / API | Task |
| --- | --- | --- | --- | --- |
| G1 Database subscription | `useDb({ live = true })` returns `[db, setDb]`. It reads with `getDb()` and, when `live`, re-reads on `compugrade-db-updated`. The 7 components that listen today use `live: true`. GradeRules, RuleDetail, CurrentTermRecords and Header keep `live: false`, so their re-render behaviour stays identical | `hooks/useDb.js` | `useDb(options)` | T6.9 |
| G2 Page shell | `PageShell` renders Sidebar, the main column, Header, `<main>` and PageFooter. The Header/Footer differences per page are preserved through props | `components/layout/PageShell.jsx` | `{ children, showHeader = true, showFooter = true, headerProps }` | T7.0b |
| G3 Modals | shadcn `Dialog` (information and forms) and `AlertDialog` (confirmations). `Dialog.jsx` is retired in T7.Z. `window.confirm` in PillLevel follows decision D4 | `components/ui/` | — | T7.* |
| G4 `formatGrade` | One function for the 5 identical 2-decimal copies. ⚠ The 1-decimal table version and "Expected x%" stay at their callers, built on the same function | `lib/format.js` | `formatGrade(value, { decimals = 2 })` → `"—"` or `"x%"`, trailing zeros removed | T6.5 |
| G5 Initials | ⚠ The three versions differ on whitespace. Merge **only** if a new test shows they give identical output for every input the app can produce (names from `db.users`, `professorName`, the Settings profile). Otherwise keep them separate and add a comment | `lib/format.js` | `getInitials(name)` | T6.6 |
| G6 Gauge ring | `GradeGauge`: label, ring, target marker. Two aria-label precisions and two focus behaviours stay, through props | `components/GradeGauge.jsx` | `{ label, grade, target, tone: "official" \| "expected", ariaDecimals: 0 \| 2, ariaLabelPrefix, focusable, role, details }` | T7.G2 |
| G7 Score validation | `validateScore(text, maxScore)` returns `{ ok, maxScore, maxIntegerDigits }`. Each component keeps its own message (the messages differ today) | `lib/scores.js` | — | T6.4 |
| G8 Task label ⚠ | Not merged: `title ??` vs `title \|\|` give different results for `""` | — | — | — |
| G9 "Has an official score" ⚠ | Not merged: different treatment of `""` (bug B10, kept) | — | — | — |
| G10 Small helpers | `toNumber`, `clamp` → `lib/number.js`. `resolveColor` → `lib/dom/cssColor.js` (RulePieChart's copy removed). Term lists → `lib/terms.js` (`TERMS`, plus derived `TERM_KEYS` and `TERM_LABELS`). Default 90 and the target lookups → `lib/targets.js` | `lib/` | — | T6.1–T6.3 |
| G10b `"activeUserId"` literal | LoginRegister uses `ACTIVE_USER_KEY` from `services/session.js` | — | — | T6.11 |
| G11 Update one student record | `updateStudentRecord(db, classId, studentId, update)` returns a new db. Callers keep their own save and error messages | `services/records.js` | — | T6.7 |
| G12 `commit()` | `saveDbSafely(db)` returns `{ ok, error }`. Both pages keep the message "Your changes could not be saved: …" | `services/db.js` | — | T6.8 |
| G13 Back link | `BackLink`: a shadcn `Button` (`variant="secondary"`) rendering a router `Link` with the arrow icon. GlobalSettings' different back link is converted in T7.L0 | `components/BackLink.jsx` | `{ to, children }` | T7.0b |
| G14 Brand mark | `BrandMark`: the identical inline SVG and gradient from Sidebar and GlobalSettings, **unchanged**. The login logo is a different mark and stays as it is (branding) | `components/BrandMark.jsx` | `{ className }` | T7.0b |
| G15 Toggle groups | shadcn `ToggleGroup` (single choice) for TermNavigation, the AllSubjectsHistory term scope, the GradeRules thumbnail and the RuleDetail view. The login Log In / Create Account switch becomes `Tabs` | `components/ui/` | — | T7.* |
| G16 Legend list | `RuleLegend` | `features/grade-rules/components/RuleLegend.jsx` | `{ items: [{ id, name, color, value }] }` | T7.J1 |
| G17 `role="tab"` without panels | EnrolledSubjectsTable filter → `ToggleGroup`. Settings help tabs → `Tabs` with panels | — | — | T7.E1, T7.L3 |
| G18 Label + input + error | shadcn `Field` / `FieldLabel` / `FieldError` | — | — | T7.* |
| G19 Password field ⚠ | Not merged into one look: Login keeps the eye icon and Settings keeps the "Show"/"Hide" text (wording is frozen). Both use `InputGroup` + `InputGroupAddon` button | — | — | T7.L2, T7.L3 |
| G20 Empty / unavailable states | shadcn `Empty` | — | — | T7.* |
| G21 Chart setup | A shared `HistoryChartFrame` for the grid, axes, the 75% passing line and the table fallback, used by HistoryChart and AllSubjectsHistory | `features/history/components/` | `{ scale, children, table }` | T7.D2 |

**Grade logic still inside components** moves to `lib/` in Phase 6:
- the Subject Detail target fallback → `lib/targets.js`
- the gauge clamp → `GradeGauge` / `lib/number.js`
- the celebration decision → `lib/celebration.js`
- score validation → `lib/scores.js`
- the sandbox draft-score write → `services/records.js`

---

## 3. shadcn mapping

shadcn is set up for **Base UI**, JavaScript (`tsx: false`), with the `@/` alias and the CSS file `src/index.css`. Components are added with the CLI only when a screen task needs them, so no unused files appear.

### 3.1 Element → component

| Hand-built element today | shadcn component | Notes |
| --- | --- | --- |
| All `<button>`s (≈15 class families: `btn-primary`, `btn-secondary`, `is-danger`, `primary-button`, `secondary-button`, `danger-button`, `enrolled-add-button`, `history-chip`, icon buttons, …) | `Button`: variants `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`; sizes `default`, `sm`, `lg`, `icon` | One height per size (§4.6) |
| Text, number and search inputs (score boxes, target, search, school, task name, settings fields) | `Input` | `DraftInput` keeps its logic and renders `Input` |
| Inputs with an addon (`%` after the target, `/ 100` after a score, the password eye or Show/Hide) | `InputGroup` + `InputGroupInput` + `InputGroupAddon` | |
| Native `<select>` (semester picker with disabled options, add-subject rule, custom-task category, replacement rule) | `NativeSelect` | Keeps native behaviour, including disabled options, the keyboard and the mobile pickers |
| Label + control + error | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend` | |
| Rule tag checkboxes | `Checkbox` inside `FieldSet` | |
| Register role radio cards (Student / Professor) | `RadioGroup` | |
| Settings `ToggleSetting` (notifications) | `Switch` | |
| `aria-pressed` toggle groups (G15) and the enrolled filter (G17) | `ToggleGroup` | |
| Dashboard chart subject chips (multi-select) | `Toggle` | |
| Login tabs, Settings help tabs | `Tabs` | |
| Settings section navigation | `Tabs` (vertical on wide screens) | Same sections and behaviour |
| `Dialog.jsx` (native `<dialog>`), Sidebar Help, session details, Settings help, sandbox subject picker, rule impact dialog, delete-rule dialog | `Dialog` | |
| Remove-subject alert, 2FA turn-off, log out of all sessions, `window.confirm` in PillLevel (D4) | `AlertDialog` | |
| Celebration overlay | `Dialog` with custom content | Confetti and audio stay custom; 6-second close kept |
| The whole sidebar (desktop, minimised and phone menu) | `Sidebar` (§3.2). The phone menu uses its built-in `Sheet` | Appearance kept |
| Minimised-sidebar pop-out subject list | `Popover` inside the `Sidebar` | |
| Minimised-sidebar icon labels (`data-tooltip`) | `SidebarMenuButton tooltip` (shadcn `Tooltip`) | |
| Cards (`*-card`, `.rule-card`, `.sandbox-card`, `.enrolled-subjects`, settings panels) | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | |
| Status pill ("Passing"), record tags ("Self Reported", "Custom Addition"), counts, "Viewing now", rule tags | `Badge` | |
| Header initials, instructor initials, Settings photo | `Avatar` + `AvatarFallback` | |
| Enrolled-subjects table, sandbox criteria table, rule hierarchy table, chart table fallbacks | `Table` | |
| `<details>` "Show as a table", "How this is calculated", the official breakdown toggle | `Collapsible` | |
| Dividers (`grade-card-divider`, sidebar rule) | `Separator` | |
| Form and save messages (`role="alert"` / `role="status"` boxes) | `Alert` for page-level messages, `FieldError` next to a field | Wording unchanged |
| "No subjects yet", "Subject not found", "Rule not found", "Sandbox unavailable" | `Empty` | |
| Recent Updates list, sessions list, sandbox picker rows, settings rows | `Item` | |
| Recharts `ResponsiveContainer` setups | `Chart` (`ChartContainer`) | T7.D2; Recharts stays at 3.10.1 |

**No shadcn equivalent (kept custom, composed from shadcn parts where possible):**
- **Grade gauge ring:** shadcn's `Progress` is linear. `GradeGauge` uses a conic-gradient defined as an `@utility` in `src/index.css`.
- **Pill editor:** the drag handles and the percentage strip. Its buttons and inputs become `Button`/`Input`.
- **Celebration confetti:** keyframes live in `src/index.css`.
- **Login hero "academic preview" card and bar animation.**
- **Chart dots, hit areas and tooltip content:** Recharts render props.
- **Rule pie rings:** Recharts.

### 3.2 Sidebar decision (R5): shadcn `Sidebar` (owner decision, Gate 3, D7)

The sidebar becomes the shadcn `Sidebar` (`SidebarProvider`, `Sidebar collapsible="icon"`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton` with `tooltip`, `SidebarMenuSub`, `SidebarFooter`, `SidebarTrigger`).

**The current appearance is kept:**
- the yellow `sidebar` background
- the 310px / 76px widths, through `--sidebar-width` and `--sidebar-width-icon`
- the brand block, nav items, the My Subjects count badge and expandable subject list, the Settings / Help / Logout group, and the coral Logout button

**The new behaviour is worked on during the clean-up**, as an approved exception. Today's behaviour differs from the component's in these places:

| Item | Today | shadcn `Sidebar` | Proposed handling (S1–S5 need owner confirmation; see §8) |
| --- | --- | --- | --- |
| S1 Remembered state | `localStorage` `compugrade-sidebar-minimized` (`"1"`/`"0"`) | Writes a `sidebar_state` cookie | Control the provider (`open` / `onOpenChange`) from `useSidebarState`. Keep the existing key and drop the cookie, so no new stored data |
| S2 Keyboard shortcut | None | Ctrl/⌘+B toggles the sidebar | Accept it as new behaviour |
| S3 Phone switch | 760px | `useIsMobile` at 768, so phone means 767 or less | Move `PHONE_MAX_WIDTH` to 767 (the approved threshold change) inside the sidebar group (T7.S1), so both agree |
| S4 Tablet default | Minimised at 1100 or less | Open by default | Keep: `defaultOpen` comes from `useSidebarState`, with the approved 1023 threshold (T7.S1) |
| S5 Minimised subject list | A pop-out list (Escape or an outside click closes it) | No pop-out; sub-menus are hidden in icon mode | Keep the pop-out with a `Popover` on the My Subjects button |

**Unchanged by the component:**
- the phone menu as a `Sheet` (focus trap and Escape, as today)
- the remove-subject `AlertDialog` (T7.S4)
- the Help `Dialog` (T7.S5)

---

## 4. Design tokens

All tokens live in `src/index.css`:
- values in `:root`
- Tailwind names through `@theme inline`

Values are taken from the existing UI: the most-used value wins, and near-duplicates merge into it. Text colors that fail AA are darkened by the smallest step that passes. **Phase 4 renames tokens without changing any value (V-same). The merged values below take effect in T7.0a.**

### 4.1 Colors: before → after

| Token (Tailwind name) | Value | Merges these values / old tokens | Contrast |
| --- | --- | --- | --- |
| `background` | `#f4f7f9` | `--color-bg-main` | — |
| `foreground` | `#2c2c2c` | `--color-text-locked`, `--auth-ink #2d3035`, `#292929`, `#1f2430`, `#1d2130`, `#0f172a`, `#1e293b`, `#334155`, `#26374e`, `#25364d`, `#172a43` | 12.98 on `background` |
| `card`, `popover` | `#ffffff` | `--color-surface`, `--color-white` (as a surface) | — |
| `card-foreground`, `popover-foreground` | `#2c2c2c` | — | 13.97 |
| `primary` | `#406093` | `--color-primary`, `--auth-primary #406090`, `#41669b`, `#41649d`, `#41649b`, `#315486`, `#2c4870` (as text) | 6.34 on white |
| `primary-foreground` | `#ffffff` | — | 6.34 on `primary` |
| `secondary` | `#e6edf9` | `--color-primary-soft`, `--color-bg-selected #edf1fa`, `#eef3fb`, `#eff6ff`, `#f1f6ff`, `#e0e9f6`, `#e5ebf4`, `#dbeafe` | — |
| `secondary-foreground` | `#406093` | — | 5.39 on `secondary` |
| `accent` | `#e6edf9` | hover backgrounds (same as `secondary`) | — |
| `accent-foreground` | `#406093` | — | 5.39 |
| `muted` | `#f1f5f9` | `--color-surface-muted #f1f2f4`, `--color-surface-hover #f5f6f8`, `--color-surface-soft #fafbfc`, `#f8fafc`, `#fbfcff`, `#f8faff`, `#f7f9fd`, `#f5f8fd`, `#f5f7ff`, `#fafaf9`, `#edf1f5`, `#edf2f8`, `#e8edf4` | — |
| `muted-foreground` | **`#5d6c81`** | `--color-muted #64748b`, `--color-text-subtle #777e88`, `--color-text-faint #a2a8b0`, `--auth-muted #647084`, `#8491a1`, `#71839c`, `#58749a`, `#535e70`, `#75869c`, `#68758a`, `#667085`, `#94a3b8`, `#9aa5b4`, `#8a9bb0`, `#aabbd3` (as text) | 4.54 on `secondary`, 4.97+ on the others (was 2.4–4.4) |
| `destructive` | **`#ab4f44`** | `--color-warning-strong #c95d50`, `--auth-error #b64056`, `#b42318`, `#dc2626`, `#ef4444` (error text, destructive actions) | 4.54+; white on it 5.5 |
| `border` | `#e2e8f0` | `--color-border`, `--color-border-soft #edf0f2`, `--color-border-strong #e3e6ea`, `#dce4ed`, `#e3e6e9`, `#d8e1ee`, `#dce6f3`, `#dbe5f3`, `#dce4ef`, `#e5ebf4` (as a border), `rgba(26,29,34,.06–.12)` | — |
| `input` | `#cbd5e1` | input outlines (`#cbd5e1`, `#d8e1ee`) | — |
| `ring` | `#4c8ce45c` | `--color-focus-ring rgba(76,140,228,.36)`, `rgba(76,140,228,.2)` | — |
| `overlay` | `#181c2257` | `--color-overlay`, `rgba(28,32,36,.6)`, `rgba(36,38,45,.7)`, `rgba(24,28,34,.25)` (dialog and menu backdrops) | — |
| `success` | `#36754a` | `--color-success` | 5.53 on white |
| `success-foreground` | `#ffffff` | — | 5.53 |
| `warning` | `#ff7070` | `--color-warning` (coral: warnings, the Logout button). Fill only, never text | — |
| `warning-foreground` | `#2c2c2c` | — | 5.19 on `warning` |
| `warning-soft` | `#f9e7e2` | `--color-warning-soft`, `#fff8f8`, `--color-warning-border` (as a fill) | — |
| `highlight` | `#fff799` | `--color-highlight`, `--color-bg-alt #fff79a`, `#fff38a` | — |
| `highlight-foreground` | `#2c2c2c` | — | 12.65 |
| `highlight-soft` | `#fff7d9` | `--color-highlight-soft`, `#fffdf5`, `#fcfbf8` | — |
| `highlight-strong` | `#e9c936` | `--color-highlight-strong`, `#d8bb37` (expected gauge), `#f1e7b8` (as a border). Fills, markers and rings only | — |
| `highlight-text` | **`#7b6b1d`** | `#8a7b3f`, and yellow text such as the target `%` (`#e9c936` as text) | 4.50+ (was 1.6–4.2) |
| `official` | `#2c2c2c` | locked official scores ("Deep Navy" in today's comment) | 13.97 |
| `self-reported` | `#4c8ce4` | `--color-accent`, `#4d8ee5`, `#4385ff`, `#5b7bc7`. Fills, dots, rings and borders | — |
| `self-reported-foreground` | **`#3b6cb0`** | `#2563eb`, `#1e3a8a` and self-reported values shown as text | 4.51+ (was 3.40) |
| `criteria-1` … `criteria-8` and `criteria-N-on` | unchanged values | `--color-criteria-*` (rename only) | — |
| `sidebar` | `#fff799` | the sidebar background (= `highlight`) | — |

**Removed:**
- In T5a.4: the 16 `--*-dark` tokens and `--color-success-dark` / `--color-danger-dark`, if unused after the dark CSS goes. That is unreachable code.
- In T7.Z: the translucent-white tokens (`--color-surface-overlay*`), replaced by opacity modifiers on tokens (`text-primary-foreground/45`); the file-local aliases (`--compu-yellow`, `--text`, `--line`, `--card`, `--auth-*`, `--result-*`, `--grade-color`, `--pill-*`), replaced by the tokens above; and the 7 hard-coded JSX colors (confetti, Help popup), which use `criteria-*` and `overlay`.

### 4.2 Typography roles

The fonts are Khand SemiBold for headings and General Sans Regular for everything else. Arial goes (§0.1).

| Role | Font, weight | Size (phone → md and up) | Line height | Merges today's sizes |
| --- | --- | --- | --- | --- |
| `page-title` | Khand 600 | 30 → 36px | 1.1 | h1 20.8–40.8px ("Student Overview", "My Subjects", "IT101 - …", "New rule", "Settings") |
| `section-title` | Khand 600 | 24 → 30px | 1.15 | h2 21.6–34px ("Prelim Grade History", "Enrolled Subjects", "Current Term Records", …) |
| `body` | General Sans 400 | 16px | 1.5 | 14.8–17.6px running text |
| `small` | General Sans 400 / 600 | 14px | 1.45 | 12.8–15.4px helper text, table cells, buttons, inputs, **and all non-caption text below 14px** (8–13.6px) |
| `caption` | General Sans 600, uppercase where it is today | 12px | 1.3 | 7–12px chart axes, badges and eyebrow labels only |

**Two more roles (approved at Gate 3, D2; added to `AGENTS.md` §7):**

| Role | Font, weight | Size (phone → md and up) | Line height | Merges today's sizes |
| --- | --- | --- | --- | --- |
| `display` | Khand 600 | 40 → 48px | 1.05 | The login hero heading (52px). Used there only |
| `card-title` | Khand 600 | 20px | 1.2 | h3 card titles at 20–23px |

**Fonts and weights (D3).**
- Only Khand and General Sans, from `src/assets/`.
- Weights are 400, 600 and 700 (merges 500–690 and 800):
  - Headings use Khand 600; `Khand-SemiBold.ttf` is already in `src/assets/`.
  - Body text uses General Sans 400, 600 and 700. Only `GeneralSans-Regular.otf` exists today, so 600 and 700 are synthesized by the browser.
- T7.0c adds the General Sans Semibold and Bold files, from the type foundry's official download (check that the licence allows bundling), so the bold text is real.

### 4.3 Spacing

Tailwind's 4px scale (`--spacing: 0.25rem`). Existing values snap to the nearest step. `0.5` (2px) and `1.5` (6px) are kept for fine gaps.

| Before (px) | After (px) | Before (px) | After (px) |
| --- | --- | --- | --- |
| 1, 2, 3 | 2 | 17, 18, 19 | 16 (17), 20 (18, 19) |
| 5 | 4 | 21, 22, 23 | 20 (21), 24 (22, 23) |
| 7 | 8 | 25, 26, 27 | 24 (25, 26), 28 (27) |
| 9 | 8 | 29, 30, 33, 34 | 28 (29), 32 (30, 33, 34) |
| 11, 13 | 12 | 38, 42, 43, 44 | 40 (38, 42), 44 (43, 44) |
| 15 | 16 | 50, 54, 56, 58, 60+ | 48, 56, 56, 56, 64 |

**Component sizes** (one size per variant, everywhere):

| Thing | Size |
| --- | --- |
| Button `default` | 40px tall (44px on phone/tablet, T8) |
| Button `sm` | 32px (desktop only, T8) |
| Button `lg` | 48px |
| Button `icon` | 40px (44px on phone/tablet) |
| Input | 40px (44px on phone/tablet) |
| Card padding | 24px (`p-6`), 16px on phone (`p-4`) |
| Card gap | 16px |
| Page gutter | 16px phone, 32px md, 40px lg |

### 4.4 Radius, shadows, z-index

**Radius.** `--radius: 0.5rem` (8px). The Tailwind/shadcn scale derives from it:

| Name | Value | Merges today's values |
| --- | --- | --- |
| `sm` | 4px | 1–5px, 0.35rem |
| `md` | 6px | 6–7px, 0.4–0.45rem |
| `lg` | 8px | 8–10px, 0.5–0.6rem |
| `xl` | 12px | 11–14px, 0.7–0.85rem |
| `2xl` | 16px | 16–18px |
| `3xl` | 24px | 20–22px, 1.25rem |
| `full` | — | 999px, 9999px, 50% |

**Shadows:**

| Token | Value | Merges today's values |
| --- | --- | --- |
| `shadow-card` | `0 8px 22px rgb(49 84 134 / 0.06)` | `--shadow-card`, card shadows |
| `shadow-hover` | `0 12px 28px rgb(30 36 44 / 0.09)` | `--shadow-hover*`, `0 8px 24px` |
| `shadow-dialog` | `0 18px 50px rgb(24 28 34 / 0.17)` | `--shadow-dialog`, `0 12px 32px`, `0 1rem 2.5rem`, `0 0 40px` |
| focus | `ring-3 ring-ring` | `0 0 0 3px var(--color-focus-ring)` ×5, `0 0 0 2px #dbeafe` |
| `inset` accents (active row bars) | Tailwind `inset-shadow`/border utilities with tokens | — |

**z-index:** the `--z-*` scale stays as it is and is used as `z-(--z-modal)`. shadcn overlays keep their own stacking, per the shadcn rules.

### 4.5 Breakpoints

| Before | After |
| --- | --- |
| `max 760` / `min 761` (12 + 4) | `md` (768). Mobile-first: base = phone, `md:` = tablet and up |
| `max 640` (10), 560, 600, 520 | `sm` (640) |
| `max 480`, 420, 380 | base (phone) styles. No breakpoint below 640 |
| 720 | `md` |
| 900, 1000 | `lg` (1024) |
| 1200 | `xl` (1280) |
| JS `PHONE_MAX_WIDTH` 760, `TABLET_MAX_WIDTH` 1100 | 767 and 1023 (T7.S1, approved exception) |

---

## 5. Responsive fixes per screen (Phase 8)

These come from AUDIT §10 and the Phase 2 screenshots and measurements. All screens get the following:
- text at least 14px, except the 12px caption role
- touch targets at least 44px on phone and tablet
- no fixed pixel widths (sidebar 310/76px, pop-out 260px, login card 454px and the subject column's `min-width: 220px` become tokens or `max-w-*`)

| Screen | Fixes |
| --- | --- |
| **Global** | Sidebar thresholds 767/1023 (done in T7.S1). Header bell and chevron to 44px. Sidebar minimise toggle, subject rows and delete buttons to 44px |
| **Login** | Tabs to 44px tall. Inputs and submit to 44px. Eye button to 44×44. At 768 the form column is cramped and "YOUR ACADEMIC GUIDE" sits loose at the top: stack the hero above the form below `lg` |
| **Dashboard** | History chips, toggles and "Show as a table" to 44px. The subjects table becomes cards below `md`, so no inner scroll at 768. Search and filters to 44px |
| **My Subjects** | Same table fix. Semester picker to 44px |
| **Subject Detail** | Gauges stack (or shrink) when the main column is under about 520px, fixing the overlap at 768 with the sidebar expanded. Term tabs, sandbox link, target input and score inputs to 44px. Add-task button and breakdown toggle to 44px |
| **Sandbox** | The criteria table becomes stacked rows below `lg`, so no inner scroll at 1024. Number inputs, back link, term tabs and "How this is calculated" to 44px |
| **Grade Rules** | Thumbnail toggles, card actions and the card link to 44px |
| **Rule editor** | Pill icon buttons to 44px hit areas (a visual dot can stay smaller inside a 44px button). The % input, tag checkboxes (inside a 44px label row), name and school inputs, "Add school" and the view toggles to 44px |
| **Settings** | Nav items, toggles, buttons and inputs to 44px. Its own layout keeps 2 nav rows at `md` and stacks below `sm` |

---

## 6. Task list

Each task gives the files, the change and the acceptance check. ⚠ marks the risky ones.

### Phase 4 — Foundations (no screen changes)

- [ ] **T4.1 Move the global stylesheet.**
  - Files: `src/assets/index.css` → `src/index.css`; `src/main.jsx` (import); font `url()` paths inside the file.
  - Change: move only.
  - Check: V-same.
- [ ] **T4.2 `@/` import alias.**
  - Files: `vite.config.js` (`resolve.alias`), a new `jsconfig.json` (`paths`).
  - Change: no import is changed yet. Vitest picks up the alias from `vite.config.js`.
  - Check: V-same, and a one-off import through `@/` builds.
- [ ] **T4.3 ⚠ Tailwind v4 without preflight, plus token rename.** (One task, per R3.)
  - Re-check that `@tailwindcss/vite` supports Vite 8; stop if it doesn't.
  - Install `tailwindcss` and `@tailwindcss/vite` and register the plugin.
  - At the top of `src/index.css`: `@layer theme, base, components, utilities;` then import `tailwindcss/theme.css` and `tailwindcss/utilities.css` only (no preflight).
  - Move the existing reset and element rules (`*`, `body`, `button`, `input`, `h1–h4`, `img`, …) into `@layer base`, so utilities can win over them later.
  - Rename every `--color-*` token to the §4.1 names **at today's values**, across all CSS and JSX. `@theme inline` maps them for Tailwind.
  - Check: V-same, plus a grep showing no `--color-` left outside `@theme`.
- [ ] **T4.4 ⚠ Initialise shadcn.**
  - `npx shadcn@latest init` with base **Base UI**, `tsx: false`, CSS `src/index.css`, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. Use `--dry-run`/`--diff` first and merge by hand.
  - Keep the tokens from T4.3.
  - Remove or postpone anything init adds that changes the screen (its base-layer `body`/`*` rules) until T7.P.
  - Keep the fonts: if init or a preset adds a font (for example Geist) or font variables, remove them. `--font-heading` stays Khand and `--font-sans` maps to General Sans (`AGENTS.md` §7).
  - Add a scoped border reset for shadcn components while preflight is off: `[data-slot], [data-slot] *` get `border: 0 solid`.
  - Creates `components.json` and `src/lib/utils.js` (`cn`). Installs the packages the CLI adds (approved).
  - Check: V-same, plus a scratch render of `Button` in a test (not committed in a page).
- [ ] **T4.5 Add the new design tokens.**
  - File: `src/index.css`.
  - Add the §4 tokens that don't exist yet (`highlight-text`, `self-reported-foreground`, `overlay`, the type roles from D2, spacing and component sizes, radius, shadows, `--sidebar-width*`), with `@theme inline` names.
  - Nothing uses them yet.
  - Check: V-same.

### Phase 5a — Remove dead code (V-same for every task)

- [ ] **T5a.1 Unused files.**
  - Delete: `src/components/SelectSetting.jsx`, `src/components/shared/RuleCompare.jsx` (0 bytes), `src/components/ToggleSettings` (0 bytes), and `src/pages/StudentSettingsPrototype.jsx` (D1).
  - **Blocked** until `SPEC.md` §6 (f) is updated through the SPEC protocol.
  - Check: V-same, and nothing imports the deleted files.
- [ ] **T5a.2 Unused assets.**
  - Delete: `src/assets/bell-icon.png`, `user-profile.png`, `visibility-eye.svg`; `public/grade-rules-mark.svg`, `public/icons.svg`.
  - Keep `public/favicon.svg` (branding).
  - Check: V-same, and grep finds no reference to them.
- [ ] **T5a.3 Dead global CSS classes.**
  - Remove: `.student-switcher*`, `.student-role-*` (D1, after the SPEC update), `.dashboard-view-*`, `.text-official`, `.input-self-reported`, `.banner-pending`, `.container`, `.flex-row`, `.flex-col`, `.align-center`, `.justify-between`, `.btn-accent`.
  - Check: V-same, plus a grep of JSX for each class name.
- [ ] **T5a.4 Unreachable dark theme.**
  - Remove all `.global-settings.dark` rules (`GlobalSettings.css`), the `--*-dark` tokens (`index.css`), and any token used only by them.
  - Check: V-same.
- [ ] **T5a.5 `showLogin`.**
  - Remove the never-true state and its branch in `App.jsx`.
  - Keep the commented professor/admin imports and routes exactly as they are (R14).
  - Check: V-same; checklist A1, A14, A16.
- [ ] **T5a.6 Unused exports and props.**
  - Remove: `resetDatabase` (`db.js`); `getLocalLoginSessions`, `authenticateLocalAccount` and the `defaultAccount` export (`localAccountStore.js`, if unused inside the file the export keyword only); Header's never-passed `user` prop; TermNavigation's never-used `action` prop.
  - Exports used by tests stay.
  - Check: V-same, V-tests.

### Phase 5 — Structure (moves and renames only; fix imports using `@/`; V-same and V-tests for every task)

- [ ] **T5.1** `utils/` pure logic and tests → `lib/` (table §1.1).
- [ ] **T5.2** `focusTask.js`, `cssColor.js` → `lib/dom/`.
- [ ] **T5.3** Storage modules and tests → `services/`. `src/test/fixtures.js` imports `@/services/db.json`.
- [ ] **T5.4** `App.jsx`, `main.jsx`, `RequireStudent.jsx` → `app/`. The `index.html` script path changes to `/src/app/main.jsx`; the title is untouched.
- [ ] **T5.5** Sidebar, Header, PageFooter (+CSS) → `components/layout/`. `useSidebarState.js` → `hooks/`.
- [ ] **T5.6** Rule editor and visuals → `features/grade-rules/components/`. `Dialog.jsx` (+CSS) and `DraftInput.jsx` → `components/`.
- [ ] **T5.7** EnrolledSubjectsTable and AddSubjectForm (+CSS) → `features/subjects/components/`.
- [ ] **T5.8** `CurrentTermRecord.*` → `features/term-records/components/CurrentTermRecords.*`. TermNavigation (+CSS) → the same folder.
- [ ] **T5.9** TargetGradeSandbox (+CSS, test) and SandboxSubjectPicker (+CSS) → `features/sandbox/components/`.
- [ ] **T5.10** History components (+CSS) → `features/history/components/`. `usePointHover.js` → `features/history/hooks/`.
- [ ] **T5.11** SettingRow and ToggleSetting → `features/settings/components/`. GlobalSettings (+CSS) → `pages/settings/`.
- [ ] **T5.12** `RuleDetail.jsx` → `RuleDetailPage.jsx` (+CSS). `congrats_voice .mp3` → `congrats-voice.mp3`. Then remove the empty `components/shared/`, `components/student/` and `utils/`.

### Phase 6 — Logic clean-up (V-tests and V-same for every task unless stated)

- [ ] **T6.1 `lib/number.js`.**
  - `toNumber`, `clamp` (G10). Used by `grades.js`, `sandbox.js`, `history.js`, `rules.js`.
  - Add unit tests.
- [ ] **T6.2 One term list.**
  - `lib/terms.js` exports `TERMS`, `TERM_KEYS`, `TERM_LABELS`.
  - Replace the copies in `grades.js`, `rules.js`, `history.js` and `TargetGradeSandbox.jsx`.
- [ ] **T6.3 ⚠ `lib/targets.js`.**
  - Contents: `DEFAULT_TARGET`, `getTermTarget` (from history), `getSandboxTarget` (from sandbox), and `getSubjectDetailTarget`, which is **not range-checked** (keeps B11; the SubjectDetail tests cover it).
  - Replaces the 5 copies of `90` and the 3 lookups.
- [ ] **T6.4 `lib/scores.js`.**
  - `validateScore` (G7), used by CurrentTermRecords and TargetGradeSandbox. Messages stay in the components.
  - Add unit tests. Component tests unchanged.
- [ ] **T6.5 `lib/format.js` `formatGrade`** (G4).
  - Replace the 5 identical copies. The 1-decimal and "Expected" variants are built on it with the same output.
  - Add unit tests.
- [ ] **T6.6 Initials (G5).**
  - Add tests comparing the three versions. Merge only if they match; otherwise document why they stay separate.
- [ ] **T6.7 ⚠ `services/records.js` `updateStudentRecord`** (G11).
  - Used by SubjectDetail, CurrentTermRecords, TargetGradeSandbox and Sidebar's remove-subject code.
  - Check: V-tests, V-same, checklist F3, G4, H3, H8, I6–I9.
- [ ] **T6.8 `saveDbSafely`** (G12) in `services/db.js`, for GradeRules and RuleDetailPage.
  - Check: checklist J4, J6, K9, K11.
- [ ] **T6.9 ⚠ `hooks/useDb.js`** (G1).
  - `live: true` for the 7 listeners, `live: false` for the 4 non-listeners.
  - Check: V-tests, V-same, checklist C, E4, F3, G2–G9.
- [ ] **T6.10 ⚠ Subject Detail grade logic → `lib/`.**
  - The celebration decision (`lib/celebration.js`: previous/next reached → message or null) and the gauge clamp.
  - Add unit tests. The SubjectDetail tests stay unchanged.
- [ ] **T6.11 ⚠ Auth helpers → `features/auth/lib/accounts.js`.**
  - Move: `validateAuthFields`, `getPasswordError`, `registerAccount`, `authenticateAccount`, the password requirements.
  - `LoginRegister` uses `ACTIVE_USER_KEY` (G10b).
  - Add unit tests for every message in checklist A3–A13.
  - Check: V-same, checklist A.
- [ ] **T6.12 ⚠ B9 fix (approved, AGENTS §3).**
  - Change: "Try draft scores" writes `targetGradeSandbox.terms[term].draftScores[taskId]` (via `services/records.js`) and never touches `studentReportedScore`. No migration.
  - Tests: update the B9 sandbox test **in the same commit**, and say so in the commit message.
  - **How drafts behave (D5, approved):**
    - Drafts feed the sandbox only: the result card, the sandbox gauges and the plan chart. A pure helper builds the record the sandbox calculates with (`withDraftScores(record, term)` in `lib/sandbox.js`, with unit tests). Subject Detail, Current Term Records and the official grade never see drafts.
    - A draft box first shows the task's real self-reported score. Typing stores a draft for that task. A cleared box stores `""`, which counts as "no score" in the sandbox.
  - Also update `docs/BEHAVIOUR_CHECKLIST.md` I9.
  - The SPEC §4 note is updated afterwards through the SPEC protocol (owner).
- [ ] **T6.13 Named exports: `lib/`, `services/`, `hooks/`** (check what is still default).
- [ ] **T6.14 Named exports: `components/` and `components/layout/`.**
- [ ] **T6.15 Named exports: `features/*`.**
- [ ] **T6.16 Named exports: `pages/*` and `app/`.**
  - `main.jsx` and `App.jsx` imports follow.
  - Each of T6.13–T6.16 is checked with V-same and V-tests.

### Phase 7 — Components and UI (V-visual and the listed V-check items; delete each screen's CSS when it is converted)

- [ ] **T7.0a ⚠ Apply the merged token values.**
  - Change the renamed tokens to their §4.1 values (the AA fixes and merges).
  - Replace hard-coded hex values that equal a merged value with the token, in all CSS files.
  - Check: V-visual on all 56 shots. Expected differences: slightly darker muted and error text, unified blues and greys.
- [ ] **T7.0b Shared app components.**
  - Create `PageShell` (G2), `BackLink` (G13) and `BrandMark` (G14, pixel-identical).
  - Add shadcn `button`, `card`, `separator`, `badge`.
  - Use them in no page yet except one proof page, StudentDashboard, which gets PageShell.
  - Check: V-visual.
- [ ] **T7.0c General Sans Semibold and Bold (D3).**
  - Add the font files to `src/assets/` from the official source, after a licence check. Add their `@font-face` rules in `src/index.css`.
  - Check: V-visual. Expected: 600/700 body text drawn with real bold glyphs instead of synthesized ones.
- **Sidebar group (R5; shadcn `Sidebar`, §3.2, D7).** The appearance stays the same. The behaviour changes only as listed in §3.2 (S1–S5) and approved by the owner.
  - [ ] **T7.S0 ⚠ Add the shadcn `sidebar` component and adapt it.**
    - Add it, and review the generated file.
    - Control `SidebarProvider` from `useSidebarState` (key `compugrade-sidebar-minimized`, no cookie; S1).
    - Set `--sidebar-width` / `--sidebar-width-icon` to the current 310px / 76px as tokens.
    - Map the sidebar colours to the `sidebar` tokens (yellow).
    - Check: V-tests. The component isn't used yet.
  - [ ] **T7.S1 ⚠ Phone switch and tablet default (includes T8.0, S3/S4).**
    - Move `PHONE_MAX_WIDTH` to 767 and `TABLET_MAX_WIDTH` to 1023, matching `useIsMobile`.
    - Update checklist B3 and `scripts/screenshots.mjs` (`SIDEBAR_MINIMIZED[1024] = "0"`).
    - Check: V-visual at 768 and 1024.
  - [ ] **T7.S2 ⚠ Rebuild `Sidebar.jsx` on `Sidebar`.**
    - Brand header with `BrandMark`; nav with `SidebarMenu`/`SidebarMenuButton` (`tooltip` gives the minimised labels); My Subjects with the count `Badge` and `SidebarMenuSub` list; footer with Settings, Help and the coral Logout.
    - The Header's ☰ becomes `SidebarTrigger` behaviour (the phone `Sheet`).
    - Move the sidebar rules out of `index.css` into utilities.
    - Check: V-visual (the sidebar must look the same at 375, 768, 1024, 1440), and checklist B1–B6, B10.
  - [ ] **T7.S3 Minimised subject pop-out → `Popover` (S5).** Check: B6.
  - [ ] **T7.S4 Remove-subject alert → `AlertDialog`.** Check: F1–F4.
  - [ ] **T7.S5 Help popup → `Dialog`.**
    - Remove its inline styles and the 2 `rgba()` values.
    - Check: B7.
  - [ ] **T7.S6 Sandbox picker entry.**
    - The Target Grade Sandbox menu item opens `SandboxSubjectPicker`.
    - Check: B8, B9.
  - **Afterwards:** `SPEC.md` F13 (sidebar thresholds and the keyboard shortcut) needs an owner-approved SPEC update.
- [ ] **T7.H Header and footer.**
  - `Avatar`, `Button size="icon"` for the bell and chevron (still no action, B13), tokens.
  - Delete `Header.css` and `PageFooter.css`.
  - Check: B11, B12.
- **Login (`pages/auth/LoginRegister.jsx`)**
  - [ ] **T7.L1** Log In / Create Account → `Tabs`. Role choice → `RadioGroup`. Check: A7, A10, A11.
  - [ ] **T7.L2** Fields → `Field` / `Input` / `InputGroup` (eye toggle) / `FieldError`. Messages → `Alert`. Submit → `Button`. Check: A1–A13, A18.
  - [ ] **T7.L3a** Hero and academic preview → utilities and tokens (`display` role, D2). Logo and name untouched. Delete `LoginRegister.css`.
- **Dashboard**
  - [ ] **T7.D1** Page shell, overview header, semester badge (`Badge`). Check: C1.
  - [ ] **T7.D2 ⚠ AllSubjectsHistory.**
    - Change: term `ToggleGroup`, chips `Toggle`, `ChartContainer`, the shared `HistoryChartFrame` (G21), and "Show as a table" → `Collapsible` + `Table`.
    - Recharts guard: add `chart` with `--dry-run`. If it would change the Recharts version, keep 3.10.1 (it satisfies the component) and don't accept the downgrade.
    - Check: C2–C5.
  - [ ] **T7.D3** Recent Updates → `Card` + `Item`. Delete `StudentDashboard.css`. Check: C10.
- **Subjects**
  - [ ] **T7.E1 EnrolledSubjectsTable.**
    - `Card`, `Table` (cards below `md`), filter `ToggleGroup` (G17), search `Input`, status `Badge`, `Empty`.
    - Delete its CSS.
    - Check: C6–C9, D1.
  - [ ] **T7.E2 AddSubjectForm.**
    - `Field`, `Input`, `NativeSelect`, `Button`, `Alert`.
    - Delete its CSS.
    - Check: E1–E7.
  - [ ] **T7.E3 SubjectMenu page.**
    - Semester `NativeSelect` (disabled options kept), page shell.
    - Delete `SubjectMenu.css`.
    - Check: D1–D4.
- **Subject Detail**
  - [ ] **T7.G1** TermNavigation → `ToggleGroup`. Delete its CSS. Check: G2, I1.
  - [ ] **T7.G2 ⚠ Overview and gauges.**
    - Change: `GradeGauge` (G6) for both pages, the target `DraftInput` → `InputGroup`, the legend and card.
    - Remove Arial.
    - Check: G1, G3–G7, I1 gauges, and the SubjectDetail and sandbox tests (gauge labels).
  - [ ] **T7.G3 ⚠ Celebration → `Dialog`.**
    - Keep confetti (tokens), audio, the 6-second close and the backdrop close.
    - Check: G8–G10; SubjectDetail tests.
  - [ ] **T7.G4 ⚠ CurrentTermRecords.**
    - Change: `Card`, `Badge` tags, `DraftInput` on `Input`, the add-task form (`Field`, `NativeSelect`, `Input`, `Button`), and the breakdown → `Collapsible`.
    - Remove Arial. Delete `CurrentTermRecords.css`.
    - Check: H1–H11; CurrentTermRecords tests.
  - [ ] **T7.G5 SubjectGradeHistory + HistoryChart.**
    - Change: `ChartContainer`, the frame, legend `Badge`s, `Collapsible` table, toggles.
    - Delete `HistoryChart.css` (the dashboard was converted in T7.D2).
    - Delete `SubjectDetail.css`.
    - Check: G12.
- **Sandbox**
  - [ ] **T7.I1** Page header, `BackLink`, the result card (`Card`, tones from tokens), the target input. Check: I1–I5.
  - [ ] **T7.I2 ⚠** Criteria table (`Table`, stacked rows) and the draft-score inputs (`Input`). Check: I6–I12; sandbox tests.
  - [ ] **T7.I3** "How this is calculated" → `Collapsible`. SandboxSubjectPicker → `Dialog` + `Item` + `Badge`. Delete `TargetGradeSandbox.css` and `SandboxSubjectPicker.css`. Check: B8, B9, I13, I14.
- **Grade Rules**
  - [ ] **T7.J1 GradeRules page.**
    - Change: search `Input`, thumbnail `ToggleGroup`, `RuleCard` (`Card`, `Badge`, `Button`), RuleBar, RulePieChart and RuleHierarchyTable (`Table`), `RuleLegend` (G16), `Empty`.
    - Delete `GradeRules.css` and `RuleVisuals.css`.
    - Check: J1–J4, J8.
  - [ ] **T7.J2** DeleteRuleDialog → `Dialog` + `NativeSelect`. Check: J5–J7.
- **Rule editor**
  - [ ] **T7.K1** Details form: `Field`, `Input`, `Checkbox`s in `FieldSet`, school chips (`Badge` + `Button`). Check: K13, K14.
  - [ ] **T7.K2 ⚠ PillEditor / PillLevel.**
    - Buttons → `Button size="icon"`, the % box → `Input`, the handles stay custom (`@utility`).
    - `window.confirm("Delete … and all of its subcriteria?")` → `AlertDialog`, same wording (D4, approved).
    - Delete `PillEditor.css`.
    - Check: K3–K8.
  - [ ] **T7.K3** View switch `ToggleGroup`, the impact `Dialog`, the status line, the action buttons. Delete `RuleDetailPage.css`. Check: K1, K2, K9–K12, K15.
- **Settings (R5: a shell task plus one per section)**
  - [ ] **T7.L0 Settings shell.**
    - Change: section nav → `Tabs`, its back link → `BackLink`, `BrandMark`, the "Workspace Student" box, the status message.
    - Move the unscoped reduced-motion rule from `GlobalSettings.css` to `index.css` **unchanged** (B19: same reach, now explicit).
    - Check: L1.
  - [ ] **T7.L1s Profile section** → `features/settings/components/ProfileSection.jsx`, `Card`, `Item`. Check: L2.
  - [ ] **T7.L2s Account section** → `AccountSection.jsx`: `Field`, `Input`, file `Input`, `Avatar`, `Button`. Check: L3, L4.
  - [ ] **T7.L3 ⚠ Security section** → `SecuritySection.jsx`.
    - Change: the password flow (`Field`, `InputGroup` with the Show/Hide text), the verification code `Input`, 2FA, sessions (`Item`), `AlertDialog`s, the help `Dialog` + `Tabs` (G17).
    - B2 and B5 behaviour is kept.
    - Check: L5–L10.
  - [ ] **T7.L4s Notifications section** → `NotificationsSection.jsx`. `ToggleSetting` → `Switch`; toggles still not saved (B3). Check: L11.
  - [ ] **T7.L5s Account Actions section** → `AccountActionsSection.jsx`, `Button`s (still no action, B1/B3). Delete `GlobalSettings.css`, `SettingRow.jsx` and `ToggleSetting.jsx` if they are now unused. Check: L12.
- [ ] **T7.P ⚠ Turn on Tailwind preflight.**
  - Import the full `tailwindcss`. Remove the now-duplicate parts of the old reset and the scoped `[data-slot]` reset.
  - Check: V-visual against the baseline at all widths, plus the full checklist.
- [ ] **T7.Z Final Phase 7 sweep.**
  - Delete `components/Dialog.jsx` and `Dialog.css`, the remaining file-local tokens, and the translucent-white tokens.
  - Confirm `src/index.css` is the only `.css` file outside the tooling folders.
  - Confirm grep finds no `#hex`, `rgb(` or arbitrary `[...]` values in `src/**/*.jsx`.

### Phase 8 — Responsive (V-visual at 375, 768, 1024, 1440, plus the Phase 2 measurement: overflow, text below 14px, targets below 44px)

- **T8.0 Sidebar thresholds: moved into T7.S1** (no separate task), so the shadcn `Sidebar`'s 768px phone switch and the app's thresholds change together. After it, the sidebar starts **expanded** at 1024.
- [ ] **T8.1** Global: header, sidebar and footer targets.
- [ ] **T8.2** Login.
- [ ] **T8.3** Dashboard.
- [ ] **T8.4** My Subjects.
- [ ] **T8.5** Subject Detail (including the gauge overlap).
- [ ] **T8.6** Sandbox (including the table below `lg`).
- [ ] **T8.7** Grade Rules.
- [ ] **T8.8** Rule editor.
- [ ] **T8.9** Settings.

Each of T8.1–T8.9 follows §5 for its screen. Check: no horizontal page scroll; no text below 14px except captions; no target below 44px at 375 and 768.

### Phase 9 — Clean-up and verification (as in the workflow)

- [ ] **T9.1 Remove unused files, exports, CSS and dependencies.**
  - Also remove the stale comments that cite documents not in the repo (AUDIT §11).
  - Remove the unused `@types/react` and `@types/react-dom` dev dependencies (D6, approved).
- [ ] **T9.2** Lint, format check, build, all tests.
- [ ] **T9.3** Walk `docs/BEHAVIOUR_CHECKLIST.md` in full.
- [ ] **T9.4** `npm run screenshots -- docs/after`.
- [ ] **T9.5** Check `AGENTS.md` §5–7 and list the remaining violations.
- [ ] **T9.6** Check every `[BUILT]` feature in `SPEC.md`.
- [ ] **T9.7** Update `AGENTS.md` §4 and write `docs/REFACTOR_REPORT.md`, including the branding notes (AUDIT §9).

---

## 7. Plan review

**Files named in the tasks.** Every path in §1.1 and §6 was listed with `git ls-files` at `6da752f`. The import graph was rebuilt to check which feature uses each file. Specific checks:
- `RuleDetail.jsx` exports `RuleDetailPage` (line 43).
- `CurrentTermRecord.jsx` exports `CurrentTermRecords`.
- `GlobalSettings.jsx` has five `render*Section` functions (lines 368–1335).
- The reduced-motion rule is at `GlobalSettings.css:2249`.
- The Arial declarations are at the lines given in §0.

**Behaviour, data, wording and branding.**
- **Behaviour or data changes (all approved):**
  - T6.12 (B9)
  - T7.S1 (thresholds)
  - the shadcn `Sidebar` group T7.S0–S2 (S1–S5 in §3.2, D7)
  - T7.K2 (`window.confirm` → `AlertDialog`, D4)
- **Appearance only (allowed):** T7.0a, T7.0c (fonts) and T7.P.
- **Wording:** unchanged everywhere. G19 deliberately keeps both password-toggle wordings.
- **Branding:** untouched. `BrandMark` is an identical extraction, and the favicon and title stay.

**Conflicts with `SPEC.md`.**
- **Deleting StudentSettingsPrototype and its CSS (D1)** conflicts with SPEC §6 (f). T5a.1 and T5a.3 are blocked until SPEC §6 (f) is updated through the protocol (proposal in the Gate 3 reply).
- **When they ship, these make `SPEC.md` out of date**, and each needs an owner-approved SPEC update at that point:
  - T6.12 → the B9 note in SPEC §4
  - T7.S1–S2 → F13 (sidebar thresholds and the keyboard shortcut)

**Size.** Settings, Sidebar, Subject Detail and Login are split into several tasks. The largest single tasks are T4.3 and T7.0a. Both are mechanical, and both are verified with V-same or V-visual.

**Risky tasks and how they are verified:**

| Task(s) | Area | Verification |
| --- | --- | --- |
| T4.3, T4.4 | App-wide CSS layering | V-same |
| T6.3, T6.7, T6.9, T6.10, T6.11 | Grade logic, stored data, auth | Unchanged tests, plus V-same, plus the listed checklist items; new unit tests first where the logic moves |
| T6.12 | B9 | The test change is declared in the commit |
| T7.0a, T7.P | App-wide appearance | V-visual over all 56 shots |
| T7.S0–S2 | shadcn `Sidebar`, thresholds | V-visual (the sidebar must look the same), checklist B1–B10 and F |
| T7.D2, T7.G2–G4, T7.I2, T7.K2, T7.L3 | Interactive screens | V-visual, the component tests, and the checklist |

**Audit items not addressed, and why:**

| Item | Why it is not addressed |
| --- | --- |
| B1–B8, B10–B17 | Bugs kept by owner decision. Each one's behaviour is preserved |
| B19 | The reduced-motion rule is kept, just made explicit (T7.L0). The duplicated `.sandbox-error` disappears when both CSS files go |
| B20 | `npm audit` advisories in the ESLint chain. Fixing them means downgrading ESLint, which needs the owner |
| The 800 kB bundle warning | Code splitting (`React.lazy`) would change loading behaviour (suspense fallbacks). Out of scope unless the owner adds it |
| Branding notes (AUDIT §9) | Handed to the branding branch in T9.7 |
| Input-border contrast (WCAG 1.4.11, 3:1 for control outlines) | Not required by `AGENTS.md`, which asks for text contrast. Noted only |

---

## 8. Gate 3 decisions

The owner answered on 2026-11-11:

| # | Decision | Where it is applied |
| --- | --- | --- |
| D1 | The settings prototype and its `.student-switcher*` / `.student-role-*` CSS are dead code and are **deleted** | T5a.1, T5a.3. Blocked until `SPEC.md` §6 (f) is updated through the protocol |
| D2 | Add the `display` and `card-title` type roles | §4.2, `AGENTS.md` §7 |
| D3 | Add the missing General Sans weights. Use only Khand and General Sans, from `src/assets/` | §4.2, T4.4, T7.0c, `AGENTS.md` §7 |
| D4 | `window.confirm` → `AlertDialog` | T7.K2 |
| D5 | Drafts feed the sandbox only, and the box starts from the real self-reported score | T6.12 |
| D6 | Remove `@types/react*` | T9.1 |
| D7 | Use the shadcn `Sidebar`, keeping the current look; its new behaviour is worked on during the clean-up | §3.2, T7.S0–S6 |

**Still open:**
- **S1–S5 in §3.2:** the concrete sidebar behaviour; needs owner confirmation.
- **D8:** the token values in §4.
- **The owner's homepage idea** (an interactive grade-calculator hero, switching to a grade inputter for professors): a new feature, so it goes to the `SPEC.md` Backlog through the protocol, not into this job.

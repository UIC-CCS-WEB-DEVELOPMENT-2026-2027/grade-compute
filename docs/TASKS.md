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
   - `SPEC.md` §6 (f) was updated through the SPEC protocol (commit `ca4b747`), so the deletions can go ahead.

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
- `src/pages/StudentSettingsPrototype.jsx` (D1)
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

**Generated components follow the token rules (owner decision, Gate 4).** When a component is added to `src/components/ui/`:
- Replace its one-off values (`text-[0.8rem]`, `rounded-[min(...)]`, `hover:bg-[color-mix(...)]`, …) with tokens and the Tailwind scale.
- Set control heights to the §4.3 sizes (`h-control`, `h-control-sm`, `h-control-lg`; 44px touch sizes in Phase 8).
- Map icon sizes to the scale.

Only the variant strings change; the component's structure and API stay as generated. The edit goes in the same commit that adds the component.

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

| Item | Today | shadcn `Sidebar` | Handling (all confirmed by the owner, Gate 3) |
| --- | --- | --- | --- |
| S1 Remembered state | `localStorage` `compugrade-sidebar-minimized` (`"1"`/`"0"`) | Writes a `sidebar_state` cookie | Control the provider (`open` / `onOpenChange`) from `useSidebarState`. Keep the existing key and drop the cookie, so no new stored data |
| S2 Keyboard shortcut | None | Ctrl/⌘+B toggles the sidebar | Keep it as new behaviour. It writes the same `compugrade-sidebar-minimized` key (S1) |
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
| **Settings** | Uses the shared page shell from T7.L0, so the same layout rules as the other pages apply. Section tabs, toggles, buttons and inputs to 44px. The section tabs wrap or scroll below `md` |

---

## 6. Task list

Each task gives the files, the change and the acceptance check. ⚠ marks the risky ones.

### Phase 4 — Foundations (no screen changes)

- [x] **T4.1 Move the global stylesheet.**
  - Files: `src/assets/index.css` → `src/index.css`; `src/main.jsx` (import); font `url()` paths inside the file.
  - Change: move only.
  - Check: V-same.
- [x] **T4.2 `@/` import alias.**
  - Files: `vite.config.js` (`resolve.alias`), a new `jsconfig.json` (`paths`).
  - Change: no import is changed yet. Vitest picks up the alias from `vite.config.js`.
  - Check: V-same, and a one-off import through `@/` builds.
- [x] **T4.3 ⚠ Tailwind v4 without preflight, plus token rename.** (One task, per R3.)
  - **As done** (differs from the plan below in four places; all checked with V-same):
    1. **Only the reset is layered.** `*`, `body`, `html`/`#root`, font inherit, `img`, `h1–h6` went into `@layer base`.
       - The `button`, `input` and `select` element rules (and their `:hover`/`:focus`) stay unlayered and are scoped with `:where(:not([data-slot]))`, which adds no specificity. The same goes for the 2 bare `select` rules in `GlobalSettings.css`, which loads on every page.
       - Reason: layering those rules would let the app's class rules beat them on hover and focus, which screenshots can't catch. The scoping keeps them off shadcn components.
       - **Superseded at Gate 4.** The owner accepted hover and focus changes so the whole codebase uses Tailwind's layer system. The `button`, `input` and `select` rules (in `index.css`), and the page-wide element rules in `GlobalSettings.css` (`*`, `html`/`body`/`#root`, font inherit, `img`, the bare `select` parts), are now in `@layer base`, still scoped with `:where(:not([data-slot]))`. V-same was still 0 of 56; only hover and focus can differ, where an element's own class sets `opacity` or `border-color`.
    2. **Criteria tokens keep their names.** `--color-criteria-N` and `-on` went into `@theme static`, because `rules.js` builds those names at runtime and the tests assert them.
    3. **Shadow colours renamed.** `--shadow-card`, `-hover`, `-hover-strong`, `-dialog` and `-card-dark` hold colours, not shadows; they became `--elevation-*` to free Tailwind's `--shadow-*` namespace for T4.5. `GlobalSettings.css`'s page-wide aliases (`--card`, `--muted`, `--primary`, …) became `--settings-*`, because they collided with the new names.
    4. **Scanning limited to `src/`.** Tailwind scans `src/` only (`source(none)` plus `@source "./"`). It no longer scans the tooling folders, `docs/` or the Markdown files, which held example class names.
  - Tokens without a final §4.1 home yet keep transitional names without the `--color-` prefix (for example `--surface-soft`, `--subtle-foreground`, `--dark-*`). T5a.4 and T7.0a merge or remove them.
  - Re-check that `@tailwindcss/vite` supports Vite 8; stop if it doesn't.
  - Install `tailwindcss` and `@tailwindcss/vite` and register the plugin.
  - At the top of `src/index.css`: `@layer theme, base, components, utilities;` then import `tailwindcss/theme.css` and `tailwindcss/utilities.css` only (no preflight).
  - Move the existing reset and element rules (`*`, `body`, `button`, `input`, `h1–h4`, `img`, …) into `@layer base`, so utilities can win over them later.
  - Rename every `--color-*` token to the §4.1 names **at today's values**, across all CSS and JSX. `@theme inline` maps them for Tailwind.
  - Check: V-same, plus a grep showing no `--color-` left outside `@theme`.
- [x] **T4.4 ⚠ Initialise shadcn.**
  - **As done** (differs from the plan below in four places; checked with V-same):
    1. **Set up by hand.** `shadcn init` only recognises a plain `@import "tailwindcss"`, which would bring in preflight, so it stopped without changing anything. `components.json` was written to the official schema: style `base-nova` (Base UI), `tsx: false`, `rsc: false`, CSS `src/index.css`, the planned aliases, icons `lucide`. `npx shadcn@latest info` reads it as base `base`, JavaScript.
    2. **The packages `init` adds were installed:**
       - dependencies: `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`
       - dev dependencies: `shadcn`, `tw-animate-css`
    3. **`init`'s CSS, minus the global rule.** The `tw-animate-css` and `shadcn/tailwind.css` imports were added to `src/index.css`. Its global `*` border/outline base rule was replaced by a preflight subset scoped to `[data-slot]`, until T7.P.
    4. **No `src/lib/utils.js`.** Current shadcn components import `cn` from the official `cn` package.
  - **Proof:** `npx shadcn@latest add button` worked with this setup, and a throwaway test rendered the Button (Base UI, `data-slot="button"`, variant classes). Both were removed again; T7.0b adds Button for real.
  - **`npm audit`:** 9 advisories, up from 4. The 5 new ones come from the dev-only `shadcn` CLI package (`deepmerge`, `ts-morph` → `minimatch`) and are not shipped.
  - **Fonts:** untouched. No font was added; the preset's default (Geist) is not used.
  - `npx shadcn@latest init` with base **Base UI**, `tsx: false`, CSS `src/index.css`, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. Use `--dry-run`/`--diff` first and merge by hand.
  - Keep the tokens from T4.3.
  - Remove or postpone anything init adds that changes the screen (its base-layer `body`/`*` rules) until T7.P.
  - Keep the fonts: if init or a preset adds a font (for example Geist) or font variables, remove them. `--font-heading` stays Khand and `--font-sans` maps to General Sans (`AGENTS.md` §7).
  - Add a scoped border reset for shadcn components while preflight is off: `[data-slot], [data-slot] *` get `border: 0 solid`.
  - Creates `components.json` and `src/lib/utils.js` (`cn`). Installs the packages the CLI adds (approved).
  - Check: V-same, plus a scratch render of `Button` in a test (not committed in a page).
- [x] **T4.5 Add the new design tokens.**
  - **As done:**
    - **Colours:** the new tokens are in `:root`, with an `@theme inline` map for every semantic colour.
    - **Radius:** `--radius: 0.5rem` and its sm–3xl scale.
    - **`@theme` values:** `shadow-card`, `shadow-hover`, `shadow-dialog`, the fonts, and the control sizes (`h-control`, `-sm`, `-lg`, `-touch`).
    - **Type roles:** the seven roles are `@utility type-*` classes (`type-display`, `type-page-title`, `type-section-title`, `type-card-title`, `type-body`, `type-small`, `type-caption`), each with its phone size and `md` size.
    - **Sidebar:** the width tokens are in; its colour tokens come with the `sidebar` component in T7.S0.
    - **Proof:** a throwaway file showed the expected CSS for each kind of class.
  - File: `src/index.css`.
  - Add the §4 tokens that don't exist yet (`highlight-text`, `self-reported-foreground`, `overlay`, the type roles from D2, spacing and component sizes, radius, shadows, `--sidebar-width*`), with `@theme inline` names.
  - Nothing uses them yet.
  - Check: V-same.

### Phase 5a — Remove dead code (V-same for every task)

- [x] **T5a.1 Unused files.**
  - Delete: `src/components/SelectSetting.jsx`, `src/components/shared/RuleCompare.jsx` (0 bytes), `src/components/ToggleSettings` (0 bytes), and `src/pages/StudentSettingsPrototype.jsx` (D1).
  - Check: V-same, and nothing imports the deleted files.
- [x] **T5a.2 Unused assets.**
  - Delete: `src/assets/bell-icon.png`, `user-profile.png`, `visibility-eye.svg`; `public/grade-rules-mark.svg`, `public/icons.svg`.
  - Keep `public/favicon.svg` (branding).
  - Check: V-same, and grep finds no reference to them.
- [x] **T5a.3 Dead global CSS classes.**
  - Remove: `.student-switcher*`, `.student-role-*` (D1), `.dashboard-view-*`, `.text-official`, `.input-self-reported`, `.banner-pending`, `.container`, `.flex-row`, `.flex-col`, `.align-center`, `.justify-between`, `.btn-accent`.
  - Check: V-same, plus a grep of JSX for each class name.
- [x] **T5a.4 Unreachable dark theme.**
  - Remove all `.global-settings.dark` rules (`GlobalSettings.css`), the `--*-dark` tokens (`index.css`), and any token used only by them.
  - Check: V-same.
- [x] **T5a.5 `showLogin`.**
  - Remove the never-true state and its branch in `App.jsx`.
  - Keep the commented professor/admin imports and routes exactly as they are (R14).
  - Check: V-same; checklist A1, A14, A16.
- [x] **T5a.6 Unused exports and props.**
  - Remove: `resetDatabase` (`db.js`); `getLocalLoginSessions`, `authenticateLocalAccount` and the `defaultAccount` export (`localAccountStore.js`, if unused inside the file the export keyword only); Header's never-passed `user` prop; TermNavigation's never-used `action` prop.
  - Exports used by tests stay.
  - Check: V-same, V-tests.

### Phase 5 — Structure (moves and renames only; fix imports using `@/`; V-same and V-tests for every task)

- [x] **T5.1** `utils/` pure logic and tests → `lib/` (table §1.1).
- [x] **T5.2** `focusTask.js`, `cssColor.js` → `lib/dom/`.
- [x] **T5.3** Storage modules and tests → `services/`. `src/test/fixtures.js` imports `@/services/db.json`.
- [x] **T5.4** `App.jsx`, `main.jsx`, `RequireStudent.jsx` → `app/`. The `index.html` script path changes to `/src/app/main.jsx`; the title is untouched.
- [x] **T5.5** Sidebar, Header, PageFooter (+CSS) → `components/layout/`. `useSidebarState.js` → `hooks/`.
- [x] **T5.6** Rule editor and visuals → `features/grade-rules/components/`. `Dialog.jsx` (+CSS) and `DraftInput.jsx` → `components/`.
- [x] **T5.7** EnrolledSubjectsTable and AddSubjectForm (+CSS) → `features/subjects/components/`.
- [x] **T5.8** `CurrentTermRecord.*` → `features/term-records/components/CurrentTermRecords.*`. TermNavigation (+CSS) → the same folder.
- [x] **T5.9** TargetGradeSandbox (+CSS, test) and SandboxSubjectPicker (+CSS) → `features/sandbox/components/`.
- [x] **T5.10** History components (+CSS) → `features/history/components/`. `usePointHover.js` → `features/history/hooks/`.
- [x] **T5.11** SettingRow and ToggleSetting → `features/settings/components/`. GlobalSettings (+CSS) → `pages/settings/`.
- [x] **T5.12** `RuleDetail.jsx` → `RuleDetailPage.jsx` (+CSS). `congrats_voice .mp3` → `congrats-voice.mp3`. Then remove the empty `components/shared/`, `components/student/` and `utils/`.

### Phase 6 — Logic clean-up (V-tests and V-same for every task unless stated)

- [x] **T6.1 `lib/number.js`.**
  - `toNumber`, `clamp` (G10). Used by `grades.js`, `sandbox.js`, `history.js`, `rules.js`.
  - Add unit tests.
  - **As done:** RulePieChart's private `resolveColor` (also G10) now imports the one in `lib/dom/cssColor.js`. The two gave the same result for every input.
- [x] **T6.2 One term list.**
  - `lib/terms.js` exports `TERMS`, `TERM_KEYS`, `TERM_LABELS`.
  - Replace the copies in `grades.js`, `rules.js`, `history.js` and `TargetGradeSandbox.jsx`.
- [x] **T6.3 ⚠ `lib/targets.js`.**
  - Contents: `DEFAULT_TARGET`, `getTermTarget` (from history), `getSandboxTarget` (from sandbox), and `getSubjectDetailTarget`, which is **not range-checked** (keeps B11; the SubjectDetail tests cover it).
  - Replaces the 5 copies of `90` and the 3 lookups.
  - **As done:** the `getTermTarget` and `getSandboxTarget` tests moved unchanged to `lib/targets.test.js`, with new tests for `getSubjectDetailTarget` (including B11's unchecked values).
- [x] **T6.4 `lib/scores.js`.**
  - `validateScore` (G7), used by CurrentTermRecords and TargetGradeSandbox. Messages stay in the components.
  - Add unit tests. Component tests unchanged.
- [x] **T6.5 `lib/format.js` `formatGrade`** (G4).
  - Replace the 5 identical copies. The 1-decimal and "Expected" variants are built on it with the same output.
  - Add unit tests.
- [x] **T6.6 Initials (G5).**
  - Add tests comparing the three versions. Merge only if they match; otherwise document why they stay separate.
  - **As done:** the Settings and Subject Detail versions were identical and are now one function, `getSpaceSplitInitials`. Header's version differs on extra spaces (`"Ana  Cruz"` → `"AC"` vs `"A"`), so it stays a separate function, `getInitials`. Both are in `lib/format.js`, with a comment and tests showing where they differ. They agree on every name in the seed data.
- [x] **T6.7 ⚠ `services/records.js` `updateStudentRecord`** (G11).
  - Used by SubjectDetail, CurrentTermRecords, TargetGradeSandbox and Sidebar's remove-subject code.
  - Check: V-tests, V-same, checklist F3, G4, H3, H8, I6–I9.
  - **As done:**
    - Sidebar's remove-subject code is not converted. It deletes the record, drops the class once it is empty, and cleans up subjects and requests. That is a removal, not an update of one record (AGENTS §6: don't merge things that only look alike).
    - The React Compiler lint started reporting `Date.now()` in CurrentTermRecords' add-task submit handler as "called during render". It is a false positive, so it is disabled on that line with a comment.
    - The checklist items passed in a real browser, and the saved data after each flow was byte-identical to before the change.
- [x] **T6.8 `saveDbSafely`** (G12) in `services/db.js`, for GradeRules and RuleDetailPage.
  - Check: checklist J4, J6, K9, K11.
- [x] **T6.9 ⚠ `hooks/useDb.js`** (G1).
  - `live: true` for the 7 listeners, `live: false` for the 4 non-listeners.
  - Check: V-tests, V-same, checklist C, E4, F3, G2–G9.
  - **As done:**
    - Header is not converted. It doesn't keep the database in state; it calls `getDb()` on every render. `useDb({ live: false })` would read only once and could show stale data, so the other three non-listeners use `live: false` and Header stays as it is.
    - In a real browser, the saved data and the visible page text after each checklist step were byte-identical to before.
- [x] **T6.10 ⚠ Subject Detail grade logic → `lib/`.**
  - The celebration decision (`lib/celebration.js`: previous/next reached → message or null) and the gauge clamp.
  - Add unit tests. The SubjectDetail tests stay unchanged.
  - **As done:** the gauge clamp is `getGaugeProgress` in `lib/format.js`. The sandbox `Gauge` had the same line and uses it too. Checked G8 and G9 in a browser, with identical results.
- [x] **T6.11 ⚠ Auth helpers → `features/auth/lib/accounts.js`.**
  - Move: `validateAuthFields`, `getPasswordError`, `registerAccount`, `authenticateAccount`, the password requirements.
  - `LoginRegister` uses `ACTIVE_USER_KEY` (G10b).
  - Add unit tests for every message in checklist A3–A13.
  - Check: V-same, checklist A.
  - **As done:** the password requirements are exported as `PASSWORD_REQUIREMENTS` (UPPER_SNAKE_CASE constant, AGENTS §6). Checklist A1–A18 passed in a browser, with identical page text, session and saved users before and after.
- [x] **T6.12 ⚠ B9 fix (approved, AGENTS §3).**
  - Change: "Try draft scores" writes `targetGradeSandbox.terms[term].draftScores[taskId]` (via `services/records.js`) and never touches `studentReportedScore`. No migration.
  - Tests: update the B9 sandbox test **in the same commit**, and say so in the commit message.
  - **How drafts behave (D5, approved):**
    - Drafts feed the sandbox only: the result card, the sandbox gauges and the plan chart. A pure helper builds the record the sandbox calculates with (`withDraftScores(record, term)` in `lib/sandbox.js`, with unit tests). Subject Detail, Current Term Records and the official grade never see drafts.
    - A draft box first shows the task's real self-reported score. Typing stores a draft for that task. A cleared box stores `""`, which counts as "no score" in the sandbox.
  - Also update `docs/BEHAVIOUR_CHECKLIST.md` I9.
  - The SPEC §4 note is updated afterwards through the SPEC protocol (owner).
  - **As done:**
    - Drafts are written by `setDraftScore` in `lib/sandbox.js`, through `services/records.js`. `setDraftScore` touches only `draftScores`; `updateSandboxSettings` would also add an empty `criteria`.
    - The official gauge and the target read the real record. The result card, the expected gauge and the chart read `withDraftScores`.
    - A draft has no score time. Owner decision (2026-11-11, option B): the sandbox chart draws draft-scored tasks after all real scores, in rule order, close to the old B9 look where a draft was stamped "now" and drawn last. `withDraftScores` marks them `isDraftScore` (never saved), and `getScoredTasks` sorts them last. Done in a follow-up commit during Phase 7.
    - Checked in a browser: I9 as updated, and the other sandbox and records flows unchanged.
- [x] **T6.13 Named exports: `lib/`, `services/`, `hooks/`** (check what is still default).
- [x] **T6.14 Named exports: `components/` and `components/layout/`.**
- [x] **T6.15 Named exports: `features/*`.**
- [x] **T6.16 Named exports: `pages/*` and `app/`.**
  - `main.jsx` and `App.jsx` imports follow.
  - Each of T6.13–T6.16 is checked with V-same and V-tests.

### Phase 7 — Components and UI (V-visual and the listed V-check items; delete each screen's CSS when it is converted)

- [x] **T7.0a ⚠ Apply the merged token values.**
  - Change the renamed tokens to their §4.1 values (the AA fixes and merges).
  - Replace hard-coded hex values that equal a merged value with the token, in all CSS files.
  - Check: V-visual on all 56 shots. Expected differences: slightly darker muted and error text, unified blues and greys.
- [x] **T7.0b Shared app components.**
  - Create `PageShell` (G2), `BackLink` (G13) and `BrandMark` (G14, pixel-identical).
  - Add shadcn `button`, `card`, `separator`, `badge`.
  - Use them in no page yet except one proof page, StudentDashboard, which gets PageShell.
  - Check: V-visual.
- [x] **T7.0c General Sans Semibold and Bold (D3).**
  - Add the font files to `src/assets/` from the official source, after a licence check. Add their `@font-face` rules in `src/index.css`.
  - Check: V-visual. Expected: 600/700 body text drawn with real bold glyphs instead of synthesized ones.
- **Sidebar group (R5; shadcn `Sidebar`, §3.2, D7).** The appearance stays the same. The behaviour changes only as listed in §3.2 (S1–S5) and approved by the owner.
  - [x] **T7.S0 ⚠ Add the shadcn `sidebar` component and adapt it.**
    - Add it, and review the generated file.
    - Control `SidebarProvider` from `useSidebarState` (key `compugrade-sidebar-minimized`, no cookie; S1).
    - Set `--sidebar-width` / `--sidebar-width-icon` to the current 310px / 76px as tokens.
    - Map the sidebar colours to the `sidebar` tokens (yellow).
    - Check: V-tests. The component isn't used yet.
  - [x] **T7.S1 ⚠ Phone switch and tablet default (includes T8.0, S3/S4).**
    - Move `PHONE_MAX_WIDTH` to 767 and `TABLET_MAX_WIDTH` to 1023, matching `useIsMobile`.
    - Update checklist B3 and `scripts/screenshots.mjs` (`SIDEBAR_MINIMIZED[1024] = "0"`).
    - Check: V-visual at 768 and 1024.
  - [x] **T7.S2 ⚠ Rebuild `Sidebar.jsx` on `Sidebar`.**
    - Brand header with `BrandMark`; nav with `SidebarMenu`/`SidebarMenuButton` (`tooltip` gives the minimised labels); My Subjects with the count `Badge` and `SidebarMenuSub` list; footer with Settings, Help and the coral Logout.
    - The Header's ☰ becomes `SidebarTrigger` behaviour (the phone `Sheet`).
    - Move the sidebar rules out of `index.css` into utilities.
    - Check: V-visual (the sidebar must look the same at 375, 768, 1024, 1440), and checklist B1–B6, B10.
    - **As done:**
      - `AppSidebarProvider` (controlled from `useSidebarState`) wraps every signed-in page through `RequireStudent`. Its wrapper is `display: contents`. The scoped `[data-slot]` reset now leaves that wrapper out, since it surrounds whole pages. `useSidebarState` keeps only `minimized`; the phone menu state lives in the provider.
      - `src/lib/utils.js` exports a `cn` that knows the project's `control` sizes and `type-*` roles. Without it, overrides of those classes didn't win. Every component imports `cn` from `@/lib/utils`, and generated ones must be switched to it when they are added.
      - Look changes, by the standards: labels at 14px weight 600 (subject entries were 11px, so they now wrap); the count badge is the default `Badge` (primary; white on the old bright blue fails AA); Logout text uses `warning-foreground` (dark on coral, AA); spacing on the 4px scale.
      - The Help, remove-subject, pop-out and picker dialogs render outside the sidebar, because on phones the Sheet unmounts its content when it closes. Opening the sandbox picker now closes the phone menu first, like Help and Remove already did.
      - Settings' brand block keeps its old layout rule (moved into `GlobalSettings.css`) until T7.L0.
      - Checked in a browser: B1–B8 and B10, the phone menu (Escape, backdrop, focus back to ☰, picking a page closes it) and Ctrl/⌘+B (S2).
  - [x] **T7.S3 Minimised subject pop-out → `Popover` (S5).** Check: B6.
  - [x] **T7.S4 Remove-subject alert → `AlertDialog`.** Check: F1–F4.
  - [x] **T7.S5 Help popup → `Dialog`.**
    - Remove its inline styles and the 2 `rgba()` values.
    - Check: B7.
  - [x] **T7.S6 Sandbox picker entry.**
    - The Target Grade Sandbox menu item opens `SandboxSubjectPicker`.
    - Check: B8, B9.
  - **Afterwards:** `SPEC.md` F13 (sidebar thresholds and the keyboard shortcut) needs an owner-approved SPEC update.
- [x] **T7.H Header and footer.**
  - `Avatar`, `Button size="icon"` for the bell and chevron (still no action, B13), tokens.
  - Delete `Header.css` and `PageFooter.css`.
  - Check: B11, B12.
- **Login (`pages/auth/LoginRegister.jsx`)**
  - [x] **T7.L1** Log In / Create Account → `Tabs`. Role choice → `RadioGroup`. Check: A7, A10, A11.
  - [x] **T7.L2** Fields → `Field` / `Input` / `InputGroup` (eye toggle) / `FieldError`. Messages → `Alert`. Submit → `Button`. Check: A1–A13, A18.
  - [x] **T7.L3a** Hero and academic preview → utilities and tokens (`display` role, D2). Logo and name untouched. Delete `LoginRegister.css`.
    - **As done:**
      - The login brand (icon tile, name, dot) keeps its exact values in `.auth-brand-*` rules in `index.css`, like the sidebar brand.
      - The motion moved to tokens in `index.css` (`animate-auth-*`, `ease-auth`, and an `animate-delay-*` utility); reduced motion still fades instead of moving, and the bars still grow.
      - Hex colours became tokens: the "On Track" pill uses `success`, the bars use `self-reported`/`primary` shades, the shadows use the shadow tokens.
      - Breakpoints: 760/761 → `md`, 1200 → `xl`. The columns are 7/12 and 5/12 (were 57.29%). The page has a minimum height instead of a fixed one, so very short screens scroll; the old height-based squeezing (max-height 650/540) is gone (Phase 8 may revisit).
      - Text uses the roles: the hero heading `display`, the form heading `section-title`, the preview labels `caption`, the rest `small`.
- **Dashboard**
  - [x] **T7.D1** Page shell, overview header, semester badge (`Badge`). Check: C1.
  - [x] **T7.D2 ⚠ AllSubjectsHistory.**
    - Change: term `ToggleGroup`, chips `Toggle`, `ChartContainer`, the shared `HistoryChartFrame` (G21), and "Show as a table" → `Collapsible` + `Table`.
    - Recharts guard: add `chart` with `--dry-run`. If it would change the Recharts version, keep 3.10.1 (it satisfies the component) and don't accept the downgrade.
    - Check: C2–C5.
  - [x] **T7.D3** Recent Updates → `Card` + `Item`. Delete `StudentDashboard.css`. Check: C10.
- **Subjects**
  - [x] **T7.E1 EnrolledSubjectsTable.**
    - `Card`, `Table` (cards below `md`), filter `ToggleGroup` (G17), search `Input`, status `Badge`, `Empty`.
    - Delete its CSS.
    - Check: C6–C9, D1.
  - [x] **T7.E2 AddSubjectForm.**
    - `Field`, `Input`, `NativeSelect`, `Button`, `Alert`.
    - Delete its CSS.
    - Check: E1–E7.
  - [x] **T7.E3 SubjectMenu page.**
    - Semester `NativeSelect` (disabled options kept), page shell.
    - Delete `SubjectMenu.css`.
    - Check: D1–D4.
- **Subject Detail**
  - [x] **T7.G1** TermNavigation → `ToggleGroup`. Delete its CSS. Check: G2, I1.
  - [x] **T7.G2 ⚠ Overview and gauges.**
    - Change: `GradeGauge` (G6) for both pages, the target `DraftInput` → `InputGroup`, the legend and card.
    - Remove Arial.
    - Check: G1, G3–G7, I1 gauges, and the SubjectDetail and sandbox tests (gauge labels).
    - **As done:**
      1. `GradeGauge` takes `{ label, grade, target, tone, ariaLabelPrefix, ariaDecimals, focusable, details, className }`. There is no `role` prop: `focusable` decides where the label sits, as today. Subject Detail: the gauge is a tab stop carrying the label, ring hidden. Sandbox: the ring is `role="img"` carrying the label.
      2. `DraftInput` gained an `as` prop (default a plain `<input>`), so the target box renders `InputGroupInput`. CurrentTermRecords still gets the plain input until T7.G4.
      3. The expected gauge's number uses `highlight-text` (the ring stays yellow) for WCAG AA. The yellow number was 1.9:1.
      4. The four-part summary row starts at `xl`. Below it the gauges take a full row and the two notes sit side by side (one column on phones). Arial is gone from the page container, so Subject Detail and the sandbox page use General Sans.
  - [x] **T7.G3 ⚠ Celebration → `Dialog`.**
    - Keep confetti (tokens), audio, the 6-second close and the backdrop close.
    - Check: G8–G10; SubjectDetail tests.
  - [x] **T7.G4 ⚠ CurrentTermRecords.**
    - Change: `Card`, `Badge` tags, `DraftInput` on `Input`, the add-task form (`Field`, `NativeSelect`, `Input`, `Button`), and the breakdown → `Collapsible`.
    - Remove Arial. Delete `CurrentTermRecords.css`.
    - Check: H1–H11; CurrentTermRecords tests.
    - **As done:**
      1. The chart-click highlight keeps `lib/dom/focusTask.js` as it is (it adds the `is-highlighted` class). `index.css` gains a `task-highlighted` custom variant and an `animate-record-highlight` token for it.
      2. The per-criterion headings stay hidden (`display: none` before, `hidden` now), so the accessibility tree is unchanged.
      3. The test helper that found the add-task form by its old class now takes the only `form`.
      4. Rows stack below `sm` (before: below 380px), with 44px inputs and buttons below `md`.
  - [x] **T7.G5 SubjectGradeHistory + HistoryChart.**
    - Change: `ChartContainer`, the frame, legend `Badge`s, `Collapsible` table, toggles.
    - Delete `HistoryChart.css` (the dashboard was converted in T7.D2).
    - Delete `SubjectDetail.css`.
    - Check: G12.
    - **As done:**
      1. Deleting `SubjectDetail.css` took the layout of both pages that used it. Subject Detail and the sandbox page now use `PageShell`, so their background is the shared `muted` one. The sandbox page's heading, Back link and "unavailable" box rules moved to `TargetGradeSandbox.css` for T7.I1.
      2. `HistoryChart` is built on `HistoryChartFrame` (which gained a `marginTop` prop for the "Target reached" label). Its `height` prop became `heightClass`. `HistoryTooltip` uses utilities.
      3. The dashboard chart's dots lost an unused `history-dot-mark` class (it had no effect there).
- **Sandbox**
  - [x] **T7.I1** Page header, `BackLink`, the result card (`Card`, tones from tokens), the target input. Check: I1–I5.
    - **As done:**
      1. `BackLink` gained an optional `className`. The sandbox passes `max-md:h-control-touch`, so the Back link stays 44px on phones as before.
      2. The result card is a `Card` inside the same named `<section>` (the region and its live updates are unchanged). Its headline uses the `page-title` role (was 48–68px; `display` is for the login hero only). The label uses `caption`, without the old 85% opacity. Tones: `primary`, `success`, `muted`, and `warning-soft` with a `warning/35` border (was a one-off `rgba(216, 106, 93, 0.35)`). The divider lines are 20% white (were 22%).
      3. The target box follows Subject Detail: `Field` + `InputGroup` + `InputGroupInput`, with the `%` inside the box. Its save and validation logic is unchanged. The hint was 7px and is now the `small` role. The box uses `max-w-24`, because `Field` sets `*:w-full` on its children.
      4. "Sandbox unavailable" → `Empty` (centred), with the same heading, text and link. The link is a primary button.
      5. Checked I1–I5 in a browser. The four Subject Detail shots also differ, but only by 9–18 pixels of chart anti-aliasing.
  - [x] **T7.I2 ⚠** Criteria table (`Table`, stacked rows) and the draft-score inputs (`Input`). Check: I6–I12; sandbox tests.
    - **As done:**
      1. Steps 2 and 3 are `Card`s inside their same named `<section>`s, with the same gradient and shadow. Their headings use a private `SandboxStep` (the `card-title` role and a numbered dot). Steps 1 and the chart keep the old heading class until T7.I3.
      2. The criteria table still stacks by the sandbox's own width, not the window's: `@container` on the sandbox, with `@max-xl` (576px; was 560px). The column labels in stacked rows are spans hidden above that width, like EnrolledSubjectsTable, instead of CSS `content`. The table sets `border-collapse`, because preflight is still off.
      3. Upcoming tasks is an `Input`. Expected % is an `InputGroup` with the `%` inside the box. Draft scores use Current Term Records' score box (`InputGroup` with `/ max` inside). Draft values use `self-reported-foreground` (AA). Save logic unchanged.
      4. New token `shadow-row-active` (the 3px primary bar on the row being edited). A draft row picked from the chart uses `task-highlighted:animate-record-highlight`, like Current Term Records, with its reduced-motion fallback. `TargetGradeSandbox.css` loses its own highlight rule and keyframes.
      5. Text: names `body` semibold (were Khand 16px), notes `small` (were 11px), group titles and headers `caption`. Notes may now wrap, so the table fits at 768 and 1024, as before. At 1280, where the result column sits beside it, it scrolls inside its box by 70px (was 47px). T8.6 handles that.
      6. Checked I6–I12 in a browser. Tests unchanged.
  - [x] **T7.I3** "How this is calculated" → `Collapsible`. SandboxSubjectPicker → `Dialog` + `Item` + `Badge`. Delete `TargetGradeSandbox.css` and `SandboxSubjectPicker.css`. Check: B8, B9, I13, I14.
    - **As done:**
      1. The rest of the sandbox moved to utilities too: the layout (flex, with the result on the right from `@2xl`, 672px of sandbox width; was 700px; the result column is 320px, was 260–330px), step 1 and the chart as `Card`s, and the empty messages. All four step headings use `SandboxStep`.
      2. The picker is the shadcn `Dialog` with `disablePointerDismissal`, so, as before, only Escape and Cancel close it, not a click outside. Focus still starts on the first subject. One difference: after closing, focus goes back to the sidebar button (before: the page body).
      3. Picker look: the title uses the `section-title` role, the eyebrow `caption`, the description `small` (was 10px) as the dialog's `DialogDescription`. Subject rows are `Item` links, "Viewing now" is a `Badge`, Cancel is in a `DialogFooter`. New token `spacing-picker-list` keeps the list's old maximum height, `min(55vh, 420px)`.
      4. The "How this is calculated" toggle stays primary when open (the ghost button turns dark when open; Current Term Records' breakdown toggle does that today).
      5. Checked B8, B9, I13 and I14 in a browser: same text, accessible names, links and keyboard behaviour as before.
- **Grade Rules**
  - [x] **T7.J1 GradeRules page.**
    - Change: search `Input`, thumbnail `ToggleGroup`, `RuleCard` (`Card`, `Badge`, `Button`), RuleBar, RulePieChart and RuleHierarchyTable (`Table`), `RuleLegend` (G16), `Empty`.
    - Delete `GradeRules.css` and `RuleVisuals.css`.
    - Check: J1–J4, J8.
    - **As done:**
      1. The page uses `PageShell` with `showFooter={false}` (still no footer), so its background is the shared `muted` one (was white) and the 1180px content cap is gone. The card grid follows the space next to the sidebar: two columns from `@xl` (576px), three from `@4xl` (896px); before, `auto-fill` with 300px minimum cards.
      2. `RuleDetailPage` imported `GradeRules.css` too. Its layout (`rules-layout`/`-main`/`-content`), the view switch (`rules-toggle`) and `btn-secondary`/`is-danger` moved unchanged to the top of `RuleDetailPage.css` for T7.K1 and T7.K3. On the editor, only the shared visuals changed: the formula, the hierarchy table and the pie legend.
      3. `RuleFormula` keeps its boxed look and takes a `className`; the card shows it as plain `small` text, as before. `RuleLegend` (G16) serves the bar and the pie (`stacked`).
      4. Rule cards: an `<article>` around a `Card`, with the hover lift and outline as before (`shadow-hover`, no movement with reduced motion). Tags are outline `Badge`s with the dot, usage is a secondary `Badge`, Duplicate and Delete are outline `Button`s (`sm`, 44px below `md`).
      5. Text: card titles `card-title` (were 23px), table, legend and notes `small` (were 11–13px). The compact thumbnail table still fits its 164px box at 14px.
      6. The preview toggle is a `ToggleGroup`: one Tab stop, arrows move between the options (G15, as for the term tabs).
      7. Checked J1–J4 and J8 in a browser, plus a card click and Delete opening the dialog.
  - [x] **T7.J2** DeleteRuleDialog → `Dialog` + `NativeSelect`. Check: J5–J7.
    - **As done:**
      1. Both cases (the last rule, and a normal delete) share one private frame: the shadcn `Dialog` with `disablePointerDismissal`, so, as before, only Escape and the buttons close it, not a click outside. Focus still starts on the first control. After closing, focus goes back to the Delete button that opened it (before: the page body).
      2. The label still wraps the select, so its accessible name is unchanged. The subject list, the lost-task warning and the error use utilities; new token `spacing-delete-list` keeps the list's old maximum height, `min(40vh, 300px)`.
      3. "Delete rule" keeps the coral fill with dark text (`warning-foreground`, WCAG AA; was white, 2.6:1), and turns `destructive` on hover. The buttons sit in a `DialogFooter`, stacked on phones.
      4. Its `.rule-delete-*` rules left `Dialog.css`. `.app-dialog-warning` stays for the editor's impact dialog until T7.K3.
      5. Checked J5–J7 in a browser, from the Grade Rules page and from the rule editor: same text, and the same data moves to the replacement rule.
- **Rule editor**
  - [x] **T7.K1** Details form: `Field`, `Input`, `Checkbox`s in `FieldSet`, school chips (`Badge` + `Button`). Check: K13, K14.
    - **As done:**
      1. Added shadcn `checkbox`, adapted in the same commit: `cn` from `@/lib/utils`, `rounded-sm` instead of `rounded-[4px]`.
      2. The form is a `FieldGroup` grid that follows the content width (two columns from `@xl`, three from `@3xl`; before, `auto-fit` with 260px minimum columns). Same column count at 375, 768, 1024 and 1440.
      3. Rule name: `Field` + `FieldLabel` + `Input`, with the error still a plain `small` tied by `aria-describedby` (no new `role="alert"`). Tags: a `FieldSet` and `FieldLegend` with a `Checkbox` inside each pill label; read-only tags are secondary `Badge`s. Schools are outline `Badge`s with a ghost `Button` (an × icon instead of the "×" character, same "Remove …" name); "Add school" is an outline `Button`.
      4. Accessibility: the school box now has "Schools that use this rule" as its label while editing (before it had none, AGENTS §7). Read-only values are `small` text in a muted box.
      5. The criteria section's error line lost `rule-field-error` too. The details rules left `RuleDetailPage.css`.
      6. Checked K13, K14, tag toggling (click, label, Space) and adding, de-duplicating and removing schools in a browser, against the old code: same results and saved data.
  - [x] **T7.K2 ⚠ PillEditor / PillLevel.**
    - Buttons → `Button size="icon"`, the % box → `Input`, the handles stay custom (`@utility`).
    - `window.confirm("Delete … and all of its subcriteria?")` → `AlertDialog`, same wording (D4, approved).
    - Delete `PillEditor.css`.
    - Check: K3–K8.
    - **As done:**
      1. The add, rename and delete buttons are outline `Button`s (`icon-xs`, 36px on touch screens as before), with icons instead of the "+", "✎" and "×" characters; their names are unchanged. Disabled ones keep the pointer, so the reason still shows in the tooltip (K8).
      2. The parent-name toggle is a ghost `Button` with `aria-pressed`, same hover, tap and focus preview. The rename box is an `Input`, the % box an `InputGroup` sized to the number (`field-sizing-content`). Chips are outline `Badge`s.
      3. `window.confirm` became an `AlertDialog` (D4): the same question, Cancel and OK, focus on OK, Escape cancels.
      4. The handles, dots and bars stay custom, now as utilities reading the criterion colours from CSS variables. The level indent is a new `@utility pill-indent` (32px a level, 14px on phones). The gap between sections stays 18px on phones (was 16px).
      5. Text: names `card-title` (were 22px, 18px on phones), "= Grade" `section-title`, the % and preview text `body` and `small` (were 13–17px).
      6. The K1 school chips get `overflow-visible` too, so the remove button's focus ring isn't clipped (same `Badge` pattern).
      7. Checked K3–K8 in a browser against the old code at 1440 and 375: typing, limits, Escape, keyboard and pointer dragging, preview, add, rename (and a duplicate name), split, delete, the confirmation and the limits gave the same results.
  - [x] **T7.K3** View switch `ToggleGroup`, the impact `Dialog`, the status line, the action buttons. Delete `RuleDetailPage.css`. Check: K1, K2, K9–K12, K15.
    - **As done:**
      1. The editor uses `PageShell` with `showFooter={false}` (still no footer), like Grade Rules since T7.J1, so its background is the shared `muted` one (was white). Details, Criteria and Breakdown sit in one `Card`, split by `Separator`s, and the save bar is its `CardFooter`. The back link is `BackLink`.
      2. The impact dialog and DeleteRuleDialog now share `RuleDialog` (the eyebrow, title, Escape-only closing and the Cancel or Close button) and `RuleSubjectList`. Their outline buttons use the plain `outline` style. The impact list lost its hover effect (it isn't clickable). Token `spacing-delete-list` became `spacing-rule-dialog-list`.
      3. The saved-message line is an `Alert` that keeps `role="status"`. The view switch is a `ToggleGroup` (one Tab stop, arrow keys, G15).
      4. "Rule not found" (K15) is an `Empty` with the `BackLink`, so its "← All rules" link shows the arrow as an icon: "All rules", like the editor's own back link.
      5. After the impact dialog closes, focus goes back to "Save changes" (before: the page body). The now-unused `.btn-primary` rule left `index.css`; `components/Dialog.jsx` has no users left and goes in T7.Z.
      6. Checked K1, K2, K9–K12 and K15 in a browser against the old code at 1440 and 375, and J5–J7 again on the shared dialog: same text, results and saved data.
- **Settings (R5: a shell task plus one per section)**
  - [x] **T7.L0 Settings shell: same look as the other pages (owner decision, Gate 4).**
    - **As done:**
      1. Settings' own "Help & Resources" button was in its old sidebar and is the only way to open the Settings help. Owner decision (2026-11-12): keep it, beside the section tabs, with the same label and behaviour (B2: the help only shows while Security is open). It is hidden below `lg`, as before (it was hidden at 900px and narrower).
      2. The sections are shadcn `Tabs` (line style, wrapping on narrow screens) with one panel holding the section `Card`. The panel and card keep body-size text, so the sections, still on their own CSS until T7.L1s–L5s, look as before. The status message keeps no role.
      3. `GlobalSettings.css` lost the shell (layout, own sidebar, brand, workspace box, menu, help button, back link, heading, card, status), the dead `.section-index` and `.account-chip` rules, the page-wide element rules (`src/index.css` already has them), and the `--settings-*` aliases (their uses now point at the global tokens).
      4. Its unscoped `button`/`input`/`select`/`textarea` focus outline reached every page. It is now limited to the Settings sections (`:where(.settings-content)`, same specificity), so other pages' controls show their own focus style.
      5. The reduced-motion rule moved to `src/index.css` unchanged (B19).
      6. Settings now shows the shared footer, like the other non-rules pages. `scripts/screenshots.mjs` opens the sections by their tab instead of a button (selector only).
      7. Checked L1 as changed, the section switching (click and arrow keys), B2, and B1, B7 and B10 on `/settings`, at 375, 768, 1024 and 1440. Every other page's screenshots are unchanged.
    - **Shell:** Settings drops its own layout, its own yellow navigation sidebar and its own colour aliases. It uses `PageShell`, like the other pages: the shared Sidebar, Header and PageFooter, the global tokens and the `type-*` roles.
    - **Section navigation:** Profile, Account, Security, Notifications and Account Actions become `Tabs` at the top of the page content.
    - **Kept:** the "Back" link (`BackLink`, same wording), the page heading and the status message.
    - **Removed:** the "Workspace: Student" label, a leftover of the discontinued workspace switcher (`SPEC.md` §6 g, updated through the protocol).
    - **Brand mark:** removed from Settings; the shared Sidebar already shows it.
    - **Header:** the shared Header with its default title and subtitle ("Welcome back, <first name>!", "A little progress, every day."), with no `title` prop (owner decision, Gate 4).
    - **Reduced motion:** move the unscoped rule from `GlobalSettings.css` to `index.css` **unchanged** (B19: same reach, now explicit).
    - **Afterwards:** `SPEC.md` F14 ("its own layout") needs an owner-approved SPEC update, and checklist L1 is updated.
    - Check: V-visual at all widths; L1; B1–B12 on `/settings` (it now has the shared sidebar).
  - [x] **T7.L1s Profile section** → `features/settings/components/ProfileSection.jsx`, `Card`, `Item`. Check: L2.
    - **As done:**
      1. `ProfileSection({ profile, initials })`: a `Card` with an `Avatar` (the photo, or the initials), a `Badge`, three `Item`s for the summary and a `Separator` before the bio. The panel's row-click handler had no rows to act on here, so it isn't used.
      2. The avatar stays 88px at every width (the CSS's 92px and full-width phone rules were already overridden by a later 88px rule). The summary goes to three columns from `lg` (was above 900px).
      3. Text: the name `card-title`, the username `body`, labels, values and the bio `small` (were 12–14.5px), "Short bio" `small` semibold (was Khand 14.4px).
      4. Its rules left `GlobalSettings.css`; the selector lists shared with Account's photo box were trimmed.
      5. Checked L2 in a browser, without and with a saved photo, at all four widths.
  - [x] **T7.L2s Account section** → `AccountSection.jsx`: `Field`, `Input`, file `Input`, `Avatar`, `Button`. Check: L3, L4.
    - **As done:**
      1. `AccountSection` gets the account, the chosen photo, the editing state and the GlobalSettings handlers as props; the state and the save logic stay in GlobalSettings, unchanged.
      2. "Choose photo" stays a real file input filling a button-styled label, not the shadcn file `Input`: that one shows the browser's own "Choose file / No file chosen" text, which would replace the wording. Name, click area and disabled state are as before.
      3. The fields are `Field` + `FieldLabel` + `Input`, and the bio a `Textarea`, in a `FieldGroup` with two columns from `lg` (was above 900px). Labels now point at their field (`htmlFor`) instead of wrapping it; the names are the same. Inputs are 40px (44px below `md`; were 44px everywhere). The photo is an `Avatar` (82px, as before).
      4. "Save changes" keeps the yellow fill (`highlight-strong`); "Save photo" and "Edit again" are outline `Button`s; on phones they fill the width, as before.
      5. Its rules left `GlobalSettings.css`. `.field`, `.secondary-button` and `.primary-button` stay for Security until T7.L3.
      6. Checked L3 and L4 in a browser against the old code at 1440 and 375: every keystroke saved, "Account details updated.", the GIF and PNG messages, "Choose an image first.", the disabled state and "Edit again" gave the same results.
  - [x] **T7.L3 ⚠ Security section** → `SecuritySection.jsx`.
    - Change: the password flow (`Field`, `InputGroup` with the Show/Hide text), the verification code `Input`, 2FA, sessions (`Item`), `AlertDialog`s, the help `Dialog` + `Tabs` (G17).
    - B2 and B5 behaviour is kept.
    - Check: L5–L10.
    - **As done:**
      1. `SecuritySection({ security })`. The state and handlers stay in GlobalSettings and arrive as one object, because they must outlive a switch to another section (today a half-done password change is still there when you come back) and the page's Help button sets `helpDialog` (B2). The handlers are unchanged. `SettingsIcon` moved to its own file, sized with utilities.
      2. The 2FA "Turn off" confirmation stays **inline** (rebuilt from shadcn parts), not an `AlertDialog` as §3.1 lists. It shares `confirmCurrentLogout` with the session dialog (B5): after "Turn off 2FA" it stays visible and the flag stays on, so the current session's dialog opens straight into "Confirm Log Out". As a modal it would block that path, so B5 wins.
      3. The session details are a shadcn `Dialog` (a click outside only closes it, Close also resets the shared flag, as before), "Log out all other sessions" an `AlertDialog` that a backdrop click closes, and the help a `Dialog` with `Tabs` and panels (G17). All three now also close with Escape and hold focus while open.
      3a. Rows (overview, sessions, verified contacts) are `Item`s; the contact choice is a `RadioGroup`; password boxes are `InputGroup`s with the Show/Hide text button (G19); the code box is a `Field` + `Input`; the strength bars and requirement list use tokens. The "›", "‹" and "×" characters are icons; the back button reads "Security".
      4. Found, kept (bug): with no verified contact, 2FA "Turn on" shows no message. Its error line only renders inside the verification block, which needs a contact. Checklist L7 expects "Add and verify an email address or phone number…".
      5. `GlobalSettings.css` keeps only the rules Notifications and Account Actions still use (1,498 → 369 lines). The tab icons are 18px (were 18.4px).
      6. Checked L5–L10, B2 and B5 in a browser against the old code at 1440 and 375, including a seeded account without a verified contact and one with a second active session: same messages, saved account data and flows; only the glyphs differ.
  - [x] **T7.L4s Notifications section** → `NotificationsSection.jsx`. `ToggleSetting` → `Switch`; toggles still not saved (B3). Check: L11.
    - **As done:**
      1. Added shadcn `switch`, adapted in the same commit: `cn` from `@/lib/utils`; the scale instead of `h-[18.4px]`, `w-[32px]` and `translate-x-[calc(100%-2px)]` (track 32 × 18px, the thumb travels 14px); a `card` thumb, visible on the light "off" track.
      2. Each row keeps the old toggle's visible "On"/"Off" word beside its `Switch` (hidden from screen readers; the switch states it). The switches keep their names.
      3. A click anywhere on a row still flips its switch. The row checks this itself now, because the page-wide row-click handler looked for a `button` and was only used here. That handler, `SettingRow.jsx` and `ToggleSetting.jsx` had no users left and are deleted in this task (the plan had them in T7.L5s).
      4. The state stays in GlobalSettings: it survives a section switch and resets on reload (B3).
      5. Checked L11 in a browser against the old code at 1440 and 375: switch click, row click, Space, section switch and reload gave the same results.
  - [x] **T7.L5s Account Actions section** → `AccountActionsSection.jsx`, `Button`s (still no action, B1/B3). Delete `GlobalSettings.css`, `SettingRow.jsx` and `ToggleSetting.jsx` if they are now unused. Check: L12.
    - **As done:**
      1. `AccountActionsSection`: Download and Clear are outline `Button`s, still without an action (B3); "Log Out" opens the same inline "Are you sure you want to log out?" panel, whose Log Out still does nothing (B1). The panel's state stays in GlobalSettings.
      2. The two plain rows lost their pointer cursor and hover lift (they were never clickable; the hover tint stays).
      3. `GlobalSettings.css` is deleted, and with it the `settings-content` focus scope. `SettingRow.jsx` and `ToggleSetting.jsx` already went in T7.L4s. Only `src/index.css` and `components/Dialog.css` (T7.Z) remain as stylesheets.
      4. Checked L12 in a browser against the old code at 1440 and 375: same results, no stored data changed, still signed in after the confirmed Log Out.
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
- **Deleting StudentSettingsPrototype and its CSS (D1):** resolved. SPEC §6 (f) now marks them as dead code to delete in Phase 5a (commit `ca4b747`).
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

## 8a. Gate 4 decisions (2026-11-11)

| Decision | Where it is applied |
| --- | --- |
| Hover and focus styles may change, so that every element rule is in Tailwind's layer system | Done after T4.5 (T4.3 note) |
| Settings looks like the other pages and uses the global stylesheet and shared shell | T7.L0–T7.L5s, §5 Settings row |
| Remove the "Workspace: Student" label (discontinued workspace switcher). `SPEC.md` §6 (g) updated | T7.L0 |
| Generated shadcn components are edited to use tokens (no one-off values; control heights from §4.3) | §3.1, every Phase 7 task that adds a component; `AGENTS.md` §7 |

## 8. Gate 3 decisions

The owner answered on 2026-11-11:

| # | Decision | Where it is applied |
| --- | --- | --- |
| D1 | The settings prototype and its `.student-switcher*` / `.student-role-*` CSS are dead code and are **deleted** | T5a.1, T5a.3. `SPEC.md` §6 (f) updated in `ca4b747` |
| D2 | Add the `display` and `card-title` type roles | §4.2, `AGENTS.md` §7 |
| D3 | Add the missing General Sans weights. Use only Khand and General Sans, from `src/assets/` | §4.2, T4.4, T7.0c, `AGENTS.md` §7 |
| D4 | `window.confirm` → `AlertDialog` | T7.K2 |
| D5 | Drafts feed the sandbox only, and the box starts from the real self-reported score | T6.12 |
| D6 | Remove `@types/react*` | T9.1 |
| D7 | Use the shadcn `Sidebar`, keeping the current look; its new behaviour is worked on during the clean-up | §3.2, T7.S0–S6 |

| S1–S5 | Sidebar behaviour as in §3.2: keep the `compugrade-sidebar-minimized` key with no cookie, keep the Ctrl/⌘+B shortcut, phone switch at 767, tablet default kept, minimised pop-out kept | T7.S0–S3 |
| D8 | The design tokens in §4 are approved as listed, including the AA darkening | T4.5, T7.0a |

**Recorded in `SPEC.md`** (commit `ca4b747`, through the SPEC protocol):
- the D1 note in §6 (f)
- the owner's homepage idea, in the §9 Backlog. It is a new feature, so it is not built in this job.

Nothing is left open.

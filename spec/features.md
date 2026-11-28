# CompUGrade — Specification, §3

Part of the spec; `SPEC.md` lists every spec file. Changes only through the protocol in
`AGENTS.md` §2, logged in `SPEC.md` §11.

## 3. Features

### F1. Sign-in and registration — [BUILT]

- **Log in** with an email or user ID plus a password. A demo-account hint is shown. A user who is already signed in is not redirected away from `/`.
- **Register** as Student (the new user is signed in) or as Professor (see §6).
- **Route guard:** every route except `/` needs a signed-in student. Anyone else is sent to `/`, and only the pathname is kept for the return trip (AUDIT B14).
- **Passwords** are stored in plaintext (AUDIT B15).
- **Files:** `frontend/src/pages/auth/LoginRegister.jsx`, `frontend/src/features/auth/hooks/useAuthForm.js`, `frontend/src/features/auth/lib/accounts.js`, `frontend/src/app/RequireStudent.jsx`, `frontend/src/services/session.js`, `frontend/src/services/db.js`

### F2. Student Hub (`/student/dashboard`) — [BUILT]

- current-semester badge
- all-subjects grade-history chart: term switch, subject chips, and clicking a point opens that task
- enrolled-subjects table for the current semester: filter, search, add subject. Each row shows code, name, professor ("Awaiting assignment" if there is none), official grade, expected grade and status
- **Files:** `frontend/src/pages/student/StudentDashboard.jsx`, `frontend/src/features/subjects/components/EnrolledSubjectsTable.jsx`, `frontend/src/features/history/components/AllSubjectsHistory.jsx`

### F2a. "Recent Updates" list — [PARTIAL]

The Dashboard shows a "Recent Updates" list, but its content is fixed sample text, not real data (AUDIT B13). A real feed is planned for a follow-up branch (§2). `frontend/src/pages/student/StudentDashboard.jsx`

### F3. My Subjects (`/student/subject`) — [PARTIAL]

- The same subjects table, with a semester picker. Only the current semester can be selected.
- **Missing:** the "Requests awaiting verification" list exists but can never appear (AUDIT B8).
- **Verification:** an admin-side feature, `[PLANNED]` (§6). A pending (unverified) subject is fully usable by the student.
- **Files:** `frontend/src/pages/student/SubjectMenu.jsx`

### F4. Add subject — [BUILT]

- **Fields:** subject code, subject name, professor name, section, grading rule. The rule picker starts on the rule of the student's most recently added subject.
- **Checks:** a code the student already has is rejected. A subject whose code and name both match an existing one is reused.
- **What it creates:**
  - a class in the current semester, with status `pending`, 3 units and a target of 90
  - a `verificationQueue` request
- **Files:** `frontend/src/features/subjects/components/AddSubjectForm.jsx`, `frontend/src/lib/subjects.js` (`addSubject`, `getInitialRuleId`)

### F5. Remove subject — [BUILT]

From the sidebar, after a confirmation dialog, removes the student's enrolment. `frontend/src/components/layout/Sidebar.jsx`, `frontend/src/lib/subjects.js` (`removeEnrollment`)

### F6. 3-state grading engine — [PARTIAL]

- Official (locked), self-reported and empty tasks are handled as described in §4.
- **"Empty"** means a recorded task with no official or self-reported score. Tasks that haven't been created yet are represented only by the sandbox's upcoming count (F9).
- **Missing:** nobody can enter an official score in the app. Official scores come only from stored data (the seed class `C101`).
- **Planned:** the professor enters official scores for their subjects (§6).
- **Files:** `frontend/src/lib/grades.js`, `frontend/src/features/term-records/components/CurrentTermRecords.jsx`

### F7. Subject Detail (`/student/subject/:subjectId`) — [BUILT]

- term tabs (`?term=`)
- target grade input, per term
- official and expected gauges (F17)
- Current Term Records (F8)
- grade-history chart with the plan line
- link to the sandbox
- target-reached celebration (F12)
- `?task=` scrolls to that task and highlights it
- **Known issue:** the semester label is hard-coded as "FIRST SEMESTER · 2026–2027" (AUDIT B7). The fix is planned for a follow-up branch (§2).
- **Files:** `frontend/src/pages/student/SubjectDetail.jsx`, `frontend/src/features/subjects/hooks/useSubjectDetail.js`, `frontend/src/features/history/components/SubjectGradeHistory.jsx`, `frontend/src/components/TermNavigation.jsx`, `frontend/src/lib/targets.js`, `frontend/src/lib/dom/focusTask.js`

### F8. Current Term Records — [BUILT]

- For each criterion of the subject's rule:
  - official scores are shown and locked
  - tasks without an official score accept a self-reported score
  - the student can add custom tasks
  - an official breakdown is shown
- **Validation:** see §4.
- **Files:** `frontend/src/features/term-records/components/CurrentTermRecords.jsx`, `frontend/src/components/DraftInput.jsx`, `frontend/src/lib/scores.js`

### F9. Target Grade Sandbox — [BUILT]

- **Where:** `/student/subject/:subjectId/sandbox`. The sidebar's "Target Grade Sandbox" button opens a subject picker that leads here.
- **What the student sets:** a sandbox target per term, the number of upcoming tasks (0–20) and an expected % for each criterion, and draft scores ("Try draft scores").
- **What it shows:** a result card (required score, reached, out of reach, complete or empty) and a plan chart.
- **Draft scores** are draft-only: stored apart from the real scores and used only inside the sandbox. See the note in §4.
- **Files:** `frontend/src/lib/sandbox.js`, `frontend/src/features/sandbox/components/TargetGradeSandbox.jsx`, `frontend/src/pages/student/TargetGradeSandboxPage.jsx`, `frontend/src/components/SandboxSubjectPicker.jsx`

### F10. Grade computation rules (dynamic syllabus computation) — [BUILT]

- **Rules list (`/student/rules`):** rule cards with a bar, pie or table thumbnail (the choice is remembered), search, duplicate, and delete with a replacement rule.
- **Rule editor (`/student/rules/new`, `/student/rules/:ruleId`):**
  - name, tags (Graduate or Undergraduate) and schools
  - pill editor: drag or type a %, add, split, rename and delete criteria, up to 3 levels and 8 criteria per level
  - formula, and a pie or table view
  - save, save as new, discard, duplicate, delete
  - an impact-warning dialog
- **Who writes rules:** the student creates and edits them. The effective multipliers are applied automatically (§4).
- **Planned** (owner decision, 2026-11-11):
  - A subject a professor creates uses that professor's rule.
  - A subject a student creates uses a rule the student makes.
  - If a student-made subject is later linked to a professor-made one, it is overwritten by the professor-made subject and its rule (see §10).
- **Files:** `frontend/src/lib/rules.js`, `frontend/src/pages/student/GradeRules.jsx`, `frontend/src/pages/student/RuleDetailPage.jsx`, `frontend/src/features/grade-rules/hooks/useRuleEditor.js`, `frontend/src/features/grade-rules/components/{PillEditor,PillLevel,RuleCard,RuleBar,RuleFormula,RuleHierarchyTable,RulePieChart,RuleLegend,DeleteRuleDialog,DeleteRuleButton,RuleDialog,RuleSubjectList,RuleWarning}.jsx`

### F11. Historical analytics — [PARTIAL]

- **Built:**
  - per subject and term, a line of the expected term grade after each task, with ghost points, the target-reached marker, the 75% passing line, the plan line and a table fallback
  - the all-subjects chart on the Dashboard
- **Missing:** semester-over-semester GPA growth, and trends across subject categories.
- **Files:** `frontend/src/lib/history.js`, `frontend/src/features/history/components/{AllSubjectsHistory,SubjectGradeHistory,HistoryCard}.jsx`, `frontend/src/components/history-chart/{HistoryChart,HistoryChartFrame,HistoryTable,HistoryLegend,HistoryEmpty,HistoryTooltip}.jsx`, `frontend/src/hooks/usePointHover.js`, `frontend/src/lib/dom/cssColor.js`

### F12. Target-reached celebration — [BUILT]

Behaviour is in §4. It differs from the project details (§10, D3). `frontend/src/features/subjects/hooks/useSubjectDetail.js`, `frontend/src/features/subjects/components/CelebrationDialog.jsx`, `frontend/src/lib/celebration.js`, `frontend/src/assets/congrats-voice.mp3`

### F13. Navigation: sidebar, header, footer — [BUILT]

- **Desktop sidebar:** collapsible to icons, with its toggle or Ctrl/⌘+B. The minimised state is remembered in `compugrade-sidebar-minimized`.
- **Widths:** the sidebar starts minimised from 768 to 1023px and expanded at 1024px and wider, and becomes a phone menu at 767px or less (owner-approved change).
- **Contents:** enrolled subjects by semester, the sandbox button, and a Help popup.
- **Header:** user initials.
- **Known issues (AUDIT B13):** the Help text promises a CSV export that doesn't exist. The header's bell and profile-chevron buttons do nothing. The features behind them are planned for a follow-up branch (§2).
- **Footer:** not shown on the Grade Rules pages.
- **Files:** `frontend/src/components/layout/{Sidebar,Header,PageFooter}.jsx`, `frontend/src/hooks/useSidebarState.js`, `frontend/src/components/layout/AppSidebarProvider.jsx`, `frontend/src/components/ui/sidebar.jsx`

### F14. Account settings (`/settings`) — [PARTIAL]

- **Built:** on the shared page shell (sidebar, header and footer), with the sections as tabs and Settings' own "Help & Resources" button beside them. Sections:
  - Profile (read-only)
  - Account (edit details and photo)
  - Security (password change with a simulated code, 2FA, sessions)
  - Notifications (toggles)
  - Account Actions
- **Missing or not working:**
  - Log Out does nothing (B1)
  - Help opens only from Security (B2)
  - Download and Clear do nothing, and the toggles aren't saved (B3)
  - the account is stored per browser, not per user, and changing the password here doesn't change the login password (B4)
- **Files:** `frontend/src/pages/settings/GlobalSettings.jsx`, `frontend/src/features/settings/hooks/useGlobalSettings.js`, `frontend/src/services/localAccountStore.js`, `frontend/src/services/prototypeVerification.js`, `frontend/src/features/settings/components/{ProfileSection,AccountSection,SecuritySection,NotificationsSection,AccountActionsSection}.jsx`

### F15. Stored-data upgrade — [BUILT]

Data saved in schema v1 is upgraded to v2 when it is read. `frontend/src/services/migrations.js`, `frontend/src/services/db.js`

### F16. Personalised subject emoji and accent colour — [PLANNED]

### F17. Visual progress metaphor: gauges — [BUILT]

- **Decision:** the project details describe a progress bar. Owner decision (2026-11-11): progress is shown as a gauge.
- **Subject Detail:** two ring gauges, official and expected. Each is filled with the term grade, clamped to 0–100, and has a marker at the target.
- **Sandbox:** the same gauge.
- **Planned:** enhancements to the gauge after the clean-up job (§2).
- **Files:** `frontend/src/components/GradeGauge.jsx`, used by `frontend/src/pages/student/SubjectDetail.jsx` and `frontend/src/features/sandbox/components/TargetGradeSandbox.jsx`

### F18. Conversational sandbox copy — [PARTIAL]

The result messages are plain instructions, for example "Score at least {x} on each of your {n} tasks left this term." There is no encouraging phrasing like the example in the project details. `frontend/src/features/sandbox/components/TargetGradeSandbox.jsx` (`SandboxResult`)

### F19. Supportive mascot in empty states and predictions — [PLANNED]

### F20. Professor, parent and administrator workspaces — [PLANNED]

See §6.

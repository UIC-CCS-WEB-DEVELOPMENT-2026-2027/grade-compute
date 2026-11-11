# CompUGrade — Specification

This file records what CompUGrade is and does. It changes only through the protocol in `AGENTS.md` §2.

- **Sources:** `docs/AUDIT.md` (what the code does, read at commit `7c3178a`) and `docs/project_details.md` (what the project intends).
- **Tags:** `[BUILT]` exists in code · `[PARTIAL]` partly exists · `[PLANNED]` in the project details, not in code.
- "Phase 1" and "Phase 2" in this file are **product** phases, not phases of the clean-up job.

## 1. Purpose and audience

CompUGrade turns syllabus grading rules into a dashboard. Students use it to track their official grades, enter their own scores, see how their grades are computed, and work out what they need to reach a target grade.

Goals (from the project details):

1. **Transparency:** students always know where they stand, without doing the maths by hand.
2. **Strategic learning:** students simulate future grades to decide where to put their effort.
3. **Standard grading expectations:** each subject's computation rule is applied accurately and automatically.

Audience:

- **Primary (Phase 1):** college and graduate students.
- **Secondary (future phases, all `[PLANNED]`):** high-school and elementary students, parents and guardians, professors and faculty, school counsellors and administrators.

## 2. Scope by phase

**Phase 1 (MVP) includes** the student experience only, as a standalone student environment:

- sign-in
- the Student Hub
- subjects
- the 3-state grading engine
- the Target Grade Sandbox
- grade computation rules
- grade history
- account settings

All data stays in the browser. There is no backend.

**Phase 1 excludes:**

- professor, parent and administrator workspaces (these roles are locked)
- integrations, notifications and exports
- everything in §8

**After the clean-up job.** These are owner-approved follow-up branches, not part of this job, and none of them is built yet:

- **Branding:** logo, product name, favicon and page title.
- **Semesters:** show the class's real semester on Subject Detail (AUDIT B7), and assign semesters without depending on today's date (AUDIT B12).
- **Features the UI already points to:** the CSV export promised in the sidebar Help, a real "Recent Updates" feed, and the header bell and profile menu (AUDIT B13).
- **Gauge enhancements (F17):** details to be decided then.

## 3. Features

### F1. Sign-in and registration — [BUILT]

- **Log in** with an email or user ID plus a password. A demo-account hint is shown. A user who is already signed in is not redirected away from `/`.
- **Register** as Student (the new user is signed in) or as Professor (see §6).
- **Route guard:** every route except `/` needs a signed-in student. Anyone else is sent to `/`, and only the pathname is kept for the return trip (AUDIT B14).
- **Passwords** are stored in plaintext (AUDIT B15).
- **Files:** `src/pages/auth/LoginRegister.jsx`, `src/components/shared/RequireStudent.jsx`, `src/utils/session.js`, `src/utils/db.js`

### F2. Student Hub (`/student/dashboard`) — [BUILT]

- current-semester badge
- all-subjects grade-history chart: term switch, subject chips, and clicking a point opens that task
- enrolled-subjects table for the current semester: filter, search, add subject. Each row shows code, name, professor ("Awaiting assignment" if there is none), official grade, expected grade and status
- **Files:** `src/pages/student/StudentDashboard.jsx`, `src/components/student/EnrolledSubjectsTable.jsx`, `src/components/student/AllSubjectsHistory.jsx`

### F2a. "Recent Updates" list — [PARTIAL]

The Dashboard shows a "Recent Updates" list, but its content is fixed sample text, not real data (AUDIT B13). A real feed is planned for a follow-up branch (§2). `src/pages/student/StudentDashboard.jsx`

### F3. My Subjects (`/student/subject`) — [PARTIAL]

- The same subjects table, with a semester picker. Only the current semester can be selected.
- **Missing:** the "Requests awaiting verification" list exists but can never appear (AUDIT B8).
- **Verification:** an admin-side feature, `[PLANNED]` (§6). A pending (unverified) subject is fully usable by the student.
- **Files:** `src/pages/student/SubjectMenu.jsx`

### F4. Add subject — [BUILT]

- **Fields:** subject code, subject name, professor name, section, grading rule. The rule picker starts on the rule of the student's most recently added subject.
- **Checks:** a code the student already has is rejected. A subject whose code and name both match an existing one is reused.
- **What it creates:**
  - a class in the current semester, with status `pending`, 3 units and a target of 90
  - a `verificationQueue` request
- **Files:** `src/components/student/AddSubjectForm.jsx`, `src/utils/subjects.js` (`addSubject`, `getInitialRuleId`)

### F5. Remove subject — [BUILT]

From the sidebar, after a confirmation dialog, removes the student's enrolment. `src/components/shared/Sidebar.jsx` (`removeSubjectEnrollment`)

### F6. 3-state grading engine — [PARTIAL]

- Official (locked), self-reported and empty tasks are handled as described in §4.
- **"Empty"** means a recorded task with no official or self-reported score. Tasks that haven't been created yet are represented only by the sandbox's upcoming count (F9).
- **Missing:** nobody can enter an official score in the app. Official scores come only from stored data (the seed class `C101`).
- **Planned:** the professor enters official scores for their subjects (§6).
- **Files:** `src/utils/grades.js`, `src/components/student/CurrentTermRecord.jsx`

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
- **Files:** `src/pages/student/SubjectDetail.jsx`, `src/components/student/SubjectGradeHistory.jsx`, `src/components/student/TermNavigation.jsx`, `src/utils/focusTask.js`

### F8. Current Term Records — [BUILT]

- For each criterion of the subject's rule:
  - official scores are shown and locked
  - tasks without an official score accept a self-reported score
  - the student can add custom tasks
  - an official breakdown is shown
- **Validation:** see §4.
- **Files:** `src/components/student/CurrentTermRecord.jsx` (exports `CurrentTermRecords`), `src/components/shared/DraftInput.jsx`

### F9. Target Grade Sandbox — [BUILT]

- **Where:** `/student/subject/:subjectId/sandbox`. The sidebar's "Target Grade Sandbox" button opens a subject picker that leads here.
- **What the student sets:** a sandbox target per term, the number of upcoming tasks (0–20) and an expected % for each criterion, and draft scores ("Try draft scores").
- **What it shows:** a result card (required score, reached, out of reach, complete or empty) and a plan chart.
- **Draft scores** currently change real data. See the note in §4.
- **Files:** `src/utils/sandbox.js`, `src/components/student/TargetGradeSandbox.jsx`, `src/pages/student/TargetGradeSandboxPage.jsx`, `src/components/student/SandboxSubjectPicker.jsx`

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
- **Files:** `src/utils/rules.js`, `src/pages/student/GradeRules.jsx`, `src/pages/student/RuleDetail.jsx`, `src/components/shared/{PillEditor,PillLevel,RuleCard,RuleBar,RuleFormula,RuleHierarchyTable,RulePieChart,DeleteRuleDialog,Dialog}.jsx`

### F11. Historical analytics — [PARTIAL]

- **Built:**
  - per subject and term, a line of the expected term grade after each task, with ghost points, the target-reached marker, the 75% passing line, the plan line and a table fallback
  - the all-subjects chart on the Dashboard
- **Missing:** semester-over-semester GPA growth, and trends across subject categories.
- **Files:** `src/utils/history.js`, `src/components/student/{HistoryChart,AllSubjectsHistory,SubjectGradeHistory,HistoryTooltip}.jsx`, `src/components/student/usePointHover.js`, `src/utils/cssColor.js`

### F12. Target-reached celebration — [BUILT]

Behaviour is in §4. It differs from the project details (§10, D3). `src/pages/student/SubjectDetail.jsx`, `src/assets/congrats_voice .mp3`

### F13. Navigation: sidebar, header, footer — [BUILT]

- **Desktop sidebar:** collapsible. The minimised state is remembered in `compugrade-sidebar-minimized`.
- **Widths:** the sidebar starts minimised at 1100px or less, and becomes a phone menu at 760px or less.
- **Contents:** enrolled subjects by semester, the sandbox button, and a Help popup.
- **Header:** user initials.
- **Known issues (AUDIT B13):** the Help text promises a CSV export that doesn't exist. The header's bell and profile-chevron buttons do nothing. The features behind them are planned for a follow-up branch (§2).
- **Footer:** not shown on the Grade Rules pages.
- **Files:** `src/components/shared/{Sidebar,Header,PageFooter}.jsx`, `src/components/shared/useSidebarState.js`

### F14. Account settings (`/settings`) — [PARTIAL]

- **Built:** its own layout. Sections:
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
- **Files:** `src/pages/GlobalSettings.jsx`, `src/utils/localAccountStore.js`, `src/utils/prototypeVerification.js`, `src/components/SettingRow.jsx`, `src/components/ToggleSetting.jsx`

### F15. Stored-data upgrade — [BUILT]

Data saved in schema v1 is upgraded to v2 when it is read. `src/utils/migrations.js`, `src/utils/db.js`

### F16. Personalised subject emoji and accent colour — [PLANNED]

### F17. Visual progress metaphor: gauges — [BUILT]

- **Decision:** the project details describe a progress bar. Owner decision (2026-11-11): progress is shown as a gauge.
- **Subject Detail:** two ring gauges, official and expected. Each is filled with the term grade, clamped to 0–100, and has a marker at the target.
- **Sandbox:** the same gauge.
- **Planned:** enhancements to the gauge after the clean-up job (§2).
- **Files:** `src/pages/student/SubjectDetail.jsx`, `src/components/student/TargetGradeSandbox.jsx` (`Gauge`)

### F18. Conversational sandbox copy — [PARTIAL]

The result messages are plain instructions, for example "Score at least {x} on each of your {n} tasks left this term." There is no encouraging phrasing like the example in the project details. `src/components/student/TargetGradeSandbox.jsx` (`SandboxResult`)

### F19. Supportive mascot in empty states and predictions — [PLANNED]

### F20. Professor, parent and administrator workspaces — [PLANNED]

See §6.

## 4. Grading rules (exactly as implemented)

**Task percentage** (`grades.js`, `taskPercentage`)

- `score / maxScore × 100`.
- It is null when `maxScore` isn't a number above 0, or when the score is empty (`""`, `null` or `undefined`).

**The three states** (`grades.js`, `pickScore`)

- **Official:** a numeric `officialScore`. The official grade (`calculateOfficialGrade`) counts only these and skips custom tasks.
- **Self-reported:** a numeric `studentReportedScore`. The expected grade (`calculateUnofficialGrade`) uses the official score if there is one, otherwise the self-reported score. Custom tasks are included.
- **Empty:** neither score is set. The task isn't counted.

**Grades**

- **Criterion grade:** the plain mean of its task percentages. Every task counts equally, whatever its `maxScore`.
- **Term grade** (`calculateTermGrade`):
  - `Σ(grade_c × w_c) / Σ w_c`, over the leaf criteria that have a weight above 0 and at least one counted task
  - `w_c = rule.effectiveMultipliers[leafId]`
  - the weights are renormalised, so this is "the grade so far"
  - null if nothing counts
- **Final grade** (`calculateFinalGrade`): the mean of whichever of prelim, midterm and finals have a grade, weighted equally. Null if none do.

**Rounding**

- The engine never rounds. Display rounding varies by place:
  - enrolled-subjects table: 1 decimal, trailing zeros removed
  - Subject Detail gauges: 0 decimals on screen, 2 in the aria label
  - sandbox, history and tooltips: 2 decimals, trailing zeros removed
  - sandbox gauge aria label: 0 decimals
- **Status** (`subjects.js`), from the expected final grade:
  - "Passing" at 75 or more (`PASSING_GRADE`)
  - "Below passing" under 75
  - "No grades yet" when null

**Semesters** (`subjects.js`)

- First Semester runs August–December, Second January–May, and Summer June–July.
- The academic year starts in August.
- A class without a `semester` counts as First Semester of the current academic year, so what the Dashboard shows depends on today's date (AUDIT B12).
- New subjects get the current semester.

**Rule maths** (`rules.js`)

- **Units:** shares are integer hundredths of a percent (10000 = 100%). A typed percentage is rounded to 2 decimals.
- **Limits:** each criterion is at least 1%. A level holds at most 8 criteria, and a rule is at most 3 levels deep. Names are at most 30 characters and unique within their level (case-insensitive).
- **Effective shares:** apportioned per level by largest remainder, with ties going to the leftmost criterion. `effectiveMultipliers[leaf] = effective / 10000`.
- **Changing a percentage** trades with the right-hand neighbour, or the left-hand one for the last criterion.
- **Deleting a criterion** gives its share to the left neighbour, or the right-hand one if it was first.
- **Splitting a criterion** keeps the old id on the new child, so the recorded tasks move with it.
- **Legacy rules:** old `hierarchy` and AT/TLA rules are rebuilt when they are read.
- **Formula multipliers:** 4 decimals, with up to 2 trailing zeros removed.

**Sandbox** (`sandbox.js`, `getSandboxPlan`), for each leaf criterion

- **Scored tasks** use the official score, else the self-reported score. Custom tasks are included.
- **`upcoming`:** defaults to 1 if the criterion has no tasks, otherwise 0. It is rounded and clamped to 0–20.
- **`slots`** = open tasks + `upcoming`.
- **`expected`:** clamped to 0–100, or null.
- **Criterion grade:** `scoredSum/total + (slots/total)·R` when `expected` is null; otherwise `(scoredSum + slots·expected)/total`.
- **Counted:** when `total > 0` and the weight is above 0.
- **Term grade:** `A + B·R`, normalised over the counted weights.
- **Status:**
  - `empty`: nothing counts
  - `complete`: `B ≤ 0`, and projected = A
  - `impossible`: `R > 100 + 1e-9`
  - `reached`: `R ≤ 0`
  - otherwise `required`, where `required = min(100, roundUp2(R))` and `roundUp2(v) = ceil(v·100 − 1e-9)/100`
- **Raw score needed on a task:** `min(max, roundUp2(pct·max/100))`.

**Targets**

- **Default:** 90.
- **Sandbox:** `terms[t].sandboxDesiredFinalGrade` → `terms[t].desiredFinalGrade` → `sandboxDesiredFinalGrade` → `desiredFinalGrade` → 90. Each value must be 0–100.
- **Subject (history):** `terms[t].desiredFinalGrade` → `desiredFinalGrade` → 90, range-checked.
- **Subject Detail:** the same chain, but not range-checked (AUDIT B11).
- **Target input on Subject Detail:** saves `terms[t].desiredFinalGrade` and ignores values outside 0–100.

**History** (`history.js`)

- **Task order:** by first score time (the earlier of `studentScoredAt` and `officialScoredAt`), then `createdAt`, then the timestamp in a `CUSTOM-<ms>` id. Tasks with no time come first, in rule order.
- **Points:** each point is the expected term grade using the tasks up to that step.
- **Ghost point:** the same grade, but using the student's replaced entry instead of the official score.
- **"Target reached":** the last point is at or above the target.
- **Plan points:** criteria that use the required % come first, then those with an expected %. The fill is `required`, or 100 if the target is impossible, or the current grade clamped to 0–100 if it is already reached.

**Celebration** (`SubjectDetail.jsx`)

- Fires when the **official or the expected** term grade goes from below the target to at or above it.
- Only while the page is open, on the same subject and term.
- Shows a message, plays audio and runs confetti for 6 seconds.

**Score-entry validation** (inside the components, duplicated)

- digits only
- between 0 and `maxScore`
- no more integer digits than `maxScore` has
- a custom task's `maxScore` must be a positive integer

**Known inconsistencies**, kept as they are during the clean-up:

- An `officialScore` of `""` counts as official in Current Term Records but as empty in the engine (AUDIT B10).
- The sandbox "Upcoming tasks" input forces 0 as soon as it is cleared (AUDIT B16).

> **Sandbox draft scores: current behaviour (AUDIT B9, a confirmed bug).**
> "Try draft scores" writes the real `studentReportedScore`, the same field Current Term Records edits, on every keystroke.
>
> **Approved fix, not built yet** (Gate 0, 2026-11-11; `AGENTS.md` §3):
>
> - Drafts become draft-only and are stored in a new optional field, `targetGradeSandbox.terms[term].draftScores` (`{ [taskId]: score }`).
> - They are never written to `studentReportedScore`.
> - Scheduled as its own task in Phase 6 of the clean-up job. There is no migration.
>
> Update this note through the protocol once the fix ships.

## 5. Data model (as implemented)

**Storage**

- There is no backend and no network call.
- The whole database lives in the browser's `localStorage` under `compugrade_db` (`schemaVersion: 2`).
- It is seeded from `src/utils/db.json` on first load.
- Hosted on Vercel as a single-page app.

| Entity | Attributes |
| --- | --- |
| `users[]` | `id` (`U<n>`), `role` (`student`, `professor` or `admin`), `name`, `email`, `password` (plaintext), `programSection?` |
| `computationRules[]` | `id` (`CR-n`), `ruleName`, `tags[]` (`Graduate` or `Undergraduate`), `schools[]`, `criteria` (a tree of `{id, name, weight (fraction of parent), children}`), `effectiveMultipliers {leafId: fraction}`, `isCopy?`, `copiedFromRuleId?`, legacy `hierarchy` |
| `subjects[]` | `id` (`SUB-n`), `subjectCode`, `subjectName`, `defaultComputationRuleId` |
| `classes[]` (one enrolment) | `id` (seed `C101`, new ones `C-<n>`), `subjectId`, `semester?`, `academicYear?`, `programSection`, `units` (always 3), `professorId`, `professorName?`, `status` (`verified` or `pending`), `computationRuleId`, `studentRecords[]` |
| `studentRecords[]` | `studentId`, `targetGradeSandbox {desiredFinalGrade, terms{[term]: {desiredFinalGrade, sandboxDesiredFinalGrade, criteria{[leafId]: {upcoming, expected}}, legacy upcomingAT/upcomingTLA/expectedExamScore}}}`, `grades {prelim, midterm, finals: {[leafId]: Task[]}}` |
| Task | `id`, `type`, `sequenceNumber`, `title`, `description`, `maxScore`, `officialScore`, `studentReportedScore`, `isCustomTask`, `studentScoredAt?`, `officialScoredAt?`, `createdAt?` |
| `verificationQueue[]` | `id` (`REQ-n`), `requestedByStudentId`, `subjectId`, `subjectCode`, `subjectName`, `programSection`, `requestedProfessorId`, `requestedProfessorName`, `computationRuleId`, `status`, `createdAt` |

**Relationships**

- A subject has many classes.
- A class uses one rule (`computationRuleId`) and may name a professor user (`professorId`; this is null for subjects a student adds).
- A class holds one record per enrolled student.
- `grades[term]` is keyed by the leaf criterion ids of the class's rule.
- A verification request points to a student, a subject and a rule.
- Rules and subjects have no owner: every account in the browser shares them.

**Seed data** (`db.json`)

- users `U1` (student), `U2` (professor) and `U3` (admin)
- rule `CR-1`
- subject `SUB-1`
- class `C101` (verified, with official scores)
- request `REQ-1` (pending)

**Other `localStorage` keys**

- `activeUserId`
- `compugrade-sidebar-minimized` (`"1"` or `"0"`)
- `compugrade_rule_thumbnail`
- `compugrade-account`: the Settings profile, sessions and a PBKDF2 `passwordCredential`, per browser
- legacy keys deleted when read: `compugrade-profile`, `compugrade-password`, `compugrade-settings-theme`

The B9 change in §4 adds the optional `draftScores` field. It isn't in the code yet.

## 6. Roles and access (today)

- **Not signed in:** only `/` (log in or register).
- **Student:**
  - can use everything in §3, but only sees and edits their own enrolments and scores
  - can create, edit and delete any rule (rules are shared)
  - cannot enter official scores
- **Professor, parent, administrator:** `[PLANNED]`. No workspace exists for any of them. Intended:
  - the professor creates subjects with their own rules and enters official scores (F6, F10)
  - the administrator verifies subjects (F3)

The code already contains these non-student pieces. They are kept, but none of them gives access to anything:

- (a) **Registering as a Professor** saves the account and shows "Professor account created. Your workspace is coming soon."
- (b) **Professor and admin logins** are checked and then stopped, with "Login verified. The Professor Workspace is coming soon." or "Login verified. This workspace is not available yet."
- (c) **Commented-out routes and imports** in `src/App.jsx` point to professor and admin pages that don't exist.
- (d) **Seed accounts:** professor `U2` and admin `U3`.
- (e) **Verification data:** `verificationQueue` requests and the class `status` field. `addSubject` writes them, but no one can act on them yet.
- (f) **An unused prototype:** the "Dev: Switch Workspace" prototype (`src/pages/StudentSettingsPrototype.jsx`), with its CSS.
- (g) **Settings** shows the label "Workspace: Student".

## 7. UX principles (from the project details)

- **Supportive, not stressful:** the design aims to reduce academic anxiety. The Hub is a clean, distraction-free summary.
- **Personalised aesthetics:** a custom emoji and accent colour per subject — `[PLANNED]` (F16).
- **Visual progress metaphors:** the project details describe a bar; owner decision (2026-11-11): a gauge. `[BUILT]` (F17).
- **Conversational copywriting:** encouraging, conversational sandbox predictions — `[PARTIAL]` (F18).
- **Micro-interactions and milestones:** a confetti burst when an officially locked grade meets the target — `[BUILT]`, differs (F12, D3).
- **Supportive mascot:** in empty states and sandbox predictions — `[PLANNED]` (F19).

## 8. Long-term vision (Phase 2 and beyond — not in scope)

- **Professor workspaces:** create classes, set computation formulas, push official grades.
- **Parental portals and alerts:** linked accounts, plus email or SMS summaries and threshold alerts.
- **Study-group and peer-tutoring suggestions.**
- **Integrations:** Google Classroom and Microsoft Teams sync, bulk Excel/CSV upload and export.
- **Institutional integration:** automated sectioning, campus-wide adoption, verifiable reports and transcripts.
- **Secondary audiences** in §1.

## 9. Backlog (not approved; nothing here is a commitment)

Suggested by the agent on 2026-11-11:

- After the freeze, decide one by one which bugs in `docs/AUDIT.md` §12 to fix.
- Hash the login passwords, or move accounts to a backend (AUDIT B15).
- Link the Settings account to the signed-in user in `db.users` (AUDIT B4).

## 10. Open questions

1. **Linking a student-made subject to a professor-made one (F10):** does "overwritten" cover only the rule, or also the student's tasks and self-reported scores? To be discussed when the feature is implemented.

**Code vs project details.** The owner settled these on 2026-11-11, and none of them changes during the clean-up job.

**Recorded as the code behaves:**

- **D1 Official scores:** only in stored data until the professor workspace exists (F6).
- **D3 Celebration:** also fires on the expected grade (F12, AUDIT B17).
- **D4 Historical analytics:** term grade only; GPA and category trends are `[PARTIAL]` (F11).
- **D6 Subject emoji and accent colour:** `[PLANNED]` (F16).
- **D7 Mascot:** `[PLANNED]` (F19).
- **D8 Conversational copy:** `[PARTIAL]` (F18).
- **D13 "Empty":** a recorded task with no score; future tasks are only the sandbox's upcoming count (F6).
- **D14 Locked roles:** placeholder code exists (§6).

**Settled with an owner decision:**

- **D2 Who writes rules:** professor-made subjects use the professor's rule, and student-made subjects use the student's (F10).
- **D5 Progress metaphor:** a gauge, to be enhanced after the clean-up job (F17, §2).
- **D9, D10 Semesters:** fixed in a follow-up branch (§2).
- **D11 Verification:** admin-side and `[PLANNED]`; unverified subjects are usable (F3).
- **D12 Things the UI shows that don't exist:** built in a follow-up branch (§2).
- **D15 Sandbox draft scores:** a bug with an approved fix (§4 note).

## 11. Changelog

- **2026-11-11:** Created from `docs/AUDIT.md` (code at `7c3178a`) and `docs/project_details.md` in Phase 1 of the clean-up job. Owner decisions on D1–D15 are recorded in §10.

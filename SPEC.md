# CompUGrade — Specification

This file and the files in `spec/` record what CompUGrade is and does. They change only through the protocol in `AGENTS.md` §2.

- **Sources:** `docs/AUDIT.md` (what the code does, read at commit `7c3178a`) and `docs/project_details.md` (what the project intends).
- **Tags:** `[BUILT]` exists in code · `[PARTIAL]` partly exists · `[PLANNED]` in the project details, not in code.
- "Phase 1" and "Phase 2" in this file are **product** phases, not phases of the clean-up job.

## Where things are

Section and feature numbers (§1–§11, F1–F20) are the same in every file, so a reference
such as "SPEC.md §4" or "F9" still points to one place.

| Section | File | Read it when the task |
| --- | --- | --- |
| §1, §2, §6–§11 | this file | always |
| §3 Features (F1–F20) | `spec/features.md` | touches a screen or feature. Read only its F entries |
| §4 Grading rules | `spec/grading-rules.md` | computes, rounds or displays a grade, score, target or status |
| §5 Data model | `spec/data-model.md` | reads or writes stored data |

**Role specs.** Professor, parent and administrator workspaces are `[PLANNED]` (§6, F20).
When the owner approves a task for one, its spec starts as `spec/roles/<role>.md` (for
example `spec/roles/professor.md`), through the protocol. A role file describes only what
that role sees and does. For shared rules it links to §4 and §5 instead of repeating them.
The student is the only built role, so the student spec stays in `spec/features.md`.

**One changelog.** A change to any spec file is logged in §11 of this file.

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

Moved to `spec/features.md`.

## 4. Grading rules (exactly as implemented)

Moved to `spec/grading-rules.md`.

## 5. Data model (as implemented)

Moved to `spec/data-model.md`.

## 6. Roles and access (today)

- **Not signed in:** only `/` (log in or register).
- **Student:**
  - can use everything in §3, but only sees and edits their own enrolments and scores
  - can create, edit and delete any rule (rules are shared)
  - cannot enter official scores
- **Professor, parent, administrator:** `[PLANNED]`. No workspace exists for any of them. Intended:
  - the professor creates subjects with their own rules and enters official scores (F6, F10)
  - the administrator verifies subjects (F3)

The code contains, or contained, these non-student pieces. (f) and (g) are gone; the rest are kept. None of them gives access to anything:

- (a) **Registering as a Professor** saves the account and shows "Professor account created. Your workspace is coming soon."
- (b) **Professor and admin logins** are checked and then stopped, with "Login verified. The Professor Workspace is coming soon." or "Login verified. This workspace is not available yet."
- (c) **Commented-out routes and imports** in `frontend/src/app/App.jsx` point to professor and admin pages that don't exist.
- (d) **Seed accounts:** professor `U2` and admin `U3`.
- (e) **Verification data:** `verificationQueue` requests and the class `status` field. `addSubject` writes them, but no one can act on them yet.
- (f) **An unused prototype:** the "Dev: Switch Workspace" prototype (`src/pages/StudentSettingsPrototype.jsx`), with its CSS. It was dead code and was deleted in Phase 5a of the clean-up job (T5a.1; owner decision, Gate 3, 2026-11-11).
- (g) **Settings** shows the label "Workspace: Student", left over from a discontinued workspace-switching feature. It was removed when Settings moved onto the shared page shell (T7.L0, 2026-11-12; owner decision, 2026-11-11).

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

Suggested by the owner on 2026-11-11:

- **Interactive homepage hero:** replace the hero section of the sign-in page (`/`) with something visitors can try, such as a grade calculator. When a professor is on the homepage, it switches to a grade inputter. Professor features are `[PLANNED]` (§6).

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
- **2026-11-11:** §6 (f): the unused settings prototype is marked as dead code to delete in Phase 5a (owner decision, Gate 3).
- **2026-11-11:** §9: added the owner's interactive-homepage idea to the Backlog.
- **2026-11-11:** §6 (g): the "Workspace: Student" label in Settings is marked for removal in T7.L0 (owner decision).
- **2026-11-12:** §3, §5 and §6: file paths updated after the Phase 5 moves and the Phase 6 extractions (owner approved).
- **2026-11-12:** F9, §4 and §5: the B9 fix has shipped. Sandbox drafts are draft-only (`draftScores`), and the chart draws them after the real scores (owner approved).
- **2026-11-12:** F13: sidebar thresholds (767/1023) and the Ctrl/⌘+B shortcut, after the sidebar rebuild (owner approved).
- **2026-11-12:** F14: Settings uses the shared page shell, with its sections as tabs (T7.L0, owner approved).
- **2026-11-12:** §6 (g): the "Workspace: Student" label has been removed (T7.L0, owner approved).
- **2026-11-13:** F10, F11, F14, F17, §4 and §6: file lists, score validation, score-percentage rounding and the deleted prototype brought up to date after the clean-up (T9.6, owner approved).
- **2026-11-13:** F1, F5, F7, F9–F12, F14 and §4: file paths updated after the follow-up tasks (FU1–FU3, owner approved).
- **2026-11-24:** §3, §4 and §5 moved word for word into `spec/features.md`, `spec/grading-rules.md` and `spec/data-model.md`. Added "Where things are" and the role-spec rule. Section and feature numbers are unchanged (owner approved).
- **2026-11-28:** §6 (c), F1–F15, F17, F18 and §5: file paths start with `frontend/` after the React app moved there (T-JM-14, owner approved).

# CompUGrade — Specification, §5

Part of the spec; `SPEC.md` lists every spec file. Changes only through the protocol in
`AGENTS.md` §2, logged in `SPEC.md` §11.

## 5. Data model (as implemented)

**Storage**

- There is no backend and no network call.
- The whole database lives in the browser's `localStorage` under `compugrade_db` (`schemaVersion: 2`).
- It is seeded from `frontend/src/services/db.json` on first load.
- Hosted on Vercel as a single-page app.

| Entity | Attributes |
| --- | --- |
| `users[]` | `id` (`U<n>`), `role` (`student`, `professor` or `admin`), `name`, `email`, `password` (plaintext), `programSection?` |
| `computationRules[]` | `id` (`CR-n`), `ruleName`, `tags[]` (`Graduate` or `Undergraduate`), `schools[]`, `criteria` (a tree of `{id, name, weight (fraction of parent), children}`), `effectiveMultipliers {leafId: fraction}`, `isCopy?`, `copiedFromRuleId?`, legacy `hierarchy` |
| `subjects[]` | `id` (`SUB-n`), `subjectCode`, `subjectName`, `defaultComputationRuleId` |
| `classes[]` (one enrolment) | `id` (seed `C101`, new ones `C-<n>`), `subjectId`, `semester?`, `academicYear?`, `programSection`, `units` (always 3), `professorId`, `professorName?`, `status` (`verified` or `pending`), `computationRuleId`, `studentRecords[]` |
| `studentRecords[]` | `studentId`, `targetGradeSandbox {desiredFinalGrade, terms{[term]: {desiredFinalGrade, sandboxDesiredFinalGrade, criteria{[leafId]: {upcoming, expected}}, draftScores?{[taskId]: score}, legacy upcomingAT/upcomingTLA/expectedExamScore}}}`, `grades {prelim, midterm, finals: {[leafId]: Task[]}}` |
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

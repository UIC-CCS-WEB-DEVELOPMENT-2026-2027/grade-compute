# Draft: `SPEC.md` §2 and §6 with the back end

**A draft, not the spec** (T-JM-16, 2026-11-28). It shows how `SPEC.md` §2 (scope) and §6 (roles
and access) would read once the Laravel back end is approved. T-JM-1 writes the approved text into
`SPEC.md` through the protocol in `AGENTS.md` §2, one change at a time. Nothing here is built yet.

Based on `docs/LARAVEL_PLAN.md` (the owner decisions in §1 and §4), `SPEC.md` and `spec/`. The
other drafts: [`roles-professor.md`](roles-professor.md), [`roles-admin.md`](roles-admin.md),
[`roles-parent.md`](roles-parent.md), [`data-model.md`](data-model.md) and [`api.md`](api.md).

## Open questions

Each has a recommended answer. The text below follows the recommendations; if the owner picks
another answer, the text changes with it.

**S1 (B5). Can someone use CompUGrade without an account?**
Recommended: **no; every screen except the sign-in page needs an account, as today.**
Reason: the data now lives on the server, and every record belongs to someone. Guest use would
need a second storage path in the browser (`localStorage`), which the switch-over removes.

**S2. Which roles can register themselves?**
Recommended: **students, professors and parents register themselves; a professor account waits
for an administrator's approval before it can do anything; administrators are created only by
another administrator or by the seeder.**
Reason: a professor writes official scores that students can't change, so anyone who could
register as a professor could change any class's official record. Students and parents can only
reach their own data, so they need no approval.

**S3. One school or many?**
Recommended: **one institution per deployment for now.** Administrators see every account and
class in it. Rules keep their free-text `schools` tags, as today.
Reason: the course demo and the first users are one school (UIC). Several schools in one
deployment need a `schools` table, per-school administrators and data separation, which is a
large change better made when a second school is real.

**S4. How do the phases change?**
Recommended: **Phase 1 now includes the back end** (accounts and data on the server, through the
API). The three role workspaces stay out of Phase 1, but each is specified in `spec/roles/` and
built after the switch-over, one at a time: professor, then administrator, then parent.
Reason: the back end is the base every role needs, and the student experience moves onto it
first. Keeping the workspaces out of Phase 1 keeps the MVP's promise (the student experience)
while their specs exist ahead of the database design, as `docs/LARAVEL_PLAN.md` §1.9 asks.

**S5. Do professors, parents and administrators see students' self-reported scores, custom
tasks, targets and sandbox plans?**
Recommended: **no. They see official data only.** Self-reported scores, custom tasks, targets,
the sandbox and its draft scores are the student's own planning space and stay private to the
student.
Reason: the sandbox only works as a safe space if nobody else watches it (`SPEC.md` §7,
"supportive, not stressful"). It also shows each role only what it needs, which the data
privacy review (T-JM-27) is expected to ask for.

---

## 2. Scope by phase

**Phase 1 (MVP)** is the student experience, now on a shared back end:

- sign-in, with accounts on the server
- the Student Hub
- subjects
- the 3-state grading engine
- the Target Grade Sandbox
- grade computation rules
- grade history
- account settings

**The back end** (`backend/`, a Laravel 12 REST API with Sanctum's cookie sign-in) stores every
account and record in a MySQL database: MySQL 8 on Laragon locally, TiDB Cloud when hosted. The
React app (`frontend/`) calls it through `frontend/src/services/`. Grades are still computed in the
browser by `frontend/src/lib/` (§4). The API stores rules and scores, checks every input, and
decides who may read and write each record (§6). `spec/api.md` lists every endpoint, and
`spec/data-model.md` §5 every table.

Only per-browser display choices stay in the browser's `localStorage`: the sidebar's minimised
state and the rule-card thumbnail.

**After Phase 1, specified ahead and built one at a time** (each has its own file in
`spec/roles/`):

- **Professor workspace** (`spec/roles/professor.md`): classes with the professor's own rules,
  a roster, tasks and official scores.
- **Administrator workspace** (`spec/roles/admin.md`): approving professor accounts, verifying
  student-added subjects, managing accounts.
- **Parent portal** (`spec/roles/parent.md`): a read-only view of a linked student's official
  grades.

Until a workspace is built, its role can sign in only to a page that says the workspace is coming
soon (§6).

**Excluded from Phase 1 and from the role workspaces:**

- integrations (Google Classroom, Microsoft Teams), bulk CSV or Excel upload and export
- email and SMS notifications and alerts
- several schools in one deployment
- everything in §8

**After the clean-up job.** Owner-approved follow-up branches, none built yet:

- **Branding:** logo, product name, favicon and page title.
- **Semesters:** show the class's real semester on Subject Detail (AUDIT B7), and assign semesters
  without depending on today's date (AUDIT B12). With the back end, each class stores its
  semester and academic year, and the server works out the current semester in Manila time.
- **Features the UI already points to:** the CSV export promised in the sidebar Help, a real
  "Recent Updates" feed, and the header bell and profile menu (AUDIT B13).
- **Gauge enhancements (F17):** details to be decided then.

## 6. Roles and access

The server enforces everything in this section: a Laravel policy checks each request, and the
React app only hides what a role can't use. A request that breaks a rule is refused with 403
(`spec/api.md`).

**Accounts**

- Every account has one role: `student`, `professor`, `admin` or `parent`.
- Every account has a status:
  - `active`: can use its workspace
  - `pending`: a professor waiting for an administrator's approval. They can sign in, but only
    see a page saying the account is waiting for approval
  - `deactivated`: can't sign in. Set by an administrator; the data is kept
- **Not signed in:** only `/` (log in or register).
- Students, professors and parents register themselves (F1). Administrators are created by
  another administrator, or by the seeder.

**Who may read and write what**

| Record | Student | Professor | Administrator | Parent |
| --- | --- | --- | --- | --- |
| Their own account and Settings | read, write | read, write | read, write | read, write |
| Other accounts | no | the names and emails of students in their classes | read; change status; set a temporary password | no |
| Subjects (the code-and-name catalogue) | read; add through Add subject | read; add through a new class | read, write | no |
| A student-made class (one student's own subject) | its student: read, write, remove | no | read; verify, link or reject | no |
| A professor's class | its students: read | its professor: read, write | read | no |
| Rules | their own: read, write; templates and their classes' rules: read and duplicate | the same as a student | read | no |
| Tasks of a professor's class | its students: read | its professor: read, write | no | linked parents: read |
| Custom tasks | their own: read, write | no | no | no |
| Official scores | their own: read | their classes': read, write | no | linked students': read |
| Self-reported scores, targets, sandbox plans and draft scores | their own: read, write | no | no | no |
| Verification requests | their own: read; accept or decline a proposed link | no | read; decide | no |
| Parent links | their own: read, create a link code, remove | no | read, remove | their own: read, link, remove |

- **Official scores are written only by the class's professor.** A student can't write one, even
  on their own student-made class: there, every score is self-reported (F6).
- **A student can only see their own enrolments and scores**, as today.
- **Rules belong to their creator.** Template rules (made by the seeder, with no owner) can be read
  and duplicated by everyone. A student enrolled in a professor's class can read that class's
  rule and duplicate it, but not change it.
- Professors, administrators and parents never see self-reported scores, custom tasks, targets or
  sandbox plans (open question S5).

**Locked roles before their workspace is built.** A professor, administrator or parent who signs
in while their workspace doesn't exist yet sees today's messages (§6 (b)): "Login verified. The
Professor Workspace is coming soon." for a professor, and "Login verified. This workspace is not
available yet." for the others.
The commented-out professor and admin routes in `frontend/src/app/App.jsx` stay as they are until
their workspace's task replaces them.

The non-student pieces in today's §6 (a)–(e) are replaced: (a) and (b) by the account statuses
and the coming-soon page above, (d) by the seeder's accounts (`spec/data-model.md` §5), and (e) by
the `verification_requests` table and the administrator's workspace (`spec/roles/admin.md`).

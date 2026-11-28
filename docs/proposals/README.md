# Proposals: the back-end spec drafts

Drafts written for T-JM-16 (2026-11-28). **None of this is the spec.** At CP3 the owner answers the
open questions; then T-JM-1 writes the approved drafts into `SPEC.md` and `spec/`, one change at a
time, through the protocol in `AGENTS.md` §2, in this order (`docs/LARAVEL_PLAN.md` §3):

| Draft | Becomes | What it covers |
| --- | --- | --- |
| [`scope.md`](scope.md) | `SPEC.md` §2 and §6 | The back end in scope; roles and access as the server enforces them |
| [`roles-professor.md`](roles-professor.md) | `spec/roles/professor.md` | Classes, roster, tasks, official scores, linking a student's own subject |
| [`roles-admin.md`](roles-admin.md) | `spec/roles/admin.md` | Professor approvals, verification requests, accounts, subjects |
| [`roles-parent.md`](roles-parent.md) | `spec/roles/parent.md` | Linking with the student's code; official grades, read-only |
| [`data-model.md`](data-model.md) | `spec/data-model.md` §5 | Every table, in Laravel's naming; seed data |
| [`api.md`](api.md) | `spec/api.md` (new) | Every endpoint, who may call it, what it accepts, its errors; how the React app calls it; the Laravel practices |

Each draft starts with its open questions. The draft's text follows the recommended answers, so
a different answer changes the text with it.

## Every open question

| # | Question | Recommended |
| --- | --- | --- |
| [S1](scope.md#open-questions) | (B5) Using CompUGrade without an account | No: everything but sign-in needs one, as today |
| [S2](scope.md#open-questions) | Who can register themselves | Students, professors (pending until approved) and parents; administrators only by another administrator or the seeder |
| [S3](scope.md#open-questions) | One school or many | One per deployment for now |
| [S4](scope.md#open-questions) | How the phases change | Phase 1 includes the back end; the three workspaces are specified now and built after the switch-over |
| [S5](scope.md#open-questions) | Do other roles see self-reported scores, custom tasks, targets, the sandbox | No: official data only |
| [P1](roles-professor.md#open-questions) | (`SPEC.md` §10 q.1) What linking a student-made subject overwrites | The rule and task list become the professor's; the student's tasks stay as custom tasks; targets carry over; the student confirms first |
| [P2](roles-professor.md#open-questions) | How students join a professor's class | A join code, plus add by email |
| [P3](roles-professor.md#open-questions) | Changing a rule that has scores | Allowed, with the existing impact warning |
| [P4](roles-professor.md#open-questions) | Deleting a task that has official scores | Allowed, after a confirmation with the count |
| [P5](roles-professor.md#open-questions) | A history of official score changes | Not in this version |
| [P6](roles-professor.md#open-questions) | What a professor sees about each student | Official scores and grades only |
| [A1](roles-admin.md#open-questions) | What verifying a subject means | Approve, link (the student confirms) or reject with a note |
| [A2](roles-admin.md#open-questions) | Does the administrator see grades | No, not in this version |
| [A3](roles-admin.md#open-questions) | A forgotten password | A temporary password from an administrator until email reset exists |
| [A4](roles-admin.md#open-questions) | Can an administrator delete an account | No: deactivate |
| [A5](roles-admin.md#open-questions) | Recording administrators' actions | In Laravel's log; no table yet |
| [R1](roles-parent.md#open-questions) | How a parent is linked | A one-time code the student makes, valid 48 hours |
| [R2](roles-parent.md#open-questions) | What a parent sees | Official data only |
| [R3](roles-parent.md#open-questions) | A student-made subject in the parent's view | Listed, with "No official scores yet" |
| [R4](roles-parent.md#open-questions) | The parent's status | From the official final grade |
| [D1](data-model.md#open-questions) | What classes are called in the code | `SchoolClass`, table `school_classes` (`class` is reserved in PHP) |
| [D2](data-model.md#open-questions) | Criteria tree: JSON column or table | JSON column |
| [D3](data-model.md#open-questions) | Where profile photos are kept | In the database, resized to 256 px, at most 300 KB (also T-26's limit) |
| [D4](data-model.md#open-questions) | Dates | Stored in UTC, sent as ISO 8601, shown in Manila time |
| [D5](data-model.md#open-questions) | Today's ids (`U1`, `CR-1`, `CUSTOM-<ms>`) | Numeric ids; the app treats them as opaque |
| [D6](data-model.md#open-questions) | Official and self-reported scores in one row | Yes, written by different endpoints |
| [D7](data-model.md#open-questions) | A subject's default rule | Dropped; the rule belongs to the class |
| [D8](data-model.md#open-questions) | The seed's `REQ-1`, which contradicts Add subject | Point it to a second, student-made seed subject |
| [API1](api.md#open-questions) | A sleeping host waking up | `GET /up` early, "Starting the server…" after 5 s, 90 s timeout, one automatic retry of reads |
| [API2](api.md#open-questions) | JSON key case | camelCase |
| [API3](api.md#open-questions) | The shape of an enrolment | The student-record shape `frontend/src/lib/` reads today |
| [API4](api.md#open-questions) | The error format | Laravel's own (`message`, `errors`), plus `current` on a 409 |
| [API5](api.md#open-questions) | Sign-in by user ID | Email only |
| [API6](api.md#open-questions) | Saying whether an account exists | No: one message for an unknown email and a wrong password |
| [API7](api.md#open-questions) | Settings' simulated two-factor and verification code | Not offered; two-factor marked `[PLANNED]` |
| [API8](api.md#open-questions) | Settings' Download and Clear (T-10) | Download my data (JSON) and Delete my account |
| [API9](api.md#open-questions) | Which saves check for a newer change (409) | Rules, class settings, class tasks and official scores |

## Wording that changes

Some answers change what the app says, so they go through the protocol with their draft:

- F1: the sign-in error (API6), the register role message (Student, Professor or Parent), sign-in by
  email only (API5)
- F14: two-factor `[PLANNED]` (API7); Download my data and Delete my account (API8)
- F10: "At least one grade computation rule must exist" no longer applies (template rules)
- new messages in the role drafts and in `api.md` §4 and §5

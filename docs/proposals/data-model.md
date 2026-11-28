# Draft: `spec/data-model.md` §5 with the database

**A draft, not the spec** (T-JM-16, 2026-11-28). It shows how `spec/data-model.md` §5 would read once
the database is approved, with every role's tables. T-JM-1 writes it into the spec through the
protocol in `AGENTS.md` §2, and T-JM-3 builds it: migrations only (`php artisan make:model <Name>
-m`), never in MySQL Workbench, and no raw SQL (`docs/LARAVEL_PLAN.md` §8).

The roles come from [`roles-professor.md`](roles-professor.md), [`roles-admin.md`](roles-admin.md)
and [`roles-parent.md`](roles-parent.md); the endpoints that read and write these tables are in
[`api.md`](api.md).

## Open questions

The text below follows the recommended answers.

**D1. What are classes called in the code?**
Recommended: **the model `SchoolClass`, the table `school_classes`.**
Reason: `class` is a reserved word in PHP, so a model can't be named `Class`. `SchoolClass` keeps
the spec's word "class" recognisable, where a new word (section, offering) would mean renaming it
everywhere in the spec.

**D2. Is a rule's criteria tree a JSON column or a table of criteria?**
Recommended: **a JSON column**, as today's `criteria`.
Reason: `frontend/src/lib/rules.js` reads and writes the whole tree at once, and a rule is always
saved whole. The criterion ids inside it stay strings (`AT`, `classwork`), because tasks point to
them. A table would need a join for every rule and a rewrite of the tree code.

**D3. Where are profile photos kept?**
Recommended: **in the database**, in the `profiles.photo` column, as a data URL like today's
`profilePicture`. The React app shrinks the photo to 256 by 256 pixels (JPEG) before sending it,
and the API refuses anything over 300 KB.
Reason: a free host's disk (Render) is wiped on every redeploy, so files saved there are lost. A
file-storage service is another account and another secret. A 256-pixel photo is around 20–60 KB,
which the database holds easily. It also settles T-26's size limit: resize first, then the 300 KB
cap.

**D4. How are dates stored and shown?**
Recommended: **stored in UTC** (Laravel's default `timezone`), **sent as ISO 8601** with the
offset (for example `2026-11-28T04:00:00.000000Z`, Laravel's default), and **shown in Manila time**
(UTC+8) by the React app. The current semester is worked out on the server, in Manila time.
Reason: UTC storage never shifts when a server or a TiDB region changes, ISO 8601 is what
JavaScript's `Date` reads, and every user is in the Philippines.

**D5. What happens to today's ids (`U1`, `CR-1`, `C101`, `AT-1`, `CUSTOM-<ms>`)?**
Recommended: **every table's `id` is a number** (`BIGINT UNSIGNED`, auto-increment, the course's
rule). The React app treats ids as opaque values and compares them as they come. The one place
that reads meaning from an id, the history's `CUSTOM-<ms>` fallback
(`frontend/src/lib/history.js`), is no longer needed because every task has `createdAt`.
Reason: the course's naming rules ask for it, and the fresh start (`docs/LARAVEL_PLAN.md` §1.5)
means no old ids have to keep working.

**D6. Do the official and the self-reported score share a row?**
Recommended: **yes, one `scores` row per task and student**, with both fields. Different endpoints
write each half: the professor's writes only the official fields, the student's only the
self-reported ones (`spec/api.md`).
Reason: the 3-state engine (F6) reads both from one task, and one row keeps "a task's score for
this student" a single lookup. The endpoint split keeps each role to its own field.

**D7. Does a subject keep a default rule (`defaultComputationRuleId`)?**
Recommended: **no.** The rule belongs to the class. `frontend/src/lib/rules.js` stops counting
subjects in a rule's usage, and deleting a rule stops moving subjects to its replacement.
Reason: subjects become a shared catalogue, and a default rule on it would be one user's rule
chosen for everyone. Add subject already starts the rule picker on the student's most recent
class's rule, not on the subject's.

**D8. What does the seeder do about `REQ-1`?**
Recommended: **give student `U1` a second, student-made subject**, "GE101 Purposive
Communication" with "Prof. John Doe", section `BSIT-2B`, and point `REQ-1` to it.
Reason: today `REQ-1` points to `IT101`, which `U1` already has through the professor's class
`C101`. Add subject would refuse that pair (F4), so the seed data contradicts the rules. A second
subject keeps a pending request to try the administrator's workspace on.

---

## 5. Data model

**Storage**

- One MySQL database: MySQL 8 on Laragon locally (`webdev2`), TiDB Cloud (MySQL-compatible) when
  hosted. Only the Laravel API (`backend/`) reads and writes it, through Eloquent.
- Tables are created only by migrations in `backend/database/migrations/`.
- Naming (the course's rules): plural lowercase table names; an `id` that is `BIGINT UNSIGNED`
  auto-increment; `created_at` and `updated_at` (`timestamps()`) on every table; a foreign key is
  named `<parent>_id`, or says its role (`professor_id`, `created_by`).
- Times are stored in UTC (open question D4).

### Tables

**`users`** (Laravel's, with three columns added)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `name` | string(100) | |
| `email` | string, unique | Stored in lowercase |
| `email_verified_at` | timestamp, null | Laravel's; unused until email is set up |
| `password` | string | A bcrypt hash (Laravel's `hashed` cast). Never plain text |
| `role` | enum: `student`, `professor`, `admin`, `parent` | |
| `status` | enum: `active`, `pending`, `deactivated` | New professors start `pending` (`SPEC.md` §6) |
| `must_change_password` | boolean, default false | Set by a temporary password (`spec/roles/admin.md` §4) |
| `remember_token` | string, null | Laravel's |
| timestamps | | |

**`profiles`** (one per user: what Settings shows, F14)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `user_id` | foreign key to `users`, unique, cascade on delete | |
| `username` | string(30), null, unique | |
| `phone` | string(30), null | |
| `student_number` | string(30), null | Students only |
| `program` | string(100), null | Students only |
| `year_level` | string(30), null | Students only |
| `program_section` | string(30), null | Students only. A new student gets `New Student`, as today |
| `bio` | string(500), null | |
| `photo` | mediumText, null | A data URL, at most 300 KB (open question D3) |
| `email_notifications` | boolean | The three Settings toggles (F14), with today's defaults |
| `system_notifications` | boolean | |
| `grade_notifications` | boolean | |
| timestamps | | |

**`computation_rules`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `user_id` | foreign key to `users`, null, cascade on delete | The owner. Null for a template rule, which everyone can read and duplicate |
| `rule_name` | string(100) | Unique among the rules the owner can see (their own and the templates), ignoring case: today's check, over all rules, now covers the owner's. At most 100 characters, a new limit (the editor has none today) |
| `tags` | json | `["Graduate"]`, `["Undergraduate"]` or both |
| `schools` | json | A list of school names |
| `criteria` | json | The tree `{id, name, weight, children}` (open question D2) |
| `effective_multipliers` | json | `{leafId: fraction}`, checked by the API to match the tree's leaves and add up to 1 |
| `copied_from_rule_id` | foreign key to `computation_rules`, null, set null on delete | Set by Duplicate. Replaces `isCopy` |
| timestamps | | |

**`subjects`** (the shared catalogue of codes and names)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `subject_code` | string(20) | |
| `subject_name` | string(100) | |
| `created_by` | foreign key to `users`, null, set null on delete | Who added it first |
| timestamps | | |

Unique on (`subject_code`, `subject_name`), ignoring case: a matching pair is reused (F4). There
is no default rule (open question D7).

**`school_classes`** (one section of a subject in one semester; open question D1)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `subject_id` | foreign key to `subjects`, restrict on delete | |
| `professor_id` | foreign key to `users`, null, restrict on delete | Set for a professor's class; null for a student-made one |
| `professor_name` | string(100), null | The name a student typed for a student-made class |
| `created_by` | foreign key to `users`, cascade on delete | The professor, or the student who added it |
| `program_section` | string(30) | |
| `semester` | enum: `first`, `second`, `summer` | |
| `academic_year` | string(9) | For example `2026-2027` |
| `units` | unsignedTinyInteger, default 3 | 1 to 10 |
| `computation_rule_id` | foreign key to `computation_rules`, restrict on delete | A rule in use can't be deleted without a replacement (F10) |
| `status` | enum: `verified`, `pending`, `rejected` | A professor's class is `verified`; a student-made one starts `pending` |
| `join_code` | string(8), null, unique | Professor's classes only. Null when turned off |
| timestamps | | |

**`enrolments`** (one student in one class: today's `studentRecords[]` entry)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `school_class_id` | foreign key to `school_classes`, cascade on delete | |
| `student_id` | foreign key to `users`, cascade on delete | |
| `desired_final_grade` | decimal(5,2), null | The record-level target (`targetGradeSandbox.desiredFinalGrade`) |
| timestamps | | |

Unique on (`school_class_id`, `student_id`).

**`term_plans`** (a student's targets and sandbox settings for one term:
`targetGradeSandbox.terms[term]`)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `enrolment_id` | foreign key to `enrolments`, cascade on delete | |
| `term` | enum: `prelim`, `midterm`, `finals` | |
| `desired_final_grade` | decimal(5,2), null | Subject Detail's term target |
| `sandbox_desired_final_grade` | decimal(5,2), null | The sandbox's target |
| `criteria` | json, null | `{leafId: {upcoming, expected}}` |
| `draft_scores` | json, null | `{taskId: "typed text"}`, the sandbox's draft scores (§4 note) |
| timestamps | | |

Unique on (`enrolment_id`, `term`). The legacy sandbox keys (`upcomingAT`, `upcomingTLA`,
`expectedExamScore`) aren't kept: the data starts fresh.

**`tasks`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `school_class_id` | foreign key to `school_classes`, cascade on delete | |
| `enrolment_id` | foreign key to `enrolments`, null, cascade on delete | Set for a custom task: it belongs to that student only. Replaces `isCustomTask` |
| `term` | enum: `prelim`, `midterm`, `finals` | |
| `criterion_key` | string(60) | The id of a leaf criterion in the class's rule. Replaces `type` |
| `sequence_number` | unsignedSmallInteger, null | Null for custom tasks |
| `title` | string(100) | |
| `description` | string(255), null | |
| `max_score` | unsignedInteger | Above 0 |
| `created_by` | foreign key to `users`, cascade on delete | |
| timestamps | | `created_at` is today's `createdAt` |

A class's tasks (no `enrolment_id`) are the professor's, and every enrolled student has them. In a
student-made class, the student's tasks are custom tasks.

**`scores`** (one task's scores for one student; open question D6)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `task_id` | foreign key to `tasks`, cascade on delete | |
| `enrolment_id` | foreign key to `enrolments`, cascade on delete | |
| `official_score` | unsignedInteger, null | Written only by the class's professor |
| `official_scored_at` | timestamp, null | Set when first entered, kept on change, cleared with the score |
| `official_scored_by` | foreign key to `users`, null, set null on delete | |
| `student_reported_score` | unsignedInteger, null | Written only by the student |
| `student_scored_at` | timestamp, null | The same rule as today's `studentScoredAt` |
| timestamps | | |

Unique on (`task_id`, `enrolment_id`). A missing row means no score of either kind. Scores are
whole numbers from 0 to the task's `max_score` (`spec/grading-rules.md` §4).

**`verification_requests`** (a student-made class waiting for an administrator; F3)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `school_class_id` | foreign key to `school_classes`, cascade on delete | The student's class. Removing the subject removes the request |
| `requested_by` | foreign key to `users`, cascade on delete | |
| `requested_professor_name` | string(100), null | |
| `status` | enum: `pending`, `link_proposed`, `approved`, `linked`, `rejected` | `spec/roles/admin.md` §5 |
| `proposed_class_id` | foreign key to `school_classes`, null, set null on delete | The professor's class an administrator proposed |
| `note` | string(200), null | The administrator's note, shown to the student |
| `decided_by` | foreign key to `users`, null, set null on delete | |
| `decided_at` | timestamp, null | |
| timestamps | | |

The subject code, name, section and rule that today's `verificationQueue` copies are read through
the class.

**`parent_links`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `parent_id` | foreign key to `users`, cascade on delete | |
| `student_id` | foreign key to `users`, cascade on delete | |
| timestamps | | |

Unique on (`parent_id`, `student_id`).

**`parent_link_codes`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `student_id` | foreign key to `users`, unique, cascade on delete | One code per student; a new one replaces it |
| `code_hash` | string(64), unique | The SHA-256 of the code. The code itself is shown once and never stored |
| `expires_at` | timestamp | 48 hours after it's made |
| timestamps | | |

**Laravel's own tables**, kept as generated: `password_reset_tokens` (unused until password reset
by email), `sessions` (the signed-in sessions Settings lists), `cache`, `cache_locks`, `jobs`,
`job_batches`, `failed_jobs`, `migrations`, and Sanctum's `personal_access_tokens` (unused: the app
signs in with cookies, not tokens).

### Relationships

- A user has one profile. A user's role decides which of the other relationships apply.
- A subject has many classes. A class has one subject, one rule, and at most one professor.
- A class has many enrolments, and an enrolment belongs to one student.
- A class has many tasks. A custom task also belongs to one enrolment.
- A score belongs to one task and one enrolment.
- An enrolment has up to three term plans, one per term.
- A rule belongs to one user, or to nobody (a template). Rules copied by Duplicate point to their
  source.
- A student-made class has at most one verification request.
- A parent and a student are linked through `parent_links`. A student has at most one link code.
- `scores` and `tasks` use the leaf criterion ids of the class's rule (`criterion_key`), as
  `grades[term][leafId]` does today.

### From today's data to the tables

| Today (`compugrade_db`, `compugrade-account`) | Becomes |
| --- | --- |
| `users[]` | `users` (hashed `password`, `role`, `status`), and `profiles.program_section` |
| `computationRules[]` | `computation_rules`; `isCopy` and `copiedFromRuleId` become `copied_from_rule_id`; legacy `hierarchy` is dropped |
| `subjects[]` | `subjects`, without `defaultComputationRuleId` (D7) |
| `classes[]` | `school_classes` |
| `studentRecords[]` | `enrolments` and `term_plans` |
| Task (in `grades[term][leafId]`) | `tasks` and `scores` |
| `verificationQueue[]` | `verification_requests` |
| `compugrade-account` (Settings) | `profiles`, `users.password`, and Laravel's `sessions`. The simulated two-factor settings aren't stored (`spec/api.md`) |
| `activeUserId` | The Sanctum session cookie |

### Seed data

`php artisan migrate:fresh --seed` fills the database from `frontend/src/services/db.json`, with
new numeric ids and hashed passwords:

- student `Ysa Ang` (`ysa@student.edu`), professor `Prof. Maria Santos` (`maria@faculty.edu`,
  `active`) and administrator `System Admin` (`admin@compugrade.edu`), with today's demo
  passwords. `admin` is too short for the password rules (F1), so the seeded administrator gets
  `password123` like the others
- the rule `Standard IT Rule (70/30)` as a template (no owner), and a copy owned by the professor
- the subject `IT101 Computer Systems Servicing`
- the class `C101` as the professor's class (section `BSIT-2A`, `verified`, with a join code),
  using the professor's copy of the rule, with Ysa enrolled and today's tasks and official scores
- the request `REQ-1`, pointing to a second, student-made subject of Ysa's (open question D8)
- a parent account (`parent@compugrade.edu`, `password123`) linked to Ysa, to try the portal

### What stays in the browser

Only display choices for one browser, in `localStorage`:

- `compugrade-sidebar-minimized` (`"1"` or `"0"`)
- `compugrade_rule_thumbnail`

`compugrade_db`, `activeUserId`, `compugrade-account` and the legacy keys are no longer written.
The task that removes the `localStorage` storage (T-JM-6, its last area) also deletes them when it
finds them.

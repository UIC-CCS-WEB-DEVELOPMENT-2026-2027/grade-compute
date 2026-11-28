# Draft: `spec/api.md`

**A draft, not the spec** (T-JM-16, 2026-11-28). It shows how a new spec file, `spec/api.md`, would
read once approved. T-JM-1 writes it into the spec through the protocol in `AGENTS.md` §2, with a
row in `SPEC.md`'s "Where things are". T-JM-4 (accounts) and T-JM-5 (student endpoints) build it,
and the role workspaces (T-JM-9 to T-JM-11) add theirs.

The tables are in [`data-model.md`](data-model.md); who may do what is in [`scope.md`](scope.md)
(`SPEC.md` §6) and the role drafts. The error cases follow `docs/LARAVEL_PLAN.md` §7.

## Open questions

The text below follows the recommended answers.

**API1. What does a student see while a sleeping host wakes up?**
Recommended: **a "Starting the server…" message, a longer wait, and one automatic retry.**
- The app sends `GET /up` as soon as the sign-in page opens, to wake the API early.
- Requests wait up to 90 seconds instead of the usual 20.
- If nothing has come back after 5 seconds, the screen shows "Starting the server… This can take
  up to a minute." in its status area.
- A read that times out, or gets 502, 503 or 504, is retried once automatically.
Reason: Render's free tier sleeps after about 15 minutes without traffic and takes up to a minute
to wake. Without this, the first request of the day looks like a failure.

**API2. What case do JSON keys use?**
Recommended: **camelCase** (`officialScore`, `maxScore`, `effectiveMultipliers`), in what the API
sends and what it accepts. The database columns stay snake_case.
Reason: `frontend/src/lib/` reads camelCase today. The API Resources write every key by hand
anyway, so the mapping costs nothing, and the grade maths doesn't change.

**API3. What shape does an enrolment come back in?**
Recommended: **the shape `frontend/src/lib/` already reads as a student record:** `grades.{term}.
{criterionKey}` holds the task list, each task carrying its `officialScore` and
`studentReportedScore`, and `targetGradeSandbox` holds the targets and term plans.
Reason: the grade engine, the sandbox and the history then work on API data without changes. Only
`frontend/src/services/` changes, which is the plan (`docs/LARAVEL_PLAN.md` §2).

**API4. What does an error look like?**
Recommended: **Laravel's own JSON error format:** `{ "message": "…" }`, plus `"errors": { field:
["…"] }` on a 422. A 409 adds `"current"`, the record as it is now.
Reason: Laravel already answers every exception this way when the request asks for JSON, so no
custom handler is needed (one less thing to defend). The React app maps the status to its wording
(§4).

**API5. Is sign-in by email only?**
Recommended: **yes.** Today's sign-in also takes a user ID (`U1`), which was a demo convenience.
Reason: user ids become numbers (D5), and a student number in the profile isn't checked by anyone,
so it can't identify an account safely.

**API6. Does a failed sign-in say whether the account exists?**
Recommended: **no: one message for both an unknown email and a wrong password:** "The email or
password is incorrect." Today's "Account not found. Check your email or Student ID." goes.
Reason: telling the two apart lets anyone find out which emails have accounts (OWASP A07:2025,
Authentication Failures). This changes F1's wording, so it goes through the protocol.

**API7. What happens to Settings' simulated security features?**
Recommended: **the API doesn't offer two-factor sign-in or the simulated verification code.**
F14 marks two-factor `[PLANNED]` until a real second factor (a code by email) exists. The password
change is real (the current password is checked on the server), and the sessions list shows real
sessions from Laravel's `sessions` table.
Reason: a security feature that only looks like one gives students false confidence. The real
version needs a mail service first.

**API8. What do Settings' "Download" and "Clear" (T-10) do?**
Recommended: **"Download my data" returns everything the account owns as a JSON file. "Delete my
account" replaces "Clear"**: for a student or parent, after they type their password, it deletes
the account and everything that belongs to it.
Reason: these are the two rights a data privacy review (T-JM-27) is most likely to ask for, and
"Clear" has no meaning once the data is on a server. Professors and administrators can't delete
their own accounts, because classes and other people's records depend on them.

**API9. Which saves check for someone else's newer change (409)?**
Recommended: **the ones two people, or two tabs, can make on the same record:** a rule, a class's
settings, a class's task, and official scores. The request sends the `updatedAt` it last saw; if
the record changed since, the API refuses with 409 and the current record. Self-reported scores,
targets and sandbox plans don't check: only their student writes them, and each save changes only
the fields it sends.
Reason: it's E9 across users (`docs/LARAVEL_PLAN.md` §7), and the check only matters where
overwriting someone else's work is possible.

---

# CompUGrade — API

The Laravel API in `backend/` is the only way the React app reads or writes data. Endpoints are
in `backend/routes/api.php`.

## 1. Basics

- **Address:** every endpoint is under `/api` on the app's own site. Locally, the Vite dev server
  forwards `/api` and `/sanctum` to `http://127.0.0.1:8000`; hosted, Vercel rewrites them to the API
  on Render. The browser only ever talks to one site, as Sanctum's cookies need.
- **Format:** JSON in and out, with camelCase keys (open question API2). Dates are ISO 8601 in UTC
  (`2026-11-28T04:00:00.000000Z`); the app shows them in Manila time (`spec/data-model.md` §5).
- **Signing in** uses Sanctum's SPA cookie authentication, not tokens:
  1. The app calls `GET /sanctum/csrf-cookie` once, which sets the `XSRF-TOKEN` cookie.
  2. It signs in with `POST /api/login`. Laravel keeps the session in a cookie.
  3. Axios sends the cookies (`withCredentials`) and copies `XSRF-TOKEN` into the `X-XSRF-TOKEN`
     header (`withXSRFToken`) on every request.
  - `bootstrap/app.php` calls `$middleware->statefulApi()`, and `SANCTUM_STATEFUL_DOMAINS` lists
    `localhost:5173` and the hosted domain.
  - A session lasts 120 minutes without activity (`SESSION_LIFETIME`), or until sign-out.
- **Responses:** one record is `{ "data": { … } }`; a list is `{ "data": [ … ] }`; a paginated list
  adds Laravel's `links` and `meta` (`page`, `perPage` up to 100, default 25). Create answers 201,
  and delete 204 with no body.
- **Ids** are numbers (`spec/data-model.md` §5, D5).

## 2. Who may call what

Every endpoint goes through these checks, in order:

1. **Signed in** (`auth:sanctum`), except the guest endpoints in §5.1. Otherwise 401.
2. **Account status:** a `pending` professor or an account that `mustChangePassword` can call only
   `GET /api/user`, `PUT /api/user/password` and `POST /api/logout`; anything else gets 403 with
   "Your professor account is waiting for an administrator's approval." or "Choose a new password
   to continue." A `deactivated` account can't sign in.
3. **Role:** each endpoint below names the roles that may call it. Another role gets 403.
4. **The record:** a Laravel policy checks that this user may use this record (`SPEC.md` §6).
   - A record the caller isn't allowed to see answers **404**, as if it didn't exist, so ids can't
     be used to find out what exists. Another student's enrolment is a 404.
   - A record the caller can see but not change answers **403**. A student changing their
     professor's rule gets a 403.

## 3. Rate limits

Too many requests answer 429 with a `Retry-After` header.

| Limit | Applies to |
| --- | --- |
| 5 a minute per email and IP address | `POST /api/login` |
| 5 a minute per IP address | `POST /api/register` |
| 5 a minute per user | `PUT /api/user/password`, `POST /api/parent-links`, `GET /api/classes/join/{code}` |
| 60 a minute per user | everything else (Laravel's `api` limiter) |

## 4. Errors

Every error uses Laravel's format (open question API4). What the user sees, by status (the wording
of `docs/LARAVEL_PLAN.md` §7, plus the API's own cases):

| Status | When | Body | What the user sees |
| --- | --- | --- | --- |
| no answer | Offline, or the API is down | — | "You're offline" or "CompUGrade can't be reached", with "Try again". What they typed stays in the form |
| no answer yet | The host is waking up (API1) | — | "Starting the server… This can take up to a minute." |
| 401, 419 | Not signed in, or the session or its CSRF token expired | `message` | The sign-in page, then back to the same page and query (`?term=`, `?task=`) |
| 403 | Not allowed (§2) | `message` | "You don't have access to this", or the status message in §2 |
| 404 | No such record, or not the caller's (§2) | `message` | "This doesn't exist any more", with a way back (T-JM-21's page) |
| 409 | Changed by someone else since it was loaded (API9) | `message`, `current` | "This was changed since you opened it", with the newer data |
| 422 | Invalid input | `message`, `errors` | Each field's message under the field |
| 429 | Too many attempts (§3) | `message` | "Too many attempts. Try again in a minute." |
| 500 | A fault in the API | `message` only | A short message with "Try again". The details go to Laravel's log, never to the screen (`APP_DEBUG=false`) |

**Field messages (422)** use the wording the browser's checks use today (`frontend/src/lib/scores.js`,
`rules.js`, `targets.js`, `frontend/src/features/auth/lib/accounts.js`), so a message reads the same
whether the browser or the server caught it. The browser keeps its own checks, so most mistakes
are caught before a request is sent.

## 5. Endpoints

"Accepts" lists the body fields (or query, for `GET`). Every write also gets the errors in §2 and
§4 that apply (401, 403, 404, 429, 500); the "Errors" column lists the specific ones.

### 5.1 Sign-in and account

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `GET /sanctum/csrf-cookie` | anyone | — | 204, sets `XSRF-TOKEN` | — |
| `GET /up` | anyone | — | 200 (Laravel's health check) | — |
| `POST /api/register` | guest | `name`, `email`, `password`, `passwordConfirmation`, `role` (`student`, `professor` or `parent`) | 201, the user, signed in | 422: F1's messages; the role message becomes "Choose Student, Professor or Parent." |
| `POST /api/login` | guest | `email`, `password`, `remember` | 200, the user | 422: "The email or password is incorrect." (API6); 403: "This account is deactivated. Contact your school's administrator." |
| `POST /api/logout` | signed in | — | 204 | — |
| `GET /api/user` | signed in, any status | — | the user: `id`, `name`, `email`, `role`, `status`, `mustChangePassword`, `hasPhoto` | — |
| `GET /api/semesters/current` | signed in | — | `semester`, `academicYear`, worked out in Manila time | — |

### 5.2 Settings (F14)

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `GET /api/profile` | signed in | — | the profile (`spec/data-model.md` §5) and the notification toggles | — |
| `PATCH /api/profile` | signed in | any of `name`, `username`, `phone`, `studentNumber`, `program`, `yearLevel`, `programSection`, `bio`, `emailNotifications`, `systemNotifications`, `gradeNotifications` | the profile | 422: lengths (§5 tables); `username` taken: "This username is taken." |
| `PUT /api/profile/photo` | signed in | `photo`: a data URL (JPEG, PNG or WebP), at most 300 KB | the profile | 422: "That image couldn't be read. Try another file." or "This photo is too large." |
| `GET /api/profile/photo` | signed in | — | the photo | 404 if there is none |
| `DELETE /api/profile/photo` | signed in | — | 204 | — |
| `PUT /api/user/password` | signed in, any status | `currentPassword`, `password`, `passwordConfirmation` | 204. Every other session is signed out, and `mustChangePassword` is cleared | 422: "The current password is incorrect."; F1's password rules |
| `GET /api/sessions` | signed in | — | the user's sessions: browser and device (from the user agent), last active, whether it's this one | — |
| `DELETE /api/sessions/{id}` | signed in | — | 204, that session signed out | 404 |
| `DELETE /api/sessions` | signed in | — | 204, every other session signed out | — |
| `GET /api/user/export` | signed in | — | a JSON file of everything the account owns (API8) | — |
| `DELETE /api/user` | student, parent | `password` | 204, the account and everything it owns deleted | 422: "The current password is incorrect." |

### 5.3 Subjects and enrolments (student)

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `GET /api/enrolments` | student | `semester`, `academicYear` (default: the current ones) | the student's enrolments, each as a full record (API3) with its class (subject code and name, professor, section, semester, units, status), rule and verification request | — |
| `GET /api/enrolments/{id}` | its student | — | one record | 404 |
| `POST /api/enrolments` | student | `subjectCode`, `subjectName`, `professorName`, `programSection`, `computationRuleId` | 201. A student-made class in the current semester (`pending`, 3 units, target 90), its enrolment and a verification request (F4) | 422: "You already have a subject with that code."; a rule the student can't use |
| `GET /api/classes/join/{code}` | student | — | the professor's class: subject, professor, section, semester, rule name; and `linksEnrolmentId` if the student has a student-made subject with the same code, with what the link changes (`spec/roles/professor.md` §6) | 404: "This code isn't valid. Ask your professor for a new one."; 409: "You're already in this class." |
| `POST /api/enrolments/join` | student | `joinCode`, and `linkEnrolmentId` to confirm a link | 201, the new record | 404, 409 as above; 422: "Confirm the link to join this class." when a same-code subject exists and `linkEnrolmentId` is missing |
| `POST /api/verification-requests/{id}/accept-link` | its student | — | 200, the linked record | 404; 409 if the request isn't `link_proposed` |
| `POST /api/verification-requests/{id}/decline-link` | its student | — | 200, the request back to `pending` | 404; 409 as above |
| `DELETE /api/enrolments/{id}` | its student | — | 204 (F5). A student-made class with no other student goes too, with its request | 404 |

Joining with a link and accepting a proposed link run in one database transaction: either the
whole link happens, or nothing changes.

### 5.4 Tasks, scores, targets and the sandbox (student)

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `POST /api/enrolments/{id}/tasks` | its student | `term`, `criterionKey`, `title`, `maxScore` | 201, the custom task | 422: "Please enter a whole-number maximum score greater than zero."; a `criterionKey` that isn't a leaf of the class's rule |
| `PUT /api/enrolments/{id}/scores/{taskId}` | its student | `studentReportedScore`: digits as text, or null to clear | the score, with `studentScoredAt` set as `withStudentScore` does today | 422: the score-entry messages (`spec/grading-rules.md` §4); "This task has an official score." |
| `PATCH /api/enrolments/{id}` | its student | `desiredFinalGrade` | the record | 422: "Enter a target from 0 to 100." |
| `PATCH /api/enrolments/{id}/terms/{term}` | its student | any of `desiredFinalGrade`, `sandboxDesiredFinalGrade`, `criteria` (`{leafId: {upcoming, expected}}`), `draftScores` (`{taskId: text}`) | the term plan. Only the fields sent change | 422: targets 0–100; `upcoming` a whole number 0–20; `expected` 0–100 or null; draft scores only for this enrolment's tasks |

### 5.5 Rules (F10)

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `GET /api/rules` | student, professor | — | the rules the user can use: their own, the templates, and (for a student) their classes' rules. Each has `isTemplate`, `canEdit` and its usage (the user's classes that use it) | — |
| `GET /api/rules/{id}` | who can see it | — | the rule | 404 |
| `POST /api/rules` | student, professor | `ruleName`, `tags`, `schools`, `criteria`, `effectiveMultipliers` | 201, the rule, owned by the caller | 422: the rule editor's messages (`spec/grading-rules.md` §4, rule maths); multipliers that don't match the tree's leaves or don't add up to 1 |
| `PUT /api/rules/{id}` | its owner | the same, and `updatedAt` | the rule | 403 for a rule the caller can read but doesn't own; 409; 422 |
| `POST /api/rules/{id}/duplicate` | who can see it | — | 201, the copy, owned by the caller and named as `getCopyName` does | 404 |
| `DELETE /api/rules/{id}` | its owner | `replacementRuleId` when the rule is in use | 204. Classes using it move to the replacement | 403; 422: "Choose the rule these subjects will use next." or "Choose a different rule that still exists." |

"At least one grade computation rule must exist" no longer applies: the template rules always do.

### 5.6 Classes, tasks and official scores (professor)

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `GET /api/classes` | professor | `semester`, `academicYear` | the professor's classes, with student counts | — |
| `POST /api/classes` | professor | `subjectCode`, `subjectName`, `programSection`, `semester`, `academicYear`, `units`, `computationRuleId` | 201, the class with its join code | 422: a rule that isn't the professor's; `units` 1–10 |
| `GET /api/classes/{id}` | its professor | — | the class, its rule and its tasks | 404 |
| `PATCH /api/classes/{id}` | its professor | any of the fields above, and `updatedAt` | the class | 409; 422 |
| `DELETE /api/classes/{id}` | its professor | — | 204 | 422: "Remove the students first, then delete the class." |
| `POST /api/classes/{id}/join-code` | its professor | — | a new join code; the old one stops working | — |
| `DELETE /api/classes/{id}/join-code` | its professor | — | 204, joining turned off | — |
| `GET /api/classes/{id}/students` | its professor | — | the roster: each student's name, email and section, and their official scores (API3 shape, official fields only) | — |
| `POST /api/classes/{id}/students` | its professor | `email` | 201, the enrolment | 404: "No student account uses this email."; 409: "This student is already in this class." or "This student added this subject themselves. Ask them to join with the class code, so they can link it." |
| `DELETE /api/classes/{id}/students/{studentId}` | its professor | — | 204, the enrolment and its data removed | 404 |
| `POST /api/classes/{id}/tasks` | its professor | `term`, `criterionKey`, `title`, `description`, `maxScore` | 201, the task, numbered next in its criterion | 422 |
| `PATCH /api/tasks/{id}` | its class's professor | any of `title`, `description`, `maxScore`, and `updatedAt` | the task | 409; 422: "Some scores are higher than this maximum." |
| `DELETE /api/tasks/{id}` | its class's professor | — | 204, with its scores | 404 |
| `PUT /api/classes/{id}/official-scores` | its professor | `entries`: up to 500 of `{taskId, enrolmentId, officialScore, updatedAt}`, where `officialScore` is digits as text or null | 200, the saved scores. All entries are saved in one transaction, or none | 409 with each changed entry's current score; 422 with `errors["entries.3.officialScore"]` |

### 5.7 Parent links and the parent portal

| Method and path | Who | Accepts | Returns | Errors |
| --- | --- | --- | --- | --- |
| `POST /api/parent-link-codes` | student | — | 201, `code` and `expiresAt`. The code is shown once and replaces any earlier one | — |
| `GET /api/parent-links` | student, parent | — | the user's links: for a student, the parents' names and emails; for a parent, the students' names and sections | — |
| `POST /api/parent-links` | parent | `code` | 201, the link | 422: "This code isn't valid. Ask the student for a new one."; 409: "You're already linked to this student." |
| `DELETE /api/parent-links/{id}` | the link's student or parent | — | 204 | 404 |
| `GET /api/parent/students/{studentId}/enrolments` | a linked parent | `semester`, `academicYear` | the student's enrolments, official data only: no custom tasks, self-reported scores, targets or term plans (`spec/roles/parent.md`) | 404 if not linked |

### 5.8 Administrator

Every endpoint here is for the `admin` role only. Lists are paginated (§1).

| Method and path | Accepts | Returns | Errors |
| --- | --- | --- | --- |
| `GET /api/admin/summary` | — | waiting professors, waiting requests, accounts by role | — |
| `GET /api/admin/users` | `role`, `status`, `search`, `page` | accounts: name, email, role, status, registered; a student's section | — |
| `GET /api/admin/users/{id}` | — | one account, with its parent links | 404 |
| `POST /api/admin/users` | `name`, `email`, `temporaryPassword` | 201, a new administrator who must change the password | 422 |
| `PATCH /api/admin/users/{id}` | `status` (`active` or `deactivated`) | the account. Deactivating signs out its sessions | 422: "You can't deactivate your own account." or "At least one administrator must stay active." |
| `POST /api/admin/users/{id}/approve` | — | the professor, now `active` | 409 if not a pending professor |
| `POST /api/admin/users/{id}/reject` | — | the professor, now `deactivated` | 409 as above |
| `PUT /api/admin/users/{id}/temporary-password` | `password` | 204. The account must change it, and its sessions are signed out | 422: F1's password rules |
| `GET /api/admin/verification-requests` | `status`, `page` | requests, waiting ones first | — |
| `POST /api/admin/verification-requests/{id}/approve` | — | the request; the class becomes `verified` | 409 if it's already decided |
| `POST /api/admin/verification-requests/{id}/propose-link` | `classId` (a professor's class) | the request, now `link_proposed` | 409; 422 if the class isn't a professor's |
| `POST /api/admin/verification-requests/{id}/reject` | `note` (up to 200 characters) | the request; the class becomes `rejected` (still usable) | 409 |
| `GET /api/admin/classes` | `search`, `page` | professors' classes, to pick for a link | — |
| `GET /api/admin/subjects` | `search`, `page` | the subject catalogue | — |
| `PATCH /api/admin/subjects/{id}` | `subjectCode`, `subjectName` | the subject | 422: "A subject with this code and name already exists." |
| `DELETE /api/admin/parent-links/{id}` | — | 204 | 404 |

Each administrator action is written to Laravel's log: who, what, which record, when
(`spec/roles/admin.md`, open question A5).

## 6. How the React app calls the API

All of this lives in `frontend/src/services/`; no component calls Axios itself.

- **One Axios instance** (`frontend/src/services/api.js`): `baseURL: "/api"`, `withCredentials:
  true`, `withXSRFToken: true`, `timeout` 20 seconds (90 seconds while the host is waking up, API1).
  It calls `GET /sanctum/csrf-cookie` before the first write.
- **A request is cancelled when its screen closes.** Each screen's reads pass an `AbortController`
  signal (Axios `signal`) and abort it when the component unmounts or its inputs change, so a slow
  answer never lands on a screen that has moved on. A cancelled request shows nothing.
- **A form can't be submitted twice.** While a write is on its way, its button is disabled and
  shows that it's working, and pressing Enter again does nothing. The button comes back when the
  answer arrives, whatever it is.
- **Network errors can be retried.**
  - Reads (`GET`) are retried automatically, once, after a network error or a 502, 503 or 504.
  - Writes are never retried automatically, because a write that reached the server and lost its
    answer could be made twice. The screen keeps what the user typed and offers "Try again".
- **Expired session (401, 419):** the app goes to the sign-in page with the current path and query
  (`?term=`, `?task=`), and returns there after signing in.
- **Loading** follows T-JM-6's convention: shadcn's `Skeleton` where the layout's shape is known
  (tables, cards, charts), and a pending button or spinner for actions.
- **Messages** come from one helper (T-28's, extended to the statuses in §4), so every screen words
  the same error the same way.
- **Grades** are still computed in the browser with `frontend/src/lib/`, from the records the API
  returns (API3).

**Which endpoints each student screen uses:**

| Screen | Reads | Writes |
| --- | --- | --- |
| Sign-in (F1) | `/up` | `register`, `login` |
| Student Hub, My Subjects (F2, F3) | `enrolments`, `semesters/current` | `enrolments` (Add subject, join), `verification-requests/{id}/accept-link` or `decline-link` |
| Sidebar (F5, F13) | `enrolments` | `DELETE enrolments/{id}` |
| Subject Detail, Current Term Records (F7, F8) | `enrolments/{id}` | `scores/{taskId}`, `tasks`, `PATCH enrolments/{id}/terms/{term}` |
| Sandbox (F9) | `enrolments/{id}` | `PATCH enrolments/{id}/terms/{term}` |
| Rules (F10) | `rules`, `rules/{id}` | `POST`, `PUT`, `DELETE rules`, `rules/{id}/duplicate` |
| Settings (F14) | `profile`, `sessions` | `profile`, `profile/photo`, `user/password`, `sessions`, `parent-link-codes`, `parent-links`, `user/export`, `DELETE user` |

## 7. Laravel practices the API follows

Each one is something to explain in the Code Defense (`docs/defense/`).

- **Form Requests** validate every write (`php artisan make:request`), with the rules and messages
  in one class per endpoint. A controller only sees input that passed.
- **API Resources** shape every response (`php artisan make:resource`): the camelCase keys
  (API2), the record shape (API3), and nothing the caller may not see (a professor's roster has no
  self-reported scores).
- **Policies** decide who may use each record (`php artisan make:policy`), as in §2, and the tests
  try every role against every kind of record (T-JM-4; OWASP A01:2025, Broken Access Control).
- **Rate limiting:** named limiters in `AppServiceProvider` (`RateLimiter::for`) and the `throttle`
  middleware, as in §3.
- **Pagination:** `paginate()` with API Resources for the administrator's lists; other lists are
  bounded by one user's own data.
- **Eager loading against N+1 queries:** queries load what the resource needs with `with()` (an
  enrolment with its class, subject, rule, tasks and scores). `Model::preventLazyLoading()` is on
  outside production, so a forgotten `with()` fails the tests instead of slowing the hosted app.
- **Transactions** (`DB::transaction`) for writes that change several rows: joining with a link,
  official scores, deleting a rule with a replacement, deleting an account.
- **Mass assignment:** each model lists its `$fillable` columns, so a request can't set `role`,
  `status` or `official_score` by adding a field.
- **No raw SQL:** queries go through Eloquent and the query builder (`docs/LARAVEL_PLAN.md` §8).
- **Secrets and errors:** keys live in `.env`, never in the repository; hosted, `APP_DEBUG=false`,
  so a 500 shows no details (OWASP A02:2025, Security Misconfiguration).

References: Laravel 12 docs for
[Sanctum SPA authentication](https://laravel.com/docs/12.x/sanctum#spa-authentication),
[validation (Form Requests)](https://laravel.com/docs/12.x/validation#form-request-validation),
[API Resources](https://laravel.com/docs/12.x/eloquent-resources),
[authorization (policies)](https://laravel.com/docs/12.x/authorization#creating-policies),
[rate limiting](https://laravel.com/docs/12.x/routing#rate-limiting) and
[preventing lazy loading](https://laravel.com/docs/12.x/eloquent-relationships#preventing-lazy-loading).

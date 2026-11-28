# CompUGrade — Laravel Back-End Plan

A proposal (2026-11-24, revised 2026-11-28), not part of the spec. It plans a Laravel back end
for the React app, and how the professor, parent and administrator roles and the error-handling
fixes fit around it. The owner decisions in §1 are approved; everything else is a proposal. The
tasks it suggests are on `docs/BOARD.md` (T-JM-1 to T-JM-13; T-JM-2 and T-JM-7 are dropped).
Each feature still needs the owner's approval, and the spec comes first (§3).

The basis is the CC013.23 (Web Development 2) course documents: the Full-Stack Setup Guide, the
Week 1 slides and the TLA 1 worksheet. They are not in the repository. When they disagree, the
Setup Guide wins, then the slides, then the worksheet.

Paths in the React app start with `frontend/`, where the app moved in §5 step 1 (T-JM-14).

## 1. Owner decisions (2026-11-24 to 2026-11-28)

1. **The front end stays the React app**: React + Vite, react-router, shadcn/ui, the Tailwind tokens
   and the grade maths in `frontend/src/lib/`. Moving the screens to PHP (Blade and Livewire) was
   considered and dropped, because it means rewriting the React code and shadcn/ui is React-only.
2. **Laravel 12 becomes a separate REST API** in API-only mode (`php artisan install:api`,
   `routes/api.php`). It stores the data, handles sign-in, and decides who may read and write
   what. The React app calls it instead of `localStorage`. Inertia is ruled out (2026-11-28):
   the course's API exams and Pest API tests assume a JSON API. Laravel is pinned to 12
   (`composer create-project laravel/laravel:^12.0 backend`); without the pin, 13 is installed.
3. **One repository, `frontend/` and `backend/`.** The React app moves into `frontend/` in a
   moves-only commit, before any back-end work. Docs, the spec, `AGENTS.md`, `CLAUDE.md`,
   `.claude/` and `.github/` stay at the root.
4. **Grade maths stays in the browser** (`frontend/src/lib/`). The API stores rules and scores and
   validates input.
5. **A fresh start for data.** New Laravel seeders are written from `frontend/src/services/db.json`.
   Nothing is imported from students' browsers, so T-JM-7 is dropped. Each feature moves to the
   API in its own task; the `localStorage` storage is removed once the last one has moved.
6. **Sign-in is Sanctum's SPA cookie auth**, not API tokens. Axios sends `withCredentials` and
   `withXSRFToken`. The SPA and the API must share a site:
   - **Hosted:** Vercel rewrites send `/api/*` and `/sanctum/*` to the API on Render, then a
     catch-all serves the SPA. The browser URL never changes, so both look like one site.
     `x-vercel-enable-rewrite-caching: 0` is set on `/api/*`, so grade data is never cached.
   - **Locally:** the Vite dev server's `server.proxy` sends `/api` and `/sanctum` to
     `127.0.0.1:8000`.
7. **Approved packages and tools.** Front end: Axios, called only from `frontend/src/services/`.
   Back end: Laravel 12, Sanctum, Pest and Pint. `./vendor/bin/pint --test` must pass before every
   commit in `backend/`, as `npm run format:check` does in `frontend/`.
8. **The local environment is Laragon** (Full: PHP 8.2+, Composer 2.6+, MySQL 8), not Herd. The
   database is `webdev2`. MySQL Workbench is for looking only.
9. **Spec first, in full.** Each part is written into the spec through the protocol
   (`AGENTS.md` §2) before anyone writes its code. The professor, administrator and parent specs
   are written in full **before the database design**, so the first migrations already cover
   every role. The role workspaces are still built after the switch (§6).

## 2. What changes and what stays

| Part | Today | With the back end |
| --- | --- | --- |
| Folders | The React app at the repository root | The React app in `frontend/`, the API in `backend/` |
| Screens, routes, components | React, react-router, shadcn/ui | The same |
| Grade maths | `frontend/src/lib/`, in the browser | The same (§1.4) |
| Stored data | `localStorage` (`compugrade_db`, `compugrade-account`) | MySQL 8 (`webdev2` on Laragon locally, TiDB Cloud hosted), through the API |
| Data access | `frontend/src/services/` and `useDb`, read and written at once | `frontend/src/services/` calls the API with Axios. Calls take time and can fail, so screens get loading and error states |
| Sign-in | Checked in the browser; passwords in plain text (AUDIT B15) | Sanctum session cookies; hashed passwords |
| Who may write what | Anyone can change any stored value, including "locked" official scores | The server checks: only a class's professor writes official scores, and only a student writes their own self-reported scores |

**The biggest change in the React app** is that reading data stops being instant. Today every screen
reads the whole database at once (`getDb()`). With an API, each screen asks for what it needs,
waits, and handles a failure. The work is in `frontend/src/services/`, `frontend/src/hooks/useDb.js`
and each screen's loading and error states. The screens' layout and the grade maths stay as they
are.

**Why a back end at all:** with `localStorage`, each user's data stays in their own browser.
Scores a professor enters never reach a student, a parent can't see a child's grades, and an
administrator can't see anyone's. The roles need a shared database.

## 3. Spec first

The spec is drafted first, then written through the protocol:

1. **Drafts in `docs/proposals/`.** An agent writes them; they are not the spec. Each draft
   puts its open questions at the top, each with a recommended answer. The drafts are:
   - the scope: `SPEC.md` §2 (the back end is in scope) and §6 (roles and access as the
     server enforces them)
   - the professor, administrator and parent role specs, **in full**
   - the database tables for `spec/data-model.md` §5, covering every role
   - `spec/api.md`: every endpoint, who may call it, what it accepts, and its error cases (§7)
2. **The owner's review.** The owner answers the open questions and approves each spec change
   in the protocol's two steps.
3. **Into the spec (T-JM-1)**, in this order: `SPEC.md` §2 and §6; `spec/roles/professor.md`,
   `spec/roles/admin.md` and `spec/roles/parent.md`; `spec/data-model.md` §5; `spec/api.md`.
   Each new file gets a row in `SPEC.md`'s "Where things are" table, and §11 logs each change.

The rules files change outside the protocol, with the owner's approval, in the tasks that need
them: the move into `frontend/` updates the paths (`AGENTS.md` §4 and §5,
`docs/TEAM_WORKFLOW.md` §4, CI, `.claude/`) and adds Axios to `AGENTS.md` §4's approved list;
the backend scaffold adds the back-end stack and the `backend/` areas.

**Notes for the data model:**

- The scores nested in `studentRecords` become their own tables: enrolments, tasks and scores.
  Official and self-reported scores stay separate fields, so the 3-state engine (F6) keeps
  working.
- A rule's criteria tree can stay a JSON column, as today, or become a table of criteria. A JSON
  column matches what `frontend/src/lib/rules.js` already reads.
- Rules and subjects get an owner (`user_id`). Today every account shares them.
- From the role specs: a role on each user, professor-made subjects, a parent–student link, and
  verification requests an administrator can act on.
- The course's naming: plural lowercase table names, an `id` that is `BIGINT UNSIGNED`
  auto-increment, `timestamps()`, and foreign keys named `<parent>_id`.

## 4. Decisions for the spec

| # | Decision | Answer |
| --- | --- | --- |
| B1 | Where the Laravel code lives | **Approved:** this repository, `frontend/` and `backend/` (§1.3). CI gets a second job for the back end |
| B2 | Database and hosting | **Approved:** MySQL 8 on Laragon locally; TiDB Cloud (MySQL-compatible) hosted. The React app on Vercel (Root Directory `frontend`, `vercel.json` there). The API on Render (`rootDir` `backend`) in Docker, because Render has no native PHP. Optional: an origin secret header, so Render accepts only traffic that comes through Vercel |
| B3 | How the React app signs in | **Approved:** Sanctum SPA cookies through the Vercel rewrite proxy (§1.6) |
| B4 | Students' existing data in their browsers | **Approved:** a fresh start, with seeders from `db.json` (§1.5). T-JM-7 is dropped |
| B5 | Using the app without an account | Open. Recommendation: drop it, so everything needs an account, as today |
| B6 | Where grades are computed | **Approved:** in the browser, with `frontend/src/lib/` (§1.4). If a server feature later needs computed grades (reports, alerts, at-risk students), the maths moves or is shared then, with tests built from the JavaScript tests |
| B7 | Approved packages | **Approved:** Laravel 12, Sanctum, Pest, Pint; Axios in the React app (§1.7) |

**The React tasks already on the board** mostly stay as they are, because the React app stays.
T-11 (linking Settings to the signed-in user) and T-13 (hashing passwords) are replaced by
T-JM-4. T-10's saving of the notification toggles moves to the API.

## 5. Order of work

| Step | Task | What |
| --- | --- | --- |
| 1 | T-JM-14 | The React app moves in one moves-only commit; a second commit fixes the paths (CI, `.claude/`, `AGENTS.md` §4–5, `docs/TEAM_WORKFLOW.md` §4, the README and `docs/DEVELOPER_GUIDE.md`) |
| 2 | T-JM-17 | Laravel 12 in `backend/` with `install:api`, Pest, `pint --test`, a CI job, the Vite dev proxy, back-end setup in `docs/DEVELOPER_GUIDE.md` and back-end areas in `docs/TEAM_WORKFLOW.md`. No tables and no endpoints yet, so it doesn't wait for the spec |
| 3 | T-JM-16 | The drafts in `docs/proposals/` (§3), then the owner's review |
| 4 | T-JM-1 | The approved drafts written into the spec through the protocol (§3) |
| 5 | T-JM-3 | Database: migrations, models and seeders for every role's tables. The seeders are written fresh from `db.json` |
| 6 | T-JM-4 | Accounts: register, sign in, sign out, hashed passwords, a role on each user, permissions, and the one error format every endpoint returns (§7). It adds the first endpoints, so the format starts here (owner decision, 2026-11-28; it was T-JM-2) |
| 7 | T-JM-5 | The student endpoints, one resource at a time: subjects, enrolments, tasks and scores, rules, targets, sandbox settings and drafts, Settings |
| 8 | T-JM-6 | The React app uses the API, one area at a time: `frontend/src/services/` and `useDb` call it; every screen gets loading and error states |
| 9 | T-JM-8 | Switch over: deploy both (§4, B2), check every screen against `docs/BEHAVIOUR_CHECKLIST.md`. The owner creates the TiDB, Render and Vercel accounts first |
| 10 | T-JM-9 to T-JM-11 | The role workspaces (§6) |

Steps 2 and 3 can run side by side once step 1 is merged. Accessibility
(`docs/ACCESSIBILITY_PLAN.md`) is built in the React app and doesn't wait for the back end.

## 6. Roles

Each role's spec is written in full before the database design (§3), so its tables exist from
the first migrations. Its workspace is built after the switch: React screens and the API
endpoints behind them, split into smaller tasks from the spec.

1. **Professor (T-JM-9):** creates subjects with their own rules (D2, F10), and enters official
   scores that students see as locked (F6, D1). The professor draft answers `SPEC.md` §10
   question 1 first: when a student-made subject is linked to a professor-made one, what gets
   overwritten?
2. **Administrator (T-JM-10):** verifies subjects (F3, D11). It needs professor-made subjects,
   so it is built after the professor.
3. **Parent (T-JM-11):** linked to a student's account, with a read-only view of their grades.
   Email and SMS alerts (`SPEC.md` §8) are a later task.

Finding at-risk students across a whole school (`docs/project_details.md`) is later still, once
these three roles exist.

## 7. Error handling

**The React app stays, so most of the review's fixes stay useful** (`docs/ERROR_HANDLING_REVIEW.md`,
T-21; tasks T-23 to T-31). There are no real users yet and the data starts fresh (§1.5), so the
fixes that only protect `localStorage` are dropped:

| Group | Tasks |
| --- | --- |
| Kept | T-23 (E9, E15), T-25 (E6), T-26 narrowed to E19 and the photo size limit, T-27 (E7, E8), T-28 (E11–E14), T-30 (E21), T-31 (E20) |
| Dropped, because they only fix `localStorage` | T-24 (E1–E3), T-26's E16–E18, T-29 (E10) |

**With the API, new cases join the list.** The `spec/api.md` draft says what the student sees
for each of these. The save-error helper from T-28 extends to them:

| Case | What the student should see |
| --- | --- |
| No connection, or the API is down | "You're offline" or "CompUGrade can't be reached", with "Try again". What they typed stays in the form |
| Session expired (401, 419) | They go to the login page and come back to where they were |
| Not allowed (403) | "You don't have access to this", for example a student trying to write an official score |
| Not found (404) | "This doesn't exist any more", with a way back |
| Invalid input (422) | The server's message under each field, in plain words |
| Changed by someone else (409) | "This was changed since you opened it", with the newer data. It's E9 again, now across users: a professor and a student editing the same class |
| Server error (500) | A short message with "Try again". The details go to Laravel's log, not to the screen |

## 8. Course rules the back end follows

From the CC013.23 documents:

- **Tables only through migrations** (`php artisan make:model <Name> -m`, then
  `php artisan migrate`), never in MySQL Workbench.
- **No raw SQL:** queries go through Eloquent.
- **REST:** create is `POST`, read is `GET`, update is `PUT` or `PATCH`, delete is `DELETE`, on
  `/api/<resource>` and `/api/<resource>/{id}`. Status codes: 200 and 201, 401 and 403, 404 and
  422, 500.
- **No secrets in code:** keys and passwords live in `.env`, which is never committed. Locally:
  `DB_CONNECTION=mysql`, `127.0.0.1:3306`, `DB_DATABASE=webdev2`, user `root`, empty password.
- **Code Defense:** each student must be able to explain every line in a one-on-one defense, or
  the work earns no credit. A study guide in `docs/defense/` has its own task (T-JM-15).
- **Every team member pushes verifiable commits.**

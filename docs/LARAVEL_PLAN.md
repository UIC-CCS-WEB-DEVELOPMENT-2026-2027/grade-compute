# CompUGrade — Laravel Back-End Plan

A proposal (2026-11-24), not part of the spec. It plans a Laravel back end for the React app, and
how the professor, parent and administrator roles and the error-handling fixes fit around it.
**Nothing here is approved** except the owner decisions in §1. The tasks it suggests are
`proposed` on `docs/BOARD.md` (T-JM-1 to T-JM-13). Each one needs the owner's approval, and the
spec comes first (§3).

## 1. Owner decisions so far (2026-11-24)

1. **The front end stays the React app**: React + Vite, react-router, shadcn/ui, the Tailwind
   tokens and the grade maths in `src/lib/`. Moving the screens to PHP (Blade and Livewire) was
   considered and dropped, because it means rewriting the React code and shadcn/ui is React-only.
2. **Laravel becomes a separate back end** (an API). It stores the data, handles sign-in, and
   decides who may read and write what. The React app calls it instead of `localStorage`.
3. **Spec first, built later.** Each part is written into the spec through the protocol
   (`AGENTS.md` §2) before anyone writes its code. There is no date for the build yet.

## 2. What changes and what stays

| Part | Today | With the back end |
| --- | --- | --- |
| Screens, routes, components | React, react-router, shadcn/ui | The same |
| Grade maths | `src/lib/`, in the browser | The same (§4, B6) |
| Stored data | `localStorage` (`compugrade_db`, `compugrade-account`) | A database, through the API |
| Data access | `src/services/` and `useDb`, read and written at once | `src/services/` calls the API. Calls take time and can fail, so screens get loading and error states |
| Sign-in | Checked in the browser; passwords in plain text (AUDIT B15) | Laravel sessions; hashed passwords |
| Who may write what | Anyone can change any stored value, including "locked" official scores | The server checks: only a class's professor writes official scores, and only a student writes their own self-reported scores |

**The biggest change in the React app** is that reading data stops being instant. Today every
screen reads the whole database at once (`getDb()`). With an API, each screen asks for what it
needs, waits, and handles a failure. The work is in `src/services/`, `src/hooks/useDb.js` and
each screen's loading and error states. The screens' layout and the grade maths stay as they
are.

**Why a back end at all:** with `localStorage`, each user's data stays in their own browser.
Scores a professor enters never reach a student, a parent can't see a child's grades, and an
administrator can't see anyone's. The roles need a shared database.

## 3. Spec first

Before any code, these are written through the protocol, in this order (task T-JM-1):

1. `SPEC.md` §2: the back end is in scope. §6: roles and access as the server enforces them.
   §11: the changelog.
2. `spec/data-model.md` §5: the database tables, in place of the `localStorage` shape (notes
   below).
3. A new `spec/api.md`: every endpoint, who may call it, what it accepts, and its errors (§7).
   It needs a row in `SPEC.md`'s "Where things are" table.
4. Then, as each role is planned: `spec/roles/<role>.md` (§6).

The rules files change with it, outside the protocol but with the owner's approval:
`AGENTS.md` §4 (stack, no-network rule, approved packages), §5 (folders) and §8, and
`docs/TEAM_WORKFLOW.md` §4 (areas for the back-end folders).

**Notes for the data model:**

- The scores nested in `studentRecords` become their own tables: enrolments, tasks and scores.
  Official and self-reported scores stay separate fields, so the 3-state engine (F6) keeps
  working.
- A rule's criteria tree can stay a JSON column, as today, or become a table of criteria. A JSON
  column matches what `src/lib/rules.js` already reads.
- Rules and subjects get an owner (`user_id`). Today every account shares them.
- New: a parent–student link, and verification requests an administrator can act on.

## 4. Decisions for the spec

| # | Decision | Recommendation |
| --- | --- | --- |
| B1 | Where the Laravel code lives | This repository, in `backend/`. The React app stays where it is, so nothing has to move, and the board, spec and docs stay in one place. CI gets a second job for the back end |
| B2 | Database and hosting | MySQL or PostgreSQL. The React app can stay on Vercel; the API needs a host that runs PHP (for example Laravel Cloud, Forge or a school server). Both should be on one domain (for example `app.` and `api.` under the same name), which B3 needs |
| B3 | How the React app signs in | Laravel Sanctum's cookie sign-in for a front end on the same domain. It's the standard way for a React app and needs no tokens stored in the browser |
| B4 | Students' existing data in their browsers | A fresh start, as long as there are no real users yet. Otherwise an export from the React app and an import into the API (T-JM-7) |
| B5 | Using the app without an account | Drop it: everything needs an account, as today |
| B6 | Where grades are computed | In the browser, with `src/lib/` as today. The server stores raw scores and checks permissions and ranges. If a server feature later needs computed grades (reports, alerts, at-risk students), the maths moves or is shared then, with tests built from the JavaScript tests |
| B7 | Approved packages | Back end: Laravel, Sanctum, Pest (tests), Pint (PHP code style). React: nothing new. Calls can use the browser's `fetch` |

**The React tasks already on the board** mostly stay as they are, because the React app stays.
T-11 (linking Settings to the signed-in user) and T-13 (hashing passwords) are replaced by
T-JM-4. T-10's saving of the notification toggles moves to the API.

## 5. Order of work

| Step | Task | What |
| --- | --- | --- |
| 1 | T-JM-1 | The spec and the rules files (§3), with decisions B1–B7 made |
| 2 | T-JM-2 | The Laravel project in `backend/`: Pest, Pint, CI, and one error format for every endpoint (§7) |
| 3 | T-JM-3 | Database: migrations, models and seeders. The seeders reproduce `src/services/db.json` |
| 4 | T-JM-4 | Accounts: register, sign in, sign out, hashed passwords, a role on each user, permissions |
| 5 | T-JM-5 | The student endpoints: subjects, enrolments, tasks and scores, rules, targets, sandbox settings and drafts, Settings |
| 6 | T-JM-6 | The React app uses the API: `src/services/` and `useDb` call it; every screen gets loading and error states. Split by area once the spec exists |
| 7 | T-JM-7 | Bring over browser data, if B4 chooses it |
| 8 | T-JM-8 | Switch over: deploy both, check every screen against `docs/BEHAVIOUR_CHECKLIST.md` |
| 9 | T-JM-9 to T-JM-11 | The roles (§6) |

Accessibility (`docs/ACCESSIBILITY_PLAN.md`) is built in the React app and doesn't wait for the
back end.

## 6. Roles, after the switch

Each role starts as `spec/roles/<role>.md`, through the protocol. It adds React screens and the
API endpoints behind them. Once its spec exists, the task is split into smaller ones.

1. **Professor (T-JM-9):** creates subjects with their own rules (D2, F10), and enters official
   scores that students see as locked (F6, D1). `SPEC.md` §10 question 1 needs an answer first:
   when a student-made subject is linked to a professor-made one, what gets overwritten?
2. **Administrator (T-JM-10):** verifies subjects (F3, D11). It needs professor-made subjects,
   so it comes after the professor.
3. **Parent (T-JM-11):** linked to a student's account, with a read-only view of their grades.
   Email and SMS alerts (`SPEC.md` §8) are a later task.

Finding at-risk students across a whole school (`docs/project_details.md`) is later still, once
these three roles exist.

## 7. Error handling

**The React app stays, so the review's fixes stay useful** (`docs/ERROR_HANDLING_REVIEW.md`,
T-21; tasks T-23 to T-31 on the branch `docs/error-handling-tasks`). They split into two groups:

| Group | Tasks |
| --- | --- |
| Useful with or without the back end | T-23 (E9, E15), T-25 (E6), T-27 (E7, E8), T-28 (E11–E14), T-30 (E21), T-31 (E20) |
| Needed only until the switch, because they fix `localStorage` | T-24 (E1–E3), T-26 (E16–E18; E19 and the photo size limit stay useful), T-29 (E10) |

The back end only starts after its spec, so the React app will run on `localStorage` for a while
yet. That's why the second group is still worth doing if real students use the app before the
switch.

**With the API, new cases join the list.** `spec/api.md` (T-JM-1) should say what the student
sees for each of these. The save-error helper from T-28 extends to them:

| Case | What the student should see |
| --- | --- |
| No connection, or the API is down | "You're offline" or "CompUGrade can't be reached", with "Try again". What they typed stays in the form |
| Session expired (401, 419) | They go to the login page and come back to where they were |
| Not allowed (403) | "You don't have access to this", for example a student trying to write an official score |
| Invalid input (422) | The server's message under each field, in plain words |
| Changed by someone else (409) | "This was changed since you opened it", with the newer data. It's E9 again, now across users: a professor and a student editing the same class |
| Server error (500) | A short message with "Try again". The details go to Laravel's log, not to the screen |

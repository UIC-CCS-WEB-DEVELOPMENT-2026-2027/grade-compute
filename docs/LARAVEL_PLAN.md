# CompUGrade — Laravel Plan

A proposal (2026-11-24), not part of the spec. It plans the move from the React + Vite app to a
Laravel app, and how the professor, parent and administrator roles and the error-handling fixes
fit around it. **Nothing here is approved** except the two owner decisions in §1. The tasks it
suggests are `proposed` on `docs/BOARD.md` (T-JM-1 to T-JM-16) and need the owner's approval, one
by one, with `SPEC.md` updated through its protocol (`AGENTS.md` §2).

## 1. Owner decisions so far (2026-11-24)

1. CompUGrade moves to a Laravel-based app.
2. Features are built in PHP/Laravel, even when an existing React feature has to be moved over.

## 2. Recommendation: start the Laravel app now

The owner's plan is to build every role and feature soon, whether or not the move has happened.
That makes now the cheapest time to move:

- **The roles can't work in the current app.** All data is in one browser's `localStorage`
  (`spec/data-model.md` §5). Scores a professor enters on their own device never reach a
  student's device, a parent can't see a child's data, and an administrator can't see anyone's.
  Any role built now in React would be built twice.
- **Every feature added to the React app is one more feature to move.** The app is still small:
  seven student screens, a spec that describes them, and 384 tests that pin down how the grade
  maths behaves.
- **Official scores need a server.** In the browser, a student can change any stored value,
  including "locked" official scores. Only a server can lock them, hash passwords and run
  verification.

**What it costs:** a period with no new features for students, the team learning Laravel and
Livewire, and a rewrite of the parts that need JavaScript in the browser (§4).

**While the Laravel app is built,** the React app stays deployed as it is, and it doubles as the
reference for how every screen behaves. It gets only fixes that protect students' data (§7).
New features and roles go into the Laravel app.

## 3. Front end: Blade and Livewire, or Inertia and React

Laravel can draw pages in two ways.

| | **Blade + Livewire** (PHP first) | **Inertia + React** |
| --- | --- | --- |
| What it is | Pages are Blade templates. Livewire components are PHP classes. A click or an input goes to the server, which re-renders the changed part of the page. Alpine.js covers small things that must run in the browser | Laravel handles routes, sign-in, validation and data. Inertia hands that data to React pages as props, without building a separate API |
| Fits "build it in PHP" | Yes: logic and most UI code are PHP | Partly: back end in PHP, screens stay React |
| What carries over | Tailwind tokens, fonts, layout ideas, the spec. Components are rewritten | Almost all of `src/` (pages, features, shadcn/ui), adapted to load data from Laravel |
| UI kit | shadcn/ui is React-only, so it goes. Options: Flux UI (Livewire's official kit; some components are paid) or Blade components built on the same tokens | shadcn/ui stays |
| Grade maths | In PHP, on the server | Could stay in JavaScript, but official grades should still be checked on the server |

Laravel's official starter kits come in both forms (Livewire, and React with Inertia). The React
kit is written in TypeScript, which `AGENTS.md` §4 rules out today.

**Recommendation: Blade + Livewire**, because it matches decision 2. The parts below need
JavaScript in the browser, written with Alpine.js:

- the pill editor's dragging (F10)
- the grade-history and sandbox charts. Recharts is React-only, so a JavaScript chart library
  is needed (for example Chart.js or ApexCharts). That's a new dependency for the owner to approve
- the gauge (F17), the confetti and the celebration sound (F12)
- the sidebar's Ctrl/⌘+B shortcut (F13)

## 4. Decisions needed before T-JM-1

| # | Decision | Recommendation |
| --- | --- | --- |
| L1 | Start now or later (§2) | Now |
| L2 | Blade + Livewire or Inertia + React (§3) | Blade + Livewire |
| L3 | Where the Laravel app lives | This repository, so the board, spec and docs stay in one place. The React app moves to `legacy/` in a move-only PR, made when no other branch is open (like T-17), and the Laravel app goes at the root. The other option is a new repository, with this one kept as the reference |
| L4 | Database and hosting | MySQL or PostgreSQL. A host that runs PHP (Vercel only serves the static React app), for example Laravel Cloud, Forge or a school server |
| L5 | Students' existing data in their browsers | Either an export from the React app and an import into Laravel (T-JM-12), or a fresh start. With no real users yet, a fresh start is simpler |
| L6 | What happens to the open React tasks on the board | Mark each one `dropped: moved to Laravel` and fold it into the matching port task, or keep it if it protects data (§7) |
| L7 | Approved packages for the Laravel app | Laravel, Livewire, Alpine.js, Tailwind CSS, Pest (tests), Pint (PHP code style), plus a chart library (§3). Everything else needs the owner's approval, as today |

## 5. Order of work

Each step is a task on the board (state `proposed`). Port tasks are cut so that one screen is
one task. Steps 1–5 come first. After them, the port tasks can run side by side.

| Step | Task | What |
| --- | --- | --- |
| 1 | T-JM-1 | Update the rules: `SPEC.md` (§2, §5, §6, §8), `AGENTS.md` (§3–§7) and `docs/TEAM_WORKFLOW.md` §4 (areas for the Laravel folders) describe the Laravel app, through the protocol for the spec |
| 2 | T-JM-2 | The Laravel project: Livewire starter kit, the tokens and fonts from `src/index.css`, the text roles, Pest, Pint, CI jobs, error pages (§7) |
| 3 | T-JM-3 | Database: migrations and seeders for the data model, with owners on rules and subjects, and roles on users |
| 4 | T-JM-4 | The grade maths in PHP (`src/lib/` grades, rules, scores, targets, sandbox, history, terms), with Pest tests whose cases come from the JavaScript tests |
| 5 | T-JM-5 | Accounts: register, sign in, sign out, hashed passwords, the role on each user, route protection. Student role first |
| 6 | T-JM-6 to T-JM-11 | Port the student screens: Dashboard and My Subjects; Subject Detail and Current Term Records; the sandbox; Grade Rules and the rule editor; grade history; Settings |
| 7 | T-JM-12 | Bring over browser data, if L5 says so |
| 8 | T-JM-13 | Switch over: deploy the Laravel app, check every screen against `docs/BEHAVIOUR_CHECKLIST.md`, retire the React app |
| 9 | T-JM-14 to T-JM-16 | The roles (§6) |

Accessibility (`docs/ACCESSIBILITY_PLAN.md`) is built into the Laravel app, so it starts once
the screens it touches are ported.

**Database design notes for T-JM-3** (from `spec/data-model.md` §5):

- The scores nested in `studentRecords` become their own tables: enrolments, tasks and scores.
  Official and self-reported scores stay separate fields, so the 3-state engine (F6) keeps
  working.
- A rule's criteria tree can be a JSON column, as today, or a table of criteria. A JSON column is
  closer to the current code and easier to port.
- Rules and subjects get an owner (`user_id`). Today every account shares them.
- New: a parent–student link and verification requests that an administrator can act on.

## 6. Roles, after the student screens

Each role starts as `spec/roles/<role>.md`, written through the protocol (`SPEC.md`, "Where
things are"). Once its spec exists, the role's task is split into smaller tasks on the board.

1. **Professor (T-JM-14):** creates subjects with their own rules (D2, F10), and enters
   official scores that students see as locked (F6, D1). It needs an answer to `SPEC.md` §10
   question 1 first: when a student-made subject is linked to a professor-made one, what gets
   overwritten?
2. **Administrator (T-JM-15):** verifies subjects (F3, D11). It needs professor-made subjects,
   so it comes after the professor.
3. **Parent (T-JM-16):** linked to a student's account, with a read-only view of their grades.
   Email and SMS alerts (`SPEC.md` §8) are a later task.

School counsellors and administrators looking for at-risk students across a whole school
(`docs/project_details.md`) need data from many students, which the Laravel app makes possible.
It's a later task, once these three roles exist.

## 7. Error handling

The review (`docs/ERROR_HANDLING_REVIEW.md`, T-21) found 22 cases in the React app. Its fix tasks
(T-23 to T-31) are on the local branch `docs/error-handling-tasks`, which isn't pushed or merged
yet.

**In the React app, while it's still deployed,** the fixes worth making are the ones that stop
data loss or a blank screen:

| Task | Why it's still worth doing |
| --- | --- |
| T-23 Rule pages save fresh data (E9) | A removed subject comes back. Small fix, worst data loss |
| T-25 App-wide error boundary (E6) | Any crash is a blank page with no way out |

The others (T-24, T-26 to T-31) fix how the browser stores data, which the Laravel app replaces.
The suggestion is to mark them `dropped: replaced by the Laravel app (docs/LARAVEL_PLAN.md §7)`
and keep the review as the list of cases the Laravel app must handle.

**In the Laravel app,** the same cases become requirements of the tasks that build each part:

| Review | In the Laravel app | Task |
| --- | --- | --- |
| E6 blank page on a crash | Friendly 404, 419 (expired session), 500 and 503 pages, with a way back to the Dashboard. Errors go to Laravel's log, not to the screen | T-JM-2 |
| E1–E3, E16 unreadable stored data | Handled by the database. Migrations and seeders replace the browser's upgrade code | T-JM-3 |
| E9 a save overwriting newer data | Each save updates only what changed, inside a database transaction. Where two people can edit the same thing (a professor and a student), the save checks the record hasn't changed since it was read | T-JM-3, T-JM-6 to T-JM-11, T-JM-14 |
| E11–E15 raw or missing save messages | Validation errors under each field, in plain words. A failed save says so and keeps what the student typed | each port task |
| E17 a large profile photo | Upload validation with a size limit (the owner sets it), and the file goes to storage, not the database | T-JM-11 |
| E21 a target out of range | Server-side validation that shows "Enter a target from 0 to 100." | T-JM-7 |
| Official scores changed in the browser (new) | The server decides who may write what: only a class's professor writes official scores, and only the student writes their own self-reported scores | T-JM-5, T-JM-14 |

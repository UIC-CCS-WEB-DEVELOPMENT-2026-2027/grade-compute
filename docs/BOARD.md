# CompUGrade — Task Board

The team's to-do tracker. How to use it: [`docs/TEAM_WORKFLOW.md`](TEAM_WORKFLOW.md) §2–3.

**Quick rules**

- To claim: on `main`, change only your task's **State** line, commit `chore(board): claim T-n`,
  and push right away. If the push is rejected, pull and check you still have it.
- Never move, reorder or reformat blocks. Add new tasks at the end of their area's section, with
  IDs `T-<your initials>-<n>`.
- States: `proposed` · `todo` · `claimed by <github-username> on <YYYY-MM-DD>, branch <branch>` ·
  `done in PR #<n>` · `blocked: <reason>` · `dropped: <reason>`.
- `proposed` tasks need the owner's approval (and, for features, a `SPEC.md` update through its
  protocol) before anyone claims them.

The seed tasks below come from `SPEC.md` (2026-11-12): the owner-approved follow-up branches in
§2 are `todo`; the other unfinished features and the backlog in §9 are `proposed`. Areas are the
ones in TEAM_WORKFLOW.md §4.

---

## dashboard

### T-1 · Real "Recent Updates" feed

- State: todo
- Areas: dashboard
- Spec: F2a; SPEC.md §2 (features the UI already points to); AUDIT B13
- Done when: the Dashboard's "Recent Updates" list shows real data instead of the fixed sample text. What counts as an update is decided with the owner before work starts

## layout

### T-2 · Header bell and profile menu

- State: todo
- Areas: layout
- Spec: SPEC.md §2 (features the UI already points to); AUDIT B13
- Done when: the header's bell and profile chevron do what the owner decides; today they do nothing

### T-3 · CSV export promised in the sidebar Help

- State: todo
- Areas: layout, shared
- Spec: SPEC.md §2 (features the UI already points to); AUDIT B13
- Done when: "Export your gradebook anytime as a CSV" exists, or the owner changes the Help text instead

## subjects

### T-4 · Semesters: real semester on Subject Detail, no dependence on today's date

- State: todo
- Areas: subjects, subject-detail, shared (src/lib/subjects.js)
- Spec: SPEC.md §2 (Semesters); AUDIT B7, B12; SPEC.md §10 D9, D10
- Done when: Subject Detail shows the class's real semester, and semester assignment no longer depends on the current date. May need LOCK-data

### T-5 · Personalised subject emoji and accent colour

- State: proposed
- Areas: subjects, subject-detail, dashboard
- Spec: F16 [PLANNED]; SPEC.md §7
- Done when: to be specified in SPEC.md. Changes stored data, so it needs LOCK-data

## term-records

### T-22 · Refine how tasks are tagged

- State: todo
- Areas: term-records
- Spec: AUDIT B22 (owner to-do, 2026-11-13). Changes user-facing wording, so `SPEC.md` F8 gets the tag rules through its protocol
- Done when: the tags in Current Term Records reflect both the kind of task and whether it has a score (for example a custom task with a student score, and a regular task with no score yet), as agreed with the owner, and `docs/BEHAVIOUR_CHECKLIST.md` H-items are updated in the same PR

## sandbox

### T-6 · Conversational sandbox copy

- State: proposed
- Areas: sandbox
- Spec: F18 [PARTIAL]; SPEC.md §10 D8
- Done when: the sandbox result messages use encouraging wording approved by the owner

## history

### T-7 · GPA growth and category trends

- State: proposed
- Areas: history, dashboard
- Spec: F11 [PARTIAL]; SPEC.md §10 D4
- Done when: to be specified in SPEC.md (semester-over-semester GPA growth, trends across subject categories)

## settings

### T-8 · Log Out in Settings works

- State: proposed
- Areas: settings
- Spec: F14; AUDIT B1 (bug: needs the owner's approval to fix)
- Done when: Settings' Log Out signs the student out like the sidebar's Logout

### T-9 · Help & Resources opens from every Settings section

- State: proposed
- Areas: settings
- Spec: F14; AUDIT B2 (bug: needs the owner's approval to fix)
- Done when: the Help button works in every section, not only Security

### T-10 · Notification toggles are saved; Download and Clear work

- State: proposed
- Areas: settings
- Spec: F14; AUDIT B3 (bug: needs the owner's approval to fix)
- Done when: to be specified with the owner. Saving toggles changes stored data, so it needs LOCK-data

### T-11 · Link the Settings account to the signed-in user

- State: proposed
- Areas: settings, auth
- Spec: F14; AUDIT B4; SPEC.md §9 backlog
- Done when: to be specified with the owner. Changes stored data, so it needs LOCK-data

### T-20 · 2FA "Turn on" explains why it can't start

- State: todo
- Areas: settings
- Spec: F14; AUDIT B21 (owner: fix after the clean-up, 2026-11-13)
- Done when: with no verified email or phone, "Turn on" shows "Add and verify an email address or phone number before enabling two-factor authentication." (today the message is set but never rendered), and `docs/BEHAVIOUR_CHECKLIST.md` L7 is updated in the same PR

## auth

### T-12 · Interactive homepage hero

- State: proposed
- Areas: auth
- Spec: SPEC.md §9 backlog (owner suggestion, 2026-11-11). The professor grade inputter part waits for the professor workspace (F20), which is out of scope
- Done when: to be specified in SPEC.md

### T-13 · Hash the login passwords

- State: proposed
- Areas: auth, shared (src/services/)
- Spec: SPEC.md §9 backlog; AUDIT B15
- Done when: to be specified with the owner. Changes stored data, so it needs LOCK-data

## backend

A Laravel 12 API in `backend/` behind the React app in `frontend/` (`docs/LARAVEL_PLAN.md`).
The move into `frontend/` and the backend scaffold come first and don't wait for the spec. Then
spec first: T-JM-1 comes before T-JM-2 to T-JM-5, which follow in order.

### T-JM-1 · Back end: spec

- State: proposed
- Areas: SPEC.md, spec/ (LOCK-spec)
- Spec: docs/LARAVEL_PLAN.md §3, §4; the drafts in docs/proposals/
- Done when: from the owner-approved drafts in `docs/proposals/`, and through the protocol, `SPEC.md` §2 and §6, `spec/roles/professor.md`, `spec/roles/admin.md` and `spec/roles/parent.md` (each in full), `spec/data-model.md` §5 (every role's tables) and a new `spec/api.md` (every endpoint and its error cases) describe the back end, each new file with a row in "Where things are"

### T-JM-2 · API error format

- State: proposed
- Areas: backend/
- Spec: docs/LARAVEL_PLAN.md §7, §8; spec/api.md
- Done when: every API error (401, 403, 404, 419, 422, 500) comes back in the one format `spec/api.md` gives, a 500 shows no details outside Laravel's log, and Pest tests cover each case

### T-JM-3 · Database schema and seed data

- State: proposed
- Areas: backend/ (database/, app/Models/)
- Spec: docs/LARAVEL_PLAN.md §3 (data-model notes), §8; spec/data-model.md §5; spec/roles/
- Done when: migrations (made with `php artisan make:model <Name> -m`, never in Workbench), models and seeders cover every table in `spec/data-model.md`, the roles' tables included; the seeders are written fresh from `frontend/src/services/db.json`; `php artisan migrate:fresh --seed` runs on Laragon's MySQL (`webdev2`)

### T-JM-4 · Accounts, sign-in and roles

- State: proposed
- Areas: backend/ (auth)
- Spec: docs/LARAVEL_PLAN.md §1.6, §4 (B3); F1, F15; spec/api.md; replaces T-11 and T-13
- Done when: register, sign in and sign out work through Sanctum's SPA cookie auth with hashed passwords; every user has a role; policies let only the right people read and write each record; Pest tests cover each

### T-JM-5 · Student endpoints

- State: proposed
- Areas: backend/
- Spec: spec/api.md; spec/grading-rules.md §4 (ranges to check); docs/LARAVEL_PLAN.md §8
- Done when: every endpoint the student screens need (subjects, enrolments, tasks and scores, rules, targets, sandbox settings and drafts, Settings) exists as `spec/api.md` describes, through Eloquent with no raw SQL, with its input validated and Pest tests. Built one resource at a time; split into one task per resource once the spec exists

### T-JM-6 · The React app uses the API

- State: proposed
- Areas: shared (frontend/src/services/, frontend/src/hooks/useDb.js), then each screen's area
- Spec: docs/LARAVEL_PLAN.md §2, §7; spec/api.md
- Done when: one area at a time, `src/services/` calls the API through Axios (`withCredentials`, `withXSRFToken`) instead of `localStorage`, and every screen shows loading and error states as `spec/api.md` describes; the `localStorage` storage is removed once the last area has moved. Split into one task per area once the spec exists

### T-JM-7 · Bring over browser data

- State: dropped: a fresh start with seeders from db.json, no browser data to import (owner decision, 2026-11-28)
- Areas: shared (src/services/), backend/
- Spec: docs/LARAVEL_PLAN.md §1.5, §4 (B4)
- Done when: not done

### T-JM-8 · Switch over to the back end

- State: proposed
- Areas: hosting (frontend/vercel.json, backend/ Docker files), docs/
- Spec: docs/LARAVEL_PLAN.md §1.6, §4 (B2), §5 step 10
- Done when: the React app is on Vercel (Root Directory `frontend`) with rewrites for `/api/*` and `/sanctum/*` to the API and then an SPA catch-all, and `x-vercel-enable-rewrite-caching: 0` on `/api/*`; the API runs on Render in Docker (`rootDir` `backend`) with TiDB Cloud; every screen passes `docs/BEHAVIOUR_CHECKLIST.md`; `localStorage` holds only per-browser settings (such as the sidebar state). Needs the owner's TiDB, Render and Vercel accounts first

## roles

Each role's spec is written in full before the database design (T-JM-1); its workspace is built
after the switch (`docs/LARAVEL_PLAN.md` §6). Each workspace is split into smaller tasks from its
spec, and adds React screens and the API endpoints behind them.

### T-JM-9 · Professor workspace

- State: proposed
- Areas: to be set from its spec (React pages and features for the professor, backend/)
- Spec: F20; SPEC.md §6, §10 question 1, D1, D2; F6, F10; spec/roles/professor.md
- Done when: the workspace works as `spec/roles/professor.md` describes: professors create subjects with their own rules and enter official scores that students see as locked

### T-JM-10 · Administrator workspace

- State: proposed
- Areas: to be set from its spec (React pages and features for the administrator, backend/)
- Spec: F20; SPEC.md §6, D11; F3; spec/roles/admin.md
- Done when: the workspace works as `spec/roles/admin.md` describes: administrators verify subjects

### T-JM-11 · Parent portal

- State: proposed
- Areas: to be set from its spec (React pages and features for the parent, backend/)
- Spec: F20; SPEC.md §1, §8; spec/roles/parent.md
- Done when: the portal works as `spec/roles/parent.md` describes: a parent linked to a student sees that student's grades, read-only

## accessibility

Built in the React app; it doesn't wait for the back end (`docs/ACCESSIBILITY_PLAN.md`). The
owner makes its decisions during implementation.

### T-JM-12 · Accessibility audit

- State: proposed
- Areas: docs/
- Spec: docs/ACCESSIBILITY_PLAN.md §4
- Done when: a WCAG 2.2 AA review of all 14 screens is written up in `docs/`, with a proposed fix for each finding

### T-JM-13 · Accessibility and reading preferences (F21)

- State: proposed
- Areas: settings, src/index.css (rule file), index.html (coordinate with T-16)
- Spec: docs/ACCESSIBILITY_PLAN.md; F21 in `spec/features.md` through the protocol
- Done when: to be specified with the owner, one option at a time

## shared

### T-14 · Gauge enhancements

- State: proposed
- Areas: shared (src/components/GradeGauge.jsx), subject-detail, sandbox
- Spec: F17; SPEC.md §2 (details to be decided)
- Done when: to be specified with the owner

### T-15 · Supportive mascot in empty states and predictions

- State: proposed
- Areas: shared, sandbox
- Spec: F19 [PLANNED]; SPEC.md §7
- Done when: to be specified in SPEC.md

### T-16 · Branding: logo, product name, favicon and page title

- State: todo
- Areas: shared (src/components/BrandMark.jsx), layout, auth, src/index.css brand classes, index.html, public/
- Spec: SPEC.md §2 (Branding); AUDIT §9
- Done when: the branding notes in docs/AUDIT.md §9 are resolved. Touches several areas: coordinate before claiming

### T-21 · Error-handling review

- State: claimed by June-05 on 2026-11-13, branch docs/error-handling-review
- Areas: shared (src/services/, src/hooks/, src/lib/), all screens
- Spec: owner request, 2026-11-13. The clean-up kept error handling as it was (feature freeze)
- Done when: a read-only review in `docs/` lists every place an error can happen (reading, parsing and saving `localStorage`, bad or old stored data, failed saves, invalid input that slips through, exceptions while rendering), what the student sees today, and a proposed fix for each. The fixes become separate tasks, each approved by the owner, because they change behaviour

## tooling

### T-17 · Line endings: .gitattributes

- State: done in PR #123
- Areas: tooling
- Spec: TEAM_WORKFLOW.md §9, decision 8 (after T-18)
- Done when: `.gitattributes` with `* text=auto eol=lf` is committed, followed by a separate `git add --renormalize .` commit. Do it when no other branch is open, because the renormalize commit touches many files

### T-18 · CI on pull requests

- State: done in PR #121
- Areas: tooling
- Spec: TEAM_WORKFLOW.md §9, decision 7 (first task after the team docs)
- Done when: a GitHub Actions workflow runs lint, format check, build and tests on every PR

### T-19 · Lint rules backing the AI context pack

- State: proposed
- Areas: tooling
- Spec: docs/ai-context/README.md §4
- Done when: the draft rules are tried on the code, false positives fixed or exempted, and the rules turned on as errors

---

## Locks

Take a lock exactly like a claim, change its State to
`held by <github-username> for <task> since <YYYY-MM-DD>`, and set it back to `free` once that PR
is merged. See TEAM_WORKFLOW.md §5.

### LOCK-data · Stored data shape

- State: free
- Files: src/services/migrations.js, src/services/db.json, SCHEMA_VERSION

### LOCK-deps · Dependencies

- State: free
- Files: package.json, package-lock.json

### LOCK-spec · SPEC.md, spec/

- State: free
- Files: SPEC.md, spec/ (changes go through the protocol in AGENTS.md §2)

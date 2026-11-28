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

### T-27 · Damaged records don't crash screens

- State: todo
- Areas: layout (Sidebar), term-records (src/lib/grades.js)
- Spec: docs/ERROR_HANDLING_REVIEW.md E7, E8 (T-21); AUDIT §12
- Done when: the Sidebar treats a missing `studentRecords` or `subjects` list as empty, `toTaskList` drops task entries that aren't objects, and tests cover each damaged shape in the review's §4

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

## subject-detail

### T-30 · Out-of-range target message on Subject Detail

- State: proposed
- Areas: subject-detail
- Spec: docs/ERROR_HANDLING_REVIEW.md E21 (T-21); AUDIT §12. Changes `SPEC.md` §4 through its protocol
- Done when: a Subject Detail target outside 0–100 shows "Enter a target from 0 to 100.", as the sandbox does, instead of quietly going back to the old value

## sandbox

### T-6 · Conversational sandbox copy

- State: proposed
- Areas: sandbox
- Spec: F18 [PARTIAL]; SPEC.md §10 D8
- Done when: the sandbox result messages use encouraging wording approved by the owner

## grade-rules

### T-23 · Rule pages save fresh data

- State: todo
- Areas: grade-rules
- Spec: docs/ERROR_HANDLING_REVIEW.md E9, E15 (T-21); AUDIT §12. Fixes the worst data loss the review found
- Done when: Grade Rules and the rule editor build every save from the data as it is at the moment of saving, so a subject removed in the Sidebar (or in another tab) doesn't come back; a failed Duplicate on the rule editor shows its error; a test covers removing a subject and then pressing Duplicate

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

### T-26 · Settings photo upload fails safely

- State: proposed
- Areas: settings
- Spec: docs/ERROR_HANDLING_REVIEW.md E19 and E17's photo size (T-21); AUDIT §12; F14 in `SPEC.md` through its protocol. The photo size limit, or resizing, is the owner's decision. Narrowed (owner decision, 2026-11-28): E16, E18 and the rest of E17 only fix `localStorage`, so they are dropped
- Done when: an unreadable image says "That image couldn't be read. Try another file."; a photo over the limit the owner sets is refused with a message, or resized, as the owner decides

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
The move into `frontend/` (T-JM-14) comes first. The backend scaffold (T-JM-17) and the spec
drafts (T-JM-16) follow it and don't wait for the spec. Then spec first: T-JM-1 comes before
T-JM-3 to T-JM-5, which follow in order.

### T-JM-1 · Back end: spec

- State: proposed
- Areas: SPEC.md, spec/ (LOCK-spec)
- Spec: docs/LARAVEL_PLAN.md §3, §4; the drafts in docs/proposals/
- Done when: from the owner-approved drafts in `docs/proposals/`, and through the protocol, `SPEC.md` §2 and §6, `spec/roles/professor.md`, `spec/roles/admin.md` and `spec/roles/parent.md` (each in full), `spec/data-model.md` §5 (every role's tables) and a new `spec/api.md` (every endpoint and its error cases) describe the back end, each new file with a row in "Where things are"

### T-JM-2 · API error format

- State: dropped: the error format is part of T-JM-4, which adds the first endpoints (owner decision, 2026-11-28)
- Areas: backend/
- Spec: docs/LARAVEL_PLAN.md §5, §7
- Done when: not done

### T-JM-3 · Database schema and seed data

- State: proposed
- Areas: backend/ (database/, app/Models/)
- Spec: docs/LARAVEL_PLAN.md §3 (data-model notes), §8; spec/data-model.md §5; spec/roles/
- Done when: migrations (made with `php artisan make:model <Name> -m`, never in Workbench), models and seeders cover every table in `spec/data-model.md`, the roles' tables included; the seeders are written fresh from `frontend/src/services/db.json`; `php artisan migrate:fresh --seed` runs on Laragon's MySQL (`webdev2`)

### T-JM-4 · Accounts, sign-in and roles

- State: proposed
- Areas: backend/ (auth)
- Spec: docs/LARAVEL_PLAN.md §1.6, §4 (B3), §7; F1, F15; spec/api.md; replaces T-11 and T-13
- Done when: register, sign in and sign out work through Sanctum's SPA cookie auth with hashed passwords; every user has a role; policies let only the right people read and write each record, and the tests try every role against every kind of record (OWASP A01:2025, Broken Access Control); every API error (401, 403, 404, 419, 422, 500) comes back in the one format `spec/api.md` gives, and a 500 shows no details outside Laravel's log; Pest tests cover each

### T-JM-5 · Student endpoints

- State: proposed
- Areas: backend/
- Spec: spec/api.md; spec/grading-rules.md §4 (ranges to check); docs/LARAVEL_PLAN.md §8
- Done when: every endpoint the student screens need (subjects, enrolments, tasks and scores, rules, targets, sandbox settings and drafts, Settings) exists as `spec/api.md` describes, through Eloquent with no raw SQL, with its input validated and Pest tests. Built one resource at a time; split into one task per resource once the spec exists

### T-JM-6 · The React app uses the API

- State: proposed
- Areas: shared (frontend/src/services/, frontend/src/hooks/useDb.js), then each screen's area
- Spec: docs/LARAVEL_PLAN.md §2, §7; spec/api.md
- Done when: one area at a time, `src/services/` calls the API through Axios (`withCredentials`, `withXSRFToken`) instead of `localStorage`, and every screen shows loading and error states as `spec/api.md` describes; loading states follow one convention: shadcn's `Skeleton` for layouts whose shape is known (tables, cards, charts) and a pending button or spinner for actions, checked against the full NN/g skeleton-screens article; the `localStorage` storage is removed once the last area has moved. Split into one task per area once the spec exists

### T-JM-7 · Bring over browser data

- State: dropped: a fresh start with seeders from db.json, no browser data to import (owner decision, 2026-11-28)
- Areas: shared (src/services/), backend/
- Spec: docs/LARAVEL_PLAN.md §1.5, §4 (B4)
- Done when: not done

### T-JM-8 · Switch over to the back end

- State: proposed
- Areas: hosting (frontend/vercel.json, backend/ Docker files), docs/
- Spec: docs/LARAVEL_PLAN.md §1.6, §4 (B2), §5 step 9
- Done when: the React app is on Vercel (Root Directory `frontend`) with rewrites for `/api/*` and `/sanctum/*` to the API and then an SPA catch-all, and `x-vercel-enable-rewrite-caching: 0` on `/api/*`; `vercel.json` also sets security headers: a `Content-Security-Policy` (with `frame-ancestors`), `X-Content-Type-Options: nosniff` and a `Referrer-Policy`, where the CSP's `style-src` allows shadcn's chart `<style>` and the inline accent-colour variables (`'unsafe-inline'` or hashes, decided in this task); the API runs with `APP_DEBUG=false` and `php artisan optimize` on every deploy (OWASP A02:2025, Security Misconfiguration); the API runs on Render in Docker (`rootDir` `backend`) with TiDB Cloud; every screen passes `docs/BEHAVIOUR_CHECKLIST.md`; `localStorage` holds only per-browser settings (such as the sidebar state). Needs the owner's TiDB, Render and Vercel accounts first

### T-JM-16 · Back-end spec drafts

- State: todo
- Areas: docs/proposals/
- Spec: docs/LARAVEL_PLAN.md §3, §4, §6, §7; SPEC.md; spec/. After T-JM-14
- Done when: drafts in `docs/proposals/` cover the scope (`SPEC.md` §2 and §6), the professor, administrator and parent role specs in full, the database tables for `spec/data-model.md` §5 (every role's), and `spec/api.md` (every endpoint, who may call it, what it accepts, and its error cases). The `spec/api.md` draft also says how the React app calls the API (a request is cancelled when its screen closes, a form can't be submitted twice, network errors can be retried) and which Laravel practices the API follows (rate-limited sign-in, Form Requests for validation, API Resources for responses, pagination, eager loading against N+1 queries). Each draft starts with its open questions, each with a recommended answer. Among them: B5; what the student sees while a sleeping host wakes up (a free host can take about a minute: a "Starting the server…" state, a longer timeout and an automatic retry); where uploaded files such as profile photos are kept, since a host's disk can be wiped on every redeploy (a size-limited database column, or a file-storage service); and dates (stored in UTC, shown in Manila time, UTC+8, sent as ISO 8601). Nothing in `SPEC.md` or `spec/` changes: T-JM-1 writes the approved drafts there

### T-JM-17 · Backend scaffold

- State: todo
- Areas: backend/, tooling (.github/, frontend/vite.config.js), docs/DEVELOPER_GUIDE.md, docs/TEAM_WORKFLOW.md §4, AGENTS.md §4–5
- Spec: docs/LARAVEL_PLAN.md §1, §5 step 2, §8. After T-JM-14
- Done when: `composer create-project laravel/laravel:^12.0 backend` and `php artisan install:api` give a Laravel 12 API in `backend/` that runs on Laragon with `DB_DATABASE=webdev2` (no tables or endpoints of our own yet; `.env` is not committed, `.env.example` is); Pest runs, and `./vendor/bin/pint --test` passes; CI gets a back-end job next to the React one; the Vite dev server's `server.proxy` sends `/api` and `/sanctum` to `127.0.0.1:8000`; CI also runs `npm audit` and `composer audit`, and `.github/dependabot.yml` checks npm, Composer and GitHub Actions (OWASP A03:2025, Software Supply Chain Failures); `docs/DEVELOPER_GUIDE.md` explains the back-end setup (Laragon, not Herd) and warns that every `VITE_*` variable is bundled into the browser's code, so the front end holds no keys; `docs/TEAM_WORKFLOW.md` §4 gets the `backend/` areas and `AGENTS.md` §4–5 the back-end stack and folders

### T-JM-26 · Database backup plan

- State: proposed
- Areas: docs/, backend/ (only if the plan needs a scheduled export)
- Spec: the hosted database's backup docs. TiDB Cloud Starter's free tier keeps automatic backups for 1 day, with no point-in-time restore
- Done when: a backup plan in `docs/` says what is backed up, how often, where the copies are kept (never in the repository) and how long, and how a restore is tested once; it is agreed with the owner before T-JM-8 switches over

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

### T-JM-27 · Data privacy review and privacy notice

- State: proposed
- Areas: docs/proposals/, then a privacy-notice page (its area set by the review)
- Spec: the Data Privacy Act of 2012 (RA 10173) and its IRR; NPC guidance for schools. Grades are likely sensitive personal information (a secondary source; to check against the law). Before the role workspaces (T-JM-9 to T-JM-11) and before any real user
- Done when: a review in `docs/proposals/`, checked against the primary sources and with the professor or UIC's data protection officer, says what the Act asks of CompUGrade: the lawful basis, a privacy notice, showing each role only what it needs, how a parent–student link is verified, and what happens after a breach. Then the notice's wording goes into `SPEC.md` through its protocol, and the app shows it

## accessibility

Built in the React app; it doesn't wait for the back end (`docs/ACCESSIBILITY_PLAN.md`). The
owner makes its decisions during implementation.

### T-JM-12 · Accessibility audit

- State: todo
- Areas: docs/
- Spec: docs/ACCESSIBILITY_PLAN.md §4
- Done when: a WCAG 2.2 AA review of all 14 screens is written up in `docs/`, with a proposed fix for each finding. It also checks whether focus moves to the new page and the scroll position resets after navigating (the declarative router has no `ScrollRestoration`), and whether form fields set `autocomplete` (`email`, `current-password`, `new-password`; WCAG 2.2 SC 1.3.5)

### T-JM-13 · Accessibility and reading preferences (F21)

- State: proposed
- Areas: settings, src/index.css (rule file), index.html (coordinate with T-16)
- Spec: docs/ACCESSIBILITY_PLAN.md; F21 in `spec/features.md` through the protocol
- Done when: to be specified with the owner, one option at a time

### T-JM-22 · A title for every page

- State: proposed
- Areas: frontend/src/pages/; coordinate with T-16 (the page title is branding, AGENTS.md §3)
- Spec: WCAG 2.2 SC 2.4.2 Page Titled (Level A); React's `<title>` docs (react.dev/reference/react-dom/components/title). Every screen today is titled "CompuGrade"
- Done when: each page renders its own `<title>` (for example "Grade Rules · CompuGrade"), with only one `<title>` rendered at once, in a pattern agreed with the owner and T-16; a test checks the titles

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

- State: done in PR #124
- Areas: shared (src/services/, src/hooks/, src/lib/), all screens
- Spec: owner request, 2026-11-13. The clean-up kept error handling as it was (feature freeze)
- Done when: a read-only review in `docs/` lists every place an error can happen (reading, parsing and saving `localStorage`, bad or old stored data, failed saves, invalid input that slips through, exceptions while rendering), what the student sees today, and a proposed fix for each. The fixes become separate tasks, each approved by the owner, because they change behaviour

### T-24 · Recover from unreadable stored data

- State: dropped: it only fixes `localStorage`; the back end starts with fresh data and there are no real users (owner decision, 2026-11-28)
- Areas: shared (src/services/db.js), auth
- Spec: docs/ERROR_HANDLING_REVIEW.md E1, E2, E3 (T-21); AUDIT §12. Changes what the student sees (F1, F15 in `SPEC.md`) and stored data (a backup key), so it needs LOCK-data and `SPEC.md` §5 through its protocol
- Done when: stored data that can't be used is copied to a backup key and the student sees a recovery screen with "Start again with fresh data" (after a confirmation) instead of the login page; upgraded data is still returned when its write-back fails; blocked storage gets its own message on the login page. Wording agreed with the owner

### T-25 · App-wide error boundary

- State: proposed
- Areas: src/app/ (in no area today; `App.jsx` is a rule file, TEAM_WORKFLOW.md §5), shared (a new component)
- Spec: docs/ERROR_HANDLING_REVIEW.md E6 (T-21); AUDIT §12. Its wording goes in `SPEC.md` through its protocol
- Done when: an exception while a screen renders shows a short message with "Reload" and "Go to the Dashboard" instead of a blank page, and the error is logged to the console

### T-28 · Plain-language save errors

- State: proposed
- Areas: shared (the helper) first, then layout, sandbox, subject-detail, term-records, subjects, grade-rules
- Spec: docs/ERROR_HANDLING_REVIEW.md E11–E14 (T-21); AUDIT §12. Wording goes in `SPEC.md` through its protocol. It touches six areas: one small shared PR for the helper, then one PR per area
- Done when: one helper in `src/services/` turns a save error into plain words and logs the details, and every save message uses it; Remove subject shows its error in the dialog; the sandbox and the Subject Detail target say so when the data can't be read; Current Term Records no longer says "sandbox changes"

### T-29 · Other tabs stay in sync

- State: dropped: it only fixes `localStorage`; the back end starts with fresh data and there are no real users (owner decision, 2026-11-28)
- Areas: shared (src/hooks/useDb.js)
- Spec: docs/ERROR_HANDLING_REVIEW.md E10 (T-21); AUDIT §12
- Done when: `useDb` also re-reads on the browser's `storage` event for `compugrade_db`, with a test

### T-JM-18 · Lazy-load the pages

- State: proposed
- Areas: frontend/src/app/ (in no area today; `App.jsx` is a rule file, TEAM_WORKFLOW.md §5)
- Spec: React's `lazy` docs (react.dev/reference/react/lazy). After T-JM-14 and T-25. The build today is one 1.1 MB JavaScript file (331 kB gzipped), and the login page downloads Recharts and every screen
- Done when: each page in `App.jsx` loads with `React.lazy` (named exports kept through `.then((m) => ({ default: m.X }))`) behind a `<Suspense>` fallback; a chunk that fails to load (for example after a new deploy) reaches T-25's error boundary with "Reload"; the login page no longer downloads Recharts; the build has no chunk over 500 kB; the size before and after is in the PR

### T-JM-19 · Smaller fonts that show text while loading

- State: proposed
- Areas: frontend/src/assets/, frontend/src/index.css (rule file)
- Spec: AGENTS.md §7 (Khand and General Sans only). After T-JM-14. Khand is a 347 kB TTF and General Sans Regular a 46 kB OTF; no `@font-face` sets `font-display`
- Done when: every font file is WOFF2 (from the font's own source where it ships one, or converted where its licence allows; the conversion tool is not added to `package.json`); every `@font-face` sets `font-display: swap`; the fonts look the same at all four widths; the sizes before and after are in the PR

### T-JM-20 · Empty states on every screen

- State: proposed
- Areas: shared (one pattern) first, then each screen's area, one PR per area
- Spec: SPEC.md §7 (UX principles); NN/g "Empty states in complex applications". Wording goes in `SPEC.md` through its protocol. Becomes urgent with the back end: a newly registered API account starts with no data on every screen
- Done when: every list and screen is checked for three cases (never had data, no results, failed to load), against the full NN/g article; each one says what's happening and offers the next step, using shadcn's `Empty`; a new account with no data is usable on every screen; the findings and the wording are agreed with the owner before the per-area PRs

### T-JM-21 · A "Not found" page

- State: proposed
- Areas: frontend/src/app/ (`App.jsx` is a rule file), frontend/src/pages/
- Spec: docs/LARAVEL_PLAN.md §7 (the 404 case). Its wording goes in `SPEC.md` through its protocol. Today unknown URLs quietly redirect to `/` (`App.jsx`, the `path="*"` route)
- Done when: an unknown URL shows a "Not found" page with a way back (the Dashboard when signed in, the login page otherwise), and the same page is used when the API answers 404 for a record

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

### T-31 · Note on testing security features over HTTP

- State: todo
- Areas: docs/DEVELOPER_GUIDE.md
- Spec: docs/ERROR_HANDLING_REVIEW.md E20 (T-21); AUDIT §12. Docs only
- Done when: `docs/DEVELOPER_GUIDE.md` §6 says the password and verification features need HTTPS or `localhost`, so they don't work when the dev server is opened by its network address on a phone

### T-JM-14 · Move the React app into frontend/

- State: todo
- Areas: everything (the whole React app moves), tooling, .claude/, AGENTS.md §4–5, docs/TEAM_WORKFLOW.md §4, README.md, docs/DEVELOPER_GUIDE.md
- Spec: docs/LARAVEL_PLAN.md §1.3, §5 step 1. First of the back-end tasks
- Done when: the React app (`src/`, `public/`, `index.html`, `package.json`, `package-lock.json`, the Vite, ESLint, Prettier and `components.json` configs, `scripts/`) is in `frontend/` in one moves-only commit; a second commit fixes the paths in CI, `.claude/`, `AGENTS.md` §4–5, `docs/TEAM_WORKFLOW.md` §4, the README and `docs/DEVELOPER_GUIDE.md`, and adds Axios to `AGENTS.md` §4's approved list; docs, the spec, `AGENTS.md`, `CLAUDE.md`, `.claude/` and `.github/` stay at the root; lint, format check, build, tests and screenshots run from `frontend/`. Do it when no other task branch is open, because the move touches every file

### T-JM-15 · Code Defense Guide

- State: todo
- Areas: docs/defense/, .claude/skills/defense-update/
- Spec: owner decision, 2026-11-27 (the CC013.23 Code Defense standard; docs/LARAVEL_PLAN.md §8). No spec change. After T-JM-14
- Done when: `docs/defense/` has a README (a status table and who owns what), `architecture.md` (the three tiers mapped to real files), `features/<feature>.md` (one per feature folder, plus the grade maths in `src/lib/`), `glossary.md`, `ai-log.md` and `rehearsal/<prelim|midterm|final>.md`. Each chapter records "Last checked against: <sha>" and "Covers: <paths>", and follows the template: what it does, where the code is, an end-to-end trace of one action, decisions and why, likely questions with bullet-point answers, security and QA notes, AI provenance, and a self-check. Every claim links to the file it describes. A Claude Code skill in `.claude/skills/defense-update/` updates the guide when a major feature is merged or a defense is 1–2 weeks away

### T-JM-23 · End-to-end tests with Playwright

- State: blocked: approved by the owner (2026-11-28); waits for the React app to use the API (T-JM-6)
- Areas: tooling (a Playwright test folder, `.github/`)
- Spec: CC013.23 (Playwright E2E, CO2); docs/BEHAVIOUR_CHECKLIST.md. Playwright is already approved (AGENTS.md §4)
- Done when: Playwright tests cover the main flows against the local API (register, sign in, add a subject, enter a score, see the grade change, sign out), run in CI next to the other checks, and cover the checklist items that can be automated

### T-JM-24 · Performance budget in CI

- State: blocked: approved by the owner (2026-11-28); waits for T-JM-18, T-JM-19 and the API (T-JM-6)
- Areas: tooling (`scripts/`, `.github/`)
- Spec: web.dev Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1); the numbers from T-JM-25
- Done when: CI fails when the main JavaScript chunk or the total font size grows past a budget the owner sets from T-JM-25's numbers, using a script with no new dependency; Lighthouse CI is added only if the owner approves it as a dependency

### T-JM-25 · Measure load performance

- State: proposed
- Areas: docs/
- Spec: web.dev Core Web Vitals. Read-only. The figures so far come only from `npm run build`; no load time has been measured
- Done when: LCP, INP and CLS are measured with Lighthouse in Chrome DevTools (no new dependency) on `npm run preview` at 375 and 1440 wide, for the login page, the Dashboard and Subject Detail, before and after T-JM-18 and T-JM-19, and written up in `docs/` with the budget to propose for T-JM-24

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

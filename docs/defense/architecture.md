# Architecture

- Last checked against: `5e64e03`
- Covers: `frontend/src/app/`, `frontend/src/services/`, `frontend/src/hooks/`, `frontend/src/components/layout/`, `frontend/vite.config.js`, `frontend/vercel.json`, `.github/workflows/ci.yml`
- Owner: everyone (see [README](README.md#who-owns-what))

Everyone must be able to give this chapter's trace without notes.

## 1. What it does

- CompUGrade is a **React + Vite single-page app**. Today it has **no back end**: all data lives
  in the browser's `localStorage` (`SPEC.md` §2, "All data stays in the browser").
- The course's target is three tiers: **React → Laravel REST API → MySQL**. Only the first tier is
  built. The Laravel API and MySQL are planned in `docs/LARAVEL_PLAN.md` and on the board
  (T-JM-17 scaffold, T-JM-3 database, T-JM-4 accounts, T-JM-5 endpoints, T-JM-6 switch-over).

### The three tiers, as a restaurant

| Restaurant | Course tier | In CompUGrade today | Planned |
| --- | --- | --- | --- |
| Dining room: menu, tables, what the customer sees | **Presentation** (React) | Pages and components in [`frontend/src/`](../../frontend/src/) | Stays |
| Waiter: takes the order to the kitchen, brings the dish back | **HTTP / JSON** (Axios) | No waiter yet: [services/db.js](../../frontend/src/services/db.js) reads and writes `localStorage` directly | Axios calls from `frontend/src/services/` (`docs/LARAVEL_PLAN.md` §1 item 7) |
| Kitchen: checks the order, decides what may be served | **Application / API** (Laravel) | Not built | `backend/`, Laravel 12, Sanctum (T-JM-17, T-JM-4) |
| Pantry: where the ingredients are kept | **Data** (MySQL) | The browser's `localStorage` key `compugrade_db` ([db.js:4](../../frontend/src/services/db.js#L4)) | MySQL `webdev2` through migrations (T-JM-3) |

- One thing stays in the dining room on purpose: the **grade maths** (the recipe for a grade)
  runs in the browser, in [`frontend/src/lib/`](../../frontend/src/lib/) (`docs/LARAVEL_PLAN.md`
  §1 item 4). The kitchen will store and check the ingredients (rules and scores).

## 2. Where the code is

| Layer | Folder | Rule |
| --- | --- | --- |
| Start-up and routes | [app/](../../frontend/src/app/) | `main.jsx` seeds data; `App.jsx` holds every route |
| Pages | [pages/](../../frontend/src/pages/) | Pages only compose (`AGENTS.md` §5) |
| Features | [features/](../../frontend/src/features/) | One folder per feature: its components, hooks and logic |
| Shared UI | [components/](../../frontend/src/components/) | `ui/` is shadcn/ui; `layout/` is the page shell |
| Grade maths | [lib/](../../frontend/src/lib/) | Pure functions, no React, no storage ([grade-maths.md](features/grade-maths.md)) |
| Data access | [services/](../../frontend/src/services/) | The only code that touches `localStorage` for the database |
| Shared hooks | [hooks/](../../frontend/src/hooks/) | `useDb` turns the database into React state |

What is stored in the browser:

| `localStorage` key | Holds | Code |
| --- | --- | --- |
| `compugrade_db` | The whole database: users, rules, subjects, classes, records | [db.js:4](../../frontend/src/services/db.js#L4) |
| `activeUserId` | Who is signed in | [session.js:5](../../frontend/src/services/session.js#L5) |
| `compugrade-account` | The Settings account and its password hash | [localAccountStore.js:1](../../frontend/src/services/localAccountStore.js#L1) |
| `compugrade-sidebar-minimized` | Whether the sidebar is minimized | [useSidebarState.js:14](../../frontend/src/hooks/useSidebarState.js#L14) |
| `compugrade_rule_thumbnail` | Bar, pie or table preview on Grade Rules | [GradeRules.jsx:17](../../frontend/src/pages/student/GradeRules.jsx#L17) |

## 3. Trace: opening the app, then saving a score

**Start-up**

1. [main.jsx:7-8](../../frontend/src/app/main.jsx#L7-L8) calls `initializeDatabase()` before React renders.
2. [db.js:11-24](../../frontend/src/services/db.js#L11-L24): if `compugrade_db` is empty, copy the seed
   [db.json](../../frontend/src/services/db.json) into it; otherwise read it once so older data is upgraded.
3. [main.jsx:10-14](../../frontend/src/app/main.jsx#L10-L14) renders `<App />` inside `StrictMode`.

**Opening `/student/dashboard`**

4. [App.jsx:48-55](../../frontend/src/app/App.jsx#L48-L55) matches the route and wraps the page in `RequireStudent`.
5. [RequireStudent.jsx:9-15](../../frontend/src/app/RequireStudent.jsx#L9-L15): no signed-in student →
   redirect to `/`, remembering the page asked for; otherwise render the page inside the sidebar provider.
6. [session.js:17-22](../../frontend/src/services/session.js#L17-L22): a student is signed in only
   when `activeUserId` names a user whose role is `student`.
7. The page calls [useDb](../../frontend/src/hooks/useDb.js#L8-L19), which holds `getDb()` as React state.
8. The page passes the data to pure functions in `lib/` (for example `getEnrolledSubjects`) and renders.

**Saving a score** (full detail in [term-records.md](features/term-records.md))

9. A component builds a new database object with a pure helper, for example
   [records.js:6-20](../../frontend/src/services/records.js#L6-L20).
10. [db.js:50-53](../../frontend/src/services/db.js#L50-L53) `saveDb` writes it and fires the
    `compugrade-db-updated` window event.
11. Every `useDb()` with `live: true` hears the event and re-reads
    ([useDb.js:11-16](../../frontend/src/hooks/useDb.js#L11-L16)), so the gauges, tables and charts
    on the page update.

## 4. Decisions and why

- **One database object in one key**, read and written whole ([db.js:29-53](../../frontend/src/services/db.js#L29-L53)).
  - Why: simple for a prototype; every change is "build a new object, save it".
  - Cost: two open tabs don't see each other's saves. T-29 (re-read on the `storage` event) was
    dropped, because the back end replaces `localStorage` (owner decision, 2026-11-28).
- **A window event instead of a state library** ([db.js:5](../../frontend/src/services/db.js#L5), [useDb.js](../../frontend/src/hooks/useDb.js)).
  - Why: every component that reads the database refreshes after any save, with no extra
    dependency (`AGENTS.md` §4: no state library).
  - `live: false` is for editors that must not be refreshed under the user's typing
    ([useDb.js:1-4](../../frontend/src/hooks/useDb.js#L1-L4)).
- **Schema version and migrations** ([migrations.js:8](../../frontend/src/services/migrations.js#L8), [migrations.js:62-71](../../frontend/src/services/migrations.js#L62-L71)).
  - Why: browsers that saved the old format keep working after the format changes.
  - The upgrade is saved only if it succeeds; on failure the stored copy is kept
    ([db.js:37-44](../../frontend/src/services/db.js#L37-L44)).
- **Every student route is guarded in one place** ([RequireStudent.jsx](../../frontend/src/app/RequireStudent.jsx)),
  and unknown URLs go to `/` ([App.jsx:117-118](../../frontend/src/app/App.jsx#L117-L118)).
- **Phase 2 routes are kept commented out** ([App.jsx:17-28](../../frontend/src/app/App.jsx#L17-L28),
  [App.jsx:104-115](../../frontend/src/app/App.jsx#L104-L115)): owner decision, Gate 0 (`AGENTS.md` §6).
  The pages they import don't exist.
- **Sidebar state is a tiny external store** with `useSyncExternalStore`
  ([useSidebarState.js:27-56](../../frontend/src/hooks/useSidebarState.js#L27-L56)).
  - Why: every page shares it and it survives navigation without a context provider per page.
- **`@/` import alias** ([vite.config.js:7-12](../../frontend/vite.config.js#L9-L15)): no `../../..` chains.
- **Vercel serves `index.html` for every path** ([vercel.json](../../frontend/vercel.json)), so a
  refresh on `/student/rules` still loads the app; React Router then picks the page.

## 5. Likely questions

**"Where is your back end?"**
- There isn't one yet; Phase 1 keeps all data in the browser (`SPEC.md` §2)
- `services/` is the seam: today it talks to `localStorage`, later to the Laravel API through Axios
- Plan and order: `docs/LARAVEL_PLAN.md` §1 and §5

**"How does a page know the data changed?"**
- `saveDb` fires `compugrade-db-updated` ([db.js:52](../../frontend/src/services/db.js#L52))
- `useDb` listens and re-reads ([useDb.js:13-15](../../frontend/src/hooks/useDb.js#L13-L15))
- The listener is removed on unmount (the effect's cleanup)

**"How do you stop someone who isn't signed in?"**
- `RequireStudent` on every route except `/` ([App.jsx](../../frontend/src/app/App.jsx))
- It is a client-side check only: it hides pages, it doesn't protect data. The data is already
  in the browser. Real protection needs the API (T-JM-4: Sanctum and policies)

**"What happens if `localStorage` is blocked or full?"**
- `getDb` returns `null` instead of throwing ([db.js:41-44](../../frontend/src/services/db.js#L41-L44)); pages show a message
- `saveDbSafely` returns `{ ok: false, error }` ([db.js:59-66](../../frontend/src/services/db.js#L59-L66))
- Some callers still use plain `saveDb` with their own `try`/`catch`; making the messages plain is board task T-28

**"Why is there a schema version?"**
- Stored data outlives the code; v1 rules had a fixed `hierarchy`, v2 has a `criteria` tree
  ([migrations.js:10-14](../../frontend/src/services/migrations.js#L10-L14))
- `AGENTS.md` §3: a stored-data change comes with a migration and a new `SCHEMA_VERSION`

**"What does StrictMode do here?"**
- In development, React renders and runs effects twice to expose side effects
- Our effects clean up after themselves (for example the `useDb` listener)

## 6. Security and QA notes

- **No secrets in the code.** There are no API keys today. The planned `.env` holds them and is
  never committed (`docs/LARAVEL_PLAN.md` §8).
- **Seed passwords are plain text in [db.json](../../frontend/src/services/db.json)** and are
  compared as plain text at sign-in. See [auth.md](features/auth.md) §6 (board task T-13).
- **Everything is visible to the user.** Any data in `localStorage` can be read and changed in
  DevTools. The route guard is a convenience, not security.
- **CI** runs lint, format check, build and tests on every pull request and on `main`
  ([ci.yml](../../.github/workflows/ci.yml)).
- **Tests:** [db.test.js](../../frontend/src/services/db.test.js),
  [migrations.test.js](../../frontend/src/services/migrations.test.js),
  [records.test.js](../../frontend/src/services/records.test.js),
  [useDb.test.jsx](../../frontend/src/hooks/useDb.test.jsx).

## 7. AI provenance

| Path | Commits (`--follow`) | With a Claude trailer | First commit |
| --- | --- | --- | --- |
| `app/App.jsx` | 17 | 8 | Jun Mari Manla, 2026-10-05 |
| `app/main.jsx` | 11 | 6 | Jun Mari Manla, 2026-10-05 |
| `app/RequireStudent.jsx` | 7 | 6 | Jun Mari Manla, 2026-10-25 |
| `services/db.js` | 12 | 6 | Jun Mari Manla, 2026-10-06 |
| `services/migrations.js` | 7 | 6 | Jun Mari Manla, 2026-10-25 |
| `services/session.js`, `records.js` | 5, 3 | 4, 3 | Jun Mari Manla |
| `hooks/useDb.js` | 2 | 2 | Jun Mari Manla, 2026-11-11 |
| `components/layout/Sidebar.jsx` | 49 | 19 | Jun Mari Manla, 2026-10-06 (also Lian Dumangas, 10) |

Method and limits: [ai-log.md](ai-log.md).

## 8. Self-check

- [ ] Draw the three tiers and say which one exists today.
- [ ] Give the start-up trace from `main.jsx` to the Dashboard without notes.
- [ ] Explain what `compugrade-db-updated` is for and who listens to it.
- [ ] Say what `RequireStudent` does and why it is not real security.
- [ ] Name the five `localStorage` keys and what each holds.
- [ ] Explain what happens to v1 data when the app starts.
- [ ] Say where Axios calls will go when the API exists, and why grade maths stays in the browser.

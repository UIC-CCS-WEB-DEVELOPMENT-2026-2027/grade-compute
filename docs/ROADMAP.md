# CompUGrade — Pre-Feature Roadmap

The job: finish everything that has to come before feature work, from the move into `frontend/`
to the deployed back end. `AGENTS.md` holds the standing rules, `docs/BOARD.md` the tasks, and
`docs/LARAVEL_PLAN.md` the back-end plan; this file holds the order of work.

**The idea:** automated tasks run first, and the owner's input is batched at checkpoints (✋),
because the owner is busy until the review sitting at CP3. Agents push their task branches; a
person opens every PR and the owner merges it.

**Status (2026-11-29):** Block A is done (A0 to A9, PRs #128 to #144). Next: CP3.

**The full order of work is in "The full order" below**, including the tasks added while Block A
ran. It is the one place to check what comes next. It can be archived when CP4 is finished.

---

## How every task works

- **One task, one session, one branch, one PR.** Start a new Claude Code session for each task
  and paste its prompt from this file. The prompt names the task, the branch and anything
  special.
- **Claim first.** The agent claims the task on `main` for `June-05` (`AGENTS.md` §8,
  `docs/TEAM_WORKFLOW.md` §3), then branches from that `main`. Branch names follow
  `<Lastname>_<type>-<short-name>`.
- **Before every commit:** lint, format check, build and tests pass. In `backend/`, Pest and
  `./vendor/bin/pint --test` pass too.
- **Push, don't open.** The agent pushes its branch and gives the PR link. It never opens,
  merges or closes a PR, and never pushes to `main` except the claim.
- **Stop and summarize** at the end of the task: what was done, what was found, what needs the
  owner's decision. The next task starts in a new turn.
- **Blocking questions wait for a checkpoint.** An agent that needs the owner's input writes the
  question down (in its summary, or at the top of its draft) and carries on with what doesn't
  depend on it.
- **The spec is protected.** No task in Block A edits `SPEC.md` or `spec/`. Spec changes happen
  at CP3, through `AGENTS.md` §2.

---

## The full order

Everything from CP3 to the deployed back end. After CP3, two tracks run side by side:

- **The back-end track** is one task at a time, in order.
- **The front-end track** can run beside it, because its areas (the React screens) don't
  overlap with B2 to B4. Its tasks finish before B5 moves the screens to the API, so the two
  don't edit the same screens at once.

Tasks marked *(CP3)* are `proposed`: the owner approves or rejects them at CP3, and their place
here is the recommendation. Prompts and branch names are in the sections below.

1. **✋ CP3:** the owner's review sitting, and T-JM-1 writes the spec.
2. **Straight after CP3, before B2:**
   - T-JM-29 · Back-end checks in the docs, so every Block B commit runs Pint and Pest.
   - T-JM-28 · Replace the placeholder bio, so B2's seeders never copy it.
   - T-JM-27 · Data privacy review *(CP3)*: the draft starts now. Anything it changes in what a
     role may see goes into the spec, through `AGENTS.md` §2, before B3 builds the policies.
3. **The back-end track:**
   1. B2 · Database (T-JM-3)
   2. B3 · Accounts (T-JM-4)
   3. B4 · Student endpoints (T-JM-5), one resource at a time
   4. T-JM-20 · Empty states on every screen *(CP3)*, before B5, so a new API account with no
      data is usable
   5. B5 · The React app uses the API (T-JM-6), one area at a time, with T-JM-21 · A "Not
      found" page *(CP3)* (the API's 404 uses it)
   6. B6 · Reading preferences (T-JM-13), after the accessibility tasks, so it builds on the
      fixed focus ring and text sizes
4. **The front-end track, alongside B2 to B4:**
   1. B1 · The remaining error fixes: T-25, T-28, T-30, T-26
   2. T-JM-25 · Measure load performance *(CP3)*: the "before" numbers come before T-JM-18
      and T-JM-19
   3. T-JM-30 · A visible focus ring: the token PR first, then the components
   4. T-JM-32 · Form purposes and linked score errors
   5. T-JM-33 · Layout fixes: the header-height token PR first, then the fixes
   6. T-JM-34 · Headings and small text
   7. T-JM-18 · Lazy-load the pages *(CP3)*, after T-25 (it needs the error boundary)
   8. T-JM-31 · Focus and scroll after changing page, after T-JM-18
   9. T-JM-19 · Smaller fonts *(CP3)*, then T-JM-25's "after" numbers
5. **After B5:**
   - T-JM-23 · Playwright end-to-end tests (approved; blocked until B5), written against the
     finished accessibility fixes
   - T-JM-24 · Performance budget in CI (approved; blocked until T-JM-18, T-JM-19 and B5)
6. **Before CP4:** T-JM-26 · Database backup plan *(CP3)*.
7. **✋ CP4:** hosting accounts, then T-JM-8 · deploy and switch over.

**Shared files set the order inside the front-end track** (`docs/TEAM_WORKFLOW.md` §5):

- `frontend/src/app/App.jsx` takes one change per PR, in this order: T-25 (error boundary),
  T-JM-18 (lazy pages), T-JM-31 (focus and scroll), T-JM-21 (Not found).
- A token in `frontend/src/index.css` goes in a small PR of its own, merged before the task
  that uses it (T-JM-30's ring colour, T-JM-33's header height).

**Outside this order:**

- T-JM-22 · A title for every page goes with T-16 (branding has its own branch; the owner
  schedules it).
- The role workspaces (T-JM-9 to T-JM-11), features and TLA 1: see "Not in this roadmap".

---

## Block A — automated

| Task | What | Board | Status |
| --- | --- | --- | --- |
| A0 | The `Lastname_type-short-name` branch rule | — | Done (PR #128) |
| A1 | `docs/LARAVEL_PLAN.md` and the T-JM tasks match the owner's decisions | T-JM-1 to T-JM-13 | Done (PR #129) |
| A2 | One board update: the error tasks T-23 to T-31, and the new T-JM-14 to T-JM-17 | — | Done (PR #130) |
| A3 | This file, and the push rule in `AGENTS.md` §8 | — | Done (this PR) |
| A4 | Move the React app into `frontend/` | T-JM-14 | Done (PR #134) |
| A5 | The Code Defense Guide and the `defense-update` skill | T-JM-15 | Done (PR #135) |
| A6 | The error fixes that need no owner input, and T-32 (owner decision, 2026-11-28) | T-27, T-23, T-31, T-32 | Done (PRs #138 to #141) |
| A7 | The backend scaffold | T-JM-17 | Done (PR #142) |
| A8 | The back-end spec drafts in `docs/proposals/` | T-JM-16 | Done (PR #143) |
| A9 | The accessibility audit (read-only) | T-JM-12 | Done (PR #144) |

---

## ✋ CP1 — merge Block A's docs (owner)

1. Open and merge the open board and docs branches, in the order the A3 summary gives.
2. Check that no other task branch is open: A4 moves every file, so any open branch would
   conflict with it.
3. Paste A4's prompt.

### A4 — Move the React app into `frontend/` (T-JM-14)

> Read `AGENTS.md`, `docs/ROADMAP.md` and T-JM-14 on `docs/BOARD.md`. Check that no other task
> branch is open (`git branch -r --no-merged origin/main`); if one is, stop and tell me. Claim
> T-JM-14 for June-05 on branch `Manla_refactor-frontend-folder`. Make two commits:
>
> 1. **Moves only** (`git mv`): the React app (`src/`, `public/`, `index.html`,
>    `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`,
>    `.prettierrc.json`, `.prettierignore`, `jsconfig.json`, `components.json`, `scripts/`,
>    `vercel.json`) into `frontend/`. Docs, the spec, `AGENTS.md`, `CLAUDE.md`, `README.md`,
>    `CHANGELOG.md`, `.claude/`, `.github/`, `.agents/`, `.codestudio/`, `.gitignore`,
>    `.gitattributes`, `.mcp.json` and `skills-lock.json` stay at the root. If another file
>    seems to belong to the app, ask.
> 2. **Paths:** fix every path the move broke: CI (`.github/`), `.claude/` (settings, hooks,
>    skills), `AGENTS.md` §4–5, `docs/TEAM_WORKFLOW.md` §4, the README and
>    `docs/DEVELOPER_GUIDE.md`. Add Axios to `AGENTS.md` §4's approved list (owner decision,
>    2026-11-27). Don't install it yet.
>
> From `frontend/`, lint, format check, build, tests and `npm run screenshots` must pass. List
> anything else that still names an old path (other docs, the board) in your summary rather
> than fixing it. Push the branch and stop with a summary.

---

## ✋ CP2 — merge the move (owner)

1. Merge A4. Everyone pulls `main` and runs `npm install` in `frontend/`.
2. Paste the prompts for A5 to A9, each in its own session. They can run side by side: their
   areas don't overlap, except that T-31 and T-JM-17 both touch `docs/DEVELOPER_GUIDE.md`
   (different sections). Merge T-31 first; T-JM-17 then merges `main` in.

### A5 — Code Defense Guide (T-JM-15)

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/LARAVEL_PLAN.md` §8 and T-JM-15 on
> `docs/BOARD.md`. Claim T-JM-15 for June-05 on branch `Manla_docs-defense-guide`. Write the
> first pass of `docs/defense/` exactly as the task's "Done when" describes, for the code as
> it is on `main`. Every claim links to the file and lines it describes; never describe code
> that isn't there. Answers to likely questions are bullet points, never prose to memorize.
> Then add the Claude Code skill `.claude/skills/defense-update/` with its two triggers:
> (A) a major feature was merged: update the chapters whose "Covers" paths changed since
> their "Last checked against" commit; (B) a defense is 1–2 weeks away: refresh every
> chapter and the matching `rehearsal/` file. Leave the "who owns what" column for me to fill
> in. Push the branch and stop with a summary.

### A6 — Error fixes with no owner input (T-27, T-23, T-31)

Three tasks, so three sessions, branches and PRs. Run them in this order.

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/ERROR_HANDLING_REVIEW.md` (E7, E8 and §4) and
> T-27 on `docs/BOARD.md`. Claim T-27 for June-05 on branch `Manla_fix-damaged-records`. Do
> what its "Done when" says, test-first: a failing test for each damaged shape, then the fix.
> Change nothing that a student with undamaged data would notice. Push the branch and stop
> with a summary.

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/ERROR_HANDLING_REVIEW.md` (E9, E15) and T-23 on
> `docs/BOARD.md`. Claim T-23 for June-05 on branch `Manla_fix-rule-pages-fresh-data`. Do
> what its "Done when" says. Start with a failing test for the review's case: remove a
> subject in the Sidebar, then press Duplicate on a rule. The failed-Duplicate message uses
> the same wording Grade Rules already shows; if it needs new wording, stop and ask. Push the
> branch and stop with a summary.

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/ERROR_HANDLING_REVIEW.md` (E20) and T-31 on
> `docs/BOARD.md`. Claim T-31 for June-05 on branch `Manla_docs-http-security-note`. Add the
> note its "Done when" describes to `docs/DEVELOPER_GUIDE.md` §6, and nothing else. Push the
> branch and stop with a summary.

### A7 — Backend scaffold (T-JM-17)

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/LARAVEL_PLAN.md` (§1, §5, §8) and T-JM-17 on
> `docs/BOARD.md`. Claim T-JM-17 for June-05 on branch `Manla_chore-backend-scaffold`. First
> check the local tools: Laragon's PHP (8.2+) and Composer (2.6+) must come first on PATH,
> not Herd's PHP 8.5; if they don't, stop and tell me how to fix it. Then do what the task's
> "Done when" says, starting with
> `composer create-project laravel/laravel:^12.0 backend` and `php artisan install:api`. No
> tables or endpoints of our own. `.env` is never committed. Keep the generated Laravel files
> in their own commit, separate from our changes. Push the branch and stop with a summary,
> including the exact setup steps a teammate follows on a fresh machine.

### A8 — Back-end spec drafts (T-JM-16)

> Read `AGENTS.md`, `SPEC.md` and every file in `spec/`, `docs/LARAVEL_PLAN.md`,
> `docs/ERROR_HANDLING_REVIEW.md`, `docs/ROADMAP.md` and T-JM-16 on `docs/BOARD.md`. Claim
> T-JM-16 for June-05 on branch `Manla_docs-backend-spec-drafts`. Write the drafts in
> `docs/proposals/` that the task's "Done when" lists: the scope, the professor,
> administrator and parent role specs in full, the database tables (every role's, in
> Laravel's naming), and `api.md`. Each draft starts with its open questions, each with a
> recommended answer and the reason. Write them as the spec would read once approved, so I
> can approve them change by change at CP3. Do not edit `SPEC.md` or `spec/`. Push the branch
> and stop with a summary that lists every open question in one place.

### A9 — Accessibility audit (T-JM-12)

> Read `AGENTS.md`, `docs/ACCESSIBILITY_PLAN.md`, `docs/ROADMAP.md` and T-JM-12 on
> `docs/BOARD.md`. Claim T-JM-12 for June-05 on branch `Manla_docs-accessibility-audit`.
> Read-only: change no code. Review all 14 screens against WCAG 2.2 AA at 375, 768, 1024 and
> 1440, using `npm run screenshots` and the code. Include what the task's "Done when" adds:
> focus and scroll after navigating, and `autocomplete` on form fields. Write it up in
> `docs/` with, for each finding, the success criterion, where it is, what a user meets, and
> a proposed fix. Push the branch and stop with a summary.

---

## ✋ CP3 — the owner's review sitting

A5 to A9 are merged. The sitting covers:

1. **The open questions:** the 37 in `docs/proposals/README.md` (B5 among them).
2. **The spec (T-JM-1):** the full scope, the three role specs in full, the data model and
   the API, written into `SPEC.md` and `spec/` one change at a time, each through `AGENTS.md`
   §2 in its two steps.
3. **The wording** for T-25, T-28 and T-30. It goes into `SPEC.md` later, in their own tasks.
4. **The photo size limit** for T-26 (D3 recommends resizing to 256 px with a 300 KB cap).
5. **The focus-ring colour** for T-JM-30 (the audit suggests `--primary`).
6. **The *(CP3)* tasks** in "The full order": approve or reject each, and confirm its place.

Paste this in a new session. If the session ends before everything is done, paste it again in
the next one: the recorded answers and `SPEC.md` §11 show where to resume.

> Read `AGENTS.md`, `SPEC.md` and every file in `spec/`, `docs/ROADMAP.md` (CP3 and "The full
> order"), `docs/LARAVEL_PLAN.md` §3, every draft in `docs/proposals/`, and T-JM-1 on
> `docs/BOARD.md`. This is CP3, my review sitting. Work in the four parts below, in order, and
> stop for my answer at every question. For this PR I approve changes to `docs/proposals/`,
> `docs/BOARD.md` and `docs/ROADMAP.md` as described below, outside T-JM-1's Areas.
>
> 1. **Claim.** If T-JM-1 isn't claimed yet, claim T-JM-1 and LOCK-spec for June-05 on `main`
>    as `docs/TEAM_WORKFLOW.md` §3 and §5 describe, then create the branch
>    `Manla_docs-backend-spec` from that `main`. If they are, check out the branch and resume
>    where the recorded answers and `SPEC.md` §11 stop.
> 2. **The open questions.** Take me through the 37 open questions in
>    `docs/proposals/README.md` one draft at a time, in the order of `docs/LARAVEL_PLAN.md` §3
>    (scope, professor, administrator, parent, data model, API). For each one, give the
>    question, your recommendation and its reason in a few lines, and say when the privacy
>    review (T-JM-27) could change the answer. After each draft, record my answers in
>    `docs/proposals/README.md`, change the draft wherever my answer differs from the
>    recommendation, and commit (`docs(proposals)`) and push, so nothing is lost.
> 3. **The other decisions.** Ask me one at a time: the wording for T-25, T-28 and T-30 (show
>    what the board and `docs/ERROR_HANDLING_REVIEW.md` propose); the photo size limit for
>    T-26; the focus-ring colour for T-JM-30; and, for each *(CP3)* task in "The full order",
>    approve or reject, and its place. Record them in a "CP3 decisions" section of
>    `docs/proposals/README.md`. Then, each in its own commit: approved tasks go from
>    `proposed` to `todo` and rejected ones to `dropped: <reason>` (`chore(board)`); the
>    approved wording, limit and colour go into those tasks' "Done when" (`docs(board)`); any
>    change to the order goes into `docs/ROADMAP.md` (`docs(roadmap)`).
> 4. **Into the spec.** Write the approved drafts into `SPEC.md` and `spec/` in the order
>    `docs/LARAVEL_PLAN.md` §3 gives: `SPEC.md` §2 and §6; `spec/roles/professor.md`,
>    `spec/roles/admin.md` and `spec/roles/parent.md` in full; `spec/data-model.md` §5;
>    `spec/api.md`. One change at a time (a section, small enough to read in one go), through
>    `AGENTS.md` §2: show the exact before and after and the reason; wait for my approval;
>    restate it in one sentence and ask "Confirm writing this to `<file>`?"; wait for my second
>    yes; then edit with the file-edit tool and add a dated line to `SPEC.md` §11. Each new
>    file gets its row in "Where things are". Commit and push after each confirmed change.
>
> Change nothing else. If the session is getting long, stop after a pushed commit and tell me
> where to resume. At the end, push the branch and stop with a summary: my answers, what was
> written to the spec, what's left, and what needs a decision. LOCK-spec is freed after the PR
> is merged, when I ask.

Block B and the front-end track don't start before these approvals.

---

## Block B — automated, after CP3

Each item is a task, or several small ones; each one runs from its own prompt. "The full order"
says when each runs: B1 is on the front-end track, B2 to B6 on the back-end track.

### B1 — The remaining error fixes (T-25, T-28, T-30, T-26)

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/ERROR_HANDLING_REVIEW.md` and `<task>` on
> `docs/BOARD.md`. Claim `<task>` for June-05 on branch `<branch>`. Do what its "Done when"
> says, with the wording I approved at CP3. Its `SPEC.md` change goes through `AGENTS.md` §2,
> two approvals, in the same PR. Push the branch and stop with a summary.

| Task | Branch | Notes |
| --- | --- | --- |
| T-25 | `Manla_feat-error-boundary` | `App.jsx` is a rule file (`docs/TEAM_WORKFLOW.md` §5) |
| T-28 | `Manla_feat-save-error-helper`, then `Manla_fix-save-errors-<area>` | The shared helper first, in its own PR; then one PR per area |
| T-30 | `Manla_fix-target-range-message` | `SPEC.md` §4 changes |
| T-26 | `Manla_fix-settings-photo-upload` | The size limit from CP3 |

### B2 — Database (T-JM-3)

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/LARAVEL_PLAN.md` (§3, §8), `spec/data-model.md`
> §5, the files in `spec/roles/` and T-JM-3 on `docs/BOARD.md`. Claim T-JM-3 for June-05 on
> branch `Manla_feat-database-schema`. Create every table in `spec/data-model.md` through
> migrations only (`php artisan make:model <Name> -m`), with models and seeders written fresh
> from `frontend/src/services/db.json`. No raw SQL. `php artisan migrate:fresh --seed` must
> run on Laragon's MySQL (`webdev2`). Pest and `pint --test` pass. Push the branch and stop
> with a summary.

### B3 — Accounts (T-JM-4)

> Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/LARAVEL_PLAN.md` (§1.6, §7), `spec/api.md` and
> T-JM-4 on `docs/BOARD.md`. Claim T-JM-4 for June-05 on branch `Manla_feat-accounts`.
> Register, sign in and sign out through Sanctum's SPA cookie auth, hashed passwords, a role
> on each user, policies, and the one error format every endpoint returns, as `spec/api.md`
> describes. The Pest tests try every role against every kind of record. Push the branch and
> stop with a summary.

### B4 — Student endpoints (T-JM-5), one resource at a time

> Read `AGENTS.md`, `docs/ROADMAP.md`, `spec/api.md`, `spec/grading-rules.md` §4 and T-JM-5
> on `docs/BOARD.md`. Claim `<the task for this resource>` for June-05 on branch
> `Manla_feat-api-<resource>`. Build the `<resource>` endpoints exactly as `spec/api.md`
> describes, through Eloquent, with Form Requests for validation, API Resources for
> responses, and Pest tests for each endpoint and each error case. Push the branch and stop
> with a summary.

The order follows `spec/api.md`; the first T-JM-5 PR splits T-JM-5 into one board task per
resource (the owner approves that board edit).

### B5 — The React app uses the API (T-JM-6), one area at a time

> Read `AGENTS.md`, `docs/ROADMAP.md`, `spec/api.md`, `docs/LARAVEL_PLAN.md` §2 and §7 and
> T-JM-6 on `docs/BOARD.md`. Claim `<the task for this area>` for June-05 on branch
> `Manla_feat-api-<area>`. Move the `<area>` screens from `localStorage` to the API through
> `frontend/src/services/` and Axios (`withCredentials`, `withXSRFToken`), with the loading,
> error and empty states `spec/api.md` and T-JM-6 describe. Grade maths stays in
> `frontend/src/lib/`. Check each screen at 375, 768, 1024 and 1440. Push the branch and stop
> with a summary.

The shared part (`frontend/src/services/`, `useDb`) goes first, in its own PR. The last area's PR
removes the `localStorage` storage.

### B6 — Reading preferences (T-JM-13)

> Read `AGENTS.md`, `docs/ACCESSIBILITY_PLAN.md`, `docs/ROADMAP.md`, the A9 audit and T-JM-13
> on `docs/BOARD.md`. Claim T-JM-13 for June-05 on branch `Manla_feat-reading-preferences`.
> Propose the first option only, with its F21 text for `spec/features.md`, and stop for my
> decision before building it.

### The added tasks

The tasks added while Block A ran, each run from this prompt when "The full order" reaches it:

> Read `AGENTS.md`, `docs/ROADMAP.md`, the files the task's "Spec" line names, and `<task>` on
> `docs/BOARD.md`. Claim `<task>` for June-05 on branch `<branch>`. Do what its "Done when"
> says, with the decisions I made at CP3, test-first where there is logic to test. Any
> `SPEC.md` change goes through `AGENTS.md` §2, two approvals, in the same PR. Check every
> screen it touches at 375, 768, 1024 and 1440. If it needs a decision I haven't made, a file
> outside its Areas or a new dependency, stop and ask. Push the branch and stop with a summary.

| Task | Branch | Notes |
| --- | --- | --- |
| T-JM-29 | `Manla_docs-backend-checks` | Docs only |
| T-JM-28 | `Manla_fix-default-bio` | Before B2 |
| T-JM-27 | `Manla_docs-privacy-review` | From the primary sources; the owner checks the review with the professor or UIC's data protection officer |
| T-JM-25 | `Manla_docs-load-performance` | Read-only. The "after" numbers follow T-JM-19 |
| T-JM-30 | `Manla_style-focus-ring-token`, then `Manla_fix-focus-ring` | The ring colour from CP3 |
| T-JM-32 | `Manla_fix-form-purposes` | |
| T-JM-33 | `Manla_style-header-height-token`, then `Manla_fix-layout-a11y` | Also check at 320 |
| T-JM-34 | `Manla_fix-headings-small-text` | |
| T-JM-18 | `Manla_feat-lazy-pages` | After T-25. `App.jsx` |
| T-JM-31 | `Manla_fix-route-focus-scroll` | After T-JM-18. `App.jsx` |
| T-JM-19 | `Manla_chore-woff2-fonts` | No conversion tool in `frontend/package.json` |
| T-JM-20 | `Manla_feat-empty-states` | Before B5. The findings and wording are agreed with the owner before building |
| T-JM-21 | `Manla_feat-not-found-page` | With B5. `App.jsx` |
| T-JM-23 | `Manla_test-e2e-playwright` | After B5 |
| T-JM-24 | `Manla_chore-performance-budget` | After T-JM-18, T-JM-19 and B5; the owner sets the budget from T-JM-25 |
| T-JM-26 | `Manla_docs-backup-plan` | Before CP4 |

---

## ✋ CP4 — hosting accounts (owner)

1. Create the TiDB Cloud, Render and Vercel accounts, and give the agent what it needs through
   `.env` files and the hosts' dashboards, never in the repository.
2. Approve the database backup plan (T-JM-26) if it was approved at CP3.
3. Paste:

   > Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/LARAVEL_PLAN.md` (§1.6, §4 B2) and T-JM-8 on
   > `docs/BOARD.md`. Claim T-JM-8 for June-05 on branch `Manla_chore-deploy`. Deploy as its
   > "Done when" says: the React app on Vercel with the rewrites, caching off on `/api/*` and
   > the security headers; the API on Render in Docker with TiDB Cloud, `APP_DEBUG=false` and
   > `php artisan optimize`. Walk through `docs/BEHAVIOUR_CHECKLIST.md` on the deployed site.
   > Tell me each step I have to do in a dashboard, and wait for me. Push the branch and stop
   > with a summary.

Render is the host for now. Azure (the owner's student subscription) is an option for later,
once Mr. Cister confirms it is accepted for the final cloud demo.

---

## Not in this roadmap

- **TLA 1** is the owner's own coursework: any time, and agents don't fill it in unless asked.
- **Features** come after Block B, from `docs/BOARD.md`.
- **The role workspaces** (T-JM-9 to T-JM-11) come after the switch-over, each split into
  smaller tasks from its spec.

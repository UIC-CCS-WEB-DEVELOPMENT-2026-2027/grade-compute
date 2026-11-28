# CompUGrade — Pre-Feature Roadmap

The job: finish everything that has to come before feature work, from the move into `frontend/`
to the deployed back end. `AGENTS.md` holds the standing rules, `docs/BOARD.md` the tasks, and
`docs/LARAVEL_PLAN.md` the back-end plan; this file holds the order of work.

**The idea:** automated tasks run first, and the owner's input is batched at checkpoints (✋),
because the owner is busy until the review sitting at CP3. Agents push their task branches; a
developer opens and merges every PR.

**Status (2026-11-28):** A0 to A3 are done (PRs #128 to #130, and this file). Next: CP1.

It can be archived when Block B is finished.

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

## Block A — automated

| Task | What | Board | Status |
| --- | --- | --- | --- |
| A0 | The `Lastname_type-short-name` branch rule | — | Done (PR #128) |
| A1 | `docs/LARAVEL_PLAN.md` and the T-JM tasks match the owner's decisions | T-JM-1 to T-JM-13 | Done (PR #129) |
| A2 | One board update: the error tasks T-23 to T-31, and the new T-JM-14 to T-JM-17 | — | Done (PR #130) |
| A3 | This file, and the push rule in `AGENTS.md` §8 | — | Done (this PR) |
| A4 | Move the React app into `frontend/` | T-JM-14 | After CP1 |
| A5 | The Code Defense Guide and the `defense-update` skill | T-JM-15 | After CP2 |
| A6 | The error fixes that need no owner input | T-27, T-23, T-31 | After CP2 |
| A7 | The backend scaffold | T-JM-17 | After CP2 |
| A8 | The back-end spec drafts in `docs/proposals/` | T-JM-16 | After CP2 |
| A9 | The accessibility audit (read-only) | T-JM-12 | After CP2 |

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

Merge A5 to A9 as they finish. Then, in one sitting:

1. **Answer the open questions** at the top of each A8 draft (B5 among them).
2. **Approve the spec changes (T-JM-1).** Each one goes through `AGENTS.md` §2 in its two
   steps. Paste:

   > Read `AGENTS.md` and `docs/ROADMAP.md`, the drafts in `docs/proposals/` with my answers,
   > and T-JM-1 on `docs/BOARD.md`. Claim T-JM-1 for June-05 on branch
   > `Manla_docs-backend-spec`. Write the approved drafts into `SPEC.md` and `spec/` in the
   > order `docs/LARAVEL_PLAN.md` §3 gives, one change at a time, through the protocol in
   > `AGENTS.md` §2: propose, wait for my approval, confirm, wait for my second yes, then
   > edit and log it in `SPEC.md` §11. Push the branch and stop with a summary.

3. **Approve the wording** for T-25, T-28 and T-30. They go into `SPEC.md` through the same
   protocol, in their own tasks.
4. **Decide the photo size limit** for T-26.
5. **Approve or reject the proposed web-practice tasks** (T-JM-18 to T-JM-22 and T-JM-25 to
   T-JM-27) and say where each one fits (see "Also on the board" below).

Block B doesn't start before these approvals.

---

## Block B — automated, after CP3

In this order. Each item is a task, or several small ones; each one runs from its own prompt.

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

The shared part (`src/services/`, `useDb`) goes first, in its own PR. The last area's PR
removes the `localStorage` storage.

### B6 — Reading preferences (T-JM-13)

> Read `AGENTS.md`, `docs/ACCESSIBILITY_PLAN.md`, `docs/ROADMAP.md`, the A9 audit and T-JM-13
> on `docs/BOARD.md`. Claim T-JM-13 for June-05 on branch `Manla_feat-reading-preferences`.
> Propose the first option only, with its F21 text for `spec/features.md`, and stop for my
> decision before building it.

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

## Also on the board

Added on 2026-11-28 from the web-practices research. They need the owner's approval at CP3,
and their place in the order is decided there. Recommended:

| Task | What | Recommended place |
| --- | --- | --- |
| T-JM-25 | Measure load performance (read-only) | With Block B1; its numbers come before T-JM-18 and T-JM-19 |
| T-JM-18 | Lazy-load the pages | After T-25 (it needs the error boundary) |
| T-JM-19 | WOFF2 fonts with `font-display` | Any time after CP3 |
| T-JM-20 | Empty states on every screen | Before B5, so new API accounts have them |
| T-JM-21 | A "Not found" page | With B5 (the API's 404 uses it) |
| T-JM-22 | A title for every page | With T-16 (branding) |
| T-JM-26 | Database backup plan | Before CP4 |
| T-JM-27 | Data privacy review and privacy notice | Its review as early as possible, because it can change the role specs; before the role workspaces and any real user |
| T-JM-23 | Playwright end-to-end tests (approved, blocked) | After B5 |
| T-JM-24 | Performance budget in CI (approved, blocked) | After T-JM-18, T-JM-19 and B5 |

---

## Not in this roadmap

- **TLA 1** is the owner's own coursework: any time, and agents don't fill it in unless asked.
- **Features** come after Block B, from `docs/BOARD.md`.
- **The role workspaces** (T-JM-9 to T-JM-11) come after the switch-over, each split into
  smaller tasks from its spec.

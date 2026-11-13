# CompUGrade — Team Workflow

How several developers work on different features at the same time without stepping on each
other. The to-do tracker is [`docs/BOARD.md`](BOARD.md).

## 1. The idea in one paragraph

Merge conflicts come from two people changing the same lines at the same time. So: **claim before
you code**, so two people never pick the same task; **stay in your area**, so two tasks rarely touch
the same files; **lock the few files everyone shares**; and **keep branches short**, so there is
little time for them to drift apart.

## 2. The board

`docs/BOARD.md` holds every task. A task is a small block:

```md
### T-3 · Conversational sandbox copy

- State: todo
- Areas: features/sandbox
- Spec: F18
- Done when: the sandbox result messages use the encouraging wording approved in SPEC.md
```

- **State** is the only line that changes once a task exists. It is always one of:
  - `proposed` — written down, not yet approved by the owner; nobody works on it
  - `todo` — approved, free to claim
  - `claimed by <github-username> on <YYYY-MM-DD>, branch <branch-name>`
  - `done in PR #<n>`
  - `blocked: <reason>` or `dropped: <reason>`
- **Areas** are the folders the task will change (see §4). Check them before you claim.
- Blocks are **never moved, reordered or reformatted**, and done blocks stay where they are. Each
  block is separated from the next by lines nobody edits, so two people changing two different
  tasks never touch neighbouring lines, and Git merges their edits without a conflict.
- New tasks go at the **end of their area's section**. Number them with your initials,
  `T-<initials>-<n>` (for example `T-AB-4`), so two people adding tasks never pick the same ID.
  If two new blocks still conflict, keep both.

## 3. Claiming a task (on `main`), then branching out

A claim is a tiny commit made straight on `main` and pushed at once. Whoever pushes first owns
the task. The push itself is the lock.

```sh
git switch main
git pull --rebase

# Edit docs/BOARD.md: change only your task's State line, e.g.
#   - State: claimed by your-github-name on 2026-11-20, branch feat/sandbox-copy

git add docs/BOARD.md
git commit -m "chore(board): claim T-3"
git push
```

- **The push is rejected?** Someone else pushed first. Run `git pull --rebase`.
  - It applies cleanly: run `git push` again.
  - It conflicts on your task's State line: they claimed the same task. Run `git rebase --abort`
    and `git reset --hard origin/main`, then pick another task.
- **Then branch out** from the `main` you just pushed:

  ```sh
  git switch -c feat/sandbox-copy
  ```

Rules for claims:

- Claim commits change **only `docs/BOARD.md`**, and only your own task's State line. They are the
  only commits anyone makes directly on `main`. Everything else goes through a pull request.
- **One claimed task per person at a time.** Finish or release it before you claim another.
- **Before you claim, read the Areas of every `claimed` task.** If one shares an area with yours,
  talk to that person first, or pick something else.
- **Releasing** a task you can't finish: set its State back to `todo` the same way, with commit
  message `chore(board): release T-3`.
- **Stale claims:** a claim with no pushed commits on its branch for 7 days may be released by
  the owner.
- **Your AI agent can claim for you.** Ask it to, and give it your GitHub username and the branch
  name. It follows these same steps (`AGENTS.md` §8), and the claim is still yours: it counts as
  your one claimed task.

`main` allows these direct pushes for claim commits; every other change goes through a pull
request.

## 4. Areas: who can work where at the same time

After the clean-up, each feature lives in its own folder. Tasks in different areas almost never
conflict, so they can run side by side.

| Area | Folders |
| --- | --- |
| `auth` | `src/features/auth/`, `src/pages/auth/` |
| `subjects` | `src/features/subjects/components/{EnrolledSubjectsTable,AddSubjectForm}.jsx`, `src/pages/student/SubjectMenu.jsx`, `src/lib/subjects.js` |
| `term-records` | `src/features/term-records/`, `src/lib/scores.js`, `src/lib/grades.js` |
| `subject-detail` | `src/pages/student/SubjectDetail.jsx` and its test, `src/features/subjects/hooks/useSubjectDetail.js`, `src/features/subjects/components/CelebrationDialog.jsx`, `src/lib/celebration.js` |
| `sandbox` | `src/features/sandbox/`, `src/pages/student/TargetGradeSandboxPage.jsx`, `src/lib/sandbox.js`, `src/lib/targets.js` |
| `grade-rules` | `src/features/grade-rules/`, `src/pages/student/GradeRules.jsx`, `src/pages/student/RuleDetailPage.jsx`, `src/lib/rules.js` |
| `history` | `src/features/history/`, `src/components/history-chart/`, `src/hooks/usePointHover.js`, `src/lib/history.js` |
| `dashboard` | `src/pages/student/StudentDashboard.jsx` |
| `settings` | `src/features/settings/`, `src/pages/settings/`, `src/services/localAccountStore.js`, `src/services/prototypeVerification.js` |
| `layout` | `src/components/layout/`, `src/components/SandboxSubjectPicker.jsx` |
| `shared` | `src/components/` (outside `ui/`, `layout/` and `history-chart/`), `src/hooks/` (outside `usePointHover.js`), `src/lib/` files not listed above, `src/services/` files not listed above |
| `tooling` | `.github/`, `scripts/`, `eslint.config.js`, `.prettierrc.json`, `vite.config.js`, `.gitattributes` |

- **`shared` is high-risk.** A change there affects every area that imports it. Keep it to its
  own small PR and get it merged before you build on it. Don't change a shared component's props in
  a feature PR.
- If a feature needs a new shared helper, put it in your feature folder first (AGENTS.md §5:
  files move to a shared folder only when a second feature needs them).
- Don't fix, tidy or reformat code outside your task's areas in the same PR. Write it down as a
  new task instead.

## 5. Shared files: locks and rules

A few files are touched by almost every feature. They are handled in one of two ways.

**Locked files** (one person at a time; the locks are at the bottom of `BOARD.md`). Take the lock
on `main` exactly like a claim (§3), make the change in a **small PR of its own**, get it merged
quickly, then free the lock.

| Lock | Files | Why it must be one at a time |
| --- | --- | --- |
| `LOCK-data` | `src/services/migrations.js`, `src/services/db.json`, `SCHEMA_VERSION` | Two schema changes can't share one version number |
| `LOCK-deps` | `package.json`, `package-lock.json` | The lockfile almost never merges cleanly |
| `LOCK-spec` | `SPEC.md` | Changes go through the owner's protocol in AGENTS.md §2 anyway |

**Rule files** (anyone can change them, following these rules):

| Files | Rules |
| --- | --- |
| `src/index.css` | Add a token **inside its group** (colours with colours, spacing with spacing), never at the end of the file. Never reorder or reformat existing tokens. Token additions go in a small PR merged before the feature PR that uses them |
| `src/app/App.jsx` | One route per PR. Add it next to related routes, not at the end |
| `src/components/ui/` | Add shadcn components only through the shadcn CLI, in their own commit. Before adding one, check that it isn't already there or claimed |
| `docs/BOARD.md` | Only your own task's State line, as in §3 |

**`package-lock.json` conflict anyway?** Don't edit it by hand. Take `main`'s copy
(`git checkout --theirs package-lock.json` during a merge of `main` into your branch), run
`npm install`, and commit the regenerated file.

## 6. While you work

- **Branch names:** `feat/<area>-<short-name>`, `fix/<area>-<short-name>`, `docs/<short-name>`.
  For example `feat/sandbox-copy`.
- **Keep branches short:** aim to open the PR within 5 days. Split a big task into
  several tasks on the board rather than keeping one long branch.
- **Bring in `main` every day you work** (merge, not rebase, so you never need to force-push):

  ```sh
  git fetch origin
  git merge origin/main
  ```

  Small conflicts resolved daily are easy. One big conflict after two weeks is not.
- **Format before every commit.** Run `npm run format`. With the whole team on the same Prettier
  settings, nobody's commit reformats someone else's lines. Never reformat a file you aren't
  otherwise changing.
- **Moves and renames go in their own PR**, announced to the team, merged quickly. A file moved in
  one branch and edited in another is the hardest conflict to resolve.
- **Commits** follow AGENTS.md §8: `type(scope): summary`, one task per commit. Types: `feat`, `fix`, `refactor`, `style`, `test`, `chore`,
  `docs`.

## 7. Pull requests

1. Before opening: `npm run lint`, `npm run format:check`, `npm run build` and `npm test` all pass.
2. In the PR's last commit, set your task's State to `done in PR #<n>`. (You'll know the number
   once the PR is open; push one more commit if needed.) It changes only your own block, so it
   merges cleanly with other people's claims.
3. The description says which task it closes (`T-3`), what changed, and which screens were checked
   at 375, 768, 1024 and 1440 px.
4. Keep PRs under about 400 changed lines where you can. Small PRs get reviewed and merged faster,
   which also means fewer conflicts for everyone else.
5. **Squash and merge.** One commit per PR on `main`.
6. Whoever merges second brings in `main` (§6), re-runs the checks and pushes. The first PR is
   never held back for the second.
7. **The owner reviews and merges every PR** (Jun Mari Manla), then deletes the branch.

**CI checks step 1.** The GitHub Actions workflow in `.github/workflows/ci.yml` runs the same four
checks on Node 22 for every pull request and every push to `main`. A PR with a failing run isn't
merged: fix it and push again. Still run the checks locally before you open the PR, because CI
confirms them and doesn't replace them. Playwright and the screenshots aren't part of CI, so the
screen checks in step 3 stay manual.

## 8. AI tools

- An agent that can see the repo (Claude Code, Codex, Cursor, …) follows `AGENTS.md`. Tell it the
  task ID and its areas, and that it may change only those folders.
- A chat model that can't see the repo gets `docs/ai-context/CONTEXT_PACK.md` and the template in
  `docs/ai-context/PROMPT_TEMPLATE.md`.
- **An agent may claim or release a task** for the developer who asks, following §3 (`AGENTS.md`
  §8). That commit on `main` is the only thing an agent pushes. Agents never push a branch, never
  merge, and never change any other part of `BOARD.md`: locks and `done in PR #<n>` stay with
  people.

## 9. Decisions (owner, 2026-11-13)

| # | Decision |
| --- | --- |
| 1 | A claim with no pushed commits for 7 days is stale; the owner may release it |
| 2 | `main` allows direct pushes for board claims only. An AI agent may make that push for the developer who asks (§3, §8) |
| 3 | The area table in §4 matches the folders after the clean-up and its follow-ups |
| 4 | Open the PR within 5 days of branching |
| 5 | Commit types: `feat`, `fix`, `refactor`, `style`, `test`, `chore`, `docs` (`AGENTS.md` §8) |
| 6 | The owner reviews and merges every PR |
| 7 | CI (T-18) is the first task after the team docs are merged |
| 8 | Line endings: `.gitattributes` (T-17) in its own PR right after CI, while no other branch is open |
| 9 | `proposed` tasks stay proposed until the owner approves each one (with `SPEC.md` updated through its protocol) |
| 10 | Old branches: the 20 already merged into `main` are deleted; `SettingsniMarco` and `SubjectDetail(Add-on)`, built on pre-clean-up code, are closed without merging. Anything still wanted from them becomes a board task |

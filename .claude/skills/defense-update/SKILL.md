---
name: defense-update
description: Updates the Code Defense Guide in docs/defense/ against the code on main. Trigger A ("feature"), after a major feature is merged, updates the chapters whose Covers paths changed since their "Last checked against" commit and adds chapters for new feature folders. Trigger B ("defense prelim|midterm|final"), 1-2 weeks before a defense, re-checks every chapter and refreshes the matching rehearsal file. Use when someone asks to update, refresh or check the defense guide, or a defense is coming up.
argument-hint: feature | defense <prelim|midterm|final>
allowed-tools: Bash(git fetch *), Bash(git diff *), Bash(git log *), Bash(git rev-parse *), Bash(git status *), Bash(node .claude/skills/defense-update/scripts/check-links.mjs *)
---

# defense-update

Keeps `docs/defense/` true to the code. The guide exists for the CC013.23 Code Defense, where a
student who can't explain their code gets no credit for it, so a wrong claim is worse than a
missing one.

Arguments: `$ARGUMENTS`

- `feature` → **Trigger A** (a major feature was merged)
- `defense prelim`, `defense midterm` or `defense final` → **Trigger B** (that defense is 1–2 weeks away)
- anything else, or nothing → ask which trigger, in one question, and stop

## 0. Before either trigger

1. Read `AGENTS.md`, `docs/defense/README.md` (its template and writing rules) and this file.
2. **Work inside a board task.** The developer names the task and its branch. If there is none,
   stop and ask the owner for one (`AGENTS.md` §3, §8). Never commit on `main`.
3. **Only `docs/defense/` changes.** Never edit code, `SPEC.md`, `spec/` or `docs/BOARD.md` here.
   A bug, a wrong spec line or a missing feature you notice goes in your summary, so it can become
   a task (`AGENTS.md` §3).
4. Get the current `main`:

   ```sh
   git fetch origin
   git rev-parse --short origin/main
   ```

   Call that sha `MAIN`. Everything is checked against `origin/main`, not your working tree.
   If the branch is behind `main`, merge or rebase `main` in first, as the task's workflow says.

## Trigger A: a major feature was merged

1. **Find the stale chapters.** For every chapter (every `.md` in `docs/defense/` with a
   "Last checked against" line):

   ```sh
   for f in $(grep -rlE '^- Last checked against: `[0-9a-f]{7,40}`' docs/defense); do
     sha=$(sed -n 's/^- Last checked against: `\([0-9a-f]*\)`.*/\1/p' "$f")
     covers=$(sed -n 's/^- Covers: //p' "$f" | grep -o '`[^`]*`' | tr -d '`')
     changed=$(git diff --stat "$sha" origin/main -- $covers | tail -1)
     [ -n "$changed" ] && echo "$f: $changed"
   done
   ```

   A chapter whose Covers paths didn't change stays as it is. Rehearsal files are left for Trigger B.

2. **Find what has no chapter.** List `frontend/src/features/*/` and, once it exists, `backend/`.
   A feature folder (or back-end area) that no chapter's Covers names gets a new chapter from the
   template in the README. For `backend/`, ask the owner how to split the chapters (for example one
   per resource) before writing them. Add each new chapter to the README's Status table and to
   "Who owns what" with the Owner cell **empty**.

3. **Update each stale chapter.** For each one:
   - read the diff: `git diff <sha> origin/main -- <covers>`
   - read the changed files in full, at `origin/main`
   - rewrite every section the change affects: what it does, files, the trace, decisions,
     likely questions, security and QA notes, self-check
   - **re-anchor every line link in the chapter**, not only the changed parts: lines move when
     code is added above them
   - known gaps: when a board task named in the chapter is `done`, check the code and rewrite the
     note; add new gaps with their board task
   - AI provenance: re-run `git log --follow` for each file in the table (command in
     `docs/defense/ai-log.md` §1)
   - set "Last checked against" to `MAIN`, and update its row in the README's Status table

4. **AI log.** For the merged range, list commits with a Claude trailer:

   ```sh
   git log --no-merges --format='%h %ad %an %s' --date=short --grep="Co-Authored-By: Claude" <oldest sha>..origin/main -- <covers>
   ```

   Add one row per feature or PR to `docs/defense/ai-log.md` §3, newest first. Don't guess at tools
   that leave no trailer; leave those rows to the members.

5. **Check.** Go to step "Check and finish".

## Trigger B: a defense is 1–2 weeks away

1. **Re-check every chapter**, changed or not. Do Trigger A step 3 for each one, reading every
   linked range and the claim beside it. Re-run each worked example (section 3 of
   `features/grade-maths.md`, `features/sandbox.md`) against `frontend/src/services/db.json`: write a
   small Node script in your scratchpad that imports the `frontend/src/lib/` functions and prints
   the numbers. Fix any number that changed.
2. **Refresh the rehearsal file** `docs/defense/rehearsal/<defense>.md`:
   - "Where we stand": one row per requirement, from the merged code and the board's States.
     "Not built" stays "Not built" until the code is on `main`
   - the demo script: every step must work on `main`. Run it if you can start the app
     (`npm run dev` in `frontend/`); otherwise ask the developer to run it and report back
   - the question drill: add questions for features merged since the last defense, each pointing
     to a chapter section
   - the date line, if the owner gives it
3. **Per-member study list.** For each owner in the README's "Who owns what" (skip empty cells):
   their chapters, plus the files their commits touched since the last defense
   (`git log --author="<name>" --since=<date> --name-only --format="" origin/main | sort -u`).
   Put the lists in your summary, not in the guide.
4. **Check.** Go to step "Check and finish".

## Check and finish

1. Run the checker and fix everything it reports:

   ```sh
   node .claude/skills/defense-update/scripts/check-links.mjs
   ```

2. Run it with `--print` for the files you changed, and read each printed line against the claim
   beside its link. The checker only proves the line exists; you prove the claim is true.
3. Re-read the writing rules in the README. In particular:
   - every claim links to the file and lines it describes
   - never describe code that isn't there; planned work is named by its board task
   - likely-question answers are bullet points, never prose to memorize
   - known bugs are stated plainly, with their board task
4. Commit only `docs/defense/` files, staged by name:
   - Trigger A: `docs(defense): update <chapters> for <feature or PR>`
   - Trigger B: `docs(defense): refresh for the <defense>`
5. Push the task branch (`AGENTS.md` §8). Don't open a pull request.
6. Stop with a summary: chapters changed and why, new chapters, gaps found (with board tasks or
   "needs a task"), for Trigger B the per-member study lists, and anything that needs the owner.

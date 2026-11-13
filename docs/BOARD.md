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

- State: todo
- Areas: shared (src/services/, src/hooks/, src/lib/), all screens
- Spec: owner request, 2026-11-13. The clean-up kept error handling as it was (feature freeze)
- Done when: a read-only review in `docs/` lists every place an error can happen (reading, parsing and saving `localStorage`, bad or old stored data, failed saves, invalid input that slips through, exceptions while rendering), what the student sees today, and a proposed fix for each. The fixes become separate tasks, each approved by the owner, because they change behaviour

## tooling

### T-17 · Line endings: .gitattributes

- State: Claimed by June-05
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

### LOCK-spec · SPEC.md

- State: free
- Files: SPEC.md (changes go through the protocol in AGENTS.md §2)

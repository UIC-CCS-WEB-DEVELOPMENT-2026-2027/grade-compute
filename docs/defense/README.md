# Code Defense Guide

A study guide for the CC013.23 one-on-one Code Defense: each of us must explain every line we
submit, or that work earns no credit (`docs/LARAVEL_PLAN.md` §8). This guide maps the real code,
chapter by chapter, with a link to the lines behind every claim.

It is not the spec. `SPEC.md` says what CompUGrade should do; this guide explains the code as it is.

## How to use it

1. **Everyone** knows [architecture.md](architecture.md), the grade maths in
   [features/grade-maths.md](features/grade-maths.md), and the score-entry trace in
   [features/term-records.md](features/term-records.md).
2. **Each owner** goes deep on their own chapters (see "Who owns what"), starting with the code
   their own commits touched (each chapter's section 7).
3. Answer each chapter's **self-check** out loud, without notes. Open the links to check yourself.
4. In the defense, **answer in your own words**. The likely-question answers are bullet points on
   purpose: they are things to know, not lines to memorize.
5. 1–2 weeks before a defense, use its file in [rehearsal/](rehearsal/).

## Status

| Chapter | Covers (short) | Last checked against | Status |
| --- | --- | --- | --- |
| [architecture.md](architecture.md) | `app/`, `services/`, `hooks/`, `components/layout/`, CI and hosting config | `5e64e03` | First pass |
| [features/grade-maths.md](features/grade-maths.md) | `lib/` grade maths | `5e64e03` | First pass |
| [features/auth.md](features/auth.md) | `features/auth/`, `pages/auth/`, session, route guard | `5e64e03` | First pass |
| [features/subjects.md](features/subjects.md) | `features/subjects/`, Dashboard, My Subjects, Subject Detail, Sidebar | `5e64e03` | First pass |
| [features/term-records.md](features/term-records.md) | `features/term-records/`, `DraftInput`, scores | `5e64e03` | First pass |
| [features/grade-rules.md](features/grade-rules.md) | `features/grade-rules/`, rule pages, `rules.js` | `5e64e03` | First pass |
| [features/sandbox.md](features/sandbox.md) | `features/sandbox/`, sandbox page, `sandbox.js`, `targets.js` | `5e64e03` | First pass |
| [features/history.md](features/history.md) | `features/history/`, `components/history-chart/`, `history.js` | `5e64e03` | First pass |
| [features/settings.md](features/settings.md) | `features/settings/`, `pages/settings/`, account and verification services | `5e64e03` | First pass |
| [rehearsal/prelim.md](rehearsal/prelim.md) | The prelim demo | `5e64e03` | First pass |
| [rehearsal/midterm.md](rehearsal/midterm.md) | The midterm security exam and audit | `5e64e03` | First pass |
| [rehearsal/final.md](rehearsal/final.md) | The final cloud demo and code defense | `5e64e03` | First pass |
| [glossary.md](glossary.md), [ai-log.md](ai-log.md) | Terms; AI use | — | First pass |

"Last checked against" is the commit on `main` whose code the chapter was checked against. The
exact paths are in each chapter's "Covers" line.

## Who owns what

The owner fills this in. Everyone still knows the architecture and the main trace.

| Chapter | Owner |
| --- | --- |
| architecture.md | |
| features/grade-maths.md | |
| features/auth.md | |
| features/subjects.md | |
| features/term-records.md | |
| features/grade-rules.md | |
| features/sandbox.md | |
| features/history.md | |
| features/settings.md | |

## The chapter template

Every chapter starts with:

```md
# <Title>

- Last checked against: `<short sha on main>`
- Covers: `<path>`, `<path>`, …
- Owner: see [README](../README.md#who-owns-what)
```

and has these sections, in this order:

1. **What it does**: in plain words, what a user sees.
2. **Where the code is**: a table of files, and the test files.
3. **Trace**: one action end to end, each step linked to its lines.
4. **Decisions and why**: each choice, with the reason.
5. **Likely questions**: each question in bold, answers as bullet points.
6. **Security and QA notes**: input checks, known gaps (with their board tasks), tests.
7. **AI provenance**: who and what wrote the code, from git ([ai-log.md](ai-log.md)).
8. **Self-check**: tick-boxes to answer out loud.

## Rules for writing it

- **Every claim links to the file and lines it describes**, as
  `[file.js:12-20](../../../frontend/src/lib/file.js#L12-L20)`.
- **Never describe code that isn't there.** Planned work is called planned and named by its board task.
- **Bullets, not prose to memorize.**
- **Known bugs are stated plainly**, with their board task. Hiding one in a defense is worse than knowing it.
- **Ideas and fixes don't go here.** Bugs found while writing become board tasks (`AGENTS.md` §3).
- Check every link before committing:
  `node .claude/skills/defense-update/scripts/check-links.mjs` (add `--print` to see the first line each link points to).

## Keeping it up to date

The Claude Code skill [`defense-update`](../../.claude/skills/defense-update/SKILL.md) does it, inside a board task:

- **Trigger A, a major feature was merged:** `/defense-update feature`. It updates the chapters
  whose "Covers" paths changed since their "Last checked against" commit, and adds a chapter for a
  new feature folder.
- **Trigger B, a defense is 1–2 weeks away:** `/defense-update defense <prelim|midterm|final>`. It
  re-checks every chapter and refreshes the matching rehearsal file.

Without Claude Code, follow the same steps in the skill file by hand.

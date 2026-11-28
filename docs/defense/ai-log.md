# AI use log

The CC013.23 Code Defense rule: every student must be able to explain every line they submit in a
one-on-one defense, or the work earns no credit (`docs/LARAVEL_PLAN.md` §8). This log records
where AI tools were used, so each owner knows which code to study hardest. Using AI is allowed;
not being able to explain the result is what costs marks.

## 1. What git can tell us

Counted on 2026-11-28, at commit `5e64e03`.

| Measure | Value |
| --- | --- |
| Commits (merges left out) | 350 |
| Commits with a `Co-Authored-By: Claude …` trailer | 222 (220 Claude Opus 5.5, 2 Claude Fable 5.2) |
| First and last commit with a Claude trailer | 2026-11-11 and 2026-11-28 |
| Git author of every commit with a Claude trailer | Jun Mari Manla (Claude Code sessions on that machine) |
| Commits before 2026-11-11 | 148, none with a trailer: Jun Mari Manla 71, Lian Dumangas 39, LerasanReyian 20, Kit Jasper M. Caballero 13, Marco Liu 5 |

How to read it:

- **From 2026-11-11 the clean-up job** (PR #118, follow-ups in PR #119) and the work since were done
  with Claude Code agents. They moved, split and rewrote files, so most current files have
  Claude-trailer commits even where a teammate wrote the first version.
- **Before 2026-11-11** commits have no trailer. That does **not** prove no AI was used: ChatGPT,
  Copilot, Gemini and chat tools leave no trace in git. Each member adds their own entries below.
- **Extracted files** (first committed on 2026-11-11 or later, such as `useAuthForm.js` or
  `accounts.js`) hold logic that is older than the file. `git log --follow` can't see across an
  extraction; look at the file they came from (named in each chapter's AI provenance section).
- **A trailer counts commits, not lines.** A commit may change one line or a thousand.

To check one file yourself:

```sh
git log --follow --format='%h %ad %an%n  %(trailers:key=Co-Authored-By,valueonly)' --date=short -- frontend/src/lib/grades.js
```

## 2. The course's AI rules, and where we stand

| Rule (CC013.23) | Today |
| --- | --- |
| No hard-coded keys; secrets in `.env`, never committed | No keys exist yet. `AGENTS.md` and `docs/LARAVEL_PLAN.md` §8 require `.env` |
| No raw SQL; use Eloquent | No back end yet. `docs/LARAVEL_PLAN.md` §8 sets Eloquent and migrations only |
| Explain every line in the defense | This guide; each chapter's self-check |
| Every member pushes verifiable commits | See the commit counts above; the README's "who owns what" assigns chapters |

## 3. Log

Add a row whenever an AI tool writes or substantially changes code or docs you commit. Newest first.

| Date | Who | Tool | What it did | Files or PR | Checked by (how) |
| --- | --- | --- | --- | --- | --- |
| 2026-11-28 | Jun Mari Manla | Claude Code (Claude Opus 5.5) | Wrote the first pass of this guide and the `defense-update` skill (T-JM-15) | `docs/defense/`, `.claude/skills/defense-update/` | Every link checked by `check-links.mjs`; worked examples run against `db.json` |
| 2026-11-28 | Jun Mari Manla | Claude Code (Claude Opus 5.5) | Moved the React app into `frontend/` (T-JM-14) | PR #134 | CI; lint, format, build, tests and screenshots |
| 2026-11-11 to 2026-11-13 | Jun Mari Manla | Claude Code (Claude Opus 5.5; 2 commits Claude Fable 5.2) | The codebase and UI clean-up | PR #118, PR #119 | Owner review at each gate; tests and screenshots |
| | | | _Members: add your own entries, including earlier ones_ | | |

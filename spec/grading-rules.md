# CompUGrade — Specification, §4

Part of the spec; `SPEC.md` lists every spec file. Changes only through the protocol in
`AGENTS.md` §2, logged in `SPEC.md` §11.

## 4. Grading rules (exactly as implemented)

**Task percentage** (`grades.js`, `taskPercentage`)

- `score / maxScore × 100`.
- It is null when `maxScore` isn't a number above 0, or when the score is empty (`""`, `null` or `undefined`).

**The three states** (`grades.js`, `pickScore`)

- **Official:** a numeric `officialScore`. The official grade (`calculateOfficialGrade`) counts only these and skips custom tasks.
- **Self-reported:** a numeric `studentReportedScore`. The expected grade (`calculateUnofficialGrade`) uses the official score if there is one, otherwise the self-reported score. Custom tasks are included.
- **Empty:** neither score is set. The task isn't counted.

**Grades**

- **Criterion grade:** the plain mean of its task percentages. Every task counts equally, whatever its `maxScore`.
- **Term grade** (`calculateTermGrade`):
  - `Σ(grade_c × w_c) / Σ w_c`, over the leaf criteria that have a weight above 0 and at least one counted task
  - `w_c = rule.effectiveMultipliers[leafId]`
  - the weights are renormalised, so this is "the grade so far"
  - null if nothing counts
- **Final grade** (`calculateFinalGrade`): the mean of whichever of prelim, midterm and finals have a grade, weighted equally. Null if none do.

**Rounding**

- The engine never rounds. Display rounding varies by place:
  - enrolled-subjects table: 1 decimal, trailing zeros removed
  - Subject Detail gauges: 0 decimals on screen, 2 in the aria label
  - sandbox, history and tooltips: 2 decimals, trailing zeros removed
  - a task's score percentage in the history table and tooltip: 1 decimal, trailing zero kept ("90.0%")
  - sandbox gauge aria label: 0 decimals
- **Status** (`subjects.js`), from the expected final grade:
  - "Passing" at 75 or more (`PASSING_GRADE`)
  - "Below passing" under 75
  - "No grades yet" when null

**Semesters** (`subjects.js`)

- First Semester runs August–December, Second January–May, and Summer June–July.
- The academic year starts in August.
- A class without a `semester` counts as First Semester of the current academic year, so what the Dashboard shows depends on today's date (AUDIT B12).
- New subjects get the current semester.

**Rule maths** (`rules.js`)

- **Units:** shares are integer hundredths of a percent (10000 = 100%). A typed percentage is rounded to 2 decimals.
- **Limits:** each criterion is at least 1%. A level holds at most 8 criteria, and a rule is at most 3 levels deep. Names are at most 30 characters and unique within their level (case-insensitive).
- **Effective shares:** apportioned per level by largest remainder, with ties going to the leftmost criterion. `effectiveMultipliers[leaf] = effective / 10000`.
- **Changing a percentage** trades with the right-hand neighbour, or the left-hand one for the last criterion.
- **Deleting a criterion** gives its share to the left neighbour, or the right-hand one if it was first.
- **Splitting a criterion** keeps the old id on the new child, so the recorded tasks move with it.
- **Legacy rules:** old `hierarchy` and AT/TLA rules are rebuilt when they are read.
- **Formula multipliers:** 4 decimals, with up to 2 trailing zeros removed.

**Sandbox** (`sandbox.js`, `getSandboxPlan`), for each leaf criterion

- **Scored tasks** use the official score, else the self-reported score. Custom tasks are included.
- **`upcoming`:** defaults to 1 if the criterion has no tasks, otherwise 0. It is rounded and clamped to 0–20.
- **`slots`** = open tasks + `upcoming`.
- **`expected`:** clamped to 0–100, or null.
- **Criterion grade:** `scoredSum/total + (slots/total)·R` when `expected` is null; otherwise `(scoredSum + slots·expected)/total`.
- **Counted:** when `total > 0` and the weight is above 0.
- **Term grade:** `A + B·R`, normalised over the counted weights.
- **Status:**
  - `empty`: nothing counts
  - `complete`: `B ≤ 0`, and projected = A
  - `impossible`: `R > 100 + 1e-9`
  - `reached`: `R ≤ 0`
  - otherwise `required`, where `required = min(100, roundUp2(R))` and `roundUp2(v) = ceil(v·100 − 1e-9)/100`
- **Raw score needed on a task:** `min(max, roundUp2(pct·max/100))`.

**Targets**

- **Default:** 90.
- **Sandbox:** `terms[t].sandboxDesiredFinalGrade` → `terms[t].desiredFinalGrade` → `sandboxDesiredFinalGrade` → `desiredFinalGrade` → 90. Each value must be 0–100.
- **Subject (history):** `terms[t].desiredFinalGrade` → `desiredFinalGrade` → 90, range-checked.
- **Subject Detail:** the same chain, but not range-checked (AUDIT B11).
- **Target input on Subject Detail:** saves `terms[t].desiredFinalGrade` and ignores values outside 0–100.

**History** (`history.js`)

- **Task order:** by first score time (the earlier of `studentScoredAt` and `officialScoredAt`), then `createdAt`, then the timestamp in a `CUSTOM-<ms>` id. Tasks with no time come first, in rule order.
- **Points:** each point is the expected term grade using the tasks up to that step.
- **Ghost point:** the same grade, but using the student's replaced entry instead of the official score.
- **"Target reached":** the last point is at or above the target.
- **Plan points:** criteria that use the required % come first, then those with an expected %. The fill is `required`, or 100 if the target is impossible, or the current grade clamped to 0–100 if it is already reached.

**Celebration** (`useSubjectDetail.js`, `celebration.js`)

- Fires when the **official or the expected** term grade goes from below the target to at or above it.
- Only while the page is open, on the same subject and term.
- Shows a message, plays audio and runs confetti for 6 seconds.

**Score-entry validation** (`scores.js`, `validateScore`; each component shows its own message)

- digits only
- between 0 and `maxScore`
- no more integer digits than `maxScore` has
- a custom task's `maxScore` must be a positive integer

**Known inconsistencies**, kept as they are during the clean-up:

- An `officialScore` of `""` counts as official in Current Term Records but as empty in the engine (AUDIT B10).
- The sandbox "Upcoming tasks" input forces 0 as soon as it is cleared (AUDIT B16).

> **Sandbox draft scores (AUDIT B9, fixed 2026-11-11).**
> "Try draft scores" stores each draft in `targetGradeSandbox.terms[term].draftScores` (`{ [taskId]: score }`, the typed text) and never writes `studentReportedScore`.
>
> - Drafts feed the sandbox only: its result card, its expected gauge and its plan chart. Subject Detail, Current Term Records and the official grade never see them.
> - A draft box starts from the task's real self-reported score. A cleared box stores `""`, which counts as no score in the sandbox.
> - On the sandbox chart, tasks scored by a draft are drawn after all real scores, in rule order (owner decision, 2026-11-11).
> - There was no migration: scores saved by the old behaviour stay real scores.

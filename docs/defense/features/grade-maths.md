# Grade maths (`frontend/src/lib/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/lib/grades.js`, `frontend/src/lib/rules.js`, `frontend/src/lib/sandbox.js`, `frontend/src/lib/history.js`, `frontend/src/lib/targets.js`, `frontend/src/lib/scores.js`, `frontend/src/lib/number.js`, `frontend/src/lib/format.js`, `frontend/src/lib/terms.js`, `frontend/src/lib/celebration.js`, `frontend/src/lib/subjects.js`
- Owner: see [README](../README.md#who-owns-what)

Everyone needs this chapter: every screen shows a number that comes from here.

## 1. What it does

- Turns a grading rule plus a student's tasks into grades: official, expected, per term and final.
- Edits grading rules safely (percentages always add up to 100%).
- Solves "what do I need on the remaining tasks?" for the sandbox.
- Builds the grade-history chart points.
- All of it is **pure functions**: no React, no `localStorage`, no network
  ([rules.js:3-5](../../../frontend/src/lib/rules.js#L3-L5), [sandbox.js:1](../../../frontend/src/lib/sandbox.js#L1), `AGENTS.md` §6).

## 2. Where the code is

| File | What is in it |
| --- | --- |
| [grades.js](../../../frontend/src/lib/grades.js) | The grading engine: the 3-state score pick, term grade, final grade |
| [rules.js](../../../frontend/src/lib/rules.js) | Rule trees: share units, editing, effective shares, saving, deleting, impact counts |
| [sandbox.js](../../../frontend/src/lib/sandbox.js) | The Target Grade Sandbox solver and its saved settings |
| [history.js](../../../frontend/src/lib/history.js) | Grade-history points, plan points, chart axes |
| [targets.js](../../../frontend/src/lib/targets.js) | Where a target grade comes from (default 90) |
| [subjects.js](../../../frontend/src/lib/subjects.js) | Semesters, enrolled-subject rows, add and remove a subject |
| [scores.js](../../../frontend/src/lib/scores.js) | Checking a typed score against its max |
| [number.js](../../../frontend/src/lib/number.js), [format.js](../../../frontend/src/lib/format.js), [terms.js](../../../frontend/src/lib/terms.js), [celebration.js](../../../frontend/src/lib/celebration.js) | Small helpers: `toNumber`, display format, the three terms, when to celebrate |

Tests sit next to each file: `grades.test.js`, `rules.test.js`, `sandbox.test.js`, `history.test.js`,
`targets.test.js`, `scores.test.js`, `subjects.test.js`, `number.test.js`, `format.test.js`,
`terms.test.js`, `celebration.test.js` (all in [lib/](../../../frontend/src/lib/)).

### The data the maths reads

- A rule stores a `criteria` tree (weights are fractions of the parent) and a flat
  `effectiveMultipliers` map keyed by each deepest criterion's id
  ([rules.js:16-21](../../../frontend/src/lib/rules.js#L16-L21)).
- A student record stores tasks per term under the same ids
  ([grades.js:2-6](../../../frontend/src/lib/grades.js#L2-L6)).
- The seed rule: `AT 0.49, TLA 0.21, Exam 0.3`
  ([db.json:60-64](../../../frontend/src/services/db.json#L60-L64)).

## 3. Trace: how one grade is computed

The seed student `U1` in class `C101`, Prelim, rule `CR-1`
([db.json](../../../frontend/src/services/db.json)). Prelim has `AT-1` (official 18/20),
`AT-2` (a custom task, self-reported 45/50), `TLA-1` and `EX-1` (no scores).

1. **Pick each task's score (the 3-state rule)**, [grades.js:23-30](../../../frontend/src/lib/grades.js#L23-L30):
   - official mode: only `officialScore`; custom tasks are skipped
   - expected mode: `officialScore` if there is one, else `studentReportedScore`, else empty
2. **Task to percentage:** score / maxScore × 100; no usable max or score → `null`
   ([grades.js:33-39](../../../frontend/src/lib/grades.js#L33-L39)).
3. **Criterion grade = the average of its task percentages**, so every task counts equally,
   whatever its max score ([grades.js:46-48](../../../frontend/src/lib/grades.js#L46-L48),
   [grades.js:57-63](../../../frontend/src/lib/grades.js#L57-L63)).
4. **Weighted, renormalized:** only criteria with at least one score count; their weights are
   divided by the weights that counted ([grades.js:66-73](../../../frontend/src/lib/grades.js#L66-L73)).
   This makes it the "grade so far".
5. **Result:**
   - official Prelim: only AT-1 counts → AT = 90% → **90%**
   - expected Prelim: AT-1 90% and AT-2 90% → AT = 90% → **90%**
   - the student types 45 on TLA-1 (out of 100): expected = (0.49 × 90 + 0.21 × 45) / 0.70 =
     **76.5%**; official stays 90%
6. **Final grade:** the three terms count equally; only terms with a grade are averaged
   ([grades.js:87-94](../../../frontend/src/lib/grades.js#L87-L94)).

These numbers were checked by running the functions on `db.json`.

### Trace: the sandbox answer for the same record

[sandbox.js:78-151](../../../frontend/src/lib/sandbox.js#L78-L151), target 90 (the seed's
`desiredFinalGrade`):

- Each deepest criterion becomes a row: its scored tasks are fixed; its open tasks plus
  "upcoming" tasks are **slots** ([sandbox.js:86-120](../../../frontend/src/lib/sandbox.js#L86-L120)).
- The term grade is a straight line in the unknown R: **grade = A + B × R**
  ([sandbox.js:129-132](../../../frontend/src/lib/sandbox.js#L129-L132)).
  - A = 0.49 × 90 = 44.1 (AT is fully scored)
  - B = 0.21 + 0.30 = 0.51 (TLA-1 and EX-1 are open)
- R = (target − A) / B = (90 − 44.1) / 0.51 = **90%** on each of the 2 remaining tasks
  ([sandbox.js:142](../../../frontend/src/lib/sandbox.js#L142)).
- Rounded **up** to 2 decimals so scoring the shown value always reaches the target
  ([sandbox.js:35-38](../../../frontend/src/lib/sandbox.js#L35-L38)).
- After the 45 on TLA-1: R = 121.5 > 100 → status `impossible`, best possible 83.55%
  ([sandbox.js:143-145](../../../frontend/src/lib/sandbox.js#L143-L145)). With target 80:
  88.17% needed on the exam.

## 4. Decisions and why

- **Percentages in rules are whole numbers of hundredths ("share units": 100% = 10000)**
  ([rules.js:7-9](../../../frontend/src/lib/rules.js#L7-L9), [rules.js:27](../../../frontend/src/lib/rules.js#L27)).
  - Why: integer maths has no floating-point drift, so siblings always total exactly 100%.
- **Effective shares use the largest-remainder method**
  ([rules.js:420-455](../../../frontend/src/lib/rules.js#L420-L455)).
  - Why: rounded children still add up exactly to their parent (33.33 + 33.33 + 33.34).
- **Changing one percentage trades with one neighbour** (right, or left if last), and values out
  of range are rejected with a warning, not clamped
  ([rules.js:165-208](../../../frontend/src/lib/rules.js#L165-L208)).
  - Why: the student sees exactly which other criterion changed; nothing changes silently.
- **New criterion ids are random** ([rules.js:260-270](../../../frontend/src/lib/rules.js#L260-L270)).
  - Why: tasks are stored under criterion ids; reusing a deleted id would attach old tasks to a
    new criterion.
- **Splitting a criterion hands its id to the new child**
  ([rules.js:399-414](../../../frontend/src/lib/rules.js#L399-L414)).
  - Why: tasks already recorded under it move into the subcriterion instead of being lost.
- **Every task counts equally inside a criterion** (average of percentages, not total points)
  ([grades.js:46-48](../../../frontend/src/lib/grades.js#L46-L48)).
- **The status badge follows the expected grade**, passing at 75%
  ([subjects.js:8](../../../frontend/src/lib/subjects.js#L8), [subjects.js:75-79](../../../frontend/src/lib/subjects.js#L75-L79)).
  - Why: it already prefers official scores, so it is the most complete picture.
- **Functions return new objects and never change their inputs**
  ([rules.js:3-5](../../../frontend/src/lib/rules.js#L3-L5)); failures return the original tree
  so the UI can always call `setTree(result.tree)` ([rules.js:120-128](../../../frontend/src/lib/rules.js#L120-L128)).
- **Grade maths stays in the browser after the Laravel back end** (owner decision,
  `docs/LARAVEL_PLAN.md` §1 item 4). The API will store and validate; it is not built yet.

## 5. Likely questions

**"Walk me through how the expected grade is computed."**
- 3-state pick per task: official, else self-reported, else empty ([grades.js:23-30](../../../frontend/src/lib/grades.js#L23-L30))
- task % = score / max × 100
- criterion = average of its task %
- term = weighted average over criteria that have a score, renormalized
- final = average of the terms that have a grade

**"What is the difference between official and expected?"**
- Official: professor scores only; custom tasks skipped ([grades.js:76-79](../../../frontend/src/lib/grades.js#L76-L79))
- Expected: official first, then the student's own entries ([grades.js:81-85](../../../frontend/src/lib/grades.js#L81-L85))
- Same engine, one flag: `includeSelfReported`

**"Why don't you use floating point for rule percentages?"**
- 0.1 + 0.2 ≠ 0.3 in JavaScript
- Share units are integers, so sums are exact ([rules.js:7-9](../../../frontend/src/lib/rules.js#L7-L9))
- `validateTree` checks every level totals exactly 10000 ([rules.js:576-577](../../../frontend/src/lib/rules.js#L576-L577))

**"How does the sandbox find the required score?"**
- Grade is linear in R: A + B × R
- R = (target − A) / B
- B ≤ 0 → nothing left to plan (`complete`); R > 100 → `impossible`; R ≤ 0 → `reached`
  ([sandbox.js:138-150](../../../frontend/src/lib/sandbox.js#L138-L150))
- Rounded up, so the shown value is always enough

**"What happens to tasks when a criterion is deleted from a rule?"**
- They stay stored but stop counting (the engine only reads ids in `effectiveMultipliers`)
- Before saving, `getRuleChangeImpact` counts them for the warning dialog
  ([rules.js:1132-1139](../../../frontend/src/lib/rules.js#L1132-L1139))

**"Why is this code not in a React component?"**
- `AGENTS.md` §6: grade computation is pure functions in `lib/`
- Easy to unit-test without a browser
- Components call it; they never redo the maths

**"What is a grade when nothing is scored?"**
- `null`, shown as "—" ([format.js:6-8](../../../frontend/src/lib/format.js#L6-L8))
- Not 0%: a missing grade never reaches a target ([celebration.js:10-16](../../../frontend/src/lib/celebration.js#L10-L16))

## 6. Security and QA notes

- **Tests:** every file this chapter covers has a test file (`utils.js` and `lib/dom/` don't,
  and aren't maths); the date is frozen at 2026-11-11
  ([fixedDate.js](../../../frontend/src/test/fixedDate.js)) so semester logic is repeatable.
- **Input checks:** a typed score must be digits, 0 to max, with no more digits before the
  decimal than the max has ([scores.js:11-23](../../../frontend/src/lib/scores.js#L11-L23)).
- **Bad stored values don't crash the maths:** `toNumber` turns empty or invalid values into
  `null` ([number.js:5-9](../../../frontend/src/lib/number.js#L5-L9)).
- **Known kept quirk:** the Subject Detail target is not range-checked when read, so a bad stored
  value can show as NaN or above 100 (AUDIT B11, kept on purpose)
  ([targets.js:34-42](../../../frontend/src/lib/targets.js#L34-L42)).
- **Trust:** today the student's browser holds all data, so a student could edit their own
  `localStorage`. There is no server to stop it yet. The planned API validates input
  (`docs/LARAVEL_PLAN.md` §1 item 4).
- **Display rounding only:** grades are not rounded in the maths; `formatGrade` rounds for display
  (2 decimals by default, 1 on the subjects table) ([format.js:4-8](../../../frontend/src/lib/format.js#L4-L8)).

## 7. AI provenance

From `git log --follow` on each file (see [ai-log.md](../ai-log.md) for the method and its limits).

| File | Commits | With a Claude trailer | First commit |
| --- | --- | --- | --- |
| `grades.js` | 10 | 6 | Lian Dumangas, 2026-10-19 |
| `rules.js` | 10 | 7 | Jun Mari Manla, 2026-10-25 |
| `sandbox.js` | 10 | 9 | Jun Mari Manla, 2026-10-25 |
| `history.js` | 12 | 9 | Jun Mari Manla, 2026-10-25 |
| `subjects.js` | 8 | 6 | Jun Mari Manla, 2026-10-25 |
| `targets.js`, `scores.js`, `number.js`, `format.js`, `celebration.js` | 2–4 each | all | Jun Mari Manla, 2026-11-11 (extracted in the clean-up) |

- Files first committed on 2026-11-11 were **extracted** from older page files during the
  clean-up; their logic is older than their first commit.
- Each owner must be able to explain these files line by line, whoever typed them.

## 8. Self-check

- [ ] Compute the seed student's expected Prelim grade by hand after a 45/100 on TLA-1 (answer: 76.5%).
- [ ] Explain why a custom task is ignored in the official grade ([grades.js:24](../../../frontend/src/lib/grades.js#L24)).
- [ ] Explain what "renormalized" means, with the seed rule.
- [ ] Say what 10000 means in `rules.js` and why it isn't 100.
- [ ] Solve A + B × R = target for the seed record with target 80 (answer: 88.17% on the exam).
- [ ] Explain what `splitCriterion` does to ids, and why.
- [ ] Name the five sandbox statuses and when each happens ([sandbox.js:72-77](../../../frontend/src/lib/sandbox.js#L72-L77)).
- [ ] Find the test that checks the 3-state rule in [grades.test.js](../../../frontend/src/lib/grades.test.js).

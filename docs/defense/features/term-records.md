# Current Term Records (`features/term-records/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/term-records/`, `frontend/src/components/DraftInput.jsx`, `frontend/src/lib/grades.js`, `frontend/src/lib/scores.js`, `frontend/src/services/records.js`
- Owner: see [README](../README.md#who-owns-what)

This is the **3-state grading engine** in action, the core idea of CompUGrade. Everyone should know
its trace.

## 1. What it does

On Subject Detail, for the chosen term:

- One section per deepest criterion of the subject's rule (for example AT, TLA, Exam).
- Each task shows its state:
  - **Locked · Official**: a professor's score; the student can't change it
  - **Self Reported**: the student's own score for a professor task
  - **Custom Addition**: a private task the student added
- The student types scores and adds custom tasks.
- A collapsible "Official Grade Breakdown" lists only professor-recorded tasks.

## 2. Where the code is

| File | Role |
| --- | --- |
| [CurrentTermRecords.jsx](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx) | The whole section: rows, score boxes, add task, breakdown |
| [DraftInput.jsx](../../../frontend/src/components/DraftInput.jsx) | A box that saves only on blur or Enter; Escape cancels |
| [scores.js](../../../frontend/src/lib/scores.js) | `validateScore`: is the typed text a valid score? |
| [grades.js](../../../frontend/src/lib/grades.js) | `withStudentScore`, `toTaskList`, the grade engine |
| [records.js](../../../frontend/src/services/records.js) | `updateStudentRecord`: replace one student's record in one class |

Tests: [CurrentTermRecords.test.jsx](../../../frontend/src/features/term-records/components/CurrentTermRecords.test.jsx),
[scores.test.js](../../../frontend/src/lib/scores.test.js), [grades.test.js](../../../frontend/src/lib/grades.test.js),
[records.test.js](../../../frontend/src/services/records.test.js).

## 3. Trace: the student enters a score and the grade updates

1. The rows come from the rule's deepest criteria ([CurrentTermRecords.jsx:49-54](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L49-L54)).
   Tasks with an official score get no input box ([CurrentTermRecords.jsx:338](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L338)).
2. The student types `45` in TLA-1's box. Each keystroke goes through `acceptTyping` → `checkScore`
   ([CurrentTermRecords.jsx:353-359](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L353-L359));
   a bad keystroke is refused ([DraftInput.jsx:36-40](../../../frontend/src/components/DraftInput.jsx#L36-L40)).
3. `checkScore` ([CurrentTermRecords.jsx:97-119](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L97-L119)):
   - an official score → "locked"
   - else `validateScore(text, maxScore)` ([scores.js:11-23](../../../frontend/src/lib/scores.js#L11-L23))
4. Nothing is saved while typing. On blur or Enter, `DraftInput` calls `onCommit` once, only if
   the text changed ([DraftInput.jsx:22-30](../../../frontend/src/components/DraftInput.jsx#L22-L30),
   [DraftInput.jsx:45-52](../../../frontend/src/components/DraftInput.jsx#L45-L52)).
5. `updateSandbox` checks again, then replaces that task with `withStudentScore(task, "45")`
   ([CurrentTermRecords.jsx:124-136](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L124-L136)),
   which also stamps `studentScoredAt` the first time ([grades.js:107-114](../../../frontend/src/lib/grades.js#L107-L114)).
6. `saveChanges` re-reads the database **at the moment of saving**, builds the new one with
   `updateStudentRecord`, and saves ([CurrentTermRecords.jsx:61-80](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L61-L80),
   [records.js:6-20](../../../frontend/src/services/records.js#L6-L20)).
7. `saveDb` fires `compugrade-db-updated` ([db.js:50-53](../../../frontend/src/services/db.js#L50-L53)).
8. Subject Detail's live `useDb` re-reads ([useSubjectDetail.js:32](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js#L32)):
   the expected gauge recomputes (seed: 90% → 76.5%, worked in [grade-maths.md](grade-maths.md#3-trace-how-one-grade-is-computed)),
   the history chart redraws, and the celebration check runs.

### Adding a custom task

- Name and a whole-number max score greater than 0 are required
  ([CurrentTermRecords.jsx:138-156](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L138-L156)).
- It gets id `CUSTOM-<time>`, `isCustomTask: true`, and is added under the chosen criterion
  ([CurrentTermRecords.jsx:157-177](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L157-L177)).
- Custom tasks count in the expected grade only ([grades.js:24](../../../frontend/src/lib/grades.js#L24)).

## 4. Decisions and why

- **Save on blur, not on every keystroke** ([DraftInput.jsx:1-6](../../../frontend/src/components/DraftInput.jsx#L1-L6)).
  - Why: half-typed values ("8" on the way to "85") would recompute grades and could fire the
    celebration.
- **Validate twice: per keystroke and before saving** ([CurrentTermRecords.jsx:95-96](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L95-L96),
  [CurrentTermRecords.jsx:125](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L125)).
  - Why: the keystroke check gives instant feedback; the save check guards the data.
- **No more digits before the decimal than the max has** ([scores.js:4-9](../../../frontend/src/lib/scores.js#L4-L9)).
  - Why: on a 50-point task, "500" is refused while typing, before it ever exceeds the max.
- **`useDb({ live: false })` in this component** ([CurrentTermRecords.jsx:38](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L38)),
  but every save re-reads the database first ([CurrentTermRecords.jsx:62](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L62)).
  - Why: the list isn't redrawn under the student's typing, and a save never overwrites newer data.
- **Tasks under criteria no longer in the rule are hidden and counted in a note**
  ([CurrentTermRecords.jsx:56-59](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L56-L59),
  [CurrentTermRecords.jsx:394-400](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L394-L400)).
  - Why: they are kept (nothing is deleted), but they don't count, and the student is told.
- **The breakdown excludes custom tasks** ([CurrentTermRecords.jsx:523-527](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L523-L527)).

## 5. Likely questions

**"What are the three states?"**
- Official (locked), self-reported, empty
- Official wins: `officialScore` first, then `studentReportedScore` ([grades.js:20-30](../../../frontend/src/lib/grades.js#L20-L30))

**"Can a student change an official score?"**
- Not in the UI: no input box is drawn, and `checkScore` refuses it ([CurrentTermRecords.jsx:101-105](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L101-L105))
- In DevTools they could edit `localStorage`; only a server can really lock it (T-JM-4, T-JM-5)
- Today nobody can enter official scores in the app at all; the professor role is `[PLANNED]` (`SPEC.md` §6)

**"Why is a score of 0 not treated as empty?"**
- `toNumber` returns `null` only for empty or invalid values; 0 is a number ([number.js:5-9](../../../frontend/src/lib/number.js#L5-L9))
- Tested: "a score of 0 is a score, not empty" in [grades.test.js](../../../frontend/src/lib/grades.test.js)

**"What does Escape do in a score box?"**
- Throws the draft away and shows the saved value ([DraftInput.jsx:49-51](../../../frontend/src/components/DraftInput.jsx#L49-L51))

**"Why does the message say 'sandbox changes'?"**
- Old wording in [CurrentTermRecords.jsx:73](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L73)
- Board task T-28 replaces it

## 6. Security and QA notes

- **Input validation:** a regular expression plus range and digit checks ([scores.js:16-21](../../../frontend/src/lib/scores.js#L16-L21)).
- **Errors are shown, not thrown:** a failed save shows a message and keeps the screen usable
  ([CurrentTermRecords.jsx:70-75](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L70-L75)).
- **Accessibility:** each score box has an `aria-label` naming its task and `aria-invalid` when wrong
  ([CurrentTermRecords.jsx:347-351](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L347-L351)).
- **One lint rule is disabled inline, with its reason** ([CurrentTermRecords.jsx:159-161](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L159-L161)):
  `Date.now()` runs in a submit handler, not in render (a false positive). `AGENTS.md` §6 allows
  this only with a comment.
- **Damaged records:** a non-list task entry is handled by `toTaskList` ([grades.js:13-18](../../../frontend/src/lib/grades.js#L13-L18));
  board task T-27 hardens the remaining damaged shapes.

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | People (commits without a trailer) |
| --- | --- | --- | --- |
| `features/term-records/components/CurrentTermRecords.jsx` | 36 | 19 | Lian Dumangas 12 (first commit, 2026-10-12), Jun Mari Manla 5 |
| `components/DraftInput.jsx` | 8 | 7 | Jun Mari Manla 1 |
| `lib/scores.js` | 2 | 2 | Extracted 2026-11-11 |
| `services/records.js` | 3 | 3 | Extracted 2026-11-11 |

Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Trace a typed score from the keystroke to the gauge, naming each function and file.
- [ ] Explain why `DraftInput` exists.
- [ ] Say which scores count in the official grade and which in the expected grade.
- [ ] Explain why `saveChanges` calls `getDb()` instead of using the component's state.
- [ ] Say what `validateScore("500", 50)` returns and why.
- [ ] Explain the one `eslint-disable` comment in this file.

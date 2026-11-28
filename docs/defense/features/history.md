# Grade history (`features/history/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/history/`, `frontend/src/components/history-chart/`, `frontend/src/hooks/usePointHover.js`, `frontend/src/lib/history.js`, `frontend/src/lib/dom/`
- Owner: see [README](../README.md#who-owns-what)

## 1. What it does

- **Dashboard chart:** one line per subject this semester, for one term, each with its target as a
  dashed line, plus the 75% passing line. Chips show or hide subjects. Clicking a point opens that
  subject at that task.
- **Subject Detail chart:** the term grade after each scored task, the target, the sandbox plan for
  the remaining tasks (dotted, can be hidden), and a faded dot where an official score replaced the
  student's own entry. Clicking a point scrolls to that task.
- **The sandbox** uses the same chart with draft scores ([sandbox.md](sandbox.md)).
- Every chart has a **"Show as a table"** view with the same data.

## 2. Where the code is

| File | Role |
| --- | --- |
| [AllSubjectsHistory.jsx](../../../frontend/src/features/history/components/AllSubjectsHistory.jsx) | The Dashboard chart |
| [SubjectGradeHistory.jsx](../../../frontend/src/features/history/components/SubjectGradeHistory.jsx) | The Subject Detail chart |
| [HistoryCard.jsx](../../../frontend/src/features/history/components/HistoryCard.jsx) | The card both charts sit in |
| [HistoryChart.jsx](../../../frontend/src/components/history-chart/HistoryChart.jsx) | One subject's chart (Subject Detail and sandbox) |
| [HistoryChartFrame.jsx](../../../frontend/src/components/history-chart/HistoryChartFrame.jsx) | The Recharts frame, axes and the table toggle |
| [HistoryTable.jsx](../../../frontend/src/components/history-chart/HistoryTable.jsx), [HistoryTooltip.jsx](../../../frontend/src/components/history-chart/HistoryTooltip.jsx), [HistoryLegend.jsx](../../../frontend/src/components/history-chart/HistoryLegend.jsx), [HistoryEmpty.jsx](../../../frontend/src/components/history-chart/HistoryEmpty.jsx) | Table view, tooltip, legend, empty state |
| [usePointHover.js](../../../frontend/src/hooks/usePointHover.js) | Tooltip state kept outside the chart |
| [history.js](../../../frontend/src/lib/history.js) | All the points and axis maths |
| [cssColor.js](../../../frontend/src/lib/dom/cssColor.js), [focusTask.js](../../../frontend/src/lib/dom/focusTask.js) | Token colours for SVG; scroll to a task row |

Tests: [history.test.js](../../../frontend/src/lib/history.test.js).

## 3. Trace: from scored tasks to a line, then a click

Seed record, Prelim.

1. `getScoredTasks` collects every task with a score, in the rule's criteria only
   ([history.js:46-94](../../../frontend/src/lib/history.js#L46-L94)).
2. Order: by when each task was first scored (`studentScoredAt` / `officialScoredAt`), else when it
   was added; tasks with no time (seed data) first, in rule order; drafts last
   ([history.js:29-39](../../../frontend/src/lib/history.js#L29-L39), [history.js:81-93](../../../frontend/src/lib/history.js#L81-L93)).
3. `getGradeHistory`: point _n_ is the term grade computed by the real engine using only the first
   _n_ tasks ([history.js:110-142](../../../frontend/src/lib/history.js#L110-L142)). Seed result:
   step 1 "AT 1 - Chapter 4 Quiz" 90% (official), step 2 "AT 2 - Pop Quiz" 90% (yours).
4. Where an official score replaced the student's entry, a **ghost grade** shows what the grade
   would have been with their entry ([history.js:117-127](../../../frontend/src/lib/history.js#L117-L127)).
5. `getPlanPoints` continues the line with the sandbox plan; criteria take turns, ones with an
   expected % go last ([history.js:179-261](../../../frontend/src/lib/history.js#L179-L261)).
6. `SubjectGradeHistory` draws it, live, so it redraws when a score is saved
   ([SubjectGradeHistory.jsx:21-41](../../../frontend/src/features/history/components/SubjectGradeHistory.jsx#L21-L41)).
7. Clicking a point calls `focusTaskRow(taskId)`: scroll to the row, highlight it, focus its input
   ([SubjectGradeHistory.jsx:85](../../../frontend/src/features/history/components/SubjectGradeHistory.jsx#L85),
   [focusTask.js:4-18](../../../frontend/src/lib/dom/focusTask.js#L4-L18)).
8. On the Dashboard, a click opens `/student/subject/<id>?term=…&task=…`
   ([AllSubjectsHistory.jsx:120-123](../../../frontend/src/features/history/components/AllSubjectsHistory.jsx#L120-L123));
   Subject Detail scrolls to it once and removes `task` from the URL
   ([useSubjectDetail.js:59-70](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js#L59-L70)).

## 4. Decisions and why

- **Each point is computed by the grade engine, not by a separate formula**
  ([history.js:12-13](../../../frontend/src/lib/history.js#L12-L13)).
  - Why: the chart can never disagree with the gauges.
- **"Target reached" only counts on the latest task** ([history.js:158-165](../../../frontend/src/lib/history.js#L158-L165)).
  - Why: an early peak that later dropped isn't an achievement.
- **The plan uses the current grade instead of 0% when the target is already reached**
  ([history.js:181-184](../../../frontend/src/lib/history.js#L181-L184), [history.js:196-201](../../../frontend/src/lib/history.js#L196-L201)).
  - Why: a line falling to 0% would be misleading.
- **Tooltip state lives outside the chart** ([usePointHover.js:1-10](../../../frontend/src/hooks/usePointHover.js#L1-L10)).
  - Why: redrawing the chart on hover made the library rebuild its dots and swallow quick clicks.
- **SVG colours are read from the design tokens at runtime** ([cssColor.js:1-8](../../../frontend/src/lib/dom/cssColor.js#L1-L8)).
  - Why: chart libraries set `fill`/`stroke` attributes, which can't read CSS variables; no hard-coded colours (`AGENTS.md` §7).
- **The y-axis starts 10 below the lowest value and ends a little above 100**
  ([history.js:289-310](../../../frontend/src/lib/history.js#L289-L310)).
  - Why: small changes stay visible, and a line at 100% isn't cut in half by the edge.
- **Every chart has a text alternative:** `role="img"` with a full `aria-label`, and a table with the
  same data ([HistoryChartFrame.jsx:45-46](../../../frontend/src/components/history-chart/HistoryChartFrame.jsx#L45-L46),
  [HistoryChart.jsx:320](../../../frontend/src/components/history-chart/HistoryChart.jsx#L320),
  [HistoryTable.jsx:1-4](../../../frontend/src/components/history-chart/HistoryTable.jsx#L1-L4)).

## 5. Likely questions

**"How is each point on the line calculated?"**
- Sort the scored tasks by time; point _n_ = `calculateUnofficialGrade` on the first _n_ tasks only
  ([history.js:114-116](../../../frontend/src/lib/history.js#L114-L116))

**"What is the faded dot?"**
- Your own entry, before an official score replaced it ([history.js:68-72](../../../frontend/src/lib/history.js#L68-L72))
- `getEntryAccuracy` says how close your guesses were on average ([history.js:144-156](../../../frontend/src/lib/history.js#L144-L156))

**"Why Recharts?"**
- shadcn/ui's chart component is built on it ([chart.jsx](../../../frontend/src/components/ui/chart.jsx)); it came with
  the shadcn CLI, which `AGENTS.md` §4 approves
- It is in [package.json](../../../frontend/package.json)

**"How can a screen-reader user read the chart?"**
- The chart's `aria-label` sums it up and points to the table ([HistoryChart.jsx:320](../../../frontend/src/components/history-chart/HistoryChart.jsx#L320))
- "Show as a table" gives every step as a row, with a button to open the task

**"What happens to tasks of a criterion removed from the rule?"**
- They are left out of the chart, because they don't count in the grade ([history.js:46-48](../../../frontend/src/lib/history.js#L46-L48))

## 6. Security and QA notes

- **The task id from the URL is escaped** before it goes into a CSS selector
  (`CSS.escape`, [focusTask.js:6](../../../frontend/src/lib/dom/focusTask.js#L6)), and it is encoded when the URL is built
  ([AllSubjectsHistory.jsx:121](../../../frontend/src/features/history/components/AllSubjectsHistory.jsx#L121)).
- **Animations are off** on the lines (`isAnimationActive={false}`,
  [HistoryChart.jsx:352](../../../frontend/src/components/history-chart/HistoryChart.jsx#L352)).
- **The row highlight respects reduced motion** (`motion-reduce:task-highlighted:animate-none` in
  [CurrentTermRecords.jsx:290](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L290)).
- **Performance:** every render recomputes every point. That is fine at a term's size (tens of tasks);
  Recharts is part of one large bundle today (board task T-JM-18, lazy-load the pages).
- **Tests:** [history.test.js](../../../frontend/src/lib/history.test.js) covers the order, ghosts, plan points and axes.

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | People (commits without a trailer) |
| --- | --- | --- | --- |
| `features/history/components/AllSubjectsHistory.jsx` | 21 | 18 | Jun Mari Manla 3 |
| `features/history/components/SubjectGradeHistory.jsx` | 20 | 17 | Jun Mari Manla 2, Lian Dumangas 1 |
| `components/history-chart/HistoryChart.jsx` | 22 | 18 | Jun Mari Manla 4 |
| `components/history-chart/` (the other five files) | 3–11 each | most | Split out 2026-11-12 and 2026-11-13 |
| `hooks/usePointHover.js` | 6 | 5 | Jun Mari Manla 1 |
| `lib/history.js` | 12 | 9 | Jun Mari Manla 3 |

Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Explain how point 3 on a chart is computed.
- [ ] Explain what a ghost grade is, with an example.
- [ ] Say why the tooltip state is outside the chart.
- [ ] Trace a Dashboard point click to the highlighted task row.
- [ ] Say how a screen-reader user gets the chart's data.
- [ ] Explain why "target reached" can disappear after a new score.

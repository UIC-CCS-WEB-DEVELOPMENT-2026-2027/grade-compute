# Target Grade Sandbox (`features/sandbox/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/sandbox/`, `frontend/src/pages/student/TargetGradeSandboxPage.jsx`, `frontend/src/components/SandboxSubjectPicker.jsx`, `frontend/src/lib/sandbox.js`, `frontend/src/lib/targets.js`
- Owner: see [README](../README.md#who-owns-what)

## 1. What it does

At `/student/subject/:id/sandbox?term=prelim`, for one subject and term, the student answers
**"What do I need on each remaining task to reach my target?"**

- **Step 1:** set a sandbox target (it starts at the subject's target, or 90).
- **Step 2:** per criterion, say how many tasks are still to come ("upcoming") and, optionally,
  the percentage they expect on them (for example 80% on the exam).
- **Step 3:** "what if" draft scores for tasks already added. They never change real scores.
- **The result card:** the percentage needed on every other remaining task, or "Out of reach",
  "Reached", a projected grade, or "add upcoming tasks".
- Gauges for official and expected grades, and a chart that continues the real history with the plan.

## 2. Where the code is

| File | Role |
| --- | --- |
| [TargetGradeSandboxPage.jsx](../../../frontend/src/pages/student/TargetGradeSandboxPage.jsx) | The page: heading, term switch, back link |
| [TargetGradeSandbox.jsx](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx) | The three steps, the result card, the gauges and chart |
| [sandbox.js](../../../frontend/src/lib/sandbox.js) | The solver (`getSandboxPlan`), drafts, saved settings |
| [targets.js](../../../frontend/src/lib/targets.js) | Which target applies: the sandbox's own, the subject's, or 90 |
| [SandboxSubjectPicker.jsx](../../../frontend/src/components/SandboxSubjectPicker.jsx) | The sidebar's "which subject?" picker for the sandbox |
| [history.js](../../../frontend/src/lib/history.js) | `getPlanPoints`: the plan as chart points ([history.md](history.md)) |

Tests: [sandbox.test.js](../../../frontend/src/lib/sandbox.test.js),
[targets.test.js](../../../frontend/src/lib/targets.test.js),
[TargetGradeSandbox.test.jsx](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.test.jsx).

## 3. Trace: the student sets a target of 80

Seed record, after a 45/100 on TLA-1 (see [grade-maths.md](grade-maths.md#3-trace-how-one-grade-is-computed)).

1. The page reads `?term=` so it stays on the same term as Subject Detail
   ([TargetGradeSandboxPage.jsx:16-18](../../../frontend/src/pages/student/TargetGradeSandboxPage.jsx#L16-L18)).
2. The component builds a **sandbox record**: the real record with draft scores swapped in. It is
   never saved ([TargetGradeSandbox.jsx:220-222](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L220-L222),
   [sandbox.js:189-218](../../../frontend/src/lib/sandbox.js#L189-L218)).
3. Step 1: the student types 80; on blur `commitTarget` checks 0–100 and saves
   `sandboxDesiredFinalGrade` for this term ([TargetGradeSandbox.jsx:262-273](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L262-L273)).
4. `saveRecord` re-reads the database, replaces this student's record, saves, and shows any error
   ([TargetGradeSandbox.jsx:238-249](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L238-L249)).
5. On the next render the target is 80 ([targets.js:21-32](../../../frontend/src/lib/targets.js#L21-L32)) and
   `getSandboxPlan` solves it ([TargetGradeSandbox.jsx:223-224](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L223-L224)):
   - A = 0.49 × 90 + 0.21 × 45 = 53.55 (AT and TLA are scored)
   - B = 0.30 (only EX-1 is open)
   - R = (80 − 53.55) / 0.30 = 88.1666… → rounded up to **88.17%**
6. The result card shows "88.17%, needed on each remaining task" and the projected grade
   ([TargetGradeSandbox.jsx:105-191](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L105-L191)).
7. Step 3 shows the raw score as a placeholder: 88.17 out of 100
   ([TargetGradeSandbox.jsx:643-651](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L643-L651),
   [sandbox.js:153-158](../../../frontend/src/lib/sandbox.js#L153-L158)).

## 4. Decisions and why

- **Drafts are stored apart from real scores** (`draftScores`, [sandbox.js:220-237](../../../frontend/src/lib/sandbox.js#L220-L237)).
  - Why: planning must never change the grade a student reports; "Official records stay untouched".
- **The official gauge uses the real record; the expected gauge uses the sandbox record**
  ([TargetGradeSandbox.jsx:225-226](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L225-L226)).
- **Official scores beat drafts** ([sandbox.js:200-206](../../../frontend/src/lib/sandbox.js#L200-L206)).
- **One shared required value R for every remaining task**, unless the student gave that
  criterion an expected % ([sandbox.js:12-14](../../../frontend/src/lib/sandbox.js#L12-L14)).
  - Why: one clear number to aim for, solved exactly because the grade is linear in R.
- **Round up, never to nearest** ([sandbox.js:35-38](../../../frontend/src/lib/sandbox.js#L35-L38)).
  - Why: rounding down could tell a student a score that falls just short.
- **A criterion with no tasks yet starts with one upcoming task** ([sandbox.js:60-62](../../../frontend/src/lib/sandbox.js#L60-L62)).
  - Why: the term exam usually isn't added yet but must be planned for.
- **Upcoming is capped at 20 and can't be empty** ([sandbox.js:33](../../../frontend/src/lib/sandbox.js#L33),
  [sandbox.js:239-243](../../../frontend/src/lib/sandbox.js#L239-L243)).
- **Older saved settings still work** (`upcomingAT`, `upcomingTLA`, `expectedExamScore`)
  ([sandbox.js:48-58](../../../frontend/src/lib/sandbox.js#L48-L58)).
- **The layout follows the space beside the sidebar** (a container query), and the answer comes
  first on phones ([TargetGradeSandbox.jsx:293-299](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L293-L299)).

## 5. Likely questions

**"Explain the formula."**
- Term grade = A + B × R; A = what's already fixed, B = the weight still open
- R = (target − A) / B ([sandbox.js:129-142](../../../frontend/src/lib/sandbox.js#L129-L142))
- Each criterion: fixed part = (scored sum + expected × slots) / total tasks; required part = slots / total
  ([sandbox.js:114-118](../../../frontend/src/lib/sandbox.js#L114-L118))

**"When does it say 'Out of reach'?"**
- R > 100: even 100% everywhere stays below the target ([sandbox.js:143-145](../../../frontend/src/lib/sandbox.js#L143-L145))
- The card then shows the best possible grade ([TargetGradeSandbox.jsx:114-117](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L114-L117))

**"Does the sandbox change my real grade?"**
- No. Settings and drafts go under `targetGradeSandbox`; `studentReportedScore` is untouched
  ([TargetGradeSandbox.jsx:275-288](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L275-L288))

**"Is the sandbox target the same as the Subject Detail target?"**
- Not necessarily: the sandbox keeps its own if set, otherwise uses the subject's, otherwise 90
  ([targets.js:21-32](../../../frontend/src/lib/targets.js#L21-L32))

**"Why do the upcoming and expected boxes save on every change, but the target on blur?"**
- They are what the code does today: upcoming and expected call `saveCriterion` in `onChange`
  ([TargetGradeSandbox.jsx:496-511](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L496-L511),
  [TargetGradeSandbox.jsx:524-556](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L524-L556));
  the target uses `onBlur` ([TargetGradeSandbox.jsx:336](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L336))
- Upcoming and expected are clamped into range as you type, so every value is valid

## 6. Security and QA notes

- **Input checks:** the target must be 0–100 ([TargetGradeSandbox.jsx:264-269](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L264-L269));
  drafts use the same `validateScore` as Current Term Records ([TargetGradeSandbox.jsx:277-282](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L277-L282)).
- **Floating-point tolerance:** `1e-9` in the round-up keeps float noise such as 90.00000000000001
  from rounding up to 90.01, and in the comparison keeps 100.0000000001 from counting as
  "out of reach" ([sandbox.js:37](../../../frontend/src/lib/sandbox.js#L37), [sandbox.js:143](../../../frontend/src/lib/sandbox.js#L143)).
- **The result is announced** to screen readers when it changes (`aria-live="polite"`,
  [TargetGradeSandbox.jsx:135](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L135)).
- **A missing rule or record** shows a message instead of a crash
  ([TargetGradeSandbox.jsx:205-218](../../../frontend/src/features/sandbox/components/TargetGradeSandbox.jsx#L205-L218)).
- **Copy:** the conversational predictions in `SPEC.md` §7 are `[PARTIAL]`; board task T-6.

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | People (commits without a trailer) |
| --- | --- | --- | --- |
| `features/sandbox/components/TargetGradeSandbox.jsx` | 36 | 28 | Lian Dumangas (first commit, 2026-10-25) 3, Jun Mari Manla 5 |
| `pages/student/TargetGradeSandboxPage.jsx` | 25 | 17 | Lian Dumangas (first commit) 4, Jun Mari Manla 4 |
| `components/SandboxSubjectPicker.jsx` | 14 | 11 | Jun Mari Manla 2, Lian Dumangas 1 |
| `lib/sandbox.js` | 10 | 9 | Jun Mari Manla 1 |
| `lib/targets.js` | 3 | 3 | Extracted 2026-11-11 |

Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Solve the seed example with target 80 on paper (88.17%).
- [ ] Explain what a "slot" is and where upcoming tasks come from.
- [ ] Explain why the answer is rounded up.
- [ ] Say where drafts are stored and prove they don't change the official grade.
- [ ] Name the five statuses and the card each one shows.
- [ ] Explain the difference between `getTermTarget` and `getSandboxTarget`.

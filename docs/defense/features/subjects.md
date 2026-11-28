# Subjects, the Dashboard and Subject Detail (`features/subjects/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/subjects/`, `frontend/src/pages/student/StudentDashboard.jsx`, `frontend/src/pages/student/SubjectMenu.jsx`, `frontend/src/pages/student/SubjectDetail.jsx`, `frontend/src/lib/subjects.js`, `frontend/src/lib/celebration.js`, `frontend/src/lib/targets.js`, `frontend/src/components/layout/Sidebar.jsx`
- Owner: see [README](../README.md#who-owns-what)

## 1. What it does

- **Dashboard** (`/student/dashboard`): this semester's subjects with official and expected grades,
  the all-subjects history chart, and a "Recent Updates" list.
- **My Subjects** (`/student/subject`): the same table, with a semester picker.
- **Add a subject:** code, name, professor, section and grading rule. It is saved at once and
  marked as a pending verification request.
- **Remove a subject:** from the sidebar's subject menu.
- **Subject Detail** (`/student/subject/:id`): per-term gauges (official, expected, target), the
  target box, Current Term Records ([term-records.md](term-records.md)), the history chart
  ([history.md](history.md)), and a celebration when a grade reaches the target.

## 2. Where the code is

| File | Role |
| --- | --- |
| [StudentDashboard.jsx](../../../frontend/src/pages/student/StudentDashboard.jsx) | Dashboard page (composes) |
| [SubjectMenu.jsx](../../../frontend/src/pages/student/SubjectMenu.jsx) | My Subjects page and the semester picker |
| [EnrolledSubjectsTable.jsx](../../../frontend/src/features/subjects/components/EnrolledSubjectsTable.jsx) | The table, filter, search and the "+ Add subject" button |
| [AddSubjectForm.jsx](../../../frontend/src/features/subjects/components/AddSubjectForm.jsx) | The "New Subject Request" form |
| [SubjectDetail.jsx](../../../frontend/src/pages/student/SubjectDetail.jsx) | Subject Detail page |
| [useSubjectDetail.js](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js) | Subject Detail's state: term, grades, target, celebration |
| [CelebrationDialog.jsx](../../../frontend/src/features/subjects/components/CelebrationDialog.jsx) | "Target achieved" popup with confetti |
| [subjects.js](../../../frontend/src/lib/subjects.js) | Semesters, table rows, `addSubject`, `removeEnrollment` |
| [targets.js](../../../frontend/src/lib/targets.js), [celebration.js](../../../frontend/src/lib/celebration.js) | Target lookups, when to celebrate |
| [Sidebar.jsx](../../../frontend/src/components/layout/Sidebar.jsx) | The subject list and "Remove this subject?" |

Tests: [subjects.test.js](../../../frontend/src/lib/subjects.test.js),
[targets.test.js](../../../frontend/src/lib/targets.test.js),
[celebration.test.js](../../../frontend/src/lib/celebration.test.js),
[SubjectDetail.test.jsx](../../../frontend/src/pages/student/SubjectDetail.test.jsx).

### Data shape (`db.json`)

- `subjects` are **shared** by all students (code, name, default rule).
- `classes` are one offering of a subject; each has `studentRecords`, one per enrolled student,
  holding that student's grades and targets.
- A student "has" a subject when a class has a record with their id
  ([subjects.js:60-66](../../../frontend/src/lib/subjects.js#L60-L66)).

## 3. Trace: adding a subject

1. "+ Add subject" opens the form ([EnrolledSubjectsTable.jsx:93-111](../../../frontend/src/features/subjects/components/EnrolledSubjectsTable.jsx#L93-L111)).
2. The form starts on the rule of the student's last added subject
   ([AddSubjectForm.jsx:33-48](../../../frontend/src/features/subjects/components/AddSubjectForm.jsx#L33-L48),
   [subjects.js:99-112](../../../frontend/src/lib/subjects.js#L99-L112)).
3. Submit: every field is required; the first empty one gets focus
   ([AddSubjectForm.jsx:54-74](../../../frontend/src/features/subjects/components/AddSubjectForm.jsx#L54-L74)).
4. `addSubject(db, studentId, values)` ([subjects.js:116-222](../../../frontend/src/lib/subjects.js#L116-L222)):
   - refuses a code this student already has ([subjects.js:124-140](../../../frontend/src/lib/subjects.js#L124-L140))
   - reuses the shared subject when code and name both match, else adds one ([subjects.js:160-177](../../../frontend/src/lib/subjects.js#L160-L177))
   - adds a class with one record, empty terms, target 90 ([subjects.js:178-197](../../../frontend/src/lib/subjects.js#L178-L197))
   - adds a `pending` verification request ([subjects.js:198-210](../../../frontend/src/lib/subjects.js#L198-L210))
5. The form saves with `saveDb`, or shows the error ([AddSubjectForm.jsx:95-101](../../../frontend/src/features/subjects/components/AddSubjectForm.jsx#L95-L101)).
6. The Dashboard's live `useDb` re-reads and the new row appears
   ([StudentDashboard.jsx:42-48](../../../frontend/src/pages/student/StudentDashboard.jsx#L42-L48));
   My Subjects also switches to the new subject's semester
   ([SubjectMenu.jsx:82-83](../../../frontend/src/pages/student/SubjectMenu.jsx#L82-L83)).

### Trace: the celebration on Subject Detail

1. The term comes from the URL (`?term=midterm`) ([useSubjectDetail.js:26-29](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js#L26-L29)).
2. After every database change, compute official, expected and target, then whether each has
   reached the target ([useSubjectDetail.js:37-57](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js#L37-L57)).
3. Celebrate only when a grade has **just** reached it, compared with what the student last saw
   for this subject and term ([celebration.js:18-29](../../../frontend/src/lib/celebration.js#L18-L29)).
   Opening the page doesn't celebrate.
4. The dialog closes after 6 seconds; the audio plays and stops with it
   ([useSubjectDetail.js:72-99](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js#L72-L99)).
5. The target box saves on blur or Enter, not per keystroke
   ([SubjectDetail.jsx:110-123](../../../frontend/src/pages/student/SubjectDetail.jsx#L110-L123)), so
   "8" on the way to "85" can't trigger it.

## 4. Decisions and why

- **Subjects are shared; enrolments are per student** ([subjects.js:124-126](../../../frontend/src/lib/subjects.js#L124-L126)).
  - Why: two students can add IT101 without clashing; one student can't add it twice.
- **The same code with a different name is a different subject** ([subjects.js:160-162](../../../frontend/src/lib/subjects.js#L160-L162)).
  - Why: the same code can mean different courses at different schools.
- **Status follows the expected grade, passing at 75%** ([subjects.js:75-79](../../../frontend/src/lib/subjects.js#L75-L79)).
- **Semesters come from the date** ([subjects.js:14-35](../../../frontend/src/lib/subjects.js#L14-L35)): August to December
  is First, January to May Second, June and July Summer. Other semesters are disabled in the
  picker ([SubjectMenu.jsx:60-68](../../../frontend/src/pages/student/SubjectMenu.jsx#L60-L68)).
- **Removing the last record removes the class, and an unused subject goes too**
  ([subjects.js:228-272](../../../frontend/src/lib/subjects.js#L228-L272)), along with the
  student's pending requests for it.
- **The whole table row is clickable for mouse users; the links inside are what keyboards and
  screen readers use** ([EnrolledSubjectsTable.jsx:171-183](../../../frontend/src/features/subjects/components/EnrolledSubjectsTable.jsx#L171-L183)).
- **The celebration respects reduced motion** (`motion-reduce:animate-none`,
  [CelebrationDialog.jsx:50](../../../frontend/src/features/subjects/components/CelebrationDialog.jsx#L50)).

## 5. Likely questions

**"What is the difference between the official and the expected grade on the table?"**
- Official: professor scores only. Expected: official first, then the student's own scores
- Both are the final grade so far, three terms equal ([subjects.js:56-69](../../../frontend/src/lib/subjects.js#L56-L69))
- Details: [grade-maths.md](grade-maths.md)

**"Who verifies a new subject?"**
- Nobody yet: the request is saved as `pending` ([subjects.js:198-210](../../../frontend/src/lib/subjects.js#L198-L210))
- The administrator who would verify it is `[PLANNED]` (`SPEC.md` §6, item e)
- The "Requests awaiting verification" list is never shown today, because every request has a class (AUDIT B8, [SubjectMenu.jsx:86](../../../frontend/src/pages/student/SubjectMenu.jsx#L86))

**"Is 'Recent Updates' real?"**
- No. Three fixed sample entries ([StudentDashboard.jsx:19-39](../../../frontend/src/pages/student/StudentDashboard.jsx#L19-L39), AUDIT B13)
- Board task T-1 makes it real

**"Why does Subject Detail say First Semester 2026–2027 for every subject?"**
- The label is fixed text ([SubjectDetail.jsx:63-65](../../../frontend/src/pages/student/SubjectDetail.jsx#L63-L65))
- Board task T-4 shows the class's real semester

**"How does the celebration avoid firing when you just open the page?"**
- It compares with the previous achievement for the same subject and term; with none, it returns `null`
  ([celebration.js:21-22](../../../frontend/src/lib/celebration.js#L21-L22))

**"What if a subject's id in the URL isn't yours?"**
- `getStudentClass` finds no record for you, `found` is false, and the page says
  "Subject not found" ([SubjectDetail.jsx:42-49](../../../frontend/src/pages/student/SubjectDetail.jsx#L42-L49))

## 6. Security and QA notes

- **Free-text fields** (professor, section, subject name) are shown as React text, which React
  escapes, so typed HTML is not run.
- **Remove subject saves with plain `saveDb` and no `try`/`catch`**
  ([Sidebar.jsx:107-123](../../../frontend/src/components/layout/Sidebar.jsx#L107-L123)). A full
  storage would throw. Board task T-28 adds the error to the dialog.
- **The Subject Detail target is not range-checked when read** (AUDIT B11, kept)
  ([targets.js:34-42](../../../frontend/src/lib/targets.js#L34-L42)); typed targets are checked
  before saving ([targets.js:44-50](../../../frontend/src/lib/targets.js#L44-L50)).
- **The audio's autoplay block is expected** and not logged as an error
  ([useSubjectDetail.js:89-93](../../../frontend/src/features/subjects/hooks/useSubjectDetail.js#L89-L93)).
- **Semesters depend on today's date.** A class with no semester (the seed's `C101`) counts as the
  First Semester of the current academic year ([subjects.js:42-50](../../../frontend/src/lib/subjects.js#L42-L50)),
  so from January it drops off the Dashboard and My Subjects, where only the current semester can
  be picked. The sidebar still lists it. Board task T-4.
- **Tests freeze the date** at 2026-11-11 so the semester logic is repeatable
  ([fixedDate.js](../../../frontend/src/test/fixedDate.js)).

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | People (commits without a trailer) |
| --- | --- | --- | --- |
| `pages/student/StudentDashboard.jsx` | 43 | 15 | Kit Jasper M. Caballero 12, Jun Mari Manla 9, Lian Dumangas 5, others 2 |
| `pages/student/SubjectDetail.jsx` | 56 | 32 | Lian Dumangas 14, Jun Mari Manla 8, LerasanReyian 2 |
| `pages/student/SubjectMenu.jsx` | 27 | 12 | Jun Mari Manla 9, Kit Jasper M. Caballero 3, Lian Dumangas 3 |
| `features/subjects/components/AddSubjectForm.jsx` | 14 | 9 | Jun Mari Manla 3, Lian Dumangas 2 (first commit: Lian Dumangas) |
| `features/subjects/components/EnrolledSubjectsTable.jsx` | 13 | 10 | Jun Mari Manla 3 |
| `features/subjects/hooks/useSubjectDetail.js`, `CelebrationDialog.jsx` | 2 each | 2 each | Extracted from `SubjectDetail.jsx` on 2026-11-13 |
| `lib/subjects.js` | 8 | 6 | Jun Mari Manla 2 |
| `components/layout/Sidebar.jsx` | 49 | 19 | Jun Mari Manla 19, Lian Dumangas 10, LerasanReyian 1 |

Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Trace "Add subject" from the button to the new row, naming each function.
- [ ] Explain shared subjects versus per-student records, with the `db.json` seed.
- [ ] Say which semester 2026-11-11 falls in and why ([subjects.js:14-22](../../../frontend/src/lib/subjects.js#L14-L22)).
- [ ] Explain when the celebration fires and when it doesn't.
- [ ] Name two things on these screens that are placeholders today, and their board tasks.
- [ ] Say what happens to verification requests when a subject is removed.

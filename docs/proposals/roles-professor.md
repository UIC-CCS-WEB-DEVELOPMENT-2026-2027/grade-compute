# Draft: `spec/roles/professor.md`

**A draft, not the spec** (T-JM-16, 2026-11-28). It shows how `spec/roles/professor.md` would read
once approved. T-JM-1 writes it into the spec through the protocol in `AGENTS.md` §2. The
workspace is built later, in T-JM-9. Shared rules are linked, not repeated: grading maths in
`spec/grading-rules.md` §4, tables in `spec/data-model.md` §5 (draft: [`data-model.md`](data-model.md)),
endpoints in `spec/api.md` (draft: [`api.md`](api.md)), access in `SPEC.md` §6 (draft:
[`scope.md`](scope.md)).

## Open questions

The text below follows the recommended answers.

**P1 (`SPEC.md` §10, question 1). When a student-made subject is linked to a professor's class,
what is overwritten?**
Recommended: **the class's rule and its task list become the professor's. The student's own tasks
and self-reported scores are kept as custom tasks**, so they still count in the expected grade and
nothing the student typed is lost. Their targets carry over, and sandbox plans carry over for the
criteria that still exist. The student sees what will change and confirms before the link happens.
Reason: the professor's class is the official record, so its rule and tasks must win (D2). Custom
tasks already mean "the student's own, counted in the expected grade only" (§4), so they fit the
student's earlier tasks exactly, and the student can delete them if they're duplicates.

**P2. How does a student join a professor's class?**
Recommended: **with a join code the professor shares** (8 letters and digits, without look-alike
characters such as 0 and O). The student enters it in Add subject. The professor can also add a
student by email, and can make a new code, which stops the old one working.
Reason: a code works with no email service and no class list from the registrar, and it's the
pattern students already know from Google Classroom.

**P3. What if a professor changes a rule that already has scores?**
Recommended: **it's allowed, with the impact warning the rule editor already shows** (F10), listing
the professor's classes it affects. Tasks under a criterion the new rule removes stay saved but
don't count, as today (`spec/grading-rules.md` §4).
Reason: syllabi change in mid-term, and the impact dialog already covers it for students.

**P4. Can a professor delete a task that has official scores?**
Recommended: **yes, after a confirmation that says how many scores go with it.**
Reason: a task made by mistake has to be removable, and the confirmation makes the loss clear. A
deleted task disappears from every student's records, so the confirmation names the class too.

**P5. Is there a history of changes to official scores?**
Recommended: **not in this version.** Each score keeps who entered it and when it was first
entered; a change overwrites the value.
Reason: a full history is a table of its own and a screen to read it. It belongs with disputes or
verifiable reports (`SPEC.md` §8), which aren't planned yet.

**P6. What does a professor see about each student?**
Recommended: **the official term grades and final grade, and the official scores**, computed in
the browser with the same functions students use (`frontend/src/lib/grades.js`). Never
self-reported scores, custom tasks, targets or sandbox plans (`SPEC.md` §6, open question S5).

---

# CompUGrade — Professor role [PLANNED]

The professor creates classes with their own computation rules, lets students in, creates the
class's tasks and enters the official scores that students see as locked (F6, D1, D2). The
professor works only on their own classes.

## 1. Account

- **Register** as Professor on the sign-in page (F1). The account starts as `pending`.
- **While pending**, signing in shows only: "Your professor account is waiting for an
  administrator's approval." An administrator approves or rejects it (`spec/roles/admin.md`).
- **Once approved** (`active`), the professor sees the professor workspace. Until that workspace is
  built, signing in shows "Login verified. The Professor Workspace is coming soon." (`SPEC.md` §6).
- **Settings** (`/settings`) works as it does for students (F14): profile, password, sessions,
  notifications. A professor's profile has no student number or year level.

## 2. Classes (`/professor/classes`)

A class is one section of one subject in one semester, taught by the professor.

- **The list** shows the professor's classes for the chosen semester: subject code and name,
  section, number of students, and the rule.
- **New class** asks for:
  - subject code and subject name. A subject whose code and name both match an existing one is
    reused, as Add subject does (F4)
  - section (for example `BSIT-2A`)
  - semester (First, Second or Summer) and academic year (for example `2026-2027`)
  - units, a whole number from 1 to 10 (default 3)
  - the rule: one of the professor's own rules. A template rule can be duplicated first (F10)
- **What it creates:** a class with status `verified`, owned by the professor, with a new join code.
  A professor's class needs no administrator's check: the account was already approved.
- **Edit** changes any of those fields. Changing the rule shows the impact warning (§4).
- **Delete** is allowed only while no student is enrolled: "Remove the students first, then delete
  the class."

## 3. Students (`/professor/classes/:classId`, Students tab)

- **The roster** lists each enrolled student: name, email, program section, and the official
  prelim, midterm, finals and final grades (§4 of `spec/grading-rules.md`, official only).
- **Join code:** shown with a copy button. "New code" makes another and stops the old one
  working. "Turn off" stops anyone joining until a new code is made.
- **Add by email:** the email of a registered student. If no student has it: "No student account
  uses this email." If that student already added this subject themselves, they aren't added:
  "This student added this subject themselves. Ask them to join with the class code, so they can
  link it." (a link needs the student's confirmation, §6).
- **Remove a student** after a confirmation. It removes that student's enrolment in this class:
  their official scores, and their own tasks, scores, targets and sandbox plans for it.
- A student joins with the code in Add subject. If they already have a student-made subject with
  the same subject code, they're offered the link in §6 instead.

## 4. Rules

- The professor uses the same rules list and rule editor as students (F10), at
  `/professor/rules`, `/professor/rules/new` and `/professor/rules/:ruleId`. The rules there are
  the professor's own, plus the template rules to duplicate.
- The impact warning lists the professor's classes that use the rule and the number of students
  in each.
- Students in the class can read the rule and duplicate it, but not change it (`SPEC.md` §6).

## 5. Tasks and official scores (`/professor/classes/:classId`, Scores tab)

**Tasks.** A class's tasks belong to the class, so every enrolled student has them.

- The tab has term tabs (Prelim, Midterm, Finals), as Subject Detail does (F7), and one section
  per leaf criterion of the class's rule.
- **Add task:** title, an optional description, and a maximum score (a whole number above 0). The
  sequence number is the next one in that criterion.
- **Edit** changes the title, description or maximum. A maximum lower than a score already entered
  is refused: "Some scores are higher than this maximum."
- **Delete** after a confirmation: "Delete {title}? Its {n} official scores in {subject code}
  {section} will be deleted too." (open question P4).

**Official scores.** A grid for one term and one criterion: a row per student, a column per task.

- Each cell takes a whole-number score from 0 to the task's maximum, checked as in
  `spec/grading-rules.md` §4 (score-entry validation). An empty cell is no score.
- "Save" sends the changed cells together, and they're saved all together or not at all. If a cell
  is refused, nothing is saved: each refused cell shows its message, and the rest keep what was
  typed, so the professor fixes the cell and saves again.
- **Students see a saved score at once**, locked (F6, F8): it replaces their self-reported score
  in both grades, and their entry becomes the history's ghost point (F11).
- **Times:** a score's `officialScoredAt` is set when it's first entered, kept when it changes, and
  cleared when the score is cleared. The history orders tasks by it (`spec/grading-rules.md` §4).
- **Someone else changed it:** if one of the scores was saved elsewhere after this grid loaded
  (another tab), nothing is saved, and that cell shows "This was changed since you opened it" with
  the newer value (`spec/api.md`, 409).

## 6. Linking a student-made subject to a professor's class

Before the professor's class existed, a student may have added the same subject themselves (F4).
When that student joins the professor's class with its code, or an administrator links their
request to it (`spec/roles/admin.md`):

1. **The student sees what will change** and confirms: the class's rule becomes the professor's,
   and the professor's tasks and official scores appear. Their own tasks stay, as custom tasks.
2. **The class's rule and task list become the professor's.** The student's student-made class
   is replaced by an enrolment in the professor's class.
3. **The student's tasks** from their own subject become custom tasks in the professor's class,
   under the same criterion id if the professor's rule has it. Their self-reported scores move
   with them, so the expected grade still counts them. Tasks under a criterion the professor's
   rule doesn't have stay saved but don't count (§4).
4. **Targets** (`desiredFinalGrade`, per term and overall) carry over. **Sandbox plans** carry
   over for the criteria the professor's rule also has; draft scores are dropped, because they
   belonged to the old tasks.
5. The student's verification request, if there is one, is marked `linked`.

Nothing is linked without the student's confirmation, and nothing the student typed is deleted.

## 7. What a professor can't do

- See or change another professor's classes, tasks or scores.
- See students' self-reported scores, custom tasks, targets or sandbox plans (`SPEC.md` §6).
- Write a score in a student-made class.
- Approve accounts or verify subjects (that's the administrator's).

## 8. Screens

| Route | Screen |
| --- | --- |
| `/professor/classes` | Classes list, with a semester picker and "New class" |
| `/professor/classes/:classId` | One class: Students, Scores and Class settings tabs |
| `/professor/rules`, `/professor/rules/new`, `/professor/rules/:ruleId` | The rule pages (F10) |
| `/settings` | Settings (F14) |

The professor's sidebar has Classes, Grade Rules and Settings, and lists the professor's classes
for the current semester under Classes, as the student's sidebar lists subjects (F13). Every screen
follows `AGENTS.md` §7.

## 9. Not in this version

- uploading or exporting scores as CSV or Excel (`SPEC.md` §8)
- notifying students or parents when scores are posted (`SPEC.md` §8)
- several professors on one class
- a history of score changes (open question P5)

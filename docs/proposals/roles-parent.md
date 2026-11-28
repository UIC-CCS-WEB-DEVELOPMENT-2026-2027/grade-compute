# Draft: `spec/roles/parent.md`

**A draft, not the spec** (T-JM-16, 2026-11-28). It shows how `spec/roles/parent.md` would read once
approved. T-JM-1 writes it into the spec through the protocol in `AGENTS.md` §2. The portal is built
later, in T-JM-11. Shared rules are linked, not repeated: grading maths in
`spec/grading-rules.md` §4, tables in `spec/data-model.md` §5 (draft: [`data-model.md`](data-model.md)),
endpoints in `spec/api.md` (draft: [`api.md`](api.md)), access in `SPEC.md` §6 (draft:
[`scope.md`](scope.md)).

The data privacy review (T-JM-27) may change this draft, especially §2: it asks how a
parent–student link is verified. Its answer comes before the portal is built.

## Open questions

The text below follows the recommended answers.

**R1. How is a parent linked to a student?**
Recommended: **the student makes a link code in Settings and gives it to the parent**, who enters
it in their portal. A code works once and expires after 48 hours. The student sees every linked
parent and can remove one at any time.
Reason: most Phase 1 students are adults, so the link should need their consent, and making the
code is that consent. It needs no administrator and no email service. A parent can't link to a
student by guessing an email.

**R2. What does a parent see?**
Recommended: **official data only:** each linked student's subjects, the official scores of the
professor's tasks, and the official term and final grades with their status. Never self-reported
scores, custom tasks, targets, the sandbox or expected grades (`SPEC.md` §6, open question S5).
Reason: official grades are what "a transparent window into their child's progress"
(`docs/project_details.md`) needs. The rest is the student's own planning space.

**R3. What does a parent see for a student-made subject?**
Recommended: **the subject is listed, with "No official scores yet: this subject isn't linked to
a professor's class."**
Reason: every score in a student-made subject is self-reported (F6), so showing grades there would
break R2. Listing the subject still tells the parent it exists.

**R4. Is the status a parent sees worked out the same way as the student's?**
Recommended: **no: from the official final grade**, with the same thresholds ("Passing" at 75 or
more, "Below passing" under 75, "No grades yet" when there is none; `spec/grading-rules.md` §4).
The student's own status uses the expected grade.
Reason: the expected grade includes self-reported scores, which the parent doesn't see.

---

# CompUGrade — Parent role [PLANNED]

A parent or guardian, linked to a student with the student's consent, sees that student's official
grades, read-only (`SPEC.md` §1, §8). They can't change anything of the student's.

## 1. Account

- **Register** as Parent on the sign-in page (F1). The account is `active` at once: it shows
  nothing until a student links it (§2).
- Until the portal is built, signing in shows "Login verified. This workspace is not available
  yet." (`SPEC.md` §6).
- **Settings** (`/settings`) works as for everyone else (F14). A parent's profile has no student
  number, program or year level.

## 2. Linking (open question R1)

1. **The student** opens Settings, Account, "Parents and guardians", and presses "Create a link
   code". The code (8 letters and digits) is shown with when it expires (48 hours later). A new
   code replaces the old one.
2. **The parent** opens their portal, presses "Link a student", and enters the code. If it's wrong
   or expired: "This code isn't valid. Ask the student for a new one."
3. **Once linked**, the code stops working, the parent sees the student's name, and the student
   sees the parent's name and email under "Parents and guardians".
4. **Removing:** the student can remove a linked parent, and a parent can remove a linked
   student, each after a confirmation. An administrator can also remove a link
   (`spec/roles/admin.md` §7).

A student can have several linked parents, and a parent several linked students.

## 3. Linked students (`/parent`)

A card for each linked student: name, program section, and their subjects for the current semester
with each subject's official final grade and status (open question R4). A parent with no linked
student sees how to link one (§2).

## 4. A student's subjects (`/parent/students/:studentId`)

- A semester picker, and the student's subjects for that semester: code, name, professor, section,
  official final grade and status.
- **A subject** opens, read-only:
  - term tabs (Prelim, Midterm, Finals), as on Subject Detail (F7)
  - the official term grade, and the official final grade
  - for each criterion of the class's rule, the professor's tasks with their official scores, or
    "No score yet"
- **A student-made subject** shows "No official scores yet: this subject isn't linked to a
  professor's class." (open question R3).
- Grades are computed in the browser with `frontend/src/lib/grades.js`, from official scores only.

## 5. What a parent can't do

- Change anything of the student's: scores, subjects, targets, rules or Settings.
- See self-reported scores, custom tasks, targets, the sandbox or expected grades (open question
  R2).
- See a student who hasn't linked them.

## 6. Screens

| Route | Screen |
| --- | --- |
| `/parent` | Linked students, and "Link a student" |
| `/parent/students/:studentId` | One student's subjects, and a subject's official grades |
| `/settings` | Settings (F14) |

Every screen follows `AGENTS.md` §7.

## 7. Not in this version

- email or SMS summaries and alerts when grades are posted or drop below a threshold
  (`SPEC.md` §8)
- messages to professors
- parents of students under 18, which may need the school to verify the link (T-JM-27)

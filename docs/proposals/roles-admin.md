# Draft: `spec/roles/admin.md`

**A draft, not the spec** (T-JM-16, 2026-11-28). It shows how `spec/roles/admin.md` would read once
approved. T-JM-1 writes it into the spec through the protocol in `AGENTS.md` §2. The workspace is
built later, in T-JM-10, after the professor's (T-JM-9). Shared rules are linked, not repeated:
tables in `spec/data-model.md` §5 (draft: [`data-model.md`](data-model.md)), endpoints in
`spec/api.md` (draft: [`api.md`](api.md)), access in `SPEC.md` §6 (draft: [`scope.md`](scope.md)).

## Open questions

The text below follows the recommended answers.

**A1. What does "verifying a subject" (F3, D11) mean once professors have classes?**
Recommended: **the administrator decides each request a student's Add subject makes, in one of
three ways:**
- **Approve:** the subject is real and there's no professor's class for it in CompUGrade. The
  student's class becomes `verified`.
- **Link:** it matches a professor's class. The student is asked to confirm the link
  (`spec/roles/professor.md` §6); until they do, the request waits as `link proposed`.
- **Reject**, with a short note the student sees. The class stays usable, marked "Not verified".
Reason: it keeps D11 (unverified subjects are usable), gives the request a real end, and lets the
administrator connect students to their professor's official scores without overwriting anything
behind the student's back.

**A2. Does the administrator see grades?**
Recommended: **no, not in this version.** The administrator sees accounts, classes, subjects,
requests and parent links, but no scores or grades.
Reason: verifying needs none of them, and each role should see only what it needs (T-JM-27).
Finding at-risk students (`docs/project_details.md`) is a later feature, with its own spec and
its own access rules.

**A3. How does someone who forgot their password get back in?**
Recommended: **until email is set up, an administrator sets a temporary password**, gives it to
the person, and the person must choose a new one when they next sign in. Password reset by email
comes later, once the hosted app has a mail service.
Reason: a mail service is a new account and a cost the owner hasn't approved, and without some
way back a forgotten password locks the person out for good.

**A4. Can an administrator delete an account?**
Recommended: **no; they deactivate it.** A deactivated account can't sign in, and its data is
kept. Students and parents delete their own accounts in Settings (`spec/api.md`).
Reason: deleting a student's account deletes their grades, which shouldn't happen on someone
else's decision. Deactivating is reversible.

**A5. Are administrators' actions recorded?**
Recommended: **yes, in Laravel's log:** who did what to which record, and when. No table and no
screen in this version.
Reason: approvals, deactivations and temporary passwords are the actions most worth tracing (OWASP
A09:2025, Security Logging and Alerting Failures). The log needs no new table.

---

# CompUGrade — Administrator role [PLANNED]

The administrator keeps CompUGrade's accounts and subjects trustworthy: they approve professor
accounts, verify the subjects students add (F3, D11), and manage accounts. They don't see grades.

## 1. Account

- Administrator accounts can't be registered. Another administrator creates them (§4), or the
  seeder does (`spec/data-model.md` §5).
- Until the workspace is built, signing in shows "Login verified. This workspace is not available
  yet." (`SPEC.md` §6).
- **Settings** (`/settings`) works as for everyone else (F14).

## 2. Overview (`/admin`)

Counts with links: professor accounts waiting for approval, verification requests waiting, and
accounts by role.

## 3. Professor approvals (`/admin/professors`)

- A list of professor accounts with status `pending`: name, email and the date they registered.
- **Approve** makes the account `active`. **Reject** deactivates it, so signing in shows the
  deactivated-account message: "This account is deactivated. Contact your school's administrator."
  (`spec/api.md` §5.1).

## 4. Accounts (`/admin/accounts`)

- A list of every account, 25 to a page, with search (name or email) and filters (role, status).
- **Deactivate** and **Reactivate**, after a confirmation. An administrator can't deactivate their
  own account, and the last active administrator can't be deactivated.
- **Temporary password** (open question A3): the administrator types one that meets the password
  rules (F1). The person must choose a new password when they next sign in, and every other
  signed-in session of theirs is signed out.
- **New administrator:** name, email and a temporary password.
- The administrator sees each account's name, email, role, status and registration date, and for a
  student their program section. Nothing else of the account's data.

## 5. Verification requests (`/admin/requests`)

A request is made each time a student adds a subject themselves (F4). The list shows the waiting
ones first, 25 to a page: the student, the subject code and name, the section, the professor name
the student typed, and the date.

For each request, the administrator chooses (open question A1):

- **Approve:** the student's class becomes `verified`.
- **Link** to a professor's class: the administrator searches the professor classes (by subject
  code, section or professor) and picks one. The request becomes `link proposed`, and the student
  sees on My Subjects: "Your professor has this subject in CompUGrade. Link it to see official
  scores?" with the changes listed (`spec/roles/professor.md` §6). When the student confirms, the
  request becomes `linked`. If they decline, it goes back to the waiting list with a note.
- **Reject**, with a note of up to 200 characters. The class stays usable, marked "Not verified",
  and the student sees the note on My Subjects.

Every decision records who made it and when. A student who removes the subject withdraws its
request.

This makes F3's "Requests awaiting verification" list real: My Subjects shows the student's
waiting, `link proposed` and rejected requests.

## 6. Subjects (`/admin/subjects`)

- The catalogue of subject codes and names, with search.
- **Edit** fixes a code or a name (for example a typo). The change shows on every class of that
  subject. Two subjects can't end up with the same code and name.

## 7. Parent links (`/admin/accounts/:userId`)

- On a student's or parent's account, the administrator sees which parents and students are linked.
- **Remove link**, after a confirmation, for example when a link was made by mistake. The student
  and the parent each see that it's gone.

## 8. What an administrator can't do

- See scores, grades, targets or sandbox plans (open question A2).
- Change a class's tasks or scores, or anyone's rules.
- Read a password: passwords are stored hashed. They can only set a temporary one (§4).
- Delete an account (open question A4).

## 9. Screens

| Route | Screen |
| --- | --- |
| `/admin` | Overview |
| `/admin/professors` | Professor approvals |
| `/admin/requests` | Verification requests |
| `/admin/accounts`, `/admin/accounts/:userId` | Accounts, and one account with its parent links |
| `/admin/subjects` | Subjects |
| `/settings` | Settings (F14) |

Every screen follows `AGENTS.md` §7. The lists are paginated by the API (`spec/api.md`).

## 10. Not in this version

- seeing grades or finding at-risk students (open question A2)
- several schools, or administrators for one school only (`SPEC.md` §2)
- bulk account import
- password reset by email (open question A3)

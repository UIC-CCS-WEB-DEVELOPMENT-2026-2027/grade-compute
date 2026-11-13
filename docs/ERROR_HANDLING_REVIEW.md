# CompUGrade — Error-Handling Review

Task T-21 (owner request, 2026-11-13). A read-only review: it lists every place an error can
happen, what the student sees today, and a proposed fix for each. **Nothing here is fixed.** Each
fix changes behaviour, so it becomes a separate task once the owner approves it (§8).

- **Code reviewed:** `main` at `3bad8a7` (2026-11-13).
- **How:** the code was read, and a temporary test rendered every signed-in screen with damaged
  stored data and failing saves (§9). Results marked **(probe)** were seen in that test, not only
  read in the code.
- **Severity:** **High** = the student loses data or can't use the app. **Medium** = a screen
  breaks or a change is lost, but only with unusual data or a failed save. **Low** = confusing, but
  nothing is lost.
- Bugs already in `docs/AUDIT.md` §12 are linked, not repeated.

## 1. Summary

The app was built for the happy path. Reading stored data is guarded, but a failure there has no
way out. Most saves catch errors but show the browser's technical message. Nothing catches an
error while a screen renders. The findings that matter most:

1. **No error boundary (E6).** Any exception while rendering blanks the whole app: a white page
   with no message.
2. **Unreadable stored data locks the student out for good (E1, E2, E3).** Every page sends them
   to the login page, and the login page says "Refresh and try again", which never helps.
3. **Grade Rules and the rule editor overwrite newer data (E9).** Removing a subject, then
   duplicating a rule, brings the removed subject back **(probe)**.
4. **Settings crashes on damaged account data or a failed save (E16, E17).** A phone photo of a
   few MB is enough to hit the storage limit, and the page goes blank right after it says "Profile
   picture saved."
5. **Save errors show raw browser text (E12)**, and some failed or impossible saves show nothing
   at all (E11, E14, E15).

## 2. How errors are handled today

| Layer | Today |
| --- | --- |
| Reading `compugrade_db` | `getDb()` (`src/services/db.js:29-45`) catches everything and returns `null`. It doesn't check the shape of what it parsed |
| Upgrading old data | `migrateDb` (`src/services/migrations.js`) runs inside `getDb()`; any failure there also gives `null` |
| Saving `compugrade_db` | `saveDb` throws on failure; `saveDbSafely` returns `{ ok, error }`. The rule pages use `saveDbSafely`; the other five callers wrap `saveDb` in their own `try`/`catch`, except the Sidebar |
| Other keys | `activeUserId`, the sidebar state and the rule thumbnail are guarded. `compugrade-account` (`src/services/localAccountStore.js`) is not guarded anywhere |
| Rendering | No error boundary in `src/app/App.jsx` or `src/app/main.jsx`. An exception unmounts the whole app |
| Messages | Each component writes its own message. Six of them append `error.message` from the browser |

## 3. Reading stored data

| ID | When it happens (where) | What the student sees today | Proposed fix |
| --- | --- | --- | --- |
| **E1** High | `compugrade_db` isn't JSON, or is JSON of the wrong shape (`[]`, a string, an object with no `users`). `getDb()` returns `null` or the odd value (`db.js:29-45`). `initializeDatabase()` doesn't re-seed, because the key exists (`db.js:11-24`) | Every signed-in page sends them to the login page **(probe: all 7 screens)**. Logging in says "Account data is unavailable. Refresh and try again." (`src/features/auth/hooks/useAuthForm.js:83-85`). Refreshing doesn't help; only clearing the site's data does, and nothing says so | Check the shape in `getDb()` (an object with `users`, `subjects`, `classes` and `computationRules` arrays). When the data can't be used, copy it to a backup key and show a recovery screen: what happened, and a "Start again with fresh data" button that re-seeds after a confirmation. Never delete the old data silently |
| **E2** High | Old (v1) data is upgraded, but saving the upgraded copy fails, for example because storage is full. The `catch` in `getDb()` returns `null` although the data was read and upgraded (`db.js:38-43`) | The same lock-out as E1 **(probe: `getDb()` returned `null`)** | Return the upgraded data even when the write-back fails, and try the write again on the next read |
| **E3** Medium | The browser blocks site data (a privacy setting, some private modes). `initializeDatabase()` swallows the error (`db.js:20-23`) | The login form works, but submitting says "Account data is unavailable. Refresh and try again." Refreshing never helps | Check once at start-up whether storage works. If it doesn't, the login page says CompUGrade needs the browser to allow site data, and how to allow it |
| **E4** Low | Data written by a newer version (`schemaVersion` above 2) is used as if it were current (`migrations.js:62-64`) | Nothing today: no version writes above 2. It matters only after a future migration, if someone opens an older deployment | No task now. Revisit with the next `SCHEMA_VERSION` |
| **E5** Low | A legacy rule whose weights can't be read becomes the standard rule (`src/lib/rules.js:557`, through `migrations.js:17`) | Grades for that subject use the default weights, with no notice | No task now (legacy data only). If it's ever needed: keep the unreadable weights and flag the rule on Grade Rules |

## 4. Errors while rendering

| ID | When it happens (where) | What the student sees today | Proposed fix |
| --- | --- | --- | --- |
| **E6** High | Any exception while a screen renders. There is no error boundary (`src/app/App.jsx`, `src/app/main.jsx`) | A blank white page. No message; the only way out is the address bar | An app-wide error boundary that shows a short message with "Reload" and "Go to the Dashboard", and logs the error to the console. It turns every crash below into a message instead of a blank page |
| **E7** Medium | A class without `studentRecords`, or a database without `subjects` (`src/components/layout/Sidebar.jsx:89-95`: `c.studentRecords.some`, `dbData.subjects.find`) | Every signed-in page goes blank, because the Sidebar is on all of them **(probe: all 7 screens)** | Treat a missing list as empty in the Sidebar. The shape check in E1 also stops this data from loading |
| **E8** Medium | A `null` (or non-object) entry in a term's task list (`src/lib/grades.js:124`: `task.isCustomTask`; `src/lib/history.js:53`: `task.maxScore`) | Dashboard, Subject Detail and the sandbox go blank **(probe)** | `toTaskList` (`src/lib/grades.js:13-18`) drops entries that aren't objects, so every caller is covered in one place. Add tests |

These damaged shapes were also tried and **don't crash** **(probe)**: no `computationRules`, a
class whose rule doesn't exist, `criteria` that isn't a list, no `effectiveMultipliers`, a record
without `grades`, a term set to `null`, a text `maxScore`, and a user without a `name`. The screens
show their existing "not available" or empty states.

## 5. Saving

| ID | When it happens (where) | What the student sees today | Proposed fix |
| --- | --- | --- | --- |
| **E9** High | Grade Rules and the rule editor read the database once (`useDb({ live: false })`) and build every save from that copy (`src/pages/student/GradeRules.jsx:45, 54-76`; `src/features/grade-rules/hooks/useRuleEditor.js:38, 63-71, 87, 103, 144`). Any save made after the page opened is overwritten: the Sidebar's "Remove subject" on the same page, or another tab | The change silently comes back or disappears. Removing a subject, then pressing Duplicate on a rule, brings the subject back **(probe)** | Build each save from `getDb()` at the moment of saving, as Current Term Records does. Add a test for the probe's case |
| **E10** Medium | Two tabs. `useDb` listens only to its own tab's save event, not to the browser's `storage` event (`src/hooks/useDb.js`) | The other tab keeps showing old grades until it's reloaded. Apart from E9, saves read fresh data first, so nothing else is lost | `useDb` also listens to `storage` events for `compugrade_db` |
| **E11** Medium | Removing a subject when the save fails. `saveDb` isn't guarded (`Sidebar.jsx:117`), inside the dialog's action (`Sidebar.jsx:700-703`) | The confirmation stays open, nothing happens, and nothing says why | Use `saveDbSafely` and show the error in the dialog |
| **E12** Medium | Any failed save of `compugrade_db`: the sandbox (`src/features/sandbox/components/TargetGradeSandbox.jsx:247`), the Subject Detail target (`src/features/subjects/hooks/useSubjectDetail.js:140`), Current Term Records (`src/features/term-records/components/CurrentTermRecords.jsx:73`), Add subject (`src/features/subjects/components/AddSubjectForm.jsx:98`), the rule editor (`useRuleEditor.js:66`) and Grade Rules (`GradeRules.jsx:57`) | The browser's own text, for example "Your changes could not be saved: Failed to execute 'setItem' on 'Storage': Setting the value of 'compugrade_db' exceeded the quota." **(probe)** | One helper in `src/services/` turns the error into plain words ("Your browser's storage is full…", "Your browser is blocking storage…") and logs the details to the console. Every save message uses it |
| **E13** Low | Current Term Records' save message says "Unable to save sandbox changes" (`CurrentTermRecords.jsx:73`) | The wrong screen name in the message | Fix with E12 |
| **E14** Medium | The data can't be read at the moment of saving. The sandbox (`TargetGradeSandbox.jsx:240`) and the Subject Detail target (`useSubjectDetail.js:130`) just `return` | The change is dropped without a word. Current Term Records and Add subject show a message in the same case | Show the same message as Current Term Records |
| **E15** Low | Duplicate fails on the rule editor (`useRuleEditor.js:145`: `if (result.ok && …)`) | Nothing happens. Grade Rules shows `result.error` in the same case | Show `result.error`, as Grade Rules does |

## 6. Settings (`compugrade-account`)

| ID | When it happens (where) | What the student sees today | Proposed fix |
| --- | --- | --- | --- |
| **E16** High | `compugrade-account` isn't JSON. `JSON.parse` isn't guarded (`src/services/localAccountStore.js:71-74`) and runs while the page first renders (`src/features/settings/hooks/useGlobalSettings.js:29, 37`) | Settings goes blank **(probe)** | Guard the read. On failure, keep a backup copy, load the defaults and say that the saved settings couldn't be read |
| **E17** High | Saving the account fails, usually because storage is full. `saveLocalAccount` runs after every change (`useGlobalSettings.js:58-60`) and isn't guarded (`localAccountStore.js:135-144`). The likely trigger is the profile photo: it's stored as text (a data URL) with no size limit (`useGlobalSettings.js:73-97`), and a phone photo of a few MB exceeds the browser's limit of about 5 MB | "Profile picture saved." appears, then the page goes blank **(probe, failing write)**. After a reload the photo isn't there | Guard the save and show a message if it fails. Shrink the photo before saving it (for example to 256 px with a canvas), or refuse files over a set size with a message. The limit is the owner's decision |
| **E18** Low | Signing out a session (`useGlobalSettings.js:258-261`) saves without a guard. The legacy-key clean-up (`useGlobalSettings.js:54-56`) also throws if storage is blocked, but a student can't get that far without storage | The button seems to do nothing | Fix with E17 |
| **E19** Low | A chosen photo can't be read. `FileReader` has no `onerror` (`useGlobalSettings.js:82-86`) | Nothing happens | Show "That image couldn't be read. Try another file." |
| **E20** Low | The password and verification features need a secure page: `crypto.subtle` and `crypto.randomUUID` exist only on HTTPS or `localhost`. Opening the dev server by its network address over plain HTTP (testing on a phone) breaks them | "Could not verify your current password. Please try again." or "Could not create a verification code. Please try again." The deployed site (HTTPS) is fine | No code change: a note in `docs/DEVELOPER_GUIDE.md` §6 about testing on a phone |

Settings' known bugs (B1, B3–B6 in AUDIT §12) and B21 (task T-20) are separate and not repeated.

## 7. Invalid input

The score, custom-task, target, rule and sign-in checks all catch bad input before it's saved
(`src/lib/scores.js`, `src/lib/rules.js`, `src/lib/targets.js`, `src/features/auth/lib/accounts.js`).
What remains:

| ID | When it happens (where) | What the student sees today | Proposed fix |
| --- | --- | --- | --- |
| **E21** Low | A Subject Detail target outside 0–100 (for example 150) is dropped (`src/lib/targets.js:46-50`, `useSubjectDetail.js:126-127`). `SPEC.md` §4 documents this | The box quietly goes back to the old value, with no message. The sandbox's target box does show one | Show "Enter a target from 0 to 100." as the sandbox does. Needs a `SPEC.md` §4 change |
| **E22** Low | Settings' account fields (email, phone and so on) are free text with no checks | Anything is accepted | No task now: it belongs with T-11 (linking the Settings account to the signed-in user, AUDIT B4) |

Known input and data inconsistencies already in AUDIT §12: B10 (`officialScore` of `""`), B11
(the Subject Detail target isn't range-checked when it's read), B16 (the sandbox's "Upcoming
tasks" box forces 0).

## 8. Proposed tasks (for the owner to approve)

Each one is a behaviour change, so it needs the owner's approval and, where it changes what the
student sees, a `SPEC.md` update through its protocol. Suggested order: data loss and lock-outs
first.

| # | Task | Fixes | Areas | Needs |
| --- | --- | --- | --- | --- |
| 1 | Rule pages save fresh data | E9, E15 | grade-rules | A test for the probe's case. Smallest fix, worst data loss |
| 2 | Recover from unreadable stored data | E1, E2, E3 | shared (`src/services/db.js`), auth | A recovery screen and its wording (`SPEC.md` F1, F15). A backup key changes stored data: LOCK-data and `SPEC.md` §5 |
| 3 | App-wide error boundary | E6 | `src/app/` (in no area today), shared (a new component) | Its wording in `SPEC.md`. `App.jsx` is a rule file (`docs/TEAM_WORKFLOW.md` §5) |
| 4 | Settings storage can fail safely | E16–E19 | settings | The photo size limit or resize (owner), `SPEC.md` F14 |
| 5 | Damaged records don't crash screens | E7, E8 | layout (Sidebar), term-records (`src/lib/grades.js`) | Tests for each damaged shape in §4 |
| 6 | Plain-language save errors | E11–E14 | shared (the helper) first, then layout, sandbox, subject-detail, term-records, subjects, grade-rules | Wording in `SPEC.md`. It touches six areas, so: one small shared PR for the helper, then one PR per area |
| 7 | Other tabs stay in sync | E10 | shared (`src/hooks/useDb.js`) | A test |
| 8 | Out-of-range target message on Subject Detail | E21 | subject-detail | `SPEC.md` §4 |
| 9 | Note on testing security features over HTTP | E20 | docs | Nothing |

Not proposed as tasks: E4, E5 and E22 (recorded above).

## 9. How this was checked

- The code under `src/services/`, `src/hooks/`, `src/app/`, every `try`/`catch`, every
  `localStorage` call and every `saveDb` caller was read.
- A temporary Vitest file (not committed) rendered the seven signed-in screens (Dashboard, My
  Subjects, Subject Detail, sandbox, Grade Rules, rule editor, Settings), each with the seed data
  damaged in one way, inside a test-only error boundary. It recorded whether each screen rendered,
  redirected or crashed. It also made storage writes fail, to see each save's message, and replayed
  the Sidebar's remove-then-duplicate case on Grade Rules.
- The damaged shapes tried: not JSON; a JSON array; a JSON string; `{}`; `schemaVersion` 99; a
  class without `studentRecords`; no `subjects`; no `computationRules`; a missing rule id;
  `criteria` that isn't a list; no `effectiveMultipliers`; a record without `grades`; a `null`
  term; a `null` task; a text `maxScore`; a user without a `name`; and a damaged
  `compugrade-account`.
- The fix tasks in §8 should turn their cases from this list into permanent tests.

# Sign-in and registration (`features/auth/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/auth/`, `frontend/src/pages/auth/`, `frontend/src/services/session.js`, `frontend/src/app/RequireStudent.jsx`
- Owner: see [README](../README.md#who-owns-what)

## 1. What it does

- The page at `/` has two tabs: **Log In** and **Create Account**.
- Log in with an email or a user id (for example `U1`) and a password.
- Register as a Student or a Professor.
- A student is signed in and sent to the Dashboard (or to the student page they first asked for).
- Professors and admins are verified and then stopped with "coming soon" messages: their
  workspaces don't exist (`SPEC.md` §6).
- No server: the accounts are the `users` list in the browser's database.

## 2. Where the code is

| File | Role |
| --- | --- |
| [LoginRegister.jsx](../../../frontend/src/pages/auth/LoginRegister.jsx) | The page: tabs, fields, messages, the hero |
| [useAuthForm.js](../../../frontend/src/features/auth/hooks/useAuthForm.js) | The form's state and the submit |
| [accounts.js](../../../frontend/src/features/auth/lib/accounts.js) | Pure checks and lookups: validate, register, authenticate |
| [AcademicPreview.jsx](../../../frontend/src/features/auth/components/AcademicPreview.jsx) | The decorative hero card (hidden from screen readers) |
| [session.js](../../../frontend/src/services/session.js) | Who is signed in (`activeUserId`), sign out |
| [RequireStudent.jsx](../../../frontend/src/app/RequireStudent.jsx) | The route guard that sends signed-out visitors to `/` |

Tests: [accounts.test.js](../../../frontend/src/features/auth/lib/accounts.test.js).

## 3. Trace: a student logs in

1. The form submits to `handleSubmit` ([LoginRegister.jsx:240-241](../../../frontend/src/pages/auth/LoginRegister.jsx#L240-L241);
   `noValidate`, so our own messages show instead of the browser's).
2. [useAuthForm.js:63-75](../../../frontend/src/features/auth/hooks/useAuthForm.js#L63-L75): stop the
   page reload, check the fields with `validateAuthFields`, focus the first bad field.
3. [accounts.js:19-52](../../../frontend/src/features/auth/lib/accounts.js#L19-L52): on log in, the
   identifier and password must not be empty.
4. [useAuthForm.js:76-97](../../../frontend/src/features/auth/hooks/useAuthForm.js#L76-L97): read the
   database; stop with a message if it is missing or a user entry is damaged.
5. [accounts.js:84-100](../../../frontend/src/features/auth/lib/accounts.js#L84-L100) `authenticateAccount`:
   find a user whose id or email matches (case-insensitive), then compare the password.
6. [useAuthForm.js:141-149](../../../frontend/src/features/auth/hooks/useAuthForm.js#L141-L149): not a
   student → clear any previous sign-in and show "coming soon".
7. [useAuthForm.js:151-161](../../../frontend/src/features/auth/hooks/useAuthForm.js#L151-L161): save
   the user's id under `activeUserId`.
8. [useAuthForm.js:162-169](../../../frontend/src/features/auth/hooks/useAuthForm.js#L162-L169): go to
   the page the guard remembered, but only if it is `/settings` or starts with `/student/`;
   otherwise the Dashboard. `replace: true`, so Back doesn't return to the login page.
9. Every student page now passes [RequireStudent](../../../frontend/src/app/RequireStudent.jsx#L9-L15),
   which checks [getActiveStudentId](../../../frontend/src/services/session.js#L17-L22).

### Registering

- [accounts.js:54-82](../../../frontend/src/features/auth/lib/accounts.js#L54-L82): validate, refuse a
  registered email, give the next id (`U4` after `U3`), add the user.
- Password rules: 8+ characters, an uppercase letter, a number, a special character
  ([accounts.js:3-17](../../../frontend/src/features/auth/lib/accounts.js#L3-L17)).
- A professor's account is saved, then the form returns to Log In with a message
  ([useAuthForm.js:126-132](../../../frontend/src/features/auth/hooks/useAuthForm.js#L126-L132)).

### Signing out

- The sidebar's Logout link calls `signOut` and goes to `/`
  ([Sidebar.jsx:591](../../../frontend/src/components/layout/Sidebar.jsx#L591),
  [session.js:30-36](../../../frontend/src/services/session.js#L30-L36)).
- Settings' Log Out button doesn't sign out today (board task T-8; see [settings.md](settings.md)).

## 4. Decisions and why

- **Checks are pure functions in `accounts.js`; the hook only saves and navigates**
  ([accounts.js:1-2](../../../frontend/src/features/auth/lib/accounts.js#L1-L2)).
  - Why: they can be tested without a browser.
- **Only the path of a redirected page is reused, and only for student pages**
  ([useAuthForm.js:162-168](../../../frontend/src/features/auth/hooks/useAuthForm.js#L162-L168)).
  - Why: an open redirect could send a user to any URL after sign-in (B14).
- **A non-student login clears the previous sign-in**
  ([useAuthForm.js:98-108](../../../frontend/src/features/auth/hooks/useAuthForm.js#L98-L108)).
  - Why: a professor logging in on a shared browser must not stay signed in as the last student.
- **The session check also looks at the role** ([session.js:17-22](../../../frontend/src/services/session.js#L17-L22)).
  - Why: a removed account or a non-student id in `activeUserId` doesn't count as signed in.
- **Field errors are linked to their inputs and the first one gets focus**
  ([useAuthForm.js:59-61](../../../frontend/src/features/auth/hooks/useAuthForm.js#L59-L61)); the
  page uses `autoComplete` hints ([LoginRegister.jsx:70](../../../frontend/src/pages/auth/LoginRegister.jsx#L70),
  [LoginRegister.jsx:274](../../../frontend/src/pages/auth/LoginRegister.jsx#L274),
  [LoginRegister.jsx:289](../../../frontend/src/pages/auth/LoginRegister.jsx#L289)).

## 5. Likely questions

**"Are the passwords hashed?"**
- **No, not for sign-in.** Seed and registered passwords are stored as plain text in the users list
  ([accounts.js:78](../../../frontend/src/features/auth/lib/accounts.js#L78)) and compared as plain
  text ([accounts.js:97](../../../frontend/src/features/auth/lib/accounts.js#L97))
- Say it plainly; it is a known gap: board task T-13, "Hash the login passwords"
- The Settings password is different: it is salted and hashed with PBKDF2 ([settings.md](settings.md))
- The real fix is server-side: Laravel hashes passwords (bcrypt) and Sanctum handles sessions (T-JM-4)

**"Can a user get into someone else's account?"**
- Anyone with the browser can: the data and the `activeUserId` key are in `localStorage`
- Within the app, pages only show the signed-in student's records
  ([records.js:26-34](../../../frontend/src/services/records.js#L26-L34) looks up by student id)
- Real access control needs the server (T-JM-4: roles and policies)

**"What stops an open redirect after login?"**
- Only `location.state.from`, set by our own guard, is read
- It must be `/settings` or start with `/student/` ([useAuthForm.js:162-168](../../../frontend/src/features/auth/hooks/useAuthForm.js#L162-L168))

**"How is the next user id chosen?"**
- Highest `U<n>` + 1 ([accounts.js:69-74](../../../frontend/src/features/auth/lib/accounts.js#L69-L74))
- The database will use auto-increment ids instead (`docs/LARAVEL_PLAN.md` §8)

**"Why does the form use `noValidate`?"**
- So our messages (linked to the field, announced) show instead of the browser's own bubbles

## 6. Security and QA notes

- **Plain-text passwords** in [db.json](../../../frontend/src/services/db.json) and in
  `localStorage` (T-13). The admin seed password is `admin`.
- **No rate limit or lockout** on sign-in attempts: there is no server to enforce one.
- **The route guard is client-side only** ([RequireStudent.jsx](../../../frontend/src/app/RequireStudent.jsx)).
- **Email check** is a simple pattern ([accounts.js:36](../../../frontend/src/features/auth/lib/accounts.js#L36)); no verification email is sent.
- **Storage failures** each have their own message instead of a crash
  ([useAuthForm.js:118-125](../../../frontend/src/features/auth/hooks/useAuthForm.js#L118-L125),
  [useAuthForm.js:151-160](../../../frontend/src/features/auth/hooks/useAuthForm.js#L151-L160)).
- **Tests:** [accounts.test.js](../../../frontend/src/features/auth/lib/accounts.test.js) covers the field checks, registration and lookups.

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | First commit |
| --- | --- | --- | --- |
| `pages/auth/LoginRegister.jsx` | 33 | 16 | Jun Mari Manla, 2026-10-06; LerasanReyian made 15 of the others |
| `features/auth/hooks/useAuthForm.js` | 2 | 2 | 2026-11-13, extracted from `LoginRegister.jsx` |
| `features/auth/lib/accounts.js` | 2 | 2 | 2026-11-11, extracted from `LoginRegister.jsx` |
| `features/auth/components/AcademicPreview.jsx` | 2 | 2 | 2026-11-13, extracted |

- The login UI was first built by LerasanReyian ("I added LoginRegister UI", 2026-10-07).
- Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Trace a student login from the submit to the Dashboard, naming each function.
- [ ] Say where the password is compared and why that is a security gap.
- [ ] Explain why `from` is checked before navigating.
- [ ] Explain what happens when a professor logs in.
- [ ] Say how Laravel and Sanctum will change sign-in (T-JM-4).
- [ ] Find the test that refuses a duplicate email in [accounts.test.js](../../../frontend/src/features/auth/lib/accounts.test.js).

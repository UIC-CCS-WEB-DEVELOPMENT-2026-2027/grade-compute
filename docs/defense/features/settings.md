# Account settings (`features/settings/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/settings/`, `frontend/src/pages/settings/`, `frontend/src/services/localAccountStore.js`, `frontend/src/services/prototypeVerification.js`
- Owner: see [README](../README.md#who-owns-what)

Much of this screen is a **prototype**: it says so on screen. Be ready to say which parts are
real and which are simulated.

## 1. What it does

At `/settings`, five sections: **Profile**, **Account**, **Security**, **Notifications**, **Account Actions**.

| Part | Real or simulated |
| --- | --- |
| Account details and profile photo | Real, but saved to a separate browser account, not the signed-in user (T-11) |
| Change password | Real hashing (PBKDF2), but the code is shown on screen instead of sent |
| Two-factor authentication | Simulated; codes are shown on screen |
| Login activity (sessions) | Simulated sample sessions |
| Notification toggles | Not saved (T-10) |
| Download, Clear | No action (T-10) |
| Log Out | Asks to confirm, then does nothing (T-8) |

The screen says it: "Password, verification, and session data are simulated in this browser
prototype. Production authentication requires a backend."
([SecuritySection.jsx:203-206](../../../frontend/src/features/settings/components/SecuritySection.jsx#L203-L206)).

## 2. Where the code is

| File | Role |
| --- | --- |
| [GlobalSettings.jsx](../../../frontend/src/pages/settings/GlobalSettings.jsx) | The page: tabs and the section shown |
| [useGlobalSettings.js](../../../frontend/src/features/settings/hooks/useGlobalSettings.js) | All of the page's state and actions |
| [SecuritySection.jsx](../../../frontend/src/features/settings/components/SecuritySection.jsx) | Password, 2FA and sessions screens |
| [AccountSection.jsx](../../../frontend/src/features/settings/components/AccountSection.jsx), [ProfileSection.jsx](../../../frontend/src/features/settings/components/ProfileSection.jsx), [NotificationsSection.jsx](../../../frontend/src/features/settings/components/NotificationsSection.jsx), [AccountActionsSection.jsx](../../../frontend/src/features/settings/components/AccountActionsSection.jsx) | The other sections |
| [localAccountStore.js](../../../frontend/src/services/localAccountStore.js) | The Settings account in `compugrade-account`; password hashing |
| [prototypeVerification.js](../../../frontend/src/services/prototypeVerification.js) | In-memory 6-digit codes |

There are no automated tests for this feature yet.

## 3. Trace: changing the password

1. "Change password" opens the flow ([useGlobalSettings.js:206-215](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L206-L215)).
2. **Continue** ([useGlobalSettings.js:113-165](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L113-L165)):
   - required fields filled
   - if a password is set, the current one must match: `verifyLocalPassword`
   - new password: 8+ characters, an uppercase letter, a number; the two boxes match
   - the new password must differ from the current one
3. `verifyLocalPassword` re-derives the hash with the stored salt and iterations and compares
   byte by byte in constant time ([localAccountStore.js:175-192](../../../frontend/src/services/localAccountStore.js#L175-L192)).
4. **Send code:** `createPrototypeChallenge` makes a random 6-digit code that lives 5 minutes, in
   memory only ([useGlobalSettings.js:167-177](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L167-L177),
   [prototypeVerification.js:28-42](../../../frontend/src/services/prototypeVerification.js#L28-L42)).
   It is shown on screen as "Prototype code (not sent)" ([SecuritySection.jsx:105-111](../../../frontend/src/features/settings/components/SecuritySection.jsx#L105-L111)).
5. **Verify:** at most 5 tries, then the code is thrown away
   ([prototypeVerification.js:44-55](../../../frontend/src/services/prototypeVerification.js#L44-L55)).
6. **Save:** `saveLocalPassword` makes a new 16-byte random salt and stores a PBKDF2-SHA-256 hash with
   120,000 iterations ([localAccountStore.js:157-173](../../../frontend/src/services/localAccountStore.js#L157-L173),
   [localAccountStore.js:58-69](../../../frontend/src/services/localAccountStore.js#L58-L69)).

**This password is not the login password.** Sign-in checks the plain-text password in the
database's `users` list ([auth.md](auth.md) §5). The two are separate today (T-11, T-13).

## 4. Decisions and why

- **The Web Crypto API (`crypto.subtle`) for hashing** ([localAccountStore.js:58-69](../../../frontend/src/services/localAccountStore.js#L58-L69)).
  - Why: built into the browser, no dependency; PBKDF2 with a salt is a standard password hash.
- **Constant-time comparison** ([localAccountStore.js:185-191](../../../frontend/src/services/localAccountStore.js#L185-L191)).
  - Why: comparing every byte avoids leaking how many leading bytes matched (a timing attack).
- **Codes from `crypto.getRandomValues`, not `Math.random`** ([prototypeVerification.js:34](../../../frontend/src/services/prototypeVerification.js#L34)).
- **Contacts are masked** (`j***@…`, `****1234`) ([prototypeVerification.js:5-15](../../../frontend/src/services/prototypeVerification.js#L5-L15)).
- **State lives in one hook above the sections** ([useGlobalSettings.js:1-7](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L1-L7)).
  - Why: a half-done password change survives switching sections; the page's Help can open Security help.
- **Older saved data is moved into one key** ([localAccountStore.js:98-125](../../../frontend/src/services/localAccountStore.js#L98-L125)).
- **Only JPG and PNG photos** ([useGlobalSettings.js:73-87](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L73-L87)).

## 5. Likely questions

**"Is the 2FA real?"**
- No. The code is generated in the browser and shown on screen; nothing is sent
- A real one needs a server to send the code by email or SMS and to check it

**"How do you store the Settings password?"**
- PBKDF2-SHA-256, 120,000 iterations, a random 16-byte salt, stored in Base64
  ([localAccountStore.js:4](../../../frontend/src/services/localAccountStore.js#L4), [localAccountStore.js:157-173](../../../frontend/src/services/localAccountStore.js#L157-L173))
- Not the plain password, and the salt makes two equal passwords hash differently

**"Then why are login passwords plain text?"**
- Two different stores: login uses the `users` list in `compugrade_db`; Settings uses `compugrade-account`
- Known gap, board tasks T-13 (hash the login passwords) and T-11 (link Settings to the signed-in user)
- The Laravel back end replaces both (T-JM-4)

**"Why does Log Out in Settings do nothing?"**
- The page expects an `onLogout` prop ([GlobalSettings.jsx:22](../../../frontend/src/pages/settings/GlobalSettings.jsx#L22)), but the route passes none
  ([App.jsx:42](../../../frontend/src/app/App.jsx#L42)); kept as it is (AUDIT B1), board task T-8
- The sidebar's Logout does sign out ([auth.md](auth.md))

**"What happens to a big photo?"**
- It is stored as a data URL in `localStorage`, with no size limit
  ([useGlobalSettings.js:82-86](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L82-L86)); a large one can fill storage
- Board task T-26 sets a limit

## 6. Security and QA notes

- **Verification codes are shown on screen and kept in memory** (lost on reload).
- **Passwords are kept in React state while typing** and cleared after success
  ([useGlobalSettings.js:198-199](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L198-L199)).
- **The account is saved on every change** of the profile state ([useGlobalSettings.js:58-60](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L58-L60)).
- **The default account is sample data** not linked to the signed-in student
  ([localAccountStore.js:6-42](../../../frontend/src/services/localAccountStore.js#L6-L42)). Its
  default bio is a placeholder word ("pangit", [localAccountStore.js:16](../../../frontend/src/services/localAccountStore.js#L16));
  check what Settings shows before a live demo.
- **The 2FA "Turn on" error is set but not shown** when no contact is verified
  ([useGlobalSettings.js:217-224](../../../frontend/src/features/settings/hooks/useGlobalSettings.js#L217-L224)); board task T-20.
- **HTTPS:** `crypto.subtle` only works in a secure context (HTTPS or `localhost`), so these features fail when
  the dev server is opened by its network address on a phone (board task T-31).
- **No tests** cover this feature.

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | People (commits without a trailer) |
| --- | --- | --- | --- |
| `pages/settings/GlobalSettings.jsx` | 23 | 18 | Marco Liu 3, Jun Mari Manla 1, LerasanReyian 1 |
| `features/settings/hooks/useGlobalSettings.js` | 23 | 18 | Marco Liu 3, Jun Mari Manla 1, LerasanReyian 1 (extracted from the page) |
| `features/settings/components/*` | 2–7 each | all | Split out of the page 2026-11-12 and 2026-11-13 |
| `services/localAccountStore.js` | 7 | 5 | Marco Liu (first commit, 2026-10-07) 2 |
| `services/prototypeVerification.js` | 4 | 3 | Marco Liu (first commit, 2026-10-07) 1 |

Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Say which parts of Settings are real and which are simulated.
- [ ] Explain PBKDF2, the salt and the iterations in your own words.
- [ ] Explain why the comparison is constant-time.
- [ ] Explain why the Settings password and the login password are different, and the fix.
- [ ] Say why Settings' Log Out does nothing and what T-8 changes.
- [ ] Say why `crypto.subtle` needs HTTPS or `localhost`.

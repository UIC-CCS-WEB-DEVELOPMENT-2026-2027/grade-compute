# Rehearsal: midterm

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/auth/`, `frontend/src/services/`, `frontend/src/app/`, `frontend/src/features/settings/`, `frontend/src/lib/scores.js`
- Date of the defense: _(owner fills in)_

## 1. What the midterm asks

From the CC013.23 documents (not in the repository; check against the syllabus):

- An **API security exam**.
- The **AT2 audit**. Its checklist isn't in the repository; add it here when the professor gives it.
- Course outcome CO2 names WCAG 2.2, OWASP and Playwright.

## 2. Where we stand (2026-11-28)

There is no API yet, so most API security lives in the plan (`docs/LARAVEL_PLAN.md`), not the
code. Know both: what the browser app does today, and what the API will do.

| Topic | Today, in the code | Planned |
| --- | --- | --- |
| Passwords | **Plain text** for sign-in ([accounts.js:97](../../../frontend/src/features/auth/lib/accounts.js#L97)); PBKDF2 for the Settings password ([localAccountStore.js:157-173](../../../frontend/src/services/localAccountStore.js#L157-L173)) | Laravel hashing (T-JM-4); T-13 |
| Sign-in and sessions | `activeUserId` in `localStorage` ([session.js](../../../frontend/src/services/session.js)) | Sanctum SPA cookie auth, CSRF token (T-JM-4) |
| Access control | Client-side route guard only ([RequireStudent.jsx](../../../frontend/src/app/RequireStudent.jsx)) | Policies on every record (T-JM-4) |
| Input validation | Score, target, rule and form checks in the browser ([scores.js](../../../frontend/src/lib/scores.js), [rules.js:910-945](../../../frontend/src/lib/rules.js#L910-L945)) | Form Requests on the API (T-JM-5) |
| Injection | No SQL; React escapes text; task ids are CSS-escaped ([focusTask.js:6](../../../frontend/src/lib/dom/focusTask.js#L6)) | Eloquent only, no raw SQL (`docs/LARAVEL_PLAN.md` §8) |
| Redirects | Only our own paths after sign-in ([useAuthForm.js:162-168](../../../frontend/src/features/auth/hooks/useAuthForm.js#L162-L168)) | — |
| Secrets | None in the code | `.env`, never committed (T-JM-17) |
| Error details | Caught errors show a message, some with the browser's error text (T-28); no app-wide error boundary yet (T-25) | One error format; `APP_DEBUG=false` in production (T-JM-4, T-JM-8) |
| HTTPS | Vercel serves HTTPS; `crypto.subtle` needs a secure context (T-31) | Render and Vercel both HTTPS (T-JM-8) |
| Accessibility (WCAG 2.2) | Labels, focus, `aria-live`, keyboard slider, chart tables (see the chapters) | Audit T-JM-12 |
| End-to-end tests (Playwright) | Screenshots only, not tests | T-JM-23 |

## 3. Questions to drill

**OWASP categories** (names stable across versions; check the numbering the course uses):

- **Broken access control:** "Can a student see another student's grades?" → today, anyone with the
  browser can read `localStorage`; the app filters by student id ([records.js:26-34](../../../frontend/src/services/records.js#L26-L34)); the API's policies fix it
- **Cryptographic failures:** "How are passwords stored?" → [auth.md](../features/auth.md) §5 and [settings.md](../features/settings.md) §5. Say plainly that sign-in passwords are plain text today
- **Injection:** "Where could injection happen?" → no SQL today; React escapes; once the API exists, Eloquent's parameter binding
- **Authentication failures:** no rate limit or lockout today ([auth.md](../features/auth.md) §6); planned: Laravel's rate limiting on the login route (check the Laravel docs when T-JM-4 is built)
- **Security misconfiguration:** debug mode off, CORS and Sanctum stateful domains (T-JM-4, T-JM-8)

**Other likely questions:**

- "What is CSRF and how does Sanctum stop it?" → [glossary.md](../glossary.md), back-end words
- "Why cookies and not tokens in `localStorage`?" → owner decision, `docs/LARAVEL_PLAN.md` §1 item 6
- "What does the server trust from the client?" → planned: nothing; it validates every input (T-JM-5). Grade maths stays in the browser, but stored scores are validated
- "Show me one input check and its test." → `validateScore` and [scores.test.js](../../../frontend/src/lib/scores.test.js)

## 4. Two weeks before

- [ ] Run `/defense-update defense midterm`.
- [ ] Replace section 2's "Planned" cells with links to the merged API code.
- [ ] Add the AT2 audit checklist and answer each item with a code link or a board task.
- [ ] Each owner rehearses their chapter's section 6 (security and QA notes).

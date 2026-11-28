# Glossary

Words you will hear in the defense, and where they live in our code. "Planned" means not built yet.

## CompUGrade words

| Term | Meaning | Where |
| --- | --- | --- |
| **3-state grading** | Each task is official (locked), self-reported, or empty; official wins | [grades.js:20-30](../../frontend/src/lib/grades.js#L20-L30) |
| **Official grade** | Grade from professor scores only; custom tasks skipped | [grades.js:76-79](../../frontend/src/lib/grades.js#L76-L79) |
| **Expected grade** | Official scores, with the student's own scores filling the gaps | [grades.js:81-85](../../frontend/src/lib/grades.js#L81-L85) |
| **Grade so far** | Only criteria (and terms) with a score count; weights are renormalized | [grades.js:46-48](../../frontend/src/lib/grades.js#L46-L48) |
| **Rule** (grade computation rule) | How a subject's grade is built from criteria and weights | [rules.js](../../frontend/src/lib/rules.js) |
| **Criterion / subcriterion** | A part of a rule (Classwork, Exam); a criterion can be split into subcriteria | [rules.js:11-14](../../frontend/src/lib/rules.js#L11-L14) |
| **Leaf / deepest criterion** | A criterion with no subcriteria; tasks are stored under its id | [rules.js:608-633](../../frontend/src/lib/rules.js#L608-L633) |
| **Share units** | Percentages as whole hundredths: 100% = 10000 | [rules.js:7-9](../../frontend/src/lib/rules.js#L7-L9) |
| **Effective share / multiplier** | A leaf's part of the total grade (AT = 0.49) | [rules.js:420-455](../../frontend/src/lib/rules.js#L420-L455) |
| **Pill editor** | The rule editor's bars with draggable dividers | [PillEditor.jsx](../../frontend/src/features/grade-rules/components/PillEditor.jsx) |
| **Task** | One assessment: max score, official score, self-reported score | [CurrentTermRecords.jsx:157-172](../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L157-L172) |
| **Custom task** | A private task the student adds; counts in the expected grade only | [grades.js:24](../../frontend/src/lib/grades.js#L24) |
| **Term** | Prelim, Midterm or Finals; the three count equally in the final grade | [terms.js](../../frontend/src/lib/terms.js) |
| **Target grade** | The grade the student aims for; 90 by default | [targets.js](../../frontend/src/lib/targets.js) |
| **Sandbox** | The planner that solves for the score needed on remaining tasks | [sandbox.js](../../frontend/src/lib/sandbox.js) |
| **Slot** | A remaining task in the sandbox: an unscored task or an upcoming one | [sandbox.js:10-11](../../frontend/src/lib/sandbox.js#L10-L11) |
| **Draft score** | A "what if" score used only in the sandbox | [sandbox.js:25-27](../../frontend/src/lib/sandbox.js#L25-L27) |
| **Ghost grade** | On a history chart, the grade with your own entry instead of the official score | [history.js:105-109](../../frontend/src/lib/history.js#L105-L109) |
| **Subject / class / record** | Shared course / one offering of it / one student's grades in it | [subjects.md](features/subjects.md) |
| **Verification request** | A `pending` note that a student added a subject; no one acts on it yet | [subjects.js:198-210](../../frontend/src/lib/subjects.js#L198-L210) |
| **Schema version** | The stored data's format number (2 today), for migrations | [migrations.js:8](../../frontend/src/services/migrations.js#L8) |

## Web and React words

| Term | Meaning | Where |
| --- | --- | --- |
| **SPA** (single-page app) | One HTML page; JavaScript swaps the screens | [vercel.json](../../frontend/vercel.json) sends every path to `index.html` |
| **Component** | A function that returns UI | Every `.jsx` file |
| **Hook** | A function starting with `use` that holds state or effects | [hooks/](../../frontend/src/hooks/), `features/*/hooks/` |
| **State** | Data a component remembers between renders (`useState`) | [useDb.js:9](../../frontend/src/hooks/useDb.js#L9) |
| **Effect** | Code that runs after render, with a cleanup (`useEffect`) | [useDb.js:11-16](../../frontend/src/hooks/useDb.js#L11-L16) |
| **Props** | Inputs passed to a component | `subjects`, `studentId` on [EnrolledSubjectsTable.jsx:48-54](../../frontend/src/features/subjects/components/EnrolledSubjectsTable.jsx#L48-L54) |
| **Route / route guard** | A URL mapped to a page / a check before showing it | [App.jsx](../../frontend/src/app/App.jsx), [RequireStudent.jsx](../../frontend/src/app/RequireStudent.jsx) |
| **Pure function** | Same input, same output, changes nothing outside | Everything in [lib/](../../frontend/src/lib/) |
| **Immutable update** | Build a new object instead of changing the old one | [records.js:6-20](../../frontend/src/services/records.js#L6-L20) |
| **`localStorage`** | Browser key-value storage that survives reloads | [db.js](../../frontend/src/services/db.js) |
| **Migration (data)** | Code that upgrades stored data to a new format | [migrations.js](../../frontend/src/services/migrations.js) |
| **shadcn/ui, Base UI** | Copy-in UI components built on Base UI primitives | [components/ui/](../../frontend/src/components/ui/) |
| **Tailwind tokens** | Named design values (colours, sizes) used as classes | [index.css](../../frontend/src/index.css) |
| **ARIA** | Attributes that tell assistive tech what an element is | `role="slider"` in [PillLevel.jsx:393](../../frontend/src/features/grade-rules/components/PillLevel.jsx#L393) |
| **PBKDF2, salt** | A slow password hash; random bytes that make equal passwords hash differently | [localAccountStore.js:58-69](../../frontend/src/services/localAccountStore.js#L58-L69) |
| **Constant-time compare** | Compare every byte so timing doesn't leak a match | [localAccountStore.js:185-191](../../frontend/src/services/localAccountStore.js#L185-L191) |
| **Open redirect** | Sending a user to any URL taken from input; we only allow our own paths | [useAuthForm.js:162-168](../../frontend/src/features/auth/hooks/useAuthForm.js#L162-L168) |
| **Vitest, React Testing Library** | The test runner; testing components the way a user sees them | `*.test.js(x)` next to the code |
| **CI** | Checks that run on every pull request | [ci.yml](../../.github/workflows/ci.yml) |

## Back-end words (planned)

None of these exist in the code yet. Plan: `docs/LARAVEL_PLAN.md`.

| Term | Meaning | Board task |
| --- | --- | --- |
| **REST API** | URLs for resources; POST create, GET read, PUT/PATCH update, DELETE delete | T-JM-5 |
| **Status codes** | 200/201 success, 401/403 not signed in / not allowed, 404/422 not found / invalid, 500 server error | T-JM-4, T-JM-5 |
| **Laravel** | The PHP framework for the API (version 12) | T-JM-17 |
| **Eloquent** | Laravel's ORM: queries as PHP, no raw SQL | T-JM-3 |
| **Migration (database)** | PHP code that creates or changes a table (`php artisan migrate`) | T-JM-3 |
| **Seeder** | Code that fills the database with starting data (from `db.json`) | T-JM-3 |
| **Sanctum (SPA cookie auth)** | Laravel's sign-in for single-page apps, with a session cookie and CSRF token | T-JM-4 |
| **CSRF** | A forged request from another site; Sanctum's XSRF token stops it | T-JM-4 |
| **Policy** | Laravel code that decides who may read or change a record | T-JM-4 |
| **Form Request, API Resource** | Laravel validation class; Laravel response shape | T-JM-5 |
| **Axios** | The HTTP client the React app will use, from `frontend/src/services/` only | T-JM-6 |
| **Pest, Playwright** | API tests; browser end-to-end tests | T-JM-4, T-JM-23 |
| **`.env`** | The file for secrets and settings; never committed | T-JM-17 |
| **TiDB Cloud, Render, Vercel** | Hosted database, API host, front-end host | T-JM-8 |

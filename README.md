# CompUGrade
**Academic Grade Tracking and Prediction Platform**

🚀 **[Live Demo: View CompUGrade on Vercel](https://grade-compute.vercel.app/)**

> **AI Disclosure:** The codebase for this project, as well as this README documentation, were developed with the assistance of Artificial Intelligence tools. AI was utilized for system architecture planning, UI/UX prompt generation, hierarchical logic formulation, and React component generation.

---

## 📖 Overview
CompUGrade addresses a critical gap in student life: **grade transparency**. Even when professors share their syllabus and grading formulas, students often struggle to accurately compute their real-time academic standing, leading to anxiety and reactive studying.

CompUGrade replaces manual computation and static Learning Management Systems (LMS) with an automated hierarchical grading engine. It lets students self-report scores, track their exact current standing, see how their grade has moved over time, and use a predictive **Target Grade Sandbox** to find out precisely what they need on future tasks to reach their goal.

### The Team
*   Manla, Jun Mari
*   Caballero, Kit Jasper
*   Dumangas, Lian
*   Lerasan, Reyian
*   Liu, Marco

---

## 🚀 Getting Started

**Requirements:** Node.js 20.19+ or 22.12+ (required by Vite 8).

```bash
git clone <repository-url>
cd grade-compute
npm install
npm run dev
```

Open the address Vite prints (usually `http://localhost:5173`).

| Script | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot reload |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the built `dist/` folder locally |
| `npm run lint` | Checks the code with ESLint (including React Hooks rules) |

### Demo account
| Role | Email | Password |
|---|---|---|
| Student | `ysa@student.edu` | `password123` |

You can also register a new student account from the login page. Each account only sees its own subjects and scores.

---

## ✨ Features

Development is split into a Minimum Viable Product (Phase 1) and full system integration (Phase 2).

### Phase 1: Student Standalone MVP (Current)

**Grading engine**
* **Flexible Grade Computation Rules:** Grades are calculated from nested criteria of any depth (e.g., 70% Classwork / 30% Exams, with Classwork split into 70% Assessment Tasks and 30% Teaching Learning Activities). Weights only count criteria that already have scores, so missing work doesn't drag the grade to zero.
* **3-State Grading System:**
  * *Empty:* Tasks with no score yet are not counted.
  * *Self-Reported:* Students log their own scores for instant, unofficial computation before professors upload them.
  * *Official:* Scores from faculty that always override self-reported data.
* **Term and Final Grades:** Separate Prelim, Midterm, and Finals grades, with the final grade computed from all three terms.

**Student pages**
* **Dashboard:** Semester overview, an all-subjects grade history chart (with a term selector), and the enrolled subjects table.
* **My Subjects:** Every enrolled subject with a semester picker, status filter tabs, and search.
* **Add Subject:** A "New Subject Request" form (subject code, name, professor, section, and grading rule) available on both the Dashboard and My Subjects.
* **Subject Detail:** Term tabs, a grade summary, and **Current Term Records**, where tasks are grouped by criterion and scores can be added or edited. Scores are saved when you leave the input box (or press Enter), so the grade doesn't jump while you are typing.
* **Target Reached Celebration:** A message and voice clip play when your grade reaches your target.
* **Grade Rules:** A collection of grade computation rules shown as bar, pie chart, or hierarchy table thumbnails. Open any rule to view or edit it with the drag-and-type **pill editor**, see its formula, or delete it (subjects using a deleted rule are moved to another one).

**Target Grade Sandbox**
* Set a target grade and expected scores per criterion, then see the exact score you need on each remaining task.
* Shows clear results for every case: score required, target already reached, target impossible, term complete, or nothing to plan yet.
* Sandbox values are private drafts and never change your real scores.
* Can be opened from a subject (on the same term) or from the sidebar, which asks which subject to open.

**Grade History Charts**
* Line charts of your grade after each scored task, with your target and the 75% passing line.
* Faded points show where an official score replaced your own entry, and a "Target reached" marker appears when your latest task is at or above the target.
* Subject Detail shows the sandbox plan for the remaining tasks (can be toggled off).
* Hovering a point shows only that point; clicking it jumps to that task in the records.

**Layout and accessibility**
* Collapsible sidebar that minimizes to an icon rail (remembered per browser; starts minimized on tablets).
* Mobile layout: slide-in menu on phones, stacked cards instead of wide tables, and full-width touch targets.
* Help & Resources popup, keyboard support (Escape closes menus and dialogs), and focus handling for menus.

**Account Settings**
* Profile, security, notification, and preference settings (prototype; saved in the browser only).

### Phase 2: Faculty & Admin Integration (Planned)
* **Admin Verification Queue:** A dashboard for administrators to review, approve, or reject student-initiated class setup requests.
* **Professor Grading Workspace:** An Excel-style grid for faculty to input official scores. Adding an official score locks that task on the student's side.
* **Global Course Catalog:** An admin-managed list of subjects with default university grading formulas.

Professor and admin routes are already outlined (commented out) in `src/App.jsx`. Professor accounts can register, but their workspace is not available yet.

---

## 🛠 Tech Stack & Design System
* **Frontend Framework:** React 19 (bootstrapped with Vite)
* **Routing:** React Router DOM
* **Charts:** Recharts
* **Data Persistence:** Browser `localStorage`, initialized from a mock `db.json` to emulate a stateful backend
* **Hosting:** Vercel (`vercel.json` sends every route to `index.html` so page refreshes work)
* **Fonts:** Khand (headings) and General Sans (body)
* **Design System:** CSS variables in `src/assets/index.css`
  * **Primary:** `#406093` (Deep Blue: main UI, headers, active states)
  * **Accent:** `#4C8CE4` (Bright Blue: student-reported inputs and self-generated tasks)
  * **Warning:** `#FF7070` (Coral: destructive actions, system warnings)
  * **Highlight:** `#FFF799` (Pale Yellow: alert banners, pending verification states)
  * **Text/Locked UI:** `#2C2C2C` (Deep Navy: official locked scores, standard text)

---

## 📂 Project Structure
The repository follows a domain-driven folder structure to reduce merge conflicts among the team.

```text
public/                       # Static files served as-is (favicon, icons)
src/
├── assets/                   # index.css (global styles + design tokens), fonts, icons, sounds
├── components/
│   ├── SettingRow, SelectSetting, ToggleSetting   # Settings page building blocks
│   ├── shared/               # Used across pages
│   │   ├── Sidebar, useSidebarState, Header, PageFooter
│   │   ├── RequireStudent    # Route guard (must be signed in)
│   │   ├── Dialog, DeleteRuleDialog, DraftInput
│   │   └── PillEditor, PillLevel, RuleCard, RuleBar, RulePieChart,
│   │       RuleHierarchyTable, RuleFormula   # Grade rule editor and visuals
│   └── student/
│       ├── EnrolledSubjectsTable, AddSubjectForm
│       ├── CurrentTermRecord, TermNavigation
│       ├── TargetGradeSandbox, SandboxSubjectPicker
│       └── HistoryChart, HistoryTooltip, usePointHover,
│           SubjectGradeHistory, AllSubjectsHistory   # Grade history charts
├── pages/
│   ├── auth/                 # LoginRegister (split-screen login/register)
│   ├── student/              # StudentDashboard, SubjectMenu, SubjectDetail,
│   │                         # TargetGradeSandboxPage, GradeRules, RuleDetail
│   └── GlobalSettings.jsx    # Account settings
├── utils/                    # Plain JavaScript logic (no React)
│   ├── db.js, db.json, migrations.js     # Mock database and data upgrades
│   ├── grades.js, rules.js, sandbox.js   # Grade, rule, and sandbox math
│   ├── history.js, subjects.js, terms.js, session.js
│   └── cssColor.js, focusTask.js, localAccountStore.js, prototypeVerification.js
├── App.jsx                   # Route map
└── main.jsx                  # Entry point (seeds the database, renders App)
```

### Routes
| URL | Page |
|---|---|
| `/` | Login / Register |
| `/student/dashboard` | Dashboard |
| `/student/subject` | My Subjects |
| `/student/subject/:subjectId` | Subject Detail (`?term=prelim\|midterm\|finals`) |
| `/student/subject/:subjectId/sandbox` | Target Grade Sandbox |
| `/student/rules` | Grade Rules |
| `/student/rules/new`, `/student/rules/:ruleId` | Create / view / edit a rule |
| `/settings` | Account Settings |

All student routes require a signed-in student; otherwise you are sent back to the login page.

---

## 💾 Data Management (Mock Database)

The app has no live backend. All data goes through `src/utils/db.js`.

* **Initialization:** On first load, `main.jsx` calls `initializeDatabase()`, which copies `db.json` into `localStorage` (only if it isn't there yet). Older saved data is upgraded automatically by `migrations.js`.
* **Reading and saving:** Pages read with `getDb()` and save with `saveDb()`. Saving also fires a `compugrade-db-updated` event so other parts of the page (like the sidebar and charts) refresh right away.
* **Pure logic:** Grade, rule, sandbox, and history calculations live in `src/utils/` as plain functions with no React or storage access, which keeps them easy to test and reuse.

**`localStorage` keys**

| Key | Contents |
|---|---|
| `compugrade_db` | The whole database: users, subjects, classes, grade rules, tasks, and scores |
| `activeUserId` | The signed-in user's id |
| `compugrade-sidebar-minimized` | Whether the sidebar is minimized |
| `compugrade_rule_thumbnail` | Grade Rules thumbnail style (bar, pie, or table) |
| `compugrade-account` | Account Settings profile data |

> **⚠️ Note on Data Reset:** Because the database lives in the browser, clearing your browser data or running `localStorage.clear()` in the DevTools Console erases all user-generated entries. Reloading the page then restores the default `db.json` data.

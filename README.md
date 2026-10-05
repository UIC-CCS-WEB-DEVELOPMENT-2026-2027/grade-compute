# CompUGrade
**Academic Grade Tracking and Prediction Platform**

🚀 **[Live Demo: View CompUGrade on Vercel](https://grade-compute.vercel.app/)**

> **AI Disclosure:** The codebase for this project, as well as this README documentation, were developed with the assistance of Artificial Intelligence tools. AI was utilized for system architecture planning, UI/UX prompt generation, hierarchical logic formulation, and React component generation.

---

## 📖 Overview
CompUGrade addresses a critical gap in student life: **grade transparency**. Even when professors share their syllabus and grading formulas, students often struggle to accurately compute their real-time academic standing, leading to anxiety and reactive studying. 

CompUGrade replaces manual computation and static Learning Management Systems (LMS) with an automated hierarchical grading engine. It empowers students to actively self-report scores, track their exact current standing, and use a predictive "Target Grade Sandbox" to determine precisely what they need to score on future assignments to achieve their goals.

### The Team
*   Manla, Jun Mari
*   Caballero, Kit Jasper
*   Dumangas, Lian
*   Lerasan, Reyian
*   Liu, Marco

---

## ✨ Key Features (Two-Phase Architecture)

To ensure a robust, testable application, development is structured into a Minimum Viable Product (Phase 1) and a full system integration (Phase 2).

### Phase 1: Student Standalone MVP (Current Focus)
* **Hierarchical Formula Engine:** Calculates grades using nested rules (e.g., Tier 1: 70% Classwork / 30% Exams. Tier 2: Classwork is split into 70% Assessment Tasks and 30% Teaching Learning Activities).
* **3-State Grading System:** 
  * *Empty:* Unassigned future tasks.
  * *Self-Reported:* Students log their own scores for instant, unofficial computation before professors upload them.
  * *Official:* Locked scores inputted by faculty that override self-reported data.
* **Target Grade Sandbox:** A predictive calculation panel that allows students to adjust sliders and inputs to figure out the exact mathematical scores required on future exams or tasks to hit their target final grade.
* **Smart Subject Setup:** Students can search for existing verified classes, or use a manual fallback form to create a pending class using a specific professor's name and a default computation rule.

### Phase 2: Faculty & Admin Integration
* **Admin Verification Queue:** A dashboard for administrators to review, approve, or reject student-initiated class setup requests.
* **Professor Grading Workspace:** An Excel-style grid view for faculty to input official scores. Adding an official score automatically locks that specific task on the student's dashboard system-wide.
* **Global Course Catalog:** Admin-managed repository of subjects with default university grading formulas.

---

## 🛠 Tech Stack & Design System
* **Frontend Framework:** React.js (Bootstrapped with Vite)
* **Routing:** React Router DOM
* **Data Persistence:** Browser `localStorage` initializing from a mock `db.json` structure to emulate a stateful backend.
* **Design System (Custom Implementation):**
  * **Primary:** `#406093` (Deep Blue - Primary buttons, headers, active tabs)
  * **Accent:** `#4C8CE4` (Bright Blue - Strictly used for student-generated tasks and self-reported UI)
  * **Secondary/Warning:** `#FF7070` (Coral - Destructive actions, system warnings)
  * **Background Highlights:** `#FFF799` (Pale Yellow - Alert banners, admin sidebars)
  * **Text/Locked UI:** `#2C2C2C` (Deep Navy - Official locked scores, standard text)

---

## 📂 Project Structure
The repository strictly follows a domain-driven folder structure to prevent merge conflicts among the team.

```text
src/
├── assets/                 # Global styles, fonts (Khand), logos
├── components/
│   ├── shared/             # Reusable UI (LeftSidebar, HierarchicalFormulaEditor)
│   ├── student/            # AddSubjectModal, NestedSubjectList, TargetSandbox
│   ├── professor/          # GradingSpreadsheet, ColumnCreatorPopover
│   └── admin/              # VerificationQueueTable, FacultyList
├── pages/
│   ├── auth/               # Split-screen Login/Register
│   ├── student/            # StudentDashboard, SubjectDetail
│   ├── professor/          # ProfessorDashboard, GradingWorkspace
│   └── admin/              # AdminOverview, RequestQueue, SystemSettings
├── utils/                  # db.js (localStorage wrapper for the db.json state)
├── App.jsx                 # Master React Router mapping
└── main.jsx                # React Entry Point
```

---

## 💾 Data Management (Mock Database)

Since the application does not use a live backend database for prototyping, all data operations are handled via a custom local utility.

* **Data Controller:** All state updates, queries, and logic are routed directly through `src/utils/db.js`.
* **Initialization:** On the initial load, the system reads the hardcoded `db.json` file and injects its complete mock structure into the browser's `localStorage`.
* **Persistence:** State updates (such as adding a subject, locking a task, or logging a grade) utilize local storage setter functions. This ensures that user data persists seamlessly across page refreshes.

> **⚠️ Note on Data Reset:** Because the database relies entirely on the browser's local environment, clearing your browser cache or manually clearing `localStorage` will erase all user-generated entries and immediately reset the application back to its default `db.json` state.

# Rehearsal: prelim

- Last checked against: `5e64e03`
- Covers: `frontend/src/`
- Date of the defense: _(owner fills in)_

## 1. What the prelim asks

From the CC013.23 documents (not in the repository; check against the syllabus):

- A **local React + Laravel CRUD demo**: the React app on port 5173 talks to a Laravel API on
  port 8000, which stores data in MySQL (`webdev2`) through migrations and Eloquent.

## 2. Where we stand (2026-11-28)

| Needed | Today | Board task |
| --- | --- | --- |
| React app runs locally | Yes: `npm run dev` in `frontend/` | — |
| CRUD in the app | Yes, on `localStorage` (below) | — |
| Laravel project in `backend/` | **Not built** | T-JM-17 |
| MySQL tables through migrations | **Not built** | T-JM-3 |
| API endpoints | **Not built** | T-JM-5 |
| React calls the API (Axios) | **Not built** | T-JM-6 |

If the API isn't ready by the prelim, demo the CRUD below and say plainly where the API will slot
in ([architecture.md](../architecture.md) §1). Don't claim a back end that isn't there.

### CRUD that exists today

| | Action | Code |
| --- | --- | --- |
| **Create** | Add a subject | [subjects.js:116-222](../../../frontend/src/lib/subjects.js#L116-L222) |
| | Add a custom task | [CurrentTermRecords.jsx:138-184](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L138-L184) |
| | Create a rule | [rules.js:970-991](../../../frontend/src/lib/rules.js#L970-L991) |
| **Read** | Enrolled subjects with grades | [subjects.js:60-93](../../../frontend/src/lib/subjects.js#L60-L93) |
| **Update** | Enter a score | [CurrentTermRecords.jsx:124-136](../../../frontend/src/features/term-records/components/CurrentTermRecords.jsx#L124-L136) |
| | Edit a rule | [rules.js:996-1028](../../../frontend/src/lib/rules.js#L996-L1028) |
| **Delete** | Remove a subject | [subjects.js:235-272](../../../frontend/src/lib/subjects.js#L235-L272) |
| | Delete a rule | [rules.js:1058-1095](../../../frontend/src/lib/rules.js#L1058-L1095) |

## 3. Demo script (what exists)

Seed account: `ysa@student.edu` / `password123` ([db.json](../../../frontend/src/services/db.json)).
Start from a fresh browser profile, or clear `compugrade_db`, so the seed data loads.

> **Check the date first.** The seed subject has no semester, so it counts as the First Semester
> of the current academic year ([subjects.js:42-50](../../../frontend/src/lib/subjects.js#L42-L50)).
> From January to July the Dashboard and My Subjects show only the current semester, so IT101
> disappears from both (the other semesters are disabled in the picker). It is still in the
> sidebar's subject list ([Sidebar.jsx:88-91](../../../frontend/src/components/layout/Sidebar.jsx#L88-L91)).
> For a demo then, add a fresh subject first, or open IT101 from the sidebar. Board task T-4.

1. Log in. Point out the route guard ([auth.md](../features/auth.md) §3).
2. Dashboard: official vs expected grade for IT101 (90% / 90%).
3. Open IT101. Prelim: AT-1 is locked (official 18/20).
4. Type 45 in TLA-1 and press Enter. The expected gauge drops to 76.5%; official stays 90%.
5. Open the sandbox. Set the target to 80. It says 88.17% on the exam.
6. Grade Rules: open the rule, change AT to 75%, save, see the "used by 1 subject" warning.
7. Add a subject, then remove it from the sidebar.

## 4. Questions to drill

- "Walk me through what happens when you save a score." → [term-records.md](../features/term-records.md) §3
- "Where is your database?" → [architecture.md](../architecture.md) §1 and §5
- "Show me Create, Read, Update and Delete in your code." → the table above
- "How is the grade computed?" → [grade-maths.md](../features/grade-maths.md) §5
- "What will change when Laravel is added?" → `services/` calls Axios; tables via migrations; maths stays in `lib/`
- Once the API exists: "Show me the migration for this table", "Which route handles this request?",
  "What status code does a validation error return?" (fill in when T-JM-3 and T-JM-5 are merged)

## 5. Two weeks before

- [ ] Run `/defense-update defense prelim`.
- [ ] Each owner does their chapters' self-checks out loud.
- [ ] Run the demo script on a fresh browser profile.
- [ ] Fill in section 2 with what is merged by then.

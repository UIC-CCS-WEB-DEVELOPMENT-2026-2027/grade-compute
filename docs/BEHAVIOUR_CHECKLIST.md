# CompUGrade — Behaviour Checklist

A manual click-through of every student flow, with the result the app gives **today** (the Phase 2 baseline, after commit `e5dca95`). Walk through it in full in Phase 9, and for any flow a task touches. The behaviour must stay the same unless an item says otherwise.

Some results below are known bugs (`docs/AUDIT.md` §12). They are listed as they behave now, marked with the bug number, and must not change during the clean-up. The one approved exception is B9 (item H8), which changes in its own Phase 6 task.

## Before you start

1. Open the app (`npm run dev`, `http://localhost:5173`) in a fresh browser profile, or clear the site's storage. On load the app seeds `localStorage` (`compugrade_db`) from `src/utils/db.json`.
2. The date matters (AUDIT B12). The results below assume a date from **August to December 2026**, which is First Semester 2026–2027. From January to July, the seed subject drops off the Dashboard.
3. Unless an item says otherwise, sign in as the demo student: `ysa@student.edu` (or `U1`) with the password `password123`.
4. Seed data:
   - Subject IT101 "Computer Systems Servicing" (class `C101`) uses the rule "Standard IT Rule (70/30)": Classwork 70% (AT 70%, TLA 30%) and Exam 30%.
   - Prelim has AT 1 (official 18/20), AT 2 (a custom task, self-reported 45/50), TLA 1 (empty) and the Prelim Exam (empty).
   - The target is 90.
5. Reset to the seed between areas when an item depends on the starting data.

Write **Pass** or **Fail** (with a note) next to each item.

---

## A. Sign-in and registration (`/`)

| # | Do | Expect |
| --- | --- | --- |
| A1 | Log in with `ysa@student.edu` / `password123` | Goes to `/student/dashboard`. The header says "Welcome back, Ysa!" |
| A2 | Log out, then log in with `U1` / `password123` | Same as A1 |
| A3 | Log in with an empty email or password | "Email or Student ID is required." / "Password is required." under the field, and focus goes to the first error |
| A4 | Log in with `nobody@x.edu` | "Account not found. Check your email or Student ID." |
| A5 | Log in with `ysa@student.edu` and a wrong password | "Incorrect password. Please try again." |
| A6 | The demo hint below the form | "Demo student: ysa@student.edu (or U1)", "Password: password123" |
| A7 | Create Account: submit it empty | "Full name is required.", "Email is required.", "Password is required.", "Please confirm your password." |
| A8 | Create Account with a bad email, a short password, a password with no uppercase, number or special character, and a confirmation that doesn't match | "Enter a valid email address." / "Use at least 8 characters." / "Include an uppercase letter, a number, and a special character." / "Passwords do not match." |
| A9 | Create Account with `ysa@student.edu` | "This email is already registered. Please log in." |
| A10 | Create a **Student** account with valid details | Signed in and sent to `/student/dashboard`, with no subjects |
| A11 | Create a **Professor** account with valid details | Back on the Log In tab with the email filled in: "Professor account created. Your workspace is coming soon." Not signed in |
| A12 | Log in as `maria@faculty.edu` / `password123` (professor `U2`) | Stays on `/`: "Login verified. The Professor Workspace is coming soon." Not signed in |
| A13 | Log in as `admin@compugrade.edu` / `admin` (admin `U3`) | Stays on `/`: "Login verified. This workspace is not available yet." |
| A14 | Signed out, open `/student/rules` | Redirected to `/`. After logging in, lands on `/student/rules` |
| A15 | Signed out, open `/student/subject/C101?term=midterm` and log in | Lands on `/student/subject/C101` with Prelim selected. The `?term=` is lost (B14) |
| A16 | Open an unknown URL such as `/nope` | Redirected to `/` |
| A17 | While signed in, open `/` | The login page is shown. No redirect away |
| A18 | Show / hide the password (eye button) | The password text toggles between hidden and visible |

## B. Navigation, sidebar and header

| # | Do | Expect |
| --- | --- | --- |
| B1 | Click Dashboard, My Subjects, Grade Rules and Settings in the sidebar | Each opens its page: `/student/dashboard`, `/student/subject`, `/student/rules`, `/settings` |
| B2 | At 1440 wide, click the minimise toggle, then reload | The sidebar becomes icon-only and stays minimised after the reload (`compugrade-sidebar-minimized` = `"1"`) |
| B3 | Clear `compugrade-sidebar-minimized` and reload at 768 wide, then at 1024 | Starts minimised at 768 (tablets, 768–1023) and expanded at 1024 and wider. Below 768 it is the phone menu (T7.S1, approved threshold change) |
| B4 | At 375 wide, tap ☰ in the header | The sidebar slides in as a menu. Escape or a tap on the backdrop closes it |
| B5 | Expanded sidebar: click the My Subjects chevron | Lists each enrolled subject. Clicking one opens its Subject Detail |
| B6 | Minimised sidebar: click My Subjects | A pop-out lists the subjects. Escape or a click outside closes it |
| B7 | Click Help & Resources | A Help popup opens. Its close button and the backdrop close it. The text mentions a CSV export, which doesn't exist (B13) |
| B8 | Click Target Grade Sandbox | The subject picker opens and lists each subject. Choosing one opens its sandbox. On a subject's page, that subject is marked "Viewing now" |
| B9 | Sandbox picker with no subjects | "You have no subjects yet. Add a subject first." The link goes to `/student/subject` |
| B10 | Click Logout | Goes to `/` and signs out. Opening `/student/dashboard` then redirects to `/` |
| B11 | Header bell and profile chevron | Nothing happens (B13) |
| B12 | Footer | Shown on the Dashboard, My Subjects, Subject Detail and Sandbox. Not shown on the Grade Rules pages |

## C. Dashboard (`/student/dashboard`)

| # | Do | Expect |
| --- | --- | --- |
| C1 | Open the Dashboard | "Student Overview", the badge "First Semester · 2026–2027", the Prelim Grade History chart, Enrolled Subjects (1) and Recent Updates |
| C2 | Chart: switch Prelim / Midterm / Finals | The title and lines change to that term. IT101 has points only in Prelim |
| C3 | Chart: click the IT101 chip, then "Hide all" | The chip hides or shows IT101's line. "Hide all" hides every line |
| C4 | Chart: click a point | Opens `/student/subject/C101?term=prelim`, scrolls to that task, highlights it, and removes `task` from the URL |
| C5 | Chart: "Show as a table" | The same data appears as a table |
| C6 | Enrolled Subjects row | IT101, Computer Systems Servicing, Prof. Maria Santos, official 90%, expected 90%, "Passing" |
| C7 | Click the row (or its arrow) | Opens `/student/subject/C101` |
| C8 | "Needs attention" filter | Shows only subjects below 75 ("Below passing"). With the seed data: "No subjects match this filter." |
| C9 | Search "maria", "it101" and "zzz" | Matches the code, the name or the professor. "zzz" shows "No subjects match this filter." |
| C10 | Recent Updates | Three fixed sample entries (Prof. Ana Cruz, Prof. Maria Santos, Prof. Carlo Reyes). Not real data (B13) |

## D. My Subjects (`/student/subject`)

| # | Do | Expect |
| --- | --- | --- |
| D1 | Open My Subjects | The same subjects table, plus a semester picker set to "First Semester · 2026–2027" |
| D2 | Open the semester picker | Second Semester and Summer are listed but disabled |
| D3 | Add a subject (see E) | It appears here, in the current semester |
| D4 | "Requests awaiting verification" | Never shown, even with the seed request `REQ-1` or after adding a subject (B8) |

## E. Add a subject (Dashboard or My Subjects)

| # | Do | Expect |
| --- | --- | --- |
| E1 | Click "+ Add subject" | The form opens and the button reads "Close form". Program / section is filled with the student's section (BSIT-2A). The grading rule starts on the rule of the most recently added subject |
| E2 | Clear all fields and click Add Subject | "Please enter your subject code.", "… subject name.", "… professor.", "… program / section." Focus goes to the first empty field |
| E3 | Code `it101` | "You already have a subject with that code." |
| E4 | Valid new subject (code `cs201`, name, professor, section, rule) | The form closes. The row appears with the code in upper case, professor as typed, no grades, "No grades yet". The count goes up by 1. The subject appears in the sidebar list |
| E5 | Open the new subject | Its Subject Detail works. Its records are empty, with one "No … records for Prelim yet." line per criterion |
| E6 | With no rules at all (delete them in storage) | "No grading rules yet. Create one first." plus a link to create one |
| E7 | Cancel | The form closes and nothing is added |

## F. Remove a subject (sidebar)

| # | Do | Expect |
| --- | --- | --- |
| F1 | Expanded sidebar, My Subjects list: click the delete icon next to a subject | The "Remove this subject?" dialog opens |
| F2 | Cancel, Escape, or click the backdrop | The dialog closes and the subject stays |
| F3 | Confirm | The subject leaves every list. Its pending verification request is removed. The shared subject record is removed if no other class uses it |
| F4 | Remove the subject whose page is open | Goes to `/student/dashboard` |

## G. Subject Detail (`/student/subject/C101`)

| # | Do | Expect |
| --- | --- | --- |
| G1 | Open the page | Prelim selected. The semester label is "FIRST SEMESTER · 2026–2027" whatever the class's semester (B7). Title "IT101 - Computer Systems Servicing". Prof. Maria Santos (initials PM), "3 units" |
| G2 | Term tabs | The URL becomes `?term=midterm` (and so on), and the gauges, records and chart follow |
| G3 | Gauges (Prelim) | Official 90%, expected 90%, each with a yellow target marker at 90. The aria label has 2 decimals ("Official grade: 90.00 percent") |
| G4 | Target: type 85 and press Enter (or blur) | Saved for this term only (`terms.prelim.desiredFinalGrade`). The marker moves. Midterm still shows 90 |
| G5 | Target: type 150, -1, or clear it, then blur | Not saved. The box goes back to the saved value |
| G6 | Target: type, then press Escape | The draft is thrown away |
| G7 | "1 official assessment recorded" | Counts the tasks with an official score, excluding custom tasks |
| G8 | Celebration: set the target to 95, then to 85 | "TARGET ACHIEVED", "Congratulations!", "Both your official and expected grades reached the target!" Audio plays and confetti falls. It closes on ×, on a backdrop click, or by itself after 6 seconds |
| G9 | Celebration on the expected grade only: with the target at 95, enter TLA 1 = 100 and Prelim Exam = 100 | After the Exam score: "Your expected grade reached the target!" (it fires on the expected grade, B17) |
| G10 | Opening the page with the target already reached | No celebration |
| G11 | "Target grade sandbox" link | Opens the sandbox with the same term |
| G12 | Grade history: "Hide plan" / "Plan in sandbox", and click a point | The plan line hides and shows. "Plan in sandbox" opens the sandbox. A point click scrolls to its task |
| G13 | Open `/student/subject/C999` | "Subject not found" / "This subject is not available for your account." with no header |

## H. Current Term Records (on Subject Detail)

| # | Do | Expect |
| --- | --- | --- |
| H1 | Weight summary | "70% Classwork (70% AT + 30% TLA)" + "30% Exam (Prelim tasks)" |
| H2 | AT 1 - Chapter 4 Quiz | "18 / 20", "Locked · Official". No input |
| H3 | TLA 1: type 55, then blur | Saved as the self-reported score. The expected gauge and chart update. Nothing is saved while typing |
| H4 | Type 101, -1, abc or 0100 into a /100 task | The keystroke is rejected. "Enter a score between 0 and 100, using no more than 3 digits before the decimal." The box is marked invalid |
| H5 | AT 2 (/50): type 50.5 | Rejected: "Enter a score between 0 and 50, using no more than 2 digits before the decimal." |
| H6 | Clear AT 2 and blur | The score is cleared. The expected grade changes |
| H7 | "+ Add Custom Task": submit empty, then name it without a max score, then type "2.5" in max score | "Please enter a task name." / "Please enter a whole-number maximum score greater than zero." The max score box only accepts digits |
| H8 | Add "Recitation", max 25, criterion AT | It appears under Classwork › AT as "AT - Recitation" with the "Custom Addition" tag. The form closes. It counts in the expected grade only |
| H9 | Cancel in the add-task form | The form closes and its fields clear |
| H10 | "View Complete Official Grade Breakdown" | Lists the non-custom tasks per criterion with "Recorded by professor" / "Awaiting professor score" and "… of term grade" |
| H11 | Change the rule so a criterion with tasks is deleted, then reopen | "N task(s) from criteria that are no longer in this subject's grading rule … hidden and not counted." |

## I. Target Grade Sandbox (`/student/subject/C101/sandbox?term=prelim`)

| # | Do | Expect |
| --- | --- | --- |
| I1 | Open the page | "Back" link, term tabs, and the result card: "Your result · To reach 90% in Prelim", "90%", "needed on each remaining task", "Score at least 90% on each of your 2 tasks left this term.", then Classwork › TLA (1 task), Exam (1 task), "Projected Prelim grade 90%" |
| I2 | Set the target to 99 | "Out of reach": "Even 100% on every remaining task gives 95.1%. Try a lower target, or add upcoming tasks if there are more." |
| I3 | Set the target to 40 | "Reached": "You reach 40% even with 0% on the remaining tasks." |
| I4 | Give TLA and Exam an expected % | No task is left to plan: the headline is the projected grade, with "No task is left to plan. This is your projected Prelim grade, …" |
| I5 | Target: type 120 and blur | "Enter a target grade from 0 to 100." The box goes back to the saved target. A valid value is saved as the sandbox target for this term only |
| I6 | Upcoming tasks: type 3 for AT | Saved at once. The result and the "You need" column update. Values are rounded and kept within 0–20 |
| I7 | Upcoming tasks: clear the box | It shows 0 at once and can't be left empty (B16) |
| I8 | Expected %: type 130, then clear it | Saved as 100. Cleared, it goes back to "Auto" (null) |
| I9 | **Draft scores** (step 3): type 7 then 75 on TLA 1, then clear AT 2 | Each keystroke is stored only as a draft, in `targetGradeSandbox.terms.prelim.draftScores` (`{ "TLA-1": "75" }`). The result card, the expected gauge and the plan chart use it. The real score is unchanged: Current Term Records on Subject Detail still shows TLA 1 empty. AT 2's box starts at its real score, 45. Cleared, it counts as no score in the sandbox only (B9, fixed in T6.12) |
| I10 | Draft score 101 on a /100 task | Not saved: "Enter a score between 0 and 100." |
| I11 | Draft placeholders | The grey number is the raw score that matches the result (for example 90 on a /100 task) |
| I12 | Official tasks in step 3 | Shown as "18 / 20 official", locked |
| I13 | Chart and "How this is calculated" | The plan chart shows the dotted plan line. The details section expands and collapses |
| I14 | Sandbox for a subject the student isn't in | "This subject is not available for your account." |

## J. Grade Rules (`/student/rules`)

| # | Do | Expect |
| --- | --- | --- |
| J1 | Open Grade Rules | One card, "Standard IT Rule (70/30)", with its thumbnail, its tag (Undergraduate), "Used at University of the Immaculate Conception" and its formula |
| J2 | Thumbnail: bar / pie / table, then reload | The cards switch view, and the choice is remembered (`compugrade_rule_thumbnail`) |
| J3 | Search "70/30", "undergraduate", "immaculate", "zzz" | Matches the name, tags and schools. "zzz": "No rules match "zzz". Try a rule name, a tag like Undergraduate, or a school." |
| J4 | Duplicate | Opens the copy, named "Standard IT Rule (70/30) (Copy)" |
| J5 | Delete the only rule | A dialog "This rule can't be deleted": "At least one grade computation rule must exist. Create another rule first, then delete this one." with a Close button |
| J6 | With two rules, delete one no subject uses | "No subjects use this rule. Deleting it can't be undone." After confirming: "Deleted <name>." |
| J7 | Delete a rule that subjects use | The dialog lists the subjects ("1 subject uses this rule:") and asks "Move these subjects to" a replacement rule. If the replacement lacks some criteria: "N recorded task(s) in … won't count under the new rule, because it has no matching criteria. The tasks stay saved." "Delete rule" moves the classes, subject defaults and requests to the replacement |
| J8 | "+ New rule" | Opens `/student/rules/new` |

## K. Rule editor (`/student/rules/CR-1` and `/student/rules/new`)

| # | Do | Expect |
| --- | --- | --- |
| K1 | Open CR-1 | View mode: name, tags, schools, pills, formula "Grade = 0.49 × AT + 0.21 × TLA + 0.30 × Exam", pie chart. Buttons: Edit, Duplicate, Delete |
| K2 | Pie / Table switch | Shows the breakdown as a pie or a table |
| K3 | Edit, then type 60 in Classwork's % box | Classwork 60%, Exam 40%. The formula updates. "You have unsaved changes." |
| K4 | Type 0.5 or 99.5 for Classwork | Rejected with "Classwork must be at least 1%." / "Classwork can be at most 99.00%. Exam must keep at least 1%." |
| K5 | Drag the handle between two criteria | The split follows the pointer in whole percents and stops at 1% |
| K6 | Add (+), Rename (pencil), Split, Delete (×) | Add takes half of the last criterion. Rename rejects duplicates in the same level. Split adds "SubCriteria 1" at 100%. Delete gives the share to the left neighbour |
| K7 | Delete a criterion that has subcriteria | Browser confirm: "Delete <name> and all of its subcriteria?" |
| K8 | Limits | At most 8 criteria per level and 3 levels. The buttons show the reason in their tooltip |
| K9 | Save changes on CR-1 (used by IT101) | Dialog "Update this rule for every subject?" listing the subject. Cancel / Save as new rule / Update anyway. "Update anyway" saves: "Changes saved.", and grades are recalculated |
| K10 | Save changes on a copied rule that no subject uses | Dialog "Save changes to this copy?" with "Saving updates this copy only. The original rule will stay unchanged." |
| K11 | "Save as new rule" | A new rule opens: "Your changes were successfully saved as a new rule." It gets a "(Copy)" name if the name didn't change |
| K12 | Discard changes / Cancel editing | Goes back to the saved rule: "Changes discarded." |
| K13 | Empty name, or a name another rule uses | Field errors, plus "Fix the highlighted fields, then save again." |
| K14 | New rule: fill in the details, then "Create rule" | Saved, and the editor opens on the new rule's URL |
| K15 | Open `/student/rules/CR-99` | "Rule not found" |

## L. Settings (`/settings`)

| # | Do | Expect |
| --- | --- | --- |
| L1 | Open Settings | The shared page shell (sidebar, header, footer). Back link, the "Settings" heading, and tabs for Profile, Account, Security, Notifications, Account Actions. From 1024px wide, Settings' own "Help & Resources" button sits beside the tabs; its help only shows while Security is open (B2) |
| L2 | Profile | Read-only details. The defaults come from the per-browser account (B4) |
| L3 | Account: edit a field | Saved on every keystroke. "Save changes" shows "Account details updated." (B3) |
| L4 | Account: upload a GIF, then a PNG | "Please choose a JPG, JPEG, or PNG image." The PNG: "Profile picture saved." |
| L5 | Security › Password: wrong current password, short password, no uppercase or number, mismatch, same as current | "Current password is incorrect." / "Your new password must be at least 8 characters." / "… at least one uppercase letter and one number." / "The new passwords do not match." / "Your new password must be different from your current password." |
| L6 | Valid new password, then the verification step | "Verify it's you". Sending a code shows "Prototype code (not sent): ######". A wrong code: "That verification code is incorrect or expired. Request a new code." The right code: "Your password was changed successfully." The login password in `db.users` does not change (B4) |
| L7 | Security › Two-Factor Authentication: Turn on, verify | Needs a verified email or phone, otherwise "Add and verify an email address or phone number before enabling two-factor authentication." After the code: "Two-factor authentication is now enabled." |
| L8 | 2FA "Turn off" | Opens a confirmation that shares state with the session dialog (B5) |
| L9 | Security › Login Activity | Lists sessions. Session details and "log out of all sessions" open dialogs |
| L10 | Help & Resources | Only opens from the Security section (B2) |
| L11 | Notifications: toggle, then reload | The toggles switch but aren't saved. They reset on reload (B3) |
| L12 | Account Actions: Download, Clear, Log out | Download and Clear do nothing (B3). Log out does nothing (B1) |

## M. Persistence

| # | Do | Expect |
| --- | --- | --- |
| M1 | After any change above, reload the page | The change is still there (`localStorage` key `compugrade_db`) |
| M2 | Store schema-v1 data in `compugrade_db` and reload | The data is upgraded to v2 on read and the app works |

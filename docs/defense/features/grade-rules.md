# Grade computation rules (`features/grade-rules/`)

- Last checked against: `5e64e03`
- Covers: `frontend/src/features/grade-rules/`, `frontend/src/pages/student/GradeRules.jsx`, `frontend/src/pages/student/RuleDetailPage.jsx`, `frontend/src/lib/rules.js`
- Owner: see [README](../README.md#who-owns-what)

## 1. What it does

- **Grade Rules** (`/student/rules`): every saved rule as a card (bar, pie or table preview),
  search by name, tag or school, Duplicate, Delete, "+ New rule".
- **Rule editor** (`/student/rules/new`, `/student/rules/:ruleId`): name, tags, schools and the
  **pill editor**, where each level of criteria is a bar split into sections.
  - type a percentage, or drag (or arrow-key) the divider between two sections
  - add, rename, split (give a criterion subcriteria) and delete criteria
  - up to 8 criteria per level and 3 levels deep ([rules.js:27-31](../../../frontend/src/lib/rules.js#L27-L31))
- Saving a rule that subjects use shows which subjects and how many recorded tasks it affects;
  the student can update it or save it as a new rule.
- Rules are shared by every student (`SPEC.md` §6).

The maths behind it (share units, effective shares) is in [grade-maths.md](grade-maths.md).

## 2. Where the code is

| File | Role |
| --- | --- |
| [GradeRules.jsx](../../../frontend/src/pages/student/GradeRules.jsx) | The rules list page |
| [RuleDetailPage.jsx](../../../frontend/src/pages/student/RuleDetailPage.jsx) | The rule editor page and its save dialogs |
| [useRuleEditor.js](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js) | The editor's state: details, tree, dirty check, save, duplicate, discard |
| [PillEditor.jsx](../../../frontend/src/features/grade-rules/components/PillEditor.jsx) | One `PillLevel` per level of the tree |
| [PillLevel.jsx](../../../frontend/src/features/grade-rules/components/PillLevel.jsx) | One pill: typing, dragging, keyboard, add, rename, split, delete |
| [DeleteRuleDialog.jsx](../../../frontend/src/features/grade-rules/components/DeleteRuleDialog.jsx) | Delete, with a replacement rule for subjects that use it |
| [RuleCard.jsx](../../../frontend/src/features/grade-rules/components/RuleCard.jsx), [RuleBar.jsx](../../../frontend/src/features/grade-rules/components/RuleBar.jsx), [RulePieChart.jsx](../../../frontend/src/features/grade-rules/components/RulePieChart.jsx), [RuleHierarchyTable.jsx](../../../frontend/src/features/grade-rules/components/RuleHierarchyTable.jsx), [RuleFormula.jsx](../../../frontend/src/features/grade-rules/components/RuleFormula.jsx) | The previews |
| [rules.js](../../../frontend/src/lib/rules.js) | Every rule operation, as pure functions |

Tests: [rules.test.js](../../../frontend/src/lib/rules.test.js) (the largest test file in the app).

## 3. Trace: changing a percentage and saving a rule in use

The seed rule "Standard IT Rule (70/30)": Classwork 70% (AT 70%, TLA 30%), Exam 30%.

1. The editor builds a tree from the saved rule: `ruleToTree` ([useRuleEditor.js:42](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L42),
   [rules.js:535-543](../../../frontend/src/lib/rules.js#L535-L543)); weights become share units (70% = 7000).
2. The student types 75 in AT's box. On blur, `setCriterionPercent` runs
   ([PillLevel.jsx:85-94](../../../frontend/src/features/grade-rules/components/PillLevel.jsx#L85-L94),
   [rules.js:211-215](../../../frontend/src/lib/rules.js#L211-L215)).
3. `setCriterionShare` takes the 5% from AT's right neighbour, TLA: AT 75%, TLA 25%
   ([rules.js:168-208](../../../frontend/src/lib/rules.js#L168-L208)). Typing 100 is refused:
   "AT can be at most 99.00%. TLA must keep at least 1%."
4. `apply` keeps the new tree, or shows the warning and keeps the old one
   ([PillLevel.jsx:73-81](../../../frontend/src/features/grade-rules/components/PillLevel.jsx#L73-L81)).
5. Save: `handleSave` validates the name, tags, schools and tree
   ([useRuleEditor.js:74-84](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L74-L84),
   [useRuleEditor.js:118-131](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L118-L131)).
6. The rule is used by class `C101`, so `getRuleChangeImpact` fills the warning dialog first
   ([useRuleEditor.js:125-129](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L125-L129),
   [RuleDetailPage.jsx:416-473](../../../frontend/src/pages/student/RuleDetailPage.jsx#L416-L473)).
7. "Update anyway" (or "Save as new rule") → `applyUpdate` → `updateRule` ([useRuleEditor.js:101-116](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L101-L116),
   [rules.js:996-1028](../../../frontend/src/lib/rules.js#L996-L1028)), which runs
   `buildRuleMath` to store `criteria` and the new `effectiveMultipliers` (AT 0.525, TLA 0.175, Exam 0.3)
   ([rules.js:596-606](../../../frontend/src/lib/rules.js#L596-L606)).
8. `commit` saves with `saveDbSafely` and shows an error if it fails
   ([useRuleEditor.js:63-71](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L63-L71)).
   Every subject using the rule now computes with the new weights.

## 4. Decisions and why

- **Edits trade with one neighbour and are rejected, not clamped, when out of range**
  ([rules.js:165-167](../../../frontend/src/lib/rules.js#L165-L167)).
  - Why: the student sees exactly what changed; totals stay 100% by construction.
- **Dragging never warns; it stops at the 1% limits** ([rules.js:217-220](../../../frontend/src/lib/rules.js#L217-L220)).
- **The divider is a keyboard slider** with `role="slider"` and value text
  ([PillLevel.jsx:393-404](../../../frontend/src/features/grade-rules/components/PillLevel.jsx#L393-L404)):
  arrows move 1%, Shift+arrow 10%, Home and End jump to the limits
  ([PillLevel.jsx:140-161](../../../frontend/src/features/grade-rules/components/PillLevel.jsx#L140-L161)).
  - Why: dragging alone would lock out keyboard users (WCAG 2.1.1).
- **Pointer Events with pointer capture** ([PillLevel.jsx:104-112](../../../frontend/src/features/grade-rules/components/PillLevel.jsx#L104-L112)).
  - Why: one code path for mouse and touch; the drag continues when the pointer leaves the handle.
- **Deleting a criterion that has subcriteria asks first** ([PillLevel.jsx:209-223](../../../frontend/src/features/grade-rules/components/PillLevel.jsx#L209-L223)).
- **The last rule can't be deleted; a rule in use needs a replacement**
  ([rules.js:1055-1075](../../../frontend/src/lib/rules.js#L1055-L1075),
  [DeleteRuleDialog.jsx:19-34](../../../frontend/src/features/grade-rules/components/DeleteRuleDialog.jsx#L19-L34)).
  - Why: no subject is ever left without a rule.
- **Copies are marked and always go through the save dialog** ([rules.js:1030-1053](../../../frontend/src/lib/rules.js#L1030-L1053),
  [useRuleEditor.js:126](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L126)).
- **"Dirty" is a JSON comparison** with the last saved copy ([useRuleEditor.js:43](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L43),
  [useRuleEditor.js:59](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L59)).
  - Why: Save is enabled only when something changed; Discard restores the saved copy.
- **The card preview choice lives in its own key, not the database**
  ([GradeRules.jsx:24-41](../../../frontend/src/pages/student/GradeRules.jsx#L24-L41)): it is a per-browser preference.

## 5. Likely questions

**"How do you make sure a rule always adds up to 100%?"**
- Integer share units; every edit moves an exact amount between two siblings
- `validateTree` checks every level totals 10000 before saving ([rules.js:565-593](../../../frontend/src/lib/rules.js#L565-L593))
- Effective shares use the largest remainder, so they add up too ([rules.js:424-455](../../../frontend/src/lib/rules.js#L424-L455))

**"What happens to students' scores if I delete a criterion?"**
- The tasks stay stored but stop counting; the save dialog says how many
  ([rules.js:1101-1126](../../../frontend/src/lib/rules.js#L1101-L1126))
- Current Term Records shows a note for hidden tasks ([term-records.md](term-records.md))

**"Can any student edit any rule?"**
- Yes, today: rules are shared, and any student can create, edit and delete any rule (`SPEC.md` §6)
- The professor role that should own rules is `[PLANNED]`

**"How is the formula text built?"**
- From each deepest criterion's effective share: "Grade = 0.49 × AT + 0.21 × TLA + 0.30 × Exam"
  ([rules.js:649-662](../../../frontend/src/lib/rules.js#L649-L662))

**"Why random ids for new criteria?"**
- Tasks are stored under criterion ids; a reused id would attach old tasks to a new criterion
  ([rules.js:260-262](../../../frontend/src/lib/rules.js#L260-L262))

**"How are colours chosen?"**
- Top-level criteria by position; deeper ones cycle through 8 colours, skipping the neighbours'
  ([rules.js:677-715](../../../frontend/src/lib/rules.js#L677-L715)); tokens `criteria-1` to `criteria-8`

## 6. Security and QA notes

- **Known bug, board task T-23:** Grade Rules and the editor read the database once
  (`live: false`, [GradeRules.jsx:45](../../../frontend/src/pages/student/GradeRules.jsx#L45),
  [useRuleEditor.js:38](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L38)) and build
  every save from that copy. A subject removed in the Sidebar meanwhile comes back on the next save.
  Current Term Records avoids this by re-reading before it saves ([term-records.md](term-records.md)).
- **A failed Duplicate on the editor shows nothing** ([useRuleEditor.js:143-146](../../../frontend/src/features/grade-rules/hooks/useRuleEditor.js#L143-L146)); also T-23.
- **Saves report failure instead of throwing** (`saveDbSafely`, [GradeRules.jsx:54-62](../../../frontend/src/pages/student/GradeRules.jsx#L54-L62)).
- **Names are trimmed, limited to 30 characters and unique per level** ([rules.js:279-291](../../../frontend/src/lib/rules.js#L279-L291)); rule names are unique ([rules.js:910-922](../../../frontend/src/lib/rules.js#L910-L922)).
- **Tags must be from a fixed list** ([rules.js:33](../../../frontend/src/lib/rules.js#L33), [rules.js:924-928](../../../frontend/src/lib/rules.js#L924-L928)).

## 7. AI provenance

| File | Commits (`--follow`) | With a Claude trailer | People (commits without a trailer) |
| --- | --- | --- | --- |
| `pages/student/GradeRules.jsx` | 19 | 15 | Marco Liu (first commit, 2026-10-07), Jun Mari Manla 2, Lian Dumangas 1 |
| `pages/student/RuleDetailPage.jsx` | 25 | 22 | Lian Dumangas 2, Jun Mari Manla 1 |
| `features/grade-rules/components/PillLevel.jsx` | 12 | 11 | Jun Mari Manla 1 |
| `features/grade-rules/components/PillEditor.jsx`, `RuleFormula.jsx`, `RuleHierarchyTable.jsx`, `RulePieChart.jsx` | 9–12 each | 6–8 each | First commits by Marco Liu, 2026-10-07 |
| `features/grade-rules/hooks/useRuleEditor.js` | 2 | 2 | Extracted from `RuleDetailPage.jsx`, 2026-11-13 |
| `lib/rules.js` | 10 | 7 | Jun Mari Manla 2, Lian Dumangas 1 |

Method and limits: [ai-log.md](../ai-log.md).

## 8. Self-check

- [ ] Change AT from 70% to 75% on paper: what are the new shares and effective multipliers?
- [ ] Explain why the editor rejects 100% for AT.
- [ ] Explain what `splitCriterion` does to ids ([rules.js:399-414](../../../frontend/src/lib/rules.js#L399-L414)).
- [ ] Use the divider with the keyboard only, and say which keys do what.
- [ ] Explain the T-23 bug and how Current Term Records avoids the same problem.
- [ ] Say what happens when you delete a rule that a subject uses.

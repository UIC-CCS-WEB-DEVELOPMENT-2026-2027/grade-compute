# CompUGrade — Accessibility Audit (WCAG 2.2 AA)

Task T-JM-12 (2026-11-28). A read-only review of all 14 screens against WCAG 2.2 level AA, and
against the accessibility and responsive rules in `AGENTS.md` §7. **Nothing here is fixed.** Each
fix becomes a task of its own once the owner approves it (§6). It is step 1 of
`docs/ACCESSIBILITY_PLAN.md` §4.

- **Code reviewed:** `main` at `fcb2906` (2026-11-28).
- **Screens:** sign-in, Student Hub, My Subjects, Subject Detail (Prelim and Midterm), the
  sandbox, Grade Rules, a rule, a new rule, and the five Settings sections: the 14 screens of
  `npm run screenshots`, at 375, 768, 1024 and 1440 pixels wide, plus 320 for reflow.
- **How:** the screenshots were looked at; a temporary Playwright script (not committed) measured
  every screen at every width; the code behind each finding was read (§8).
  - Results marked **(measured)** were measured in the browser.
  - Results marked **(seen)** were confirmed in a screenshot.
- **Severity:**
  - **High:** a keyboard or screen-reader user can't tell where they are on most screens.
  - **Medium:** a WCAG AA criterion fails on some screens, or a group of users meets a real
    obstacle.
  - **Low:** a best practice or a project rule (`AGENTS.md` §7), or a near miss.

## 1. Summary

CompUGrade does much of this well already: labelled forms with linked error messages, dialogs
that handle focus, charts with text alternatives and a table view, and no information carried by
colour alone (§7). What matters most:

1. **The focus ring is almost invisible (AX1).** It is a pale, see-through blue, about 1.2 to
   1.5:1 against the page, where 3:1 is needed. A keyboard user can barely see where they are on
   any screen.
2. **Some tab stops show no focus at all (AX2, AX3):** the Settings and sign-in tab panels, and the
   grade-history charts.
3. **Changing page loses the user (AX4, AX5).** Every page has the same title, focus is left on
   the page body, and on a phone the new page can open part-way down.
4. **Smaller AA failures:** the Settings account fields don't say what they're for (AX6), and
   Subject Detail scrolls sideways at 320 pixels (AX7).

## 2. Focus and keyboard

| ID | Criterion | Where | What a user meets | Proposed fix |
| --- | --- | --- | --- | --- |
| **AX1** High | 1.4.11 Non-text Contrast; 2.4.7 Focus Visible | The `--ring` and `--sidebar-ring` tokens (`frontend/src/index.css:112, 151`: `#4c8ce45c`, a 36% see-through blue), used at half strength by the shadcn components (`focus-visible:ring-ring/50`, for example `frontend/src/components/ui/button.jsx:10` and `input.jsx:13`). Inputs also swap their visible border (`--input`, 3.6:1) for the ring colour when focused | The focus ring measures **1.49:1** on a card, **1.46:1** on the page background and **1.47:1** on the yellow sidebar, and **1.21:1** at half strength **(measured)**. A focused input's edge gets *fainter*. Sighted keyboard users can barely follow their place on every screen | An opaque ring token with at least 3:1 against card, background and sidebar (for example `--primary`, `#406093`), used at full strength. Keep the input's border visible on focus. One token change in `index.css` (a rule file: inside its group) plus the `ring-ring/50` classes in `components/ui/` |
| **AX2** High | 2.4.7 Focus Visible | `TabsContent` (`frontend/src/components/ui/tabs.jsx:66`: `outline-none`), on all five Settings sections and on the sign-in page's Log In and Create Account panels | Base UI makes each tab panel a tab stop (`tabindex="0"`), but it shows nothing when focused. Pressing Tab seems to do nothing for one press **(measured, seen)** | A visible focus ring on `TabsContent` (`focus-visible:ring-…` with AX1's token) |
| **AX3** Medium | 2.4.7 Focus Visible; 4.1.2 Name, Role, Value | The grade-history charts (`frontend/src/components/history-chart/HistoryChart.jsx`) on the Student Hub, Subject Detail and the sandbox. Recharts' accessibility layer is on by default, which makes the chart a `role="application"` tab stop | The chart takes focus with no visible sign of it **(seen)**. A screen reader switches to application mode there. In the test, ArrowRight showed no tooltip, so the stop seems to do nothing for a keyboard user | Turn the layer off (`accessibilityLayer={false}`) and give the chart's wrapper `role="img"` with its existing label. The "Show as a table" view already gives keyboard users every point and an "Open task" button per row. Or keep the layer, with a visible focus ring, if the arrow keys do show the tooltip when checked by hand |
| **AX4** Medium | 2.4.2 Page Titled | `frontend/index.html:6`. No screen sets its own title | Every screen's title is "CompuGrade" **(measured)**, so browser tabs, history and screen readers can't tell the pages apart. It's also spelled differently from the logo (CompUGrade) | A title per page, for example "Subject Detail: IT101 · CompUGrade". This is task T-JM-22 (with T-16, because the product name is branding) |
| **AX5** Medium | 2.4.3 Focus Order | The declarative router (`frontend/src/app/App.jsx`, `<BrowserRouter>`), which has no `ScrollRestoration` and moves no focus | After following a link, focus stays on `<body>` and nothing tells a screen reader that the page changed **(measured)**. On a phone, going from My Subjects to Subject Detail kept the scroll position (130 pixels before and after), so the new page opened part-way down **(measured)** | On each route change: scroll to the top (except when `?task=` asks for a task), and move focus to the page's `h1` (`tabIndex={-1}`), so it is read out. One small component in `frontend/src/app/` (`App.jsx` is a rule file) |
| **AX9** Low | 2.4.11 Focus Not Obscured (Minimum) | The sticky header (`frontend/src/components/layout/Header.jsx`) on phones, for example Settings' "Back" link | When "Back" takes focus, the browser scrolls it under the sticky header. The button's top is at 36 pixels and the header ends at 65 **(measured, seen)**, so only a sliver shows. AA requires it not to be *entirely* hidden, so this only just passes | `scroll-padding-top` on `html`, equal to the header's height (a token), so focused items stop below the header |
| **AX11** Low | 4.1.2 Name, Role, Value; 2.4.3 Focus Order | The rule pie chart (`frontend/src/features/grade-rules/components/RulePieChart.jsx:23`), on a rule and on New rule | It has `accessibilityLayer={false}`, but Recharts' `Pie` still renders its own tab stop (`rootTabIndex`, default 0) with no name **(measured)**. A keyboard user meets one silent stop inside an image | `rootTabIndex={-1}` on `<Pie>` (Recharts 3.10). The wrapper's `role="img"` label already describes the chart |

## 3. Forms

| ID | Criterion | Where | What a user meets | Proposed fix |
| --- | --- | --- | --- | --- |
| **AX6** Medium | 1.3.5 Identify Input Purpose | Settings, Account (`frontend/src/features/settings/components/AccountSection.jsx:14-20`, the input at line 102) | Full name, Email address and Username have no `autocomplete` **(measured)**, so browsers and assistive tools can't fill them in or show their purpose | `autocomplete="name"`, `"email"` and `"username"`. Student ID, program and year level have no standard purpose and stay as they are. Sign-in, register and the password change already set theirs (§7) |
| **AX15** Low | 1.3.1 Info and Relationships | The score boxes in Current Term Records (`frontend/src/features/term-records/components/CurrentTermRecords.jsx:340-370`) and the sandbox's draft-score boxes (`frontend/src/features/sandbox/components/TargetGradeSandbox.jsx:680-700`) | A wrong score sets `aria-invalid`, and its message is announced in a separate `role="alert"`, but the box doesn't point to the message. Coming back to the box later, a screen reader says "invalid" without saying why | `aria-describedby` from the box to its message, as Add subject already does (`frontend/src/features/subjects/components/AddSubjectForm.jsx:119-120`) |

## 4. Layout, text and size

| ID | Criterion | Where | What a user meets | Proposed fix |
| --- | --- | --- | --- | --- |
| **AX7** Medium | 1.4.10 Reflow | Subject Detail at 320 pixels: the "View Complete Official Grade Breakdown" button (`frontend/src/features/term-records/components/CurrentTermRecords.jsx:512-515`), which can't wrap (the button's `whitespace-nowrap`) | The page scrolls sideways by 16 pixels **(measured)**. 320 pixels is what WCAG uses for a 1280-pixel screen zoomed to 400%. Every other screen reflows at 320, and none scrolls sideways at 375 to 1440 | `whitespace-normal` on that trigger, so the label wraps. (A shorter label would also work, but it's a wording change) |
| **AX10** Low | 2.5.8 Target Size (Minimum); `AGENTS.md` §7 (44 pixels on phone and tablet) | "Show password" (`frontend/src/pages/auth/LoginRegister.jsx:57`, 24 by 24), "Add a criterion" (`frontend/src/features/grade-rules/components/PillLevel.jsx:275`, 24 by 24), a criterion's percentage box on New rule (34 pixels wide), and the Notifications switches (32 pixels wide; their touch area is already 46 pixels tall, `tap:after:-inset-y-3.5`) **(measured at 375 and 768)** | Small targets are hard to hit with a finger or with shaky hands. All of these reach WCAG's 24 pixels, so AA passes; they miss the project's own 44 | The `tap:` sizes the other controls use (for example `tap:size-11` on the icon buttons, and a wider touch area on the switches) |
| **AX12** Low | `AGENTS.md` §7 (the 12-pixel `caption` role is for chart axes, badges and eyebrow labels only) | The caption role on: table headers ("Status", "Score / Max", "You need"); a heading (the sandbox's criterion headings, `TargetGradeSandbox.jsx:632`); the sandbox result label ("Your result · To reach 90% in Prelim"); "Prelim expected" and "target reached"; the subject code in the subjects table; and the sign-in hero's preview card **(measured)** | 12-pixel text is harder to read, especially for low-vision and dyslexic readers (`docs/ACCESSIBILITY_PLAN.md`). WCAG sets no minimum size, so this isn't an AA failure | `type-small` (14 pixels) for these, keeping `caption` for axes, badges and eyebrows |
| **AX13** Low | 1.4.3 Contrast (Minimum) | Settings, Account Actions: "Sign out of your CompuGrade account." (`frontend/src/features/settings/components/AccountActionsSection.jsx:49`), `--muted-foreground` on the `bg-warning-soft` panel | **4.47:1** where 4.5:1 is needed **(measured)**: a near miss. Every other text on the 14 screens meets AA (§7) | `text-foreground` for the description on that panel, or a slightly darker muted colour there |

## 5. Structure

| ID | Criterion | Where | What a user meets | Proposed fix |
| --- | --- | --- | --- | --- |
| **AX8** Low | 1.3.1 Info and Relationships; 2.4.6 Headings and Labels | The header's greeting (`frontend/src/components/layout/Header.jsx:86`) is an `h1`, so every signed-in page has two ("Welcome back, Ysa!" and the page title). On the sandbox, the header's title is "Target Grade Sandbox", next to the subject's `h1` | Screen-reader users who jump to the first `h1` land on the greeting, not on the page **(measured)** | The greeting as a `p` with the same text role. One `h1` per page: the page's own title |
| **AX14** Low | 1.3.1 Info and Relationships | Settings' row titles (`frontend/src/features/settings/components/SettingText.jsx:6`, `ProfileSection.jsx:57`, `SecuritySection.jsx:533`) are `h4` straight under an `h2`. The sandbox's step headings read "1Set your Prelim target" | Skipped levels make the heading list harder to follow. The step number runs into the text when read aloud **(measured)** | `h3` for those rows (the look stays, through the text role). For the steps, the number in its own `aria-hidden` element plus visually hidden "Step 1:", or a separator |

Decorative separators ("•" at 3.64:1 and "·" at 1.13:1, on the Student Hub and Subject Detail)
are exempt from contrast as decoration, but they're read aloud. `aria-hidden="true"` on them would
stop that; it can go with AX14.

## 6. Proposed tasks (for the owner to approve)

Grouped so each task stays inside a few areas. On `docs/BOARD.md` as T-JM-30 to T-JM-34, in this
order (owner request, 2026-11-29); task 2's AX4 stays with T-JM-22, so T-JM-31 covers AX5.

| # | Task | Fixes | Areas | Needs |
| --- | --- | --- | --- | --- |
| 1 | A visible focus ring everywhere | AX1, AX2, AX3, AX11 | shared (`frontend/src/index.css` token), `components/ui/`, history, grade-rules | A token change: `index.css` is a rule file, so the token goes in its own small PR first |
| 2 | Page titles, focus and scroll after navigating | AX4, AX5 | `frontend/src/app/` (`App.jsx` is a rule file), each page | AX4 is T-JM-22 (with T-16, branding). Check every screen at the four widths |
| 3 | Form purposes and linked error messages | AX6, AX15 | settings, term-records, sandbox | Nothing beyond tests |
| 4 | Layout fixes | AX7, AX9, AX10 | term-records, layout, auth, grade-rules, settings | A header-height token for AX9 |
| 5 | Headings and small text | AX8, AX12, AX13, AX14 | layout, settings, sandbox, subjects, auth | Nothing the student would read differently, apart from sizes |

## 7. What already meets AA

Checked and found fine, so it stays as it is:

- **Language:** `<html lang="en">` (3.1.1).
- **Sign-in errors:** an empty submit marks both fields `aria-invalid`, links each to its message
  (`aria-describedby`), announces them (`role="alert"`) and moves focus to the first one **(measured)**
  (3.3.1, 3.3.3, 4.1.3).
- **`autocomplete` on sign-in, register and the password change:** `username`,
  `current-password`, `name` and `new-password` (`LoginRegister.jsx:70, 274, 289`;
  `SecuritySection.jsx:302`) (1.3.5). The register email field uses `username`, which is also a
  valid purpose for a sign-in identifier.
- **Signing in:** passwords can be pasted (nothing blocks it), and there is a show-password button
  (3.3.8 Accessible Authentication).
- **Dialogs:** opening Help moves focus into the dialog, which has a name; Escape closes it and
  returns focus to the button **(measured)** (2.4.3).
- **Contrast:** apart from AX13, every text on the 14 screens at every width meets 4.5:1 (3:1 for
  large text) **(measured)**. Input borders (`--input`, 3.6:1) meet 3:1.
- **No horizontal scroll** at 375, 768, 1024 and 1440 on any screen **(measured)**.
- **Colour is never the only signal:** official and self-reported scores are labelled ("Locked ·
  Official", "Self Reported"); the chart legend uses filled and hollow points and dashed lines;
  rule criteria show their names and percentages (1.4.1) **(seen)**.
- **Charts:** each has a descriptive label and a "Show as a table" view, whose rows have "Open
  task" buttons, so clicking a point has a keyboard equivalent (1.1.1, 2.1.1).
- **Dragging:** the pill editor's percentages can be typed (2.5.7 Dragging Movements).
- **Sound:** the celebration's voice clip stops when its dialog closes (1.4.2 Audio Control).
  Motion follows the device's reduced-motion setting (`docs/ACCESSIBILITY_PLAN.md` §2).
- **Names:** every button, link, switch and field has an accessible name, apart from AX11
  **(measured)**. Base UI's hidden checkbox inputs are `aria-hidden` and out of the tab order.
- **Landmarks:** every screen has one `main`; signed-in screens have the sidebar's `nav` and a
  `header` (1.3.1).
- **Status messages:** the sandbox's result and the rule pages' messages use live regions (4.1.3).

## 8. How this was checked, and what wasn't

- **Screenshots:** `npm run screenshots` (56 images: 14 screens at four widths), looked at for
  clipping, overlap and colour use.
- **A temporary Playwright script** (not committed) opened each screen at 320, 375, 768, 1024 and
  1440 pixels with the seed data, signed in as `U1`. It recorded:
  - sideways scroll, page titles, headings and landmarks
  - text under 14 pixels
  - the contrast of every text against its solid background, colours converted through a canvas,
    so Tailwind's `oklch` values are compared correctly
  - the size of every interactive element, and whether each has an accessible name
  - every field's label and `autocomplete`
  - a walk with the Tab key, comparing each element's focused and unfocused styles and checking
    whether anything covered it
  - WCAG 1.4.12's text spacing, applied with a style sheet
  - focus and scroll after following a link, the sign-in errors, and the Help dialog's focus
- **A second script** took close-ups of each flagged item to confirm it. Two flags turned out to be
  false and aren't listed:
  - The "Open menu" and "Minimize sidebar" buttons do show a ring (AX1's faint one).
  - The tag checkboxes on New rule sit inside 44-pixel labels.
- **Not checked, and worth doing by hand before the fixes:**
  - a real screen reader (NVDA on Windows, TalkBack on Android)
  - the browser zoomed to 200%
  - Windows' forced-colours (high contrast) mode
  - dialogs other than Help (the rule dialogs, the remove-subject confirmation, the celebration)
  - text on gradients or images, which the contrast check skips
  - with text spacing applied, the script flagged the Subject Detail target box and the sandbox's
    target label as possibly clipped. This wasn't confirmed in a screenshot

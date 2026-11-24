# CompUGrade — Accessibility Plan

A proposal (2026-11-24), not part of the spec. It lists options for students with dyslexia and
other disabilities. **The owner makes the decisions during implementation** (2026-11-24), so
every option below is open. The work is built in the React app and doesn't wait for the
back end (`docs/LARAVEL_PLAN.md`). It's tasks T-JM-12 and T-JM-13 on `docs/BOARD.md` (state
`proposed`). Once a decision is made, the
feature is written into `spec/features.md` as F21 through the protocol in `AGENTS.md` §2.

## 1. The feature

**F21 · Accessibility and reading preferences.** A section in Settings. It starts from the
device's own settings (reduced motion, more contrast, forced colours), lets the student change
them, and applies the choice on every screen.

The styles already use tokens for fonts and sizes (`--font-heading`, `--font-body` and the
`type-*` roles in `src/index.css`). Most options can be one attribute on `<html>`, for example
`data-reading="readable"`, that switches token values, without changing each component.

## 2. Options by need

| Need | Options |
| --- | --- |
| **Dyslexia** | A readable font mode; more letter, word and line spacing (the WCAG 1.4.12 levels: line height 1.5, letters 0.12em, words 0.16em); a shorter line length; no all capitals or italics in running text; an off-white background |
| **Dyscalculia** (numbers are most of the app) | Results in plain words ("You need about 17 out of 20 on each of your 3 remaining quizzes"); a step-by-step "how this grade was worked out" view; numbers that line up in columns; fewer decimals |
| **Low vision** | Text size up to 200% without breaking the layout; a high-contrast mode; screens that work at 320px wide |
| **Colour blindness** | Nothing shown by colour alone: official and self-reported scores, and criteria 1 to 8, also get an icon, a pattern or a label; the chart's table view is easy to reach |
| **Motion and sound sensitivity** | A switch to turn off the confetti, and a mute for the celebration voice clip (`congrats-voice.mp3`), with a caption. The confetti already stops with the device's reduced-motion setting |
| **ADHD, anxiety, heavy mental load** | A simple view that hides the sandbox's advanced controls; fewer things on screen at once; calm, encouraging wording (it fits F18) |
| **Screen readers and keyboards** | Gauges and charts have names a screen reader can read; sandbox results are announced; every drag has a keyboard way to do it (the pill editor already takes a typed %); an optional "read aloud" using the browser's built-in speech, with no new package |

**About dyslexia fonts.** Studies have found that OpenDyslexic doesn't make reading faster or
more accurate. Spacing, size and a plain sans-serif font help more. Khand, the heading font, is
condensed, which is harder for dyslexic readers, so a readable mode would change the headings
too. One option is Atkinson Hyperlegible (free, can be self-hosted).

## 3. Rules the options run into

These are for the owner to decide when each option is built:

- `AGENTS.md` §7 allows only Khand and General Sans. A readable font is a third family.
- `AGENTS.md` §7 allows one theme (light). A high-contrast mode is a second theme.
- Where the preferences are kept: in the browser for now, like the sidebar setting (no stored-data
  change, so no LOCK-data). Once the back end exists, on the user's account, so they follow the
  student to every device.
- Automated checks (for example axe-core) are a new package and need approval.

## 4. Order

1. **Audit (T-JM-12):** a WCAG 2.2 AA review of all 14 screens, written up in `docs/`, like
   T-21. Its fixes become tasks of their own. They help every student, not only those who turn
   an option on.
2. **Preferences (T-JM-13):** the Settings section and the token switches, then one option at a
   time, each with its decision made at the time.
3. Preferences should apply before the page first draws, which means a small script in
   `index.html`. That file is in T-16's (branding) areas, so coordinate with T-16.

# Changelog

## Clean-up — `refactor/cleanup` (2026-11-11 to 2026-11-13)

A codebase and UI clean-up. Grades, saved data and navigation behave as before. Details: `docs/REFACTOR_REPORT.md`.

### Added

- Tailwind CSS v4 and shadcn/ui on Base UI.
- Design tokens and text roles in one stylesheet.
- Prettier formatting; lint now passes.
- 369 unit and characterization tests (Vitest).
- Screenshot script for four screen widths.
- Behaviour checklist covering every student flow.
- `SPEC.md`: what the app is and does.
- `@/` import alias for imports across folders.

### Changed

- Files grouped into app, pages, features, lib, services.
- Grade logic moved out of components into `lib/`.
- Every screen rebuilt on shadcn components.
- Sidebar rebuilt on shadcn Sidebar, same look.
- Phone menu up to 767px; tablets minimised to 1023px.
- Settings uses the shared page layout and tabs.
- Every screen fits 375, 768, 1024 and 1440 wide.
- 44px touch targets below 1024px or on touchscreens.
- Darker muted and error text for readable contrast.
- Rule delete confirmation uses an in-app dialog.
- Repeated markup merged into shared components.
- Named exports in every file.

### Fixed

- Sandbox draft scores no longer change real scores.
- Lint errors.

### Removed

- 19 per-screen stylesheets.
- Unused Settings prototype, files, assets and exports.
- Unreachable dark theme.
- "Workspace: Student" label in Settings.
- Unused `@types/react` packages.

### Kept as they were

- Grade maths, rounding and saved data.
- Logo, product name, favicon and page title.
- Known bugs, listed in the refactor report.

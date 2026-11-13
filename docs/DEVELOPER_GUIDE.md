# CompUGrade — Developer Guide

Start here if you are joining the work on CompUGrade. This guide walks you through how we work
together and how to use AI tools on this codebase. The details live in other files; this one tells
you which file answers which question, and how the pieces fit.

## 1. What to read, and when

| File | What it answers | Read it |
| --- | --- | --- |
| `README.md` | How to install and run the app | Once, to set up |
| `SPEC.md` | What the app does: features, grading rules, data model | Before any task that touches a feature. **Never edit it** (see §5) |
| `AGENTS.md` | The coding rules: folders, naming, styling, components, accessibility | Once in full, then whenever you're unsure. Every AI agent reads it too |
| `docs/TEAM_WORKFLOW.md` | How we work in parallel: claiming tasks, areas, locks, branches, PRs | Once in full before your first task |
| `docs/BOARD.md` | The to-do tracker: every task and who is on it | Every time you pick up work |
| `docs/AI_WORKFLOW.md` | Which kind of AI tool you have, and the workflow for each kind | Before you use any AI tool (§4) |
| `docs/AGENT_GUIDE.md` | How to use an AI agent that can see the repo (Claude Code, Codex, Cursor, …) | Before you use one (§4.1) |
| `docs/ai-context/` | How to get usable code from a chat AI that can't see the repo | Before you use one (§4.2) |
| `docs/AUDIT.md` | Known bugs (§12) and why things are the way they are | When something looks wrong |

## 2. Setting up

Follow "Getting Started" in `README.md`: Node.js 20.19+ or 22.12+, then `npm install` and
`npm run dev`.

Then set your editor to format with the project's Prettier on save. Use the Prettier extension;
it picks up `.prettierrc.json` by itself. This matters for merge conflicts: if everyone formats the
same way, nobody's commit rewrites someone else's lines.

## 3. A task from start to finish

Here is the whole loop. `docs/TEAM_WORKFLOW.md` has the full rules for each step.

**1. Pick a task.** Open `docs/BOARD.md` on an up-to-date `main`. Choose a task whose State is
`todo`. Check the **Areas** of every task that is already `claimed`. If one shares an area with
yours, talk to that person first.

**2. Claim it on `main`.** Change only your task's State line, then commit and push straight away:

```sh
git switch main
git pull --rebase
# edit docs/BOARD.md:  - State: claimed by your-github-name on 2026-11-20, branch feat/sandbox-copy
git add docs/BOARD.md
git commit -m "chore(board): claim T-6"
git push
```

If the push is rejected, run `git pull --rebase`. If that conflicts on your State line, someone
claimed the task before you: run `git rebase --abort` and `git reset --hard origin/main`, then
pick another task.

**3. Branch out:** `git switch -c feat/sandbox-copy`.

**4. Work inside your areas.** Only change the folders listed in your task's Areas. Need a shared
file (a token in `src/index.css`, a route in `App.jsx`, a new dependency, a data change)? Check
`TEAM_WORKFLOW.md` §5. Some of those need a lock or a small PR of their own first.

**5. Bring in `main` every day you work:** `git fetch origin` then `git merge origin/main`.

**6. Before every commit:** `npm run format`. Before opening the PR: `npm run lint`,
`npm run format:check`, `npm run build`, `npm test`. All four must pass.

**7. Open the PR.** Set your task's State to `done in PR #<n>` in the PR's last commit. Say which
task it closes and which screen widths you checked (375, 768, 1024, 1440). Keep it small.

**8. After the merge:** delete your branch, and free any lock you held.

## 4. Using AI tools

**`docs/AI_WORKFLOW.md`** tells you which of three kinds your tool is (an agent, an editor
assistant or a chat model) and walks through a task with each. Two of them need a setup of their
own, described below.

### 4.1 Agents that can see the repo

Claude Code, Codex, Cursor, Copilot in agent mode and similar tools open files themselves. Most of
them read `AGENTS.md` from the repo root automatically. If yours doesn't, tell it to read
`AGENTS.md` first.

When you give an agent a task, tell it three things:

- the task ID from the board and what "done" means
- the **Areas** it may change, and that everything else is off limits
- that you will push the branch yourself

An agent can also claim the task for you if you ask it to. Give it your GitHub username and the
branch name; it follows `docs/TEAM_WORKFLOW.md` §3. Apart from that one claim commit, agents never
edit `docs/BOARD.md`, push or merge. People do that.

**`docs/AGENT_GUIDE.md`** has the details: setup per tool, a task prompt to copy, running two
agents at once, and how to check what an agent did.

### 4.2 Chat models that can't see the repo

A chat model (ChatGPT, Gemini or Claude in a browser, without file access) only knows what you
paste into it. Without context it will guess, and the guesses are usually wrong for this project:
TypeScript instead of JavaScript, Radix instead of Base UI, made-up colours and components.

So every request is three things, pasted in this order:

1. **The context pack:** the whole of `docs/ai-context/CONTEXT_PACK.md`. It tells the model the
   stack, the folder layout, the numbered rules (R1–R25), and every token and component it may use.
2. **The task block** from `docs/ai-context/PROMPT_TEMPLATE.md`, filled in: what to build, what
   "done" means, which files it may change.
3. **The files** the task needs. The template has a table of what to paste for each kind of
   task. Paste only what's needed.

Start a new chat for each task.

**Never use the answer as-is.** Go through the checklist at the end of `PROMPT_TEMPLATE.md`:

- paste the files in and run format, lint, build and tests
- read the model's **Assumptions**, **Rule exceptions** and **Needs** lists and check each one
  against the real code
- search for the usual mistakes: hard-coded colours, arbitrary values like `w-[347px]`, hand-built
  buttons, `localStorage` in a component, changed wording
- look at the screen at all four widths

If the answer breaks a rule, reply with the rule number and the line ("R10: `w-[347px]` on line
42") and ask for the complete file again. Don't patch it by hand in the chat.

For anything bigger than a small change, have a repo-aware agent review the diff before you open
the PR. It can spot duplicated code and side effects that the chat model couldn't see.

## 5. Rules that catch people out

The full list is in `AGENTS.md` §5–7. These are the ones broken most often:

- **No hard-coded colours or arbitrary values.** Use tokens (`bg-primary`, `text-muted-foreground`)
  and the Tailwind scale. Never `#406093`, `text-[13px]` or `w-[347px]`. If a value is missing,
  ask for a token.
- **Text sizes come from roles:** `type-page-title`, `type-section-title`, `type-card-title`,
  `type-body`, `type-small`, `type-caption`. Not `text-sm` or `font-bold` on their own.
- **Use shadcn/ui** (`@/components/ui/…`) for buttons, inputs, dialogs, cards and so on. Never build
  your own button. New shadcn components are added with the shadcn CLI.
- **No new `.css` files.** `src/index.css` is the only stylesheet.
- **Grade maths lives in `src/lib/`** as pure functions. Components call them; components never
  calculate grades themselves.
- **Named exports and `@/` imports:** `export function Foo()` and `import { Foo } from "@/…"`.
  No `export default`, no `../../`.
- **Don't change wording, grade calculations or the stored data shape** unless your task says so.
- **`SPEC.md` is protected.** Only the owner changes it, through the protocol in `AGENTS.md` §2.
  If your task needs a SPEC change, ask the owner.
- **Found a bug?** Write it down as a new task on the board (or tell the owner). Don't fix it
  inside an unrelated PR.

## 6. When something goes wrong

| Problem | What to do |
| --- | --- |
| My claim push was rejected | `git pull --rebase`, then push again. A conflict on your State line means someone else got the task first (§3, step 2) |
| Merge conflict in my feature branch | Resolve it, then run format, lint, build and tests again. If it's in someone else's area, ask them how their side should look |
| Conflict in `package-lock.json` | Don't edit it by hand. Take `main`'s copy, run `npm install`, commit the result (`TEAM_WORKFLOW.md` §5) |
| Lint or format check fails | Run `npm run format` first, then read the lint message. It usually names the rule |
| The AI's code doesn't fit the project | Check you pasted the whole context pack. Then reply with the rule number it broke and ask for the full file again |
| Two tasks need the same file | Talk to each other. Usually one person lands a small PR first, and the other builds on it |
| A task is bigger than it looked | Split it: add new tasks to the board, finish the first part, and release or narrow your claim |
| I can't finish my task | Set its State back to `todo` on `main` (`chore(board): release T-6`) so someone else can take it |

## 7. Words used in these docs

| Word | Meaning |
| --- | --- |
| **Area** | A group of folders that belongs to one feature (`TEAM_WORKFLOW.md` §4). Tasks in different areas can run side by side |
| **Claim** | Marking a task as yours on the board, by pushing a one-line change to `main` |
| **Lock** | A claim on a shared file that only one person may change at a time (data shape, dependencies, SPEC) |
| **Token** | A named design value in `src/index.css` (a colour, size or shadow) that components use instead of raw values |
| **Text role** | One of the `type-*` classes that set font, size and line height together |
| **Context pack** | The file you paste into a chat AI so it knows this project |
| **Owner** | The project owner, Jun Mari Manla, who approves tasks and SPEC changes and reviews and merges every PR |

## 8. Questions

Ask in the team group chat. Announce moves, renames and any lock held for more than a day there
too, so nobody builds on a file that is about to change.

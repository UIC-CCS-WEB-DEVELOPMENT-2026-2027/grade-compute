# CompUGrade — Working with Repo-Aware AI Agents

For developers who use an AI agent that can open and edit the repository: Claude Code, Codex,
Cursor, Copilot in agent mode, Gemini CLI and similar tools. For chat models without file access,
see `docs/ai-context/` instead.

## 1. What the agent already knows, and what it doesn't

The rules for agents are in `AGENTS.md`, and the agent reads them itself. You don't need to
repeat them. What the agent **can't** know:

- which task you're doing, and what "done" means
- which folders it may change: the task's **Areas** on `docs/BOARD.md`
- what your teammates are changing right now
- decisions made in a chat or a meeting that aren't written in `SPEC.md` or `AGENTS.md`

Your job is to give it those four things, then check its work.

## 2. Setup per tool

Everything an agent needs is already committed: `AGENTS.md`, `CLAUDE.md`, the shadcn skills, and
the Claude Code settings. After cloning there is nothing to install for the agent itself.

| Tool | Reads | Notes |
| --- | --- | --- |
| Claude Code | `CLAUDE.md`, which imports `AGENTS.md`; skills in `.claude/skills/`; `.claude/settings.json` | The settings make any edit to `SPEC.md` ask you first. Answer "no" unless the owner approved that exact change |
| Codex | `AGENTS.md`; skills in `.agents/skills/` | |
| Cursor, Copilot, others | Most read `AGENTS.md` from the repo root | Check your tool's docs. If it doesn't, start every session with "Read AGENTS.md in full before doing anything" |
| Gemini CLI | `GEMINI.md` by default | Set its context file name to `AGENTS.md` in your Gemini settings, or tell it to read the file at the start |

- **Only Claude Code enforces the `SPEC.md` protection with a prompt.** In the other tools it relies
  on the agent following `AGENTS.md` §2. Check every diff for `SPEC.md` changes yourself.
- **The shadcn skills** (`shadcn`, `migrate-radix-to-base`) teach the agent how to add and style
  shadcn components the way this project does (Base UI, JavaScript). If your tool supports
  skills, they load automatically from the folders above.
- **Personal permission settings** (for example in Claude Code, `.claude/settings.local.json`) are
  yours. Don't commit them. The shared settings don't block `git push` or edits to `docs/BOARD.md` (owner decision,
  2026-11-13): `AGENTS.md` §8 and the task prompt (§4) cover both, so check the diff for them.

## 3. Before you start the agent

1. **Claim the task** on `main` (`docs/TEAM_WORKFLOW.md` §3), then create the branch. Do it
   yourself, or ask the agent to as the first step of the session (the optional line in the §4
   prompt). An agent that claims follows the same steps and pushes only that one commit
   (`AGENTS.md` §8). Apart from the claim, agents never edit `docs/BOARD.md`, push or merge.
2. **One task per session.** Start a fresh session for each task. Long sessions drift: the agent
   forgets early instructions and carries assumptions from the last task into the next.
3. **Two agents at once? Use a separate folder for each.** Two agents in the same folder will
   overwrite each other's files and mix their changes into one commit. Give each task its own Git
   worktree:

   ```sh
   git worktree add ../grade-compute-T-6 -b feat/sandbox-copy
   cd ../grade-compute-T-6
   npm install
   ```

   Remove it after the PR is merged: `git worktree remove ../grade-compute-T-6`.

## 4. The task prompt

Copy this, fill in the brackets, and send it as the first message of the session.

```text
Task [T-6] from docs/BOARD.md: [title].

Done when:
- [visible result]
- [what must not change: wording, saved data, other screens]

You may change only these folders and files: [the task's Areas, as paths].
If you need to change anything else (src/index.css, src/app/App.jsx, package.json,
src/services/migrations.js, src/components/ui/, SPEC.md), stop and ask me first.

Read first: AGENTS.md, SPEC.md [the feature's section], docs/TEAM_WORKFLOW.md §4–5.

[Optional] First claim the task for me on main (docs/TEAM_WORKFLOW.md §3):
GitHub username [username], branch [branch]. Push only that claim commit,
then create the branch from main.

Rules for this session:
- Don't edit SPEC.md, or docs/BOARD.md beyond the claim. Don't push anything
  but the claim, don't merge, and don't switch branches after creating yours.
- Stage files by name (git add <path>), never git add . or -A.
- If you find a bug outside this task, tell me; don't fix it.

When you finish: run npm run lint, npm run format:check, npm run build and npm test,
and report the results. Then list every file you changed, anything you assumed,
and any rule from AGENTS.md you couldn't follow.
```

- **Areas are the most important line.** An agent with no limit will tidy whatever it passes,
  and that's how two people's branches end up changing the same file.
- **Plan first for anything non-trivial.** Ask for a plan before any code ("List the files you
  would change and how, then wait"). It is much cheaper to correct a plan than a finished diff.
- Point at a similar component as a pattern ("follow how `AccountSection.jsx` lays out a card")
  instead of describing the style in words.

## 5. Checking the agent's work

An agent's report says what it **thinks** it did. Check before you commit or open a PR:

1. **Read the whole diff yourself:** `git diff main...HEAD` (or `git diff` for uncommitted work).
   Look for:
   - files outside the task's Areas
   - `SPEC.md` or `docs/BOARD.md` changes
   - changed user-facing wording
   - reformatted lines the task didn't need
   - new dependencies in `package.json`
   - a new `.css` file
2. **Run the checks yourself:** `npm run lint`, `npm run format:check`, `npm run build`, `npm test`.
   Don't take "all tests pass" on trust.
3. **Look at the screen** at 375, 768, 1024 and 1440 px. Agents can't see the page unless your tool
   gives them a browser.
4. **Test the behaviour by hand**: the same input should still give the same grade and save the
   same data, unless the task changed that.
5. For a bigger change, ask a second, fresh session to review the diff (in Claude Code:
   `/code-review`). A reviewer that didn't write the code finds more.

## 6. What agents get wrong here

| Mistake | How to prevent or spot it |
| --- | --- |
| Fixes a bug it noticed on the way, which changes behaviour | "If you find a bug, tell me; don't fix it" in the prompt. Read the diff |
| Edits files outside the task, often "small clean-ups" | The Areas line. Check `git diff --stat` |
| Adds a token at the end of `src/index.css`, or reformats it | Tokens go inside their group (`TEAM_WORKFLOW.md` §5). Check the `index.css` diff line by line |
| Changes `SPEC.md` to match the code, or the code to match `SPEC.md` | `AGENTS.md` §1 says to stop and report. Refuse the `SPEC.md` prompt in Claude Code |
| Stages everything with `git add .`, including other people's or untracked files | "Stage files by name" in the prompt. Check `git status` before each commit |
| Installs a package to solve a problem | `AGENTS.md` §4 lists the approved dependencies. Look for `package.json` in the diff |
| Hand-writes a shadcn component, or a Radix version of one | Components are added with the shadcn CLI (`AGENTS.md` §7). Look for `@radix-ui` imports |
| Claims tests pass without running them | Run them yourself (§5) |
| Claims a task carelessly: another task's line, the wrong username or branch, or an overlapping area | Check the claim commit on `main` (`git show origin/main --stat`): one State line, yours, with the right branch |
| Trusts a fact in `AGENTS.md` §4 that has gone stale | Tell the owner when a fact there is wrong, so it gets fixed for everyone |

## 7. When the agent says "stop and ask"

That's the agent working correctly. `AGENTS.md` tells it to stop when a task is ambiguous, would
change behaviour, conflicts with `SPEC.md`, needs a new dependency, or turns up a bug. Answer it
yourself if the decision is yours (the task's own details). Take it to the owner if it involves
`SPEC.md`, a dependency, a data change or a bug fix. Don't tell the agent to "just do it" to get
past the question.

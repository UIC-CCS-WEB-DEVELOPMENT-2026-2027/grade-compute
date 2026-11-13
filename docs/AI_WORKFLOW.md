# CompUGrade — Working with AI Tools

For every developer on the team. This page tells you which kind of AI tool you are using, which
guide goes with it, and how a task runs from the board to a merged PR with each kind. The detailed
rules stay in the guides it links to; this page ties them together.

## 1. Which kind of AI tool do you have?

Ask two questions about the tool, in the mode you are using it right now:

1. Can it open a file in the repo that you didn't paste into it?
2. Can it change files and run commands (`npm test`) by itself?

| Kind | Opens files? / Acts? | Examples | Guide |
| --- | --- | --- | --- |
| **A. Agent** | yes / yes | Claude Code, Codex, Cursor or Copilot in agent mode, Gemini CLI | `docs/AGENT_GUIDE.md` |
| **B. Editor assistant** | partly / no | Copilot autocomplete, Cursor Tab, editor chat in ask-only mode | §4.2 below, and its row in `docs/AGENT_GUIDE.md` §2 |
| **C. Chat model** | no / no | ChatGPT, Gemini or Claude in a browser, without file access | `docs/ai-context/` |

One product can be more than one kind. Cursor's Tab completions are kind B and its agent mode is
kind A. What counts is the mode you are in.

## 2. Which kind to use for what

| Job | Best fit | Why |
| --- | --- | --- |
| A task that touches several files or needs tests | A | It sees the code that already exists and runs the checks itself |
| Finishing a line or a small function while you type | B | Quick, but it checks nothing |
| You have no agent, or want a second opinion | C | Works anywhere, but knows only what you paste |
| Reviewing a diff before the PR | A | `/code-review` in Claude Code, or "review this diff against AGENTS.md" in any agent |
| Understanding code or a rule | Any | Ask it for the file and line, then check that it's really there |

## 3. The workflow, step by step

The steps are the same whatever tool you use. What changes is who does each one.

| Step | A. Agent | B. Editor assistant | C. Chat model |
| --- | --- | --- | --- |
| 1. Pick a `todo` task on `docs/BOARD.md` whose Areas don't overlap a claimed task | You | You | You |
| 2. Claim it on `main` and push (`docs/TEAM_WORKFLOW.md` §3) | You, or the agent if you ask | You | You |
| 3. Create the task's branch from that `main` | You, or the agent | You | You |
| 4. Brief the tool | The task prompt in `docs/AGENT_GUIDE.md` §4 | Open a similar, correct file as a pattern | Context pack, task block and files (`docs/ai-context/PROMPT_TEMPLATE.md`) |
| 5. Write the code | The agent, after you approve its plan | You, accepting suggestions | The model; you paste its complete files in |
| 6. `npm run format`, then lint, format check, build and tests | The agent, then you again | You | You |
| 7. Check what no machine checks yet (§7) | You read the whole diff (`docs/AGENT_GUIDE.md` §5) | You, with the search list in `PROMPT_TEMPLATE.md` | You, with the same list, plus the model's Assumptions and Needs |
| 8. Look at every touched screen at 375, 768, 1024 and 1440 px | You | You | You |
| 9. Commit: one logical change, `type(scope): summary`, files staged by name | The agent, or you | You | You |
| 10. Push the branch and open the PR | You | You | You |
| 11. CI runs the four checks on the PR | Automatic | Automatic | Automatic |
| 12. Set `done in PR #<n>` (`docs/TEAM_WORKFLOW.md` §7); the owner reviews and merges | You, then the owner | You, then the owner | You, then the owner |

## 4. Recipes

### 4.1 Agent (kind A)

1. Start a fresh session for each task. Two agents at once need two folders (Git worktrees,
   `docs/AGENT_GUIDE.md` §3).
2. Send the task prompt from `docs/AGENT_GUIDE.md` §4, with the task's Areas written as paths. To
   have the agent claim the task, fill in its optional claim line with your GitHub username and the
   branch name.
3. For anything non-trivial, ask for a plan first and correct it before any code is written.
4. When it stops to ask: answer questions about the task's own details yourself. Take `SPEC.md`,
   dependencies, stored-data changes and bugs to the owner (`docs/AGENT_GUIDE.md` §7).
5. When it says it's done: read the whole diff, run the four checks yourself, and look at the
   screens. Its report is what it thinks it did.
6. Push the branch and open the PR yourself.

### 4.2 Editor assistant (kind B)

It usually doesn't read `AGENTS.md` and can't run anything. It copies what it sees on screen, so
give it something good to copy.

1. Open a file that already does the same kind of thing correctly (a card or dialog in the same
   feature) next to the file you're writing.
2. Accept a line or a block at a time, not whole files you haven't read.
3. Watch for the usual slips:
   - hard-coded colours (`#406093`, `bg-blue-500`) and arbitrary values (`w-[347px]`)
   - `text-sm` or `font-bold` instead of a `type-*` text role
   - a hand-built `<button>` or modal instead of the shadcn component
   - `export default`, `../` imports, or grade maths inside a component
4. Before committing, run the four checks and the search list in
   `docs/ai-context/PROMPT_TEMPLATE.md` ("Before you use the answer", step 4).

In an ask-only editor chat, attach `AGENTS.md` if the tool lets you, or say "Follow the rules in
AGENTS.md" at the start.

### 4.3 Chat model (kind C)

1. Start a new chat for each task.
2. Send one message: the whole of `docs/ai-context/CONTEXT_PACK.md`, the task block from
   `PROMPT_TEMPLATE.md` filled in, then only the files its "What to paste" table lists.
3. If it asks a question or lists **Needs**, answer it or take it to the owner. Don't let it
   invent a token, component or package.
4. Paste its complete files into the repo, then run `npm run format` and the four checks.
5. Go through "Before you use the answer" in `PROMPT_TEMPLATE.md`.
6. If it broke a rule, reply with the rule number and the line ("R10: `w-[347px]` on line 42") and
   ask for the complete file again.
7. For anything bigger than a small change, have an agent (kind A) review the diff before the PR.

## 5. Mixing tools

- **A chat model drafts, an agent reviews.** This works well when you can't use an agent for the
  whole task.
- **An agent and autocomplete on the same task** is fine, but the agent's checks only cover what it
  ran. Run them again after your own edits.
- **Never two agents in the same folder.** Each needs its own worktree.
- **The claim is yours** whichever tool made it, and it counts as your one claimed task.

## 6. What no AI tool may do

Whatever the kind, an AI tool never:

- edits `SPEC.md`. In Claude Code an edit asks you first: answer "no" unless the owner approved
  that exact change
- pushes a branch, merges, or deletes a branch. The only push an agent makes is a claim or release
  on `main`, when you ask for it
- edits `docs/BOARD.md` beyond that claim
- adds a dependency (`AGENTS.md` §4)
- changes files outside your task's Areas, or fixes a bug it noticed on the way
- changes wording, grade maths or stored data unless the task says so

If you find one of these in the diff, undo it before you commit, and tell the owner if it was a bug
fix or a `SPEC.md` change that should become a task.

## 7. Safety nets, and what they miss

| Net | Catches | Misses |
| --- | --- | --- |
| Your local checks | lint errors, formatting, build failures, failing tests | style rules lint doesn't know yet |
| CI on every PR (`.github/workflows/ci.yml`) | the same four checks, on a clean Linux machine with Node 22 | the same |
| Your review of the diff and the screens | changed behaviour or wording, files outside the Areas, the style rules | whatever you skip |
| The owner's review | what's left | |

The style rules are still checked by eye: tokens only, no arbitrary values, text roles, shadcn
instead of hand-built controls. Board task T-19 (proposed) would turn most of them into lint errors.

## 8. When it goes wrong

| Problem | What to do |
| --- | --- |
| The AI wrote TypeScript, used Radix, or used a colour that doesn't exist | It didn't get the rules. Kind C: check you pasted the whole pack. Kind A: check it read `AGENTS.md`. Kind B: open a correct file as a pattern |
| It used a component, function or prop you can't find | Ask where it's defined. If it can't show you the file, it doesn't exist |
| The agent changed files outside the Areas | Restore them (`git restore <path>`) and give it the Areas again |
| CI fails but the checks passed locally | Open the failing step's log on the PR. Usual causes: a file you forgot to commit, or a different Node version (CI uses 22) |
| It keeps breaking the same rule | Start a new session. Long chats drift away from the rules |
| It wants to change `SPEC.md`, add a package or fix a bug | Stop and ask the owner |

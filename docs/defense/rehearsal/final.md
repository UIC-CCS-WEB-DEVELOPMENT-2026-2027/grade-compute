# Rehearsal: final

- Last checked against: `5e64e03`
- Covers: `frontend/src/`, `frontend/vercel.json`, `.github/workflows/ci.yml`
- Date of the defense: _(owner fills in)_

## 1. What the final asks

From the CC013.23 documents (not in the repository; check against the syllabus):

- A **cloud demo**: the app deployed and working online.
- The **one-on-one code defense**: each student explains the code they submitted, line by line.

## 2. Where we stand (2026-11-28)

| Needed | Today | Board task |
| --- | --- | --- |
| Front end online | Vercel, Root Directory `frontend`, with the SPA rewrite ([vercel.json](../../../frontend/vercel.json)) | — |
| API online | **Not built** (Render, in Docker) | T-JM-8 |
| Database online | **Not built** (TiDB Cloud) | T-JM-8 |
| `/api` proxy, no caching of grade data | **Not built** | T-JM-8 |
| CI on every pull request | Yes ([ci.yml](../../../.github/workflows/ci.yml)) | — |
| Backups | **Not planned yet** | T-JM-26 |

## 3. The code defense

The whole guide is for this. For each member:

- [ ] The architecture trace, without notes ([architecture.md](../architecture.md) §3).
- [ ] The score-entry trace ([term-records.md](../features/term-records.md) §3).
- [ ] Every chapter you own: all of sections 3 to 6, and the self-check.
- [ ] Every file your own commits touched: `git log --author="<your name>" --name-only --format="" | sort -u`.
- [ ] Every AI-assisted change you committed ([ai-log.md](../ai-log.md)): explain it as if you wrote it by hand.

Likely questions in a code defense:

- "Why did you write it this way and not another way?" → each chapter's section 4
- "What happens if this input is empty / wrong / huge?" → section 6
- "Change this line: what breaks?" → the trace, plus the tests next to the file
- "Did you use AI for this? What did you change?" → [ai-log.md](../ai-log.md); answer honestly
- "Where is the test for this?" → section 2 lists them

## 4. Cloud demo script

Fill in once T-JM-8 is merged: the URL, the seed accounts on the hosted database, and the same
steps as the [prelim demo](prelim.md#3-demo-script-what-exists), on the deployed site.

## 5. Two weeks before

- [ ] Run `/defense-update defense final`.
- [ ] Fill in sections 2 and 4 with the merged deployment.
- [ ] Walk `docs/BEHAVIOUR_CHECKLIST.md` on the deployed site.
- [ ] Each member answers every self-check of their chapters out loud.

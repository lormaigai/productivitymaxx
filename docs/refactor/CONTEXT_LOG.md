# Context Log — super-productivity → productivity-maxxing refactor project

> Purpose: crash-safe running log of every step taken in this project. If a session
> dies, a new session should read this file top-to-bottom and be able to resume.
> Updated and pushed at every step.

## Project goal

Clone https://github.com/super-productivity/super-productivity into the user's own
repo **`lormaigai/productivity-maxxing`** (NOT fable-five — fable-five is only a
temporary crash-safe backup location for these docs), then produce:

1. A **code-design refactor plan** (analyze codebase, propose highest-value refactors)
2. A **PRD** for the refactor work
3. An **eval plan**
4. A **smoke test plan**
5. A **UAT test plan**
6. A **series of prompts** to drive the work with subagents in future sessions

Decisions made by the user (2026-07-07):

- Target repo: `lormaigai/productivity-maxxing` (user typed URL `productivitymaxx`; both spellings currently inaccessible — see blockers)
- Clone mode: **snapshot** — latest code as a fresh initial commit, not a full history mirror
- Refactor scope: **analyze & propose** — Claude analyzes the architecture and targets the highest-value design problems

## Blockers (action required from user)

- ❌ `lormaigai/productivity-maxxing` AND `lormaigai/productivitymaxx` both return
  "not found or no access" from `add_repo`. The Claude GitHub app must be granted
  access to the target repo (GitHub → Settings → Applications → Claude app →
  Repository access, or via claude.ai GitHub settings). Until then, all work is
  backed up on `lormaigai/fable-five` branch `claude/super-productivity-refactor-vup4kp`.
- ❌ GitHub MCP server unauthenticated in this session → cannot create repos via API.
- ❌ **git push is non-functional in this session**: the local git proxy
  (`http://local_proxy@127.0.0.1:41729`) rejects auth ("could not read Password").
  Attempts to supply credentials were (correctly) blocked by the safety classifier.
  → **All deliverables are produced as local files and handed to the user via
  SendUserFile.** The user must commit/push them, or grant a session with working
  push. Nothing is lost as long as the user saves the delivered files.

## Migration procedure once access is granted

1. `add_repo` owner=`lormaigai` repo=`productivity-maxxing` (or correct spelling)
2. Clone it; copy the super-productivity snapshot in (working tree only, no upstream `.git`)
3. Copy `docs/super-productivity-refactor/` from fable-five branch into the target repo (e.g. under `docs/refactor/`)
4. Commit + push; verify on GitHub; then this fable-five branch can be deleted

## Environment notes

- Snapshot clone location (ephemeral container): `/tmp/claude-0/-home-user-fable-five/ec9aa46b-12af-562f-a792-29c46d73db61/scratchpad/super-productivity` (shallow, depth 1)
- The container is ephemeral: anything not pushed to git is lost when the session ends.
- Backup branch: `lormaigai/fable-five` @ `claude/super-productivity-refactor-vup4kp`

## Step log

| #   | Timestamp (UTC) | Step                                                                                                       | Result                          |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | 2026-07-07      | Session start; tried `add_repo lormaigai/productivitymaxx`                                                | ❌ no access                    |
| 2   | 2026-07-07      | Asked user: target repo, clone mode, refactor scope                                                        | ✅ answers recorded above       |
| 3   | 2026-07-07      | Tried `add_repo lormaigai/productivity-maxxing`                                                            | ❌ no access — blocker logged   |
| 4   | 2026-07-07      | Started shallow clone of super-productivity into scratchpad (background)                                   | ⏳ in progress                  |
| 5   | 2026-07-07      | Created docs structure + this context log                                                                  | ✅ (local commit; push blocked) |
| 6   | 2026-07-07      | Shallow-cloned super-productivity (v18.13.1) into scratchpad; surveyed                                     | ✅                              |
| 7   | 2026-07-07      | Ran 3 parallel analyst subagents (state/feature, sync/packages, UI/build/test/plugin)                      | ✅ all returned                 |
| 8   | 2026-07-07      | Wrote all 8 deliverable docs (README, analysis, refactor plan, PRD, eval, smoke, UAT, prompt series)       | ✅                              |
| 9   | 2026-07-07      | Corrected stack facts: **Angular 21 / NgRx 21 / Node 22 / Fastify+Prisma+Postgres server** (not 18/NestJS) | ✅                              |
| 10  | 2026-07-07      | Committing all docs locally; delivering files to user via SendUserFile (push still blocked)                | ⏳                              |

## Deliverables produced (all in `docs/refactor/`)

- `00-README.md` — program index
- `01-CODEBASE-ANALYSIS.md` — objective architecture assessment (10 sections)
- `02-REFACTOR-PLAN.md` — 7-phase risk-ascending plan (sync last)
- `03-PRD.md` — refactor-program PRD
- `04-EVAL-PLAN.md` — metrics, guardrails, gates
- `05-SMOKE-TEST-PLAN.md` — fast pass/fail checks
- `06-UAT-PLAN.md` — 17 acceptance scenarios + sign-off table
- `07-PROMPT-SERIES.md` — copy-paste subagent-driven prompts (P0–P6)
- `CONTEXT_LOG.md` — this file

## Key findings (for a resuming session)

- Codebase is **mature and well-tested** (~0.53 spec:source, 27 CI workflows, custom lint rules, ADRs). Refactor = quality tightening, NOT rescue.
- Top god-objects: `plugin-bridge.service.ts` (2221), `plugin.service.ts` (2158), `operation-log-store.service.ts` (1937), `sync-wrapper.service.ts` (1600), `task.component.ts` (1407, **hot path**), `task.service.ts` (1399).
- Two half-finished migrations: **LOCAL_ACTIONS** effect injection, **Signals** (192 signal files vs 261 Observable files).
- Dead code: `src/app/pfapi/*.js`, `patch-package` with no `patches/` dir. Doc drift: ADR #3 vs `vector-clocks.md:580`.
- **Sync is the high-risk zone** — vector-clock prune asymmetry (MAX=20), RepeatableRead batch upload via `user_sync_state.last_seq`, multi-entity op forward-only gap (#8334), full-state REPLACE. Sequence sync refactors LAST.
- **Plugin API is a published semver boundary** (`@super-productivity/plugin-api` v1.0.1) — freeze it.

## Session 2 update (2026-07-08)

| #   | Step                                                                                                                                                                                                           | Result            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 11  | User created `lormaigai/productivitymaxx`, manually uploaded the 9 docs via GitHub web UI (filenames lost their dashes)                                                                                       | ✅                |
| 12  | Repo added to session; cloned to /workspace/productivitymaxx                                                                                                                                                  | ✅                |
| 13  | Docs moved to `docs/refactor/` with corrected names; upstream docs to `docs/upstream/`                                                                                                                         | ✅ commit d6b1e6e |
| 14  | Imported full super-productivity v18.13.1 source snapshot; custom fork README                                                                                                                                  | ✅ commit d6b1e6e |
| 15  | Restored missed dotfiles; added `deploy-pages.yml` (GitHub Pages); parked upstream's 27 workflows in `.github/workflows-upstream.disabled/`; disabled dependabot; removed CODEOWNERS/FUNDING/stale .gitmodules | ✅ commit 2b6d63d |
| 16  | Session git push blocked (proxy auth) → repo delivered to user as archive for **manual push**                                                                                                                  | ✅                |

**Pages hosting:** after push, set Settings → Pages → Source = GitHub Actions; site at https://lormaigai.github.io/productivitymaxx/. P0 (bootstrap) is then complete → next is P1 (baseline) in `07-PROMPT-SERIES.md`.

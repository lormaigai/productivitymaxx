# 05 — Smoke Test Plan

Fast pass/fail checks run after **every** refactor slice, before commit. Goal:
catch obvious breakage in minutes, not hours. If any step fails → do not commit
the slice; fix or revert.

## A. Static / build smoke (always, ~2–5 min)

| # | Check | Command | Pass criteria |
|---|-------|---------|---------------|
| A1 | Format + lint changed files | `npm run checkFile <each changed .ts/.scss>` | clean |
| A2 | Whole-repo lint | `npm run lint` | no new errors |
| A3 | Type-check / dev build | `npm run buildFrontend:dev` | compiles |
| A4 | Packages build (if `packages/*` touched) | `npm run build:packages` | all packages build |
| A5 | Touched unit specs | `npm run test:file <spec>` | green |

## B. Runtime app smoke (~5–10 min; after non-trivial slices)

Launch web dev (`ng serve`) or Electron (`npm start`) and verify the core loop:

| # | Scenario | Pass criteria |
|---|----------|---------------|
| B1 | App boots to Today view | no console errors, task list renders |
| B2 | Add a task via add-task-bar | task appears, persists on reload |
| B3 | Start/stop time tracking on a task | tracked time increments & saves |
| B4 | Create sub-task, reorder, complete | state consistent after reload |
| B5 | Schedule a task (dueDay / dueWithTime) | shows in Today / Planner correctly (Decision #1 & #2) |
| B6 | Mark task done → undo | undo restores prior state |
| B7 | Switch project / tag context | correct task set shown |
| B8 | Reload after each: state survives (offline-first) | no data loss |

## C. Sync smoke (ONLY if slice touches op-log / sync / packages)

| # | Scenario | Pass criteria |
|---|----------|---------------|
| C1 | Two clients, edit different tasks, sync | both converge, no loss |
| C2 | Two clients, edit SAME task, sync | deterministic conflict resolution (vector clock), no corruption |
| C3 | Offline edits then reconnect | queued ops apply in order, converge |
| C4 | Backup export → import | state replaced correctly (`SYNC_IMPORT`/`BACKUP_IMPORT` drop concurrent ops by design) |
| C5 | SuperSync/WebDAV dockerized E2E (targeted) | per `e2e/CLAUDE.md` — green |

> Sync smoke is mandatory and cannot be waived for any op-log change. A subtle
> sync bug silently corrupts data across devices.

## D. Plugin smoke (ONLY if slice touches `plugin-api` / `src/app/plugins`)

| # | Check | Pass criteria |
|---|-------|---------------|
| D1 | `packages/plugin-api/src/index.ts` export diff | no removed/renamed public exports (unless approved) |
| D2 | Example plugins in `packages/plugin-dev` build | build clean |
| D3 | Plugin loads in running app | plugin panel/hooks still function |

## E. Platform smoke (before a release tag)

| # | Check | Pass criteria |
|---|-------|---------------|
| E1 | Electron smoke (mirror `electron-smoke.yml`) | app packages & launches |
| E2 | Production web build | `npm run buildFrontend:prod:es6` succeeds, bundle within budget |

## Fast reference — the 60-second gate
```
npm run checkFile <changed files> && npm run lint && npm run buildFrontend:dev && npm run test:file <touched specs>
```
If that passes and the slice is non-sync/non-plugin/non-UI-critical, section B can be sampled (B1–B3) rather than run in full.

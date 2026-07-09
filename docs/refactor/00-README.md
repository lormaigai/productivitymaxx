# productivitymaxx — Refactor & Quality Program

> Fork of [super-productivity](https://github.com/super-productivity/super-productivity)
> (Angular 21 + NgRx 21 + Electron/Capacitor todo & time-tracking app).
> This `docs/` tree is the planning and governance layer for refactoring the fork.

## What this program produces

| #   | Document                                           | Purpose                                                           |
| --- | -------------------------------------------------- | ----------------------------------------------------------------- |
| 00  | **00-README.md** (this file)                       | Index + how to use the docs                                       |
| 01  | [CONTEXT_LOG.md](CONTEXT_LOG.md)                   | Crash-safe running log of every step. Read first if resuming.     |
| 02  | [01-CODEBASE-ANALYSIS.md](01-CODEBASE-ANALYSIS.md) | Objective architecture assessment (state, sync, UI, build, tests) |
| 03  | [02-REFACTOR-PLAN.md](02-REFACTOR-PLAN.md)         | Prioritized, phased refactor design with rationale & risk         |
| 04  | [03-PRD.md](03-PRD.md)                             | Product Requirements Doc for the refactor program                 |
| 05  | [04-EVAL-PLAN.md](04-EVAL-PLAN.md)                 | How we measure success (metrics, gates, before/after)             |
| 06  | [05-SMOKE-TEST-PLAN.md](05-SMOKE-TEST-PLAN.md)     | Fast pass/fail checks after each change                           |
| 07  | [06-UAT-PLAN.md](06-UAT-PLAN.md)                   | User-acceptance scenarios & sign-off criteria                     |
| 08  | [07-PROMPT-SERIES.md](07-PROMPT-SERIES.md)         | Copy-paste prompts to drive the work with subagents               |

## Guiding constraints (inherited from the upstream project)

These are non-negotiable and every refactor step must respect them (source: upstream `CLAUDE.md` + `ARCHITECTURE-DECISIONS.md`):

- **Privacy & offline-first** — no analytics/telemetry; core task+time tracking works fully offline.
- **Avoid feature creep** — refactors must not add product surface. This is a _quality_ program, not a feature program.
- **Sync is high-risk** — any change to the op-log / vector-clock / sync-server path can silently corrupt user data across devices. Sync changes get the strictest review and are sequenced last.
- **Task component is a hot path** — `src/app/features/tasks/task/task.component.*` renders once per task in long lists; guard performance.
- **Strict TypeScript, no `any`; never mutate NgRx state; prefer Signals to Observables.**
- **`npm run checkFile <path>`** (prettier + lint) on every changed `.ts`/`.scss` before "done".

## How to use this program

1. **Resuming a crashed session?** Read `CONTEXT_LOG.md` end-to-end first.
2. **Executing the refactor?** Work phase-by-phase from `02-REFACTOR-PLAN.md`, using the matching prompt in `07-PROMPT-SERIES.md`.
3. **Every change** must pass the gate defined in `04-EVAL-PLAN.md` and the checks in `05-SMOKE-TEST-PLAN.md` before it merges; UAT scenarios in `06-UAT-PLAN.md` run before a release tag.
4. **Update `CONTEXT_LOG.md` after every meaningful step** and commit. Treat it as the source of truth for "where are we".

## Repository facts (snapshot 2026-07-07, upstream v18.13.1)

- Angular `^21.2.17`, `@ngrx/store` `21.1.1`, Node `v22`.
- `src/`: ~1275 source `.ts` + ~678 `.spec.ts` (~53% spec ratio — strong baseline).
- `packages/` monorepo: `sync-core`, `sync-providers`, `super-sync-server`, `shared-schema`, `plugin-api`, `plugin-dev`, `vite-plugin`.
- 27 GitHub Actions workflows incl. `ci.yml`, `build.yml`, `e2e-scheduled.yml`, `electron-smoke.yml`, `supersync-server-tests.yml`, `plugin-tests.yml`, `codeql-analysis.yml`.
- E2E: Playwright (`e2e/`), plus dockerized SuperSync/WebDAV suites.

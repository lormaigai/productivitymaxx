# 01 — Codebase Analysis

> Objective architecture assessment of the super-productivity fork, based on a
> read-only analysis of the imported snapshot (upstream v18.13.1). Sources: three
> parallel analyst passes over state/feature, sync/packages, and UI/build/test/plugin
> layers, plus the repo's own `ARCHITECTURE-DECISIONS.md` and `CLAUDE.md`.

## 0. Headline

This is a **mature, well-tested, well-documented** codebase, not a rescue project.
It ships architecture-decision records, custom lint rules that enforce its NgRx
discipline, ~53% spec:source coverage, and 27 CI workflows. The refactor program
is therefore **quality tightening, not rescue**: reduce a handful of god-objects,
finish two in-flight migrations (LOCAL_ACTIONS, Signals), delete dead code, and
reconcile doc drift — all behavior-preserving, with the sync engine touched last
and most carefully.

## 1. Stack (corrected from snapshot)

- **Angular `^21.2.17`** (+ Material `^21.2.9`, CLI 21), **not** 18.
- **NgRx `21.1.1`**, RxJS `^7.8.2`, TypeScript `~5.9.3`, Node `v22`.
- **Electron `41.4.0`**, **Capacitor `^8.4.1`** (Android/iOS).
- Modern esbuild `@angular-devkit/build-angular:application` builder.
- Sync server: **Fastify 5 + Prisma 5.22 + PostgreSQL** (not NestJS).

## 2. Layer map

| Layer | Location | Size signal | Notes |
|-------|----------|-------------|-------|
| Shared UI (design system) | `src/app/ui/` | 248 files, 45 components | Formly family, dialogs, pickers, markdown; reusable |
| App-shell chrome | `src/app/core-ui/` | 58 files, 14 components | `magic-side-nav` (739 LOC), layout/theme; thin specs (10/14) |
| Features | `src/app/features/` | 1158 files, 44 modules | Bulk of app; per-feature NgRx `store/` |
| Route shells | `src/app/pages/` | 42 files, 13 components | Thin specs (5/13) |
| Global state | `src/app/root-store/` | meta-reducer pipeline | **Architectural centerpiece** (see §4) |
| Op-log host | `src/app/op-log/` | 13 subdirs, 71 files import sync-core | App-side sync wiring |
| Legacy persistence | `src/app/pfapi/` | 4 stale `.js`, referenced by 11 TS | **Decommission candidate** |
| Packages monorepo | `packages/` | 7 packages | Boundary-enforced (see §5) |
| Plugins | `src/app/plugins/` + `packages/plugin-api` | 101 files + published API | **Public semver boundary** |

## 3. Feature-layer hotspots (largest, most central)

Central features by LOC: **tasks** (77 files, 18.3k), **issue** integrations (122 files, 16.8k — Jira/GitHub/GitLab/Gitea/Redmine/Caldav/OpenProject), **schedule** (7.1k), **config** (5.6k), **task-repeat-cfg** (4.4k), **focus-mode** (3.8k), **metric** (3.6k), **planner** (3.1k).

**God-objects / oversized (refactor targets):**
| LOC | File | Kind |
|-----|------|------|
| 2221 | `src/app/plugins/plugin-bridge.service.ts` | god-service |
| 2158 | `src/app/plugins/plugin.service.ts` | god-service |
| 1937 | `src/app/op-log/persistence/operation-log-store.service.ts` | god-service (persistence+clock+merge) |
| 1600 | `src/app/imex/sync/sync-wrapper.service.ts` | god-service |
| 1586 | `src/app/op-log/validation/data-repair.ts` | large |
| 1407 | `src/app/features/tasks/task/task.component.ts` | oversized component **+ hot path** |
| 1399 | `src/app/features/tasks/task.service.ts` | god-service |
| 1242 | `.../file-based/file-based-sync-adapter.service.ts` | large |
| 1230 | `src/app/op-log/sync/conflict-resolution.service.ts` | large (sync, high-risk) |
| 1221 | `src/app/op-log/sync/operation-log-sync.service.ts` | large (sync) |

Largest components after `task.component.ts` (1407): `add-task-bar` 965, `dialog-edit-issue-provider` 852, `dialog-view-task-reminders` 821, `task-context-menu-inner` 817, `task-detail-panel` 802, `task-list` 760. The **task-editing cluster dominates** and overlaps the documented hot path.

## 4. NgRx topology (the centerpiece)

- `root-store/meta/meta-reducer-registry.ts` composes ~15 meta-reducers in a **strictly ordered** chain (file warns "ORDERING IS CRITICAL — DO NOT REORDER"): operation-capture → bulk-unwrap → undo-delete capture → task-shared CRUD/batch/lifecycle/scheduling/deadline → cross-entity (project/tag/section/planner/issue/repeat-cfg/short-syntax) → LWW-update → action-logger.
- `task-shared-meta-reducers/` (~6.5k LOC) holds cross-slice mutations *as meta-reducers by design* (Rule #3: multi-entity change = meta-reducer, not effect fan-out).
- **`LOCAL_ACTIONS` vs `Actions`** (`src/app/util/local-actions.token.ts`): effects should inject `LOCAL_ACTIONS` (filtered to `!isRemote`) so remote/sync-hydrated actions don't re-fire side effects. **Adoption is partial** → latent double-side-effect bug surface; completing it is a target.
- **Bulk-dispatch flush** (Rule #6): `await new Promise(r => setTimeout(r, 0))` after bulk loops; collapses N ops into one op-log entry.
- **Split task state smell**: mutation logic lives in *both* `task.reducer.ts` (767) and `task-shared-crud.reducer.ts` (867) — hard to trace one mutation.
- Custom lint rules enforce this discipline: `no-actions-in-effects`, `no-multi-entity-effect`, `require-entity-registry`, `require-hydration-guard` (`eslint-local-rules/`). **Any refactor must respect these.**

## 5. Sync / packages architecture

**Package boundaries are well kept** — a live scan for banned imports came back clean. `eslint.config.js` bans Angular/NgRx/`src/app`/shared-schema/deep-imports/**dynamic imports** from `sync-core`, and restricts `sync-providers` to public `sync-core` exports.

| Package | Purpose | Deps |
|---------|---------|------|
| `@sp/sync-core` | Framework-agnostic sync primitives (vector-clock, conflict resolution, import filter, replay) | **none** |
| `@sp/sync-providers` | Dropbox/WebDAV/OneDrive/SuperSync/LocalFile impls | public `@sp/sync-core` only |
| `@sp/shared-schema` | Zod HTTP contract types app↔server | none (SP-coupled) |
| `super-sync-server` | Fastify+Prisma+Postgres sync server; passkey/WebAuthn auth | sync-core + shared-schema |
| `@super-productivity/plugin-api` | Published plugin type defs (v1.0.1, 65+ exports) | none |
| `plugin-dev` | Example plugins (out of core scope) | — |
| `vite-plugin` | Build tooling | none |

**Sync path (client→server):** local action → `operation-log.effects.ts` increments global vector clock, writes op+clock atomically to IndexedDB (`operation-log-store.service.ts`, no client pruning) → upload → server `sync.service.ts` caps clock at 50 (DoS), `conflict.ts detectConflict()` compares full clock, prunes to MAX **after** acceptance, stores. Client-side conflict resolution via `conflict-resolution.service.ts` (LWW), capped at 3 attempts.

**HIGH-RISK zones (data-corruption potential — sequence last, strictest review):**
1. **`MAX_VECTOR_CLOCK_SIZE=20` prune asymmetry** — server prunes after compare, client never during resolution. Wrong order → false CONCURRENT loops or silent loss.
2. **RepeatableRead batch upload** (Decision #4) — safety rides on the single `user_sync_state.last_seq` row lock, not PG snapshot isolation.
3. **Multi-entity op forward-only gap** (issue #8334) — pre-migration batch-op entities 2..n unrecoverable; `entity_id===entityIds[0]` not server-enforced.
4. **Full-state clock REPLACE** (`SYNC_IMPORT`/`BACKUP_IMPORT`) — drops concurrent ops by design (Rule #7).

**Doc drift (cheap fix):** ARCH Decision #3 + `package-boundaries.md` still claim `shared-schema` re-exports vector-clock from sync-core, but `vector-clocks.md:580` says removed and `shared-schema/src/index.ts` has no such export. Reconcile.

## 6. UI / reactivity state

- **Standalone-first**: only 5 `@NgModule`s remain. 90 components explicitly `standalone: true`.
- **Signals migration mid-flight**: 192 files use signals/computed/input/output; 261 still use Observable/BehaviorSubject/Subject. Expect both idioms; migration is a legitimate (careful) target.
- **Angular Material broad surface**: 358 files import it — version-migration risk is wide.
- **Hot path**: `task.component.ts` is largest component *and* rendered per-task in long lists — decomposition is high-value but must be perf-validated (CLAUDE.md rule).

## 7. Build / tooling

- Heavy `prebuild`: `env → git-version → build:packages`; `prepare`/postinstall runs husky + `ts-patch install` + 4 package builds. Cold builds are slow (multi-package + ts-patch).
- ~120 npm scripts; multi-timezone unit runs; shardable tests.
- **Dead config**: `patch-package` runs on postinstall but **no `patches/` dir exists** → no-op to clean up.

## 8. Testing

- Unit: Jasmine 6 + Karma; **678 specs / 1275 source (~0.53)**; multi-TZ + shard support.
- E2E: Playwright (`e2e/`, ~195 test files, POM structure); SuperSync/WebDAV via docker-compose (tag-gated `@supersync`/`@webdav`).
- **Best-covered where it matters most**: op-log/sync invariant specs are the largest files in the tree (`conflict-resolution.service.spec.ts` 4096 LOC). This **lowers sync-refactor risk if tests are respected as the spec.**
- **Weakest coverage**: `core-ui` (10/14), `pages` (5/13); features with 0 specs: `note`, `user-profile`, `shepherd`, `right-panel`, `before-finish-day`; `schedule` thin relative to size; hot-path components lack component specs.

## 9. Plugin system (frozen public boundary)

- `packages/plugin-api` is **published as `@super-productivity/plugin-api` v1.0.1** — `types.ts` alone has 65+ exports; **breaking it breaks third-party plugins.**
- Runtime (`src/app/plugins/`, 101 files, 38 specs, iframe-sandboxed) *can* be refactored relatively safely; the **published type/mapper contract must be treated as frozen** (deliberate semver bumps only).

## 10. Refactor candidate ranking (impact × reach ÷ risk)

1. **Delete dead code / reconcile docs** (pfapi `.js`, empty patch-package, Decision #3 drift) — high value, ~zero risk. **Do first.**
2. **Decompose feature god-objects** — `task.service.ts` (1399), consolidate dual task reducers (767+867). High reach, medium risk, well-tested.
3. **Decompose `task.component.ts`** (1407, hot path) — high value, **perf-gated**.
4. **Finish `LOCAL_ACTIONS` migration** — removes a latent sync double-effect class, lint-supportable. Medium risk.
5. **Extract shared selectors** (only 15 `.selectors.ts` for 44 features) — reduces re-derivation.
6. **Decompose plugin god-services** (`plugin-bridge` 2221, `plugin.service` 2158) — internal only; keep published API frozen.
7. **Backfill tests** for `note`, `schedule`, hot-path components.
8. **Signals migration** (261 → fewer Observable holdouts) — incremental, per-component.
9. **Sync-engine god-object decomposition** (`operation-log-store.service.ts` 1937, `conflict-resolution.service.ts` 1230) — **highest risk, sequence LAST**, behind full sync E2E.

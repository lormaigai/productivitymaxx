# 02 — Refactor Plan

> Phased, prioritized, behavior-preserving refactor of the super-productivity fork.
> Every phase respects the inherited constraints (privacy/offline-first, no feature
> creep, sync-safety, hot-path perf) and the repo's custom lint rules. Ordering is
> **risk-ascending**: dead code first, sync engine last.

## Context — why this program exists

The fork inherits a mature Angular 21 + NgRx codebase (see `01-CODEBASE-ANALYSIS.md`).
It is healthy but carries the usual entropy of a long-lived app: a few
god-objects (>1.4k-LOC services/components), two migrations left half-finished
(`LOCAL_ACTIONS` effect injection, Signals adoption), some dead code
(`pfapi/*.js`, empty `patch-package`), and minor documentation drift in the sync
package boundary. The goal is to **reduce cognitive load and change-risk without
altering observable behavior** — making the codebase cheaper and safer to evolve.
Explicit non-goal: adding product features or surface (the manifesto forbids
feature creep).

## Guardrails (apply to every phase)
- No product-surface change; behavior-preserving only.
- Respect custom lint rules (`no-actions-in-effects`, `no-multi-entity-effect`, `require-entity-registry`, `require-hydration-guard`) and the meta-reducer ordering invariant.
- `npm run checkFile` on every changed file; keep/extend tests; no `any`; immutable NgRx state; prefer Signals.
- Each slice passes the doc-05 smoke gate and doc-04 eval gate before merge.
- **Reuse-first**: extend existing utilities/patterns before adding new ones.

---

## Phase 0 — Zero-risk cleanup & doc truth  *(do first)*
**Goal:** remove noise so later phases read clean; establish the eval baseline.

| Slice | Scope | Files | Risk |
|-------|-------|-------|------|
| 0.1 | Decommission legacy pfapi | `src/app/pfapi/*.js` + the 11 TS referencers — confirm truly unused, delete or inline | Low |
| 0.2 | Remove dead `patch-package` | `package.json` postinstall (no `patches/` dir exists) | Low |
| 0.3 | Reconcile sync-boundary docs | `ARCHITECTURE-DECISIONS.md` #3, `docs/sync-and-op-log/package-boundaries.md` vs `vector-clocks.md:580` and `shared-schema/src/index.ts` (no re-export) | Low |
| 0.4 | Record eval baseline | Fill `04-EVAL-PLAN.md` "Baseline (measured)" (bundle, build time, `any` count, effects-on-Actions count) | Low |

**Gate:** lint + dev build + full unit suite green; no behavior change.

---

## Phase 1 — Feature-layer god-object decomposition
**Goal:** split the two clearest feature-layer god-objects; consolidate the dual task reducer. Highest reach, well-tested, medium risk.

| Slice | Scope | Approach (reuse-first) | Risk |
|-------|-------|------------------------|------|
| 1.1 | Split `task.service.ts` (1399) | Extract cohesive responsibilities into collaborator services (e.g. scheduling, sub-task ops, issue-link ops) behind the same public methods; `TaskService` becomes a thin facade. No API change for callers. | Med |
| 1.2 | Consolidate dual task reducer | `task.reducer.ts` (767) + `task-shared-crud.reducer.ts` (867): document the boundary explicitly, move any misplaced single-entity logic to the feature reducer and keep cross-entity in the meta-reducer (Rule #3). Do **not** merge across the local/meta boundary — clarify it. | Med |
| 1.3 | Extract shared selectors | Create/extend `*.selectors.ts` where components inline `store.select`; only 15 selector files for 44 features. Memoized, reused. | Low-Med |

**Gate:** full unit suite green; targeted E2E (task CRUD, scheduling); smoke B1–B8; no bundle regression.

---

## Phase 2 — Hot-path component decomposition  *(perf-gated)*
**Goal:** shrink `task.component.ts` (1407, rendered per-task) without regressing render cost.

| Slice | Scope | Approach | Risk |
|-------|-------|----------|------|
| 2.1 | Extract presentational sub-components | Pull self-contained blocks (e.g. progress/estimate, tag chips, context-menu trigger) into `OnPush` child components with signal inputs; keep template free of function/getter calls. | Med-High (perf) |
| 2.2 | Move logic to signals/computed | Replace remaining template method calls with `computed()`; ensure `takeUntilDestroyed()` on any subscriptions. | Med |
| 2.3 | Add component spec + perf check | Backfill `task.component.spec.ts`; verify against a 200+ task list (doc-06 U15). | Med |

**Gate:** **large-list perf must not regress** (record before/after); component + E2E green.

---

## Phase 3 — Finish the LOCAL_ACTIONS migration
**Goal:** eliminate the latent sync double-side-effect class by ensuring effects inject `LOCAL_ACTIONS`, not raw `Actions`.

| Slice | Scope | Approach | Risk |
|-------|-------|----------|------|
| 3.1 | Audit + inventory | `grep -rln 'inject(Actions)' src/app`; classify each as legitimate (op-log capture, archive handler) vs. should-migrate. Record count in eval. | Low |
| 3.2 | Migrate effects | Switch should-migrate effects to `LOCAL_ACTIONS`; add regression tests that a remote/`isRemote` action does not re-fire the effect. | Med |
| 3.3 | Consider strengthening lint | Evaluate extending `no-actions-in-effects` to cover the remaining legitimate exceptions via allowlist. | Low |

**Gate:** unit + sync-relevant E2E green; each migrated effect has a remote-action non-refire test.

---

## Phase 4 — Plugin internals decomposition  *(public API frozen)*
**Goal:** decompose `plugin-bridge.service.ts` (2221) and `plugin.service.ts` (2158) internally, with the published `@super-productivity/plugin-api` contract untouched.

| Slice | Scope | Approach | Risk |
|-------|-------|----------|------|
| 4.1 | Freeze-check the API | Snapshot `packages/plugin-api/src/index.ts` + `types.ts` exports; add a CI diff guard. | Low |
| 4.2 | Split bridges | Extract per-domain bridges (add-task, counter, work-context already exist as pattern) so `plugin-bridge.service` becomes a router. Internal only. | Med |
| 4.3 | Verify example plugins | `packages/plugin-dev` examples build & load; mirror `plugin-tests.yml`. | Med |

**Gate:** plugin smoke (doc-05 §D); **zero public-API change** (or STOP + ask owner).

---

## Phase 5 — Test backfill & Signals migration  *(incremental, ongoing)*
**Goal:** raise coverage where weakest and reduce Observable holdouts.

| Slice | Scope | Approach | Risk |
|-------|-------|----------|------|
| 5.1 | Backfill specs | `note`, `schedule`, `core-ui`, `pages`, hot-path components. | Low |
| 5.2 | Signals migration | Per-component convert BehaviorSubject/Observable → signals where safe; do not touch sync streams. Incremental, one component per slice. | Low-Med |

**Gate:** spec:source ratio ↑; no behavior change.

---

## Phase 6 — Sync-engine god-object decomposition  *(LAST, highest risk)*
**Goal:** decompose the two app-side sync god-objects **only after** everything else is stable, behind the full sync E2E suite.

| Slice | Scope | Approach | Risk |
|-------|-------|----------|------|
| 6.1 | Decompose `operation-log-store.service.ts` (1937) | Separate persistence (IndexedDB) from clock management from merge orchestration into collaborators; keep `appendWithVectorClockUpdate` atomicity intact. | **HIGH** |
| 6.2 | Decompose `conflict-resolution.service.ts` (1230) | Extract LWW resolution, superseded-op handling, and rejected-ops retry into named collaborators; preserve exact resolution semantics and the 3-attempt cap. | **HIGH** |

**Hard constraints for Phase 6:**
- Do **not** alter vector-clock prune order/asymmetry, `MAX_VECTOR_CLOCK_SIZE=20`, the `user_sync_state.last_seq` serialization, or full-state REPLACE semantics.
- The existing invariant-heavy specs (`conflict-resolution.service.spec.ts` 4096 LOC, integration specs) are the **spec of record** — they must stay green unchanged.
- Mandatory full SuperSync + WebDAV dockerized E2E (doc-05 §C, `e2e-scheduled.yml`) + doc-06 U12/U13 before merge.
- Reason explicitly about replay determinism, concurrent/remote edits, and vector-clock conflicts in the PR.

---

## Sequencing summary
```
Phase 0  cleanup + baseline        (zero risk)
Phase 1  feature god-objects       (medium)
Phase 2  hot-path component        (perf-gated)
Phase 3  LOCAL_ACTIONS finish      (medium)
Phase 4  plugin internals          (API frozen)
Phase 5  tests + signals           (incremental)
Phase 6  sync engine               (HIGH — last, full E2E)
```
Each phase item maps to prompt **P4** in `07-PROMPT-SERIES.md`. Do not start Phase 6 until Phases 0–5 are merged and a release candidate has passed UAT.

## Verification (how to prove the plan works, end-to-end)
- **Per slice:** doc-05 smoke gate + doc-04 target/guardrail metrics + `/code-review` at high effort.
- **Per phase:** full unit suite + targeted E2E; for sync/plugin phases, the dockerized/plugin suites.
- **Release candidate:** full unit + full Playwright E2E + SuperSync/WebDAV E2E + Electron smoke + all doc-06 UAT scenarios, with a before/after eval table showing net quality improvement and no guardrail regression.

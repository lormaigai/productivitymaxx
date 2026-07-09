# 03 — Product Requirements Document (Refactor Program)

**Product:** `lormaigai/productivity-maxxing` — a fork of super-productivity
(Angular 21 + NgRx 21 + Electron/Capacitor todo & time-tracking app).
**Document type:** PRD for an internal **code-quality / refactor** program (not a
feature program).
**Owner:** leahganon10@gmail.com · **Date:** 2026-07-07 · **Status:** Draft v1.

---

## 1. Problem statement
The fork inherits a mature but entropy-laden codebase: a handful of >1.4k-LOC
god-objects, two half-finished migrations (LOCAL_ACTIONS effect injection,
Signals adoption), dead code, and minor sync-doc drift. This raises the cost and
risk of every future change and makes onboarding slow. We want to **lower
change-risk and cognitive load without changing what the app does**.

## 2. Goals
- **G1** Reduce the largest-file LOC and eliminate the top feature/plugin/sync god-objects (measurable: no non-generated file > ~800 LOC target where feasible).
- **G2** Finish the LOCAL_ACTIONS migration → remove a latent cross-device double-side-effect class.
- **G3** Delete dead code (`pfapi/*.js`, empty `patch-package`) and reconcile sync-boundary docs with reality.
- **G4** Raise test coverage where weakest (`note`, `schedule`, `core-ui`, `pages`, hot-path components) and advance the Signals migration.
- **G5** Preserve behavior exactly: zero regressions, zero data-loss/sync-corruption, no perceptible hot-path perf regression, no plugin-API break.

## 3. Non-goals
- **NG1** No new product features, settings, UI surface, or sync formats (manifesto: avoid feature creep; this is quality-only).
- **NG2** No Angular/NgRx **major** version bump within this program (separate effort).
- **NG3** No change to the published `@super-productivity/plugin-api` contract.
- **NG4** No change to sync semantics (vector-clock rules, prune order, `last_seq` serialization, full-state REPLACE).

## 4. Users & stakeholders
- **Primary user of the *app*:** the deep-work solo user (offline-first, privacy-conscious) — must see no behavior change.
- **Primary user of the *refactor*:** contributors/maintainers of the fork — benefit from lower change-risk.
- **Stakeholder/owner:** leahganon10@gmail.com — approves scope changes, plugin-API changes, and release tags.

## 5. Requirements

### Functional (of the program)
- **FR1** Every change is behavior-preserving and passes the doc-05 smoke gate + doc-04 eval gate before merge.
- **FR2** Work proceeds in the risk-ascending phase order of `02-REFACTOR-PLAN.md` (cleanup → feature → hot-path → LOCAL_ACTIONS → plugins → tests/signals → **sync last**).
- **FR3** Sync-touching changes carry an explicit replay-determinism / concurrent-edit / vector-clock analysis and pass the full SuperSync + WebDAV E2E.
- **FR4** Plugin-touching changes carry a public-API diff proving no breaking change (or STOP + owner approval).
- **FR5** `CONTEXT_LOG.md` is updated and committed at the end of every slice (crash-safety requirement).

### Non-functional
- **NFR1 Privacy/offline-first preserved** — no analytics/telemetry introduced; core task+time tracking works fully offline; never log user content.
- **NFR2 Performance** — production bundle ≤ +2% cumulative vs. baseline (ideally ↓); no perceptible large-list (hot-path) regression.
- **NFR3 Compatibility** — existing user data, backups, and synced clients remain fully compatible (no data migration required by a refactor).
- **NFR4 Maintainability** — target metrics in doc-04 trend the right way; custom lint rules stay green.

## 6. Constraints & dependencies
- **Toolchain:** Angular 21, NgRx 21, Node 22, TypeScript 5.9, Fastify/Prisma/Postgres sync server; heavy multi-package prebuild + ts-patch.
- **Governance:** custom ESLint local rules + meta-reducer ordering invariant are hard constraints.
- **External dependency:** the Claude GitHub app must have write access to `lormaigai/productivity-maxxing` for the bootstrap (see `CONTEXT_LOG.md` blockers).
- **CI:** 27 workflows exist; `ci.yml`, `e2e-scheduled.yml`, `plugin-tests.yml`, `supersync-server-tests.yml`, `electron-smoke.yml` are the relevant gates.

## 7. Success metrics (see doc-04 for full definitions)
| Metric | Baseline (2026-07-07) | Target |
|--------|-----------------------|--------|
| Largest non-generated file LOC | 2221 (`plugin-bridge.service.ts`) | ≤ ~800 where feasible; top-10 all ↓ |
| Effects injecting raw `Actions` | TBD (P1) | → only the sanctioned exceptions |
| TODO/FIXME/HACK/XXX (src/app) | 229 | ↓ |
| `any` occurrences | TBD (P1) | ↓ |
| Spec:source ratio | ~0.53 | ↑ |
| Dead-code items (pfapi, patch-package) | 2 | 0 |
| Sync-doc drift items | ≥1 (Decision #3) | 0 |
| Regressions / data-loss incidents | — | **0** (hard blocker) |
| Bundle size Δ | 0% | ≤ +2% cumulative |

## 8. Milestones
- **M0** Bootstrap fork + import snapshot + docs, baseline recorded (Phase 0 + P0/P1).
- **M1** Feature god-objects decomposed (Phase 1) → RC1 candidate.
- **M2** Hot-path + LOCAL_ACTIONS done (Phases 2–3) → RC2.
- **M3** Plugin internals + tests/signals (Phases 4–5) → RC3.
- **M4** Sync-engine decomposition (Phase 6), full E2E + UAT → 1.0-refactor release.

## 9. Risks & mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Sync change silently corrupts data across devices | Critical | Sequence sync last; full E2E + invariant specs as spec-of-record; explicit correctness analysis; owner review |
| Hot-path decomposition regresses list perf | High | Perf-gate Phase 2 against 200+ task list; before/after measurement |
| Plugin-API accidentally broken | High | CI export-diff guard; STOP+approve on any change |
| Scope creep into features | Med | NG1 enforced in every review; manifesto scope guard |
| Session/container loss mid-work | Med | `CONTEXT_LOG.md` committed every slice; crash-safe by design |
| GitHub access not granted to target repo | Blocker | Documented in `CONTEXT_LOG.md`; owner grants app write access |

## 10. Open questions
- Final target LOC ceiling per file (soft ~800?) — owner to confirm.
- Whether to also stand up the sync server locally for full E2E, or rely on `e2e-scheduled.yml` dispatch (recommended).
- Whether a Signals-migration sweep is in-scope now or deferred to a follow-up program.

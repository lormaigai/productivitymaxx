# 04 — Evaluation Plan

How we decide a refactor slice (or the whole program) **succeeded**. Refactoring
is behavior-preserving by definition, so the eval is dominated by *regression
absence* + *internal-quality deltas*, not new-feature acceptance.

## Success definition

A slice passes iff **all** of:
1. **No behavior regression** — full unit suite + targeted E2E green; smoke test (doc 05) green.
2. **No product-surface change** — no new settings/UI/sync-format unless the plan explicitly authorized it.
3. **Sync safety** (only if the slice touches op-log/sync) — replay-determinism + concurrent-edit + vector-clock reasoning documented and sync E2E green.
4. **Quality moved the right way** — at least one target metric improved and none of the guardrail metrics regressed beyond tolerance.

## Metrics

### Guardrail metrics (must NOT regress beyond tolerance)
| Metric | How measured | Tolerance |
|--------|--------------|-----------|
| Unit test pass rate | `npm test` | 100% (no new failures) |
| E2E pass rate (touched areas) | `npm run e2e:file …` | 100% |
| Production bundle size | `npm run buildFrontend:prod:es6` output | ≤ +0.5% per slice |
| Cold build time | time of prod build | ≤ +5% |
| `task.component` render cost | manual large-list check (CLAUDE.md hot-path rule) | no visible regression |
| Plugin API surface | diff of `packages/plugin-api/src/index.ts` exports | no breaking change without approval |

### Target metrics (a slice should improve ≥1)
| Metric | How measured | Direction |
|--------|--------------|-----------|
| Largest-file LOC (god-objects) | `find src -name '*.ts' -not -name '*.spec.ts' \| xargs wc -l \| sort -rn` | ↓ |
| `any` occurrences | `grep -rn ': any\b\|<any>\|as any' src/app \| wc -l` | ↓ |
| TODO/FIXME/HACK/XXX density | `grep -rnE 'TODO\|FIXME\|HACK\|XXX' src/app \| wc -l` | ↓ |
| Effects still injecting raw `Actions` | `grep -rln 'inject(Actions)' src/app \| wc -l` (LOCAL_ACTIONS migration) | ↓ |
| Spec:source ratio | `specs ÷ non-spec .ts` | ↑ or flat |
| Duplicated selector logic | count of inlined store selects in components | ↓ |
| Lint warnings | `npm run lint` warning count | ↓ or flat |

## Baseline (measured)

> Fill via prompt **P1**. Placeholders below; replace with real numbers on import.

| Metric | Baseline value | Date |
|--------|----------------|------|
| Source `.ts` (non-spec) | 1275 | 2026-07-07 |
| Spec files | 678 | 2026-07-07 |
| Spec:source ratio | ~0.53 | 2026-07-07 |
| TODO/FIXME/HACK/XXX (src/app) | 229 | 2026-07-07 (agent) |
| Largest non-generated file | `plugin-bridge.service.ts` 2221 LOC | 2026-07-07 |
| Bundle size (prod) | _TBD (P1)_ | |
| Cold build time | _TBD (P1)_ | |
| `any` occurrences | _TBD (P1)_ | |
| Effects on raw `Actions` | _TBD (P1)_ | |
| Unit suite pass/duration | _TBD (P1)_ | |

## Per-slice eval record (template — copy into CONTEXT_LOG per slice)

```
### Eval: <PHASE-ID slice title>  (<date>)
Target metric(s):   <name>  before <x> → after <y>
Guardrails:         tests <pass/total>, bundle Δ <%>, build Δ <%>
Sync safety:        <n/a | reasoning + E2E result>
Code review:        <findings fixed>
Verdict:            PASS / FAIL
```

## Program-level gate (before any release tag)
- Full unit suite green; full Playwright E2E green; SuperSync + WebDAV dockerized E2E green.
- Bundle size delta vs. program baseline within budget (≤ +2% cumulative, ideally ↓).
- All UAT scenarios (doc 06) signed off.
- Before/after target-metric table shows net improvement.

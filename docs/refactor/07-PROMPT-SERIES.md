# 07 — Prompt Series (subagent-driven execution)

Copy-paste prompts to drive the refactor across sessions. Each is self-contained
so a fresh session (or a crashed-and-resumed one) can run it. They assume the
repo is `lormaigai/productivity-maxxing` and this `docs/refactor/` tree exists.

**Conventions used below**
- Slash commands in brackets (e.g. `[/research]`, `[/god-mode]`, `[/focus]`,
  `[/data:analyze]`, `[/code-review]`, `[/context]`, `[/cowork-plugin-customizer]`)
  are the workflow "modes" you asked for. If a command isn't installed in the
  session, ignore the bracket and run the prompt body directly.
- "Fan out N subagents" = launch N `general-purpose` (or `Explore`) agents in
  parallel, one per bullet, then synthesize. Use `Explore` for read-only search,
  `general-purpose` for analysis+edits, `Plan` for design.
- **Always** end a work prompt with: update `CONTEXT_LOG.md`, run the smoke test,
  commit, push.

---

## P0 — Bootstrap the repo (run once)

> `[/context]` Set up the productivity-maxxing fork.
> 1. Confirm the Claude GitHub app has write access to `lormaigai/productivity-maxxing`; if `add_repo` fails, stop and tell me to grant access.
> 2. Snapshot-import the latest super-productivity source (working tree only, no upstream `.git`) as the initial commit on `main`.
> 3. Copy this `docs/refactor/` tree in. Commit `chore: import upstream snapshot + refactor program docs`. Push.
> 4. Verify `npm ci` succeeds and `npm run lint` runs. Record results in `CONTEXT_LOG.md`.

---

## P1 — Establish the baseline & eval harness

> `[/data:analyze]` Establish the quantitative baseline defined in `04-EVAL-PLAN.md`.
> Fan out 3 subagents in parallel to collect: (a) build time + bundle size (`npm run buildFrontend:prod:es6`), (b) unit-test count/pass/duration + coverage if available, (c) lint warning count, `any`-usage count, cyclomatic hotspots (10 largest non-spec `.ts` by LOC), TODO/FIXME density.
> Write the numbers into `04-EVAL-PLAN.md` under "Baseline (measured)". Commit `docs(eval): record measured baseline`. Update `CONTEXT_LOG.md`. Push.

---

## P2 — Deep architecture analysis (feeds the refactor plan)

> `[/research]` Produce/refresh `01-CODEBASE-ANALYSIS.md`.
> Fan out 3 `Explore` subagents in parallel over the clone:
> 1. State/feature layer — `src/app/features/`, `src/app/root-store/`, meta-reducers, effects, selectors; largest files; god-objects; coupling.
> 2. Sync/packages — `packages/*` + `src/app/op-log` + `src/app/pfapi`; boundary violations; vector-clock/conflict/batch-upload risk.
> 3. UI/build/test/plugins — `src/app/ui|core-ui|pages|plugins`, build config, Playwright/Karma, CI, plugin API surface.
> Synthesize into `01-CODEBASE-ANALYSIS.md` with real paths + line counts. Rank refactor candidates by (impact × reach) ÷ risk. Commit `docs(analysis): refresh architecture assessment`. Update `CONTEXT_LOG.md`. Push.

---

## P3 — Refactor design review

> `[/god-mode]` Using `01-CODEBASE-ANALYSIS.md`, produce/validate `02-REFACTOR-PLAN.md`.
> Launch 1 `Plan` subagent per candidate cluster to design the change: scope, exact files, the reuse-first approach (name existing utilities to extend), migration/back-compat, sync-safety analysis, rollback, and the smoke+eval gate it must pass.
> Only include recommended approaches, phased low-risk → high-risk (sync last). Commit `docs(plan): finalize phased refactor plan`. Update `CONTEXT_LOG.md`. Push.

---

## P4..Pn — Execute one refactor slice (repeat per phase item)

> `[/focus]` Execute refactor slice **<PHASE-ID: short title>** from `02-REFACTOR-PLAN.md`.
> Preconditions: read the slice's section + the referenced upstream `ARCHITECTURE-DECISIONS.md` entry + relevant `docs/sync-and-op-log/` docs. Confirm no product-surface change (this is quality-only).
> Steps:
> 1. Implement the smallest change that achieves the slice. Reuse existing utilities; do not introduce `any`; keep NgRx state immutable; prefer Signals.
> 2. `npm run checkFile <each changed file>`; add/adjust unit tests; `npm run test:file` for touched specs.
> 3. Run `05-SMOKE-TEST-PLAN.md` fast checks. If the slice touches sync/op-log, additionally run the sync E2E per `e2e/CLAUDE.md` and write the sync-safety note.
> 4. Re-measure the eval metrics this slice targets (`04-EVAL-PLAN.md`); record before/after.
> 5. `[/code-review]` on the diff at effort=high; fix findings.
> 6. Update `CONTEXT_LOG.md` (what changed, metrics, residual risk). Commit `refactor(<scope>): <slice>`. Push. Open/refresh the PR only if I asked for one.

---

## P5 — Plugin API compatibility guard (run when a slice touches plugins)

> `[/cowork-plugin-customizer]` Verify the change to `packages/plugin-api` / `src/app/plugins` preserves the public plugin contract.
> Diff the plugin API surface (exports in `packages/plugin-api/src/index.ts`) before/after; run `plugin-tests` workflow equivalents locally; confirm `packages/plugin-dev` example plugins still build. If the contract changes, STOP and ask me — plugin API is a hard-to-reverse public boundary. Record in `CONTEXT_LOG.md`.

---

## P6 — Release candidate: full eval + UAT

> `[/data:analyze]` Run the full `04-EVAL-PLAN.md` gate and the `06-UAT-PLAN.md` scenarios for a release candidate.
> Fan out subagents for: full unit suite, full Playwright E2E, SuperSync + WebDAV dockerized E2E, production build + bundle-size delta vs baseline, `electron-smoke` equivalent. Fill the UAT sign-off table. If all green, tag `rc-<n>` and summarize the before/after eval table. Update `CONTEXT_LOG.md`. Push.

---

## Standing rules for every prompt above

- If a sync/op-log/vector-clock change is involved, treat it as **high-risk**: replay determinism, concurrent/remote edits, and vector-clock conflicts must be reasoned about explicitly before "done".
- Never log user content (`Log.log({ id })`, not `Log.log(task)`).
- Edit only `en.json` for strings.
- Update + commit `CONTEXT_LOG.md` at the end of every prompt so a crash never loses more than one slice of progress.
- Shift model/mode as needed (e.g. `[/god-mode]` for design, plain execution for edits); the bracketed commands are optional accelerators, not requirements.

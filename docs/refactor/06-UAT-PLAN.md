# 06 — User Acceptance Test (UAT) Plan

UAT validates the refactored app still does what **users** expect, exercised the
way a real user would (not unit-level). Because the program is behavior-preserving,
UAT is the same before/after — a refactor is accepted only if every scenario still
passes with identical observable behavior. Run before any release tag.

## Personas & environment
- **Deep-work solo user** (primary persona per manifesto) — offline-first, privacy-conscious.
- Platforms to cover before release: **Web (ng serve/prod)**, **Electron desktop**, and at least a **smoke on Android** (Capacitor) if the slice touched platform bridges.
- Data: use a seeded backup with ~200 tasks across ≥3 projects and ≥5 tags to exercise the hot-path task list at realistic scale.

## Sign-off table (fill per release candidate)

| ID | Scenario | Steps (abbrev) | Expected | Result | Notes |
|----|----------|----------------|----------|--------|-------|
| U1 | First-run / boot | Fresh profile → app opens | Lands on Today, no errors, onboarding intact | | |
| U2 | Capture a task | Add via add-task-bar incl. short-syntax (`#tag @project`) | Task created with parsed tag/project | | |
| U3 | Plan the day | Drag tasks into Today / Planner; set dueDay & dueWithTime | Scheduling matches Decision #1 (mutual exclusivity) & #2 (TODAY virtual tag) | | |
| U4 | Time tracking | Start/stop tracking; take-a-break; focus mode session | Time accrues correctly; focus/pomodoro state machine works | | |
| U5 | Sub-tasks & reorder | Create sub-tasks, reorder, complete parent | Consistent ordering & completion; survives reload | | |
| U6 | Complete & undo | Complete task, undo; complete project, reopen | Undo restores; project complete/reopen per Decision #5 | | |
| U7 | Repeating tasks | Create a repeat cfg; advance a day | Recurring instance generated correctly | | |
| U8 | Issue integration | Configure a provider (e.g. GitHub) read-only; import an issue | Issue task imported; two-way behavior intact | | |
| U9 | Metrics & boards | Open metrics, boards, schedule views | Charts/boards render with seeded data | | |
| U10 | Config round-trip | Change project/global config; reload | Settings persist | | |
| U11 | Backup export/import | Export backup, wipe, import | State fully restored (offline-first) | | |
| U12 | Sync convergence | Two clients (SuperSync or WebDAV): concurrent edits | Deterministic convergence, **zero data loss/corruption** | | |
| U13 | Offline resilience | Airplane mode: edit, then reconnect | Queued ops apply; converge | | |
| U14 | Plugin | Load an example plugin; use its panel/action | Plugin loads sandboxed & functions; public API unchanged | | |
| U15 | Large-list perf (hot path) | Scroll a 200+ task list; add/complete rapidly | Smooth scroll, no jank/regression vs baseline (task.component hot path) | | |
| U16 | Theme & i18n | Toggle dark/light; switch language | Styling + translated strings correct (only `en.json` edited) | | |
| U17 | Electron desktop | Package & launch desktop build; tray/global shortcuts | Desktop-specific features work (guarded by `IS_ELECTRON`) | | |

## Acceptance criteria
- **All** scenarios U1–U16 pass on Web + Electron; U12–U13 mandatory when sync touched; U17 on desktop RC.
- **Zero** data-loss or sync-corruption observations (U11–U13 are release blockers).
- **No perceptible performance regression** on U15 (hot path) vs recorded baseline.
- Any deviation is logged with a repro and either fixed or explicitly waived by the owner (leahganon10@gmail.com) with rationale before tagging.

## Regression evidence
For each RC, attach: the filled sign-off table, screenshots/video for U3/U9/U15, and the SuperSync+WebDAV E2E run link (dispatched `e2e-scheduled.yml`). Record the RC verdict in `CONTEXT_LOG.md`.

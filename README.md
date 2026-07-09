# productivitymaxx

A personal fork of [Super Productivity](https://github.com/super-productivity/super-productivity)
— an offline-first todo list & time-tracking app (Angular + Electron + Capacitor)
— being carried through a **quality-focused refactor program**.

This is a **code snapshot**, not a hosted webapp. There's no public URL — you run
it locally (web dev server or Electron desktop build) or build it yourself for
Android/iOS/desktop. See "Run it" below.

## What's in this repo

- **`src/`, `packages/`, `electron/`, `android/`, `ios/`** — the app source, imported
  from upstream super-productivity (snapshot, not a full history mirror).
- **`docs/refactor/`** — the refactor program for this fork: codebase analysis,
  phased refactor plan, PRD, eval/smoke-test/UAT plans, and a subagent prompt
  series to drive the work. **Start at [`docs/refactor/00-README.md`](docs/refactor/00-README.md).**
- **`docs/upstream/`** — the original project's documentation (styling guide,
  sync/op-log architecture, contributor guide, etc.), preserved as reference.
- **`ARCHITECTURE-DECISIONS.md`**, **`CLAUDE.md`** — upstream's load-bearing
  architectural decisions and AI-agent guidance; still authoritative for this fork.

## Run it

```bash
npm ci                     # installs deps + builds packages/ + patches TS
npm run startFrontend      # web dev server (or: npx ng serve)
npm start                  # Electron desktop dev
```

Full command reference: [`CLAUDE.md`](CLAUDE.md) → "Core commands".

## Host on GitHub Pages

This repo ships a workflow ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml))
that builds the web app and deploys it to GitHub Pages on every push to `main`.

One-time setup after pushing:

1. On GitHub go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Go to the **Actions** tab and enable workflows if prompted.
3. Push to `main` (or run the workflow manually via **Actions → Deploy web app to GitHub Pages → Run workflow**).
4. Your app will be live at `https://lormaigai.github.io/productivitymaxx/`.

Notes:

- The build takes ~10–15 min on the free runner (it compiles the `packages/` monorepo first).
- Data is stored in the browser (offline-first PWA) — nothing is sent to a server unless you configure sync.
- Upstream's 27 CI workflows are parked in `.github/workflows-upstream.disabled/` so they don't run (and fail) on this fork; restore any you need by moving them back into `.github/workflows/`.

## Refactor program status

This fork's goal is to **reduce complexity and change-risk without changing
behavior** — no new features, sync/data changes, or plugin-API breaks. See
[`docs/refactor/CONTEXT_LOG.md`](docs/refactor/CONTEXT_LOG.md) for the current
step and [`docs/refactor/02-REFACTOR-PLAN.md`](docs/refactor/02-REFACTOR-PLAN.md)
for the phased plan (cleanup → feature layer → hot-path UI → sync engine last).

## License

MIT — see [`LICENSE`](LICENSE). Unchanged from upstream.

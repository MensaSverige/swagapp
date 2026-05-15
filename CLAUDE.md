# [CLAUDE.md](http://CLAUDE.md)

This file provides guidance to Claude Code ([claude.ai/code](http://claude.ai/code)) when working with code in this repository.

## Project Overview

Mensa Sverige SWAG App — a cross-platform mobile/web app for Mensa Sweden members. Monorepo with three components:

- `mensasverige/` — React Native (Expo SDK 54) mobile app (iOS, Android, Web) in TypeScript
- `backend/` — Python 3.11 FastAPI backend with MongoDB
- `website/` — Static HTML site with Nginx reverse proxy

## Common Commands

### Frontend (run from `mensasverige/`)

```bash
yarn start          # Dev server in test mode (fake auth)
yarn start:prod     # Dev server against production backend
yarn ios            # Run on iOS simulator
yarn android        # Run on Android
yarn web            # Run web version
yarn lint           # ESLint (expo lint)
yarn generate-types # Regenerate TS types from JSON schema (after schema changes)
```

### Backend (run from repo root)

```bash
make test           # Run pytest (auto-installs deps in .venv)
make python-deps    # Install Python deps into .venv
docker-compose up   # Start backend + MongoDB + mongo-express locally
```

Backend runs on port 5000, mongo-express UI on port 8082.

## Architecture

### Frontend (`mensasverige/`)

- **Routing**: Expo Router (file-based) in `app/`. Tab layout in `app/(tabs)/` with sub-groups `(home)`, `(events)`, `map`, `settings`. Login is a separate route with `Stack.Protected` auth guard.
- **State**: Zustand store (`features/common/store/store.ts`) composed of slices: `EventsSlice`, `LocationSlice`, `AccountSlice`, `SettingsSlice`, `NetworkStatusSlice`. Each feature defines its own slice.
- **Feature structure**: `features/{events,map,account,common}/` — each feature has its own store slice, services, and components.
- **API client**: Axios with interceptors for auto-attaching Bearer tokens and tracking backend connectivity (`features/common/services/apiClient.ts`).
- **Auth**: JWT access+refresh tokens stored in `expo-secure-store`. Auth service handles member (`/authm`) and non-member (`/authb`) login endpoints. Token refresh happens 60s before expiry.
- **Generated types**: `api_schema/` contains TypeScript types generated from JSON schemas in `/schema/`. Run `yarn generate-types` after schema changes.

### Backend (`backend/`)

- FastAPI app entry point: `backend/v1/server.py`
- API routes in `v1/api/` (auth, health, users, events)
- MongoDB via PyMongo, models in `v1/db/`
- Background jobs via APScheduler in `v1/jobs/`
- External integrations: Mensa member verification, Google Maps API

## Code Conventions

- **Commit messages**: Imperative mood, capital first letter, no period. e.g., `Add event filtering`, `Fix login redirect`
- **Promises**: Prefer chained `.then()` over async/await in frontend code
- **Branching**: Feature branches from `develop`, PRs target `develop`

## Visual verification + grit artifacts (autonomous Claude only)

Other contributors (e.g. Amy) ship UI changes without running a visual loop. The autonomous Claude session does, every time:

- **Eyeball pixels for any UI-affecting change before shipping.** Drive the simulator/device with Maestro and `Read` the PNGs from `/tmp/swag-shots/`. Don't trust the code diff alone. Backend changes that affect rendered output count as UI changes.
- **When reviewing screenshots, check for UI design flaws — not just regressions.** A screenshot of a newly added screen is not automatically approved just because it rendered. Look for: elements that are too wide/narrow for their viewport, text that doesn't fit, empty space that looks wrong, layout that obviously wasn't designed for that screen size. New UI added in the current session gets the same scrutiny as changed UI.
- **Keep** `grit artifact` **references current with the app on** `main`.After landing a UI fix, re-shoot the affected frames and re-upload via `grit artifact upload <task-id> <file.png> --frame <frame> --project swagapp`. When a route or tab gets renamed, run `grit artifact delete-reference <old-frame> --project swagapp` so the dashboard doesn't keep showing a stale pre-fix screenshot under the obsolete name.
- **Update the Maestro tour in the same change when routes drift**.Tab labels and anchor text on this app move regularly (Information → Aktiviteter → Karta → Profil → settings was the layout at last check). Fix `maestro/screenshot-tour.yaml` alongside any code change that invalidates its assertions — don't leave the tour broken for next session.

The canonical login for the visual loop is the test review user: `apple@apple.com` / password `some-nice-password` (set via `APPLE_REVIEW_USER` + `REVIEW_PASSWORD` env vars in `docker-compose.yml`). With `MY_USER_ID=2007529` exported, the dev backend will auto-log in as Mikael Grön for a faster cycle.

## working with apps

@~/.claude/MOBILE_APPS.md
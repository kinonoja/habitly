# Habitly

Habitly is a frontend-only habit tracking product prototype built around a considered journal aesthetic: warm paper tones, measured editorial typography, and a quiet, legible calendar. It demonstrates a personal workspace and a separate, explicitly unprotected admin preview.

## Stack

- React and TypeScript (strict mode)
- Vite
- Tailwind CSS 4 via the official `@tailwindcss/vite` plugin
- React Router
- Lucide React
- Vitest and React Testing Library
- ESLint with TypeScript and React Hooks rules

## Requirements

- Node.js 20.19+ (or 22.12+); the current Vite release may require these minimums
- npm 10+

## Run locally

```sh
npm install
npm run dev
```

## Commands

```sh
npm run typecheck  # TypeScript project checks
npm run lint       # ESLint
npm test           # Vitest suite
npm run build      # Typecheck and production bundle
```

## Project structure

```text
src/
  app/                 Router, application entry and providers
  components/          Shared UI and application shell
  domain/              Habit types, date rules and representative demo data
  features/            Overview, habits, tracker, analytics, settings and admin
  styles/              Semantic design tokens and responsive component styles
  test/                Test environment setup
```

Habit and tracking calculations live in domain modules. React components consume an in-memory frontend provider, which is the clean seam for adding a persistence service later.

## Phase 1 boundaries

- All sample profile, habit, entry, platform user and activity data is representative demo data.
- Habit edits and progress updates exist in application memory only and disappear on reload.
- Theme preference is the only preference saved in this browser (`localStorage`).
- Profile/timezone/preferences and notification controls are visual previews. No notifications are sent.
- The admin screen is an unprotected demonstration. It grants no real privilege and must not be used with real user data.
- There is no authentication, Supabase integration, API, server-side logic, or database in this phase.
- MotionSites catalog searches returned metadata, but its content tools were unauthorized in this environment. No inaccessible reference content or source code was used.

## Planned next phases

1. Phase 2: introduce Supabase authentication and PostgreSQL persistence behind the current frontend domain seam, open registration, trusted administrator role checks, and Row Level Security policies.
2. Later phases: reminders and notification delivery, account-level settings synchronization, operational monitoring, and deployment after a separate review.

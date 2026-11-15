# Habitly

Habitly is a React habit-tracking prototype with a journal-inspired interface. Normal startup opens an empty local workspace with no profile identity. Habits and completion edits are held by an in-memory repository and reset on reload; only the theme preference is persisted in `localStorage`. The profile, preferences, and repository interfaces are architecture contracts, not connected persistence features.

The `/admin` route is an unprotected development preview populated with illustrative users, metrics, and activity; production builds redirect away from it. Do not use it with real user data. Open the populated personal demo explicitly with `/?preview=demo` in development. Demo content is not real user activity and is never used to initialize the normal workspace.

## Current stack

- React 19 and strict TypeScript
- Vite
- Tailwind CSS v4 via `@tailwindcss/vite`
- React Router
- Lucide React
- Vitest and React Testing Library
- ESLint with TypeScript and React Hooks rules

The current repository has no authentication, Supabase client, database, backend, IndexedDB storage, offline support, or synchronization engine. No Supabase service-role credential may ever be shipped to the browser.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm 10+.

```sh
npm install
npm run dev
```

## Project structure today

```text
src/
  app/                 App composition, React Router, workspace provider
  components/          Shared UI and application shell
  domain/              Ownership-aware models, validation, repository contracts, date rules
  application/         Workspace actions/use cases
  features/            Overview, habits, tracker, analytics, settings, admin preview
  infrastructure/      In-memory repositories and browser theme preference adapter
  preview/              Explicit development-only demo workspace
  styles/              Shared styles
  test/                Vitest setup
```

The provider composes `WorkspaceActions` with repository contracts and an in-memory adapter. Feature UI uses the provider's application actions; it does not access a storage implementation directly. Domain models carry owner identifiers, UTC timestamps, and revisions; calendar dates are separate local date keys. The development demo is loaded through a separate preview entry. No IndexedDB, Supabase adapter, authentication, autosave, cloud synchronization, or offline shell is implemented yet.

Tests cover empty normal startup, explicit demo preview, application-level ownership checks, domain validation, in-memory repository behavior, calendar utilities, navigation, and theme preference behavior.

## Commands

```sh
npm run typecheck  # TypeScript project checks
npm run lint       # ESLint
npm test           # Vitest suite
npm run build      # Typecheck and production bundle
```

## Target architecture and roadmap

The production direction is an offline-first, multi-user application that preserves React 19, TypeScript, Vite, Tailwind CSS v4, and React Router. Supabase will provide authentication and cloud persistence; IndexedDB will provide durable local data and an outbox for offline writes. The browser will never be trusted to assert user ownership or administrator status. Supabase Row Level Security and trusted server-side authorization must enforce access.

The future feature-based structure, entity model, ownership policies, synchronization lifecycle, seven delivery phases, and acceptance criteria are documented in [ROADMAP.md](ROADMAP.md). These are plans, not implemented features. This phase added no dependencies and did not implement authentication, database migrations, Supabase, IndexedDB, or synchronization.

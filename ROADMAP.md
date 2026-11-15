# Habitly production transition roadmap

This is a target design and delivery plan, not a description of implemented features. The current application remains a frontend prototype as described in `README.md`.

## Product invariants

1. A new account has an empty personal workspace: zero habits, schedules, or completion records and no fabricated analytics.
2. Sign-in uses email/password or Google, with email verification, password recovery, session refresh, and safe account linking.
3. Profiles have editable display names and one profile-level IANA timezone.
4. Mutations save durably to local storage first and synchronize to Supabase when possible.
5. Data access is scoped to the authenticated subject. Client-supplied owner IDs are never authority.
6. Conflicting edits are retained for user resolution; device timestamps never silently select a winner.
7. Weekly targets are quotas within an ISO calendar week (Monday 00:00 through next Monday 00:00 in the profile timezone); they do not imply fixed weekdays.
8. Timezone changes affect future scheduling only. Historical completion dates are preserved and never silently shifted.
9. Archive is the default habit removal action and retains history. Permanent deletion is separate and uses versioned tombstones.
10. Sign-out locks and retains the account-scoped local namespace. Only the same authenticated subject may unlock it. Account deletion revokes sessions, stops sync, removes local data/outbox, and starts trusted remote deletion.
11. Analytics derive only from real records of the authenticated user. Demo content is disposable and never imported into authenticated accounts.
12. Admin access is enforced outside the client. Admins see aggregate metrics and operational account information only by default, not individual habit records. Production admin remains disabled until authorization and security tests pass.
13. Offline scope includes an app shell cached by a service worker/PWA and durable user data in IndexedDB.

## Current state (confirmed)

- React 19, strict TypeScript, Vite, Tailwind CSS v4, React Router, Vitest, and React Testing Library are present.
- Normal provider state starts empty and uses an in-memory repository; theme persists through a browser preference adapter.
- Demo fixtures are loaded only through an explicit development preview. The admin preview remains illustrative and production routing disables it.
- There is no auth, Supabase client, schema/migration, IndexedDB, service worker, offline queue, or sync engine.

## Proposed feature structure

```text
src/
  app/                         Composition, routing, dependency wiring
  components/{ui,layout}/      Shared presentation
  features/
    auth/{pages,components,application,domain,repositories}/
    profile/{pages,components,application,domain,repositories}/
    habits/{pages,components,application,domain,repositories}/
    tracking/{pages,components,application,domain,repositories}/
    analytics/{pages,components,application,domain}/
    administration/{pages,components,application,repositories}/
  domain/shared/               IDs, date/time rules, errors, invariants
  infrastructure/
    persistence/indexeddb/     Local schema and adapters
    persistence/supabase/      Auth/cloud adapters
    sync/                      Outbox, retry, conflicts, tombstones
    connectivity/              Online state and worker triggers
  test/{unit,integration,e2e,fixtures}/
```

Feature modules own screens and use cases. UI components render state and dispatch actions, but do not call Supabase or decide access. Application state coordinates session/data lifecycle and reflects local/sync status; it is not durable truth or a security boundary. Domain logic validates/calculates without React or storage dependencies. Repository interfaces express domain operations and do not accept arbitrary user IDs as authorization. IndexedDB stores account-scoped data and outbox transactionally. Supabase adapters use the current authenticated session. The sync engine retries/reconciles durable operations. The service worker caches only versioned static app assets; it must not cache authenticated API responses.

## Database design

Use client-generated UUIDs for offline-created entity identities; all ownership comes from `auth.uid()`. Timestamps are server-controlled UTC metadata. Each mutable entity uses an integer `revision` for compare-and-swap; timestamps do not resolve conflicts.

| Entity | Design and constraints |
|---|---|
| `profiles` | `id` PK/FK to `auth.users(id)`; non-null display name and validated IANA `timezone`; server timestamps and revision. One row per identity. |
| `habits` | UUID PK, `owner_id` FK to profile, unique `(id, owner_id)` for composite references; details, tracking mode/target, lifecycle status, date range, timestamps, revision, tombstone metadata. Checks validate target/tracking combinations and date order. |
| `habit_schedules` | One current schedule per habit initially; `habit_id` PK and `(habit_id, owner_id)` composite FK. Daily, selected weekdays, or weekly quota. ISO weekdays Monday=1..Sunday=7; quota 1..7; calendar-week boundary uses profile timezone. |
| `habit_completions` | UUID PK, owner, habit, `completion_date`, state/value/note, server timestamps, revision/tombstone. Composite FK `(habit_id, owner_id)` to habits; unique `(habit_id, completion_date)`. Date remains fixed after timezone change. |
| `user_preferences` | One row per profile (`user_id` PK/FK), synchronized account preferences, timestamps/revision. Theme may remain local by explicit implementation choice. Timezone belongs to profile. |
| `admin_roles` | Protected subject/role/grantor/granted/revoked metadata. No client writes. |
| `admin_audit_events` | Append-only actor/action/target category/outcome/correlation ID/server timestamp; excludes habit content and minimizes personal data. |

Use indexes for real query paths: habits by `(owner_id,status)`, completions by `(owner_id,completion_date)` and `(habit_id,completion_date)`, plus unique keys and parent lookups. Validate query plans in schema review. Archive retains completions. Permanent delete cascades through a versioned tombstone workflow and cannot leave orphans. Account deletion is a separate trusted workflow.

## Ownership and RLS policy requirements

Enable and force RLS on every exposed user-data table. Anonymous access is denied. Each operation has explicit `USING` and `WITH CHECK`; updates cannot change owner. Every policy derives identity from `auth.uid()`.

- `profiles`: select/update only `id = auth.uid()`; no client insert or ID change. Trusted bootstrap trigger creates profile.
- `habits`: CRUD only for `owner_id = auth.uid()`; inserts bind owner to auth subject.
- `habit_schedules`: CRUD only when row owner and parent habit match `auth.uid()`; composite FK enforces consistency.
- `habit_completions`: CRUD only for own row and own parent; composite FK blocks mismatched owner.
- `user_preferences`: CRUD only where `user_id = auth.uid()`.
- `admin_roles`: no ordinary client access or writes; trusted grant/revoke workflow only.
- `admin_audit_events`: append via trusted admin service, immutable to clients, narrowly authorized reads.

RLS tests use distinct principals and exercise select/insert/update/delete, owner mutation, cross-owner child references, and anonymous access. Views and functions must not bypass intended policies. Any security-definer function fixes `search_path`, has narrow execute grants, validates caller, and returns minimum data.

### Admin trust boundary

Use Supabase Edge Functions for privileged operations. Each function validates the caller JWT and checks active role state against protected server-side data on each request. It returns aggregate metrics and approved operational account fields only; it cannot return individual habit/completion rows by default. Role grants/revocations are restricted to designated trusted operators, cannot be self-granted, and emit append-only audit events. Revocation must take effect without waiting for a long-lived client role claim. Client guards are UX only. Keep production admin disabled until direct-call authorization tests pass. Never expose the Supabase service-role key in frontend code/build artifacts.

## Authentication and empty-workspace bootstrap

Support email/password and Google OAuth, email verification, password recovery, session refresh/revocation, and safe provider linking. Matching email text alone never authorizes identity linking; prove control of both identities. Require reauthentication for sensitive account deletion. Auth return URLs are allow-listed.

Selected bootstrap: a Postgres trigger on `auth.users` insert creates exactly one profile and default preferences keyed from `NEW.id`, transactionally and idempotently. It creates zero habits/schedules/completions. Client forms never provide owner IDs. If initialization fails, do not hydrate or enter protected routes; show recoverable “workspace setup pending” and invoke a narrowly granted idempotent trusted repair function. Retried signup resolves to the same Auth identity or a recoverable verified-account/link flow, never duplicate workspace rows. Prototype data is disposable and never imported. Empty analytics remain empty; query errors never fall back to demo fixtures.

## Offline persistence and synchronization

### Account isolation and local commit

Partition every IndexedDB record by immutable authenticated subject and include that subject in stored rows. A UI caller cannot select a partition. On sign-out, stop worker, increment session generation, clear active memory, close repository handles, and lock but retain the namespace. On next login, unlock only after subject verification. Browser storage is not a secure vault: local users, extensions, or same-origin XSS can inspect/alter it. Minimize XSS with strict output handling, CSP, dependency review, and no unsafe HTML; client-side encryption with a key available to the same origin is not protection from XSS.

Each mutation validates domain rules and writes the local entity/tombstone plus outbox operation in one IndexedDB transaction. Show “saved locally” only after commit. A transaction failure is visible and is not reported as saved. The app shell is precached by service worker; authenticated API responses are never cached there.

### Outbox schema and state machine

Outbox fields: `operation_id` UUID/idempotency key; `account_id`; entity type/ID; operation kind; payload and payload schema version; `base_revision`; local sequence; dependency operation IDs; created time; attempt count; next-attempt time; state; lease owner/expiry; last classified error. States: `pending → leased → acknowledged`; transient failure `leased → retry_wait → leased`; revision mismatch `leased → conflict`; permanent failure `leased → blocked`; explicit user repair can return `conflict|blocked → pending` with a new operation/revision basis. State changes and entity changes are transactional locally.

Unsent operations may coalesce only when no dependent operation or server-observable intermediate result exists. Client-generated entity IDs and unique constraints prevent duplicate entities. Trusted write endpoint stores the idempotency key and mutation result atomically. If server commits but response is lost, retrying the same key returns the original result/revision. Local acknowledgement transaction updates server revision and acknowledges precisely that operation; it must not clear a newer local sequence.

### Retry, conflicts, pull, and deletion

- Offline/network, timeout, 429, and 5xx: persisted bounded exponential backoff with jitter; honor `Retry-After`.
- Expired auth: attempt one refresh; otherwise pause and wait for reauthentication without changing account scope.
- RLS denial, validation/schema error, revoked/deleted account: blocked and surfaced; no infinite retry. Keep durable data for recovery except account deletion, which purges it as approved.
- Each write carries `base_revision`. Server compares revision atomically. Mismatch creates a durable conflict retaining local desired and current server versions. User sees both and explicitly chooses/edits; resolution creates a new operation based on current server revision. Device timestamps never choose a winner.
- Pull uses stable pagination and a server change cursor/watermark; absence from a partial page never means deletion. Cursor advances only after all page changes are durably applied.
- Default habit removal archives and preserves completions. Permanent delete creates versioned tombstones for habit and dependent data. Tombstones propagate in both directions, prevent stale-page resurrection, and purge only after server acknowledgement, all supported cursors pass the deletion, and approved retention elapses. Account deletion revokes sessions, stops sync, immediately removes local namespace/outbox, then runs trusted remote deletion with retry/status tracking.

### Multi-tab and stale requests

Use an IndexedDB lease with owner token/expiry and transactional outbox claims so only one active tab processes a queue. Renew/release leases; expired leases are recoverable. Server idempotency remains the final duplicate safeguard. Every async local/remote read, write result, and acknowledgement captures account ID and session generation and checks both before applying. Abort where possible; ignore stale results even when abort is unavailable. User A's in-flight result must never affect User B's memory or local partition.

On startup, foreground, and connectivity restoration, request a single-flight sync. Hydrate local data first. Distinguish cached, pending, synced, conflict, blocked, empty, and failed states.

## Phase 1 decision register

| ID | Decision | Status |
|---|---|---|
| P-01 | Preserve concurrent edits and let user resolve; never device-timestamp overwrite | Product-approved; revision/CAS and conflict copies specified |
| P-02 | Sign-out retains but locks account data; same subject required to unlock | Product-approved |
| P-03 | Weekly goals are ISO calendar-week quotas, Monday-start in profile timezone | Product-approved; engineering convention selected |
| P-04 | Admin sees aggregates and operational account data, not habit details by default | Product-approved |
| P-05 | Profile-level IANA timezone; new timezone affects future scheduling only; history never shifts | Product-approved |
| P-06 | Archive default; separate permanent delete; retain history on archive; versioned tombstones | Product-approved |
| P-07 | Account deletion revokes sessions, stops sync, purges local namespace/outbox, trusted remote deletion | Product-approved |
| P-08 | Email/password + Google, verification, recovery, refresh, safe linking | Product-approved |
| P-09 | Server-side admin authorization; route guards are UX only | Product-approved |
| P-10 | Offline shell through service worker/PWA plus IndexedDB data | Product-approved |
| P-11 | Existing demo/prototype data disposable; never imported | Product-approved |
| P-12 | Production admin disabled until server authorization/security tests pass | Product-approved |
| A-01 | Auth-user Postgres trigger creates profile/preferences idempotently; trusted repair path gates routes | Architecture selected |
| A-02 | Edge Functions are trusted admin boundary; protected roles; append-only audit | Architecture selected |
| A-03 | Integer revision/CAS; retain both conflicting versions; explicit user resolution | Architecture selected |
| A-04 | Outbox state/lease/idempotency/ack behavior above | Architecture selected |
| A-05 | ISO weekdays Monday=1..Sunday=7 and Monday calendar boundary | Architecture selected |

## Seven phases and acceptance criteria

Each phase has implementation and automated tests in its own scope. Phase 1 is decision/contracts work only; it does not require source code or dependency changes. Later phases may introduce code while preserving the existing stack.

### Phase 1 — Architecture and application foundation

**Scope:** Record decisions above; define ownership-aware domain types, validation, repository contracts, application workspace actions, and the in-memory adapter; keep storage implementations out of feature UI; make normal state empty; isolate the existing demo behind an explicit development preview. Preserve theme/navigation and current editing/tracking behavior. This phase does not connect auth, Supabase, IndexedDB, migrations, or sync.

**Acceptance:** All product-approved decisions appear in this register; engineering choices are explicit; remaining product questions are separated; normal workspace has no fake profile or seeded records; demo content requires explicit development preview and never falls back; profile/habit/schedule/completion/preferences contracts include ownership and revisions; feature pages use application actions; repositories are replaceable; no architecture statement claims unimplemented capability.

**Tests:** Empty workspace; validation; repository behavior/owner filtering; application ownership guards; calendar/date calculations; explicit demo preview isolation; existing navigation and theme behavior. Typecheck, lint, complete tests, and production build pass.

### Phase 2 — Authentication, bootstrap, profile

**Scope:** Supabase Auth flows, verified email, Google OAuth, recovery/refresh/linking, route/session lifecycle, trigger bootstrap and trusted repair, editable profile name/timezone, empty state.

**Acceptance:** Auth lifecycle works; incomplete bootstrap blocks protected routes with recovery; retry creates one profile/preferences; new accounts have zero habits/schedules/completions; profile edits persist; account switch clears memory; no demo fallback/import.

**Tests:** Email/Google registration/login, verify/recovery/callback/error/refresh, safe-linking denial, duplicate retry, bootstrap atomicity/repair, empty database and rendered state, protected route behavior, profile persistence, session switch.

### Phase 3 — Cloud schema, repositories, and RLS

**Scope:** PostgreSQL schema/migrations, ownership constraints, constraints/indexes, revision checks, repositories, explicit RLS.

**Acceptance:** Composite child ownership FKs work; constraints cover targets/dates/schedules; indexes match query plans; server fields/revisions cannot be client-forged; RLS denies anonymous and cross-user CRUD; no owner reassignment; service key absent from browser.

**Tests:** Migration clean/upgrade/rollback; per-table RLS matrix with separate users; cross-owner child insertion; owner mutation; constraints; revision compare-and-swap; build artifact secret scan.

### Phase 4 — IndexedDB and offline app shell

**Scope:** Versioned account-scoped local stores, atomic mutations/outbox, service worker/PWA shell, local hydration/status.

**Acceptance:** Mutations persist before success; reload/offline shell restores records; sign-out locks and retains account cache; same subject unlocks; different account cannot read; failed local transaction is not reported saved; service worker never caches authenticated APIs.

**Tests:** IndexedDB transaction/rollback/upgrades/quota; reload/offline; A sign-out/B sign-in isolation; same-user unlock; local tampering treated as untrusted; service-worker asset offline and API non-cache behavior.

### Phase 5 — Sync, conflict, and deletion lifecycle

**Scope:** Outbox worker, retries, idempotency, multi-tab lease, pull cursor, conflict resolution, archive/permanent-delete tombstones, account deletion workflow.

**Acceptance:** Lost response safely reconciles; no duplicate records; pending writes survive restart; conflicts preserve both versions and require explicit resolution; tombstones prevent resurrection; delete purge conditions enforced; account deletion stops all retries and purges local data; bounded retries and blocked states are visible.

**Tests:** Accepted-write/lost-response/retry; restart between commit/send/ack; retry classification/backoff; two-device same-field conflict; explicit resolution; multi-tab lease; partial pagination/cursor; stale tombstone pull; archive history; permanent delete no orphan; account deletion with queued writes.

### Phase 6 — Real analytics and end-to-end product quality

**Scope:** Derived analytics, weekly quota semantics, timezone/DST correctness, demo isolation, accessibility/performance and complete online/offline flows.

**Acceptance:** Metrics derive only from authenticated stored records; empty users have no fake values; weekly quotas count calendar-week completions; timezone update affects future schedule only; historic dates remain fixed; no demo content can enter production account flows.

**Tests:** Empty/partial/paused/archived analytics; ISO week year boundary; timezone/DST/travel/change tests; cross-account analytics; no demo fallback; full register→habit→offline completion→sync→analytics journey.

### Phase 7 — Administration and production readiness

**Scope:** Edge Functions, protected roles, grant/revoke, audit events, aggregate/operational admin data, monitoring/backups/incident and deployment gates.

**Acceptance:** Admin feature disabled by default and cannot be enabled until security tests pass; members/anonymous callers denied direct calls; authorized admins receive only approved fields/aggregates; habit data unavailable; grants/revocations audited and effective promptly; production credentials and restore/rollback reviewed.

**Tests:** Direct endpoint calls as anonymous/member/admin; role self-grant denial; revoke active role; response schema excludes habit records; audit append-only; role grant/revoke audit; service-role artifact scan; staging RLS and backup restore rehearsal.

## Remaining product-owner questions

These are not blockers for Phase 1 contracts but require approval before the relevant release: (1) permanent-deletion/remote-retention duration and any legal retention override; (2) account-deletion grace period/restoration; (3) exact operational account fields visible to admins; (4) data export requirement/format; (5) minimum supported browsers and service-worker offline guarantee. No further product approvals are invented by this roadmap.

## Engineering decisions still to detail

SQL types and exact DDL/query plans; trigger/repair function SQL and permissions; OAuth URLs/templates/session configuration; conflict record wire format and UI; outbox payload versioning, lease duration and cursor guarantees; archive restore behavior; PWA update/rollback; deletion job retry/status; and operational monitoring. These details must preserve the approved invariants and be recorded before their dependent implementation phase.

## Cross-phase release gates

- Strict typecheck, lint, unit/integration/E2E tests and production build pass.
- Real RLS tests use distinct principals; mocked tests are not treated as proof of RLS.
- Two-account tests cover local reads, sync, analytics, and cloud queries.
- Offline/reconnect/restart/lost-response tests prove no lost or duplicate logical writes.
- No service-role credential appears in frontend source, configuration, or built artifacts.
- Migration, OAuth environment, monitoring, backup restore, rollback, and incident ownership are reviewed before production release.
- UI never describes a local-only write as cloud-synced.

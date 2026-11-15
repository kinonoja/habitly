# Habitly Phase 1 Architecture Review — Decision Update

**Scope:** Reviewed the complete `README.md`, `ROADMAP.md`, and prior `ARCHITECTURE_REVIEW.md`, then checked selected current source claims. Documentation only; no application code was modified and no tests were run.

## Overall assessment

The product owner has closed the key product-policy questions from the prior review. `ROADMAP.md` now translates those decisions into an explicit architecture: Postgres Auth-user trigger bootstrap with repair path, `auth.uid()`-derived ownership, composite child ownership constraints, per-operation RLS, revision/CAS conflict detection, durable local conflict copies, explicit user resolution, locked account-scoped caches, tombstones, multi-tab leases, and a trusted Edge Function admin boundary.

The roadmap now has a Phase 1 decision register and separates product approvals from engineering details and remaining product questions. Phase boundaries are coherent: Phase 1 is documentation/contracts only; Phase 2 is auth/bootstrap/profile; Phase 3 cloud schema/RLS; Phase 4 IndexedDB/PWA; Phase 5 sync/conflicts/deletion; Phase 6 analytics/time semantics; Phase 7 admin and operations. The admin area remains disabled until authorization tests pass.

The documentation is sufficiently precise to begin **Phase 1 contract/design work and implementation of Phases 2–6 in dependency order**, subject to the technical details below being converted into ADRs/schema contracts before each dependent phase. Phase 7 must remain disabled until trusted authorization/security acceptance passes. This is a documentation readiness assessment, not evidence that the existing app is production-ready.

## Current implementation checked

README's current-state description is consistent with inspected files: `AppProviders.tsx` seeds in-memory habits/entries from `demo.ts`; `localStorage` is only used for theme; overview contains fixed weekly bar heights; and `/admin` has no route guard and uses sample values. No authentication, Supabase, database, IndexedDB, service worker, or synchronization code is present. These are confirmed current-state findings, not roadmap features.

## Decisions now approved

The roadmap includes all approved product decisions:

- Preserve concurrent edits for explicit user resolution; never silently choose by device timestamps.
- Retain but lock the local account namespace on sign-out; only the same authenticated subject can unlock it.
- Weekly targets count qualifying completions in a Monday-start ISO calendar week, evaluated in the profile timezone.
- Admins see aggregate platform metrics and approved operational account details, not individual habit records by default.
- One profile-level IANA timezone; changes apply prospectively and do not move historical completion dates.
- Archive is default and retains completions; permanent delete is distinct and tombstoned.
- Account deletion revokes sessions, halts sync, purges local namespace/outbox, and uses a trusted remote deletion workflow.
- Email/password and Google auth include verification, recovery, refresh, and safe identity linking.
- Admin authorization is trusted/server-side; client guards are UX only; production admin remains disabled until security tests pass.
- Offline includes the application shell through a service worker/PWA and local data via IndexedDB.
- Existing prototype/demo data is disposable and is never imported into authenticated accounts.

## Security review

The revised RLS requirements consistently derive identity from `auth.uid()` and define own-row access for profiles, habits, schedules, completions, and preferences. Composite foreign keys close the parent/child ownership gap. The roadmap requires `USING` and `WITH CHECK`, immutable owners, anonymous/cross-user denial, no ordinary-client role access, and security-definer safeguards. The trusted Edge Function boundary validates the caller and active server-side role for each admin request; role changes are trusted and audited. The service-role credential is prohibited from frontend code/artifacts.

The local-storage limitation is explicit: IndexedDB partitioning prevents accidental application-level leakage but is not a security boundary against device access, extensions, or same-origin XSS. The plan calls for XSS prevention and disallows caching authenticated API responses in the service worker.

Remaining security implementation work includes reviewing actual RLS DDL, function grants, JWT validation, role revocation latency, OAuth redirect allowlists, CSP, and production secret handling. These require code/config tests later; documentation alone cannot establish security.

## Data integrity and synchronization review

The revised model specifies profile ownership, `(id, owner_id)` parent uniqueness, composite child FKs, completion uniqueness, validation checks, query-driven indexes, server timestamps, and integer revisions. The outbox schema and lifecycle now include operation identity, account scope, entity/revision, dependencies, retry state, lease metadata, classified errors, and atomic local mutation/ack behavior. A lost response reuses the same idempotency key; user-visible acknowledgement cannot clear a newer local sequence. Retry classes are bounded, and conflict resolution preserves both versions pending explicit user action.

Deletion is distinguished from archiving. Tombstones prevent stale-page resurrection and have explicit acknowledgement/cursor/retention purge gates. Account deletion is separate and stops local retries before trusted remote removal. Cursor pagination, operation payload details, lease durations, and final retention windows still need engineering/product detail, called out in the roadmap.

## Account lifecycle and scenario outcomes

| Scenario | Required expected behavior | Roadmap mechanism / acceptance test |
|---|---|---|
| User A signs out; User B signs in on same browser | A's namespace remains locked; B sees only B's records. A's outbox never runs under B. Same authenticated A may later unlock A's data. | Stop worker, increment session generation, clear memory/close repositories, partition by verified subject; test delayed A responses and outbox against B login. |
| Same habit edited offline on two devices | Both edits persist. Revision mismatch stores both local and server versions; user resolves explicitly. No timestamp winner. | Integer revision/CAS, durable conflict record, resolution creates new write; two-device same-field conflict test. |
| Habit deleted offline; app restarts before sync | Local tombstone/outbox survives restart; item is not resurrected by pull; history behavior follows archive vs permanent-delete action. | Atomic tombstone+outbox transaction, versioned tombstone propagation, cursor/ack purge gate; restart/stale-page test. |
| Server accepts a write but response is lost | Retry does not duplicate the logical operation; client reconciles prior result and does not clear later local edits. | Atomic server idempotency key/result and local exact-operation acknowledgement; fault-injection lost-response test. |
| Internet is lost while editing | App shell remains available; edits commit to IndexedDB and display local-pending status. Sync resumes on reconnect. | Service worker plus transactionally persisted entity/outbox; offline edit/reload/reconnect test. |
| Account creation retries | One Auth identity/profile/preferences; zero habits/schedules/completions. Partial bootstrap blocks routes and can be repaired safely. | Unique subject keys and idempotent Auth trigger, trusted repair function; repeated/concurrent bootstrap and failure recovery tests. |
| Normal user calls admin endpoint directly | Denied without returning metrics/account info; UI route manipulation changes nothing. | Edge Function verifies JWT and active protected role; direct anonymous/member endpoint tests. |
| New account needs empty workspace | Profile/preferences only and empty analytics, with no demo fallback. | Auth trigger creates no habit records; empty DB plus UI assertions for email and Google flows. |
| User changes timezone after completion records exist | Historical dates remain unchanged; future scheduling uses new IANA timezone. | Profile timezone and prospective-effective policy; timezone update test asserts stored completion dates stable and future schedule changes. |

## Remaining technical questions

These are engineering-owned implementation details, not unresolved product approvals:

1. Exact SQL types, DDL, check expressions, index definitions validated against query plans, migration/rollback strategy, and RLS policy SQL.
2. Auth trigger and trusted repair-function implementation, permissions, error telemetry, and behavior if a trigger failure leaves an operational partial Auth row.
3. OAuth callback URLs, verification/recovery templates, session lifetimes, duplicate-provider linking UX, and refresh behavior while offline.
4. Conflict record serialization, payload versioning, and UI presentation for field-level and completion conflicts.
5. Outbox lease duration/renewal and chosen browser coordination primitive; cursor/watermark and pagination guarantees; push/pull ordering and ack atomicity details.
6. Tombstone compaction once all supported devices/cursors have advanced, given indefinitely offline clients; this must preserve the approved no-resurrection invariant.
7. Archive restore behavior and permanent-delete retention/cascade mechanics.
8. PWA cache update/rollback behavior, minimum browser support, and app-shell version compatibility with IndexedDB schema upgrades.
9. Account-deletion job retries, completion status, and how remote deletion handles an already-running request.
10. CSP and deployment configuration details, monitoring/alert ownership, and operational audit retention.

## Decisions genuinely still requiring product-owner input

The approved choices above are not reopened. The roadmap correctly lists only these remaining product questions:

1. Permanent-deletion retention duration and any legal retention/anonymization override.
2. Account-deletion grace period and whether restoration is supported during it.
3. Exact operational account fields administrators may view and their retention period.
4. Whether users can export data before deletion and required format.
5. Minimum supported browsers and precise offline-shell availability guarantee.

None blocks Phase 1 contracts or the start of implementation, but each must be decided before shipping the relevant deletion, admin, export, or PWA behavior.

## Contradictions found and resolved

- The previous review asked whether offline scope included the app shell. Product approved service-worker/PWA shell availability; roadmap now includes it.
- The prior proposal mentioned timestamps as possible concurrency evidence and left last-write-wins as an option. Product explicitly rejected timestamp-based resolution; roadmap now uses integer revisions/CAS and explicit user choice.
- Schedule behavior could be interpreted as fixed weekdays. Product approved calendar-week quotas; roadmap defines ISO Monday-start weeks and quota semantics.
- Admin scope and launch gate were open. Product approved aggregate/operational data only and disabled-by-default production admin; the trusted Edge Function boundary is selected in the roadmap.
- Profile bootstrap previously allowed either trigger or client-follow-up. The roadmap now selects an Auth-user database trigger plus trusted repair path and route gating.
- Prior phase text mixed code/tests into architecture-only Phase 1 and placed local repository work ambiguously in Phase 3. Phase 1 is now documentation/contracts only; IndexedDB/PWA is Phase 4, sync Phase 5, and cloud schema/RLS Phase 3.

No remaining contradiction was found between the approved decisions and the revised phase ordering. The README remains a current-state document and does not claim that any planned feature exists.

## Test matrix (implementation acceptance)

| Area | Test | Expected result |
|---|---|---|
| Auth and bootstrap | Email/Google registration, verification, recovery, refresh, safe linking; repeat/concurrent initialization and repair | Valid session only; unverified access blocked; linking requires proof; one profile/preferences, zero habits; incomplete bootstrap gates routes and recovers idempotently |
| Empty/demo exclusion | New account, empty query, network/query error, production build | Empty state has no fabricated analytics; query errors do not load fixtures; demo data never imported/reachable in authenticated path |
| Ownership/RLS | Distinct A/B/anonymous principals test CRUD on every table, owner mutation, child cross-reference | Own allowed actions succeed; anonymous/cross-account actions and owner changes denied; composite FKs reject mismatched child ownership |
| Constraints and revisions | Invalid dates/targets/weekdays, duplicate completion, stale base revision | Invalid writes rejected; no duplicate habit/date completion; stale revision creates conflict, never silent overwrite |
| Admin and roles | Direct endpoint calls as anonymous/member/admin; self-grant; grant/revoke; inspect response | Unauthorized calls return no data; role cannot self-grant; authorized output excludes habit rows; grants/revokes audited and revoke takes effect promptly |
| Sign-out/account switch | A writes offline and signs out; B logs in; delayed A local/remote response resolves | A cache is locked/retained; B sees only B; no A operation sent under B; stale response ignored; same A can unlock |
| Offline shell/data | Load shell, go offline, edit, reload, then reconnect | App shell loads offline; local commit survives restart; pending status shown; sync eventually acknowledged; service worker does not cache auth API responses |
| Lost response/idempotency | Server commits and response is dropped; retry after restart | One logical write; same operation result/revision reconciled; newer local sequence remains pending |
| Conflict | Two devices edit same and distinct fields from same revision | Both versions preserved on conflict; user resolves explicitly; no device-time winner; resolution is based on current revision |
| Retry/multi-tab | Inject offline/timeout/429/5xx/expired auth/RLS/validation and process from two tabs | Transient backoff bounded; auth pauses safely; permanent failures block visibly; lease limits competing workers; server idempotency prevents duplicates |
| Deletion | Archive; permanently delete offline/restart; stale remote page; account deletion with queued writes | Archive preserves history; tombstones prevent resurrection; no orphan rows; purge waits for ack/cursor/retention; account deletion revokes/stops/purges locally before trusted remote workflow |
| Time/date | ISO week/year boundary, Monday numbering, DST, timezone change, late-night completion | Weekly quota counts calendar-week completions; weekday parity matches; historical dates unchanged; future scheduling follows profile timezone |
| Deployment | Migration/restore, frontend bundle scan, staging OAuth/RLS, admin-disabled gate | RLS remains active; no service-role secret in client; production admin stays disabled until security suite passes; rollback/restore reviewed |

No tests were run as part of this documentation review; the matrix is proposed acceptance coverage, not a test result.

## Readiness decision

**The documentation is sufficiently precise to begin implementation in dependency order**, starting with any remaining Phase 1 ADR/contract details and then Phase 2. This does not mean the current application is production-ready. Phase 3–5 implementation must preserve the specified ownership, revision, outbox, conflict, and deletion invariants. The five remaining product questions must be resolved before shipping their associated behavior. Production admin must remain disabled until its trusted authorization and security tests pass.

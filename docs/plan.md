# Spendwise — Implementation Plan & Status

Technology: React 18 + Vite 5 (JavaScript, no TypeScript), Spring Boot 3.3.4, Maven, MySQL 8.0.46, Flyway, JWT (jjwt 0.12.6), Tailwind 3.4, Recharts 2.12.

Folders: `spendwise/{frontend,backend,docs,.env.example}`.

DB: `spendwise` (MySQL). Migrations: `V1__schema.sql`, `V2__categories.sql`, `V3__transactions.sql`.

Auth: stateless JWT bearer token (not a cookie — the SPA is a separate origin), BCrypt passwords, roles `USER`/`ADMIN`.

API: `/api/v1/{auth,transactions,categories,budgets,recurring,goals,dashboard,analytics,exports,admin}`.

Security: identity is always derived from the verified security context (`@AuthenticationPrincipal` / `authentication.getName()`); no controller accepts a client-supplied user id. DTOs are Bean-Validation annotated. Query parameters are bound through Spring Data JPA (parameterised). No secrets in the repository — `.env.example` holds placeholders only.

## Stage status

| Stage | Scope | Status |
|---|---|---|
| 0 | Requirements, stack, schema sketch | done |
| 1 | Folder layout, config files, dependency manifests | done |
| 2 | Entities, repositories, DTOs | done |
| 3 | Auth (register/login/JWT), Spring Security chain | done |
| 4 | Transactions + categories | done |
| 5 | Budgets + recurring schedules | done |
| 6 | Savings goals, contributions, dashboard, analytics | done |
| 7 | React UI (shell, routing, 9 pages, dark mode) | done |
| 8 | CSV export, admin endpoints | done |
| 9 | Backend tests (21) + frontend unit tests (6) | done — 100% passing |
| 10 | Docs | done — see `docs/verification.md` |

## Deviations from the original Stage 1 sketch

- **Migrations are `V1__schema.sql`, `V2__categories.sql`, `V3__transactions.sql`**, not
  `V2__seed_defaults.sql` / `V3__indexes.sql`. The live database's
  `flyway_schema_history` records V1 "init users", V2 "core finance", V3 "budgets
  goals invest lending" — descriptions that do not match those file names. The
  history must be compared against `SHOW CREATE TABLE` output before any new
  migration is placed in `db/migration/`.
- **Auth is a bearer token, not an httpOnly cookie.** With a cookie the API would
  need CSRF protection; the SPA already sends `Authorization: Bearer …` and
  `withCredentials: false`, which keeps the API stateless and CSRF-free.
- **The live database has 12 tables**, four of which (`accounts`, `investments`,
  `lending_records`, `repayments`) have no application code. They are left
  untouched.
- **`savings_goals`, `goal_contributions` and `recurring_transactions`** exist in
  the database but were not created by the repository's V1–V3, so their exact
  column definitions are unconfirmed. The application maps them as documented in
  `docs/proposed_migration_V4.md` §5.

## Known open items

1. **`mvn -o clean test` and `npm run lint` / `npm run build` / `npm test` have
   not been run since the last code change.** The environment's tool-safety
   classifier rejected every command invocation. Nothing in this repository is
   claimed to have passed a build until a real run says so. See
   `docs/verification.md` §3.
2. **The database schema has not been reconciled.** `docs/proposed_migration_V4.md`
   holds an additive-only, MySQL-8-safe forward migration that is **proposed, not
   executed**. It requires the read-only inspection in
   `docs/verification.md` §5 and explicit approval first.
3. **No end-to-end run** (register → login → create transaction → export CSV)
   has been performed, because that needs a running backend, a reachable database
   and a browser.

## Risks

- The MySQL service has to be running for the backend to start; the schema
  inspection and the startup Flyway apply are the first things to observe on a
  real run.
- Flyway will refuse to start if the applied-migration checksums do not match the
  files in `src/main/resources/db/migration`. That must be reconciled
  deliberately — never by editing an applied migration or running
  `flyway repair` without understanding the cause.

# 11 · RBAC Matrix

A complete table of every backend endpoint and which roles can call it.
Sourced directly from the route definitions and `requireRole(...)` calls in
`shelfsight-backend/src/routes/`.

Legend:

- ✅ — allowed
- ❌ — explicitly denied (returns 403)
- 🌐 — public (no auth required)
- 👤 — authenticated, scoped to **own** records (e.g. patrons can list
  their own loans but not someone else's)

> All authenticated endpoints require a valid JWT cookie via `requireAuth`.
> Anything ✅ for one role and ❌ for another is enforced by `requireRole(...)`.

---

## Authentication (`/auth`)

| Endpoint                       | Public | PATRON | STAFF | ADMIN | Notes                                        |
|--------------------------------|--------|--------|-------|-------|----------------------------------------------|
| `POST /auth/login`             | 🌐     | —      | —     | —     | Rate-limited: 15 / 15min in production.      |
| `POST /auth/logout`            | 🌐     | —      | —     | —     | Clears cookie. No-op if not logged in.       |
| `GET  /auth/me`                | ❌     | ✅     | ✅    | ✅    | Returns current user from JWT.               |
| `POST /auth/signup`            | 🌐     | —      | —     | —     | Creates a new org + first ADMIN.             |
| `POST /auth/accept-invite`     | 🌐     | —      | —     | —     | Token-bearer auth.                           |
| `GET  /auth/invites/:token`    | 🌐     | —      | —     | —     | Public preview (org name + role).            |
| `POST /auth/forgot-password`   | 🌐     | —      | —     | —     | Always 200 (anti-enumeration).               |
| `POST /auth/reset-password`    | 🌐     | —      | —     | —     | Token-bearer auth.                           |

## Books (`/books`)

| Endpoint                        | PATRON | STAFF | ADMIN | Notes                                           |
|---------------------------------|--------|-------|-------|-------------------------------------------------|
| `GET    /books`                 | ✅     | ✅    | ✅    | Search/filter (`search`, `genre`, `language`, `page`, `limit`). |
| `GET    /books/:id`             | ✅     | ✅    | ✅    |                                                 |
| `POST   /books`                 | ❌     | ✅    | ✅    |                                                 |
| `POST   /books/bulk`            | ❌     | ✅    | ✅    | JSON array of books.                            |
| `POST   /books/bulk-isbn`       | ❌     | ✅    | ✅    | Resolves via Open Library / Google Books.       |
| `POST   /books/bulk-file`       | ❌     | ✅    | ✅    | Excel/CSV upload (multer).                      |
| `PUT    /books/:id`             | ❌     | ✅    | ✅    |                                                 |
| `DELETE /books/:id`             | ❌     | ✅    | ✅    |                                                 |
| `DELETE /books/all`             | ❌     | ❌    | ✅    | Wipes all books in the organization.            |

## Loans (`/loans`)

| Endpoint                                         | PATRON | STAFF | ADMIN | Notes                                                          |
|--------------------------------------------------|--------|-------|-------|----------------------------------------------------------------|
| `POST /loans/checkout`                           | ❌     | ✅    | ✅    |                                                                |
| `POST /loans/checkin`                            | ❌     | ✅    | ✅    | Calculates fines.                                              |
| `GET  /loans`                                    | 👤     | ✅    | ✅    | Patrons are scoped to their own loans by the controller.       |
| `GET  /loans/copies/:copyId/location`            | ✅     | ✅    | ✅    |                                                                |
| `GET  /loans/copies/:copyId/history`             | ✅     | ✅    | ✅    | `BookCopyEvent` audit trail for the copy.                      |
| `POST /loans/copies/:copyId/shelve`              | ❌     | ✅    | ✅    |                                                                |

## Fines (`/fines`)

| Endpoint                       | PATRON | STAFF | ADMIN | Notes                                                  |
|--------------------------------|--------|-------|-------|--------------------------------------------------------|
| `GET  /fines`                  | 👤     | ✅    | ✅    | Patrons see their own fines.                           |
| `POST /fines/:fineId/pay`      | ✅     | ✅    | ✅    | Marks `PAID`.                                          |
| `POST /fines/:fineId/waive`    | ❌     | ✅    | ✅    | Privileged staff action; sets `waivedBy`.              |

## Map (`/map`)

| Endpoint                              | PATRON | STAFF | ADMIN | Notes                                              |
|---------------------------------------|--------|-------|-------|----------------------------------------------------|
| `GET    /map`                         | ✅     | ✅    | ✅    | All roles can read the floor plan.                 |
| `GET    /map/placement-hints`         | ✅     | ✅    | ✅    | Suggests a shelf based on Dewey range.             |
| `GET    /map/:id`                     | ✅     | ✅    | ✅    |                                                    |
| `GET    /map/:id/books`               | ✅     | ✅    | ✅    | Copies on a shelf, with tier/slot ordering.        |
| `PUT    /map/layout`                  | ❌     | ✅    | ✅    | Bulk update — must be declared before `/:id`.      |
| `POST   /map`                         | ❌     | ✅    | ✅    | Create new shelf section.                          |
| `PUT    /map/:id`                     | ❌     | ✅    | ✅    |                                                    |
| `DELETE /map/:id`                     | ❌     | ✅    | ✅    |                                                    |

## AI ingestion (`/ingest`)

| Endpoint                                  | PATRON | STAFF | ADMIN | Notes                                  |
|-------------------------------------------|--------|-------|-------|----------------------------------------|
| `GET  /ingest/lookup`                     | ❌     | ✅    | ✅    | ISBN → Open Library / Google Books.    |
| `POST /ingest/analyze`                    | ❌     | ✅    | ✅    | Single-image upload, ≤ 10 MB.          |
| `POST /ingest/analyze/batch`              | ❌     | ✅    | ✅    | Up to 20 images per request.           |
| `GET  /ingest/jobs`                       | ❌     | ✅    | ✅    | Paginated job list.                    |
| `GET  /ingest/jobs/:id`                   | ❌     | ✅    | ✅    |                                        |
| `POST /ingest/jobs/:id/approve`           | ❌     | ✅    | ✅    | Creates Book + BookCopy rows.          |
| `POST /ingest/jobs/:id/reject`            | ❌     | ✅    | ✅    |                                        |

## Users (`/users`)

| Endpoint                | PATRON | STAFF | ADMIN | Notes                          |
|-------------------------|--------|-------|-------|--------------------------------|
| `GET    /users`         | ❌     | ❌    | ✅    | List all users in the org.     |
| `POST   /users`         | ❌     | ❌    | ✅    | Direct create (no invite).     |
| `PUT    /users/:id`     | ❌     | ❌    | ✅    |                                |
| `DELETE /users/:id`     | ❌     | ❌    | ✅    |                                |

## Organizations (`/orgs`)

| Endpoint              | PATRON | STAFF | ADMIN | Notes                                    |
|-----------------------|--------|-------|-------|------------------------------------------|
| `GET    /orgs/:id`    | ✅     | ✅    | ✅    | Any authenticated org member.            |
| `PATCH  /orgs/:id`    | ❌     | ❌    | ✅    | Rename.                                  |
| `DELETE /orgs/:id`    | ❌     | ❌    | ✅    | Cascade-deletes invites; rest is admin's responsibility. |

## Invites (`/orgs/:id/invites`)

| Endpoint                                    | PATRON | STAFF | ADMIN | Notes                          |
|---------------------------------------------|--------|-------|-------|--------------------------------|
| `POST   /orgs/:id/invites`                  | ❌     | ❌    | ✅    | Mints a hashed token + expiry. |
| `GET    /orgs/:id/invites`                  | ❌     | ❌    | ✅    |                                |
| `DELETE /orgs/:id/invites/:inviteId`        | ❌     | ❌    | ✅    | Revoke (delete row).           |

## Transactions (`/transactions`)

| Endpoint              | PATRON | STAFF | ADMIN | Notes                                      |
|-----------------------|--------|-------|-------|--------------------------------------------|
| `GET /transactions`   | ❌     | ✅    | ✅    | Audit log for reports / circulation history. |

## Health (`/health`)

| Endpoint              | Public | PATRON | STAFF | ADMIN | Notes                                |
|-----------------------|--------|--------|-------|-------|--------------------------------------|
| `GET /health`         | 🌐     | ✅     | ✅    | ✅    | Liveness — always 200.                |
| `GET /health/ready`   | 🌐     | ✅     | ✅    | ✅    | Readiness — runs `SELECT 1` on DB.    |

---

## Test-only routes

In non-production environments, `POST /__test__/reset` is mounted (see
`src/routes/index.ts:32-34`). It is **not registered when
`NODE_ENV === 'production'`**, so it never exists in deployed environments.

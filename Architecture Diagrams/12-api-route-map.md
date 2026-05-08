# 12 · API Route Map

A one-page reference of every backend endpoint, grouped by resource. Routes
are listed in the same order they're declared in
`shelfsight-backend/src/routes/`.

For permissions per role, see [11 · RBAC Matrix](./11-rbac-matrix.md).
For sequence diagrams, see [07 · Auth Flow](./07-auth-flow.md),
[08 · AI Ingestion](./08-ai-ingestion-pipeline.md),
[09 · Loan Lifecycle](./09-loan-lifecycle.md).

> All endpoints return JSON. The frontend client (`apiFetch` in
> `src/lib/api.ts`) understands a universal envelope `{ success, data, meta,
> error }` and unwraps `data` automatically. Pagination metadata is read
> from `meta.pagination` when present.

---

## `/auth`

| Method | Path                          | Auth                         | Body / Params                                       | Purpose                                                         |
|--------|-------------------------------|------------------------------|-----------------------------------------------------|-----------------------------------------------------------------|
| POST   | `/auth/login`                 | public · rate-limited        | `{ email, password }`                               | Authenticate; sets HttpOnly `token` cookie (7d).                |
| POST   | `/auth/logout`                | public                       | —                                                   | Clears `token` cookie.                                          |
| GET    | `/auth/me`                    | requireAuth                  | —                                                   | Returns the current user.                                       |
| POST   | `/auth/signup`                | public                       | `{ orgName, name, email, password }`                | Atomically creates a new `Organization` + first ADMIN `User`.   |
| POST   | `/auth/accept-invite`         | public (token-bearer)        | `{ token, name, password }`                         | Accepts an invite; creates a `User` and signs them in.          |
| GET    | `/auth/invites/:token`        | public                       | path: `token`                                       | Public preview (org name, role, expiry) for the invite page.    |
| POST   | `/auth/forgot-password`       | public                       | `{ email }`                                         | Always 200; mails a reset link if the email matches a user.     |
| POST   | `/auth/reset-password`        | public (token-bearer)        | `{ token, password }`                               | Sets a new password from a reset token.                         |

## `/books`

| Method | Path                  | Roles            | Body / Params                                                                                  | Purpose                                                                  |
|--------|-----------------------|------------------|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| GET    | `/books`              | any auth         | query: `search`, `title`, `author`, `isbn`, `genre`, `category`, `language`, `page`, `limit`, `unshelved` | Search/filter books. GIN trigram indexes on title/author.       |
| GET    | `/books/:id`          | any auth         | path: `id`                                                                                     | Get one book.                                                            |
| POST   | `/books`              | ADMIN, STAFF     | book fields                                                                                    | Create.                                                                  |
| POST   | `/books/bulk`         | ADMIN, STAFF     | `[ {…}, {…} ]`                                                                                 | Bulk create from JSON.                                                   |
| POST   | `/books/bulk-isbn`    | ADMIN, STAFF     | `{ isbns: string[] }`                                                                          | Bulk create by ISBN; resolves via Open Library / Google Books.           |
| POST   | `/books/bulk-file`    | ADMIN, STAFF     | multipart `file` (xlsx/csv)                                                                    | Parse + bulk insert.                                                     |
| PUT    | `/books/:id`          | ADMIN, STAFF     | book fields                                                                                    | Update.                                                                  |
| DELETE | `/books/:id`          | ADMIN, STAFF     | path: `id`                                                                                     | Delete.                                                                  |
| DELETE | `/books/all`          | ADMIN            | —                                                                                              | Wipe every book in the org.                                              |

## `/loans`

| Method | Path                                          | Roles            | Body / Params                                  | Purpose                                                                |
|--------|-----------------------------------------------|------------------|------------------------------------------------|------------------------------------------------------------------------|
| POST   | `/loans/checkout`                             | ADMIN, STAFF    | `{ userId, bookCopyId, dueDays? }`             | Issues a copy. 14-day default. Logs `BookCopyEvent` + `TransactionLog`.|
| POST   | `/loans/checkin`                              | ADMIN, STAFF    | `{ loanId }`                                   | Returns a copy; calculates fine ($0.25/day, max $25).                  |
| GET    | `/loans`                                      | any auth (patrons scoped) | query: `status` (active/returned/overdue), `userId`, `search`, `page`, `limit` | List loans.                          |
| GET    | `/loans/copies/:copyId/location`              | any auth         | path: `copyId`                                 | Shelf + active loan info.                                              |
| GET    | `/loans/copies/:copyId/history`               | any auth         | path: `copyId`, query: `page`, `limit`         | `BookCopyEvent` audit log.                                             |
| POST   | `/loans/copies/:copyId/shelve`                | ADMIN, STAFF    | `{ shelfId }`                                  | Place on shelf; emits `SHELVED` (first time) or `MOVED`.               |

## `/fines`

| Method | Path                          | Roles                | Body / Params  | Purpose                                       |
|--------|-------------------------------|----------------------|----------------|-----------------------------------------------|
| GET    | `/fines`                      | any auth (patrons scoped) | —         | List fines.                                   |
| POST   | `/fines/:fineId/pay`          | any auth             | path: `fineId` | Mark `PAID`.                                  |
| POST   | `/fines/:fineId/waive`        | ADMIN, STAFF        | path: `fineId` | Mark `WAIVED`; sets `waivedBy`.               |

## `/map`

| Method | Path                          | Roles            | Body / Params                                  | Purpose                                                                  |
|--------|-------------------------------|------------------|------------------------------------------------|--------------------------------------------------------------------------|
| GET    | `/map`                        | any auth         | query: `floor?`                                | List `ShelfSection`s.                                                    |
| GET    | `/map/placement-hints`        | any auth         | query: `bookId` or `dewey`                     | Suggested shelf for a book based on Dewey range.                         |
| GET    | `/map/:id`                    | any auth         | path: `id`                                     | One shelf.                                                               |
| GET    | `/map/:id/books`              | any auth         | path: `id`                                     | Copies on the shelf, with tier/slot ordering.                            |
| PUT    | `/map/layout`                 | ADMIN, STAFF    | `{ shelves: [{ id, mapX, mapY, … }, …] }`      | Bulk save layout. Mounted before `/:id` to avoid the path conflict.      |
| POST   | `/map`                        | ADMIN, STAFF    | shelf fields                                   | Create.                                                                  |
| PUT    | `/map/:id`                    | ADMIN, STAFF    | shelf fields                                   | Update (label, coords, capacities, color, …).                            |
| DELETE | `/map/:id`                    | ADMIN, STAFF    | path: `id`                                     | Delete.                                                                  |

## `/ingest`

| Method | Path                              | Roles            | Body / Params                                  | Purpose                                                                  |
|--------|-----------------------------------|------------------|------------------------------------------------|--------------------------------------------------------------------------|
| GET    | `/ingest/lookup`                  | ADMIN, STAFF    | query: `isbn`                                  | Look up by ISBN; no image involved.                                      |
| POST   | `/ingest/analyze`                 | ADMIN, STAFF    | multipart `image` (≤ 10 MB)                    | Run pipeline; returns `IngestionJob` id + suggestions.                   |
| POST   | `/ingest/analyze/batch`           | ADMIN, STAFF    | multipart `images` / `image` (≤ 20 each)       | Batch variant.                                                           |
| GET    | `/ingest/jobs`                    | ADMIN, STAFF    | query: `status`, `page`, `limit`               | Paginated job list.                                                      |
| GET    | `/ingest/jobs/:id`                | ADMIN, STAFF    | path: `id`                                     | One job.                                                                 |
| POST   | `/ingest/jobs/:id/approve`        | ADMIN, STAFF    | `{ overrides?: bookFields, copyCount?, shelfId? }` | Creates `Book` + `BookCopy` rows; updates job to `APPROVED`.        |
| POST   | `/ingest/jobs/:id/reject`         | ADMIN, STAFF    | path: `id`                                     | Marks job as `REJECTED`.                                                 |

## `/users`

| Method | Path              | Roles  | Body / Params                                       | Purpose                          |
|--------|-------------------|--------|-----------------------------------------------------|----------------------------------|
| GET    | `/users`          | ADMIN  | query: `search?`, `role?`, `page?`, `limit?`        | List org users.                  |
| POST   | `/users`          | ADMIN  | `{ email, name, password, role }`                   | Direct create (no invite flow).  |
| PUT    | `/users/:id`      | ADMIN  | `{ name?, role?, password? }`                       | Update.                          |
| DELETE | `/users/:id`      | ADMIN  | path: `id`                                          | Delete.                          |

## `/orgs`

| Method | Path                                    | Roles    | Body / Params                  | Purpose                                                                       |
|--------|-----------------------------------------|----------|--------------------------------|-------------------------------------------------------------------------------|
| GET    | `/orgs/:id`                             | any auth | path: `id`                     | Org details (members of the org only — `forOrg(orgId)` makes others 404).     |
| PATCH  | `/orgs/:id`                             | ADMIN    | `{ name }`                     | Rename.                                                                       |
| DELETE | `/orgs/:id`                             | ADMIN    | path: `id`                     | Delete the organization (cascades to invites; other rows by app convention).  |
| POST   | `/orgs/:id/invites`                     | ADMIN    | `{ email?, role, expiresInDays? }` | Mint a hashed, expiring, single-use invite token. Returns the raw token once.|
| GET    | `/orgs/:id/invites`                     | ADMIN    | —                              | List active and expired invites.                                              |
| DELETE | `/orgs/:id/invites/:inviteId`           | ADMIN    | path: `inviteId`               | Revoke (delete) an invite.                                                    |

## `/transactions`

| Method | Path                  | Roles            | Body / Params                                                                              | Purpose                                                  |
|--------|-----------------------|------------------|--------------------------------------------------------------------------------------------|----------------------------------------------------------|
| GET    | `/transactions`       | ADMIN, STAFF    | query: `type?`, `memberName?`, `bookTitle?`, `processedBy?`, `from?`, `to?`, `page?`, `limit?` | Audit/transaction log used by reports + circulation history. |

## `/health`

| Method | Path              | Auth     | Purpose                                          |
|--------|-------------------|----------|--------------------------------------------------|
| GET    | `/health`         | public   | Liveness — always 200 if the process is up.      |
| GET    | `/health/ready`   | public   | Readiness — runs `SELECT 1` on PostgreSQL.       |

## `/__test__` *(non-production only)*

| Method | Path                  | Auth    | Purpose                                                                  |
|--------|-----------------------|---------|--------------------------------------------------------------------------|
| POST   | `/__test__/reset`     | public  | Re-seeds the database. **Not mounted when `NODE_ENV === 'production'`.** |

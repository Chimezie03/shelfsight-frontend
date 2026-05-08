# 06 · Database — Schema Detail

Full reference for every column, index, and enum in
`shelfsight-backend/prisma/schema.prisma`. The graphical view of the same
information lives in [05 · ERD](./05-database-erd.md).

The data store is **PostgreSQL 16**, accessed via Prisma 5. Trigram (`gin_trgm_ops`)
indexes power case-insensitive substring search on titles, authors, member
names, and book titles in the transaction log. The `pg_trgm` extension is
required.

---

## Enums

```prisma
enum Role            { ADMIN | STAFF | PATRON }
enum CopyStatus      { AVAILABLE | CHECKED_OUT | LOST | PROCESSING }
enum CopyEventType   { CHECKED_OUT | RETURNED | SHELVED | MOVED | MARKED_LOST | MARKED_PROCESSING }
enum FineStatus      { UNPAID | PAID | WAIVED }
enum TransactionType { CHECKOUT | CHECKIN | RENEWAL | FINE_PAID | FINE_WAIVED }
enum IngestionStatus { PENDING | PROCESSING | COMPLETED | FAILED | APPROVED | REJECTED }
```

---

## `Organization`

The tenant root. Every other business row is owned by exactly one `Organization`.

| Column      | Type     | Notes              |
|-------------|----------|--------------------|
| `id`        | uuid     | PK, default uuid() |
| `name`      | string   |                    |
| `slug`      | string   | **unique**         |
| `createdAt` | datetime | default `now()`    |

---

## `User`

| Column           | Type     | Notes                                                |
|------------------|----------|------------------------------------------------------|
| `id`             | uuid     | PK                                                   |
| `email`          | string   | normalised on input (`lib/email.ts`)                 |
| `passwordHash`   | string   | bcryptjs, salt rounds = **12**                       |
| `name`           | string   |                                                      |
| `role`           | `Role`   | one of ADMIN / STAFF / PATRON                        |
| `organizationId` | uuid     | FK → Organization                                    |
| `createdAt`      | datetime | default `now()`                                      |

**Indexes:**
- `(organizationId, email)` — **unique** (composite — same email may exist in another org).
- `(organizationId)`
- `(name)` GIN with `gin_trgm_ops` — substring search on member name.

---

## `PasswordResetToken`

| Column      | Type     | Notes                                                       |
|-------------|----------|-------------------------------------------------------------|
| `id`        | uuid     | PK                                                          |
| `tokenHash` | string   | **unique** — SHA-256 of the raw token                       |
| `userId`    | uuid     | FK → User, `onDelete: Cascade`                              |
| `expiresAt` | datetime | 1 hour after creation (`auth.service.ts`)                    |
| `usedAt`    | datetime | nullable — set on successful reset to prevent reuse         |
| `createdAt` | datetime | default `now()`                                             |

**Indexes:** `(userId)`, `(expiresAt)`.

When a fresh reset is requested for a user, all of their existing un-used
tokens are marked `usedAt = now()` (`requestPasswordReset` —
`auth.service.ts:334`).

---

## `Invite`

| Column           | Type     | Notes                                          |
|------------------|----------|------------------------------------------------|
| `id`             | uuid     | PK                                             |
| `organizationId` | uuid     | FK → Organization, `onDelete: Cascade`         |
| `email`          | string   | nullable — null means "anyone who has the link" |
| `role`           | `Role`   | the role the new user will be assigned         |
| `tokenHash`      | string   | **unique** — SHA-256 of the raw invite token   |
| `expiresAt`      | datetime |                                                |
| `acceptedAt`     | datetime | nullable — set on successful redemption (one-time use) |
| `acceptedUserId` | uuid     | nullable — set when redeemed                   |
| `createdById`    | uuid     | the admin who issued the invite                |
| `createdAt`      | datetime | default `now()`                                |

**Indexes:** `(organizationId, createdAt)`, `(expiresAt)`.

---

## `Book`

| Column           | Type     | Notes                                          |
|------------------|----------|------------------------------------------------|
| `id`             | uuid     | PK                                             |
| `title`          | string   |                                                |
| `author`         | string   |                                                |
| `isbn`           | string   | required                                       |
| `genre`          | string   | nullable                                       |
| `deweyDecimal`   | string   | nullable — typically suggested by ingestion AI |
| `language`       | string   | default `"English"`                            |
| `coverImageUrl`  | string   | nullable                                       |
| `publishYear`    | string   | nullable                                       |
| `pageCount`      | int      | nullable                                       |
| `organizationId` | uuid     | FK                                             |
| `createdAt`      | datetime | default `now()`                                |

**Indexes:**
- `(organizationId, isbn)` — **unique**
- `(organizationId)`, `(createdAt)`, `(language)`, `(genre)`
- `(title)` GIN trigram, `(author)` GIN trigram — full-text-ish search.

---

## `BookCopy`

A physical copy of a book. The thing you actually scan, shelve, and lend.

| Column           | Type           | Notes                                                       |
|------------------|----------------|-------------------------------------------------------------|
| `id`             | uuid           | PK                                                          |
| `bookId`         | uuid           | FK → Book                                                   |
| `barcode`        | string         | required                                                    |
| `status`         | `CopyStatus`   | default `AVAILABLE`                                         |
| `shelfId`        | uuid           | FK → ShelfSection, nullable (e.g. while `CHECKED_OUT`)      |
| `shelfTier`      | int            | nullable — vertical tier within the shelf                   |
| `shelfSlot`      | int            | nullable — 1-based slot within the tier (for map ordering)  |
| `organizationId` | uuid           | FK                                                          |

**Indexes:**
- `(organizationId, barcode)` — **unique**
- `(organizationId)`, `(bookId)`, `(shelfId)`

State transitions for `status` are documented in
[09 · Loan Lifecycle](./09-loan-lifecycle.md).

---

## `BookCopyEvent`

Append-only audit log keyed off the parent `BookCopy`. Never updated.

| Column       | Type            | Notes                                          |
|--------------|-----------------|------------------------------------------------|
| `id`         | uuid            | PK                                             |
| `bookCopyId` | uuid            | FK                                             |
| `type`       | `CopyEventType` |                                                |
| `userId`     | uuid            | nullable — who performed the action            |
| `shelfId`    | uuid            | nullable — relevant when `SHELVED` or `MOVED`  |
| `loanId`     | uuid            | nullable — relevant when `CHECKED_OUT` or `RETURNED` |
| `note`       | string          | nullable                                       |
| `createdAt`  | datetime        | default `now()`                                |

**Indexes:** `(bookCopyId, createdAt)`.

> Note: `BookCopyEvent` is intentionally **not** scoped via `forOrg()`
> (`lib/prisma.ts`) because tenancy is implied by the parent `BookCopy`. It
> uses the un-scoped `prisma` client.

---

## `Loan`

| Column           | Type      | Notes                                              |
|------------------|-----------|----------------------------------------------------|
| `id`             | uuid      | PK                                                 |
| `userId`         | uuid      | FK → User                                          |
| `bookCopyId`     | uuid      | FK → BookCopy                                      |
| `checkedOutAt`   | datetime  | default `now()`                                    |
| `dueDate`        | datetime  | default `now() + 14 days` (configurable per loan)  |
| `returnedAt`     | datetime  | nullable — set on check-in                         |
| `fineAmount`     | float     | default 0; calculated at check-in                  |
| `organizationId` | uuid      | FK                                                 |

**Indexes:**
- `(organizationId)`
- `(userId, checkedOutAt)` — patron loan history.
- `(bookCopyId, returnedAt)` — find active loan for a copy.
- `(returnedAt, dueDate)` — overdue queries.

**Fine calculation** (`loans.service.ts:103`):
```
overdueDays = ceil((now - dueDate) / 1 day)
fineAmount  = min(overdueDays × $0.25, $25.00)
```

---

## `Fine`

| Column           | Type         | Notes                                          |
|------------------|--------------|------------------------------------------------|
| `id`             | uuid         | PK                                             |
| `loanId`         | uuid         | FK → Loan                                      |
| `userId`         | uuid         | denormalised for fast "fines by user" queries  |
| `amount`         | float        | dollars                                        |
| `status`         | `FineStatus` | default `UNPAID`                               |
| `reason`         | string       | default `"Overdue"`                            |
| `paidAt`         | datetime     | nullable                                       |
| `waivedBy`       | uuid         | nullable — staff/admin who waived              |
| `organizationId` | uuid         | FK                                             |
| `createdAt`      | datetime     | default `now()`                                |

**Indexes:** `(organizationId)`, `(userId, status)`, `(loanId)`, `(createdAt)`.

---

## `TransactionLog`

A denormalised, human-readable audit stream of business events. Used by the
Reports and Circulation history pages.

| Column           | Type              | Notes                                |
|------------------|-------------------|--------------------------------------|
| `id`             | uuid              | PK                                   |
| `type`           | `TransactionType` |                                      |
| `loanId`         | uuid              | nullable                             |
| `bookTitle`      | string            | denormalised (snapshot at the event) |
| `memberName`     | string            | denormalised                         |
| `memberNumber`   | string            | currently the member's email         |
| `processedBy`    | string            | name of the staff member             |
| `details`        | string            | freeform — e.g. fine amount, due date|
| `organizationId` | uuid              | FK                                   |
| `createdAt`      | datetime          | default `now()`                      |

**Indexes:**
- `(organizationId)`, `(createdAt)`, `(type, createdAt)`
- `(bookTitle)` GIN trigram, `(memberName)` GIN trigram — search the audit log.

---

## `ShelfSection`

A 2-D rectangle on the floor map. Holds copies in tiers and slots.

| Column            | Type     | Notes                                                       |
|-------------------|----------|-------------------------------------------------------------|
| `id`              | uuid     | PK                                                          |
| `label`           | string   | shown on the map                                            |
| `mapX` / `mapY`   | int      | top-left coordinates (pixel-ish)                            |
| `width` / `height`| int      |                                                             |
| `floor`           | int      | 1, 2, …                                                     |
| `sectionCode`     | string   | nullable                                                    |
| `category`        | string   | default `"Uncategorized"`                                   |
| `deweyRangeStart` / `deweyRangeEnd` | string | nullable — used by placement hints      |
| `numberOfTiers`   | int      | default `4`                                                 |
| `capacityPerTier` | int      | default `30`                                                |
| `tierCapacities`  | json     | nullable — per-tier override (array of positive ints)       |
| `color`           | string   | default `"#1B2A4A"` (brand navy)                            |
| `rotation`        | int      | default `0` (degrees)                                       |
| `notes`           | string   | nullable                                                    |
| `shelfType`       | string   | default `"single-shelf"`                                    |
| `organizationId`  | uuid     | FK                                                          |

**Indexes:** `(organizationId)`, `(floor)`.

---

## `IngestionJob`

A single AI book-extraction attempt. The state of the pipeline is captured
here so a reviewer can come back later, a Lambda can update the row
asynchronously, or a failed job can be re-attempted.

| Column                | Type              | Notes                                                |
|-----------------------|-------------------|------------------------------------------------------|
| `id`                  | uuid              | PK                                                   |
| `imageUrl`            | string            | Object Storage URL of the uploaded image             |
| `status`              | `IngestionStatus` | default `PENDING`                                    |
| `ocrText`             | string            | nullable — concatenated `LINE` blocks from OCR       |
| `detectedIsbn`        | string            | nullable — first ISBN matching regex + checksum     |
| `suggestedDewey`      | string            | nullable — e.g. `"813.54"`                           |
| `confidenceScore`     | float             | nullable — 0..1 from the LLM                         |
| `suggestedTitle/Author/Publisher/PublishDate/Genre` | string | nullable                          |
| `coverImageUrl`       | string            | nullable — final cover URL after metadata enrichment |
| `metadataSource`      | string            | e.g. `"openlibrary"` / `"google_books"` / `"ocr"`    |
| `deweyReasoning`      | string            | nullable — LLM's explanation                         |
| `language`            | string            | nullable                                             |
| `reviewedBy`          | uuid              | nullable — set on approve/reject                     |
| `reviewedAt`          | datetime          | nullable                                             |
| `createdBookId`       | uuid              | nullable — set on approve, points at the new Book    |
| `organizationId`      | uuid              | FK                                                   |
| `createdAt`           | datetime          | default `now()`                                      |

**Indexes:** `(organizationId)`, `(createdAt)`, `(status, createdAt)`.

The state machine and full pipeline are documented in
[08 · AI Ingestion Pipeline](./08-ai-ingestion-pipeline.md).

---

## Schema design notes

- **`organizationId` everywhere** — every tenant-owned table carries it,
  and most uniques are composite with it. Enforced at runtime via
  `forOrg(orgId)` (`lib/prisma.ts`). See [10 · Multi-Tenancy](./10-multi-tenancy.md).
- **`BookCopyEvent` is immutable** — only inserted, never updated/deleted.
  This gives you an unfalsifiable history of every copy.
- **`TransactionLog` is denormalised** — fields like `bookTitle` and
  `memberName` are snapshotted so historical reports stay correct even if
  the source rows are renamed or deleted later.
- **Two audit streams** — `BookCopyEvent` is per-copy (low-level),
  `TransactionLog` is per-business-event (high-level). They're complementary,
  not redundant.
- **GIN trigram indexes** for substring search avoid having to add a
  full-text-search engine.
- **Soft delete is not used** — when a row is deleted, it's gone. Audit
  trails (`BookCopyEvent`, `TransactionLog`) preserve enough denormalised
  history that reports keep working.

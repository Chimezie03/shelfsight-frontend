# 09 · Loan Lifecycle

This is the core circulation flow. A `BookCopy` (a physical book) moves
between four states. Each transition is recorded in two audit streams: a
low-level `BookCopyEvent` (per-copy timeline) and a high-level
`TransactionLog` (per-business-event report).

Source: `shelfsight-backend/src/services/loans.service.ts`,
`shelfsight-backend/src/controllers/loans.controller.ts`,
`shelfsight-backend/src/routes/loans.ts`.

---

## `BookCopy.status` state machine

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE: created (post-ingestion approve)
    AVAILABLE --> CHECKED_OUT: POST /loans/checkout\nrequireRole(ADMIN, STAFF)
    CHECKED_OUT --> AVAILABLE: POST /loans/checkin\nrequireRole(ADMIN, STAFF)

    AVAILABLE --> PROCESSING: marked for re-shelving / repair
    PROCESSING --> AVAILABLE: re-shelved\nPOST /loans/copies/:copyId/shelve

    AVAILABLE --> LOST: marked lost
    CHECKED_OUT --> LOST: marked lost
    PROCESSING --> LOST: marked lost
    LOST --> [*]: removed from circulation

    AVAILABLE --> AVAILABLE: shelve / move\n(fires SHELVED or MOVED event)
```

> `LOST` and `PROCESSING` are reachable today through admin/staff actions
> that update `BookCopy.status` directly and emit a `MARKED_LOST` /
> `MARKED_PROCESSING` `BookCopyEvent`.

### `BookCopyEvent.type` ↔ transitions

| From → To                     | Trigger                              | Emits `BookCopyEvent.type`           |
|-------------------------------|--------------------------------------|--------------------------------------|
| `AVAILABLE → CHECKED_OUT`     | `POST /loans/checkout`               | `CHECKED_OUT`                        |
| `CHECKED_OUT → AVAILABLE`     | `POST /loans/checkin`                | `RETURNED`                           |
| any → `AVAILABLE` w/ shelf    | `POST /loans/copies/:id/shelve` (first time)   | `SHELVED`                  |
| any → `AVAILABLE` w/ shelf    | `POST /loans/copies/:id/shelve` (already shelved) | `MOVED`                  |
| any → `LOST`                  | admin/staff action                   | `MARKED_LOST`                        |
| any → `PROCESSING`            | admin/staff action                   | `MARKED_PROCESSING`                  |

---

## Checkout sequence

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff
    participant FE as Frontend (Circulation · Checkout tab)
    participant BE as Express
    participant Svc as loans.service<br/>checkoutService()
    participant DB as PostgreSQL

    S->>FE: scan barcode → resolve copy<br/>+ select patron + due days
    FE->>BE: POST /api/loans/checkout { userId, bookCopyId, dueDays? }
    BE->>BE: requireAuth + requireRole('ADMIN','STAFF')
    BE->>Svc: checkoutService(orgId, userId, bookCopyId, dueDays)

    Svc->>DB: forOrg(orgId).bookCopy.findFirst({ id })
    alt copy not found
        Svc-->>BE: throw 404 NOT_FOUND
    else copy.status ≠ AVAILABLE
        Svc-->>BE: throw 409 RESOURCE_UNAVAILABLE
    end

    Svc->>Svc: dueDate = now + (dueDays ?? 14)

    rect rgba(196,149,106,0.15)
    Svc->>DB: $transaction
    Note right of DB: 1. loan.create({ userId, bookCopyId, dueDate })<br/>2. bookCopy.update({ status: CHECKED_OUT, shelfId: null })<br/>3. bookCopyEvent.create({ type: CHECKED_OUT, userId })
    DB-->>Svc: loan (with user + bookCopy + book)
    end

    Svc->>DB: createTransaction({ type: CHECKOUT, loanId, bookTitle, memberName, … })
    Svc-->>BE: mapped loan response
    BE-->>FE: 200 { loan }
    FE->>S: success toast, due date displayed
```

**Default loan length:** 14 days (`DEFAULT_LOAN_DAYS = 14`).

---

## Check-in sequence (with overdue fine)

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff
    participant FE as Frontend (Circulation · Check-in tab)
    participant BE as Express
    participant Svc as loans.service<br/>checkinService()
    participant DB as PostgreSQL

    S->>FE: scan returned book → resolve loanId
    FE->>BE: POST /api/loans/checkin { loanId }
    BE->>BE: requireAuth + requireRole('ADMIN','STAFF')
    BE->>Svc: checkinService(orgId, loanId)

    Svc->>DB: forOrg(orgId).loan.findFirst({ id })
    alt not found / already returned
        Svc-->>BE: throw 404 NOT_FOUND or 409 ALREADY_RETURNED
    end

    Svc->>Svc: now = new Date()
    alt now > loan.dueDate
        Svc->>Svc: overdueDays = ceil((now − dueDate) / 1 day)
        Svc->>Svc: fineAmount = min(overdueDays × $0.25, $25.00)
    else on time
        Svc->>Svc: fineAmount = 0
    end

    rect rgba(196,149,106,0.15)
    Svc->>DB: $transaction
    Note right of DB: 1. loan.update({ returnedAt: now, fineAmount })<br/>2. bookCopy.update({ status: AVAILABLE })<br/>3. bookCopyEvent.create({ type: RETURNED, userId, loanId })<br/>4. (if fine > 0) fine.create({ amount, status: UNPAID, reason: 'Overdue' })
    DB-->>Svc: updated loan
    end

    Svc->>DB: createTransaction({ type: CHECKIN, details: 'Returned X days late, $Y fine'})
    Svc-->>BE: mapped loan response
    BE-->>FE: 200 { loan }
```

### Fine calculation

```ts
// shelfsight-backend/src/services/loans.service.ts
const DEFAULT_LOAN_DAYS = 14;
const FINE_PER_DAY = 0.25;
const MAX_FINE_PER_ITEM = 25.0;

const overdueDays = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
const fineAmount  = Math.min(parseFloat((overdueDays * FINE_PER_DAY).toFixed(2)), MAX_FINE_PER_ITEM);
```

So a book returned 100 days late still incurs only `$25.00`, not `$25.00`
× n.

### Fine resolution

A `Fine` row begins life as `UNPAID`. From there:
- `POST /fines/:fineId/pay` — any authenticated user (typically the patron paying their own fine).
- `POST /fines/:fineId/waive` — `ADMIN` or `STAFF` only.

Both transitions are irreversible (no reset back to `UNPAID`).

---

## Listing loans

`GET /loans` accepts:

| Query param | Values                            | Notes                                                        |
|-------------|-----------------------------------|--------------------------------------------------------------|
| `status`    | `active` / `returned` / `overdue` | `overdue` = `returnedAt is null AND dueDate < now`           |
| `userId`    | uuid                              | Admin/staff filter; patrons are scoped to their own loans by the controller. |
| `search`    | string                            | Substring search across user name/email, copy barcode, book title/author/ISBN. |
| `page`, `limit` | int                           | Default 1, 20.                                               |

The result is mapped to a stable response shape (`mapLoanResponse`) that
includes both `checkedOutAt` / `checkoutDate` aliases and an `isOverdue`
boolean computed at read-time so the UI doesn't have to.

---

## Other copy operations

| Endpoint                                        | Role                      | Effect                                                |
|-------------------------------------------------|---------------------------|-------------------------------------------------------|
| `GET /loans/copies/:copyId/location`            | any auth                  | Current shelf + active loan info.                     |
| `GET /loans/copies/:copyId/history`             | any auth                  | Paginated `BookCopyEvent` audit log.                  |
| `POST /loans/copies/:copyId/shelve`             | ADMIN / STAFF             | Place a copy on a shelf (emits `SHELVED` or `MOVED`). |

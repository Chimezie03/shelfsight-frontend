# 05 · Database — Entity Relationship Diagram

The data model. All 12 Prisma models and their relationships, from
`shelfsight-backend/prisma/schema.prisma` (296 lines, 15 migrations as of
this writing).

> For full field types, indexes, and enum members see
> [06 · Schema Detail](./06-database-schema-detail.md).

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER                : "has"
    ORGANIZATION ||--o{ INVITE              : "has"
    ORGANIZATION ||--o{ BOOK                : "owns"
    ORGANIZATION ||--o{ BOOK_COPY           : "owns"
    ORGANIZATION ||--o{ LOAN                : "owns"
    ORGANIZATION ||--o{ FINE                : "owns"
    ORGANIZATION ||--o{ TRANSACTION_LOG     : "owns"
    ORGANIZATION ||--o{ SHELF_SECTION       : "owns"
    ORGANIZATION ||--o{ INGESTION_JOB       : "owns"

    USER         ||--o{ LOAN                  : "borrows"
    USER         ||--o{ PASSWORD_RESET_TOKEN  : "issues"

    BOOK         ||--o{ BOOK_COPY             : "has copies"

    BOOK_COPY    ||--o{ LOAN                  : "is loaned in"
    BOOK_COPY    ||--o{ BOOK_COPY_EVENT       : "audit"
    SHELF_SECTION o|--o{ BOOK_COPY            : "shelves"

    LOAN         ||--o{ FINE                  : "may incur"

    INGESTION_JOB }o--o| BOOK                 : "creates on approve"

    ORGANIZATION {
        uuid id PK
        string name
        string slug UK
        datetime createdAt
    }

    USER {
        uuid id PK
        string email
        string passwordHash
        string name
        Role role "ADMIN | STAFF | PATRON"
        uuid organizationId FK
        datetime createdAt
    }

    PASSWORD_RESET_TOKEN {
        uuid id PK
        string tokenHash UK
        uuid userId FK
        datetime expiresAt
        datetime usedAt "nullable"
        datetime createdAt
    }

    INVITE {
        uuid id PK
        uuid organizationId FK
        string email "nullable"
        Role role
        string tokenHash UK
        datetime expiresAt
        datetime acceptedAt "nullable"
        uuid acceptedUserId "nullable"
        uuid createdById
        datetime createdAt
    }

    BOOK {
        uuid id PK
        string title
        string author
        string isbn "unique per org"
        string genre "nullable"
        string deweyDecimal "nullable"
        string language "default English"
        string coverImageUrl "nullable"
        string publishYear "nullable"
        int pageCount "nullable"
        uuid organizationId FK
        datetime createdAt
    }

    BOOK_COPY {
        uuid id PK
        uuid bookId FK
        string barcode "unique per org"
        CopyStatus status "AVAILABLE | CHECKED_OUT | LOST | PROCESSING"
        uuid shelfId FK "nullable"
        int shelfTier "nullable"
        int shelfSlot "nullable, 1-based"
        uuid organizationId FK
    }

    BOOK_COPY_EVENT {
        uuid id PK
        uuid bookCopyId FK
        CopyEventType type "CHECKED_OUT | RETURNED | SHELVED | MOVED | MARKED_LOST | MARKED_PROCESSING"
        uuid userId "nullable"
        uuid shelfId "nullable"
        uuid loanId "nullable"
        string note "nullable"
        datetime createdAt
    }

    LOAN {
        uuid id PK
        uuid userId FK
        uuid bookCopyId FK
        datetime checkedOutAt "default now"
        datetime dueDate
        datetime returnedAt "nullable"
        float fineAmount "default 0"
        uuid organizationId FK
    }

    FINE {
        uuid id PK
        uuid loanId FK
        uuid userId
        float amount
        FineStatus status "UNPAID | PAID | WAIVED"
        string reason "default Overdue"
        datetime paidAt "nullable"
        uuid waivedBy "nullable"
        uuid organizationId FK
        datetime createdAt
    }

    TRANSACTION_LOG {
        uuid id PK
        TransactionType type "CHECKOUT | CHECKIN | RENEWAL | FINE_PAID | FINE_WAIVED"
        uuid loanId "nullable"
        string bookTitle
        string memberName
        string memberNumber
        string processedBy
        string details
        uuid organizationId FK
        datetime createdAt
    }

    SHELF_SECTION {
        uuid id PK
        string label
        int mapX
        int mapY
        int width
        int height
        int floor
        string sectionCode "nullable"
        string category "default Uncategorized"
        string deweyRangeStart "nullable"
        string deweyRangeEnd "nullable"
        int numberOfTiers "default 4"
        int capacityPerTier "default 30"
        json tierCapacities "nullable, per-tier overrides"
        string color "default #1B2A4A"
        int rotation "default 0"
        string notes "nullable"
        string shelfType "default single-shelf"
        uuid organizationId FK
    }

    INGESTION_JOB {
        uuid id PK
        string imageUrl
        IngestionStatus status "PENDING | PROCESSING | COMPLETED | FAILED | APPROVED | REJECTED"
        string ocrText "nullable"
        string detectedIsbn "nullable"
        string suggestedDewey "nullable"
        float confidenceScore "nullable"
        string suggestedTitle "nullable"
        string suggestedAuthor "nullable"
        string suggestedPublisher "nullable"
        string suggestedPublishDate "nullable"
        string suggestedGenre "nullable"
        string coverImageUrl "nullable"
        string metadataSource "nullable"
        string deweyReasoning "nullable"
        string language "nullable"
        uuid reviewedBy "nullable"
        datetime reviewedAt "nullable"
        uuid createdBookId "nullable, set on approve"
        uuid organizationId FK
        datetime createdAt
    }
```

## Relationship summary

| From → To                              | Cardinality | Notes                                                     |
|----------------------------------------|-------------|-----------------------------------------------------------|
| `Organization` → most tables           | 1 : N       | Multi-tenant root. Cascade delete via Invite, manual otherwise. |
| `User` → `Loan`                        | 1 : N       | All borrows, historical and active.                       |
| `User` → `PasswordResetToken`          | 1 : N       | `onDelete: Cascade`.                                      |
| `Book` → `BookCopy`                    | 1 : N       | A book may have many physical copies.                     |
| `BookCopy` → `Loan`                    | 1 : N       | A copy can be loaned many times over its life.            |
| `BookCopy` → `BookCopyEvent`           | 1 : N       | Append-only audit trail.                                  |
| `ShelfSection` → `BookCopy`            | 0..1 : N    | A copy may not be shelved (`shelfId` is nullable).        |
| `Loan` → `Fine`                        | 1 : N       | A loan may incur multiple fines (currently one).          |
| `IngestionJob` → `Book`                | 0..1 : 1    | After approval, `createdBookId` points at the new book.   |
| `Invite` → `Organization`              | N : 1       | `onDelete: Cascade` — invites die with their org.         |

## Multi-tenancy via `organizationId`

Every business table carries an `organizationId` column and **most uniques
are composite with `organizationId`**:

| Table         | Composite unique             |
|---------------|------------------------------|
| `User`        | `(organizationId, email)`    |
| `Book`        | `(organizationId, isbn)`     |
| `BookCopy`    | `(organizationId, barcode)`  |

This means an ISBN, email, or barcode that's taken in one org can be reused
in another. See [10 · Multi-Tenancy](./10-multi-tenancy.md) for how the
backend enforces this at runtime via the `forOrg(orgId)` Prisma extension.

# ShelfSight — Architecture Diagrams

Reference documentation for the ShelfSight library management system. Diagrams
are written in **Mermaid** inside Markdown files so they render natively in
GitHub PRs, GitLab MRs, and the VS Code Markdown Preview without any build
step.

The diagrams describe the system as it exists in the source tree — both the
Next.js frontend (this repo) and the Express backend (`shelfsight-backend/`).
Hosting platforms (Vercel, Railway, AWS, etc.) are intentionally **not**
shown — every external dependency is referred to by its generic role
(PostgreSQL, Object Storage, Async Job Queue, OCR Service, LLM Provider) so
the diagrams remain accurate regardless of where the system is deployed.

---

## Index

| #  | File                                                              | What it covers                                                       |
|----|-------------------------------------------------------------------|----------------------------------------------------------------------|
| 01 | [System Context](./01-system-context.md)                          | C4 Level 1 — actors and external systems                             |
| 02 | [System Architecture](./02-system-architecture.md)                | C4 Level 2 — frontend, backend, database, integrations               |
| 03 | [Backend Layers](./03-backend-layers.md)                          | Express request lifecycle: routes → controllers → services → Prisma  |
| 04 | [Frontend Architecture](./04-frontend-architecture.md)            | Next.js App Router, providers, API client, route groups              |
| 05 | [Database ERD](./05-database-erd.md)                              | All 12 Prisma models and their relationships                         |
| 06 | [Database Schema Detail](./06-database-schema-detail.md)          | Full field types, indexes, enums, constraints                        |
| 07 | [Auth Flow](./07-auth-flow.md)                                    | Login, signup, invite acceptance, password reset (sequence diagrams) |
| 08 | [AI Ingestion Pipeline](./08-ai-ingestion-pipeline.md)            | Image upload → OCR → ISBN → metadata → Dewey → review/approve        |
| 09 | [Loan Lifecycle](./09-loan-lifecycle.md)                          | `BookCopy` state machine, checkout/check-in sequences, fine math     |
| 10 | [Multi-Tenancy](./10-multi-tenancy.md)                            | `organizationId` row-level scoping pattern                           |
| 11 | [RBAC Matrix](./11-rbac-matrix.md)                                | Endpoint × role permission table (ADMIN / STAFF / PATRON / public)   |
| 12 | [API Route Map](./12-api-route-map.md)                            | One-page reference of every endpoint, grouped by resource            |

---

## How to read Mermaid

- **GitHub / GitLab** — Mermaid blocks (` ```mermaid ` ) render automatically
  inside the rendered Markdown viewer.
- **VS Code** — open a `.md` file and press `⌘K V` (Mac) / `Ctrl+K V`
  (Windows/Linux) to open the side preview. The built-in preview now ships
  with Mermaid support; older versions need the
  *Markdown Preview Mermaid Support* extension.

If a diagram does not render, it usually means the Markdown viewer doesn't
support Mermaid — copy the block into <https://mermaid.live> for a quick
check.

---

## Glossary

| Term                | Meaning                                                                                                                       |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Organization**    | The top-level tenant. Every business entity (users, books, loans, fines, shelves) is scoped to exactly one organization.      |
| **User**            | A person with a login. One of three roles: `ADMIN`, `STAFF`, or `PATRON`.                                                     |
| **Book**            | A bibliographic record (title, author, ISBN, Dewey, cover URL). One per ISBN per organization.                                |
| **BookCopy**        | A physical copy of a `Book` with a unique barcode and a status (`AVAILABLE`, `CHECKED_OUT`, `LOST`, `PROCESSING`).             |
| **Loan**            | A record of a `BookCopy` being checked out by a `User`. Has a due date, optional return date, and a calculated `fineAmount`.  |
| **Fine**            | An amount owed by a user for an overdue return. `UNPAID` / `PAID` / `WAIVED`. Calculated at $0.25/day, capped at $25.00.       |
| **ShelfSection**    | A 2-D rectangle on the floor map (`mapX`, `mapY`, `width`, `height`, `floor`). Holds copies in tiers and slots.               |
| **Tier / Slot**     | A `ShelfSection` is divided into tiers (vertical levels). Within a tier, copies sit in 1-based slot positions.                |
| **`tierCapacities`**| Optional JSON array overriding `capacityPerTier` so each tier can have its own size without a schema change.                  |
| **Dewey Decimal**   | The classification number that determines where a book lives on the floor. Suggested by the AI ingestion pipeline.            |
| **IngestionJob**    | A row capturing the state of one AI book-extraction attempt: image URL, OCR text, suggestions, status, and reviewer info.     |
| **BookCopyEvent**   | Append-only audit log entry for every state change of a `BookCopy` (`CHECKED_OUT`, `RETURNED`, `SHELVED`, `MOVED`, etc.).      |
| **TransactionLog**  | A separate, denormalised audit stream of business events (CHECKOUT, CHECKIN, RENEWAL, FINE_PAID, FINE_WAIVED) for reporting.   |
| **Invite**          | A hashed, time-bound, single-use token that lets a new user join an existing organization with a pre-assigned role.           |

---

## Future additions

Documentation that may be worth adding when the system grows further:

- **OpenAPI / Swagger spec** — auto-generated from the Express routes so
  request/response shapes stay in sync with the code.
- **ADRs (Architecture Decision Records)** — short notes capturing why
  decisions were made (e.g. why bcryptjs over argon2, why HttpOnly cookies
  over Bearer tokens, why same-origin proxy over CORS).
- **Threat model / security overview** — STRIDE-style review covering rate
  limits, password reset enumeration, JWT revocation, and tenant isolation.
- **Performance / capacity notes** — index usage, hot queries, caching
  strategy, and where N+1 risks live.

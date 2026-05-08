# 10 · Multi-Tenancy

ShelfSight is a **single-database multi-tenant** system. Every business
entity belongs to exactly one `Organization`, and the database enforces
isolation through the `organizationId` column on every tenant-owned table.
A single deliberate Prisma extension — `forOrg(orgId)` — makes that
column impossible to forget at the application layer.

---

## The tenant lane

```mermaid
flowchart TB
    Browser["🌐 Browser"]

    subgraph Cookie["JWT cookie payload"]
        userId
        email
        role
        name
        OID["organizationId ⭐"]
        orgName["organizationName"]
    end

    Browser -- "HTTPS · cookie" --> FE
    FE["Frontend"]
    FE -- "/api/* · cookie carried" --> BE

    subgraph BE["Express request"]
        direction TB
        RA["requireAuth<br/>verifyToken(cookie)<br/>req.user = AuthPayload"]
        Ctrl["Controller<br/>const orgId = req.user.organizationId"]
        Svc["Service<br/>const db = forOrg(orgId)"]
        Pri["forOrg() Prisma extension<br/>injects organizationId into<br/>every where / data clause"]
    end

    BE -- "WHERE organizationId = $orgId<br/>(auto)" --> DB

    subgraph DB[("PostgreSQL")]
        direction TB
        OrgA["Org A rows"]
        OrgB["Org B rows"]
        OrgC["Org C rows"]
    end

    OrgA -.->|invisible to other orgs| OrgB

    classDef hi fill:#C4956A,stroke:#7d5a3a,color:#fff
    class OID hi
    class Pri hi
```

The `organizationId` flows from the JWT cookie into the controller, into
the Prisma client wrapper, into every SQL query — there is no application
code that needs to remember to filter by org.

---

## How `forOrg()` works

`shelfsight-backend/src/lib/prisma.ts` exports a factory that returns a
Prisma client extended with a `query.$allModels.$allOperations` hook:

```ts
const SCOPED_MODELS = new Set([
  'User', 'Book', 'BookCopy', 'Loan', 'Fine',
  'TransactionLog', 'ShelfSection', 'IngestionJob', 'Invite',
]);

export function forOrg(organizationId: string) {
  return base.$extends({
    name: 'orgScope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SCOPED_MODELS.has(model)) return query(args);

          // Reads, writes, and findUnique → add organizationId to where
          // Creates / upserts → add organizationId to data
          // createMany → add organizationId to every element
          // (full implementation in src/lib/prisma.ts)
        },
      },
    },
  });
}
```

For every operation against a scoped model:

| Operation                                                    | What gets injected                       |
|--------------------------------------------------------------|------------------------------------------|
| `findFirst`, `findFirstOrThrow`, `findMany`, `count`, `aggregate`, `groupBy` | `where.organizationId = orgId` |
| `findUnique`, `findUniqueOrThrow`                            | `where.organizationId = orgId`           |
| `update`, `updateMany`, `delete`, `deleteMany`               | `where.organizationId = orgId`           |
| `create`                                                     | `data.organizationId = orgId`            |
| `upsert`                                                     | `create.organizationId = orgId` + `where.organizationId = orgId` |
| `createMany`                                                 | `data[*].organizationId = orgId`         |

Models **not** in `SCOPED_MODELS` (`Organization`, `BookCopyEvent`,
`PasswordResetToken`) are never modified — they're either the tenant root
itself or implicitly tenanted via a parent FK.

---

## When to use `forOrg(orgId)` vs the un-scoped `prisma`

| Use `forOrg(req.user.organizationId)`                                                | Use the un-scoped `prisma` export                                          |
|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Any request running on behalf of an authenticated user (the default for controllers). | Login lookup (don't know the org until you have the user).                 |
| Anything in a service called from inside a controller.                                | Signup (org is being created in this request).                             |
| Reading or writing tenant data.                                                       | `BookCopyEvent` writes — tenancy comes from the parent `BookCopy` row.     |
|                                                                                       | Seed scripts, migrations, admin scripts.                                   |

---

## Composite uniques

The schema enforces tenant separation **at the database level** by making
human-meaningful uniques composite with `organizationId`:

| Table         | Old unique (single-tenant) | Current unique (multi-tenant) |
|---------------|----------------------------|-------------------------------|
| `User.email`  | global                     | `(organizationId, email)`     |
| `Book.isbn`   | global                     | `(organizationId, isbn)`      |
| `BookCopy.barcode` | global                | `(organizationId, barcode)`   |

This is what migrations `20260428154449_multitenancy_phase1_add_columns`
and `20260428154500_multitenancy_phase2_lock_constraints` did to the
schema. The same email or barcode can now legitimately exist in two
different organizations without collision.

---

## What's not yet enforced

There are a few places where org isolation is enforced **only** by
`forOrg(orgId)` and the application code, not by Postgres-level row
security policies:

- A bug in the backend that bypassed `forOrg(orgId)` (e.g. by using the
  un-scoped `prisma` export and forgetting to add `organizationId`) would
  let one org read another's data. There are no Postgres `ROW LEVEL
  SECURITY` policies as a second line of defence.
- `BookCopyEvent` has no `organizationId` column. Tenancy is implied by
  the parent `BookCopy`, but a query that reads events directly would not
  be auto-scoped.
- Cross-org email reuse is allowed at the schema level but explicitly
  refused at signup (see `auth.service.ts:165` —
  `existing = prisma.user.findFirst({ where: { email } })`). This is
  because `findFirst({ email })` is used at login to look up a user, and a
  duplicate email across orgs would make login by email ambiguous.

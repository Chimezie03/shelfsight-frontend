# ShelfSight

**Week 11 | April 28, 2026 - April 21, 2026**

**Leader:** Syed Hasan
---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed:** |
| | • Improved the bulk upload workflow. Built the backend functionality (`POST /books/bulk-file`) utilizing `multer` and `xlsx` to parse spreadsheet rows into recognizable library metadata directly from the frontend request. |
| | • Engineered the backend to be more efficient with the grouping for bulk upload |
| | • Authored `docs/task1pt2/README.md` to document the bulk scale constraints, technical approaches, and execution strategies. |
| | • Optimized the backend bulk insertion process to handle 10k+ rows by splitting the operations into batches of 500. Substituted individual transactions for 4 highly optimized SQL batch queries (`findMany` constraints, `createMany` records/copies, and arrayed `$transaction` upserts), which resolved a critical 2.5-minute timeout issue and reduced ingestion time to seconds. |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • do more rigorous testing to ensure no faults |
| | **Any issues or challenges:** |
| | • na |

---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed (Task 2 – Multi-Tenancy / KAN-45):** |
| | • Designed and shipped end-to-end **multi-organization data isolation** so each library's catalog, members, loans, fines, ingestion jobs, and shelf layout are invisible to other orgs in the same deployment. |
| | • Added `Organization` + `Invite` models and an `organizationId` FK on `User`, `Book`, `BookCopy`, `Loan`, `Fine`, `TransactionLog`, `ShelfSection`, and `IngestionJob`. Replaced the single-column `email` / `isbn` / `barcode` uniques with composite `(organizationId, *)` uniques so the same email/ISBN/barcode can legitimately exist across orgs. |
| | • Implemented a **two-phase Prisma migration** that is safe over existing prod data: phase 1 adds nullable columns + backfills every legacy row into a default `ShelfSight Library` org; phase 2 flips the columns to `NOT NULL` and swaps in the composite unique indexes. Reversible if anything goes sideways during deploy. |
| | • Built a `forOrg(organizationId)` Prisma `$extends` factory in `src/lib/prisma.ts` that auto-injects `organizationId` into every read/update/delete `where` clause and every create/upsert/createMany payload — services can no longer accidentally leak across orgs. |
| | • Extended the JWT payload to carry `organizationId` + `organizationName`, augmented `Express.Request` typings, and refactored every tenant service (users, books, loans, fines, transactions, map, ingest) to take `organizationId` as the first argument. Added a last-admin guard so an org cannot be left without an ADMIN. |
| | • New auth endpoints: `POST /auth/signup` (atomically creates `Organization` + first ADMIN user in a single transaction), `POST /auth/accept-invite`, and `GET /auth/invites/:token` (no-auth preview for the invitee). Invite tokens are 32-byte base64url strings stored only as sha256 hashes with a 7-day TTL. |
| | • Added `POST/GET/DELETE /orgs/:id/invites` (admin-only, with cross-org access guard) plus a complete invites service. |
| | • Frontend: extended `AuthUser` with org context, added `/signup` and `/invite/[token]` pages, surfaced an "Invite via link" button on the Members page that copies the URL to clipboard, and showed the active org name in the sidebar header. |
| | • Smoke-tested locally end-to-end: admin login returns org context with seeded books; self-serve signup creates a new org with zero books (cross-org isolation verified); invite generation, public preview, and acceptance flow all work; cross-org invite creation correctly blocked with 403. |
| | • Updated all 21 backend unit tests to mock `forOrg`. Full suite green; no TypeScript errors on either repo. |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Finishing touches |
| | **Any issues or challenges:** |
| | • The two-phase migration pattern was needed because the composite unique indexes can't be created until the FK column is `NOT NULL`, but the column can't be `NOT NULL` until the legacy data is backfilled. Splitting it lets phase 1 ship reversibly and phase 2 only run once phase 1's backfill is verified. |
| | • Email is no longer globally unique, so login switched from `findUnique` to `findFirst` against the unscoped client (org is unknown at login time). Documented the long-term `email + orgSlug` disambiguation TODO inline. |
| | • Supabase's pgbouncer pooler on port 6543 breaks `prisma migrate deploy` due to prepared-statement reuse — direct port 5432 is required for migrations. Captured in the deploy runbook so the next person doesn't lose 20 minutes to it. |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed (Task 5 – Final Report, Analytics & Submission Readiness):** |
| | • Finalized the comprehensive **project report**, consolidating CI/CD pipelines, testing results (k6 + Playwright), scalability improvements, and system limitations into a single structured deliverable. |
| | • Integrated outputs from all prior tasks (bulk upload scaling, load testing, security, and testing) into a cohesive, presentation-ready narrative aligned with project requirements. |
| | • Added **basic analytics features**, including catalog usage insights and circulation trend tracking to strengthen product value and demonstrate real-world applicability. |
| | • Organized all **project artifacts** (weekly reports, MOMs, GitHub repositories, documentation, and demo assets) to ensure completeness and submission readiness. |
| | • Prepared **final presentation materials**, including system walkthrough, architecture explanation, and key performance highlights (latency, throughput, and reliability metrics). |
| | • Reviewed and validated all **core system flows** (auth, catalog, search, circulation, ingestion, RBAC) in a production-like setup to ensure end-to-end readiness. |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • Deliver final presentation and walkthrough |
| | • Support any last-minute fixes or clarifications during evaluation |
| | **Any issues or challenges:** |
| | • Ensuring consistency across multiple documents and aligning technical outputs from different tasks into one unified report required careful consolidation and validation |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed (Security & Deployment Readiness):** |
| | • Enforced RBAC on all endpoints — checkout/checkin/shelve restricted to ADMIN/STAFF; waive fines restricted to ADMIN/STAFF; transaction audit log restricted to ADMIN/STAFF. |
| | • Fixed patron data-scoping on `GET /loans` and `GET /fines` to prevent horizontal privilege escalation. |
| | • Added startup validation for required env vars (`DATABASE_URL`, `JWT_SECRET`). |
| | • Replaced abandoned `xlsx` package (high-severity CVE) with `exceljs`. |
| | • Regenerated Prisma client to fix pre-existing TS build errors. |
| | • Fixed Render build failure (missing `env.ts` module) and Vercel build failure (`serverActions` placement in `next.config.ts`). |
| | • Fixed frontend Waive button visibility for STAFF role. |
| | • 21/21 backend tests passing, zero TypeScript errors. |
| **Time Spent:** 14 hours | **Planned tasks for next week:** |
| | • N/A — final week |
| | **Any issues or challenges:** |
| | • `xlsx` replacement required rewriting the file-parsing logic due to API differences with `exceljs`. |
| | • Env validation file was not tracked in git, causing the Render build to fail. |

---

| Name | Details |
|------|---------|
| **Chimezie Nnawuihe** | **Tasks completed:** |
| | • Completed Task 4 k6 load testing after data scaling with comparative runs at 45, 90, and 135 VUs. |
| | • Added heavier k6 concurrency profiles to expand testing beyond the original baseline. |
| | • Completed Task 4 documentation covering execution results, summaries, and performance findings. |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Work on any unresolved tasks and prepare final materials for the team presentation. |
| | **Any issues or challenges:** |
| | • No major issues or challenges |

---

**Total Time Spent:** 58 hours

**Summary:**
Week 11 focused on finalizing ShelfSight as a scalable, secure, and production-ready system by addressing high-impact engineering priorities across data handling, architecture, and validation. Bulk upload scaling was improved through batching and optimized database operations, enabling reliable ingestion of 10k+ records while maintaining system stability across catalog, search, and circulation workflows. Multi-tenancy (KAN-45) was introduced to support organization-level data isolation, including schema updates, JWT enhancements, and middleware-based query scoping, alongside frontend support for organization context and onboarding flows. Security and deployment readiness were strengthened through server-side authentication enforcement, RBAC validation, environment configuration checks, and resolution of framework-level issues, followed by production-like smoke testing. Load testing efforts were expanded beyond the initial 45-user baseline, increasing concurrency and analyzing performance metrics such as p95 latency and failure rates to identify bottlenecks and validate system stability under heavier load. Finally, all workstreams were consolidated into a comprehensive project report covering CI/CD, testing, scalability, and limitations, with the addition of basic analytics (catalog usage and circulation trends) and full organization of documentation and demo assets, resulting in a complete, presentation-ready submission.

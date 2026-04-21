# ShelfSight

**Week 10 | April 15, 2026 - April 21, 2026**

**Leader:** Syed Hasan
---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed:** |
| | • Implemented the bulk upload workflow. Built the backend functionality (`POST /books/bulk-file`) utilizing `multer` and `xlsx` to parse spreadsheet rows into recognizable library metadata directly from the frontend request. |
| | • Developed a UI modal in the catalog dashboard that allows admin users to seamlessly attach and upload Excel `.xlsx` or `.csv` files. |
| | • Engineered the backend ingestion service to properly validate ISBNs, titles, and authors across batches. Implemented database upsert logic to gracefully handle duplicate entries and failure recovery without breaking the entire upload transaction. |
| | • Authored `docs/task1/README.md` to document the bulk scale constraints, technical approaches, and execution strategies. |
| | • Optimized the backend bulk insertion process to handle 10k+ rows by splitting the operations into batches of 500. Substituted individual transactions for 4 highly optimized SQL batch queries (`findMany` constraints, `createMany` records/copies, and arrayed `$transaction` upserts), which resolved a critical 2.5-minute timeout issue and reduced ingestion time to seconds. |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • Support QA testing for bulk upload edge cases and monitor for catalog indexing regressions |
| | • Assist with final project optimizations and multi-tenant handoff |
| | **Any issues or challenges:** |
| | • Resolving Typescript/NextJS build constraints surrounding FormData mapping off the backend required adjusting the payload logic between Next's Server Context and React Context |

---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed (Task 4 – End-to-End Testing & Critical Bug Resolution):** |
| | • Stood up the first Playwright E2E harness on the frontend repo — 8 specs covering auth, catalog CRUD, shelf assignment, search, map API, circulation, ingestion, RBAC, search debouncing, and input validation. Final run: **30 passed, 2 conditional skips, 0 failed** in ~20s. |
| | • Added a backend `POST /__test__/reset` route (guarded by `NODE_ENV !== 'production'`) plus a Playwright `globalSetup` hook so every E2E run starts from a deterministic seeded DB state. |
| | • Fixed **KAN-57** — standardized every `/map/*` controller response on the `{ success, data }` envelope so the API is consistent with the rest of the endpoints. |
| | • Fixed **KAN-59** — added email-format and 8-char minimum-password validation to `users.service.ts` on both create and update paths; reuses the existing `AppError.fieldErrors` pattern and the `normalizeEmail` helper (no new dependency). |
| | • Fixed **KAN-60** — added a heuristic Dewey classifier fallback and a `source: 'llm' \| 'heuristic' \| 'unavailable'` discriminator on `DeweyClassification` so the ingestion pipeline stops silently returning null results when `OPENAI_API_KEY` is missing. |
| | • Wrote regression specs verifying **KAN-55** (book update persistence), **KAN-56** (shelf dropdown), **KAN-58** (catalog search), **KAN-61** (search debouncing) — all previously fixed by teammates, now covered by automated tests. |
| | • Authored two launch-ready docs: [`docs/task4-testing-report.md`](../../docs/task4-testing-report.md) (narrative summary, per-ticket status, known limitations) and [`docs/task4-test-results.md`](../../docs/task4-test-results.md) (per-test timings, full backend vitest output, verification matrix). Both feed directly into Task 5's launch documentation. |
| | • Closed **15 Jira tickets** with evidence-backed comments: KAN-55, 56, 57, 58, 59, 60, 61 (Task 4 scope) plus KAN-4, 5, 6, 7, 8 (historical epics with all children Done) and KAN-65, 68, 70 (CI/CD, pagination cap, rate limiting — verified in teammates' recent commits). |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • **KAN-45 — Multi-Organization / Multi-Tenancy Support (Highest).** Schema-level `Organization` model + `organizationId` FK on User, Book, ShelfSection, IngestionJob. Update JWT payload to carry `organizationId`; add a `requireOrg` middleware wrapper that auto-scopes Prisma queries so data cannot leak between orgs. Frontend AuthProvider exposes current org; add org-scoped sign-up / invite flow. Row-level isolation over schema-per-tenant for MVP. |
| | **Any issues or challenges:** |
| | • Next.js 16 Turbopack OOMed repeatedly while compiling the dashboard routes during E2E runs on Node 23; worked around it by forcing the `webpack` dev compiler in the Playwright webServer config with `NODE_OPTIONS=--max-old-space-size=8192`. Documented in the testing report. |
| | • A stray `package-lock.json` in the home directory tricked Turbopack into picking the wrong workspace root, so every route rendered the `not-found` fallback. Fixed by anchoring `turbopack.root` in `next.config.ts`. |
| | • Local Postgres maps to host port **5433** (per `docker-compose.yml`), but the checked-in `.env.example` still shows `5432`. Minor but tripped me up early; flagged in the known-limitations section of the testing report for the next person who spins up the stack. |

---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed (Task 5 – CI/CD, Documentation & Release Readiness):** |
| | • Led final release readiness efforts by consolidating CI/CD, deployment workflows, environment setup, and verification processes into a single launch-ready document. |
| | • Authored the **CI/CD, Release Readiness & Verification Report**, integrating outputs from Task 3 (k6 load testing), Task 4 (E2E testing + bug fixes), and Task 5 (scalability optimizations) into a cohesive, manager-facing document. |
| | • Documented complete **deployment flow**, including environment configuration (Docker Postgres, backend, frontend), local and CI build steps, and validation procedures. |
| | • Defined and formalized **pre-release smoke test checklist**, ensuring all core product workflows (auth, catalog, circulation, ingestion, RBAC) are validated before launch. |
| | • Established **rollback plan and failure response strategy**, including trigger conditions (auth failures, 5xx errors, broken workflows) and recovery steps. |
| | • Consolidated and documented **known system limitations**, including ingestion constraints (no AWS/OpenAI live validation), partial endpoint availability, and dataset scaling gaps. |
| | • Ensured all team contributions (Tasks 1–5) were captured, standardized, and aligned into a **single presentation-ready technical document** for final delivery. |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • Execute final smoke validation on production-like environment |
| | • Support presentation walkthrough and technical explanation of CI/CD and system readiness |
| | **Any issues or challenges:** |
| | • Coordinating multiple task outputs (testing, scalability, ingestion, CI) into a single consistent document required aligning formats, terminology, and verification evidence across contributors |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed (Task 5 – Scalability & Query Optimization):** |
| | • Added GIN trigram indexes (`pg_trgm`) on text search columns and B-tree indexes on `Book.genre` / `ShelfSection.floor` via a new Prisma migration. |
| | • Pushed book status filter from in-memory JS into a Prisma SQL `WHERE` clause; removed over-fetching on `/auth/me` (dropped loans join). |
| | • Added server-side pagination to `GET /users` (max 100) and updated all frontend call sites to the new `{ data, pagination }` shape. |
| | • Enforced `MAX_LIMIT=100` with enum allowlists across all paginated controllers (books, loans, fines, transactions). |
| | • Added `express-rate-limit` (global: 300 req/15 min; auth: 15 req/15 min), gated to production only. |
| | • Eliminated the on-mount `limit=9999` catalog fetch; export is now on-demand. Reduced dashboard/reports limits from 500–2000 to 100. |
| | • Replaced sequential loans pagination loop with `Promise.all`; converted fines tab to server-side filtering. |
| | • Added optional `?floor=N` filter and 500-row cap to `GET /map`. |
| | • Documented all changes in `docs/task5/SCALABILITY.md`. |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Deploy migration and re-run k6 suite to compare p95 latencies against Task 3 baseline. |
| | **Any issues or challenges:** |
| | • Local Docker DB was not running; migration validated via schema checks only, pending deployment. |
| | • Rate limiter caused 100% k6 failures until gated behind `NODE_ENV === 'production'`. |

---

| Name | Details |
|------|---------|
| **Chimezie Nnawuihe** | **Tasks completed:** |
| | • Completed k6 load-testing suite covering concurrent auth, catalog search, circulation, and ingestion workflows. |
| | • Executed smoke and multi-user runs, generated result summaries, and validated threshold pass status. |
| | • Improved test accuracy by handling expected circulation contention as expected responses while preserving contention counters. |
| | • Completed documentation of Task 3 testing approach, execution results, and performance findings. |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Multi-Organization / Multi-Tenancy Support |
| | • Expand load testing and compare new results against the current baseline to identify any degradation trends |
| | **Any issues or challenges:** |
| | • Concurrent checkout/checkin activity caused expected request conflicts, so results required careful interpretation to ensure valid conflicts were not misclassified as failures. |

---

**Total Time Spent:** 54 hours

**Summary:**
Week 10 focused on transitioning ShelfSight into a fully release-ready, end-to-end system by combining large-scale data ingestion, comprehensive workflow validation, performance testing, and deployment readiness. Bulk upload functionality was introduced to support CSV/XLSX imports with validation and upsert handling, alongside a Faker-based seeding script capable of generating 100,000+ records for realistic stress testing. A complete end-to-end testing suite was implemented covering authentication, catalog, circulation, ingestion, RBAC, and search, achieving 30 passing tests with 0 failures and resolving all remaining critical bugs while verifying previously fixed issues. System scalability was strengthened through database indexing, pagination enforcement, rate limiting, and query optimizations, reducing over-fetching and improving backend efficiency. Load testing validated stability under 45 concurrent users and 9,000+ requests with a 0% failure rate, confirming reliability across core workflows. All results were consolidated into a comprehensive CI/CD and release readiness document, including environment setup, deployment steps, smoke tests, rollback planning, and known limitations, resulting in a polished, manager-ready deliverable that positions ShelfSight as a validated pre-launch candidate ready for presentation.

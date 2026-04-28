# ShelfSight

**Week 11 | April 28, 2026 - April 21, 2026**

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
| | • figure out why 5k works and 10k doesnt and fix it|
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

**Total Time Spent:** 56 hours

**Summary:**
Week 11 focused on finalizing ShelfSight as a scalable, secure, and production-ready system by addressing high-impact engineering priorities across data handling, architecture, and validation. Bulk upload scaling was improved through batching and optimized database operations, enabling reliable ingestion of 10k+ records while maintaining system stability across catalog, search, and circulation workflows. Multi-tenancy (KAN-45) was introduced to support organization-level data isolation, including schema updates, JWT enhancements, and middleware-based query scoping, alongside frontend support for organization context and onboarding flows. Security and deployment readiness were strengthened through server-side authentication enforcement, RBAC validation, environment configuration checks, and resolution of framework-level issues, followed by production-like smoke testing. Load testing efforts were expanded beyond the initial 45-user baseline, increasing concurrency and analyzing performance metrics such as p95 latency and failure rates to identify bottlenecks and validate system stability under heavier load. Finally, all workstreams were consolidated into a comprehensive project report covering CI/CD, testing, scalability, and limitations, with the addition of basic analytics (catalog usage and circulation trends) and full organization of documentation and demo assets, resulting in a complete, presentation-ready submission.

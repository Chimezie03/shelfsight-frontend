# ShelfSight

**Week 7 | March 25, 2026 - March 31, 2026**

**Leader:** Marc Manoj
---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed:** |
| | • Completed Task 4: AI Ingestion UI — rebuilt ingest page with tabbed layout (Analyze + Review Queue), image upload dropzone, and JobReviewDialog for staff approval/rejection workflow |
| | • Completed Task 4: Map Integration — connected React Flow map to backend API (load/save), replaced mock ShelfViewer data with real BookCopy data, added auto-fit and shelf deep-linking from catalog |
| | • Built checkout cart system — global cart with sessionStorage persistence, click-to-add from shelf viewer, cart import on circulation page for streamlined checkout |
| | • Extended backend schemas — IngestionJob (metadata fields, APPROVED/REJECTED status) and ShelfSection (category, Dewey range, tiers, capacity, color, rotation) with Prisma migration |
| | • Added extractMetadataFromOcr() for non-English book support (OpenAI integration for books without detectable ISBN) |
| | • Added job management API endpoints (list, get, approve, reject) and map endpoints (bulk layout sync, shelf book lookup) |
| | • Connected catalog shelf locations to real shelf labels with clickable links to map |
| | • Updated seed data with pixel-scale coordinates for React Flow compatibility |
| | • Pushed frontend changes to main (merged with 2 upstream commits, resolved conflicts) |
| | • Created backend PR for team review (feat/task4-ingestion-map-integration) |
| | • Wrote NEXT_STEPS.md covering multi-tenancy, WorldCat integration, AI library organization, and 6 additional feature proposals |
| | • Created 9 Jira tickets (KAN-45 through KAN-53) under new epic KAN-54 with prioritized backlog |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Multi-organization / multi-tenancy architecture |
| | • WorldCat integration for international book identification |
| | **Any issues or challenges:** |
| | • Image analysis requires AWS Textract + OpenAI keys to fully function; stubs work for local dev without cloud credentials |

---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed:** |
| | • |
| **Time Spent:** | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |

---

| Name | Details |
|------|---------|
| **Chimezie Nnawuihe** | **Tasks completed:** |
| | • Removed mock data in Catalog, Circulation, and Reports, and connected those pages to live backend data |
| | • Wired core frontend workflows (catalog list/detail, checkout flow, active loans table, reports tabs) through the centralized API client |
| | • Added loading, empty, error, and retry states across Catalog, Circulation, and Reports pages so live data is handled consistently |
| | • Set up role-based access on protected dashboard pages and connected login/session handling to backend HttpOnly cookies |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Notifications System |
| | • Multi-organization/multi-tenancy support |
| | **Any issues or challenges:** |
| | • No major issues or challenges |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed:** |
| | • Deployed backend (Node.js/Express) to Render, configured environment variables for AWS S3, Textract, and Neon Postgres
| | • Set up AWS S3 bucket, IAM user, and Textract permissions for production ingestion pipeline
| | • Connected Neon Postgres to backend, handled Prisma migration and production seeding
| | • Deployed frontend (Next.js) to Vercel, configured environment for production API URL
| | • Synced CORS and authentication settings between frontend and backend for secure cross-origin login
| | • Debugged and resolved production authentication issues (SameSite=None cookie, CORS, JWT flow)
| **Time Spent:** | **Planned tasks for next week:** |
| 14 hours | **Planned tasks for next week:** |
| | • Production monitoring and error alerting setup
| | • Assist with multi-tenancy and WorldCat integration planning
| | **Any issues or challenges:** |
| | • Render free plan lacks shell access, required workaround for production DB seeding
| | • Cross-origin authentication required cookie and CORS config changes for Vercel/Render
---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • Backend Finalization — implemented full RESTful /map API (GET, POST, PUT, DELETE) using the ShelfSection Prisma model, replacing 501 stubs and enabling persistent storage of map layout data for future React Flow integration |
| | • Designed and implemented centralized error handling system — introduced AppError class, async middleware wrapper, and global error handler to enforce a universal JSON error envelope across all endpoints (auth, validation, Prisma errors, and runtime failures) |
| | • Implemented GET /books/:id endpoint to resolve frontend/backend API parity, including mapping book data with associated copy metadata (availableCopies, totalCopies, availableCopyIds) for compatibility with catalog UI |
| | • Refactored backend structure to align with project architecture — ensured clear separation of routes, controllers, and services, removed inline error responses, and standardized error propagation through middleware |
| | • Added input validation and RBAC enforcement for map endpoints — authenticated access for reads and STAFF/ADMIN restrictions for mutations with proper HTTP status handling |
| | • Conducted end-to-end backend verification through manual API testing (authentication flows, map CRUD operations, validation errors, RBAC scenarios, and edge cases such as missing resources and malformed requests) |
| | • Prepared backend for frontend integration by stabilizing API contracts and ensuring consistent response structures across all endpoints |
| **Time Spent:** 12 hours | **Planned tasks for next week:** |
| | • Multi-organization/multi-tenancy support 
| | • WorldCat integration for international book identification |
| | • Barcode scanning via device camera |
| | **Any issues or challenges:** |
| | • No major issues encountered during this phase |
---

**Total Time Spent: 12 hours

**Summary:**
Week 7 focused on completing Task 4 (AI Ingestion UI & Interactive Map Integration), building a checkout cart flow from map to circulation, pushing changes to GitHub (frontend merged to main, backend PR opened for review), and planning the next phase of features with detailed write-ups and Jira tickets.

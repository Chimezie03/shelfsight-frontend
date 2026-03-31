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
| | • |
| **Time Spent:** | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |

---

| Name | Details |
|------|---------|
| **Kaelen Raible** | **Tasks completed:** |
| | • |
| **Time Spent:** | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |
---

| Name | Details |
|------|---------|
| **Syed Hasan** | **Tasks completed:** |
| | • |
| **Time Spent:** | **Planned tasks for next week:** |
| | • |
| | **Any issues or challenges:** |
| | • |
---

**Total Time Spent: 12 hours

**Summary:**
Week 7 focused on completing Task 4 (AI Ingestion UI & Interactive Map Integration), building a checkout cart flow from map to circulation, pushing changes to GitHub (frontend merged to main, backend PR opened for review), and planning the next phase of features with detailed write-ups and Jira tickets.

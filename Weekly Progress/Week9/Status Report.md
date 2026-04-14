# ShelfSight

**Week 9 | April 8, 2026 - April 14, 2026**

**Leader:** Chimezie Nnawuihe
---

| Name | Details |
|------|---------|
| **Marc Manoj** | **Tasks completed** |
| | • Completed circulation API alignment so check-out and check-in workflows now support consistent title, author, and ISBN search behavior using existing endpoints/services |
| | • Aligned backend loan response payloads with frontend circulation expectations to remove search mismatches and reduce mapping inconsistencies |
| | • Updated frontend circulation state/search usage to rely on the aligned API fields and backend search semantics for more reliable lookup during checkout/check-in |
| | • Added targeted backend tests for loan query forwarding and fetchLoans search/payload behavior, then re-ran backend/frontend tests and builds to confirm stability |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • Support follow-up QA for circulation edge cases and monitor for regressions |
| | • Expand automated coverage for circulation filtering and transaction history flows |
| | **Any issues or challenges:** |
| | • Initial frontend build validation failed due to local dependency resolution; resolved after installing project dependencies and re-running full validation |

---

| Name | Details |
|------|---------|
| **Mirza Baig** | **Tasks completed:** |
| | • Implemented fines persistence (Task 3) — added Fine and TransactionLog models to the Prisma schema with proper indexes and enums (FineStatus: UNPAID/PAID/WAIVED; TransactionType: CHECKOUT/CHECKIN/RENEWAL/FINE_PAID/FINE_WAIVED) |
| | • Created fines API endpoints (GET /fines, POST /fines/:id/pay, POST /fines/:id/waive) with filtering by status, search, and pagination support |
| | • Created transaction history API endpoint (GET /transactions) with filtering by type, search, date range, and pagination |
| | • Modified checkin service to automatically create Fine records when overdue books are returned, with $25 cap per item matching frontend constants |
| | • Modified checkout and checkin services to automatically create TransactionLog entries for all circulation events |
| | • Pay/waive fine actions also create FINE_PAID/FINE_WAIVED transaction log entries for full audit trail |
| | • Standardized API response envelope for fines/history endpoints to match existing {data, pagination} pattern |
| | • Updated seed data to include sample fines (UNPAID/PAID/WAIVED) and 62+ transaction log entries from existing loans |
| | • Added 15 unit tests for fines and transactions services (fetchFines, payFine, waiveFine, createFineForLoan, fetchTransactions, createTransaction) |
| | • All 19 backend tests passing, TypeScript compilation clean, API endpoints verified against running server |
| **Time Spent:** 10 hours | **Planned tasks for next week:** |
| | • KAN-45: Multi-Organization / Multi-Tenancy Support — begin org segmentation setup for multi-library deployment |
| | • KAN-66: Add loan renewal backend endpoint — renewals are currently local-only with no persistence |
| | **Any issues or challenges:** |
| | • Docker daemon was not running initially, requiring restart before migration could be applied |
| | • Seed data initially had no overdue returned loans (all returned early), needed to adjust return dates to generate fine records |

---

**Total Time Spent:** 20 hours

**Summary:**
Week 9 focused on circulation workflow stability, API consistency, and fines/history persistence. Marc aligned loan APIs with frontend expectations for search and response payloads. Mirza implemented full fines and transaction history persistence (Task 3): Fine and TransactionLog Prisma models, REST endpoints for fetching/paying/waiving fines and querying transaction history, automatic fine creation on overdue checkin, automatic transaction logging on all circulation events, seed data with sample fines and transaction logs, and 15 new unit tests — all verified against the running server with proper error handling and standardized response envelopes.

# Task 4 - Load Testing & Performance (k6)

This file documents Task 4 k6 deliverables for ShelfSight (post-scaling re-tests, heavier concurrency runs, performance comparison, and bottleneck findings).

Implementation and result artifacts are owned by the backend repository (`shelfsight-backend`).

## A. Scope and objective

Covered backend workflows:

- Auth: login, session check, logout
- Catalog: search, filter, detail
- Circulation: loan list, checkout, checkin
- Ingestion: job list, ISBN lookup, analyze upload, job detail/reject

Task objective:

- Re-run the multi-user suite after DB/data scaling.
- Increase concurrency beyond the original 45-user baseline.
- Compare p95 latency and failure rates across load levels.
- Identify bottlenecks and confirm functional stability under heavier load.

## B. Test setup

| Item                    | Value                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| Repo                    | `shelfsight-backend`                                                       |
| Base URL                | `http://localhost:3001`                                                    |
| Tool                    | k6 (local `k6.exe v1.7.1`)                                                 |
| Seed credentials        | default seed users, password `password123`                                 |
| Data state before scale | users:`16`, books: `50`, copies: `100`, loans: `3289`, jobs: `1448`       |
| Data state after scale  | users:`16`, books: `10050`, copies: `35096`, loans: `3289`, jobs: `1448`  |

## Backend source-of-truth location

- Repo: `shelfsight-backend`
- Canonical Task 4 doc: `shelfsight-backend/docs/task4-k6/README.md`
- Canonical k6 harness: `shelfsight-backend/tests/k6/`
- Canonical Task 4 results: `shelfsight-backend/tests/k6/results/task4/`

## C. Scenarios implemented

### Multi-user suite

- File: `tests/k6/scenarios/multi-user.js`
- Baseline profile re-run on scaled data: `task3` (2 minutes)
- Added Task 4 heavier profiles: `task4_90`, `task4_135`

| Scenario             | Max VUs (`task3`) | Max VUs (`task4_90`) | Max VUs (`task4_135`) | Covered endpoints                                                       |
| -------------------- | ----------------- | -------------------- | --------------------- | ----------------------------------------------------------------------- |
| `auth_flow`          | 10                | 20                   | 30                    | `/auth/login`, `/auth/me`, `/auth/logout`                              |
| `catalog_flow`       | 20                | 40                   | 60                    | `/books` search/filter/detail                                           |
| `circulation_flow`   | 10                | 20                   | 30                    | `/loans`, `/loans/checkout`, `/loans/checkin`                          |
| `ingestion_flow`     | 5                 | 10                   | 15                    | `/ingest/jobs`, `/ingest/lookup`, `/ingest/analyze`, `/ingest/jobs/:id` |
| **Total peak VUs**   | **45**            | **90**               | **135**               | -                                                                       |

## D. Results summary

| Run                                                     | Peak VUs | HTTP p95    | HTTP avg   | HTTP max    | HTTP failure rate | Checks pass rate | Iterations |
| ------------------------------------------------------- | -------- | ----------- | ---------- | ----------- | ----------------- | ---------------- | ---------- |
| Historical baseline (Task 3, pre-scale)                | 45       | 279.74 ms   | 55.50 ms   | 1223.93 ms  | 0.00%             | 100%             | 3531       |
| Re-run baseline profile on scaled data (`task3`)       | 45       | 3152.70 ms  | 1095.03 ms | 7230.09 ms  | 0.00%             | 100%             | 764        |
| Heavy load (`task4_90`)                                | 90       | 7974.10 ms  | 3266.23 ms | 25294.97 ms | 0.00%             | 100%             | 610        |
| Stress load (`task4_135`)                              | 135      | 16019.52 ms | 6307.59 ms | 44489.27 ms | 0.00%             | 100%             | 464        |

## E. Bottlenecks and stability findings

- Primary bottleneck: ingestion path under concurrency.
- Secondary bottlenecks at high load: auth login path and circulation flow duration.
- Stability conclusion: functionally stable (no HTTP failures) but latency SLOs were not sustained after scaling and concurrency increase.

## F. Recommendations

1. Optimize ingestion path first; it dominates p95 regressions at 90/135 VUs.
2. Add endpoint-level timing telemetry for `/auth/login`, `/books`, `/loans`, and `/ingest/*`.
3. Re-run the same Task 4 profiles after optimizations for direct before/after comparison.

## G. Artifacts

- Backend Task 4 summaries:
  - `shelfsight-backend/tests/k6/results/task4/multi-user-45vu-summary.json`
  - `shelfsight-backend/tests/k6/results/task4/multi-user-90vu-summary.json`
  - `shelfsight-backend/tests/k6/results/task4/multi-user-135vu-summary.json`
- Backend Task 4 raw outputs:
  - `shelfsight-backend/tests/k6/results/task4/multi-user-45vu-raw.json`
  - `shelfsight-backend/tests/k6/results/task4/multi-user-90vu-raw.json`
  - `shelfsight-backend/tests/k6/results/task4/multi-user-135vu-raw.json`

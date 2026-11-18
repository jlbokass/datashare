# DataShare — Performance plan and evidence (OC P3)

[Français](PERF.fr.md) · [Technical documentation](docs/technical-documentation.md)

**Status: plan only. There is no measured k6 run, frontend bundle measurement or production metric yet.**

## Backend critical-endpoint benchmark — planned

**Candidate:** `POST /api/transfers` (US01) authenticated multipart upload. Later add `GET /api/shares/{token}/files/{fileId}` (US02) for download streaming.

Test conditions to record: code SHA, Mac/CPU/RAM, Docker image versions, file size/content, number of files, database state, JWT setup, HTTP success/failure rate, throughput and response-duration percentiles (p50/p95/p99). Use only disposable fixture files and local development credentials.

Proposed initial small smoke load: 1 user for 1 minute using a 1–10 MB harmless fixture, then limited concurrency (e.g. 5 virtual users) **after** monitoring storage use and cleanup. Use k6 or an equivalent tool. Never load-test public infrastructure without authorization. Delete temporary transfers and verify expiry/cleanup after the benchmark.

| Run | Date, SHA and conditions | p50/p95, failure rate and throughput | Interpretation / decision |
| --- | --- | --- | --- |
| Initial upload run | **Not executed** | **No measurements** | Pending k6 script and reproducible fixture |
| Download run (US02) | **Not implemented** | **No measurements** | Deferred until public endpoint exists |

## Frontend performance budget

The generated `frontend/angular.json` currently defines **configuration thresholds**, not observed values:

- Initial bundle warning at **500 kB**, error at **1 MB**.
- Any component-style warning at **4 kB**, error at **8 kB**.

A successful developer-reported `npm run build` alone is **not** a recorded bundle-size audit. For final evidence, capture the build output and sizes, browser network metrics and a DevTools/Lighthouse comparison at mobile and desktop sizes. Verify images, fonts and third-party scripts do not exceed the budget.

## Monitoring / metrics to collect

- Backend: HTTP request count, status, response duration, throughput, storage failures, scheduler completion/error, PostgreSQL query latency when instrumented.
- Frontend: bundle bytes, initial loading and interaction timing, browser console errors, viewport/network conditions.
- Attach screenshots or sanitized logs showing actual numbers. No monitoring stack or structured-metrics pipeline is claimed as running.

This file will be completed after the MVP and OC quality-testing stage, not backfilled with invented benchmarks.

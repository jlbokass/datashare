---
layout: default
title: "DataShare — Performance results"
permalink: /en/perf.html
lang: en
---

# DataShare — Performance results (QL-04)

[Français](https://github.com/jlbokass/datashare/blob/main/PERF.md) · [Technical documentation](../technical-documentation.md) · [Issue #55](https://github.com/jlbokass/datashare/issues/55)

**Status as of 23 November 2026:** one business endpoint was timed, and frontend performance was examined through a production build and a Lighthouse observation. **These are not production measurements or a load test.**

## 1. Measurements and results

**Final release build (25 November 2026, [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80)).** The [frontend CI](https://github.com/jlbokass/datashare/actions/runs/45548827002) reports a successful production build: initial raw bundle **370.94 kB**, estimated transfer **91.43 kB**, below the 500 kB initial-bundle warning threshold. Two component-style warnings remain: `home.scss` 6.17 kB and `account.scss` 6.83 kB (warning at 4 kB, error at 8 kB). The local endpoint and Lighthouse results below remain historical measurements, not a new benchmark on the final release.

| Check | Conditions | Result |
| --- | --- | --- |
| **Backend — US02 public download** `GET /api/shares/{token}/files/{fileId}` | Isolated Docker stack (`compose.test.yaml`), temporary PostgreSQL and private storage, **1,048,576-byte** synthetic TXT; one warm-up then **12 sequential downloads** with byte verification | **12 HTTP 200, 0 errors**; p50 **13.3 ms**, p95 **15.4 ms**, mean **13.3 ms**; effective sequential throughput **78.88 MB/s** |
| **Angular — production build** | `npm run build`, `production` configuration, Node 24 container | Raw initial bundle **325.46 kB**; estimated transfer **84.50 kB**; successful build with no budget warning |
| **Chrome Lighthouse — homepage** | Chrome at `http://127.0.0.1:8080/`, using the **Angular development server** (unoptimized Vite modules); network/CPU settings not recorded | Performance **58/100**; FCP **3.4 s**, LCP **6.2 s**, TBT **0 ms**, CLS **0**, Speed Index **3.4 s** |

**Dates and traceability:** backend run **22 November 2026 at 23:59 UTC**; Angular build **22 November 2026 at 23:50 UTC**; Lighthouse observations **23 November 2026** local time. Branch `quality/ql-04-performance`, issue #55; the exact Mac checkout SHA at measurement time was not recorded. Evidence comes from local console outputs and screenshots, not CI or a deployed service.

## 2. Interpretation

- **Backend:** no errors in this small sample. Latencies and throughput represent transfers **within the local Docker network**, without Internet latency or concurrent users; they do not predict production capacity.
- **Angular bundle:** **325.46 kB < 500 kB**, the warning threshold in `frontend/angular.json`; the error threshold is **1 MB**. Component-style budgets are 4 kB warning and 8 kB error.
- **Lighthouse:** slow FCP/LCP were observed **on the development server**, which loads non-minified Vite/Angular modules. The capture indicates **6,454 KiB of resources (about 6.3 MiB)** and unoptimized JavaScript. The **58 score is not a production-build score**. TBT and CLS at zero are favorable within this observation.
- **Decision:** these results do not justify optimization or a monitoring stack. Before a public release, assess the actual production-served build under representative conditions.

## 3. Reproduce

From repository root:

```bash
# Production bundle size
docker compose run --rm node sh -lc 'cd frontend && npm run build'

# Public-download probe (after the isolated stack starts and its DB is migrated)
docker compose -f compose.test.yaml --profile e2e run --rm --no-deps \
  --entrypoint node playwright perf-download.mjs
```

Isolated-stack setup and database migration are documented in [TESTING.md](TESTING.md). `e2e/perf-download.mjs` requires only Node and uses synthetic credentials/files; **do not run it against `compose.yaml`**. For the browser observation, open the local page in Chrome DevTools → Lighthouse → Navigation and record metrics plus test conditions.

**Evidence:** build and benchmark outputs and Lighthouse screenshots were supplied during acceptance on 23 November 2026. The original images are **not stored in the repository**; only the values above are retained.

### Local runtime metrics

The Nginx JSON access log complements one-off measurements: HTTP status, total duration and request/response volumes. The [log inspection procedure](MAINTENANCE.md) describes the fields, limitations and format check. These logs do not replace QL-04 timed measurements or constitute aggregated production monitoring.

## 4. Limitations

No concurrent load, 1 GB transfer, real-user metric, or production-served Lighthouse result was measured. Results are point-in-time and local-hardware dependent. The benchmark is a **focused transfer/latency check**, not a capacity guarantee or production-performance certification.

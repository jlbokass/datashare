# DataShare — Security and dependency audit

[Français](SECURITY.fr.md) · [Technical documentation](docs/technical-documentation.md) · [QL-03 tracking](https://github.com/jlbokass/datashare/issues/53)

**Security audits — 23 November 2026.** Checks executed in the project's local Docker environment on `quality/ql-03-security` (branched from `develop` at commit `36291cd`). **Results: Composer reported no security advisories and npm reported zero vulnerabilities.** Terminal output was provided as a screenshot; the exact local checkout SHA and audit tool versions were not recorded.

## 1. Dependency audits and decisions

| Ecosystem | Command run from repository root | Result |
| --- | --- | --- |
| PHP / Composer (`backend/composer.lock`) | `docker compose run --rm php sh -lc 'cd backend && composer audit --locked --format=summary'` | **0 security advisories** |
| Angular / npm (`frontend/package-lock.json`) | `docker compose run --rm node sh -lc 'cd frontend && npm audit'` | **0 vulnerabilities** |

The checks cover declared dependencies, including development dependencies, as reported at scan time. **Decision: no security-driven update is needed** based on these results. npm's notice that version 12.2.3 is available is a version announcement, **not a security finding**; no automatic upgrades were made. No repeat scan is needed for this work package while dependencies remain unchanged.

## 2. Implemented MVP controls

| Area | Implemented measures |
| --- | --- |
| Accounts and JWT | Unique email, server validation, hashed passwords, signed JWT verified in Laravel. Public registration/login have rate limits; JWT is required to access an account, upload, view owner history or delete owned files. |
| Files and sharing | Private storage outside the public web root, opaque internal filenames, MIME/extension validation, **1 GB per file**, chosen **5-file / 2 GB transfer** limits. Public links use unpredictable tokens; invalid/expired links return 404/410 and downloads are forced as attachments. |
| Retention | **1–7-day** expiry and scheduled removal of bytes and metadata; five-minute demonstration is restricted to local use. |

Application access checks and critical journeys are also exercised in [TESTING](TESTING.md). These controls do not establish production-grade security on their own.

## 3. Known limitations

- **Logout:** Angular clears the JWT from memory, but a previously issued JWT remains valid server-side until expiry (approximately 30 minutes); there is no immediate revocation.
- **ZIP archives:** accepted without extraction, execution or antivirus scanning; recipients should treat untrusted content cautiously.
- **Deployment:** public HTTPS, backup/restore, hardening and operational security must be addressed before production use.
- **Audit scope:** dependency scanners report known advisories at scan time; they do not replace code review, container scanning or penetration testing.

**QL-03 conclusion:** the basic dependency-scan requirement is met, **no vulnerabilities reported, no corrective change needed**. Known limitations are recorded without adding further requirements to this work package.

## 4. Validation and authentication rules

- Allowed formats (server-side extension and MIME checks): PDF, PNG, JPEG, GIF, WEBP, TXT, MP3, MP4 and ZIP. The Angular file-picker filter is a user-input aid, not a security control. No direct folder upload; ZIP remains opaque. Decimal limits: 1,000,000,000 bytes per file, 2,000,000,000 bytes per transfer and at most five files. The latter two are local choices, not OC requirements.
- Registration: lowercase-normalized email, database uniqueness, password of at least eight characters, no JWT issued at registration. Ten registrations per minute per client.
- Login: `firebase/php-jwt`, HS256 signature, separate `JWT_SECRET` and `APP_KEY`, signature, expiry, issuer and user checks. Lifetime: 1,800 seconds; five attempts per minute per client. No refresh token or immediate revocation. The Angular guard does not replace Laravel access checks.
- Public share tokens differ from JWTs (64 hexadecimal characters). Private paths and owner data are not exposed; forced attachment downloads, `nosniff` and no shared caching.

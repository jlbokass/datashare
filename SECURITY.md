# DataShare — Security and access-control record (OC P3)

[Français](SECURITY.fr.md) · [Technical documentation](docs/technical-documentation.md)

**Status: design/implementation review, not a completed security audit. No dependency vulnerability scan has been recorded.**

## Implemented controls as of US01

| Surface | Implemented | Remaining limit |
| --- | --- | --- |
| Accounts | Email uniqueness, server validation, Laravel salted password hash | No confirmation email by OC MVP design |
| JWT | HS256 via `firebase/php-jwt` v7.2.2, issuer/expiry validation, dedicated `JWT_SECRET`, 30-minute expiry | No server-side revocation or refresh; frontend JWT memory-only, refresh requires login |
| Endpoints | JWT middleware for private `POST /api/transfers` and `GET /api/auth/me`; generic 401 | Other owner-restricted routes (US05/US06) remain to implement |
| Private files | `storage/app/private/transfers` outside public web root; randomized filename, validated MIME and filename extension | ZIP archives are accepted opaque, **not unpacked or antivirus-scanned** |
| Upload limits | 1,000,000,000 bytes per file, chosen 5-file / 2GB aggregate caps, PHP/Nginx caps; errors 413/422 | No real 1GB load-test evidence; ZIP may contain executables/bombs |
| Expiry | 1–7 days, daily purge of bytes and metadata; optional 5-minute local demo gated by server config | Verify scheduler execution/retention in a deployed environment |
| Transport | Local Nginx binds `127.0.0.1:8080` | **No production HTTPS/TLS deployment** yet |

User-provided Figma handoff includes a password-protected sharing variant. That belongs to optional **US09**, not an implemented security control. Direct folder-tree uploads are unsupported; users may package folders into ZIP as single files.

## Important open risks

- **Public download not yet implemented (US02)**. Before enabling: require unguessable token, validate expiry, stream through PHP as `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, no direct storage URL, safe filenames and correct 404/410 behavior.
- **ZIP policy:** server does not extract or execute, but it cannot guarantee downloaded content is harmless. [Decision tracked in US02 #5](https://github.com/jlbokass/datashare/issues/5). Decide whether to allow archives without scanning, impose additional restrictions or add scanning.
- Logout clears browser memory only; issued JWT is valid until its expiration. Document and revisit revocation for production.
- No deployment TLS, CSP review, backup/incident-response evidence, dependency scan or penetration testing. Do not call the application production-secure yet.
- Dozzle, if added later, requires an explicit review of privileged Docker API/socket access.

## Required future scans and results

- [ ] Run `docker compose run --rm php sh -lc 'cd backend && composer audit'`.
- [ ] Run `docker compose run --rm node sh -lc 'cd frontend && npm audit'`.
- [ ] Optionally run Trivy or an equivalent container/dependency scan.
- [ ] Record tool/version/date/SHA, findings (severity, affected dependency), remediation or justified acceptance and **re-scan results**. **Currently: no findings reported because no scan evidence exists.**
- [ ] Review JWT permissions, invalid tokens, rate limiting, upload types, archive risks, access isolation and secure production HTTPS before delivery.

Never paste `JWT_SECRET`, `APP_KEY`, PostgreSQL password, access tokens or uploaded private files into issues or reports.

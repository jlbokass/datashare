---
layout: default
title: "DataShare — US04 JWT login"
permalink: /us04-login.html
lang: en
---

# US04 — Login and JWT authentication

[**Français**](us04-jwt-login.fr.md) · [Documentation home](index.md)

**Status: local Docker, migrations, backend/frontend tests, build, login/logout and no-token HTTP 401 reported green by developer. Composer dependency and lockfile are now committed and verified on the branch (`firebase/php-jwt` v7.2.2); PR review and merge remain.**

Sources: [OC US04](https://github.com/jlbokass/datashare/issues/7), [DESIGN-03 OpenAPI](api/README.md), and [Figma UI handoff](design-handoff.md).

## Contract and security

- `POST /api/auth/login` receives email/password, checks the salted password hash, returns a signed **HS256** JWT, `token_type: Bearer` and a public user envelope; invalid credentials receive a generic **401**. It does **not** reveal whether an email exists.
- `GET /api/auth/me` requires `Authorization: Bearer <token>`, verifies the signature, expiration, issuer and public user ID; invalid, tampered, expired or absent tokens receive **401**. The API does not expose hashes or the signing secret.
- Use `firebase/php-jwt:^7.2`, a maintained JWT implementation, **not** a handwritten token format. The signing key `JWT_SECRET` is independent of `APP_KEY`; a missing/short key fails closed.
- JWTs expire in **1800 seconds (30 minutes)**. Login is throttled to **5 requests/minute per client**. No refresh token, revocation list or server-side logout is claimed for this milestone.
- Angular stores the JWT **in memory only**. It attaches it only when calling `/api/auth/me` and clears the local session on logout or server rejection. **Refreshing the page requires login again**. Client-side navigation guards do not replace Laravel authorization.
- Login screen follows the basic Figma handoff layout. The private `/account` placeholder demonstrates protected navigation and `/me` verification; **file history belongs to US05**, not US04. Home/upload visual fidelity belongs to US01.

## Required local dependency and key

On `feat/us04-jwt-login`, after pulling the branch on your Mac:

```bash
docker compose run --rm php sh -lc 'cd backend && composer require "firebase/php-jwt:^7.2" --no-interaction'
```

This changes **`backend/composer.json` and `backend/composer.lock` on your Mac**. Both must be committed and pushed as part of this PR. **Do not hand-edit `composer.lock`** or merge without these files.

Add a strong *development-only* JWT key **once** to your existing ignored `backend/.env`. If no `JWT_SECRET=` line exists:

```bash
grep -q '^JWT_SECRET=' backend/.env || printf '\nJWT_SECRET=%s\nJWT_ISSUER=datashare\nJWT_TTL_SECONDS=1800\n' "$(openssl rand -hex 32)" >> backend/.env
```

If the variable exists but is empty, **replace its value manually** with the output of `openssl rand -hex 32`; do not duplicate the line. Keep this key private and never paste it in a PR, a chat or a screenshot. **Do not overwrite your existing Laravel `APP_KEY` or the root PostgreSQL `.env`.**

## Developer verification

```bash
docker compose exec -T app php artisan config:clear
docker compose up -d
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
curl -i http://127.0.0.1:8080/api/auth/me
```

The unauthenticated `/api/auth/me` request must return **401**, not a profile. Visit **http://127.0.0.1:8080/login**, sign in using an account created in US03, and confirm the protected `/account` displays the real registered email. Try an incorrect password; expect an accessible generic French error. Log out and verify `/account` redirects back to login.

On a successful login the developer network panel should show `POST /api/auth/login` → **200** with `access_token`, and `GET /api/auth/me` → **200** with the Bearer header. **Do not share or record the token.** Refresh the browser; in this milestone the session is deliberately lost. Check mobile **393px** and desktop **1440px**.

Finally commit the new Composer files from your Mac:

```bash
git add backend/composer.json backend/composer.lock
git diff --cached --stat
git commit -m "build(US04): install Firebase JWT library"
git push -u origin feat/us04-jwt-login
```

## Acceptance

- [ ] Composer dependency and lockfile added together.
- [ ] Tests cover correct/wrong login, malformed credentials, valid/absent/altered/expired JWTs, issuer, unknown user, and missing signing key.
- [ ] Angular tests/build pass; UI login, profile check and client logout work in browser.
- [ ] Developer reviews JWT secret handling, local security limitations and bilingual AI journal evidence.
- [ ] PR to `develop` approved, then merge. No `main` delivery or production security guarantees are implied yet.

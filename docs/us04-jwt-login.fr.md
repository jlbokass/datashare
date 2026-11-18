---
layout: default
title: "DataShare — US04 Connexion JWT"
permalink: /us04-login.fr.html
lang: fr
---

# US04 — Connexion et authentification JWT

[**English**](us04-jwt-login.md) · [Documentation française](index.fr.md)

**Statut : Docker, migrations, tests backend/frontend, build, connexion/déconnexion et HTTP 401 sans JWT annoncés verts par le développeur. La dépendance et son lockfile sont maintenant commitées et vérifiées sur la branche (`firebase/php-jwt` v7.2.2) ; restent la revue et la fusion.**

Références : [US04 OC](https://github.com/jlbokass/datashare/issues/7), [contrat OpenAPI DESIGN-03](api/README.fr.md), [handoff Figma](design-handoff.fr.md).

## Contrat et sécurité

- `POST /api/auth/login` reçoit email/mot de passe, vérifie le hash salé et renvoie un JWT **HS256** signé, `token_type: Bearer` et le profil public. Des identifiants incorrects donnent une erreur générique **401**, sans révéler l'existence du compte.
- `GET /api/auth/me` impose `Authorization: Bearer <token>` et vérifie signature, expiration, émetteur et identifiant public. Token absent, modifié ou expiré : **401**. Aucun hash ni clé de signature n'est renvoyé.
- Bibliothèque `firebase/php-jwt:^7.2` : **pas d'algorithme JWT artisanal**. Clé `JWT_SECRET` distincte de `APP_KEY`. Une clé manquante ou trop courte entraîne un refus, jamais un token non signé.
- Durée de vie **1 800 secondes (30 minutes)** ; limite de **5 tentatives de connexion/minute/client**. Pas de refresh token, révocation serveur ou véritable logout côté API dans ce lot.
- Angular conserve le JWT **uniquement en mémoire** ; une actualisation complète impose une nouvelle connexion. Déconnexion ou rejet `401` efface la session côté navigateur. Le garde Angular est complémentaire à la validation Laravel, qui seule protège l'API.
- La page de connexion suit les éléments de base du handoff. `/account` est un écran protégé de démonstration avec appel `/me` ; l'historique réel relève d'**US05** et l'accueil complet d'**US01**.

## Installation locale : Composer et clé JWT

Sur `feat/us04-jwt-login`, après récupération des modifications :

```bash
docker compose run --rm php sh -lc 'cd backend && composer require "firebase/php-jwt:^7.2" --no-interaction'
```

Cette commande modifie **`backend/composer.json` et `backend/composer.lock`**. Il faut les commiter tous les deux dans la PR : **ne jamais modifier le lockfile à la main**.

Ajoute **une seule fois** une clé de signature locale dans **`backend/.env`**, déjà ignoré par Git, si `JWT_SECRET=` n'y figure pas :

```bash
grep -q '^JWT_SECRET=' backend/.env || printf '\nJWT_SECRET=%s\nJWT_ISSUER=datashare\nJWT_TTL_SECONDS=1800\n' "$(openssl rand -hex 32)" >> backend/.env
```

Si `JWT_SECRET=` existe mais est vide, complète sa valeur manuellement avec `openssl rand -hex 32`, sans dupliquer la ligne. **Ne communique jamais cette clé**, même dans une capture ou un log. Ne remplace ni `APP_KEY` dans Laravel, ni le `.env` racine PostgreSQL.

## Recette à exécuter sur ton Mac

```bash
docker compose exec -T app php artisan config:clear
docker compose up -d
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
curl -i http://127.0.0.1:8080/api/auth/me
```

Sans jeton, `/api/auth/me` doit répondre **401**. Ouvre **http://127.0.0.1:8080/login**, connecte-toi avec le compte créé pendant US03, vérifie que `/account` affiche le véritable email, teste un mauvais mot de passe puis la déconnexion. Sans session, `/account` doit renvoyer vers la page de connexion.

Dans les DevTools, une connexion réussie donne `POST /api/auth/login` → **200** avec `access_token`, et `GET /api/auth/me` → **200** avec le jeton Bearer. **Ne copie pas ce jeton.** Une actualisation de la page entraîne la perte volontaire de la session. Vérifie les largeurs **393px** et **1440px**.

Enfin, depuis le Mac :

```bash
git add backend/composer.json backend/composer.lock
git diff --cached --stat
git commit -m "build(US04): install Firebase JWT library"
git push -u origin feat/us04-jwt-login
```

## Critères d'acceptation

- [ ] Paquet JWT et lockfile versionnés ensemble.
- [ ] Tests : bons/mauvais identifiants, validation, token valide/absent/falsifié/expiré, émetteur, utilisateur inconnu, clé manquante.
- [ ] Tests/build Angular verts et parcours de connexion, consultation du profil et déconnexion fonctionnels.
- [ ] Revue du développeur, limites de sécurité et journal IA FR/EN actualisés.
- [ ] PR validée puis fusion dans `develop`. Aucun déploiement en production ni garantie complète de sécurité n'est revendiqué.

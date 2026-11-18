---
layout: default
title: "DataShare — US03 Création de compte"
permalink: /us03-registration.fr.html
lang: fr
---

# US03 — Création de compte

[**English**](us03-registration.md) · [Documentation française](index.fr.md)

**Statut : implémentation proposée ; recette locale du développeur en attente.**

Cette issue couvre [US03 — Création de compte](https://github.com/jlbokass/datashare/issues/6), conformément aux spécifications OpenClassrooms, à notre [contrat OpenAPI](api/README.fr.md) et au [handoff UI](design-handoff.fr.md).

## Périmètre et contrat

- `POST /api/auth/register`, public, accepte uniquement `email` et `password`, répond **201** avec `{"user":{"id":"<uuid>","email":"...","created_at":"..."}}`.
- Adresse email validée, sans espaces périphériques et normalisée en minuscules pour garantir l'unicité indépendamment de la casse. Un index unique existe en base.
- Mot de passe de **8 caractères minimum**, hashé et salé par le cast Laravel `hashed` ; jamais renvoyé en clair.
- Aucun nom, rôle administrateur, email de vérification, connexion automatique ni JWT en US03. Le **JWT appartient à US04**.
- Une migration non destructive rend `name` nullable (champ facultatif du squelette) et ajoute un `public_id` UUID exposé par l'API. Les clés internes numériques et les données existantes sont conservées ; les anciens utilisateurs reçoivent un UUID.
- Protection élémentaire contre l'abus : **10 inscriptions/minute/client** (ne remplace pas les protections de production).
- Les erreurs de validation respectent le format JSON `message`, `code=validation_error` et `errors`.
- Le formulaire Angular `/register` utilise des formulaires réactifs et les couleurs/cartes du handoff, en mobile et desktop. La confirmation du mot de passe est **vérifiée côté interface uniquement** : le contrat API reste intact.

## Recette locale

Sur `feat/us03-registration` après synchronisation de `develop`, sans écraser les `.env` existants :

```bash
docker compose config --quiet
docker compose build app php
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan migrate:status
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

**L'image PHP est reconstruite pour prendre en charge `pdo_sqlite`** et exécuter les tests unitaires isolés dans SQLite en mémoire. Le service `app` effectue les migrations sur PostgreSQL. **Ne pas utiliser `migrate:fresh`** pour cette tâche : il supprimerait les tables et données.

Ouvre **http://127.0.0.1:8080/register**. Teste une inscription, un doublon email avec une casse différente et un mot de passe trop court. Vérifie les messages, le rendu mobile **393px**, desktop **1440px** et l'absence d'erreurs dans la console du navigateur.

Test HTTP facultatif, exclusivement avec des identifiants fictifs :

```bash
curl -i -X POST http://127.0.0.1:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"us03-demo@example.com","password":"ExamplePass123!"}'
```

Une inscription valide renvoie **201** et l'utilisateur, **pas de JWT**. Un doublon renvoie **422**. Le compte test reste enregistré dans la base PostgreSQL locale.

## Critères de validation

- [ ] Tests Laravel verts : inscription, erreurs, doublon de casse, longueur du mot de passe, hash et absence de JWT.
- [ ] Build/tests Angular verts : seules les données email/password sont transmises, erreurs serveur affichées.
- [ ] Migration PostgreSQL exécutée **sans remise à zéro**.
- [ ] Parcours navigateur opérationnel sur Nginx, tailles desktop/mobile du handoff.
- [ ] Revue du développeur et mise à jour du journal IA bilingue avant fusion dans `develop`.

**Hors US03 :** JWT, session connectée, historique protégé, upload effectif, recette Figma pixel-perfect intégrale et déploiement public.

---
layout: default
title: "DataShare — Installation locale du MVP"
permalink: /installation.fr.html
lang: fr
---

# Installer DataShare en local

[**English**](installation.md) · [Accueil de la documentation](index.md) · [README complet](https://github.com/jlbokass/datashare/blob/develop/README.md)

**MVP fonctionnel US01–US06.** Cette procédure est destinée à un poste de développement (macOS, Linux ou autre hôte Docker). Elle lance Laravel 13, Angular 22 et PostgreSQL 18 **localement** : **http://127.0.0.1:8080/**. Aucun service applicatif n'est hébergé par GitHub Pages.

## Prérequis

Git, Docker Desktop ou Docker Engine avec Compose v2, Docker démarré. PHP, Composer, Node et PostgreSQL sont fournis par les conteneurs.

## Installation neuve

**1. Récupérer les sources :**

```bash
git clone https://github.com/jlbokass/datashare.git
cd datashare
git switch develop
```

`develop` contient les six US et les lots qualité ; `main` représente la dernière livraison publiée. Sur un poste déjà configuré, **préserver les fichiers `.env` existants**.

**2. Créer les configurations locales :**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Dans `.env` (racine), remplacer `POSTGRES_PASSWORD` par un mot de passe local propre au projet. Dans `backend/.env`, laisser `APP_ENV=local` et renseigner `JWT_SECRET` avec le résultat de `openssl rand -hex 32` (**64 caractères hexadécimaux**). Ne pas utiliser `APP_KEY` comme secret JWT. Les `.env` sont exclus du dépôt : ne jamais les versionner ou les communiquer.

**3. Installer les dépendances PHP et générer la clé Laravel :**

```bash
docker compose config --quiet
docker compose build php
docker compose run --rm php sh -lc 'cd backend && composer install --prefer-dist --no-interaction'
docker compose run --rm php sh -lc 'cd backend && php artisan key:generate'
```

**4. Démarrer les services et migrer la base :**

```bash
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
```

Au premier démarrage, `frontend` installe automatiquement les dépendances Node dans un volume dédié, partagé avec le service CLI `node`. Le service `scheduler` assure la purge planifiée des fichiers expirés.

**5. Vérifier et utiliser :**

```bash
curl -fsS http://127.0.0.1:8080/api/health
bash scripts/qa.sh all
```

Visiter **http://127.0.0.1:8080/**. La route `/api/health` ne vérifie pas à elle seule PostgreSQL ; la migration et son statut l'attestent séparément. La CI Laravel exécute ses tests avec SQLite en mémoire.

## Dépannage et limites

Si Nginx répond d'abord `502`, vérifier `docker compose logs -f frontend app web` : le premier `npm ci` dans le conteneur frontend peut être encore en cours. Éviter d'écraser les `.env` ou de supprimer les volumes. Pour arrêter sans effacer la base : `docker compose down` (**jamais `down -v` sans vouloir supprimer les données**).

Les trois workflows CI et les lots qualité ont été validés ; voir [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md). Cette configuration de développement ne doit pas être exposée à Internet.

## Services et diagnostics

| Service | Rôle |
| --- | --- |
| `db` | PostgreSQL 18, réseau Docker privé, volume persistant monté dans `/var/lib/postgresql` |
| `app` | Laravel via PHP-FPM 8.4, réseau privé |
| `frontend` | Angular 22, serveur de développement et HMR |
| `web` | Nginx, seule entrée HTTP locale sur le port 8080 ; routes API et `/up` vers Laravel |
| `scheduler` | Purge Laravel |
| `php`, `node` | Outils CLI ponctuels, profil `tools` |

Le projet Compose `datashare-p3` isole ses conteneurs et volumes. Les sources sont montées ; Angular détecte les changements avec `--poll 1000` et Nginx relaie les WebSockets HMR. Les dépendances Node utilisent un volume dédié ; les changements de lockfile peuvent nécessiter `npm ci`. Les variables PostgreSQL injectées par Compose priment sur les anciennes valeurs SQLite locales.

```bash
docker compose exec -T db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose exec -T app php artisan migrate:status
curl -fsS http://127.0.0.1:8080/up
docker compose run --rm php php -v
docker compose run --rm php composer --version
docker compose run --rm php php -m
docker compose run --rm node node --version
docker compose run --rm node npm --version
```

Ces diagnostics sont ponctuels, à utiliser si nécessaire. Ne jamais publier les secrets interpolés par Compose. Voir [MAINTENANCE](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md) pour la démonstration de purge et les procédures d'exploitation.

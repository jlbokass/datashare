---
layout: default
title: "DataShare — Installation locale du MVP"
permalink: /installation.fr.html
lang: fr
---

# Installer DataShare en local

[**English**](installation.md) · [Accueil de la documentation](index.fr.md) · [README complet](https://github.com/jlbokass/datashare/blob/main/README.fr.md)

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

`develop` contient les six US ; après la livraison vers `main`, la branche principale représentera la version publiée. Sur un poste déjà configuré, **préserver les fichiers `.env` existants**.

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

Les [badges de qualité](index.fr.md) correspondent aux tests Laravel/Pint et Angular/build dans GitHub Actions. La couverture chiffrée, les tests E2E, la sécurité, les performances et la [conformité UI](https://github.com/jlbokass/datashare/issues/37) restent à valider avant la livraison définitive OC. Cette configuration ne doit pas être exposée à Internet telle quelle.

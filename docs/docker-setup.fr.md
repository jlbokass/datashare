---
layout: default
title: "DataShare — Démarrage Docker"
permalink: /docker-setup.fr.html
lang: fr
---

# DataShare — Environnement Docker en premier

[**English**](docker-setup.md) · [Accueil de la documentation](index.fr.md)

**Document d'archive TECH-02 :** ce lot préparait les dépendances avant la génération des applications. Les tests Docker ont été déclarés verts depuis et US01–US06 ont été implémentées. **Pour installer le MVP actuel**, utiliser le [guide d'installation à jour](installation.fr.md). Les descriptions d'étapes suivantes restent une trace du socle initial, pas l'état de livraison actuel.

## Pourquoi Docker avant les frameworks ?

Les spécifications OpenClassrooms autorisent Laravel/PHP, Angular, PostgreSQL et le stockage privé local. Docker est **notre choix d'environnement de travail**, pas une obligation d'OC.

Commencer par Docker permet de générer les deux applications **avec les versions présentes dans les conteneurs**. Nous isolons également PostgreSQL des autres projets locaux, notamment `datashare-legacy`.

| Service | Rôle actuel | Image |
| --- | --- | --- |
| `db` | PostgreSQL, contrôle de santé et volume nommé persistant | `postgres:18` |
| `php` | Conteneur ponctuel PHP + Composer + `pdo_pgsql` | `php:8.4-fpm-bookworm` + `composer:2` |
| `node` | Conteneur ponctuel Node + npm | `node:24-bookworm-slim` |

Seule la base est démarrée par `docker compose up -d db`. Les services `php` et `node` utilisent un **profil d'outillage Compose** et s'exécutent via `docker compose run --rm`. Nginx et les serveurs applicatifs seront raccordés **après** la génération des frameworks.

## Prérequis

- Docker Desktop avec Compose v2, lancé sur le Mac.
- Git et le nouveau dépôt `datashare` récupéré localement.
- Aucune installation PHP, Composer, Node ou PostgreSQL sur l'hôte n'est nécessaire pour ces commandes.

## Première recette locale

Depuis la racine du dépôt, sur la branche `chore/tech-02-docker-foundation` :

```bash
cp .env.example .env
```

**Modifie `.env` pour remplacer `POSTGRES_PASSWORD` par un mot de passe local unique.** Ce fichier est exclu du suivi Git par `.gitignore`. Ne transmets jamais de véritables secrets dans les issues, captures ou logs.

```bash
# Valider la configuration sans afficher les secrets interpolés.
docker compose config --quiet

# Démarrer uniquement PostgreSQL.
docker compose up -d db
docker compose ps

# Vérifier que PostgreSQL accepte les connexions.
docker compose exec -T db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Construire et vérifier le conteneur PHP/Composer.
docker compose build php
docker compose run --rm php php -v
docker compose run --rm php composer --version
docker compose run --rm php php -m

# Vérifier les versions Node/npm dans le conteneur.
docker compose run --rm node node --version
docker compose run --rm node npm --version
```

**Critères attendus :** PostgreSQL en état sain ; PHP **8.4.x** avec `pdo_pgsql`, `mbstring` et `zip` ; Composer fonctionnel ; Node **24.x** et npm opérationnel. Ne fournir que des **sorties non confidentielles** lors de la recette de la PR.

Le dépôt est monté dans `/workspace` pour permettre l'installation officielle de Laravel/Angular **dans la prochaine issue**. Les dépendances générées seront ignorées par Git, les lockfiles resteront versionnés.

## Isolation et cycle de vie

- Nom du projet Compose : **`datashare-p3`**, distinct des conteneurs et volumes de l'ancien projet.
- PostgreSQL n'expose **aucun port sur l'hôte**. Les conteneurs y accèdent via le nom `db` et le port `5432`.
- PostgreSQL 18 conserve ses données dans `/var/lib/postgresql/18/docker` : le volume nommé est monté sur **`/var/lib/postgresql`**, et non sur le chemin des versions 17 et précédentes.
- `docker compose down` arrête et supprime les conteneurs et le réseau **sans supprimer le volume de la base**. **Ne pas lancer `docker compose down -v`** sauf si l'effacement de la base est souhaité.
- Il s'agit d'un environnement de développement, **pas d'un déploiement de production**. Ne jamais réutiliser le mot de passe d'exemple en production.

## Incrément suivant

Après validation de la recette locale, générer Laravel 13 et Angular 22 avec leurs outils officiels **depuis** les services `php` et `node`. Ajouter ensuite Nginx, configurer Laravel ⇄ PostgreSQL et Angular ⇄ Laravel puis vérifier les connexions avant US03. Aucun service superflu dans ce premier lot.

**Références :** [Prérequis Laravel 13](https://laravel.com/framework/docs/deployment), [Compatibilité Angular](https://angular.dev/reference/versions), [Image Docker PostgreSQL](https://hub.docker.com/_/postgres), [Profils Compose](https://docs.docker.com/compose/how-tos/profiles), [Variables d'environnement Compose](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).

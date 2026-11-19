# DataShare

**Plateforme de partage sécurisé de fichiers — Projet OpenClassrooms de développement logiciel (P3).**

[English](README.md) · [Français](README.fr.md) · [Documentation](docs/index.md) · [Documentation française](docs/index.fr.md)


[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)

## État du projet

**MVP fonctionnel US01–US06 implémenté et fusionné dans `develop` (19 novembre 2026)** : téléversement privé, lien de téléchargement public, inscription, JWT, historique personnel et suppression individuelle. Les recettes navigateur ont été déclarées réussies par le développeur. La [PR #46](https://github.com/jlbokass/datashare/pull/46) a validé sur GitHub Actions **52 tests Laravel / 364 assertions et Pint**, ainsi que **44 tests Angular et le build de production**. Le projet n'est **pas déployé en production**.

**Restent à traiter avant la livraison OC :** conformité Figma/responsive/accessibilité ([UI-01 #37](https://github.com/jlbokass/datashare/issues/37)), couverture mesurée, tests E2E, vérifications de sécurité, performance et concurrence PostgreSQL. Les fichiers ZIP ne sont pas analysés par antivirus. Les fonctions facultatives US07–US10 ne sont pas annoncées comme disponibles.

Ce dépôt est public afin que l'évaluateur OpenClassrooms puisse consulter code, documentation, issues, PR et historique des commits.

## Périmètre MVP

Les User Stories obligatoires OpenClassrooms sont :

| ID | Fonctionnalité |
| --- | --- |
| US01 | Téléversement authentifié et lien de partage unique |
| US02 | Téléchargement par lien public valide |
| US03 | Création de compte |
| US04 | Connexion utilisateur avec JWT |
| US05 | Historique personnel des envois |
| US06 | Suppression individuelle d'un fichier par son propriétaire |

Les **US07 à US10** sont suivies séparément comme fonctionnalités facultatives. La suppression automatique des fichiers expirés et de leurs métadonnées est déjà **exigée par US01**, même si US10 reste optionnelle.

## Architecture retenue

- **Backend :** API REST PHP / Laravel ; authentification JWT exigée par le sujet.
- **Frontend :** TypeScript / Angular.
- **Base de données :** PostgreSQL.
- **Stockage :** système de fichiers local privé, métadonnées PostgreSQL ; téléversement et purge US01 contrôlés en local par le développeur.
- **Développement :** Docker Compose avec PHP/Composer, Node/npm, PostgreSQL, Nginx et hot reload Angular (TECH-04 déclaré vert en recette locale).

Voir la [documentation technique OC évolutive](docs/technical-documentation.fr.md), la [justification technique](docs/technology-choices.fr.md), l'[architecture](docs/architecture.fr.md), le [MCD UML](docs/data-model.fr.md), le [contrat OpenAPI](docs/api/openapi.yaml), le [guide TECH-04](docs/development.fr.md), la [synthèse du handoff UI](docs/design-handoff.fr.md) et le [guide Docker TECH-02](docs/docker-setup.fr.md).

## Documentation et workflow Git

La documentation est produite en **français et en anglais** dans le même dépôt. Les livrables OC [TESTING](TESTING.fr.md), [SECURITY](SECURITY.fr.md), [PERF](PERF.fr.md) et [MAINTENANCE](MAINTENANCE.fr.md) disposent d'un plan bilingue ; scans, couverture, E2E et mesures de performance sont **à réaliser**. [Accéder à l'accueil français](docs/index.fr.md) ou à la [documentation anglaise](docs/index.md). Le [journal d'utilisation de l'IA](docs/ai-journal.fr.md) retrace les contributions IA et la supervision du développeur ([English](docs/ai-journal.md)).

Workflow : branches de travail → PR → `develop` → PR de livraison revue → `main` protégée. Les [issues](https://github.com/jlbokass/datashare/issues) conservent les User Stories officielles et les tâches restant à réaliser.

Le propriétaire du dépôt indique avoir activé GitHub Pages pour la documentation statique depuis `main` / `docs` : **https://jlbokass.github.io/datashare/**. Le rendu public n'a pas été vérifié indépendamment ici. GitHub Pages **n'exécute pas l'API Laravel**.

## Installation locale — Docker Compose

**Prérequis :** Git et Docker Desktop avec Compose v2, Docker démarré. Pas besoin d'installer PHP, Composer, Node ou PostgreSQL sur le Mac. Environnement réservé au **développement local**, accessible sur `127.0.0.1`, **pas à la production**.

**1. Récupérer les sources.** Tant que la prochaine livraison vers `main` n'est pas fusionnée, `develop` est la branche contenant les six US :

```bash
git clone https://github.com/jlbokass/datashare.git
cd datashare
git switch develop
```

**2. Préparer les deux fichiers de configuration sur une installation neuve :**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Dans `.env` (racine), **remplacer `POSTGRES_PASSWORD` par un mot de passe local unique**. Dans `backend/.env`, conserver `APP_ENV=local` et renseigner `JWT_SECRET` avec **64 caractères hexadécimaux**, obtenus par `openssl rand -hex 32`. Ne pas réutiliser `APP_KEY` comme secret JWT ; la clé Laravel sera générée à l'étape suivante. **Ne pas écraser des fichiers `.env` déjà configurés, ni les commiter ou partager.**

**3. Installer Laravel et générer `APP_KEY` :**

```bash
docker compose config --quiet
docker compose build php
docker compose run --rm php sh -lc 'cd backend && composer install --prefer-dist --no-interaction'
docker compose run --rm php sh -lc 'cd backend && php artisan key:generate'
```

**4. Lancer les services et initialiser PostgreSQL :**

```bash
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
```

Le service `frontend` installe automatiquement ses dépendances Node dans un volume Docker au premier démarrage. **Le service CLI `node` utilise le même volume**, ce qui permet d'exécuter les tests sur une installation neuve. Les services `db` et `scheduler` assurent PostgreSQL et la purge des transferts expirés.

**5. Contrôler le fonctionnement :**

```bash
curl -fsS http://127.0.0.1:8080/api/health
bash scripts/qa.sh all
```

Puis ouvrir **http://127.0.0.1:8080/** pour créer un compte, se connecter, envoyer des fichiers, télécharger via le lien public, consulter l'historique et supprimer un fichier. `qa.sh all` lance les tests Laravel et Pint, les tests Angular et le build frontend. **Les tests Laravel de la CI utilisent SQLite en mémoire** ; la migration ci-dessus vérifie séparément l'accès PostgreSQL en local.

Si la page renvoie temporairement `502`, laisser l'installation initiale Angular se terminer, puis consulter `docker compose logs -f frontend app web`. Pour arrêter sans effacer les données : `docker compose down` (**pas de `down -v`**). Guide technique complémentaire : [environnement de développement](docs/development.fr.md).

## Badges et preuves de qualité

Les badges en haut du README suivent **les workflows GitHub Actions sur `develop`** : `Backend CI` (PHP 8.4, PHPUnit et **Pint**) et `Frontend CI` (Node 24, tests Angular et build). [Historique des workflows](https://github.com/jlbokass/datashare/actions). Dernière revue fonctionnelle vérifiée : [PR #46](https://github.com/jlbokass/datashare/pull/46), [backend](https://github.com/jlbokass/datashare/actions/runs/44446701173) et [frontend](https://github.com/jlbokass/datashare/actions/runs/44446701083) verts.

**Aucun badge de couverture, audit sécurité ou performance** tant qu'aucune mesure automatisée fiable n'existe. Les exigences et preuves restantes sont suivies dans [TESTING](TESTING.fr.md), [SECURITY](SECURITY.fr.md) et [PERF](PERF.fr.md). GitHub Pages publie la **documentation statique** depuis `main/docs` ; l'application Laravel/Angular **n'y fonctionne pas**.

## Référence pédagogique

La mission OC, les spécifications et le modèle de documentation fournis restent en français dans leur version originale. Nos fichiers Markdown sont bilingues. Les [maquettes Figma](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6), le [PDF handoff original de 23 pages](docs/design/DataShare_UI_Design_Handoff_v1.pdf) et la [synthèse bilingue](docs/design-handoff.fr.md) servent de référence visuelle. **US01 est fonctionnelle mais son écran n'est pas encore conforme à Figma** : voir [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

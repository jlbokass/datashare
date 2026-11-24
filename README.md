# DataShare

**Partage temporaire de fichiers — projet OpenClassrooms P3**

[English version](docs/en/README.md) · [Documentation technique](docs/index.md)

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## Le projet

DataShare permet de téléverser des fichiers privés et de les partager temporairement au moyen d'un lien public. Le **produit minimum viable (MVP)** couvre les six fonctionnalités obligatoires (US01–US06) :

- téléversement de fichiers après authentification, envoi de plusieurs fichiers et gestion de leur expiration ;
- lien public et téléchargement sans compte ;
- création de compte et authentification par JWT ;
- historique personnel et suppression individuelle des fichiers.

**État fonctionnel au 23 novembre 2026 :** le MVP, les travaux de validation de la qualité (QL-01 à QL-04) et la recette visuelle des interfaces (UI-01) sont intégrés à `develop`. Les contrôles backend, frontend et de bout en bout (E2E) de la [PR UI-01 #58](https://github.com/jlbokass/datashare/pull/58) ont réussi. L'application fonctionne en environnement local ; elle n'est pas déployée en production.

**Environnement technique :** Angular 22, Laravel 13 / PHP, PostgreSQL 18, Nginx, Docker Compose et GitHub Actions.

## Démarrer en local

Prérequis : Git et Docker avec Compose. Pour une première installation, suivre le [guide pas à pas](docs/installation.fr.md) (configuration des `.env`, dépendances et migrations).

Sur un environnement **déjà configuré**, depuis la racine du dépôt :

```bash
docker compose up -d
docker compose ps
```

Application : **http://127.0.0.1:8080/**

API locale : [Swagger UI](http://127.0.0.1:8080/docs/api) · [Guide API](docs/api/README.fr.md).

Exécuter les tests Laravel et Angular, vérifier le formatage avec Pint et compiler l'application Angular :

```bash
bash scripts/qa.sh all
```

Les tests E2E utilisent un [environnement Docker isolé](TESTING.md) pour protéger les données locales.

### Tester la limite de 1 Go (macOS)

```bash
mkfile -n 1100000000 /tmp/datashare-oversize.zip
# Sélectionner ce fichier dans /upload ; l'envoi doit être refusé.
rm /tmp/datashare-oversize.zip
```

Le fichier de test de **1,1 Go** est un fichier creux (*sparse file*), et non une archive ZIP valide. Il permet de vérifier uniquement le contrôle de la taille du fichier.

## Repères dans le dépôt

```text
frontend/     Angular : pages, navigation et authentification
backend/      Laravel : API, modèles, migrations et tests
docker/       Configuration Nginx et PHP
e2e/          Scénarios Playwright
docs/         Dossier technique et livrables OpenClassrooms
scripts/      Commandes de contrôle qualité
```

## Organisation du développement et traçabilité

Le développement suit le processus suivant : **branche de travail → pull request (PR) vers `develop` → revue et intégration continue (CI) → PR de livraison vers `main`**, branche protégée. Les [issues](https://github.com/jlbokass/datashare/issues), [pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) et [commits de `develop`](https://github.com/jlbokass/datashare/commits/develop/) assurent la traçabilité de la conception, des fonctionnalités et des travaux de validation.

La convention de nommage des nouveaux commits est **`type(scope): action`** (par exemple `feat(upload): ...`, `fix(auth): ...`, `test(e2e): ...`, `docs: ...`). Les messages des commits antérieurs sont conservés sans réécriture de l'historique.

## Documentation et limites

[Documentation OC](docs/technical-documentation.fr.md) · [Architecture](docs/architecture.fr.md) · [Contrat API](docs/api/openapi.yaml) · [Tests](TESTING.md) · [Sécurité](SECURITY.md) · [Performances](PERF.md) · [Maintenance](MAINTENANCE.md) · [Journal IA](docs/ai-journal.fr.md)

L'environnement local utilise **HTTP sans TLS**. Le JWT est conservé uniquement en mémoire ; l'actualisation de la page nécessite donc une nouvelle authentification. Les archives ZIP ne font pas l'objet d'une analyse antivirus. La purge planifiée supprime les fichiers expirés et leurs métadonnées, conformément aux règles de conservation retenues ([HIST-01 #57](https://github.com/jlbokass/datashare/issues/57)). Les fonctionnalités avancées US07 à US10 sont facultatives.

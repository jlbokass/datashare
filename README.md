# DataShare

**Partage temporaire de fichiers — projet OpenClassrooms P3**

[English version](docs/en/README.md) · [Documentation technique](docs/index.md)

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## Le projet

DataShare permet de téléverser des fichiers privés et de les partager temporairement au moyen d'un lien public. Le **MVP obligatoire US01–US06** couvre :

- téléversement authentifié, sélection de plusieurs fichiers et expiration ;
- lien public et téléchargement sans compte ;
- inscription et connexion JWT ;
- historique personnel et suppression individuelle des fichiers.

**État au 23 novembre 2026 :** MVP, lots qualité QL-01 à QL-04 et conformité Figma UI-01 intégrés dans `develop`. Les contrôles backend, frontend et E2E de la [PR UI-01 #58](https://github.com/jlbokass/datashare/pull/58) ont réussi. L'application est **exécutée en local**, pas déployée en production.

**Stack :** Angular 22, Laravel 13 / PHP, PostgreSQL 18, Nginx, Docker Compose et GitHub Actions.

## Démarrer en local

Prérequis : Git et Docker avec Compose. Pour une première installation, suivre le [guide pas à pas](docs/installation.fr.md) (configuration des `.env`, dépendances et migrations).

Sur un environnement **déjà configuré**, depuis la racine du dépôt :

```bash
docker compose up -d
docker compose ps
```

Application : **http://127.0.0.1:8080/**

Vérifier les tests Laravel, le formatage Pint, les tests Angular et le build :

```bash
bash scripts/qa.sh all
```

Les tests E2E utilisent une [stack Docker isolée](TESTING.md) pour protéger les données locales.

### Tester la limite de 1 Go (macOS)

```bash
mkfile -n 1100000000 /tmp/datashare-oversize.zip
# Sélectionner ce fichier dans /upload ; l'envoi doit être refusé.
rm /tmp/datashare-oversize.zip
```

Ce fichier fictif de **1,1 Go** est créé en mode sparse : **ce n'est pas une véritable archive ZIP**. Il sert uniquement au contrôle de taille.

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

Le workflow suivi est **branche de travail → PR vers `develop` → revue/CI → PR de livraison vers `main`** (protégée). Les [issues](https://github.com/jlbokass/datashare/issues), [pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) et [commits de `develop`](https://github.com/jlbokass/datashare/commits/develop/) montrent la progression de la conception aux US, puis aux lots qualité et à l'interface.

Pour les prochains commits, utiliser **`type(scope): action`** (par exemple `feat(upload): ...`, `fix(auth): ...`, `test(e2e): ...`, `docs: ...`). Les messages historiques ne sont pas tous homogènes ; ils sont conservés sans réécriture.

## Documentation et limites

[Documentation OC](docs/technical-documentation.fr.md) · [Architecture](docs/architecture.fr.md) · [Contrat API](docs/api/openapi.yaml) · [Tests](TESTING.md) · [Sécurité](SECURITY.md) · [Performances](PERF.md) · [Maintenance](MAINTENANCE.md) · [Journal IA](docs/ai-journal.fr.md)

En local, l'application utilise **HTTP sans TLS** et la session JWT est volontairement conservée en mémoire : **une actualisation impose une nouvelle connexion**. Les ZIP ne sont pas analysés par antivirus. La purge retire les fichiers expirés et leurs métadonnées ; ce comportement est maintenu par la décision de clôture [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57). Les fonctions avancées US07–US10 restent facultatives.

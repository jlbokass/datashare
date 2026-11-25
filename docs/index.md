---
layout: default
title: "DataShare — Documentation française"
permalink: /
lang: fr
---

# DataShare — Documentation technique

[English](en/index.md) · [Dépôt GitHub](https://github.com/jlbokass/datashare)

**Release du 25 novembre 2026 — [PR #100](https://github.com/jlbokass/datashare/pull/100), [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) (`main`).** Les US01–US06 sont livrées avec US08 (tags privés), US09 (mot de passe par fichier), PROFILE-01 (profil), la pagination de l'historique et OPS-03 (Garage compatible S3, démonstration isolée). Le stockage local privé reste le mode par défaut. US07 (upload anonyme) n'est pas implémentée ; US10 ne fait pas l'objet d'un lot distinct, l'expiration et la purge quotidienne étant déjà couvertes par US01. Le développement fonctionnel est gelé. L'application s'exécute en local, sans déploiement en production.

Les trois workflows CI et la [publication GitHub Pages](https://github.com/jlbokass/datashare/actions/runs/45548825102) ont réussi. GitHub Pages héberge uniquement la documentation.

## Démarrer

[Installation locale](installation.fr.md) · [README](https://github.com/jlbokass/datashare/blob/main/README.md)

## Dossier technique OpenClassrooms

[Documentation technique consolidée — huit sections](technical-documentation.fr.md)

| Sujet | Référence |
| --- | --- |
| Architecture | [Description](architecture.fr.md) · [Draw.io](diagrams/architecture.drawio) · [SVG](diagrams/architecture.svg) |
| Choix technologiques | [Justification et alternatives](technology-choices.fr.md) |
| Modèle de données | [MCD UML](data-model.fr.md) · [Draw.io](diagrams/data-model.drawio) · [SVG](diagrams/data-model.svg) |
| API REST | [Guide](api/README.fr.md) · [Contrat OpenAPI](api/openapi.yaml) |
| Interface | [Recette UI-01 et décisions Figma](design-handoff.fr.md) · [PDF source](design/DataShare_UI_Design_Handoff_v1.pdf) |
| IA et supervision | [Journal d'utilisation de l'IA](ai-journal.fr.md) |

## Qualité

| Document | Résultat de référence |
| --- | --- |
| [TESTING](https://github.com/jlbokass/datashare/blob/main/TESTING.md) | Plan de tests, preuves CI, 6 tests E2E couvrant trois parcours critiques et un test de démarrage |
| [Couverture](coverage.fr.md) | 79,72 % Laravel (83 tests) et 88,00 % Angular (65 tests), release du 25 novembre ; mesures séparées |
| [SECURITY](https://github.com/jlbokass/datashare/blob/main/SECURITY.md) | Audits Composer/npm : aucune vulnérabilité signalée le 23 novembre |
| [PERF](https://github.com/jlbokass/datashare/blob/main/PERF.md) | Mesures locales des 22–23 novembre ; bundle final CI 370,94 ko ; aucune performance de production revendiquée |
| [MAINTENANCE](https://github.com/jlbokass/datashare/blob/main/MAINTENANCE.md) | Exploitation locale, purge, mises à jour et reprise |

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## Projet et livraison

[Issues](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) · [Commits](https://github.com/jlbokass/datashare/commits/develop/)

Le workflow repose sur une branche dédiée, une PR revue vers `develop`, puis une PR distincte de livraison vers `main`. Les documents de référence à la racine sont en français ; leurs [traductions anglaises](en/index.md) sont regroupées dans `docs/en/`. Les liens vers les fichiers à la racine visent `main` ; le site publié suit `main/docs`.

Six contrôles manuels au clavier ont été validés le 24 novembre ([compte rendu](design-handoff.fr.md)) ; il ne s'agit pas d'un audit d'accessibilité complet. La concurrence réelle PostgreSQL et les performances de production ne sont pas démontrées.

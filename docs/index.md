---
layout: default
title: "DataShare — Documentation française"
permalink: /
lang: fr
---

# DataShare — Documentation technique

[English](en/index.md) · [Dépôt GitHub](https://github.com/jlbokass/datashare)

**État au 24 novembre 2026 :** US01–US06, lots qualité QL-01 à QL-04 et recette visuelle UI-01 intégrés dans `develop`. HIST-01 est clôturé : la purge existante est maintenue. L'application fonctionne en local ; GitHub Pages héberge uniquement la documentation.

## Démarrer

[Installation locale](installation.fr.md) · [README](https://github.com/jlbokass/datashare/blob/develop/README.md)

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
| [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md) | Plan de tests, preuves CI, 6 tests E2E couvrant trois parcours critiques et un test de démarrage |
| [Couverture](coverage.fr.md) | 96,36 % Laravel et 79,58 % Angular (lignes mesurées séparément) |
| [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md) | Audits Composer/npm : aucune vulnérabilité signalée le 23 novembre |
| [PERF](https://github.com/jlbokass/datashare/blob/develop/PERF.md) | Mesures locales et limites ; aucune performance de production revendiquée |
| [MAINTENANCE](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md) | Exploitation locale, purge, mises à jour et reprise |

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## Projet et livraison

[Issues](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) · [Commits](https://github.com/jlbokass/datashare/commits/develop/)

Le workflow repose sur une branche dédiée, une PR revue vers `develop`, puis une PR distincte de livraison vers `main`. Les documents de référence à la racine sont en français ; leurs [traductions anglaises](en/index.md) sont regroupées dans `docs/en/`. Les liens vers les fichiers à la racine visent explicitement `develop` ; le site publié suit `main/docs`.

Pour la soutenance : joindre une capture de couverture, préparer la présentation et la fiche d'autoévaluation, et clarifier les règles OC d'utilisation de l'IA. La concurrence réelle PostgreSQL, l'accessibilité clavier et les performances de production ne sont pas attestées par les résultats actuels.

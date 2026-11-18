---
layout: default
title: "DataShare — Intégration continue GitHub Actions"
permalink: /ci.fr.html
lang: fr
---

# CI-01 — Vérifications automatisées

[**English**](ci.md) · [Documentation technique](index.fr.md)

**État : premiers workflows réellement verts sur la branche CI-01 ; revue/fusion dans `develop` encore en attente.**

Au commit `2899a52`, le [run Backend CI](https://github.com/jlbokass/datashare/actions/runs/44319554856) a validé **25 tests PHPUnit (159 assertions)** et Pint ; le [run Frontend CI](https://github.com/jlbokass/datashare/actions/runs/44319554868) a validé **21 tests Angular (5 fichiers)** et le build de production. Ce sont des exécutions GitHub Actions vérifiées.

## Workflows

| Workflow GitHub Actions | Nom du contrôle à conserver | Exécution |
| --- | --- | --- |
| [Backend CI](https://github.com/jlbokass/datashare/blob/ci/github-actions-quality-gates/.github/workflows/backend-ci.yml) | `Backend / Tests and style` | PHP 8.4, validation `composer.json/lock`, installation verrouillée, `APP_KEY` éphémère, tests Laravel sur SQLite en mémoire, style Pint |
| [Frontend CI](https://github.com/jlbokass/datashare/blob/ci/github-actions-quality-gates/.github/workflows/frontend-ci.yml) | `Frontend / Tests and build` | Node.js 24, `npm ci`, tests Angular non interactifs, build de production |

Déclencheurs : **chaque PR vers `develop` ou `main`**, chaque push sur ces branches et exécution manuelle. Aucun filtre de chemins : les checks restent visibles même pour une PR documentaire, indispensable si on les rend obligatoires. Permissions minimales `contents: read`, aucun secret de production, annulation possible des exécutions obsolètes sur une même branche.

**Limite :** la CI Laravel actuelle teste sur **SQLite**, pas encore sur un service PostgreSQL réel. Les E2E navigateur, uploads vers stockage réel, fichiers volumineux, scans de dépendances, couverture et benchmarks sont des travaux distincts. Voir [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.fr.md).

## Livraison continue

GitHub Pages publie déjà `main/docs` après les PR de livraison : c'est une **CD documentaire**, pas un déploiement applicatif. Il n'existe pas encore de serveur de production Laravel/PostgreSQL/Angular validé ni de pipeline de déploiement associé.

Workflow : `branche de travail → PR develop → CI verte → revue/fusion develop → PR main → CI verte → revue/fusion main → GitHub Pages`.

Après avoir constaté des exécutions réellement vertes, activer les checks obligatoires sur `main` et éventuellement `develop` : **Backend / Tests and style** et **Frontend / Tests and build**. Les noms doivent correspondre aux jobs réels affichés dans GitHub. Éviter d'activer une règle bloquante sur un workflow non validé.

## Preuves OC à conserver

Numéro PR, SHA, URL des exécutions Actions, résultat de chaque job, corrections de jobs rouges et captures après exécution. Aucun secret, badge factice ni preuve inventée.

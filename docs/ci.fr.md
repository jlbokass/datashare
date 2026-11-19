---
layout: default
title: "DataShare — Intégration continue GitHub Actions"
permalink: /ci.fr.html
lang: fr
---

# CI-01 — Vérifications automatisées

[**English**](ci.md) · [Documentation technique](index.fr.md)

**État au 19 novembre 2026 : les deux workflows sont intégrés à `develop` et valident chaque PR vers `develop` et `main`.** Les badges suivent la branche `develop` et reflètent les exécutions réelles.

Sur la dernière User Story fonctionnelle [PR #46](https://github.com/jlbokass/datashare/pull/46) : [Backend CI](https://github.com/jlbokass/datashare/actions/runs/44446701173) **52 tests Laravel, 364 assertions et Pint verts** ; [Frontend CI](https://github.com/jlbokass/datashare/actions/runs/44446701083) **44 tests Angular et build de production verts**. Il s'agit de preuves GitHub Actions, sans couverture chiffrée ni audit de sécurité.

## Workflows

| Workflow GitHub Actions | Nom du contrôle à conserver | Exécution |
| --- | --- | --- |
| [Backend CI](https://github.com/jlbokass/datashare/blob/develop/.github/workflows/backend-ci.yml) | `Backend / Tests and style` | PHP 8.4, validation `composer.json/lock`, installation verrouillée, `APP_KEY` éphémère, tests Laravel sur SQLite en mémoire, style Pint |
| [Frontend CI](https://github.com/jlbokass/datashare/blob/develop/.github/workflows/frontend-ci.yml) | `Frontend / Tests and build` | Node.js 24, `npm ci`, tests Angular non interactifs, build de production |

Déclencheurs : **chaque PR vers `develop` ou `main`**, chaque push sur ces branches et exécution manuelle. Aucun filtre de chemins : les checks restent visibles même pour une PR documentaire, indispensable si on les rend obligatoires. Permissions minimales `contents: read`, aucun secret de production, annulation possible des exécutions obsolètes sur une même branche.

**Limite :** la CI Laravel actuelle teste sur **SQLite**, pas encore sur un service PostgreSQL réel. Les E2E navigateur, uploads vers stockage réel, fichiers volumineux, scans de dépendances, couverture et benchmarks sont des travaux distincts. Voir [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.fr.md).

## Livraison continue

GitHub Pages publie déjà `main/docs` après les PR de livraison : c'est une **CD documentaire**, pas un déploiement applicatif. Il n'existe pas encore de serveur de production Laravel/PostgreSQL/Angular validé ni de pipeline de déploiement associé.

Workflow : `branche de travail → PR develop → CI verte → revue/fusion develop → PR main → CI verte → revue/fusion main → GitHub Pages`.

Après avoir constaté des exécutions réellement vertes, activer les checks obligatoires sur `main` et éventuellement `develop` : **Backend / Tests and style** et **Frontend / Tests and build**. Les noms doivent correspondre aux jobs réels affichés dans GitHub. Éviter d'activer une règle bloquante sur un workflow non validé.

## Preuves OC à conserver

Numéro PR, SHA, URL des exécutions Actions, résultat de chaque job, corrections de jobs rouges et captures après exécution. Aucun secret, badge factice ni preuve inventée.

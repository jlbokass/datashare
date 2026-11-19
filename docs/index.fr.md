---
layout: default
title: "DataShare — Documentation française"
permalink: /fr.html
lang: fr
---

# DataShare — Documentation technique

[**Français**](index.fr.md) · [**English**](index.md)

Prototype de plateforme de partage sécurisé de fichiers — P3 OpenClassrooms.

**État au 19 novembre 2026 :** les **six User Stories obligatoires US01–US06 sont intégrées dans `develop`** et ont fait l'objet de recettes fonctionnelles déclarées réussies par le développeur. La [PR #46](https://github.com/jlbokass/datashare/pull/46) dispose de contrôles GitHub Actions verts. Il ne s'agit **ni d'une application déployée en production ni d'une validation de conformité Figma** ; [UI-01](https://github.com/jlbokass/datashare/issues/37) et les preuves qualité finales restent ouvertes.

## Installation locale du MVP

[Guide d'installation étape par étape](installation.fr.md) · [README français et commandes Docker](https://github.com/jlbokass/datashare/blob/main/README.fr.md). Les services applicatifs se lancent en local avec Docker Compose, sur **http://127.0.0.1:8080/**. GitHub Pages **ne publie pas l'application**.

## Documentation technique centralisée OC

[Documentation technique — huit sections du modèle OC](technical-documentation.fr.md) (ébauche évolutive). Fichiers de qualité à la racine : [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.fr.md), [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.fr.md), [PERF](https://github.com/jlbokass/datashare/blob/develop/PERF.fr.md), [MAINTENANCE](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.fr.md). **Les plans existent ; E2E, couverture, scans et mesures restent à produire.**

## Livrables de conception

| Livrable | Documentation | Fichiers complémentaires |
| --- | --- | --- |
| **DESIGN-01 — Architecture** | [Architecture de l'application](architecture.fr.md) | [draw.io modifiable](diagrams/architecture.drawio) · [Schéma SVG](diagrams/architecture.svg) |
| **DESIGN-02 — Modèle conceptuel** | [MCD UML](data-model.fr.md) | [draw.io modifiable](diagrams/data-model.drawio) · [Schéma SVG](diagrams/data-model.svg) |
| **DESIGN-03 — Contrat d'interface** | [Contrat de l'API REST](api/README.fr.md) | [OpenAPI 3.1 YAML](api/openapi.yaml) |
| **DESIGN-04 — Justification technique** | [Choix technologiques](technology-choices.fr.md) | Comparaison des alternatives et compromis |

Les quatre documents existent en français et en anglais. Les fonctionnalités optionnelles figurent dans **le même MCD** que le MVP, avec une présentation visuelle distincte.

## Utilisation de l'IA et supervision

Le [journal d'utilisation de l'IA](ai-journal.fr.md) documente les tâches confiées, décisions du développeur, corrections et preuves, avec une [version anglaise](ai-journal.md). Les premières entrées sont explicitement rétrospectives.

## Intégration continue et badges de qualité

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)

Les badges suivent les workflows réels de **`develop`**, pas une couverture inventée. [CI-01 — guide et limites](ci.fr.md) : backend PHP/Laravel avec Pint, frontend Angular avec tests et build. Dernière validation fonctionnelle connue : [US06 PR #46](https://github.com/jlbokass/datashare/pull/46), **52 tests Laravel / 364 assertions et 44 tests Angular**. E2E, audit sécurité, couverture mesurée et performance ne sont pas encore validés.

## Environnement de développement

[Dépendances Docker-first](docker-setup.fr.md) (TECH-02) · [Intégration Laravel/Angular et hot reload](development.fr.md) (TECH-04, validée en local par le développeur).

## Référence de conception UI

[Synthèse du handoff et arbitrages de périmètre](design-handoff.fr.md) — tokens, formats desktop/mobile et écart sur le mot de passe US09. Le [PDF source](design/DataShare_UI_Design_Handoff_v1.pdf) est commité sur la branche TECH-04.

## MVP fonctionnel — US01 à US06

- [US03 — Inscription](us03-registration.fr.md) et [US04 — Connexion JWT](us04-jwt-login.fr.md)
- [US01 — Téléversement privé, expiration et purge](us01-upload.fr.md)
- [US02 — Consultation et téléchargement public](us02-public-sharing.fr.md) — recette T01–T05 validée selon le développeur
- [US05 — Historique personnel](us05-personal-history.fr.md) — contrôles de propriété et HTTP 401 validés
- [US06 — Suppression individuelle](us06-file-deletion.fr.md) — recette T01–T05 validée selon le développeur

Ces fonctionnalités sont intégrées dans **`develop`**. La publication depuis `main` et les vérifications visuelles sont des étapes distinctes. Les ZIP ne sont pas analysés par antivirus.

## Exigences du MVP

US01 téléversement connecté · US02 téléchargement par lien · US03 inscription · US04 connexion JWT · US05 historique personnel · US06 suppression individuelle d'un fichier.

US07 à US10 restent facultatives ; **US01 impose déjà l'expiration et la suppression automatique**. Le modèle proposé utilise un lien par transfert, contenant éventuellement plusieurs fichiers gérables individuellement.

## Projet et livraison

[**Dépôt GitHub**](https://github.com/jlbokass/datashare) · [Issues et User Stories](https://github.com/jlbokass/datashare/issues) · [Pull Requests](https://github.com/jlbokass/datashare/pulls)

Le projet suit le workflow branches de travail → `develop` → `main` protégée. GitHub Pages publie **uniquement les documents** depuis `main/docs` ; Laravel nécessitera un environnement d'exécution distinct.

### Livrables qualité encore nécessaires

Les [rapports de tests](https://github.com/jlbokass/datashare/blob/develop/TESTING.fr.md) distinguent preuves GitHub Actions, recettes rapportées et vérifications restantes. **À produire avant la livraison OC** : E2E représentatifs, couverture calculée, sécurité, performance, intégration PostgreSQL concurrente et [conformité UI/responsive](https://github.com/jlbokass/datashare/issues/37).

---

**Langue :** [English documentation](index.md) · [README du dépôt](https://github.com/jlbokass/datashare/blob/main/README.fr.md)

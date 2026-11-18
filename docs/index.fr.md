---
layout: default
title: "DataShare — Documentation française"
permalink: /fr.html
lang: fr
---

# DataShare — Documentation technique

[**Français**](index.fr.md) · [**English**](index.md)

Prototype de plateforme de partage sécurisé de fichiers — P3 OpenClassrooms.

**État actuel :** conception validée et squelettes Laravel/Angular créés. Les premiers contrôles Docker ont été annoncés verts par le développeur ; l'intégration TECH-04 et le hot reload **ont été annoncés verts en recette locale par le développeur** et ne prouvent pas de déploiement applicatif.

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

## Intégration continue

[CI-01 — GitHub Actions, workflows et critères](ci.fr.md) documente les checks backend/frontend. **La première CI applicative n'est pas encore déclarée verte** ; GitHub Pages gère déjà la livraison des documents depuis `main/docs`.

## Environnement de développement

[Dépendances Docker-first](docker-setup.fr.md) (TECH-02) · [Intégration Laravel/Angular et hot reload](development.fr.md) (TECH-04, validée en local par le développeur).

## Référence de conception UI

[Synthèse du handoff et arbitrages de périmètre](design-handoff.fr.md) — tokens, formats desktop/mobile et écart sur le mot de passe US09. Le [PDF source](design/DataShare_UI_Design_Handoff_v1.pdf) est commité sur la branche TECH-04.

## Comptes utilisateurs (en développement)

[US03 — Inscription](us03-registration.fr.md), [US04 — Connexion JWT](us04-jwt-login.fr.md) et [US01 — Téléversement authentifié](us01-upload.fr.md) ont été implémentées et déclarées **vertes en local** par le développeur. US02/US05/US06 restent à faire ; les [écarts visuels UI-01](https://github.com/jlbokass/datashare/issues/37) sont suivis séparément.

## Transferts de fichiers — US01 en revue

Le [guide US01 et ses critères de recette](us01-upload.fr.md) couvre l'envoi JWT multifichier, le stockage privé, l'expiration 1 à 7 jours et la purge planifiée. Le téléchargement public relève d'US02, et non de cette PR non encore validée.

## Exigences du MVP

US01 téléversement connecté · US02 téléchargement par lien · US03 inscription · US04 connexion JWT · US05 historique personnel · US06 suppression individuelle d'un fichier.

US07 à US10 restent facultatives ; **US01 impose déjà l'expiration et la suppression automatique**. Le modèle proposé utilise un lien par transfert, contenant éventuellement plusieurs fichiers gérables individuellement.

## Projet et livraison

[**Dépôt GitHub**](https://github.com/jlbokass/datashare) · [Issues et User Stories](https://github.com/jlbokass/datashare/issues) · [Pull Requests](https://github.com/jlbokass/datashare/pulls)

Le projet suit le workflow branches de travail → `develop` → `main` protégée. GitHub Pages publie **uniquement les documents** depuis `main/docs` ; Laravel nécessitera un environnement d'exécution distinct.

### Preuves de qualité — à compléter après intégration

Le développeur a déclaré verts les contrôles locaux TECH-02–04 et US01–04. Les preuves de CI, E2E, couverture, scans et performances seront ajoutées **uniquement après leur exécution**.

---

**Langue :** [English documentation](index.md) · [README du dépôt](https://github.com/jlbokass/datashare/blob/main/README.fr.md)

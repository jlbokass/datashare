---
layout: default
title: "DataShare — Documentation française"
permalink: /fr.html
lang: fr
---

# DataShare — Documentation technique

[**Français**](index.fr.md) · [**English**](index.md)

Prototype de plateforme de partage sécurisé de fichiers — P3 OpenClassrooms.

**État actuel :** conception validée ; le développement de la nouvelle application Laravel/Angular **n'a pas commencé**. La documentation présente les décisions de conception et ne constitue pas la preuve d'un déploiement.

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

## Exigences du MVP

US01 téléversement connecté · US02 téléchargement par lien · US03 inscription · US04 connexion JWT · US05 historique personnel · US06 suppression individuelle d'un fichier.

US07 à US10 restent facultatives ; **US01 impose déjà l'expiration et la suppression automatique**. Le modèle proposé utilise un lien par transfert, contenant éventuellement plusieurs fichiers gérables individuellement.

## Projet et livraison

[**Dépôt GitHub**](https://github.com/jlbokass/datashare) · [Issues et User Stories](https://github.com/jlbokass/datashare/issues) · [Pull Requests](https://github.com/jlbokass/datashare/pulls)

Le projet suit le workflow branches de travail → `develop` → `main` protégée. GitHub Pages publie **uniquement les documents** depuis `main/docs` ; Laravel nécessitera un environnement d'exécution distinct.

### Implémentation et qualité — à compléter ultérieurement

Les instructions d'installation, tests frontend/backend, CI, couverture, audits de sécurité et mesures de performance seront ajoutés **une fois disponibles**. Aucun badge vert ni résultat de test n'est revendiqué pendant cette phase de conception.

---

**Langue :** [English documentation](index.md) · [README du dépôt](https://github.com/jlbokass/datashare/blob/main/README.fr.md)

# DataShare

**Plateforme de partage sécurisé de fichiers — Projet OpenClassrooms de développement logiciel (P3).**

[English](README.md) · [Français](README.fr.md) · [Documentation](docs/index.md) · [Documentation française](docs/index.fr.md)

## État du projet

**Conception validée ; squelettes Laravel 13 et Angular 22 créés dans TECH-03.** Le développeur a indiqué que les contrôles Docker initiaux, les tests et le build frontend étaient verts. TECH-04 fournit le raccordement des services et le hot reload ; **le développeur confirme la recette locale verte**, migrations PostgreSQL et tests compris.

US03 inscription et US04 connexion JWT ont été validées en recette locale et fusionnées dans `develop`. **US01 téléversement est en cours sur une branche dédiée** ; tests, limites des gros fichiers et parcours navigateur restent à vérifier. [Guide de recette US01](docs/us01-upload.fr.md).

Ce dépôt est public afin que l'évaluateur OpenClassrooms puisse consulter le code, les documents, les issues, les PR et les commits.

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
- **Stockage :** système de fichiers local privé ; disque des transferts et purge quotidienne US01 implémentés sur la branche de travail, recette locale en attente.
- **Développement :** Docker Compose avec PHP/Composer, Node/npm, PostgreSQL, Nginx et hot reload Angular (TECH-04 déclaré vert en recette locale).

Voir la [justification technique](docs/technology-choices.fr.md), l'[architecture](docs/architecture.fr.md), le [MCD UML](docs/data-model.fr.md), le [contrat OpenAPI](docs/api/openapi.yaml), le [guide TECH-04](docs/development.fr.md), la [synthèse du handoff UI](docs/design-handoff.fr.md) et le [guide Docker TECH-02](docs/docker-setup.fr.md).

## Documentation et workflow Git

La documentation est produite en **français et en anglais** dans le même dépôt. [Accéder à l'accueil français](docs/index.fr.md) ou à la [documentation anglaise](docs/index.md). Le [journal d'utilisation de l'IA](docs/ai-journal.fr.md) retrace les contributions IA et la supervision du développeur ([English](docs/ai-journal.md)).

Workflow : branches de travail → PR → `develop` → PR de livraison revue → `main` protégée. Les [issues](https://github.com/jlbokass/datashare/issues) conservent les User Stories officielles et les tâches restant à réaliser.

Le propriétaire du dépôt indique avoir activé GitHub Pages pour la documentation statique depuis `main` / `docs` : **https://jlbokass.github.io/datashare/**. Le rendu public n'a pas été vérifié indépendamment ici. GitHub Pages **n'exécute pas l'API Laravel**.

## Installation et preuves de qualité

La [recette d'intégration locale](docs/development.fr.md) documente TECH-04, **avant exécution**. Ne pas reprendre automatiquement les consignes de l'ancien dépôt `datashare-legacy`.

La CI, la couverture de code et les scans de sécurité ne sont pas encore opérationnels. Les **badges de qualité seront ajoutés lorsque les vérifications correspondantes auront effectivement été exécutées**, sans afficher prématurément un statut vert.

## Référence pédagogique

La mission OC, les spécifications et le modèle de documentation fournis restent en français dans leur version originale. Nos fichiers Markdown sont bilingues. Les [maquettes Figma](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6) servent de référence visuelle.

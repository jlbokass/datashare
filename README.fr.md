# DataShare

**Plateforme de partage sécurisé de fichiers — Projet OpenClassrooms de développement logiciel (P3).**

[English](README.md) · [Français](README.fr.md) · [Documentation](docs/index.md) · [Documentation française](docs/index.fr.md)

## État du projet

**Conception validée ; l'implémentation applicative n'a pas encore commencé dans ce nouveau dépôt.** L'architecture, le modèle conceptuel UML, le contrat OpenAPI et les choix technologiques ont été examinés. Laravel, Angular et Docker sont **prévus**, pas encore installés ni exécutés.

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
- **Stockage :** système de fichiers local privé proposé pour le MVP.
- **Développement :** Docker Compose et Nginx/PHP-FPM prévus après l'initialisation des frameworks.

Voir la [justification technique](docs/technology-choices.fr.md), l'[architecture](docs/architecture.fr.md), le [MCD UML](docs/data-model.fr.md) et le [contrat OpenAPI](docs/api/openapi.yaml).

## Documentation et workflow Git

La documentation est produite en **français et en anglais** dans le même dépôt. [Accéder à l'accueil français](docs/index.fr.md) ou à la [documentation anglaise](docs/index.md).

Workflow : branches de travail → PR → `develop` → PR de livraison revue → `main` protégée. Les [issues](https://github.com/jlbokass/datashare/issues) conservent les User Stories officielles et les tâches restant à réaliser.

GitHub Pages publiera la documentation statique à partir de `main` / `docs` après son activation : **https://jlbokass.github.io/datashare/** (publication non encore vérifiée). GitHub Pages **n'exécute pas l'API Laravel**.

## Installation et preuves de qualité

Les instructions d'installation seront rédigées **une fois les applications et l'environnement Docker réellement créés**. Ne pas reprendre les instructions de l'ancien dépôt `datashare-legacy` pour ce projet reparti de zéro.

La CI, la couverture de code et les scans de sécurité ne sont pas encore opérationnels. Les **badges de qualité seront ajoutés lorsque les vérifications correspondantes auront effectivement été exécutées**, sans afficher prématurément un statut vert.

## Référence pédagogique

La mission OC, les spécifications et le modèle de documentation fournis restent en français dans leur version originale. Nos fichiers Markdown sont bilingues. Les [maquettes Figma](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6) servent de référence visuelle.

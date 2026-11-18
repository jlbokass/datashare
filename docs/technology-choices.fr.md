---
layout: default
title: "Justification des choix technologiques"
permalink: /fr/technology-choices/
lang: fr
---

# DataShare — Justification des choix technologiques

**DESIGN-04 · Justification validée · MVP obligatoire : US01 à US06**

**Références :** mission OpenClassrooms (justification sur **1 à 2 pages**), modèle de documentation technique et spécifications de l'application (technologies autorisées). Les choix ci-dessous décrivent la **solution envisagée**, et non des applications déjà installées.

## Tableau des décisions

| Élément | Choix et état | Alternatives | Justification / compromis |
| --- | --- | --- | --- |
| **Backend** | **PHP + Laravel — retenu** | Symfony (PHP), Spring Boot, ASP.NET Core, NestJS | L'expérience PHP du seul développeur réduit le risque de prise en main. Laravel regroupe routage, validation, autorisations, ORM/migrations, stockage et planification. Symfony est tout aussi autorisé : c'est un choix **adapté au projet**, pas une affirmation de supériorité en performance. |
| **Frontend** | **TypeScript + Angular — retenu** | React, Vue | Composants typés, services, routes et formulaires structurent les parcours privés et publics. En contrepartie, Angular implique des conventions et un outillage de compilation à maîtriser. |
| **Base de données** | **PostgreSQL — retenu** | MongoDB | Le MCD UML comporte des relations claires entre utilisateurs, transferts et fichiers. Contraintes relationnelles et transactions aident à garantir la cohérence des métadonnées et des suppressions ; les migrations nécessitent un suivi. |
| **Stockage** | **Système de fichiers privé local — proposé pour le MVP** | AWS S3 | Autorisé par OC et démontrable sans compte cloud ni service supplémentaire. Laravel contrôle les accès aux téléchargements. Il faut prévoir volume persistant, sauvegardes et capacité disque ; un déploiement multi-serveurs favoriserait ensuite le stockage objet. |
| **Authentification** | **JWT — imposé par OC** | Sessions serveur (non retenues) | Adapté à la séparation Angular/API REST. Laravel doit vérifier les jetons et la propriété des fichiers. Durée de vie, protection côté client et révocation restent à documenter. Le token de partage est **distinct du JWT**. |
| **Passerelle HTTP** | **Nginx + PHP-FPM — proposés** | Serveurs de développement des frameworks | Point d'entrée pour les fichiers Angular et les routes `/api`, avec contrôle des limites d'upload et HTTPS public. Cela ajoute un service à maintenir ; OC ne l'impose pas. |
| **Environnement** | **Docker Compose — prévu** | Installation directe sur l'hôte | Environnement PHP, Node, PostgreSQL et Nginx reproductible pour l'évaluateur. Le coût en configuration justifie son introduction **après l'initialisation classique** de Laravel et Angular, sans générateur de projet OC. |
| **Versionnement** | **Git + GitHub — utilisés** | GitLab | Dépôt public pour l'évaluation ; `main` protégée, `develop` pour l'intégration, branches de travail et PR. Pour ce projet individuel, la protection de `develop` est facultative et non retenue. |
| **Documentation** | **Markdown bilingue ; GitHub Pages — prévu** | Markdown dans le dépôt, PDF | Documents techniques anglais/français versionnés et publiables en site statique. Pages **n'héberge pas l'API Laravel**. |
| **Qualité / CI** | **Tests, linters et GitHub Actions — prévus** | Vérifications manuelles seules | Tests API, frontend et E2E, audits et mesures de performance répondent aux exigences OC. Composer/npm, outils de tests PHP, formatage PHP et lint TypeScript seront précisés à l'initialisation. **Les badges doivent refléter des contrôles réellement exécutés**, pas un objectif. |

## Périmètre et ordre de réalisation

Le MVP comprend **US01 à US06** : contrôle d'accès JWT, fichiers privés, liens publics, **taille maximale de 1 Go**, expiration par défaut à **sept jours** et suppression des fichiers et métadonnées expirés. US07 à US10 restent optionnelles ; la purge à expiration est déjà exigée dans US01.

1. **Concevoir :** [architecture](architecture.fr.md), [MCD UML](data-model.fr.md) et [contrat OpenAPI](api/openapi.yaml) forment la référence.
2. **Initialiser les frameworks** avec leurs outils officiels, **puis intégrer Docker Compose** avant la première User Story.
3. **Développer et tester :** authentification (US03–US04), téléversement/téléchargement (US01–US02), historique/suppression (US05–US06), puis sécurité, performances et preuves CI.
4. **Publier la documentation** via GitHub Pages après fusion de l'index bilingue dans `main`. Une démonstration publique fonctionnelle nécessitera un hébergement applicatif distinct.

**Points restant à fixer avant développement :** validation du stockage privé local, versions des runtimes/frameworks, outils précis de tests/formatage et hébergement de Laravel. Aucun benchmark ni pipeline CI opérationnel n'est affirmé à ce stade.

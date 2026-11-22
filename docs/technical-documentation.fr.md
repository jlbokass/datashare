---
layout: default
title: "DataShare — Documentation technique OpenClassrooms"
permalink: /technical-documentation.fr.html
lang: fr
---

# DataShare — Documentation technique

[**English**](technical-documentation.md) · [Accueil](index.fr.md) · [Dépôt GitHub](https://github.com/jlbokass/datashare)

**État au 22 novembre 2026.** Le MVP **US01–US06** est implémenté sur `develop`. Les tests E2E et les trois CI sont verts sur la [PR #52](https://github.com/jlbokass/datashare/pull/52), **encore en brouillon et non fusionnée**. Aucune mise en production n'est annoncée.

## 1. Architecture de l'application

![Architecture DataShare](diagrams/architecture.svg)

[Description](architecture.fr.md) · [Source draw.io](diagrams/architecture.drawio)

**Navigateur Angular → Nginx → API Laravel → PostgreSQL et stockage privé.** Nginx fournit une origine HTTP unique en développement ; Docker Compose orchestre l'application, la base et le planificateur d'expiration. Le téléchargement public utilise un lien unique, distinct du JWT requis pour les actions du propriétaire. Le trafic local en HTTP ne constitue pas une preuve d'HTTPS en production.

## 2. Choix technologiques justifiés

[Justifications et alternatives détaillées (1–2 pages)](technology-choices.fr.md)

| Domaine | Choix | Motif principal |
| --- | --- | --- |
| Frontend | Angular 22, TypeScript | Composants et formulaires structurés, typage |
| Backend | PHP 8.4, Laravel 13 | API, validation, stockage et planification intégrés |
| Base de données | PostgreSQL 18 | Relations entre utilisateurs, transferts et fichiers |
| Stockage | Système de fichiers local privé | Solution MVP simple, autorisée par les spécifications |
| Authentification | JWT HS256 | API stateless, contrôle des accès côté serveur |
| Outillage | Docker Compose, Nginx, GitHub Actions | Développement reproductible, tests de PR automatisés |

## 3. Modèle de données

[Schéma UML/MCD](data-model.fr.md) · [Diagramme](diagrams/data-model.svg)

Trois entités principales : **Utilisateur** (email unique, mot de passe hashé), **Transfert** (propriétaire, token public et expiration) et **Fichier** (nom, type, taille et chemin de stockage privé). Un utilisateur possède plusieurs transferts ; un transfert contient un ou plusieurs fichiers. Les migrations PostgreSQL se trouvent dans `backend/database/migrations/`. Les tags US08 restent facultatifs et non implémentés.

## 4. Documentation de l'API

[Contrat OpenAPI 3.1](api/openapi.yaml) · [Guide des endpoints](api/README.fr.md)

| Fonctionnalité | Endpoints principaux |
| --- | --- |
| US03 / US04 — inscription et authentification | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| US01 — téléversement authentifié | `POST /api/transfers` |
| US02 — partage et téléchargement publics | `GET /api/shares/{token}`, `GET /api/shares/{token}/files/{fileId}` |
| US05 — historique personnel | `GET /api/transfers` |
| US06 — suppression individuelle | `DELETE /api/transfers/{transferId}/files/{fileId}` |

Ces routes sont implémentées ; les statuts et schémas de requêtes/réponses figurent dans OpenAPI. Les transferts privés nécessitent un JWT, tandis que la consultation d'un lien public valide est anonyme.

## 5. Sécurité et gestion des accès

- **Comptes :** mots de passe hashés/salés, email unique. JWT signé, vérifié côté Laravel et conservé uniquement en mémoire Angular ; la déconnexion efface la session locale mais **ne révoque pas** un JWT déjà émis (durée d'environ 30 minutes).
- **Fichiers :** stockage hors racine publique, nom interne opaque ; contrôles du type MIME et de l'extension, limite de 1 Go par fichier (5 fichiers et 2 Go par transfert choisis pour le MVP). Le téléchargement est forcé en pièce jointe.
- **Partages :** token non prédictible, expiration entre 1 et 7 jours, refus des liens invalides/expirés ; purge planifiée des fichiers et métadonnées. Les ZIP ne sont **pas analysés par antivirus**.
- **Limites :** aucun hébergement public HTTPS, sauvegarde/restauration testée ou audit de sécurité complet n'est démontré. Le **scan basique des dépendances reste à réaliser** dans [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.fr.md).

## 6. Qualité, tests et maintenance

| Livrable demandé | État et renvoi |
| --- | --- |
| **TESTING.md** | [Plan, critères et résultats](https://github.com/jlbokass/datashare/blob/quality/ql-02-clean/TESTING.fr.md) : **52 tests Laravel**, **44 tests Angular**, **6 tests Playwright** PASS ; couverture **96,36 %** backend et **79,58 %** frontend ; trois workflows CI verts sur [PR #52](https://github.com/jlbokass/datashare/pull/52) |
| **SECURITY.md** | [Mesures et risques](https://github.com/jlbokass/datashare/blob/develop/SECURITY.fr.md) documentés ; **scan de vulnérabilités non exécuté** |
| **PERF.md** | [Plan de performance](https://github.com/jlbokass/datashare/blob/develop/PERF.fr.md) présent ; **mesure d'un endpoint et budget frontend à renseigner** |
| **MAINTENANCE.md** | [Procédures locales](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.fr.md), mises à jour, fréquence et risques décrits ; aucune reprise de production testée |

La couverture atteint l'objectif indicatif de 70 %. Une capture de rapport de couverture durable reste à préparer pour la soutenance. Les détails de tests sont dans **TESTING**, sans les dupliquer ici.

## 7. Installation et exécution

[README complet](https://github.com/jlbokass/datashare/blob/develop/README.fr.md) · [Guide Docker](docker-setup.fr.md)

**Prérequis :** Git, Docker et Compose. Initialiser les fichiers `.env` privés selon le README, notamment les secrets PostgreSQL, Laravel et JWT ; ne jamais les commiter.

Depuis la racine, une fois les dépendances initialisées :

```bash
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
bash scripts/qa.sh all
```

L'application est accessible sur `http://127.0.0.1:8080/`. Les E2E utilisent **`compose.test.yaml`**, séparé des données de développement (voir TESTING). Ne pas utiliser `docker compose down -v` sur une base utile. Le déploiement en production n'a pas été réalisé.

## 8. Utilisation de l'IA

[Journal de développement IA](ai-journal.fr.md) · [Version anglaise](ai-journal.md)

L'IA a aidé à préparer certaines implémentations, tests et documentations ; le développeur a cadré les tâches, effectué les recettes, demandé des corrections et validé les changements. Le journal distingue les interventions de l'IA des vérifications humaines, avec renvois aux issues et PR.

**Point à clarifier avant la soutenance :** la mission écrite limite le développement confié à l'IA à une User Story ; le journal décrit des interventions sur plusieurs US. La règle applicable et la manière de présenter ces contributions doivent être confirmées, sans effacer l'historique.

## Travaux restant avant la remise

**Obligatoires encore ouverts :** scan basique de sécurité, test mesuré d'un endpoint critique et budget frontend, preuve visuelle durable de couverture, et revue [Figma / responsive / accessibilité](https://github.com/jlbokass/datashare/issues/37). Préparer également le support de soutenance et la fiche d'autoévaluation. Aucun de ces éléments n'impose de nouveaux tests E2E.

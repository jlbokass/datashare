---
layout: default
title: "DataShare — Documentation technique OpenClassrooms"
permalink: /technical-documentation.fr.html
lang: fr
---

# DataShare — Documentation technique

[**English**](technical-documentation.md) · [Accueil](index.md) · [Dépôt GitHub](https://github.com/jlbokass/datashare)

**État au 24 novembre 2026.** Le MVP US01–US06, les validations QL-01 à QL-04 et la recette visuelle UI-01 sont livrés sur `main` ([PR #68](https://github.com/jlbokass/datashare/pull/68), [97abebd](https://github.com/jlbokass/datashare/commit/97abebd7fc704821e0f8c5bbcedf7f7e0b58590b)). Les trois contrôles CI de la livraison et la publication GitHub Pages ont réussi. Le prototype s'exécute en local ; GitHub Pages publie uniquement la documentation.

## 1. Architecture de l'application

![Architecture DataShare](diagrams/architecture.svg)

[Description](architecture.fr.md) · [Source draw.io](diagrams/architecture.drawio)

**Navigateur Angular → Nginx → API Laravel → PostgreSQL et stockage privé.** Nginx fournit une origine HTTP unique en développement ; Docker Compose orchestre l'application, la base et le planificateur d'expiration. Le téléchargement public utilise un lien unique, distinct du JWT requis pour les actions du propriétaire. Le trafic local en HTTP ne constitue pas une preuve d'HTTPS en production.

### Organisation du dépôt

```text
frontend/src/app/    Pages Angular, authentification et routes
backend/app/         Contrôleurs API, modèles, services et middleware Laravel
backend/database/    Migrations et factories PostgreSQL
backend/tests/       Tests Laravel / PHPUnit
e2e/                 Scénarios Playwright et mesure ponctuelle
docker/              Configuration PHP et Nginx
.github/workflows/   CI backend, frontend et E2E
scripts/             Commandes de vérification
docs/                Livrables techniques, API et maquettes
```

### Navigation de l'application

```text
/                 Accueil public
├── /register     Inscription
├── /login        Connexion
├── /upload       Téléversement (connexion requise)
├── /account      Historique et suppression (connexion requise)
└── /share/:token Lien de téléchargement public
```

Les chemins sont déclarés dans `frontend/src/app/app.routes.ts`. `/upload` réutilise le composant d'accueil et affiche directement le formulaire ; les pages `/upload` et `/account` sont protégées par `authGuard`. Les URLs non reconnues redirigent vers `/`.

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

[Documentation interactive locale](http://127.0.0.1:8080/docs/api) · [JSON généré](http://127.0.0.1:8080/docs/api.json). Scramble 0.13.55 génère OpenAPI 3.1.2 depuis Laravel, avec des corrections documentaires ciblées. Le YAML reste le contrat de conception rapproché de l'implémentation. `RestrictedDocsAccess` réserve les deux routes à l'environnement local ; le middleware JWT existant sélectionne quatre opérations protégées, tandis que quatre opérations métier restent publiques. Deux routes de support publiques figurent aussi dans le document généré.

Export depuis la racine du dépôt : `docker compose exec -T -e APP_URL=http://127.0.0.1:8080 app php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json`. Le [guide API](api/README.fr.md) précise les limites multipart, réponses binaires, corrections 401/404/410/422, limites d'inférence et recette manuelle. Les tailles en octets et conditions de démonstration ne sont pas complètement exprimées par les contraintes générées ; les erreurs du framework ne suivent pas toujours l'enveloppe personnalisée.

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
- **Limites :** aucun hébergement public HTTPS, sauvegarde/restauration testée ou audit de sécurité complet n'est démontré. Les audits de dépendances **Composer et npm ont été réalisés** dans [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md), sans vulnérabilité signalée à la date du contrôle ; ils ne remplacent pas un audit complet.

## 6. Qualité, tests et maintenance

| Livrable demandé | État et renvoi |
| --- | --- |
| **TESTING.md** | [Tests et preuves](https://github.com/jlbokass/datashare/blob/develop/TESTING.md) : couverture des lignes **96,36 %** Laravel et **85,97 %** Angular, **6 tests E2E réussis** sur la version livrée le 24 novembre ; [preuves et mesures datées](coverage.fr.md) |
| **SECURITY.md** | [Audits Composer et npm](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md) réalisés le 23/11/2026 : **aucune vulnérabilité signalée** (QL-03) |
| **PERF.md** | [Mesures QL-04](https://github.com/jlbokass/datashare/blob/develop/PERF.md) : téléchargement local, bundle Angular et relevé Lighthouse sur serveur de développement ; **aucune garantie de performance en production** |
| **MAINTENANCE.md** | [Procédures locales](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md), mises à jour et risques ; aucune reprise de production testée |

La couverture dépasse l'objectif indicatif de 70 % séparément pour Laravel et Angular. Les captures des rapports ont été déclarées préparées pour le dossier de soutenance. Les méthodes, dates et limites des mesures figurent dans les documents liés ci-dessus.

### Workflow et conventions de développement

**Cycle de travail :** issue ciblée → branche dédiée (`feat/`, `fix/`, `quality/` ou `docs/`) → commits → PR vers `develop` → CI et revue humaine → fusion. Une livraison vers `main` protégée passe par une PR distincte. Le [journal IA](ai-journal.fr.md) sépare les contributions de l'IA des décisions et validations du développeur.

**Conventions effectivement observables :**

- **PHP/Laravel :** chargement PSR-4 (`App\` vers `backend/app/`), contrôleurs API, modèles Eloquent, services et validation côté serveur ; mise en forme vérifiée par **Laravel Pint** ; tests **PHPUnit** dans `backend/tests/`.
- **Angular/TypeScript :** composants et templates par écran, routes centralisées, garde d'authentification, tests `*.spec.ts` proches du code ; `.editorconfig` frontend : **2 espaces** et **guillemets simples** en TypeScript. Tests Angular via **Vitest**.
- **E2E :** **Playwright/Chromium** sur `compose.test.yaml`, avec PostgreSQL et stockage isolés. La CI GitHub Actions lance les contrôles backend, frontend et E2E sur PR/push vers `develop` ou `main`.

**Langue de suivi :** pour les prochains lots, rédiger les issues et descriptions de PR en **français**, tout en conservant les termes techniques usuels et les documents de référence **FR/EN**. Les anciennes issues bilingues restent inchangées.

**Conventions de commits :** de nombreux messages suivent déjà `type(scope): description` (`feat`, `fix`, `test`, `docs`, `ci`). Certains commits anciens ou de fusion sont moins homogènes : **l'historique n'est pas réécrit**. Pour la suite, retenir ce format, un changement cohérent par commit et une PR par lot.

**Progression attestée :** [conception/API — PR #16](https://github.com/jlbokass/datashare/pull/16) → [US06 — PR #46](https://github.com/jlbokass/datashare/pull/46) → [couverture — PR #50](https://github.com/jlbokass/datashare/pull/50) → [E2E — PR #52](https://github.com/jlbokass/datashare/pull/52) → [sécurité/performance — PR #54](https://github.com/jlbokass/datashare/pull/54) et [#56](https://github.com/jlbokass/datashare/pull/56) → [UI — PR #58](https://github.com/jlbokass/datashare/pull/58). Les [commits](https://github.com/jlbokass/datashare/commits/develop/) et PR montrent les étapes et corrections ; ils ne prouvent pas une cadence calendaire uniforme.

## 7. Installation et exécution

[README](https://github.com/jlbokass/datashare/blob/develop/README.md) · [Installation pas à pas](installation.fr.md)

**Prérequis :** Git, Docker et Compose. Pour une installation neuve, initialiser les fichiers `.env` privés selon le [guide d'installation](installation.fr.md) (secrets PostgreSQL, Laravel et JWT) ; ne jamais les commiter.

Depuis la racine, une fois les dépendances initialisées :

```bash
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
bash scripts/qa.sh all
```

L'application est accessible sur `http://127.0.0.1:8080/`. Les E2E utilisent **`compose.test.yaml`**, séparé des données de développement (voir TESTING). Ne pas utiliser `docker compose down -v` sur une base utile. Le déploiement en production n'a pas été réalisé.

## 8. Utilisation de l'IA

[Journal de développement IA](ai-journal.fr.md) · [Version anglaise](ai-journal.md)

Les contributions de l'IA portent sur des tâches d'implémentation, de test et de documentation. Le cadrage des tâches, les arbitrages, les demandes de correction et la validation des changements relèvent de la supervision humaine. Le journal IA distingue les contributions, les décisions et les vérifications, avec les références aux issues et pull requests.

### Revue technique du code généré par l'IA

La synthèse ci-dessous présente des exemples de revue et de validation issus du [journal IA](ai-journal.fr.md). Les corrections demandées, les décisions et les résultats des contrôles y sont documentés.

| Fonctionnalité | Constat et décision | Vérification |
| --- | --- | --- |
| Inscription (US03, [PR #34](https://github.com/jlbokass/datashare/pull/34)) | Messages de validation initialement en anglais ; correction demandée pour respecter la langue de l'interface. | Recette locale et tests de non-régression signalés réussis après correction ; sorties détaillées non archivées. |
| Téléchargement public (US02, [PR #43](https://github.com/jlbokass/datashare/pull/43)) | Routes perdues lors d'un conflit de fusion, identifiées avec Codex ; restauration des routes et correction du formatage. | CI réussie : 33 tests Laravel, 217 assertions, Pint et contrôles frontend. Cinq scénarios de recette locale validés. |
| Suppression individuelle (US06, [PR #46](https://github.com/jlbokass/datashare/pull/46)) | Contrôle de propriété, suppression limitée au fichier et verrouillage du transfert parent retenus. | [CI backend](https://github.com/jlbokass/datashare/actions/runs/44446497875) : 52 tests et 364 assertions ; [CI frontend](https://github.com/jlbokass/datashare/actions/runs/44446497731) : 44 tests et compilation réussis. Cinq scénarios locaux validés. L'atomicité entre stockage et base de données reste une limite documentée. |

Ces exemples illustrent la supervision des contributions de l'IA par la revue des changements, les tests automatisés et la recette fonctionnelle. Le journal constitue la trace détaillée de ces décisions ; cette synthèse ne constitue pas un audit exhaustif du code.

**Point à clarifier avant la soutenance :** la mission écrite limite le développement confié à l'IA à une User Story ; le journal décrit des interventions sur plusieurs US. La règle applicable et la manière de présenter ces contributions doivent être confirmées, sans effacer l'historique.

## Travaux restant avant la remise

**À finaliser avant la soutenance :** joindre les captures de couverture préparées, finaliser le support de présentation et la fiche d'autoévaluation ; clarifier la règle OC applicable à l'usage de l'IA (section 8). Les audits QL-03, mesures QL-04 et la recette UI-01 sont terminés. [HIST-01 — purge/historique](https://github.com/jlbokass/datashare/issues/57) est clôturé : purge actuelle maintenue sans changement de code ; la pagination est [facultative](https://github.com/jlbokass/datashare/issues/59).

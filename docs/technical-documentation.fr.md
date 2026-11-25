---
layout: default
title: "DataShare — Documentation technique OpenClassrooms"
permalink: /technical-documentation.fr.html
lang: fr
---

# DataShare — Documentation technique

[**English**](technical-documentation.md) · [Accueil](index.md) · [Dépôt GitHub](https://github.com/jlbokass/datashare)

**Release fonctionnelle du 25 novembre 2026 — [PR #100](https://github.com/jlbokass/datashare/pull/100), [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) (`main`).** Le MVP US01–US06 est livré avec les extensions US08 (tags privés), US09 (mot de passe par fichier), PROFILE-01, pagination de l'historique et OPS-03 (Garage S3 isolé). US07 n'est pas implémentée ; la purge quotidienne relève d'US01, sans lot US10 distinct. Les trois CI et la publication GitHub Pages ont réussi. Le prototype fonctionne en local, sans déploiement en production.

## 1. Architecture de l'application

![Architecture DataShare](diagrams/architecture.svg)

[Description](architecture.fr.md) · [Source draw.io](diagrams/architecture.drawio)

**Navigateur Angular → Nginx → API Laravel → PostgreSQL et stockage privé.** Nginx fournit une origine unique en développement (HTTP ou HTTPS local facultatif) ; Docker Compose orchestre l'application, la base et le planificateur d'expiration. Le téléchargement public utilise un lien unique, distinct du JWT requis pour les actions du propriétaire. La terminaison TLS locale utilise mkcert et Nginx ; elle ne constitue pas une preuve d'HTTPS en production. Garage constitue un mode de stockage alternatif sur une instance locale distincte, avec un bucket privé et une base dédiée. Le scheduler exécute le code Laravel sans appel HTTP à l'API.

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
├── /profile      Profil (connexion requise)
└── /share/:token Lien de téléchargement public
```

Les chemins sont déclarés dans `frontend/src/app/app.routes.ts`. `/upload` réutilise le composant d'accueil et affiche directement le formulaire ; les pages `/upload`, `/account` et `/profile` sont protégées par `authGuard`. Les URLs non reconnues redirigent vers `/`.

## 2. Choix technologiques justifiés

[Justifications et alternatives détaillées (1–2 pages)](technology-choices.fr.md)

| Domaine | Choix | Motif principal |
| --- | --- | --- |
| Frontend | Angular 22, TypeScript | Composants et formulaires structurés, typage |
| Backend | PHP 8.4, Laravel 13 | API, validation, stockage et planification intégrés |
| Base de données | PostgreSQL 18 | Relations entre utilisateurs, transferts et fichiers |
| Stockage | Disque local privé ; Garage S3 (démo isolée) | MVP simple autorisé par OC ; stockage objet via l'abstraction Laravel, sans changer l'API |
| Authentification | JWT HS256 | API stateless, contrôle des accès côté serveur |
| Outillage | Docker Compose, Nginx, GitHub Actions | Développement reproductible, tests de PR automatisés |

## 3. Modèle de données

[Schéma UML/MCD](data-model.fr.md) · [Diagramme](diagrams/data-model.svg)

Trois entités principales : **Utilisateur** (email unique, mot de passe hashé), **Transfert** (propriétaire, token public et expiration) et **Fichier** (nom, type, taille et chemin de stockage privé). Un utilisateur possède plusieurs transferts ; un transfert contient un ou plusieurs fichiers. Les migrations PostgreSQL se trouvent dans `backend/database/migrations/`. L'extension facultative US08 associe zéro ou plusieurs tags privés à chaque fichier (30 caractères maximum, unicité par fichier, suppression en cascade). PROFILE-01 complète le compte avec un nom et un prénom facultatifs ; seul `first_name` est ajouté au schéma existant pour ce profil. US09 ajoute `transfer_files.password_hash`, nullable, par fichier. `users.id` et `tags.id` sont des clés internes BIGINT ; l'API expose l'UUID `users.public_id`, tandis que les transferts et fichiers utilisent des UUID.

## 4. Documentation de l'API

[Swagger UI](http://127.0.0.1:8080/docs/api) · [OpenAPI JSON](http://127.0.0.1:8080/docs/api.json) · [Contrat de conception](api/openapi.yaml) · [Guide API](api/README.fr.md)

La documentation est générée à partir de Laravel : les **PHPDoc** décrivent les comportements, les **attributs PHP 8** regroupent les opérations et **Scramble** produit la spécification OpenAPI 3.1. Des corrections ciblées complètent les schémas de fichiers et les réponses que l'inférence ne suffit pas à décrire. **Swagger UI** exploite directement le JSON généré pour la consultation et les essais, sans seconde spécification d'exécution. Cette approche limite les écarts entre le code et la documentation ; le YAML conserve le contrat de conception.

Laravel déclare 13 opérations : Authentication (4), Transfers (4), Public sharing (3) et System (2). Le YAML couvre les 11 opérations métier ; la documentation générée par Scramble, réservée à l'environnement local, inclut également les deux routes de support (`GET /api/health` et `GET /api/demo/capabilities`). Les ressources Swagger UI nécessitent un accès au CDN ; les règles de sécurité et limites de génération sont précisées dans le guide API.

| Fonctionnalité | Endpoints principaux |
| --- | --- |
| US03 / US04 — inscription et authentification | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| PROFILE-01 — profil facultatif | `PATCH /api/auth/me` |
| US01 — téléversement authentifié | `POST /api/transfers` |
| US02 — partage et téléchargement publics | `GET /api/shares/{token}`, `GET /api/shares/{token}/files/{fileId}` |
| US09 — protection facultative par fichier | `POST /api/shares/{token}/files/{fileId}/authorize` puis GET signé |
| US05 — historique personnel | `GET /api/transfers` |
| US06 — suppression individuelle | `DELETE /api/transfers/{transferId}/files/{fileId}` |
| US08 — tags privés (facultatif) | `PUT /api/transfers/{transferId}/files/{fileId}/tags` |
| System — support | `GET /api/health`, `GET /api/demo/capabilities` |

Ces routes sont implémentées ; les statuts et schémas de requêtes/réponses figurent dans OpenAPI. Les transferts privés nécessitent un JWT, tandis que la consultation d'un lien public valide est anonyme.

## 5. Sécurité et gestion des accès

- **Comptes :** mots de passe hashés/salés, email unique. JWT signé, vérifié côté Laravel et conservé uniquement en mémoire Angular ; la déconnexion efface la session locale mais **ne révoque pas** un JWT déjà émis (durée d'environ 30 minutes).
- **Fichiers :** stockage hors racine publique, nom interne opaque ; contrôles du type MIME et de l'extension, limite de 1 Go par fichier (5 fichiers et 2 Go par transfert choisis pour le MVP). Le téléchargement est forcé en pièce jointe.
- **Partages :** token non prédictible, expiration entre 1 et 7 jours, refus des liens invalides/expirés ; purge planifiée des fichiers et métadonnées. Les ZIP ne sont **pas analysés par antivirus**.
- **Protection par fichier (US09) :** hash bcrypt, vérification serveur et rate limiting (5 tentatives/minute/IP). Après validation, URL relative signée valable 60 secondes et réutilisable pendant cette durée, limitée au fichier. Le token, l'expiration et la signature sont vérifiés au download. Aucun hash exposé ni mécanisme de récupération ; pas de chiffrement des fichiers au repos.
- **Limites :** aucun hébergement public HTTPS, sauvegarde/restauration testée ou audit de sécurité complet n'est démontré. Les audits de dépendances **Composer et npm ont été réalisés** dans [SECURITY](https://github.com/jlbokass/datashare/blob/main/SECURITY.md), sans vulnérabilité signalée à la date du contrôle ; ils ne remplacent pas un audit complet.

## 6. Qualité, tests et maintenance

| Livrable demandé | État et renvoi |
| --- | --- |
| **TESTING.md** | [Tests et preuves](https://github.com/jlbokass/datashare/blob/main/TESTING.md) : [Laravel](https://github.com/jlbokass/datashare/actions/runs/45548826977) **79,72 %** (83 tests, 576 assertions), [Angular](https://github.com/jlbokass/datashare/actions/runs/45548827002) **88,00 %** (65 tests), [Playwright](https://github.com/jlbokass/datashare/actions/runs/45548827035) **6/6** ; release du 25 novembre. [Coverage et limites](coverage.fr.md) |
| **SECURITY.md** | [Audits Composer et npm](https://github.com/jlbokass/datashare/blob/main/SECURITY.md) réalisés le 23/11/2026 : **aucune vulnérabilité signalée** (QL-03) |
| **PERF.md** | [Mesures](https://github.com/jlbokass/datashare/blob/main/PERF.md) : endpoint de download et Lighthouse mesurés localement les 22–23 novembre ; bundle final 370,94 ko, sous le seuil de 500 ko, deux avertissements SCSS. Aucune garantie de performance en production |
| **MAINTENANCE.md** | [Procédures locales](https://github.com/jlbokass/datashare/blob/main/MAINTENANCE.md) : logs structurés, Dozzle, scheduler, mises à jour et risques ; aucune reprise de production testée |

Le line coverage dépasse séparément l'objectif indicatif de 70 %. Les captures doivent correspondre à la release de référence ; les mesures antérieures restent historiques. Les six contrôles manuels de navigation clavier du 24 novembre sont validés ([recette UI-01](design-handoff.fr.md)), sans audit RGAA/WCAG complet. SonarQube Cloud complète les CI avec un Quality Gate informatif, distinct des mesures PHPUnit et Vitest.

### Workflow et conventions de développement

**Cycle de travail :** issue ciblée → branche dédiée (`feat/`, `fix/`, `quality/` ou `docs/`) → commits → PR vers `develop` → CI et revue humaine → fusion. Une livraison vers `main` protégée passe par une PR distincte. Le [journal IA](ai-journal.fr.md) sépare les contributions de l'IA des décisions et validations du développeur.

**Conventions techniques :**

- **PHP/Laravel :** chargement PSR-4 (`App\` vers `backend/app/`), contrôleurs API, modèles Eloquent, services et validation côté serveur ; mise en forme vérifiée par **Laravel Pint** ; tests **PHPUnit** dans `backend/tests/`.
- **Angular/TypeScript :** composants et templates par écran, routes centralisées, garde d'authentification, tests `*.spec.ts` proches du code ; `.editorconfig` frontend : **2 espaces** et **guillemets simples** en TypeScript. Tests Angular via **Vitest**.
- **E2E :** **Playwright/Chromium** sur `compose.test.yaml`, avec PostgreSQL et stockage isolés. La CI GitHub Actions lance les contrôles backend, frontend et E2E sur PR/push vers `develop` ou `main`.

**Langue :** suivi en français, vocabulaire technique anglais et documentation bilingue FR/EN.

**Commits :** convention `type(scope): description` (`feat`, `fix`, `test`, `docs`, `ci`), un changement cohérent par commit et une PR par lot. Les commits antérieurs et de merge restent moins homogènes.

**Traçabilité :** [issues](https://github.com/jlbokass/datashare/issues), [commits](https://github.com/jlbokass/datashare/commits/develop/) et [Pull Requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr), de la conception à la [release #100](https://github.com/jlbokass/datashare/pull/100).

## 7. Installation et exécution

[README](https://github.com/jlbokass/datashare/blob/main/README.md) · [Installation pas à pas](installation.fr.md)

**Prérequis :** Git, Docker et Compose ; PHP 8.4 et Node.js 24 sont fournis par les containers. GNU Make est facultatif ; mkcert est nécessaire uniquement pour HTTPS local. Pour une installation neuve, initialiser les fichiers `.env` privés selon le [guide d'installation](installation.fr.md) (secrets PostgreSQL, Laravel et JWT) ; ne jamais les commiter.

Depuis la racine, une fois les dépendances initialisées :

```bash
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
bash scripts/qa.sh all
```

L'application est accessible sur `http://127.0.0.1:8080/` ou, avec le [mode TLS local](installation.fr.md#https-local-facultatif), sur `https://127.0.0.1:8443/`. Les E2E utilisent **`compose.test.yaml`**, séparé des données de développement (voir TESTING). Ne pas utiliser `docker compose down -v` sur une base utile. Le déploiement en production n'a pas été réalisé.

**Raccourcis et outils de démonstration :** `make up`, `make qa`, `make down` (volumes conservés) ; `make scheduler-stop`, `make scheduler-start` et `make scheduler-status` pour la purge dans la stack principale. `make dozzle-up` ouvre le service de logs sur [localhost:9999](http://127.0.0.1:9999/), à arrêter avec `make dozzle-stop`. Swagger UI et la collection Postman sont décrits dans le [guide API](api/README.fr.md). Le [guide d'installation](installation.fr.md) décrit aussi Garage isolé (HTTPS 8444) et ses commandes `make garage-*`.

## 8. Utilisation de l'IA

[Journal de développement IA](ai-journal.fr.md) · [Version anglaise](ai-journal.md)

**Posture.** J'ai utilisé l'IA comme assistant de développement dans une démarche de délégation supervisée : cadrage des tâches, choix d'architecture, arbitrages, demandes de correction et validation des livrables sous ma responsabilité.

**Tâches confiées.** ChatGPT et Codex ont contribué à la conception, à l'implémentation de plusieurs US, à la génération de tests, au debugging et à la documentation. Les issues, commits et Pull Requests retracent les contributions. Le journal IA distingue les propositions, décisions et vérifications.

### Revue technique du code généré par l'IA

La synthèse ci-dessous présente des exemples de revue et de validation issus du [journal IA](ai-journal.fr.md). Les corrections demandées, les décisions et les résultats des contrôles y sont documentés.

| Fonctionnalité | Constat et décision | Vérification |
| --- | --- | --- |
| Inscription (US03, [PR #34](https://github.com/jlbokass/datashare/pull/34)) | Messages de validation initialement en anglais ; correction demandée pour respecter la langue de l'interface. | Recette locale et tests de non-régression signalés réussis après correction ; sorties détaillées non archivées. |
| Téléchargement public (US02, [PR #43](https://github.com/jlbokass/datashare/pull/43)) | Routes perdues lors d'un conflit de fusion, identifiées avec Codex ; restauration des routes et correction du formatage. | CI réussie : 33 tests Laravel, 217 assertions, Pint et contrôles frontend. Cinq scénarios de recette locale validés. |
| Suppression individuelle (US06, [PR #46](https://github.com/jlbokass/datashare/pull/46)) | Contrôle de propriété, suppression limitée au fichier et verrouillage du transfert parent retenus. | [CI backend](https://github.com/jlbokass/datashare/actions/runs/44446497875) : 52 tests et 364 assertions ; [CI frontend](https://github.com/jlbokass/datashare/actions/runs/44446497731) : 44 tests et compilation réussis. Cinq scénarios locaux validés. L'atomicité entre stockage et base de données reste une limite documentée. |

**Supervision.** Revue des diffs, validation fonctionnelle locale et CI permettent de contrôler les contributions ; cette synthèse n'est pas un audit exhaustif du code.

**Apports et limites.** L'IA accélère la préparation du code, des tests et des documents, sans mesure chiffrée de gain de temps. Les erreurs de contexte ou d'exécution exigent une revue humaine. Lors d'un blocage de l'accès Docker, une exécution de PHPUnit dans le service applicatif a réinitialisé le schéma PostgreSQL local via `RefreshDatabase`. Le correctif impose SQLite en mémoire et vérifie la configuration avant les traits de tests ; il a été validé dans la livraison [PR #78](https://github.com/jlbokass/datashare/pull/78). Cet incident illustre la nécessité d'un environnement de test isolé et de procédures non destructives. Les détails et limites sont consignés dans le journal IA.

## Travaux restant avant la remise

**Avant la soutenance :** joindre les captures de coverage de la release du 25 novembre, finaliser le support de présentation et le scénario de démonstration. Le développement fonctionnel est gelé.

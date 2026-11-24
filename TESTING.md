# DataShare — Plan de tests et résultats

[English](docs/en/TESTING.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Suivi QL-02](https://github.com/jlbokass/datashare/issues/51)

**Bilan du 22 novembre 2026.** Le plan de tests couvre les fonctionnalités obligatoires US01–US06 à trois niveaux : backend, frontend et parcours critiques de bout en bout (E2E). Les trois workflows GitHub Actions associés à la [PR #52](https://github.com/jlbokass/datashare/pull/52) ont réussi avant son intégration à `develop`.

## 1. Périmètre et critères d'acceptation

La stratégie de tests combine **PHPUnit** pour les règles métier et les API, **Vitest** pour les composants et services Angular, et **Playwright/Chromium** pour les parcours utilisateurs complets. Les tests E2E sollicitent l'ensemble de la chaîne applicative (Angular, Nginx, Laravel, PostgreSQL et stockage privé), sans simuler l'API.

| Parcours critique | Critères vérifiés | Tests |
| --- | --- | --- |
| **E2E-01 · US03–US04** — inscription, connexion, espace personnel | Inscription HTTP 201 ; connexion et consultation du profil HTTP 200 ; accès API sans JWT refusé (401) ; redirection des visiteurs non authentifiés ; déconnexion côté client | Laravel + Angular ; `registration.spec.ts`, `login.spec.ts`, `session.spec.ts` |
| **E2E-02 · US01–US02** — envoi et partage | Téléversement authentifié HTTP 201 ; lien public ouvert sans session ; nom et **octets du fichier téléchargé identiques** | Laravel + Angular ; `upload-download.spec.ts` |
| **E2E-03 · US05–US06** — historique et suppression | Fichiers visibles par leur propriétaire ; suppressions HTTP 204 ; second fichier encore téléchargeable ; dernier fichier supprimé → lien révoqué (404) | Laravel + Angular ; `history-deletion.spec.ts` |

La suite Playwright comporte **six tests répartis entre les trois parcours métier et un test de démarrage** (`smoke.spec.ts`), qui vérifie l'affichage de l'application. L'enchaînement de l'inscription et de la connexion dans une même session de navigation a fait l'objet d'une validation manuelle ; il n'est pas couvert par un scénario E2E unique.

Les cas détaillés de validation (formats, taille, expiration, JWT, contrôle de propriété et erreurs) sont principalement couverts par les tests Laravel et Angular, afin de limiter la duplication entre les niveaux de tests. Les règles fonctionnelles figurent dans le [périmètre fonctionnel](README.md#le-projet) et le [contrat API](docs/api/openapi.yaml).

## 2. Résultats et preuves

**Référence vérifiée :** commit `9810a88`, PR #52, GitHub Actions du **22/11/2026**.

| Niveau | Résultat CI | Couverture des lignes | Preuve |
| --- | --- | --- | --- |
| **Laravel / PHPUnit + Pint** | **52 tests réussis**, 364 assertions ; formatage conforme | **96,36 %** (318/330) | [Exécution backend](https://github.com/jlbokass/datashare/actions/runs/45076254553) |
| **Angular / Vitest + build** | **44 tests réussis** ; compilation de production réussie | **79,58 %** | [Exécution frontend](https://github.com/jlbokass/datashare/actions/runs/45076254559) |
| **Playwright / Chromium** | **6 tests réussis**, un processus d'exécution, 5,8 s | Sans objet | [Exécution E2E](https://github.com/jlbokass/datashare/actions/runs/45076254577) |

L'objectif indicatif de **70 % de couverture**, défini dans le sujet OpenClassrooms, est atteint séparément pour le backend et le frontend. Ces deux pourcentages ne constituent pas un taux de couverture global. Le [rapport de couverture QL-01](docs/coverage.fr.md) précise les méthodes et le périmètre de mesure.

Le [compte rendu de recette locale du 22 novembre 2026](docs/ai-journal.fr.md) indique également six tests E2E réussis sur six. Les sorties d'exécution locales ne sont pas archivées ; les résultats automatisés consultables dans GitHub Actions constituent la preuve de référence.

Les rapports de couverture sont conservés pendant **14 jours** et la synthèse E2E pendant **7 jours** dans GitHub Actions. Une capture du rapport de couverture est à joindre au dossier de soutenance, conformément aux spécifications ; elle ne figure pas dans ce dépôt.

## 3. Exécuter les tests

Depuis la racine du dépôt, après installation des dépendances selon le [README](README.md) :

```bash
# Tests Laravel, Pint, tests Angular et build
bash scripts/qa.sh all
```

Pour les E2E, utiliser **exclusivement** `compose.test.yaml` : PostgreSQL et stockage y sont temporaires et isolés des données de développement.

```bash
docker compose -f compose.test.yaml up -d --build db app frontend web
docker compose -f compose.test.yaml exec -T app sh -ec '
  export APP_KEY="base64:$(php -r "echo base64_encode(random_bytes(32));")"
  export JWT_SECRET="$(php -r "echo bin2hex(random_bytes(32));")"
  php artisan migrate --force
'
# Quand Angular et l'API sont disponibles :
docker compose -f compose.test.yaml --profile e2e run --rm --no-deps playwright
```

Le [workflow d'intégration continue E2E](.github/workflows/e2e-ci.yml) précise la procédure d'installation dans un environnement neuf et les contrôles de disponibilité des services. **Ne jamais lancer les tests E2E modifiant les données sur `compose.yaml` ni supprimer les volumes de développement.**

## 4. Limites et suites

- Les tests fonctionnels Laravel utilisent notamment **SQLite en mémoire et un stockage simulé**. Les tests E2E complètent ces vérifications par des requêtes HTTP réelles, avec **PostgreSQL et un stockage privé isolés**. Les fichiers utilisés sont de petite taille ; ces tests ne mesurent pas les performances de transferts de 1 Go.
- La couverture des lignes de code ne garantit pas l'absence de défauts. Les captures, vidéos et traces Playwright restent désactivées pour éviter de diffuser des identifiants et des fichiers.
- Les vérifications complémentaires sont documentées dans les rapports d'[audit de sécurité](SECURITY.md), de [performance](PERF.md) et de [recette visuelle des interfaces](docs/design-handoff.fr.md). La navigation au clavier et l'accessibilité ne font pas l'objet d'une validation attestée dans le compte rendu UI-01. Les procédures de mise à jour figurent dans [MAINTENANCE.md](MAINTENANCE.md).

**Conclusion :** les trois parcours critiques ont été validés par les tests E2E et les contrôles d'intégration continue associés.

## 5. Intégration continue et recettes fonctionnelles

Trois workflows GitHub Actions contrôlent les pull requests vers `develop` et `main` : [backend](.github/workflows/backend-ci.yml) (PHP 8.4, Composer, PHPUnit, Pint, PCOV), [frontend](.github/workflows/frontend-ci.yml) (Node 24, npm, Vitest/V8 et compilation) et [E2E](.github/workflows/e2e-ci.yml) (Playwright/Chromium dans un environnement Docker isolé). Les rapports d'exécution sont conservés temporairement sous forme d'artefacts. GitHub Pages assure uniquement la publication de la documentation.

Les résultats des validations fonctionnelles locales sont consignés dans les comptes rendus associés aux fonctionnalités :

| US | Résultats des validations fonctionnelles locales |
| --- | --- |
| US01 | Téléversement d'un PDF et de plusieurs fichiers, expiration à un jour et démonstration avec expiration à cinq minutes ; [#4](https://github.com/jlbokass/datashare/issues/4). |
| US02 | Téléchargement d'un PDF sans compte, téléchargement de plusieurs fichiers, lien invalide, archive ZIP et expiration : cinq scénarios réussis ([PR #43](https://github.com/jlbokass/datashare/pull/43)). Les réponses HTTP 404 et 410 sont également couvertes par des tests automatisés. |
| US03–US04 | Inscription, rejet d'une adresse déjà utilisée ou d'un mot de passe trop court, connexion, déconnexion et rejet des requêtes non authentifiées (HTTP 401) ; [#6](https://github.com/jlbokass/datashare/issues/6), [#7](https://github.com/jlbokass/datashare/issues/7). |
| US05 | Historique du propriétaire, isolation des comptes, historique vide, rejet HTTP 401 et transferts contenant plusieurs fichiers ([PR #45](https://github.com/jlbokass/datashare/pull/45)). |
| US06 | Suppression d'un fichier seul ou parmi plusieurs, annulation, refus de suppression à un autre utilisateur et révocation du lien après suppression du dernier fichier : cinq scénarios réussis ([PR #46](https://github.com/jlbokass/datashare/pull/46)). |

Ces comptes rendus documentent les validations manuelles ; ils ne remplacent pas les rapports d'exécution automatisés. Les accès concurrents à PostgreSQL et les tests de charge avec des fichiers de 1 Go ne sont pas couverts par la suite actuelle.

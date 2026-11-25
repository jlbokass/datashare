# DataShare — Plan de tests et résultats

[English](docs/en/TESTING.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Suivi QL-02](https://github.com/jlbokass/datashare/issues/51)

**Release de référence : 25 novembre 2026 ([PR #100](https://github.com/jlbokass/datashare/pull/100)).** Le plan de tests cible en priorité les US01–US06. La release inclut également des tests automatisés des extensions livrées ; les six tests E2E conservent leur périmètre MVP.

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

### Release finale — 25 novembre 2026

Référence : [PR #100](https://github.com/jlbokass/datashare/pull/100), commit [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) sur `main`. Résultats vérifiés dans les logs des trois workflows de cette release.

| Contrôle | Résultat | Coverage des lignes | Preuve |
| --- | --- | --- | --- |
| Laravel / PHPUnit + Pint | 83 tests réussis, 576 assertions ; Pint réussi | **79,72 %** (456/572) | [CI backend](https://github.com/jlbokass/datashare/actions/runs/45548826977) · [Rapport](https://github.com/jlbokass/datashare/actions/runs/45548826977/artifacts/14992641842) |
| Angular / Vitest + build | 65 tests réussis (8 fichiers) ; build réussi | **88,00 %** | [CI frontend](https://github.com/jlbokass/datashare/actions/runs/45548827002) · [Rapport](https://github.com/jlbokass/datashare/actions/runs/45548827002/artifacts/14993031980) |
| Playwright / Chromium | 6 tests réussis (8,0 s) | Sans objet | [CI E2E](https://github.com/jlbokass/datashare/actions/runs/45548827035) · [Synthèse](https://github.com/jlbokass/datashare/actions/runs/45548827035/artifacts/14992712719) |

L'objectif indicatif de 70 % est atteint séparément pour chaque application. Les artefacts de coverage expirent le **9 décembre 2026** et la synthèse E2E le **2 décembre 2026**. Télécharger ces rapports et joindre les captures de la release au dossier de soutenance ; ces captures ne sont pas versionnées.

### Résultats historiques — 22 novembre 2026

**Référence vérifiée :** commit `9810a88`, PR #52, GitHub Actions du **22/11/2026**.

| Niveau | Résultat CI | Couverture des lignes | Preuve |
| --- | --- | --- | --- |
| **Laravel / PHPUnit + Pint** | **52 tests réussis**, 364 assertions ; formatage conforme | **96,36 %** (318/330) | [Exécution backend](https://github.com/jlbokass/datashare/actions/runs/45076254553) |
| **Angular / Vitest + build** | **44 tests réussis** ; compilation de production réussie | **79,58 %** | [Exécution frontend](https://github.com/jlbokass/datashare/actions/runs/45076254559) |
| **Playwright / Chromium** | **6 tests réussis**, un processus d'exécution, 5,8 s | Sans objet | [Exécution E2E](https://github.com/jlbokass/datashare/actions/runs/45076254577) |

L'objectif indicatif de **70 % de couverture**, défini dans le sujet OpenClassrooms, est atteint séparément pour le backend et le frontend. Ces deux pourcentages ne constituent pas un taux de couverture global. Le [rapport de couverture QL-01](docs/coverage.fr.md) précise les méthodes et le périmètre de mesure.

Le [compte rendu de recette locale du 22 novembre 2026](docs/ai-journal.fr.md) indique également six tests E2E réussis sur six. Les sorties d'exécution locales ne sont pas archivées ; les résultats automatisés consultables dans GitHub Actions constituent la preuve de référence.

Les rapports de couverture sont conservés pendant **14 jours** et la synthèse E2E pendant **7 jours** dans GitHub Actions. Les captures des rapports sont destinées au dossier de soutenance, conformément aux spécifications ; elles ne figurent pas dans ce dépôt.

### Release historique — 24 novembre 2026

Référence : [97abebd](https://github.com/jlbokass/datashare/commit/97abebd7fc704821e0f8c5bbcedf7f7e0b58590b), branche `main`, livraison [PR #68](https://github.com/jlbokass/datashare/pull/68). Les mesures précédentes restent des résultats historiques datés.

| Contrôle | Résultat | Couverture des lignes | Preuve |
| --- | --- | --- | --- |
| Laravel / PHPUnit + Pint | 52 tests réussis, 364 assertions ; formatage conforme | **96,36 %** (318/330) | [CI backend](https://github.com/jlbokass/datashare/actions/runs/45302509975) |
| Angular / Vitest + compilation | 52 tests réussis (7 fichiers) ; compilation réussie | **85,97 %** | [CI frontend](https://github.com/jlbokass/datashare/actions/runs/45302510070) |
| Playwright / Chromium | 6 tests réussis (7,7 s) | Sans objet | [CI E2E](https://github.com/jlbokass/datashare/actions/runs/45302509992) |

Les deux mesures de couverture dépassent séparément l'objectif de 70 %. Les captures des rapports ont été déclarées préparées pour le dossier de soutenance ; elles ne sont pas versionnées ici. Les rapports HTML restent téléchargeables depuis les exécutions GitHub Actions selon la durée de rétention.

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
- Les vérifications complémentaires sont documentées dans les rapports d'[audit de sécurité](SECURITY.md), de [performance](PERF.md) et de [recette visuelle des interfaces](docs/design-handoff.fr.md). La recette manuelle au clavier a été déclarée réussie sur les six contrôles le 24 novembre 2026 ; le [compte rendu UI-01](docs/design-handoff.fr.md) détaille ce périmètre. Il ne s'agit pas d'un audit complet d'accessibilité. Les procédures de mise à jour figurent dans [MAINTENANCE.md](MAINTENANCE.md).

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

### Recette historique Swagger UI (avant les extensions finales)

Le 25 novembre 2026, les 17 contrôles de la [recette QA-API #76](https://github.com/jlbokass/datashare/issues/76) ont été déclarés réussis par le développeur : Authentication (4), Transfers (7), Public sharing (4) et System (2). Les dix opérations documentées à cette étape ont été exercées, notamment le multipart simple et multiple et les téléchargements publics sans JWT. Cette recette locale complète les tests automatisés ; elle ne constitue ni une nouvelle mesure de couverture ni un audit exhaustif de conformité OpenAPI.

### Analyse SonarQube Cloud (facultative, #85)

L'analyse distincte [SonarQube Cloud](.github/workflows/sonarqube-cloud.yml) cible `main` et réutilise les artefacts Clover/LCOV des deux CI réussies sur le même commit, sans relancer les tests. Elle se déclenche après leur achèvement (ou manuellement sur `main` lorsque les artefacts sont disponibles). Les sources analysées sont `backend/app` et `frontend/src`, tests distingués des sources ; les chemins des rapports sont normalisés à la racine du dépôt.

Configuration initiale : importer le dépôt public dans SonarQube Cloud (région EU), désactiver l'analyse automatique au profit de GitHub Actions, puis renseigner les variables GitHub Actions `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY` et le secret `SONAR_TOKEN` (jamais dans Git). Le Quality Gate est informatif ; aucun contrôle obligatoire existant ni protection PostgreSQL ne change. La couverture Sonar peut différer des rapports de lignes PHP/Angular en raison des méthodes de calcul et du périmètre. Le [workflow SonarQube Cloud](https://github.com/jlbokass/datashare/actions/runs/45548892246) a réussi pour le commit de release final. Le succès du workflow ne prouve pas à lui seul un Quality Gate réussi ; les badges restent dynamiques.

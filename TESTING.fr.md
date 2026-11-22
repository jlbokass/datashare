# DataShare — Plan de tests et résultats

[English](TESTING.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Suivi QL-02](https://github.com/jlbokass/datashare/issues/51)

**Bilan du 22 novembre 2026.** Les fonctionnalités obligatoires US01–US06 disposent de tests backend, frontend et de trois scénarios E2E critiques. Sur la [PR #52](https://github.com/jlbokass/datashare/pull/52), les trois workflows GitHub Actions sont **verts**. La fusion dans `develop` reste soumise à revue.

## 1. Périmètre et critères d'acceptation

Les tests sont répartis au niveau le plus adapté : **PHPUnit** pour les règles backend et les API, **Vitest** pour Angular, **Playwright/Chromium** pour les parcours complets. Les tests E2E traversent Angular → Nginx → Laravel → PostgreSQL et le stockage privé, sans simuler l'API.

| Parcours critique | Critères vérifiés | Tests |
| --- | --- | --- |
| **E2E-01 · US03–US04** — inscription, connexion, espace personnel | Inscription HTTP 201 ; connexion et identité HTTP 200 ; accès API sans JWT refusé (401) ; accès anonyme redirigé ; déconnexion effective | Laravel + Angular ; `registration.spec.ts`, `login.spec.ts`, `session.spec.ts` |
| **E2E-02 · US01–US02** — envoi et partage | Téléversement authentifié HTTP 201 ; lien public ouvert sans session ; nom et **octets du fichier téléchargé identiques** | Laravel + Angular ; `upload-download.spec.ts` |
| **E2E-03 · US05–US06** — historique et suppression | Fichiers visibles par leur propriétaire ; suppressions HTTP 204 ; second fichier encore téléchargeable ; dernier fichier supprimé → lien révoqué (404) | Laravel + Angular ; `history-deletion.spec.ts` |

Un sixième test, `smoke.spec.ts`, vérifie l'affichage de l'application. **Les six tests correspondent à trois scénarios métier et un smoke test**, pas à six scénarios supplémentaires. La continuité SPA inscription → connexion a été vérifiée manuellement ; son automatisation dans un test unique n'est pas un critère de recette.

Les validations fines (formats, taille, expiration, JWT, propriété et erreurs) sont principalement couvertes par les tests Laravel et Angular ; elles ne sont pas toutes répétées en E2E. Les règles fonctionnelles figurent dans les [spécifications du projet](README.fr.md#périmètre-mvp) et le [contrat API](docs/api/openapi.yaml).

## 2. Résultats et preuves

**Référence vérifiée :** commit `9810a88`, PR #52, GitHub Actions du **22/11/2026**.

| Niveau | Résultat CI | Couverture des lignes | Preuve |
| --- | --- | --- | --- |
| **Laravel / PHPUnit + Pint** | **52 tests PASS**, 364 assertions ; formatage PASS | **96,36 %** (318/330) | [Run backend](https://github.com/jlbokass/datashare/actions/runs/45076254553) |
| **Angular / Vitest + build** | **44 tests PASS** ; build de production PASS | **79,58 %** | [Run frontend](https://github.com/jlbokass/datashare/actions/runs/45076254559) |
| **Playwright / Chromium** | **6 tests PASS**, un worker, 5,8 s | Sans objet | [Run E2E](https://github.com/jlbokass/datashare/actions/runs/45076254577) |

L'objectif de couverture **70 %**, indicatif dans le sujet OC, est atteint sur les deux bases de code ; **ne pas additionner ni moyenner les deux pourcentages**. Détails et périmètre de mesure : [rapport QL-01](docs/coverage.fr.md). Le développeur a également indiqué **6/6 E2E PASS en local** le 22/11/2026 ; les runs GitHub Actions constituent la preuve indépendante archivée.

Les rapports de couverture CI sont conservés **14 jours** et la synthèse E2E **7 jours** ; leur téléchargement dépend de la rétention GitHub. **Une capture durable d'un rapport de couverture reste à joindre au dossier de soutenance**, comme demandé dans les spécifications.

## 3. Exécuter les tests

Depuis la racine du dépôt, après installation des dépendances selon le [README](README.fr.md) :

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

Le [workflow E2E CI](.github/workflows/e2e-ci.yml) détaille l'installation propre et les contrôles de disponibilité. **Ne jamais lancer les tests E2E mutateurs sur `compose.yaml` ni supprimer les volumes de développement.**

## 4. Limites et suites

- Les tests PHPUnit/Feature utilisent notamment **SQLite en mémoire et un stockage simulé**. Les E2E valident en complément le vrai flux HTTP avec **PostgreSQL et stockage privé isolés**, mais seulement avec de petits fichiers fictifs ; ils ne mesurent pas une charge à 1 Go.
- La couverture de lignes ne garantit pas l'absence de défauts. Les captures, vidéos et traces Playwright restent désactivées pour éviter de diffuser des identifiants et des fichiers.
- **Hors de ce plan de tests :** [scan de sécurité](SECURITY.fr.md) et [test de performance](PERF.fr.md) encore à réaliser ; [conformité Figma et accessibilité](https://github.com/jlbokass/datashare/issues/37) à vérifier. Les procédures de mises à jour figurent dans [MAINTENANCE.fr.md](MAINTENANCE.fr.md).

**Décision QL-02 :** les trois parcours métier et les contrôles CI sont validés. Aucun scénario E2E supplémentaire n'est requis pour ce lot.

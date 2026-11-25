# QL-01 — Mesures de couverture et limites

[English](coverage.md) · [Issue #49](https://github.com/jlbokass/datashare/issues/49) · [Tests](https://github.com/jlbokass/datashare/blob/main/TESTING.md)

## Mesures de référence — release du 25 novembre 2026

Référence : [PR #100](https://github.com/jlbokass/datashare/pull/100), commit [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) sur `main`. Résultats vérifiés dans les logs des trois workflows de cette release.

| Contrôle | Résultat | Coverage des lignes | Preuve |
| --- | --- | --- | --- |
| Laravel / PHPUnit + Pint | 83 tests réussis, 576 assertions ; Pint réussi | **79,72 %** (456/572) | [CI backend](https://github.com/jlbokass/datashare/actions/runs/45548826977) · [Rapport](https://github.com/jlbokass/datashare/actions/runs/45548826977/artifacts/14992641842) |
| Angular / Vitest + build | 65 tests réussis (8 fichiers) ; build réussi | **88,00 %** | [CI frontend](https://github.com/jlbokass/datashare/actions/runs/45548827002) · [Rapport](https://github.com/jlbokass/datashare/actions/runs/45548827002/artifacts/14993031980) |
| Playwright / Chromium | 6 tests réussis (8,0 s) | Sans objet | [CI E2E](https://github.com/jlbokass/datashare/actions/runs/45548827035) · [Synthèse](https://github.com/jlbokass/datashare/actions/runs/45548827035/artifacts/14992712719) |

L'objectif indicatif de 70 % est atteint séparément pour chaque application. Les artefacts de coverage expirent le **9 décembre 2026** et la synthèse E2E le **2 décembre 2026**. Télécharger ces rapports et joindre les captures de la release au dossier de soutenance ; ces captures ne sont pas versionnées.

Angular V8 : 87,15 % des instructions, 78,87 % des branches, 89,07 % des fonctions. Laravel PCOV mesure 572 lignes exécutables contre 330 le 24 novembre. L'évolution du périmètre de code mesuré doit être prise en compte dans l'interprétation de la baisse du pourcentage. Aucun taux global n'est calculé.

## Mesures historiques

| Date (2026) | Laravel : line coverage / tests | Angular : line coverage / tests | E2E | Preuves CI |
| --- | --- | --- | --- | --- |
| 19/11 | 96,36 % (318/330), 52 tests, 364 assertions | 79,58 %, 44 tests | — | [Backend](https://github.com/jlbokass/datashare/actions/runs/44536846489) · [Frontend](https://github.com/jlbokass/datashare/actions/runs/44536846492) |
| 22/11 | 96,36 % (318/330), 52 tests, 364 assertions | 79,58 %, 44 tests | 6/6 (5,8 s) | [Backend](https://github.com/jlbokass/datashare/actions/runs/45076254553) · [Frontend](https://github.com/jlbokass/datashare/actions/runs/45076254559) · [E2E](https://github.com/jlbokass/datashare/actions/runs/45076254577) |
| 24/11 | 96,36 % (318/330), 52 tests, 364 assertions | 85,97 %, 52 tests | 6/6 (7,7 s) | [Backend](https://github.com/jlbokass/datashare/actions/runs/45302509975) · [Frontend](https://github.com/jlbokass/datashare/actions/runs/45302510070) · [E2E](https://github.com/jlbokass/datashare/actions/runs/45302509992) |

Les mesures locales du 19 novembre (Xdebug et V8) concordaient avec la CI. Ces résultats historiques ne décrivent pas le périmètre de la release finale.

## Rapports et reproduction

Les workflows [Backend CI](https://github.com/jlbokass/datashare/blob/main/.github/workflows/backend-ci.yml) (PCOV) et [Frontend CI](https://github.com/jlbokass/datashare/blob/main/.github/workflows/frontend-ci.yml) (Vitest/V8) génèrent les rapports. Ils les archivent pendant 14 jours avec `run.txt` (commit, date, commande et périmètre). Télécharger les rapports depuis **Artifacts** dans les runs ci-dessus.

- Laravel : `backend/coverage/clover.xml`, `backend/coverage/html/index.html`, `backend/coverage/summary.txt`.
- Angular : `frontend/coverage/datashare/` (HTML, LCOV et JSON).
- En local, utiliser les commandes QA autorisées du [plan de tests](https://github.com/jlbokass/datashare/blob/main/TESTING.md). Ne jamais lancer PHPUnit dans les services `app` ou `scheduler`.

## Périmètre et limites

- PHP : `backend/app/**/*.php`, fichiers non couverts inclus ; dépendances, routes, migrations, configuration, tests et vues générées exclus. PCOV mesure les lignes, pas les branches.
- Angular : `frontend/src/**/*.ts`, guards et bootstrap inclus ; fichiers `*.spec.ts`, `*.d.ts`, dépendances et code généré exclus.
- Les tests Laravel utilisent SQLite en mémoire et un stockage simulé. Le coverage ne démontre ni la concurrence PostgreSQL, ni le comportement réel du navigateur, ni la sécurité. Les deux taux ne sont pas agrégés.

**Références :** [PHPUnit](https://docs.phpunit.de/en/12.5/code-coverage.html) · [Angular](https://angular.dev/guide/testing/code-coverage) · [Vitest](https://vitest.dev/config/coverage#coverage-include).

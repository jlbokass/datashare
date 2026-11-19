# QL-01 — Mesures de couverture et limites

[English](coverage.md) · [Issue #49](https://github.com/jlbokass/datashare/issues/49) · [Tests](../TESTING.fr.md)

## Première mesure vérifiée — 19 novembre 2026

Mesure à **03:47 UTC**, commit de base
`0f5e6990357e4c268e2af2df02ab4812e91a34e7` plus configuration QL-01 non commitée.
Code applicatif et tests existants inchangés. Aucun pourcentage global backend/frontend
n'est calculé. **70 % reste un objectif indicatif, pas un seuil CI.**

| Stack / environnement | Couverture de lignes réelle | Résultat des tests | Preuve |
| --- | --- | --- | --- |
| Laravel, macOS PHP 8.4.19 / Xdebug 3.5.0 | **96,36 % — 318/330 lignes exécutables** | **52 verts, 364 assertions**, code 0 | Local : `backend/coverage/clover.xml`, `html/index.html`, `summary.txt` |
| Laravel, GitHub Actions / PCOV | **Pas encore mesurée** | Workflow configuré ; aucune exécution QL-01 publiée | Artefact attendu `backend-coverage-<SHA>` |
| Angular, V8 | **Non mesurée** | Exécution couverture bloquée avant les tests | Artefact attendu `frontend-coverage-<SHA>` |

Le rapport backend local représente **les 20 fichiers PHP de `backend/app/`**.
Méthodes : 87,10 % (27/31) ; classes : 78,95 % (15/19). Ces métriques diffèrent de
la couverture des lignes. Les unités vides/non exécutables n'ajoutent pas de lignes
exécutables. Xdebug était déjà installé : aucune extension/configuration système
n'a été modifiée. La CI sélectionne explicitement PCOV ; son résultat doit être
consigné séparément, sans être déduit de cette mesure Xdebug.

## Reproduction et emplacement des rapports

Backend, depuis `backend/`, avec PCOV actif (CI) ou Xdebug en mode couverture :

```bash
php artisan test --coverage-clover=coverage/clover.xml --coverage-html=coverage/html --coverage-text=coverage/summary.txt
cat coverage/summary.txt
```

Commande exacte de la mesure locale :

```bash
PAO_DISABLE=1 XDEBUG_MODE=coverage /opt/homebrew/opt/php@8.4/bin/php artisan test --coverage-clover=coverage/clover.xml --coverage-html=coverage/html --coverage-text=coverage/summary.txt
```

Frontend, depuis `frontend/`, après un `npm ci` réussi :

```bash
npm run test:coverage
```

Cette commande exécute `ng test --watch=false --coverage`. Vitest est verrouillé en
**5.1.1** et `@vitest/coverage-v8` fixé à **5.1.1**. npm a généré les ajouts du lockfile,
sans modifier les versions déjà verrouillées. Angular produit HTML (`index.html`),
LCOV (`lcov.info`) et totaux JSON (`coverage-summary.json`) dans
`frontend/coverage/datashare/`, avec les pourcentages par fichier dans le terminal.

Les workflows conservent noms/déclencheurs, tests, Pint et build de production.
Ils archivent uniquement leur dossier de couverture avec `actions/upload-artifact`,
dont `run.txt` (SHA, UTC, commande, pilote, périmètre), pour **14 jours**.
L'archivage est tenté même si le job échoue ; l'absence de rapport est une erreur,
pas une couverture validée. Télécharger depuis **Artifacts** de l'exécution.
Seul un run QL-01 vert pourra établir la preuve CI demandée ; aucun n'est revendiqué.
Les rapports sont déjà ignorés par `**/coverage/` ; aucun rapport généré n'est versionné.

## Périmètre de mesure

- PHP : `backend/app/**/*.php`, avec inclusion explicite des fichiers non couverts.
  Dépendances, tests, routes, migrations, configuration et vues générées restent hors
  de cette métrique du code applicatif. PCOV mesure les lignes, pas branches/chemins.
- Angular : **tous les `frontend/src/**/*.ts`**, y compris guards, configuration,
  bootstrap et fichiers sans test dédié. Exclusions : `*.spec.ts` et `*.d.ts`, plus
  les exclusions dépendances/code généré du runner. HTML/CSS ne constituent pas des
  unités TypeScript indépendantes. Aucun composant/service applicatif n'est exclu.
- Comparer le premier rapport frontend à l'inventaire des sources, notamment
  `src/main.ts` et les guards non testés. Ne pas réduire le périmètre pour obtenir du vert.
- Tests sur utilisateurs/fichiers synthétiques, SQLite en mémoire et stockage privé
  factice. Les artefacts contiennent sources/métadonnées de lignes, pas uploads,
  `.env` ou identifiants. La couverture ne prouve ni concurrence PostgreSQL,
  ni comportement navigateur, ni sécurité.

## Contrôles exécutés et blocages

- Commande backend ci-dessus : **PASS** ; Pint et schéma XML PHPUnit : **PASS**.
- `bash scripts/qa.sh all` : **4 contrôles bloqués / code 1**, accès au socket Docker
  refusé avant les tests/build backend/frontend dans le sandbox agent.
- `npm run test:coverage` : **code 1**, provider absent du `node_modules` existant
  (mise à jour lockfile uniquement). L'installation complète dans une copie temporaire
  échoue avec `ENOTFOUND registry.npmjs.org` lors du téléchargement de `zod@4.6.6`.
  Les dépendances existantes sont prévues pour Linux, pas cet hôte macOS. Aucun nombre
  de tests, pourcentage ou build Angular réussi n'est revendiqué pour cette exécution QL-01.
- Les résultats CI fonctionnels précédents (52 tests Laravel / 44 tests Angular sur
  PR #46) restent des preuves historiques, pas des mesures de couverture.

## Suites prioritaires, hors de ce changement

1. Vérifier un run CI PCOV/V8 vert, télécharger les deux artefacts, consigner chaque
   pourcentage/date/SHA/URL séparément et inspecter les sources frontend non testées.
2. Backend : erreurs/nettoyage d'upload dans `CreateTransferController`, lignes
   103, 122, 124–125, 128, 130–133 (9 lignes). Ajouter des tests d'échec ciblés dans
   un lot séparé, sans modifier la logique métier pour augmenter le score.
3. Garde de configuration JWT (`JwtService:21`) et deux méthodes de relation inutilisées
   (`Transfer:23`, `TransferFile:17`) : les 3 autres lignes non couvertes. Privilégier
   les cas sécurité/erreur utiles plutôt que tester des getters pour un pourcentage.
4. Déterminer les priorités frontend après sa mesure réelle. E2E, contention
   PostgreSQL, audits sécurité/performance et UI-01 restent des lots distincts.

Références : [couverture PHPUnit](https://docs.phpunit.de/en/12.5/code-coverage.html),
[couverture Angular](https://angular.dev/guide/testing/code-coverage),
[inclusion des sources Vitest](https://vitest.dev/config/coverage#coverage-include).

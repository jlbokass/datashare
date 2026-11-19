# DataShare — Plan de tests et preuves (OC P3)

[English](TESTING.md) · [Documentation technique](docs/technical-documentation.fr.md)

**Statut : plan évolutif actualisé le 19 novembre 2026.** Les résultats **déclarés verts par le développeur** sont distingués des rapports réellement archivés et des tests futurs.

## Périmètre et état

| Lot | Critères d'acceptation | État des preuves |
| --- | --- | --- |
| US03 inscription | Email valide/unique ; mot de passe ≥8 caractères ; hash salé ; refus doublons et données invalides | Tests backend/frontend et recette navigateur déclarés verts ; message de doublon français corrigé ; pas de rapport joint |
| US04 connexion | JWT signé si identifiants valides ; 401 si mauvais identifiants ou absence de token ; profil protégé | Tests/build et parcours connexion-déconnexion/401 annoncés verts ; captures absentes |
| US01 upload | JWT obligatoire ; 1 à 5 fichiers, 1 Go/fichier, plafond choisi 2 Go cumulés ; stockage privé ; un lien ; expiration 1–7 jours | Docker, migration PostgreSQL, PHPUnit, tests/build Angular, PDF et multifichier, expiration un jour déclarés verts |
| US01 démo locale | Expiration optionnelle à 5 minutes uniquement en local, retour accueil et planificateur à la minute | Tests, correction navigation et démo cinq minutes annoncés verts ; purge physique à la minute non documentée indépendamment |
| US02 | Téléchargement public et expiration | Voir les [preuves US02](docs/us02-public-sharing.fr.md) |
| US05 | Historique propriétaire, JWT, multifichiers et expiration | [Recette locale T01–T04 et multifichiers déclarée OK ; GitHub CI backend 39 tests/255 assertions + Pint, frontend 34 tests + build verts ; restrictions du sandbox Codex documentées séparément](docs/us05-personal-history.fr.md) |
| US06 | Suppression individuelle, propriété, échecs de stockage et coordination purge | [T01–T05 et `qa.sh all` déclarés verts sur le Mac du développeur ; 13 tests Laravel de suppression ajoutés ; CI PR #46 backend 52 tests/364 assertions et Pint verts, frontend 44 tests et build verts ; contention réelle PostgreSQL reportée à la phase qualité](docs/us06-file-deletion.fr.md) |
| UI-01 | Comparaison au Figma à 393 et 1440 px, et largeurs intermédiaires | **Écarts visuels ouverts** : [issue #37](https://github.com/jlbokass/datashare/issues/37) |

**Limite :** les tests PHPUnit utilisent notamment SQLite en mémoire et un stockage factice. La migration PostgreSQL et le vrai transfert navigateur ont été contrôlés séparément par le développeur. Aucun rapport de charge réelle à 1 Go. Les preuves CI QL-01 sont accessibles via les liens ci-dessous et conservées 14 jours.

## Exécution locale

```bash
docker compose config --quiet
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

Les recettes détaillées sont dans [US03](docs/us03-registration.fr.md), [US04](docs/us04-jwt-login.fr.md) et [US01](docs/us01-upload.fr.md). Ne pas versionner d'identifiants, JWT, documents d'utilisateurs ou captures contenant des secrets.

## Preuves restant à produire

- [ ] **2 à 3 scénarios E2E critiques** avec Cypress, Playwright ou équivalent : inscription/connexion, upload/téléchargement, historique/suppression/expiration après US02/05/06.
- [x] QL-01 : [preuves de couverture](docs/coverage.fr.md). **GitHub Actions : Laravel PCOV 96,36 % des lignes (318/330), 52 tests/364 assertions/Pint ; Angular V8 79,58 % des lignes, 44 tests et build de production**. [Run et artefact backend](https://github.com/jlbokass/datashare/actions/runs/44536846489), [run et artefact frontend](https://github.com/jlbokass/datashare/actions/runs/44536846492). Les artefacts expirent le 3 décembre 2026. **70 % reste un objectif indicatif, aucun seuil CI imposé et aucun badge tiers.**
- [x] Workflows GitHub Actions CI-01 intégrés dans `develop` et `main`. Les tests PHP/Angular et la vérification Pint/build sont réellement verts sur [PR #50](https://github.com/jlbokass/datashare/pull/50) ; voir [guide CI](docs/ci.fr.md).
- [ ] Tests réels de taille/limites, 413, purge planifiée, extensions interdites et fichiers corrompus.
- [ ] Accessibilité, vérification Figma desktop/mobile et retours externes si disponibles.

**Traçabilité :** consigner date, SHA, commande, nombre de tests, succès/échec, emplacement des preuves. Ne jamais afficher un badge de qualité avant exécution.

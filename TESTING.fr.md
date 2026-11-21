# DataShare — Plan de tests et preuves (OC P3)

[English](TESTING.md) · [Documentation technique](docs/technical-documentation.fr.md)

**Statut : plan évolutif actualisé le 21 novembre 2026.** Les résultats **déclarés verts par le développeur** sont distingués des rapports réellement archivés et des tests futurs. Cette révision documentaire ne constitue pas une nouvelle exécution des tests.

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

## Plan QL-02 — trois scénarios métier

### Stratégie et sources

**Principe de proportionnalité :** vérifier les critères métier au niveau le moins coûteux qui apporte une confiance suffisante ; ne pas multiplier les tests E2E, les investigations ou l'infrastructure au-delà du besoin documenté.

Le périmètre couvre les parcours critiques US01–US06 du MVP, selon la [transcription du sujet OC P3](README.fr.md#périmètre-mvp), le [contrat API](docs/api/openapi.yaml) et l'[issue #51](https://github.com/jlbokass/datashare/issues/51) consultée le 21 novembre 2026. Le sujet OC P3 original n'est pas versionné dans le dépôt inspecté par Codex, mais a été fourni à l'assistant pour relecture. Son absence du dépôt ne constitue pas une non-conformité du plan.

- **Unitaires/composants :** PHPUnit et Vitest/Angular TestBed vérifient les comportements ciblés ; les doubles HTTP Angular sont permis à ce niveau, pas en E2E.
- **Intégration :** les tests Laravel Feature vérifient routes, JWT, validation, propriété et stockage. Leur SQLite en mémoire et `Storage::fake` ne prouvent pas le fonctionnement PostgreSQL ni les octets réellement transférés.
- **E2E :** Playwright 1.63.0, navigateur Chromium réel, un worker, aucun retry, reporter standard `list`. Angular → Nginx → Laravel → PostgreSQL et stockage privé réels ; aucun mock/interception API, aucun délai arbitraire. Les attentes réseau précèdent les actions ; les sélecteurs utilisent les rôles/libellés accessibles. QL-01, PHPUnit, Vitest, Pint et le build restent complémentaires.

`compose.test.yaml` définit le projet `datashare-ql02-test`, un réseau dédié et aucun port hôte publié. PostgreSQL est en tmpfs ; les sources Laravel sont en lecture seule, avec stockage privé et cache bootstrap en tmpfs distincts des données de développement. Les dépendances frontend/Playwright utilisent des volumes npm séparés, propres au projet de test. La cible navigateur est `http://web` et le runner appartient au profil `e2e`. Ne jamais lancer les E2E mutateurs sur `compose.yaml`. Cette isolation protège le développement ; une stack distincte par scénario n'est pas requise dans la reconstruction `quality/ql-02-clean`.

Préconditions communes : services prêts, migrations appliquées uniquement à la base isolée, dépendances verrouillées et versions package/image Playwright identiques. Chaque parcours utilise un compte unique et uniquement de petits fichiers synthétiques ; une préparation par la vraie API est autorisée et doit être distinguée des actions UI testées. Le JWT reste en mémoire Angular ; un nouveau contexte est anonyme. Aucun mot de passe, JWT, corps HTTP, en-tête d'authentification ou fichier privé dans les preuves ; captures, vidéos et traces désactivées. Rapports/résultats sont ignorés par Git.

### Matrice de traçabilité

Les trois lignes suivantes sont les **trois scénarios métier**, indépendamment du nombre de fichiers ou de sous-tests. Le smoke test est un contrôle technique hors de cette matrice.

| Scénario / US | Préconditions | Principales actions | Résultats attendus | Critères d'acceptation | État réel au 21 novembre 2026 |
| --- | --- | --- | --- | --- | --- |
| **E2E-01 — US03/04 : inscription, connexion et protection du compte** | Comptes synthétiques indépendants ; contexte anonyme séparé ; infrastructure prête | Inscription via l'UI et confirmation ; connexion via l'UI et identité dans `/account` ; accès anonyme et déconnexion | Inscription 201 ; login/me 200 ; titre « Mon espace » et email ; accès sans session redirigé vers `/login`, API sans JWT en 401 ; déconnexion locale effective | 01a, 01b et 01c sont des tests indépendants ; aucun enchaînement SPA unique inscription → connexion n'est imposé | **Validé localement selon le développeur** pour 01a, 01b et 01c ; suite à relancer après restauration du test 01a ; aucune preuve CI QL-02 référencée |
| **E2E-02 — US01/02 : upload authentifié et téléchargement public** | Utilisateur connecté ; petit TXT synthétique aux octets connus ; nouveau contexte sans session | Téléverser via l'UI, récupérer le lien unique, l'ouvrir anonymement, vérifier les métadonnées, télécharger | Upload 201 ; partage accessible sans JWT ; métadonnées cohérentes ; téléchargement abouti | Vérifier effectivement le nom et les octets du fichier reçu, pas seulement la présence du lien ; aucun vrai document ni authentification du destinataire | **À réaliser** : aucun test correspondant présent dans la branche ; aucune preuve locale ou CI pour ce parcours QL-02 |
| **E2E-03 — US05/06 : historique, suppression et révocation** | Utilisateur propriétaire connecté ; transfert de deux fichiers synthétiques ; partage ouvert dans un contexte anonyme | Vérifier l'historique ; si possible, annuler une suppression (facultatif) ; confirmer la suppression du premier fichier ; vérifier le second ; supprimer le dernier | Si l'annulation est testée : aucun DELETE ni changement ; suppressions 204 ; premier fichier retiré ; second toujours téléchargeable via le même lien ; transfert vide retiré ; ancien partage 404 et erreur UI | Contrôler les deux fichiers de l'historique, les octets du fichier restant et la révocation finale ; une seule chaîne métier ; vérification d'annulation facultative, non bloquante pour la clôture | **À réaliser** : aucun test correspondant présent ; vérification d'annulation facultative conformément à l'issue (« si possible ») ; aucune preuve locale ou CI QL-02 |

### État d'E2E-01 et preuves disponibles

- **Smoke** (`e2e/smoke.spec.ts`, commit `2ac0379`) : accueil Angular affiché ; validé localement selon le développeur. Ne compte ni comme scénario métier ni comme preuve d'authentification.
- **E2E-01a** (`e2e/registration.spec.ts`, `459344e`) : inscription UI, POST 201 et confirmation visible ; validé localement selon le développeur.
- **E2E-01b** (`e2e/login.spec.ts`, `6d5c25b`) : création préalable via `APIRequestContext`, connexion UI, POST login/GET me 200, identité affichée et document SPA conservé ; validé localement selon le développeur. Le test ne lit ni ne persiste le JWT.
- **E2E-01c** (`e2e/session.spec.ts`, commit `eec7a4a`) : accès anonyme au compte redirigé vers `/login`, `/api/auth/me` et `/api/transfers` sans JWT en 401, puis déconnexion UI et refus d'accès protégé via retour navigateur dans la même session SPA. Déclaré vert localement par le développeur ; aucune preuve CI QL-02.
- **Parcours continu inscription → connexion : non bloquant**. Les deux opérations sont couvertes par des tests indépendants ; le développeur a aussi vérifié manuellement leur enchaînement. Un test supplémentaire de transition SPA a été tenté puis retiré pour coût de maintenance disproportionné. Il ne constitue ni une exigence OC supplémentaire ni une anomalie applicative démontrée.

Ces validations locales sont des déclarations du développeur, pas des exécutions effectuées lors de cette revue ni des preuves GitHub Actions. Les SHA identifient le code, pas un résultat d'exécution. Les essais Docker précédents de Codex étaient bloqués par le socket ; ils ne sont pas des succès Chromium. Les quatre fichiers actuels (smoke, inscription, connexion, session) couvrent le contrôle technique et E2E-01, **pas E2E-02 ni E2E-03**.

Commande existante à utiliser après préparation de la stack isolée (non exécutée pour cette mise à jour) :

```bash
docker compose -f compose.test.yaml --profile e2e run --no-deps playwright \
  sh -ec 'npm ci --no-audit --no-fund && npm test'
```

### Critères de sortie QL-02 et écarts ouverts

- [ ] Les **trois scénarios métier complets** de la matrice passent localement sur la stack isolée ; E2E-01 est couvert par les validations indépendantes 01a, 01b et 01c. La découverte seule n'est pas une exécution navigateur.
- [ ] Les mêmes parcours passent en CI éphémère, dans un workflow E2E séparé sur PR vers `develop`/`main` et push, avec migrations non destructrices, contrôles de disponibilité, timeout borné et un worker. Un run vert sur PR est lié aux preuves. **Seuls les workflows backend/frontend sont actuellement présents.**
- [ ] Absence de régression vérifiée par Laravel/Pint/Angular/build (`bash scripts/qa.sh all`) et les CI existantes. Préserver la mesure QL-01 sans exclusions artificielles ; les références 52 tests Laravel/44 Angular et les pourcentages QL-01 sont historiques, pas des résultats fraîchement exécutés sur cette branche.
- [ ] Pour chaque scénario : date, SHA, commande, environnement/version Chromium, nombre de tests, PASS/FAIL/SKIPPED, limitations et rapport assaini ; pour CI, URL du run/job et artefact à rétention courte. Une preuve expirée doit être régénérée. Les rapports ne doivent contenir aucun secret ni fichier utilisateur.
- **Historique de l'issue #51 :** l'ancien runner décrit dans l'addendum du 19 novembre (`scripts/e2e.sh`, empreintes d'images, découverte par scénario, diagnostics automatiques et stack distincte par scénario) a été abandonné lors de la reconstruction de `quality/ql-02-clean`. Sa réimplémentation n'est pas un critère de sortie. L'isolation des données, les preuves d'exécution assainies et archivées, les trois parcours métier et leur réussite en CI restent requis. Les traces brutes restent exclues malgré leur mention dans le texte initial de l'issue.
- [ ] Traçabilité FR/EN et journal IA mis à jour avec les futures preuves réelles avant clôture ; le journal et l'issue ne sont pas modifiés par cette revue documentaire.

**Hors périmètre QL-02 :** charge et transferts à taille maximale, audit de sécurité/dépendances, concurrence PostgreSQL, tests visuels Figma/UI-01, multi-navigateur/mobile, badges supplémentaires, US07–US10 et scénarios optionnels. Les vérifications fonctionnelles JWT/propriété restent dans le périmètre ; elles ne constituent pas un audit de sécurité. L'expiration/purge reste obligatoire au niveau fonctionnel, mais aucune attente E2E de cinq minutes ni quatrième scénario d'expiration n'est ajoutée.

## Exécution locale hors E2E

Les commandes suivantes concernent les contrôles existants de développement ; les E2E mutateurs utilisent exclusivement `compose.test.yaml` comme décrit ci-dessus.

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

- [ ] **QL-02 : exactement trois scénarios métier Playwright/Chromium**, selon la matrice ci-dessus, réussis localement et en CI. Le smoke et les validations partielles 01a/01b ne suffisent pas à clôturer le lot.
- [x] QL-01 : [preuves de couverture](docs/coverage.fr.md). **GitHub Actions : Laravel PCOV 96,36 % des lignes (318/330), 52 tests/364 assertions/Pint ; Angular V8 79,58 % des lignes, 44 tests et build de production**. [Run et artefact backend](https://github.com/jlbokass/datashare/actions/runs/44536846489), [run et artefact frontend](https://github.com/jlbokass/datashare/actions/runs/44536846492). Les artefacts expirent le 3 décembre 2026. **70 % reste un objectif indicatif, aucun seuil CI imposé et aucun badge tiers.**
- [x] Workflows GitHub Actions CI-01 intégrés dans `develop` et `main`. Les tests PHP/Angular et la vérification Pint/build sont réellement verts sur [PR #50](https://github.com/jlbokass/datashare/pull/50) ; voir [guide CI](docs/ci.fr.md).
- [ ] Tests réels de taille/limites, 413, purge planifiée, extensions interdites et fichiers corrompus.
- [ ] Accessibilité, vérification Figma desktop/mobile et retours externes si disponibles.

**Traçabilité :** consigner date, SHA, commande, nombre de tests, succès/échec, emplacement des preuves. Ne jamais afficher un badge de qualité avant exécution.

# US05 — Historique personnel des envois

[English](us05-personal-history.md) · [Issue #8](https://github.com/jlbokass/datashare/issues/8)

Implémenté sur `feat/us05-personal-history`, dans [PR #45](https://github.com/jlbokass/datashare/pull/45). **Recette fonctionnelle T01–T04 et multifichiers validée selon le développeur ; CI backend/frontend réellement verte sur GitHub.** Revue de PR et fusion dans `develop` encore à effectuer.

## API et sécurité

`GET /api/transfers` exige le JWT de connexion existant. La réponse respecte
[OpenAPI](api/openapi.yaml) : `{ "transfers": [...] }`. L'identifiant interne de
l'utilisateur authentifié limite la requête ; un paramètre de propriétaire envoyé
par le client ne permet pas de choisir un autre compte. Les fichiers sont chargés
avec les transferts et `TransferPresenter` expose uniquement les métadonnées du
contrat : identifiant, lien relatif, dates de création/expiration, statut calculé,
puis identifiant, nom, taille, type MIME et date d'envoi de chaque fichier.
Aucun chemin de stockage, identifiant propriétaire, hash de mot de passe ou autre
attribut privé n'est sérialisé. Le lien du propriétaire est prévu par le contrat ;
il constitue une capacité d'accès au partage.

- Par défaut, et avec `include_expired=false`, seuls les transferts actifs sont retournés.
- `include_expired=true` inclut les transferts expirés encore présents avant purge.
- Un transfert est expiré dès `expires_at <= now`. Filtrage et présentation utilisent
  le même instant, sans colonne de statut ni changement de schéma.
- Les éléments purgés ne réapparaissent pas. GET ne purge, supprime ni modifie les fichiers.
- Ordre du plus récent au plus ancien (date de création, puis identifiant), sans
  pagination ni tri sélectionnable dans ce MVP.
- Réponses avec `Cache-Control: private, no-store, max-age=0`.
- JWT absent/invalide : `401` avec `code=unauthenticated`.

## Page compte

Après vérification de la session, `/account` charge l'historique avec le bearer
en mémoire. Chaque transfert regroupe tous ses fichiers : nom, taille décimale,
date d'envoi, date d'expiration commune et statut valide/expiré fourni par l'API.
Les dates utilisent le fuseau local du navigateur. Les liens valides ouvrent la
page publique existante ; les liens expirés ne sont pas cliquables.

États chargement, vide et erreur sans détails internes, réessai et case décochée
« Inclure les transferts expirés » sont disponibles. L'absence des éléments déjà
purgés est expliquée. Un `401` de l'historique efface la session et renvoie à la
connexion ; une erreur serveur/réseau permet un réessai sans déconnexion. Quitter
la page ou se déconnecter annule les requêtes en cours. Persistance JWT, suppression
US06 et conformité Figma UI-01 ne sont pas ajoutées. Le statut correspond au moment
du chargement ; changer la case ou revenir sur la page le recharge. L'API publique
reste l'autorité pour l'expiration d'un téléchargement.

## Vérification — 19 novembre 2026

**Mise à jour après la recette du développeur :** `bash scripts/qa.sh all` a été exécuté avec succès sur son Mac hors sandbox Codex. En navigation locale, il confirme T01 historique propriétaire, T02 cloisonnement des comptes, T03 historique vide, T04 **HTTP 401 Unauthorized sans JWT** et l'affichage multifichiers. Les résultats complets du terminal et les traces HTTP ne sont pas archivés dans le dépôt. Les tests automatisés couvrent aussi les éléments expirés non purgés et la purge.

**Preuves CI GitHub Actions sur PR #45 :** [backend](https://github.com/jlbokass/datashare/actions/runs/44423778354) **39 tests, 255 assertions et Pint verts** ; [frontend](https://github.com/jlbokass/datashare/actions/runs/44423778417) **34 tests Angular verts et build de production réussi**. Ces exécutions sont distinctes des limites du sandbox décrites ci-dessous.

### Historique d'exécution dans le sandbox de Codex

- Cycle backend test-first : six nouveaux tests en échec `405` avant la route,
  puis verts : `php artisan test --filter=TransferHistoryTest` (6 tests, 38 assertions).
- `php artisan test` local : **39 tests verts, 255 assertions** ; `php vendor/bin/pint --test` : **PASS**.
- Compilation Angular/application/templates (`ngc -p tsconfig.app.json --noEmit`)
  et typage des tests (`tsc -p tsconfig.spec.json --noEmit`) : **PASS**.
- Neuf tests compte ajoutés : HTTP/bearer, chargement/vide, métadonnées multifichiers,
  option/statut expiré, erreurs serveur/réseau et réessai, 401, échec de session,
  destruction et déconnexion. Exécution **non vérifiée**.
- `bash scripts/qa.sh all` : **4 contrôles bloqués/code 1**, accès au socket Docker
  refusé par le sandbox ; aucun test/build Docker n'a démarré.
- Angular natif est bloqué par des dépendances Linux sur macOS. Une copie temporaire
  utilisant lockfile/cache n'a pas pu récupérer tous les binaires natifs exacts ;
  la résolution réseau npm était indisponible. Dépendances/lockfile du dépôt inchangés.
- Environnement local : PHP 8.5.9 / Node 26.7.0 ; cible Docker/CI PHP 8.4 / Node 24.
  Ces contrôles ne prouvent pas la recette PostgreSQL, navigateur, build ou CI.

La reprise hors sandbox et la recette des cas nominaux ont été déclarées vertes par le développeur. Les tests automatiques couvrent les dates d'expiration et les enregistrements déjà purgés ; aucune migration destructive ni suppression de données réelles n'est nécessaire. Les contrôles Figma et responsive restent volontairement dans [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

# US06 — Suppression individuelle d'un fichier

[English](us06-file-deletion.md) · [Issue #9](https://github.com/jlbokass/datashare/issues/9)

Implémentée sur `feat/us06-file-deletion` dans [PR #46](https://github.com/jlbokass/datashare/pull/46). Le développeur a déclaré **T01–T05 validés** dans son environnement local et **`bash scripts/qa.sh all` vert** hors sandbox Codex. Les vérifications CI de la PR restent à consigner séparément. US06 respecte la suppression **d'un fichier**, sans suppression en masse. UI-01/Figma reste un TODO distinct.

## Contrat HTTP et propriété

`DELETE /api/transfers/{transferId}/files/{fileId}` respecte [OpenAPI](api/openapi.yaml).
Le middleware JWT existant identifie le propriétaire. Le service recherche le
transfert par son identifiant et son propriétaire, puis le fichier via la relation
du transfert. UUID mal formé, transfert/fichier inconnu, ressource d'un autre compte
ou fichier d'un autre transfert : même `404` / `not_found`, sans chemin privé ni
indice d'existence. JWT absent/invalide : `401` / `unauthenticated`.

Succès : `204` sans corps. Les octets privés et toutes les métadonnées du fichier
sont supprimés. Les autres fichiers et le jeton du partage restent identiques.
Supprimer le dernier fichier supprime aussi le transfert : l'ancien lien public
retourne `404`. Le propriétaire peut supprimer un fichier expiré non purgé ;
l'historique masque toujours les expirés par défaut. Répéter un DELETE terminé
retourne `404`.

## Choix pour le stockage et la concurrence

`TransferDeletion` est partagé entre le contrôleur et la commande de purge
existante. Les deux opérations ouvrent une transaction, verrouillent le transfert
parent avec `FOR UPDATE`, puis lisent les fichiers courants. PostgreSQL sérialise
ainsi les suppressions et purges concurrentes d'un même transfert. La purge relit
son candidat et revérifie l'expiration sous verrou ; un candidat déjà supprimé ou
plus expiré est ignoré. La commande intercepte les échecs par transfert, poursuit
les autres et retourne un code non nul si au moins un transfert échoue.

- Octets déjà absents : nettoyage des métadonnées restantes et `204`.
- Refus, exception du stockage ou octets toujours présents après suppression
  annoncée : `500` / `server_error` générique, métadonnées conservées pour réessai.
- Suppression des octets avant les métadonnées. **Stockage et base ne forment pas
  une transaction atomique.** Si une écriture DB échoue ensuite, la transaction DB
  est annulée, mais les octets ne sont pas restaurables. Réponse `500` ; un réessai
  permet de terminer le nettoyage des métadonnées.
- Une purge partiellement échouée conserve aussi les métadonnées du transfert.
  Les octets déjà effacés restent absents ; la purge suivante reprend les restants.
- Seuls les chemins de fichiers référencés sont supprimés, sans suppression
  récursive de répertoire. Des dossiers privés vides peuvent rester. Aucun
  changement de schéma ni ajout de dépendance.
- Un téléchargement ayant déjà ouvert le fichier peut se terminer ; les octets
  déjà transmis ne sont pas révocables. Les nouveaux accès après suppression échouent.

## Parcours compte

Chaque fichier possède une action Supprimer. La confirmation native du navigateur
nomme le fichier et précise le caractère irréversible. Annuler ne produit aucun
DELETE. Une suppression en cours désactive les actions et la case d'expiration ;
le gestionnaire rejette aussi les doublons. Le bearer provient du JWT en mémoire.

Après `204`, un message confirme la suppression et l'historique est rechargé avec
le filtre courant, en conservant les autres fichiers et leur lien. Une erreur de
rechargement est distinguée de la suppression réussie. Un échec de suppression
laisse la liste visible et autorise un nouvel essai explicitement confirmé ; un
`404` invite à actualiser et les autres erreurs restent génériques. Un `401` efface
la session et renvoie à la connexion. Quitter la page annule l'abonnement client,
**pas nécessairement un DELETE déjà reçu par le serveur**.

## Vérification — 19 novembre 2026

- 13 nouveaux tests Laravel : SQLite en mémoire et disque privé factice, sans données réelles.
- Suite locale complète : **52 PASS, 364 assertions** ; Pint **PASS**.
- Couverture : téléchargement/lien des autres fichiers, révocation du dernier,
  propriété/JWT/UUID, octets absents, refus/exception/faux succès du stockage,
  échec DB après effacement, réessai/poursuite de purge et candidats périmés.
- 10 cas Angular ajoutés aux tests compte existants : confirmation, annulation,
  URL/bearer, doublon, autres fichiers/lien, 404/500, réseau, 401, dernier fichier/
  filtre, erreur de rechargement et destruction du composant.
- Compilation des templates Angular et typage des tests : **PASS**. Exécution
  Angular/build : **non vérifiés**, dépendances esbuild Linux incompatibles avec
  cet hôte macOS. Dépendances et lockfiles inchangés.
- `bash scripts/qa.sh all` exécuté : les quatre contrôles sont bloqués par les
  permissions du socket Docker (code 1), avant les tests/build. PHP local 8.5.9,
  cible Docker/CI 8.4.
- Les tests SQLite vérifient les ordres séquentiels purge/suppression,
  **pas la contention réelle des verrous PostgreSQL**.

## Recette développeur — compte rendu complémentaire

**19 novembre 2026, validation annoncée par le développeur :** T01 suppression simple, T02 suppression d'un fichier parmi plusieurs, T03 annulation, T04 suppression refusée à un compte non propriétaire, T05 invalidation de l'ancien lien après suppression du dernier fichier : **5/5 OK**. La commande `bash scripts/qa.sh all` est également **verte sur son Mac**. Les sorties de terminal, captures et réponses HTTP détaillées ne sont pas archivées ici. Les restrictions Docker du sandbox Codex citées plus haut restent exactes pour **son exécution initiale**, pas pour la recette ultérieure du développeur.

### Contrôles complémentaires avant livraison OC

Les scénarios locaux T01–T05 étant déclarés acceptés, aucune nouvelle suppression de fichiers réels n'est nécessaire. En phase qualité, revoir le risque de non-atomicité stockage/BDD, l'intégration réelle PostgreSQL en concurrence dans une base isolée et les scénarios E2E. La passe visuelle/responsive/accessibilité reste dans [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

#### Plan de recette initial (pour traçabilité)

1. Exécuter `bash scripts/qa.sh all` hors sandbox et vérifier la CI.
2. Avec des fichiers de test jetables, annuler : aucun DELETE ni changement de fichier.
3. Supprimer un fichier d'un transfert multiple : 204/corps vide, téléchargement
   supprimé indisponible, autre fichier accessible via le même lien, historique actualisé.
4. Supprimer le dernier : historique vide et ancien lien 404. Vérifier l'interdiction
   depuis un autre compte et la fin de session frontend sur JWT expiré.
5. Dans un environnement PostgreSQL isolé, mettre en concurrence deux suppressions,
   puis suppression et purge : aucune métadonnée orpheline, perte du fichier restant
   ni faux succès. Simuler un échec de stockage uniquement dans cet environnement,
   puis réessayer. Ne pas changer les permissions de vrais fichiers ou données utilisateur.

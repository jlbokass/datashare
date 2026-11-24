---
layout: default
title: "Contrat d'interface API REST"
permalink: /api/README.fr.html
lang: fr
---

# API DataShare — Contrat d'interface

**Statut (24 novembre 2026) :** contrat de conception [DESIGN-03](https://github.com/jlbokass/datashare/issues/3) rapproché de l'API US01–US06 implémentée dans [DELIVERY-API #75](https://github.com/jlbokass/datashare/issues/75). La documentation générée complète ce contrat.

- [English version](README.md)
- [Spécification OpenAPI 3.1](openapi.yaml)
- [Architecture (FR)](../architecture.fr.md) · [MCD UML (FR)](../data-model.fr.md)

## 1. Périmètre et conventions

### Documentation générée locale — DELIVERY-API

Scramble **0.13.55** génère OpenAPI **3.1.2** depuis Laravel. L'installation, le routage, l'audit Composer, les tests backend et Pint de la phase 1 ont été validés manuellement par le développeur. Le [YAML OpenAPI 3.1.0](openapi.yaml) reste le contrat de conception, rapproché du comportement implémenté ; la génération ne l'écrase pas.

- [Documentation interactive](http://127.0.0.1:8080/docs/api)
- [JSON généré](http://127.0.0.1:8080/docs/api.json)

La documentation nécessite `APP_ENV=local` : `RestrictedDocsAccess` est conservé et aucune gate `viewApiDocs` n'autorise les autres environnements. La passerelle Nginx écoute uniquement en boucle locale et transmet ces deux chemins à Laravel. Les dépendances de développement s'installent avec le verrou Composer existant ; le démarrage normal sans dépendances de développement ne nécessite pas Scramble.

`AppServiceProvider` utilise `expose(ui: false, document: '/docs/api.json')`, disponible dans Scramble 0.13.55 : Scramble enregistre uniquement la route du document généré. `routes/web.php` enregistre une seule vue Blade sur `/docs/api`, protégée par `RestrictedDocsAccess` et conditionnée à la présence de Scramble. Aucune seconde spécification ni compilation frontend n'est nécessaire. Scramble 0.13.55 lit aussi `ui.title` pour générer `info.title` dans OpenAPI ; ce paramètre est conservé et partagé avec le titre de la page Blade, indépendamment du moteur d'interface par défaut désactivé.

`AppServiceProvider` configure `MiddlewareAuthSecurityStrategy` pour le middleware existant `AuthenticateJwt`, avec un unique schéma HTTP Bearer `bearerAuth` et `bearerFormat: JWT`. Quatre opérations protégées héritent de la sécurité globale ; les quatre opérations métier publiques déclarent explicitement `security: []`. Le token de partage est une capacité, pas un JWT. Le document généré contient aussi les routes de support publiques `/health` et `/demo/capabilities`.

### Documentation fonctionnelle et regroupement

Les PHPDoc anglais décrivent le rôle, l'accès et le comportement métier des dix opérations ; Scramble conserve l'inférence des schémas et validations. Les attributs PHP 8 `Group` définissent ces domaines dans l'ordre (poids 10, 20, 30, 40) :

| Domaine | Opérations |
| --- | --- |
| Authentication | Inscription, connexion, compte courant (3) |
| Transfers | Création, historique propriétaire, suppression d'un fichier (3) |
| Public sharing | Métadonnées publiques, téléchargement (2) |
| System | Disponibilité API, capacités de démonstration (2) |

Les deux routes de support restent des closures. En 0.13.55, l'attribut natif `Group` cible uniquement classes/méthodes ; la petite sous-classe `ClosureGroup` ajoute la cible fonction et reste reconnue par le lecteur natif d'attributs de Scramble, qui accepte les sous-classes. Aucun transformateur de regroupement ni contrôleur supplémentaire. L'ordre de déclaration est conservé dans chaque domaine. Swagger UI utilise le titre DataShare REST API, un aperçu court, les listes de groupes ouvertes, le filtrage et les modèles repliés avec ses options natives, sans thème ni JavaScript de tri personnalisé.

### Recette documentaire — sans exécution de l'API

Le développeur a confirmé l'accès Swagger UI et la QA backend de l'étape 1. Pour l'étape 2, lire `/docs/api` et `/docs/api.json` sans utiliser **Try it out**. Vérifier le titre, les quatre domaines dans l'ordre ci-dessus, leurs 3/3/2/2 opérations et les résumés/descriptions anglais non vides. Contrôler la sécurité effective : `/auth/me`, les deux opérations `/transfers` et la suppression exigent `bearerAuth` ; inscription, connexion, deux opérations publiques et deux routes System ont `security: []`. Conserver un seul schéma HTTP Bearer JWT. Vérifier le multipart avec `files[]` obligatoire, 1–5 éléments binaires et les contraintes d'expiration inchangées ; vérifier la réponse 200 du téléchargement en `application/octet-stream`, `type: string`, `format: binary`. Conserver l'accès local aux deux routes. La recette fonctionnelle ci-dessous est distincte et reportée après revue de la documentation.

### Export et vérification

Depuis la racine du dépôt, avec la pile existante démarrée :

```bash
# Export sur l'hôte, sans modifier le contrat de conception.
docker compose exec -T -e APP_URL=http://127.0.0.1:8080 app \
  php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json
# Contrôler les middlewares des deux routes de documentation.
docker compose exec -T app php artisan route:list --path=docs -vv
bash scripts/qa.sh backend
git diff --check
```

L'export CLI utilise `APP_URL` ; la commande fournit explicitement l'origine de la passerelle. La génération HTTP utilise l'origine de la requête. `--fail-on-unknown` détecte les types inconnus, sans prouver à lui seul la conformité complète. Swagger UI **5.34.1** charge sa feuille CSS et son bundle JavaScript depuis **cdn.jsdelivr.net** (`swagger-ui-dist@5.34.1`) ; son rendu nécessite un accès réseau à ce CDN. La spécification est lue directement sur `/docs/api.json`, depuis l'origine du navigateur, sans service externe. La validation externe est désactivée (`validatorUrl: null`) et le JWT n'est pas persisté (`persistAuthorization: false`) : il faut s'autoriser à nouveau après actualisation.

### Rapprochement et limites d'inférence

| Domaine | Correction ou limite restante |
| --- | --- |
| Authentification | Un schéma JWT, quatre opérations protégées/quatre publiques ; ajout des réponses 401 du middleware. |
| Partage public | Annotation explicite de l'enveloppe de métadonnées ; ajout des réponses 404/410 du service. Aucun email propriétaire, identifiant utilisateur numérique, mot de passe, chemin privé ou token de partage brut dans ces métadonnées. |
| Téléchargement | Succès JSON incorrect remplacé par `application/octet-stream`, schéma binaire et en-têtes pièce jointe, `nosniff`, private/no-store. Un échec non intercepté avant le flux produit une 500 du framework ; après les en-têtes, il peut tronquer les octets. |
| Validation | 422 contient `message`, `code: validation_error` et `errors`. La 429 du framework contient `message`, sans garantie de champ `code`. |
| Téléversement | `files[]` obligatoire, 1–5 fichiers binaires ; 1 000 000 000 octets chacun et 2 000 000 000 au total. Les limites d'octets et formats autorisés sont décrits, pas imposés par JSON Schema. Le serveur contrôle contenu et extension. |
| Expiration | 1–7 jours, défaut 7 ; enum entier `[5]` pour la démonstration locale/testing activée explicitement. L'exclusion mutuelle et la condition d'environnement ne sont pas exprimées structurellement par le générateur ; descriptions et YAML les précisent. |
| Paramètres et modèles | Formats UUID/date-time/email, motif de token hexadécimal minuscule sur 64 caractères et comportement de `include_expired`. L'inférence nullable prudente de l'identifiant et de la date utilisateur est conservée, conformément au modèle/schéma existant. |
| Écarts du contrat | Suppression de `title`/`message` non implémentés ; limites de nombre/taille totale, expiration de démonstration, format du token et 429 précisés ; retrait de `additionalProperties: false` des requêtes, car Laravel ignore les champs inconnus. |

`backend/app/Documentation/DataShareOperationTransformer.php` corrige uniquement la documentation générée, jamais la validation ni l'exécution des réponses. L'annotation publique et ces corrections doivent être revues si le comportement évolue. La plupart des schémas d'authentification, d'historique et de téléversement restent inférés. Les différences structurelles (schémas intégrés plutôt que références YAML, operation IDs/tags, version corrective OpenAPI) sont intentionnelles. Le YAML précise davantage la fermeture des objets de réponse et certaines bornes. Son ApiError réutilisable autorise errors en option, alors que les erreurs de champs sont émises uniquement en 422. `APP_DEBUG` local peut exposer des diagnostics lors d'erreurs non interceptées ; les enveloppes personnalisées sûres ne garantissent pas l'assainissement de toutes les erreurs.

### Recette fonctionnelle ultérieure — Swagger UI et multipart

Utiliser la pile locale existante, un compte jetable et deux petits fichiers texte, `swagger-one.txt` et `swagger-two.txt`, avec du contenu de démonstration sans données privées. Ne supprimer aucune donnée ni aucun fichier de démonstration. Cette recette crée de vrais enregistrements locaux ; l'expiration normale reste applicable.

1. Ouvrir `http://127.0.0.1:8080/docs/api` : vérifier Swagger UI. Ouvrir `/docs/api.json` : vérifier OpenAPI 3.1.2, huit opérations métier et deux routes de support, avec un seul schéma HTTP Bearer JWT. Dans `paths./transfers.post.requestBody.content.multipart/form-data.schema`, contrôler `required: ["files[]"]`, des éléments `type: string` / `format: binary`, `minItems: 1`, `maxItems: 5`. Vérifier l'expiration en jours 1–7/défaut 7 et l'enum minutes `[5]` avec la condition d'activation décrite. Ne pas modifier l'environnement de l'application active pour tester les restrictions d'accès.
2. Si nécessaire, ouvrir `POST /auth/register`, cliquer **Try it out**, saisir un email jetable unique et un mot de passe d'au moins huit caractères, puis **Execute** (201). Utiliser ces identifiants dans `POST /auth/login` (200). Dans **Authorize → bearerAuth**, coller seulement `access_token`, sans préfixe `Bearer`, puis autoriser. Vérifier que `GET /auth/me` renvoie 200. Ne publier ni token, ni mot de passe, ni fichier HAR brut.
3. Ouvrir les outils développeur du navigateur → **Network**, puis `POST /transfers` → **Try it out**. Sélectionner `multipart/form-data`. Ajouter une entrée fichier `files[]` et choisir `swagger-one.txt` ; renseigner `expires_in_days=1`. Laisser `expires_in_minutes` absent, en désactivant aussi **Send empty value** si proposé. Exécuter : attendre **201** et exactement **un** élément dans `transfer.files` ; relever l'identifiant du transfert et le nom du fichier.
4. Inspecter la vraie requête Network `POST /api/transfers`, pas uniquement l'exemple curl affiché par Swagger. Vérifier `Content-Type: multipart/form-data; boundary=…`, l'en-tête Authorization Bearer et une partie fichier nommée exactement `files[]`. Ajouter ensuite une deuxième entrée fichier, choisir `swagger-two.txt`, conserver le premier fichier et exécuter une seule fois. Attendre **201**, un nouvel identifiant de transfert et exactement **deux** éléments dans son `transfer.files`. Le payload doit contenir deux parties fichier distinctes nommées `files[]` (multipart brut : deux en-têtes `Content-Disposition: form-data; name="files[]"; filename="…"`), pas du CSV, du JSON ou un unique champ `files`. La réponse 201 avec les deux métadonnées confirme que Laravel a accepté le tableau attendu, sans ajouter de journalisation serveur.
5. Dans Swagger UI, exécuter `GET /transfers` avec le même JWT : retrouver les deux identifiants et leurs listes respectives de un/deux fichiers. Se connecter avec le même compte sur `http://127.0.0.1:8080/login`, ouvrir `/account` et confirmer les deux transferts dans l'historique existant de l'application.
6. Actualiser Swagger UI et vérifier que l'autorisation est effacée. Vérifier éventuellement le partage public et le téléchargement de ces seuls transferts de démonstration. Conserver les données/fichiers ; ne pas appeler les routes de suppression pour cette recette.

Exécuter uniquement `bash scripts/qa.sh backend` pour la recette backend, puis `git diff --check`. Si Docker est bloqué, arrêter et demander au développeur la même commande, sans changer d'environnement. La réussite des tests backend ne prouve pas la sérialisation multipart du navigateur.

Références d'implémentation : [version Swagger UI](https://github.com/swagger-api/swagger-ui/releases/tag/v5.34.1), [compatibilité OpenAPI](https://github.com/swagger-api/swagger-ui/tree/v5.34.1), [options de configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).

Le contrat couvre le **MVP OpenClassrooms obligatoire US01 à US06**. Le backend utilise Laravel, le frontend Angular, PostgreSQL pour les données et un stockage privé pour les octets des fichiers.

- **Préfixe REST :** `/api` (défini dans la propriété `servers` d'OpenAPI).
- **Formats :** JSON pour les données, `multipart/form-data` pour les fichiers, flux binaire pour les téléchargements.
- **Nommage :** `snake_case` dans les données JSON, paramètres `transferId`, `fileId`, `token` dans les chemins.
- **Dates :** ISO 8601 avec indication du fuseau horaire.
- **Identifiants :** UUID pour utilisateurs, transferts et fichiers ; le token de partage est un secret opaque, indépendant et non prédictible.
- **Accès :** `Authorization: Bearer <JWT>` pour les routes privées ; aucun JWT requis pour les routes publiques `/shares`.
- **Erreurs :** `{ "message": "...", "code": "...", "errors": { "field": ["..."] } }`. Le détail `errors` est présent pour la validation. Les réponses 429 et 500 non interceptées du framework ne garantissent pas un champ `code`.

## 2. Correspondance avec les User Stories officielles

| US | Méthode et route API | Accès | Réussite | Fonction |
| --- | --- | --- | --- | --- |
| **US03** | `POST /api/auth/register` | Public | 201 JSON | Créer un compte, email valide et unique, mot de passe de 8 caractères minimum |
| **US04** | `POST /api/auth/login` | Public | 200 JSON | Vérifier les identifiants et générer un JWT |
| **US04 support** | `GET /api/auth/me` | JWT | 200 JSON | Retrouver l'utilisateur connecté dans Angular (route de support, pas une nouvelle US) |
| **US01** | `POST /api/transfers` | JWT | 201 JSON | Envoyer un ou plusieurs fichiers et obtenir un lien de partage |
| **US05** | `GET /api/transfers` | JWT | 200 JSON | Consulter les transferts et fichiers de l'utilisateur connecté |
| **US06** | `DELETE /api/transfers/{transferId}/files/{fileId}` | JWT | 204 | Supprimer **un fichier appartenant à l'utilisateur**, après confirmation dans l'interface |
| **US02** | `GET /api/shares/{token}` | Lien public | 200 JSON | Consulter les métadonnées avant téléchargement |
| **US02** | `GET /api/shares/{token}/files/{fileId}` | Lien public | 200 binaire | Télécharger un fichier en passant par l'API |

Nous n'ajoutons **pas** de route de suppression globale `DELETE /api/transfers/{id}` dans ce MVP : l'US06 officielle prévoit de supprimer un **fichier**. Si c'est le dernier fichier du transfert, le backend supprime le transfert devenu vide.

## 3. Exemples du contrat

### Inscription — US03

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{ "email": "user@example.test", "password": "example-password-123" }
```

La réponse `201` contient uniquement les données publiques de l'utilisateur sous la clé `user`, sans mot de passe ni token. La connexion suivante renvoie `access_token`, `token_type: "Bearer"` et `user`.

### Téléversement — US01

```http
POST /api/transfers
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

Champs : `files[]` (**1–5** fichiers), `expires_in_days` facultatif (entier de **1 à 7**, défaut **7**). Sinon, `expires_in_minutes=5` est réservé à local/testing avec activation explicite ; ne jamais envoyer les deux durées. `title` et `message` ne sont pas implémentés.

Exemple de réponse `201` :

```json
{
  "transfer": {
    "id": "11111111-1111-4111-8111-111111111111",
    "share_url": "/share/sample-token-placeholder",
    "created_at": "2026-11-18T11:00:00Z",
    "expires_at": "2026-11-25T11:00:00Z",
    "status": "valid",
    "files": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "original_name": "report.pdf",
        "size_bytes": 204800,
        "mime_type": "application/pdf",
        "uploaded_at": "2026-11-18T11:00:00Z"
      }
    ]
  }
}
```

`share_url` est une **route Angular**, non une route API. Angular ouvre `/share/{token}`, puis demande `GET /api/shares/{token}`.

Le MVP utilise **1 000 000 000 octets par fichier**, cinq fichiers et **2 000 000 000 octets cumulés** par transfert. Ces deux dernières limites sont des choix locaux, pas des exigences OC. Les formats sont contrôlés côté serveur (voir [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md)).

### Suppression — US06

```http
DELETE /api/transfers/11111111-1111-4111-8111-111111111111/files/22222222-2222-4222-8222-222222222222
Authorization: Bearer <JWT>
```

Réponse `204 No Content`. Angular demande confirmation **avant l'envoi** de cette requête. Laravel vérifie la propriété du transfert et du fichier. La suppression retire les octets et les métadonnées du fichier, sans supprimer les autres fichiers du lot.

## 4. Erreurs et sécurité des accès

| Situation | Réponse | Justification |
| --- | --- | --- |
| JWT absent, invalide ou expiré | **401** | Accès privé refusé |
| Inscription invalide ou email déjà enregistré | **422** | Validation détaillée |
| Taille de fichier excessive à la frontière HTTP | **413** | Charge utile trop importante, message clair |
| Type de fichier refusé ou expiration non valide | **422** | Validation côté serveur |
| Token public inconnu, fichier inexistant ou fichier hors partage | **404** | Ne pas divulguer d'informations internes |
| Token expiré avant purge physique | **410** | Message explicite d'expiration |
| Transfert/fichier ne relevant pas du propriétaire connecté | **404** | Ne pas divulguer l'existence d'une ressource privée |
| Erreur de stockage ou du serveur | **500** | Message générique, détails techniques uniquement dans les logs |

Aucune URL directe vers le stockage privé n'est fournie. Les octets sont transmis par l'API avec `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` et des directives de cache adaptées. Les validations serveur font autorité.

## 5. Historique et expiration

US05 demande un statut de lien valide/expiré, tandis qu'US06 indique que **les fichiers non expirés apparaissent par défaut**. L'[US05](https://github.com/jlbokass/datashare/issues/8) de `GET /api/transfers` exclut les éléments expirés par défaut et prend en charge le paramètre facultatif `include_expired=true` pour voir ceux qui attendent encore leur purge physique. Un fichier déjà purgé ne peut plus réapparaître. Le statut est **calculé** à partir de l'expiration.

US01 impose la suppression automatique des fichiers **et des métadonnées** à expiration. L'ordonnancement figure dans DESIGN-01 ; l'OpenAPI décrit seulement les effets observables côté client.

## 6. Fonctionnalités optionnelles non exposées

La spécification OpenAPI ne contient **aucune route de téléversement anonyme US07**, de tags US08, de protection par mot de passe US09 ou de suivi statistique facultatif des téléchargements. La planification US10 est un traitement interne, pas une route publique. Ces éléments restent dans le backlog et dans la partie optionnelle du MCD.

## 7. Comportements implémentés

- Inscription : réponse 201 sans JWT ; email normalisé, doublon ou mot de passe invalide → 422. Connexion : JWT Bearer, erreur générique 401 si identifiants incorrects. `/api/auth/me` nécessite un JWT valide.
- Téléversement : multipart `files[]`, un lien relatif `/share/{token}` (64 caractères hexadécimaux), une expiration commune, identifiants UUID et métadonnées ; aucune exposition de chemin privé. En cas d'échec de stockage ou de BDD, les octets déjà écrits sont nettoyés. Expiration de 1 à 7 jours (7 par défaut) ; démo cinq minutes réservée au local.
- Téléchargement : lien public sans compte, métadonnées autorisées uniquement, octets forcés en pièce jointe, `application/octet-stream`, `nosniff` et absence de cache partagé. 410 après expiration tant que les métadonnées existent ; 404 après purge.
- Historique : propriétaire exclusivement, tri par date de création puis identifiant décroissants, pas de pagination ; `include_expired=true` inclut seulement les éléments non encore purgés. `Cache-Control: private, no-store, max-age=0`. Le statut est dérivé de l'expiration.
- Suppression : 204, refus 404 pour ressource inconnue ou appartenant à un autre compte ; un fichier seulement, les autres restent disponibles. La suppression du dernier fichier révoque le lien. Un échec de stockage renvoie 500 et conserve les métadonnées pour reprise (voir [architecture](../architecture.fr.md)).
- [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57) est clôturé : purge et historique inchangés. Aucun mécanisme de conservation permanente ajouté.

Voir [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md) pour les preuves et limites, et [installation](../installation.fr.md) pour exécuter le MVP.

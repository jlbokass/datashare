---
layout: default
title: "Contrat d'interface API REST"
permalink: /fr/api/
lang: fr
---

# API DataShare — Contrat d'interface

**Statut :** contrat validé dans DESIGN-03 ([issue #3](https://github.com/jlbokass/datashare/issues/3)). **Ce contrat décrit une conception, pas une API Laravel déjà développée.**

- [English version](README.md)
- [Spécification OpenAPI 3.1](openapi.yaml)
- [Architecture (FR)](../architecture.fr.md) · [MCD UML (FR)](../data-model.fr.md)

## 1. Périmètre et conventions

Le contrat couvre le **MVP OpenClassrooms obligatoire US01 à US06**. Le backend utilisera Laravel, le frontend Angular, PostgreSQL pour les données et un stockage privé pour les octets des fichiers.

- **Préfixe REST :** `/api` (défini dans la propriété `servers` d'OpenAPI).
- **Formats :** JSON pour les données, `multipart/form-data` pour les fichiers, flux binaire pour les téléchargements.
- **Nommage :** `snake_case` dans les données JSON, paramètres `transferId`, `fileId`, `token` dans les chemins.
- **Dates :** ISO 8601 avec indication du fuseau horaire.
- **Identifiants :** UUID pour utilisateurs, transferts et fichiers ; le token de partage est un secret opaque, indépendant et non prédictible.
- **Accès :** `Authorization: Bearer <JWT>` pour les routes privées ; aucun JWT requis pour les routes publiques `/shares`.
- **Erreurs :** `{ "message": "...", "code": "...", "errors": { "field": ["..."] } }`. Le détail `errors` est facultatif.

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

## 3. Exemples du contrat envisagé

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

Champs : `files[]` (un ou plusieurs fichiers), `expires_in_days` facultatif (entier de **1 à 7**, défaut **7**), éventuellement `title` et `message` (attributs facultatifs de DESIGN-02, non exigés par les US).

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

OC précise une limite de **1 Go** par fichier dans sa formulation. Le brouillon retient **1 000 000 000 octets par fichier** ; la limite cumulée d'une requête HTTP multi-fichiers reste une **décision à prendre**, non explicitement donnée par OC. La politique de formats interdits/acceptés reste également à définir.

### Suppression — US06

```http
DELETE /api/transfers/11111111-1111-4111-8111-111111111111/files/22222222-2222-4222-8222-222222222222
Authorization: Bearer <JWT>
```

Réponse `204 No Content`. Angular demande confirmation **avant l'envoi** de cette requête. Laravel vérifie la propriété du transfert et du fichier. La suppression retire les octets et les métadonnées du fichier, sans supprimer les autres fichiers du lot.

## 4. Erreurs et sécurité des accès

| Situation | Réponse proposée | Justification |
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

US05 demande un statut de lien valide/expiré, tandis qu'US06 indique que **les fichiers non expirés apparaissent par défaut**. Le brouillon de `GET /api/transfers` exclut donc les éléments expirés par défaut et propose un paramètre facultatif `include_expired=true` pour voir ceux qui attendent encore leur purge physique. Un fichier déjà purgé ne peut plus réapparaître. Le statut est **calculé** à partir de l'expiration.

US01 impose la suppression automatique des fichiers **et des métadonnées** à expiration. L'ordonnancement figure dans DESIGN-01 ; l'OpenAPI décrit seulement les effets observables côté client.

## 6. Fonctionnalités optionnelles non exposées

La spécification OpenAPI ne contient **aucune route de téléversement anonyme US07**, de tags US08, de protection par mot de passe US09 ou de suivi statistique facultatif des téléchargements. La planification US10 est un traitement interne, pas une route publique. Ces éléments restent dans le backlog et dans la partie optionnelle du MCD.

## 7. Décisions à valider

- [ ] Valider les conventions de routes et de réponses (`/transfers`, `/shares`, `snake_case`).
- [ ] Confirmer **un token commun à plusieurs fichiers** comme défini dans DESIGN-02.
- [ ] Vérifier que la route `DELETE` supprime **un seul fichier**, pas le groupe entier.
- [ ] Confirmer **1 Go par fichier** et l'éventuelle limite globale des requêtes HTTP ; vérifier plus tard les paramètres frontend/backend/proxy.
- [ ] Conserver le paramètre `include_expired` seulement s'il répond à un besoin réel.
- [ ] Définir les extensions/types de fichiers autorisés et interdits dans `SECURITY.md` avant implémentation.
- [ ] Valider syntaxiquement `openapi.yaml` avec un outil compatible OpenAPI 3.1.
- [ ] Maintenir cette documentation cohérente avec [la version anglaise](README.md) et les décisions DESIGN-01/DESIGN-02.

**Aucun endpoint n'est encore développé dans le nouveau dépôt.**

---
layout: default
title: "Contrat d'interface API REST"
permalink: /api/README.fr.html
lang: fr
---

# DataShare API — Contrat d'interface

L'API REST couvre les fonctionnalités obligatoires US01–US06 et l'extension facultative US08 (tags privés). Elle est documentée à partir du code Laravel et du contrat de conception [DESIGN-03](https://github.com/jlbokass/datashare/issues/3).

[English version](README.md) · [Documentation technique](../technical-documentation.fr.md) · [Installation](../installation.fr.md)

## Consulter et utiliser l'API

| Ressource | Usage |
| --- | --- |
| [Swagger UI](https://127.0.0.1:8443/docs/api) | Consulter les opérations et exécuter des requêtes |
| [OpenAPI JSON](https://127.0.0.1:8443/docs/api.json) | Spécification générée à partir de Laravel |
| [Contrat OpenAPI YAML](openapi.yaml) | Contrat de conception rapproché de l'implémentation |

Les liens HTTPS supposent le [mode TLS local](../installation.fr.md#https-local-facultatif) actif ; en mode HTTP par défaut, utiliser le port 8080 avec `http://`. Les deux URL locales nécessitent les dépendances de développement et `APP_ENV=local`. Swagger UI charge ses ressources depuis jsDelivr (version 5.34.1 figée) ; une connexion Internet est nécessaire. La validation externe et la persistance du JWT sont désactivées.

## Conventions

- Préfixe `/api` ; JSON pour les données, `multipart/form-data` pour les fichiers, flux binaire pour les téléchargements.
- Champs JSON en `snake_case`, dates ISO 8601, identifiants publics UUID.
- Les opérations privées nécessitent `Authorization: Bearer <JWT>` ; le token hexadécimal de partage (64 caractères) est indépendant du JWT.
- Les erreurs applicatives exposent `message` et `code`, avec `errors` pour la validation (422). Les erreurs 429 et 500 non interceptées du framework peuvent ne pas comporter `code`.

Le tableau de correspondance avec les user stories figure dans la [documentation technique](../technical-documentation.fr.md). Les schémas, descriptions et statuts HTTP sont consultables dans Swagger UI.

## Maintenir la documentation

Les PHPDoc décrivent les comportements fonctionnels en anglais ; les attributs PHP 8 `Group` regroupent les opérations par domaine. Scramble 0.13.55 infère la spécification OpenAPI 3.1 à partir du code. Les deux routes de support conservent leurs closures grâce à l'adaptateur `ClosureGroup`.

`DataShareOperationTransformer` et l'attribut de réponse du partage public complètent l'inférence pour le multipart, les téléchargements binaires, les erreurs, les formats et les contraintes non déductibles. Les limites de taille des fichiers et l'expiration conditionnelle de démonstration restent des règles serveur décrites, non intégralement exprimées par le schéma généré. Le YAML conserve le contrat de conception ; l'export ne l'écrase pas.

Pour exporter la spécification depuis la racine du dépôt, avec la pile locale démarrée :

```bash
docker compose exec -T -e APP_URL=https://127.0.0.1:8443 app \
  php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json
```

En mode HTTP, adapter `APP_URL` à `http://127.0.0.1:8080`. L'option `--fail-on-unknown` signale les types non inférés ; elle ne remplace pas la validation des comportements réels. Les contrôles automatisés et leur environnement sont décrits dans [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md).

## Historique paginé (#59)

`GET /transfers` renvoie 10 transferts par page, avec leurs fichiers regroupés et les métadonnées `pagination` (`current_page`, `per_page`, `last_page`, `total`). Utiliser `page=2` pour la page suivante et `status=active|all|expired` pour filtrer avant pagination. Sans `status`, `include_expired` conserve son comportement historique. Les pages au-delà de la dernière renvoient une liste vide ; Angular revient automatiquement à la dernière page disponible.

## Tags privés (US08 — #11)

`PUT /transfers/{transferId}/files/{fileId}/tags` remplace la liste complète (`{"tags":["Projet","Factures"]}`), ou la vide avec `{"tags":[]}`. Le JWT et la propriété du fichier sont contrôlés. Les libellés sont nettoyés des espaces en bordure, sensibles à la casse, non vides, uniques par fichier et limités à 30 caractères. Les erreurs de validation renvoient 422 ; un fichier inconnu ou non possédé renvoie 404. Les réponses privées de téléversement et d'historique contiennent `tags` ; le partage public n'en contient pas. Pas de filtre par tag.

## Recette interactive

Utiliser un compte fictif et deux petits fichiers autorisés. Les requêtes créent de vrais enregistrements locaux ; ne pas utiliser de données privées ni publier de JWT.

| Contrôle | Résultat attendu |
| --- | --- |
| `POST /auth/register` puis `POST /auth/login` | 201 puis 200 ; copier `access_token` dans Authorize, sans préfixe `Bearer` |
| `GET /auth/me` | 200 avec JWT ; 401 sans JWT |
| `POST /transfers` avec un fichier, puis deux | Deux réponses 201 ; un puis deux éléments dans `transfer.files` |
| `GET /transfers` | Les deux transferts du compte sont présents dans l'historique |
| `GET /shares/{token}` et `GET /shares/{token}/files/{fileId}` | 200 sans JWT ; métadonnées puis fichier joint |

Pour le téléversement, choisir `expires_in_days=1` et laisser `expires_in_minutes` absent. Dans l'onglet Réseau du navigateur, vérifier que les parties binaires portent chacune le nom `files[]` (une puis deux parties). Confirmer les transferts dans l'historique Angular. Le champ `share_url` désigne une route Angular ; les endpoints `/api/shares` utilisent le token qu'elle contient.

Les fichiers de démonstration restent soumis à l'expiration normale. La réussite des tests backend ne suffit pas à établir la sérialisation multipart du navigateur.

## Collection Postman (recette locale facultative)

Importer les deux fichiers [collection v2.1](postman/DataShare.postman_collection.json) et [environnement local](postman/DataShare.local.postman_environment.json) dans Postman. Activer HTTPS (`make https-up`), sélectionner **DataShare — Local** et, si nécessaire, ajouter le certificat public `$(mkcert -CAROOT)/rootCA.pem` dans Settings → Certificates → CA certificates. Garder la vérification TLS activée ; ne jamais importer la clé de l'autorité.

Renseigner uniquement les valeurs locales (non partagées) `email` (par ex. `postman-20261125-01@example.com`, unique) et `password` (mot de passe fictif d'au moins huit caractères). Ne jamais exporter un environnement renseigné, un JWT ou un token réel. Utiliser des fichiers jetables sans données privées.

Exécuter individuellement avec Send : System (2 requêtes), Authentication (3), Transfers (envoi d'un fichier puis de deux fichiers avec les champs File `files[]`, puis historique), Public sharing (métadonnées puis téléchargement). Le JWT et les identifiants sont enregistrés automatiquement dans l'environnement local ; les assertions vérifient les statuts et les réponses utiles. Vérifier le fichier téléchargé si nécessaire avec Send and Download. La requête de mise à jour des tags utilise uniquement les identifiants capturés du dernier envoi jetable ; envoyer une liste de tags puis `{"tags":[]}` pour vérifier leur retrait. Le DELETE est réservé à un fichier issu du dernier envoi de recette : il est ignoré par défaut ; ne définir `allowDelete=true` qu'après le partage, si une suppression manuelle de cette donnée jetable est souhaitée. Ne pas exécuter sur des données existantes.

Pour actualiser la collection après une évolution de l'API, importer le JSON Scramble depuis `/docs/api.json` (ou l'export ci-dessus), regrouper par tags et reporter les changements dans la collection existante en conservant les variables, scripts, autorisations et protections ; exporter en v2.1 sans secrets. Swagger UI et le contrat de conception restent les références. Aucun Newman ni nouveau contrôle CI n'est nécessaire.

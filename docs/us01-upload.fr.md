---
layout: default
title: "DataShare — US01 Téléversement authentifié"
permalink: /us01-upload.fr.html
lang: fr
---

# US01 — Téléversement avec compte

[**English**](us01-upload.md) · [Documentation française](index.fr.md)

**Statut : implémentation préparée sur `feat/us01-authenticated-upload`. Recette Docker, BDD, navigateur et Figma à effectuer sur le Mac.**

Sources : [US01 — Upload (avec compte)](https://github.com/jlbokass/datashare/issues/4), [MCD DESIGN-02](data-model.fr.md), [OpenAPI DESIGN-03](api/README.fr.md), [handoff Figma](design-handoff.fr.md).

## Comportement et périmètre

- Un utilisateur **connecté** envoie **un à cinq fichiers** vers `POST /api/transfers` (multipart, clé `files[]`), avec JWT signé. Sans authentification : **401**.
- L'API répond **201** avec un transfert (UUID), un token de partage imprévisible de **64 caractères hexadécimaux**, un lien relatif `/share/{token}`, une date d'expiration, et les métadonnées de chaque fichier (UUID, nom, taille, MIME détecté côté serveur, date).
- **Plusieurs fichiers par transfert**, un seul token et une expiration commune ; le transfert appartient à l'utilisateur. Métadonnées en PostgreSQL, octets sur le disque Laravel privé `transfers` dans des fichiers `.bin` dont les noms sont générés par le serveur. Aucune exposition du contenu dans le répertoire web.
- Expiration **7 jours par défaut**, choix **1 à 7 jours**. Le processus quotidien `transfers:purge-expired` supprime **les fichiers et les métadonnées**. Un service Docker `scheduler` exécute le planificateur Laravel.
- Maximum **1 000 000 000 octets** par fichier (Go décimal). Validation côté serveur du contenu MIME **et** de l'extension : PDF, PNG, JPEG, GIF, WEBP, TXT, MP3, MP4, ZIP. Exécutables et formats interdits rejetés. C'est une **liste blanche élémentaire**, pas une analyse antivirus ; une archive ZIP peut contenir des éléments dangereux.
- Limites additionnelles choisies pour le MVP local : **5 fichiers et 2 000 000 000 octets cumulés**. Ce sont des **choix d'exploitation**, **pas des obligations OC**. Les limites Nginx/PHP sont placées légèrement au-dessus pour laisser passer l'enveloppe multipart.
- En cas d'échec partiel de stockage ou de BDD, le code supprime les octets déjà écrits ; le client Angular ne remplace jamais la validation et les permissions côté Laravel.

**Pas encore réalisés :** téléchargement public (US02), historique (US05), suppression individuelle (US06), mot de passe facultatif (US09), tags (US08). La route Angular `/share/{token}` présente seulement une **page d'attente US02** ; ce n'est **pas** un téléchargement opérationnel. Le champ mot de passe de la maquette est volontairement omis.

## Recette sur ton Mac

À la racine du dépôt, sur la branche US01 :

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan migrate:status
docker compose exec -T app php artisan schedule:list
docker compose exec -T app php artisan transfers:purge-expired

docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

Vérifie que le service `scheduler` est lancé et que la purge est bien planifiée quotidiennement. **Ne lance pas `migrate:fresh` ni `docker compose down -v`**, et ne communique pas de secrets.

Dans le navigateur, **connecte-toi d'abord sur http://127.0.0.1:8080/login**, puis clique sur le logo DataShare **sans recharger la page** : le JWT d'US04 n'existe qu'en mémoire. Sur l'accueil :

1. Envoie un PDF ou PNG léger, récupère le lien unique et utilise « Copier le lien ».
2. Envoie **deux fichiers** dans un transfert, choisis une expiration à **1 jour** et vérifie les deux noms.
3. Essaie un fichier `.exe` ou `.php`, une sélection vide, plus de cinq fichiers et éventuellement un fichier au-delà de 1 Go. Le transfert doit être refusé avec un message clair.
4. Contrôle l'affichage en **393px et 1440px**, puis aux largeurs intermédiaires ; consigne les écarts Figma sans annoncer prématurément une conformité complète.
5. Le lien doit ouvrir une page **US02 en attente**, **pas** un téléchargement. Les vrais contrôles de téléchargement/erreur 404/410 appartiennent à US02.

Les octets du transfert sont conservés dans `backend/storage/app/private/transfers` ; **ne pas les ajouter à Git**. Les tests emploient `Storage::fake('transfers')` et SQLite en mémoire : la migration sur PostgreSQL et le parcours navigateur sont à vérifier séparément.

## Critères d'acceptation

- [ ] Authentification obligatoire ; types, tailles, nombre et expiration contrôlés côté serveur.
- [ ] Métadonnées PostgreSQL, stockage privé réel et token non prédictible.
- [ ] Purge quotidienne déclarée et commande manuelle supprimant contenu **et** métadonnées expirés, jamais les transferts actifs.
- [ ] Tests Laravel, Angular, build, Docker et recette navigateur déclarés verts après exécution.
- [ ] Écarts avec Figma consignés, documentation et journal IA FR/EN à jour.
- [ ] Revue de PR Draft avant fusion dans `develop`.

Documentation officielle : [stockage Laravel 13](https://laravel.com/framework/docs/13.x/filesystem), [validation](https://laravel.com/framework/docs/13.x/validation), [planification](https://laravel.com/framework/docs/13.x/scheduling).

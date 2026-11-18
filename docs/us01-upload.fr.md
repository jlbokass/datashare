---
layout: default
title: "DataShare — US01 Téléversement authentifié"
permalink: /us01-upload.fr.html
lang: fr
---

# US01 — Téléversement avec compte

[**English**](us01-upload.md) · [Documentation française](index.fr.md)

**Statut : le développeur a confirmé la recette Docker/migrations, tests/build, upload PDF/multifichier, expiration d'un jour, retour à l'accueil corrigé et option de démonstration à cinq minutes verts. La **conformité visuelle Figma reste à traiter dans [UI-01 #37](https://github.com/jlbokass/datashare/issues/37)**. Aucun résultat de charge réelle à 1 Go, d'antivirus ou de performance n'est revendiqué.**

Sources : [US01 — Upload (avec compte)](https://github.com/jlbokass/datashare/issues/4), [MCD DESIGN-02](data-model.fr.md), [OpenAPI DESIGN-03](api/README.fr.md), [handoff Figma](design-handoff.fr.md).

## Comportement et périmètre

- Un utilisateur **connecté** envoie **un à cinq fichiers** vers `POST /api/transfers` (multipart, clé `files[]`), avec JWT signé. Sans authentification : **401**.
- L'API répond **201** avec un transfert (UUID), un token de partage imprévisible de **64 caractères hexadécimaux**, un lien relatif `/share/{token}`, une date d'expiration, et les métadonnées de chaque fichier (UUID, nom, taille, MIME détecté côté serveur, date).
- **Plusieurs fichiers par transfert**, un seul token et une expiration commune ; le transfert appartient à l'utilisateur. Métadonnées en PostgreSQL, octets sur le disque Laravel privé `transfers` dans des fichiers `.bin` dont les noms sont générés par le serveur. Aucune exposition du contenu dans le répertoire web.
- Expiration **7 jours par défaut**, choix **1 à 7 jours**. Le processus quotidien `transfers:purge-expired` supprime **les fichiers et les métadonnées**. Un service Docker `scheduler` exécute le planificateur Laravel.
- Maximum **1 000 000 000 octets** par fichier (Go décimal). Validation côté serveur du contenu MIME **et** de l'extension : PDF, PNG, JPEG, GIF, WEBP, TXT, MP3, MP4, ZIP. Exécutables et formats interdits rejetés. C'est une **liste blanche élémentaire**, pas une analyse antivirus ; une archive ZIP peut contenir des éléments dangereux.
- Limites additionnelles choisies pour le MVP local : **5 fichiers et 2 000 000 000 octets cumulés**. Ce sont des **choix d'exploitation**, **pas des obligations OC**. Les limites Nginx/PHP sont placées légèrement au-dessus pour laisser passer l'enveloppe multipart.
- En cas d'échec partiel de stockage ou de BDD, le code supprime les octets déjà écrits ; le client Angular ne remplace jamais la validation et les permissions côté Laravel.

**Dossiers et ZIP — arbitrage provisoire :** pas d'envoi direct de répertoire dans le MVP (le navigateur sélectionne des fichiers, pas une arborescence à reproduire). Pour transmettre un dossier, le destinataire peut recevoir une **archive ZIP unique**. Le backend conserve le ZIP comme **fichier opaque** : aucune extraction, prévisualisation ni exécution sur le serveur. Une archive peut contenir un exécutable ou une bombe de décompression ; **aucun antivirus ni inspection interne n'est encore implémenté**. Évaluer explicitement cette limite avant la livraison publique d'US02. Le sélecteur grise les `.exe` grâce à `accept`, mais ce filtrage visuel ne remplace pas la validation serveur ; le glisser-déposer de `.exe` doit également être refusé.

**Démo locale (hors périmètre OC) :** dans le `backend/.env` existant, définir `TRANSFER_DEMO_5_MIN_ENABLED=true` (uniquement en local). Appliquer `docker compose exec -T app php artisan config:clear`, puis `docker compose restart app scheduler`. Vérifier `curl -fsS http://127.0.0.1:8080/api/demo/capabilities` (réponse `five_minute_expiry: true`) et `docker compose exec -T app php artisan schedule:list` (purge chaque minute). Le formulaire propose alors **« Démo locale — 5 minutes »**. Le backend refuse cette option si elle est désactivée ou hors environnement local/test. Pour revenir à l'OC standard, désactiver le flag puis vider le cache de configuration et redémarrer le scheduler. En démo, un transfert expire après cinq minutes et sa purge physique survient au passage suivant du planificateur (en principe au plus une minute plus tard si le service tourne).

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
2. Envoie **deux fichiers** dans un transfert, choisis une expiration à **1 jour** et vérifie les deux noms. Après le résultat, clique sur le **logo DataShare** et vérifie le retour direct à un formulaire neuf sans perdre la connexion.
3. Essaie un fichier `.exe` ou `.php` par **glisser-déposer**, une sélection vide, plus de cinq fichiers et éventuellement un fichier au-delà de 1 Go. Le transfert doit être refusé. Le sélecteur système peut griser les fichiers interdits, comportement normal.
4. Si le mode démo est activé, crée un transfert à **5 minutes**, vérifie sa date/heure d'expiration et la purge après expiration ; ne prétends pas que le téléchargement fonctionne déjà. Contrôle ensuite l'affichage en **393px et 1440px**, puis aux largeurs intermédiaires ; **des écarts Figma ont été signalés et restent à corriger dans la recette UI dédiée**.
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

---
layout: default
title: "DataShare — Intégration locale"
permalink: /development.fr.html
lang: fr
---

# DataShare — Environnement de développement (TECH-04)

[**English**](development.md) · [Accueil de la documentation](index.fr.md)

**Statut : recette locale annoncée verte par le développeur (18 novembre 2026) : migrations PostgreSQL, hot reload Angular, contrôles health et tests/build Laravel/Angular. Les sorties détaillées du terminal ne sont pas archivées ici.** TECH-04 raccorde les squelettes Laravel 13 / Angular 22 issus de TECH-03. Cet environnement sert au **développement local**, pas à la production.

## Services et accès

| Service | Fonction | Accès |
| --- | --- | --- |
| `db` | PostgreSQL 18 et données persistantes | Réseau Docker uniquement |
| `app` | PHP 8.4 FPM exécutant Laravel | Réseau Docker, port 9000 |
| `frontend` | Serveur Angular 22 avec rechargement et HMR | Réseau Docker, port 4200 |
| `web` | Passerelle Nginx à origine unique | **http://127.0.0.1:8080** uniquement |
| `php`, `node` | Outils CLI ponctuels | Profil `tools` |

Nginx oriente `/api/*` et `/up` vers Laravel, le reste vers Angular. Les WebSockets permettent le HMR. La route `GET /api/health` est un **contrôle purement technique**, hors contrat métier OC : elle retourne `{"status":"ok"}` et **ne vérifie pas l'accès à PostgreSQL**.

## Recette locale (à la racine du dépôt)

1. Se placer sur `feat/tech-04-dev-integration` après synchronisation de `develop`.
2. Conserver le **`.env` de la racine** créé lors de TECH-02, avec les identifiants locaux uniques `POSTGRES_*`. **Ne jamais le commiter.**
3. Conserver `backend/.env` issu de TECH-03 et sa clé `APP_KEY` : **ne pas l'écraser**. Le service `app` reçoit les variables `DB_*` depuis le `.env` racine et celles-ci priment sur les valeurs SQLite historiques du fichier Laravel local.
4. Exécuter :

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan migrate:status
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/up
```

Attendus : services lancés ; migrations et statut PostgreSQL corrects ; réponse JSON `ok` ; code HTTP **200** pour `/up`. Si Nginx répond temporairement **502**, vérifier que l'installation npm et la compilation Angular sont achevées avant de réessayer. Diagnostic : `docker compose logs -f frontend app web`.

5. Ouvrir **http://127.0.0.1:8080/**. Modifier provisoirement une chaîne visible dans `frontend/src/app/app.html` et enregistrer. Vérifier que le navigateur se met à jour **sans rechargement manuel ni redémarrage** ; remettre ensuite le texte initial.
6. Depuis la console du navigateur : `fetch('/api/health').then(r => r.json()).then(console.log)`. Ce test valide le trajet **navigateur → Nginx → Laravel** sur une même origine, mais pas encore un service Angular `HttpClient`.
7. Contrôles de non-régression :

```bash
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

**Attention :** le fichier `backend/phpunit.xml` généré utilise toujours SQLite en mémoire pour les tests. Ceux-ci ne prouvent donc pas l'intégration PostgreSQL : les commandes `migrate` et `migrate:status` la vérifient séparément.

## Hot reload, cycle de vie et sécurité

- Les sources sont montées depuis le Mac. Angular utilise `--poll 1000` pour détecter les changements, notamment sur macOS ; il reconstruit la page automatiquement. PHP-FPM lit les sources PHP locales.
- `node_modules` est conservé dans un volume Docker dédié pour éviter les conflits de dépendances natives Mac/containeur. Le premier démarrage exécute `npm ci` ; un changement de lockfile peut nécessiter une réinstallation. Éviter `down -v`.
- Seule la passerelle Nginx écoute sur l'interface locale de l'hôte ; la BDD, PHP-FPM et Angular ne sont **pas exposés publiquement**.
- Arrêter les conteneurs sans effacer PostgreSQL : `docker compose down`. **Ne pas utiliser `docker compose down -v`** sauf si la perte des données et dépendances est voulue.
- Aucune authentification JWT, transfert de fichier, sécurisation de production, TLS, Dozzle ou maquette métier n'est encore réalisé.

## Handoff UI

Voir la [synthèse du handoff](design-handoff.fr.md). Le [PDF vectoriel complet](design/DataShare_UI_Design_Handoff_v1.pdf) est commité sur la branche TECH-04. Le Figma source reste prioritaire en cas d'évolution. Les variantes avec mot de passe correspondent à **US09 facultative** : ne pas laisser croire qu'elle est disponible sans implémentation.

## Preuves à fournir avant fusion

Indiquer le résultat de Compose, migrations/statut, `/api/health`, `/up`, modification Angular avec hot reload et tests/build. Ne jamais communiquer `.env` ni la sortie complète de `docker compose config` contenant des secrets.

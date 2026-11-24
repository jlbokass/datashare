# DataShare — Procédures de maintenance (OC P3)

[English](docs/en/MAINTENANCE.md) · [Documentation technique](docs/technical-documentation.fr.md)

Ce document présente les procédures d'exploitation et de maintenance de DataShare en environnement local. Les procédures d'exploitation en production, de sauvegarde et de restauration ainsi que de déploiement automatisé de l'application ne sont pas validées.

## Exploitation locale

Depuis la racine du dépôt, sur la branche de travail appropriée, avec les fichiers de configuration `.env` locaux exclus du suivi Git :

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
docker compose logs --tail=100 app web frontend scheduler db
```

Le service `scheduler` assure la purge quotidienne des fichiers expirés et de leurs métadonnées (US01). Lorsque l'option locale `TRANSFER_DEMO_5_MIN_ENABLED=true` est activée, vider le cache de configuration et redémarrer le planificateur pour une exécution chaque minute. **`docker compose down` conserve les volumes nommés.** La commande `docker compose down -v` est destructive et ne doit être utilisée qu'en cas de suppression volontaire des données locales.

## Journalisation structurée et diagnostic local

Nginx produit des journaux d'accès JSON sur la sortie standard (`stdout`). Le format contient l'horodatage, la méthode HTTP, le statut, la durée totale de la requête en secondes, le volume de la requête (ligne, en-têtes et corps) et celui du corps de la réponse, en octets. Les URL, paramètres, adresses IP, en-têtes et jetons ne sont pas enregistrés dans **ce format d'accès**. Les journaux d'erreur Nginx, PHP-FPM et les exceptions Laravel peuvent néanmoins contenir des informations sensibles : ne pas les publier sans vérification.

Les services Laravel `app` et `scheduler` utilisent le canal Monolog `stderr` avec `JsonFormatter`, configuré par Docker Compose sans modifier les fichiers `.env` locaux. Les autres flux des conteneurs conservent leur format existant. Aucun collecteur externe n'est requis.

Après récupération de la configuration sur un environnement déjà démarré :

```bash
docker compose config --quiet
docker compose up -d --no-deps --force-recreate app scheduler web
docker compose exec -T app php artisan config:clear
docker compose restart scheduler
docker compose exec -T web nginx -t
curl -fsS http://127.0.0.1:8080/api/health
docker compose logs --no-log-prefix --tail=20 web
docker compose logs --tail=20 app scheduler
```

Pour vérifier ponctuellement le format Laravel, sans écrire de donnée métier :

```bash
docker compose exec -T app php artisan tinker --execute='logger()->info("datashare.logging_check", ["status" => "ok"]);'
```

Le message JSON de cette commande apparaît sur la sortie d'erreur du processus exécuté par `docker compose exec` ; il ne constitue pas à lui seul une preuve de collecte du service PHP-FPM. Les journaux des processus permanents restent consultables avec `docker compose logs`. Utiliser la commande de test uniquement en local.

Pour analyser les métriques, comparer le statut et `request_time_s` lors d'un transfert ou d'un téléchargement de test ; `response_body_bytes` mesure le corps de la réponse et non la taille du fichier pour toutes les routes. Voir [PERF.md](PERF.md) pour les mesures chronométrées. La recette locale de la journalisation structurée Nginx et Laravel, décrite ci-dessus, a été déclarée réussie le 24 novembre 2026 ([PR #72](https://github.com/jlbokass/datashare/pull/72)). Les sorties détaillées et la version exacte de Nginx ne sont pas archivées ; ce résultat ne constitue pas un audit de confidentialité exhaustif. Dozzle reste une [évolution facultative](https://github.com/jlbokass/datashare/issues/64).

## Mise à jour des dépendances — fréquence proposée

| Moment | Opération | Risques / contrôles |
| --- | --- | --- |
| Rapidement après une alerte critique | Vérifier Composer/npm et les images Docker, corriger les dépendances concernées | Régressions de l'authentification JWT et du téléversement, incompatibilités de versions, cohérence des fichiers de verrouillage |
| Toutes les 2 à 4 semaines (proposition) | Examiner les mises à jour des frameworks et outils ainsi que leurs notes de version | Compatibilité Laravel, Angular, PHP et Node.js ; pull request contrôlée par la CI |
| Avant une livraison ou une évolution majeure | Exécuter les tests, la compilation, les migrations et les validations des parcours critiques | Perte de données, erreur de migration, stockage privé, session JWT |
| Chaque jour en exploitation | Contrôler le fonctionnement du planificateur, la purge et les journaux | Fichiers expirés non supprimés, saturation disque |

Commandes de consultation des mises à jour disponibles, sans modification des versions installées :

```bash
docker compose run --rm php sh -lc 'cd backend && composer outdated'
docker compose run --rm node sh -lc 'cd frontend && npm outdated'
```

Effectuer les mises à jour **sur une branche dédiée**. Versionner les fichiers de verrouillage des dépendances, examiner les modifications, exécuter les tests et vérifier les résultats de l'intégration continue avant la fusion.

## Données et reprise — travail restant

- PostgreSQL (métadonnées) et le stockage privé (contenu des fichiers) constituent **deux espaces de stockage distincts**. Une sauvegarde cohérente doit couvrir les deux. Aucune procédure de restauration n'a fait l'objet d'un test.
- Avant une mise en production avec des données réelles, définir la durée de conservation, les droits d'accès, le chiffrement et l'automatisation des sauvegardes.
- Avant une migration, vérifier les données existantes, éviter la commande destructive `migrate:fresh` et documenter les possibilités et limites du retour arrière.
- L'application n'est pas déployée en production et aucune procédure automatisée de livraison applicative n'est opérationnelle.
- L'intégration éventuelle d'un outil de consultation des journaux, tel que Dozzle, nécessite une évaluation des accès privilégiés au socket et à l'API Docker.

## Fiche d'opération

Pour assurer la traçabilité des opérations de maintenance, consigner la **date, l'identifiant du commit, les dépendances et images modifiées, les migrations, les commandes et tests exécutés, les incidents, les décisions, les résultats de validation et les possibilités de reprise**. Ne jamais inclure de secrets ni de fichiers privés.

## Démonstration de l'expiration et de la purge

En mode standard, les transferts expirent après 1 à 7 jours et les éléments expirés sont supprimés par la purge quotidienne. Le mode de démonstration à cinq minutes est réservé à l'environnement local. Pour l'activer, définir `TRANSFER_DEMO_5_MIN_ENABLED=true` dans `backend/.env`, puis :

```bash
docker compose exec -T app php artisan config:clear
docker compose restart app scheduler
curl -fsS http://127.0.0.1:8080/api/demo/capabilities
docker compose exec -T app php artisan schedule:list
```

L'indicateur `five_minute_expiry` doit être actif et le planificateur doit exécuter la purge chaque minute. La procédure de démonstration de l'expiration et du nettoyage des métadonnées, définie dans [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57), est la suivante :

1. Arrêter temporairement le planificateur avec `docker compose stop scheduler`.
2. Créer un transfert avec une expiration de cinq minutes. Une fois cette durée écoulée, vérifier son statut expiré et le refus du téléchargement public.
3. Redémarrer impérativement le planificateur avec `docker compose start scheduler`, puis vérifier la disparition des métadonnées après la purge. Les journaux sont consultables avec `docker compose logs --tail=30 scheduler`.

En exploitation normale, le planificateur reste actif. Pour revenir au mode standard, désactiver l'option de démonstration, vider le cache de configuration et redémarrer les services.

## Suppression et reprise après incident

Le service `TransferDeletion` verrouille le transfert parent dans une transaction PostgreSQL afin de sérialiser les opérations de suppression et de purge. Le contenu des fichiers est supprimé avant leurs métadonnées. Les opérations sur le système de fichiers et la base de données ne sont pas atomiques : si la transaction PostgreSQL échoue après la suppression d'un fichier, son contenu ne peut pas être restauré par le retour arrière de la transaction. Une nouvelle tentative permet de traiter les métadonnées résiduelles. En cas d'erreur du stockage, les métadonnées sont conservées pour permettre cette reprise.

La purge poursuit le traitement des autres transferts lorsqu'une suppression échoue et renvoie un code de sortie non nul. En cas d'incident, consulter les journaux et ne pas supprimer récursivement le stockage privé. Voir [architecture](docs/architecture.fr.md).

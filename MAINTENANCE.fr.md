# DataShare — Procédures de maintenance (OC P3)

[English](MAINTENANCE.md) · [Documentation technique](docs/technical-documentation.fr.md)

**Statut : procédures pour l'environnement de développement ; exploitation de production, sauvegardes testées et déploiement automatisé non encore vérifiés.**

## Exploitation locale

À la racine du dépôt, avec la branche correcte et les `.env` locaux ignorés par Git :

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
docker compose logs --tail=100 app web frontend scheduler db
```

Le service `scheduler` assure la purge quotidienne des fichiers expirés US01. Avec le flag local `TRANSFER_DEMO_5_MIN_ENABLED=true`, vider le cache de configuration et redémarrer le scheduler pour une exécution à la minute. **`docker compose down` conserve les volumes** ; ne jamais lancer `docker compose down -v` sauf si l'on veut effacer volontairement les données locales.

## Mise à jour des dépendances — fréquence proposée

| Moment | Opération | Risques / contrôles |
| --- | --- | --- |
| Rapidement après une alerte critique | Vérifier Composer/npm et les images Docker, corriger les dépendances concernées | Régressions JWT/upload, versions incompatibles, cohérence lockfiles |
| Toutes les 2 à 4 semaines (proposition) | Examiner mises à jour framework/outils et changelogs | Compatibilité Laravel/Angular/PHP/Node ; PR testée |
| Avant livraison / nouvelle fonction majeure | Relancer tests/builds, migrations et parcours fonctionnels critiques | Perte de données, erreur de migration, stockage privé, session JWT |
| Chaque jour en exploitation | Contrôler fonctionnement du scheduler, purge et logs | Fichiers expirés non supprimés, saturation disque |

Commandes d'inventaire sans changement de version :

```bash
docker compose run --rm php sh -lc 'cd backend && composer outdated'
docker compose run --rm node sh -lc 'cd frontend && npm outdated'
```

Effectuer les mises à jour effectives **sur branche dédiée**, conserver les lockfiles, relire la différence et exécuter les tests et vérifier la CI existante.

## Données et reprise — travail restant

- PostgreSQL (métadonnées) et stockage privé (octets) sont **deux sources de données distinctes** : une sauvegarde cohérente doit couvrir les deux. Aucun test de restauration n'existe encore.
- Définir rétention, accès, chiffrement et automatisation de sauvegardes avant d'héberger des données réelles.
- Avant migration, vérifier les lignes existantes ; éviter `migrate:fresh` et documenter les limites du rollback.
- Aucun hébergement de production ou script de livraison automatisée n'est déclaré opérationnel.
- Dozzle, s'il est ajouté, nécessite une revue de l'accès privilégié au socket/API Docker.

## Fiche d'opération

Consigner **date, SHA, dépendances/images touchées, migrations, commandes/tests, incident, décision, validation et possibilité de reprise**. Ne pas inclure de mots de passe ou de fichiers utilisateurs privés.

## Démonstration de l'expiration et de la purge

Le mode standard expire les transferts après 1 à 7 jours et les purge quotidiennement. La démonstration à cinq minutes est locale uniquement : définir `TRANSFER_DEMO_5_MIN_ENABLED=true` dans `backend/.env`, puis :

```bash
docker compose exec -T app php artisan config:clear
docker compose restart app scheduler
curl -fsS http://127.0.0.1:8080/api/demo/capabilities
docker compose exec -T app php artisan schedule:list
```

La capacité `five_minute_expiry` doit être vraie et la purge planifiée chaque minute. Pour la soutenance, conformément à [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57), arrêter temporairement le scheduler avec `docker compose stop scheduler`, créer un transfert de démonstration et observer son statut expiré et le refus du lien public après expiration. Relancer impérativement `docker compose start scheduler` et observer la disparition des métadonnées (`docker compose logs --tail=30 scheduler`). En usage normal, le scheduler reste actif. Pour revenir au mode standard, désactiver le flag, vider le cache de configuration et redémarrer les services.

## Suppression et reprise après incident

`TransferDeletion` verrouille le transfert parent dans une transaction PostgreSQL pour sérialiser suppression et purge. Les octets sont supprimés avant les métadonnées. Les deux stockages ne forment pas une transaction atomique : si la BDD échoue après la suppression des octets, ils ne sont pas restaurés. Une nouvelle tentative peut réconcilier les métadonnées restantes ; une erreur de stockage conserve les métadonnées pour permettre cette reprise. La purge poursuit les autres transferts et retourne un code non nul si l'un échoue. Vérifier les journaux et ne pas supprimer récursivement le stockage. Voir [architecture](docs/architecture.fr.md).

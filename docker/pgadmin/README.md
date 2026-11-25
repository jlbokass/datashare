# pgAdmin 4 — DataShare (facultatif / optional)

## Utilisation (FR)

Depuis la racine du dépôt, démarrer les environnements souhaités (`make up`, `make garage-up` ou la procédure E2E de [TESTING.md](../../TESTING.md)), puis :

```bash
make pgadmin-up
```

Ouvrir http://127.0.0.1:8082. Se connecter avec `admin@example.com` et le mot de passe généré au premier lancement dans le fichier local `.env.pgadmin` (ignoré par Git). Les trois serveurs sont préenregistrés au premier lancement.

| Serveur | Hôte interne | Base / utilisateur | Mot de passe PostgreSQL |
| --- | --- | --- | --- |
| DataShare — App | app-db | datashare (par défaut) | POSTGRES_PASSWORD de .env |
| DataShare — Garage | garage-db | datashare_garage | POSTGRES_PASSWORD de .env.garage |
| DataShare — E2E | test-db | datashare_ql02 | ql02-local-test-only |

Port PostgreSQL interne : 5432. Si les valeurs de la stack App ont été personnalisées, ajuster la base de maintenance et l'utilisateur dans les propriétés de son serveur pgAdmin. Les mots de passe PostgreSQL ne sont pas préenregistrés. Utiliser des données de démonstration et des requêtes SELECT uniquement ; ne pas modifier le schéma ni les données depuis pgAdmin.

Les projets Compose par défaut sont `datashare-p3`, `datashare-garage` et `datashare-ql02-test`. Seuls les conteneurs PostgreSQL actifs sont raccordés à leurs réseaux d'accès respectifs. Relancer `make pgadmin-up` après le démarrage ou la recréation d'une base. L'outil ne démarre ni ne migre les bases. La base E2E est temporaire : consulter les tables après les migrations et avant l'arrêt de la stack de tests. SQLite en mémoire (PHPUnit) et les objets S3 (Garage) ne sont pas visibles dans pgAdmin.

Exemple de contrôle non destructif dans le Query Tool de chaque serveur :

```sql
SELECT current_database();
SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';
```

Arrêter l'outil après usage :

```bash
make pgadmin-stop
```

Cette commande arrête pgAdmin et détache les bases encore actives de ses réseaux d'accès. Elle ne supprime ni conteneurs ni volumes applicatifs. Les paramètres de pgAdmin sont conservés dans son propre volume. Aucun port PostgreSQL n'est publié ; seul le port HTTP de pgAdmin est accessible sur la boucle locale du Mac.

## Usage (EN)

Start the required local stacks (`make up`, `make garage-up` or the E2E procedure in [TESTING.md](../../TESTING.md)), then run `make pgadmin-up`. Open http://127.0.0.1:8082 and log in as `admin@example.com` using the dedicated password generated in the Git-ignored `.env.pgadmin` file.

The three server definitions are imported on first startup. Use the connection table above for their internal hostnames, database names, users and PostgreSQL password sources. PostgreSQL listens on internal port 5432; database passwords are not preloaded. If the App database or user was customized, edit its server properties.

Only running PostgreSQL containers with the default Compose project names are attached to their respective access networks. Run `make pgadmin-up` again after starting or recreating a database. The tool does not start or migrate any database. Inspect E2E tables after migration and before teardown; PHPUnit in-memory SQLite and Garage S3 objects cannot be inspected here. Use demo data and SELECT queries only.

Run `make pgadmin-stop` after use; this stops pgAdmin and detaches running databases from its access networks. Application containers and volumes are preserved. pgAdmin settings persist in their own volume. PostgreSQL ports remain unpublished and the web interface is restricted to loopback.

Official image: [dpage/pgadmin4](https://hub.docker.com/r/dpage/pgadmin4). [Container documentation](https://www.pgadmin.org/docs/pgadmin4/9.19/container_deployment.html).

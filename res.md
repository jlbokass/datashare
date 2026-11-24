La documentation de l’étape 2 est intégrée ; sa validation dynamique reste bloquée.

- PHPDoc anglais ajoutés aux **8 opérations métier et 2 routes de support**, sans duplication des schémas.
- Groupes ordonnés : **Authentication (3), Transfers (3), Public sharing (2), System (2)**.
- Attribut natif `Group` utilisé ; petit adaptateur [ClosureGroup.php](backend/app/Documentation/ClosureGroup.php) pour conserver les closures, non prises en charge directement par cet attribut.
- Titre **DataShare REST API**, aperçu concis et [options natives Swagger](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/) pour le filtrage et l’ouverture des sections.
- Corrections multipart, téléchargement binaire, JWT et erreurs conservées. Commentaire obsolète de `/health` et références courantes à l’ancienne interface retirés.

**Fichiers concernés :** huit contrôleurs API, `routes/api.php`, `config/scramble.php`, vue Blade Swagger, nouvel attribut, guides API/techniques et journaux FR/EN.

**Vérifications :** comparaison statique des corps exécutables inchangés, répartition 3/3/2/2 confirmée et `git diff --check` réussi. Le JSON courant est inaccessible depuis le sandbox. La QA est bloquée au socket Docker avant tout démarrage des tests ou de Pint.

Merci d’exécuter :

```bash
bash scripts/qa.sh backend
```

Puis effectuer uniquement la [recette documentaire](docs/api/README.fr.md), sans **Try it out**.

Aucun scénario fonctionnel exécuté. YAML, protections de tests et logique métier préservés. Aucun commit/push.

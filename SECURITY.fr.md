# DataShare — Sécurité et gestion des accès (OC P3)

[English](SECURITY.md) · [Documentation technique](docs/technical-documentation.fr.md)

**Statut : état de conception/implémentation, pas un audit achevé. Aucun résultat de scan des dépendances n'a encore été archivé.**

## Contrôles présents au stade US01

| Domaine | En place | Limites |
| --- | --- | --- |
| Comptes | Email unique, validation serveur, mots de passe hashés et salés par Laravel | Pas d'email de confirmation, conforme au périmètre OC |
| JWT | HS256 avec `firebase/php-jwt` v7.2.2, contrôle émetteur/expiration, clé `JWT_SECRET` dédiée, durée 30 min | Pas de révocation serveur ni refresh ; token Angular en mémoire, nouvelle connexion après actualisation |
| Routes | Middleware JWT sur `POST /api/transfers` et `GET /api/auth/me`, erreur 401 générique | Vérifications propriétaire US05/US06 à venir |
| Stockage | `storage/app/private/transfers` hors répertoire public ; noms générés, validations MIME et extension | ZIP opaque accepté, **sans extraction ni antivirus** |
| Limites | 1 000 000 000 octets/fichier ; plafonds choisis 5 fichiers et 2 Go cumulés ; configuration Nginx/PHP ; erreurs 413/422 | Pas de preuve de charge réelle à 1 Go ; ZIP peut contenir des exécutables/bombes |
| Expiration | 1–7 jours, purge quotidienne octets + métadonnées ; démo locale de 5 min sous flag | Contrôler fonctionnement de la purge en environnement déployé |
| Transport | Nginx local restreint à `127.0.0.1:8080` | **Pas encore de déploiement HTTPS/TLS en production** |

Les maquettes du handoff présentent un partage protégé par mot de passe : c'est **US09 facultative**, pas une fonctionnalité de sécurité opérationnelle. L'envoi direct d'un dossier n'est pas pris en charge ; un dossier peut être compressé en ZIP unique.

## Risques et décisions ouverts

- **US02 téléchargement public non réalisé** : contrôler token imprévisible, expiration, streaming via API, en-tête `Content-Disposition: attachment`, `nosniff`, noms sûrs et codes 404/410, sans URL de stockage exposée.
- **Archives ZIP** : aucune extraction/exécution côté serveur, mais le téléchargement ne garantit pas l'innocuité du contenu. Arbitrage suivi dans [US02 #5](https://github.com/jlbokass/datashare/issues/5).
- La déconnexion efface le JWT navigateur, **sans l'invalider côté serveur avant ses 30 minutes**.
- HTTPS, CSP, sauvegardes, réponse aux incidents, scans et tests d'intrusion restent à réaliser. Ne pas qualifier l'application de sécurisée pour la production.
- Dozzle demandera un arbitrage particulier sur l'accès privilégié à l'API/socket Docker.

## Scans à exécuter et documenter

- [ ] `docker compose run --rm php sh -lc 'cd backend && composer audit'`
- [ ] `docker compose run --rm node sh -lc 'cd frontend && npm audit'`
- [ ] Optionnel : scan de conteneurs Trivy (ou équivalent).
- [ ] Consigner outil, version, date, SHA, vulnérabilités (sévérité/dépendance), corrections ou acceptations motivées et nouveau scan. **Aucun résultat n'est présenté tant que la commande n'a pas été exécutée.**
- [ ] Revoir permissions JWT, rate limits, uploads, ZIP, isolation et HTTPS avant livraison.

Ne jamais fournir `JWT_SECRET`, `APP_KEY`, mot de passe PostgreSQL, JWT ou fichier utilisateur privé.

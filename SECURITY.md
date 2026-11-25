# DataShare — Sécurité et audit des dépendances

[English](docs/en/SECURITY.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Lot QL-03](https://github.com/jlbokass/datashare/issues/53)

**Audit des dépendances du 23 novembre 2026.** Les contrôles ont été réalisés dans l'environnement Docker local, sur la branche `quality/ql-03-security`, issue de `develop` au commit `36291cd`. **Aucune vulnérabilité connue n'a été signalée par Composer ni par npm.** Les résultats sont consignés dans ce rapport à partir des captures d'exécution. L'identifiant exact du commit local et les versions des outils d'audit n'ont pas été relevés.

## 1. Audits et décisions

| Écosystème | Commande exécutée depuis la racine | Résultat |
| --- | --- | --- |
| PHP / Composer (`backend/composer.lock`) | `docker compose run --rm php sh -lc 'cd backend && composer audit --locked --format=summary'` | **0 avis de vulnérabilité** |
| Angular / npm (`frontend/package-lock.json`) | `docker compose run --rm node sh -lc 'cd frontend && npm audit'` | **0 vulnérabilité** |

Les audits portent sur les dépendances déclarées, y compris celles de développement. **Aucune mise à jour de sécurité n'a été identifiée comme nécessaire à la date du contrôle.** La notification de disponibilité de npm 12.2.3 ne correspond pas à un avis de sécurité. Aucune mise à jour automatique n'a été effectuée.

## 2. Protections du MVP

| Domaine | Mesures implémentées |
| --- | --- |
| Comptes et JWT | Adresse électronique unique, validation côté serveur et mot de passe haché. Le JWT est signé et vérifié par Laravel. Les routes publiques d'inscription et de connexion sont soumises à une limitation du nombre de requêtes. Un JWT valide est requis pour accéder aux fonctionnalités privées. |
| Fichiers et partage | Stockage privé en dehors du répertoire accessible publiquement, noms internes opaques, contrôle du type MIME et de l'extension. Taille maximale de **1 Go par fichier**, avec une limite opérationnelle de **5 fichiers et 2 Go par transfert**. Le lien public repose sur un jeton imprévisible. Les liens invalides ou expirés sont rejetés (HTTP 404 ou 410) ; les fichiers sont transmis en pièce jointe. |
| Durée de vie | Expiration configurable de **1 à 7 jours**, suppression planifiée des fichiers et des métadonnées expirés. Le mode de démonstration à cinq minutes est réservé à l'environnement local. |

Les contrôles d'accès applicatifs et les parcours principaux sont également couverts par les [tests](TESTING.md). Ces mesures constituent les protections du MVP ; elles ne permettent pas, à elles seules, d'établir le niveau de sécurité d'un environnement de production.

## 3. Limites connues

- **Déconnexion :** le JWT est supprimé de la mémoire du client Angular, mais reste valide côté serveur jusqu'à son expiration (environ 30 minutes) ; aucune révocation immédiate.
- **ZIP :** archives acceptées sans extraction, exécution ni analyse antivirus ; leur contenu n'est donc pas vérifié du point de vue des logiciels malveillants.
- **Déploiement :** une mise en production nécessiterait notamment l'utilisation de HTTPS, une politique de sauvegarde et de restauration, le durcissement de l'environnement et des procédures de sécurité opérationnelle.
- **Périmètre des audits :** les audits de dépendances détectent des avis connus à la date du contrôle ; ils ne remplacent ni l'analyse du code, ni un audit des conteneurs, ni un test d'intrusion.

**Conclusion :** les audits de dépendances réalisés le 23 novembre 2026 n'ont signalé aucune vulnérabilité connue. Ce résultat s'applique aux versions auditées à cette date et ne constitue pas une certification de sécurité de l'application.

## 4. Règles de validation et d'authentification

- Formats autorisés (extension et type MIME vérifiés côté serveur) : PDF, PNG, JPEG, GIF, WEBP, TXT, MP3, MP4 et ZIP. Le filtre du sélecteur Angular est une aide à la saisie, pas un contrôle de sécurité. L'envoi direct de dossiers n'est pas pris en charge ; les archives ZIP sont stockées sans analyse de leur contenu. Limites décimales : 1 000 000 000 octets par fichier, 2 000 000 000 octets par transfert et cinq fichiers au maximum. Le nombre maximal de fichiers et la taille cumulée par transfert sont des limites opérationnelles propres au MVP, non imposées par le sujet OpenClassrooms.
- Inscription : adresse électronique normalisée en minuscules et unique en base de données, mot de passe d'au moins huit caractères. Aucun JWT n'est délivré à l'inscription. Limite de dix inscriptions par minute et par client.
- Connexion : bibliothèque `firebase/php-jwt`, signature HS256, clé `JWT_SECRET` distincte de `APP_KEY`, vérification de la signature, de l'expiration, de l'émetteur et de l'utilisateur. Durée de validité : 1 800 secondes ; limite de cinq tentatives de connexion par minute et par client. Aucun jeton de renouvellement (*refresh token*) ni mécanisme de révocation immédiate. Le garde Angular ne remplace pas les contrôles Laravel.
- Les jetons de partage public, composés de 64 caractères hexadécimaux, sont distincts des JWT. Les réponses publiques n'exposent ni les chemins de stockage privé ni les données du propriétaire. Les téléchargements sont servis en pièce jointe avec l'en-tête `X-Content-Type-Options: nosniff` et sans mise en cache partagée.
- **US09 :** hash bcrypt par fichier, jamais sérialisé ; mot de passe en POST, 5 tentatives/minute/IP, URL relative signée valable 60 secondes et limitée au fichier. Le GET contrôle à nouveau l'expiration du transfert et la signature. Ne pas journaliser ni partager cette URL temporaire, réutilisable jusqu'à son expiration. Pas de chiffrement des fichiers au repos ni de récupération du mot de passe ; HTTPS requis en déploiement réel.

# DataShare — Sécurité et audit des dépendances

[English](SECURITY.md) · [Documentation technique](docs/technical-documentation.fr.md) · [Lot QL-03](https://github.com/jlbokass/datashare/issues/53)

**Bilan du 23 novembre 2026 : aucun avis de vulnérabilité détecté par Composer, aucune vulnérabilité détectée par npm.** Contrôles réalisés en local par le développeur sur la branche `quality/ql-03-security`, créée depuis `develop` (`36291cd`). Les sorties ont été communiquées sous forme de capture ; le SHA exact du poste et les versions des outils d'audit n'ont pas été relevés.

## 1. Audits et décisions

| Écosystème | Commande exécutée depuis la racine | Résultat |
| --- | --- | --- |
| PHP / Composer (`backend/composer.lock`) | `docker compose run --rm php sh -lc 'cd backend && composer audit --locked --format=summary'` | **0 avis de vulnérabilité** |
| Angular / npm (`frontend/package-lock.json`) | `docker compose run --rm node sh -lc 'cd frontend && npm audit'` | **0 vulnérabilité** |

Les audits couvrent les dépendances déclarées, y compris celles utilisées pour le développement, à la date du contrôle. **Décision : aucune mise à jour corrective nécessaire** au vu de ces résultats. La notification de disponibilité de npm 12.2.3 est une suggestion de nouvelle version, **pas une vulnérabilité** ; aucune mise à jour automatique n'a été effectuée. Aucun nouveau scan n'est nécessaire tant que les dépendances restent inchangées pour ce lot.

## 2. Protections du MVP

| Domaine | Mesures implémentées |
| --- | --- |
| Comptes et JWT | Email unique, validation côté serveur, mot de passe hashé ; JWT signé et vérifié côté Laravel. Inscription et connexion publiques avec limitation de fréquence ; JWT exigé pour consulter son compte, téléverser, afficher son historique ou supprimer ses fichiers. |
| Fichiers et partage | Stockage privé hors racine web, noms internes opaques, contrôle MIME/extension, taille maximale de **1 Go/fichier**, **5 fichiers et 2 Go/transfert** (choix MVP). Le lien public repose sur un token imprévisible ; erreurs 404/410 si invalide/expiré et téléchargement forcé en pièce jointe. |
| Durée de vie | Expiration de **1 à 7 jours**, purge planifiée des fichiers et métadonnées ; démonstration de cinq minutes réservée au local. |

Les contrôles d'accès applicatifs et les parcours principaux sont également couverts par les [tests](TESTING.fr.md). Ces mesures ne prouvent pas à elles seules la sécurité en production.

## 3. Limites connues

- **Déconnexion :** le JWT est retiré de la mémoire Angular mais demeure valide côté serveur jusqu'à son expiration (environ 30 minutes) ; aucune révocation immédiate.
- **ZIP :** archives acceptées sans extraction, exécution ni analyse antivirus ; les destinataires doivent se méfier des fichiers non fiables.
- **Déploiement :** HTTPS public, sauvegarde/restauration, durcissement et sécurité opérationnelle restent à définir avant toute mise en production.
- **Portée des scans :** les audits de dépendances détectent des avis connus à la date du contrôle ; ils ne remplacent ni l'analyse du code, ni un audit des conteneurs, ni un test d'intrusion.

**Conclusion QL-03 :** exigence de scan basique satisfaite, **aucune vulnérabilité signalée, aucune correction à appliquer**. Les limites ci-dessus sont documentées et ne constituent pas de nouvelles exigences pour ce lot.

---
layout: default
title: "DataShare — US02 Téléchargement public"
permalink: /us02-download.fr.html
lang: fr
---

# US02 — Téléchargement via lien unique

[**English**](us02-public-sharing.md) · [Documentation technique](index.fr.md)

**Statut : implémentation préparée sur une branche de travail. Tests Laravel/Angular, recette Docker/navigateur, revue ZIP et intégration de la CI encore à valider.**

Sources : [issue officielle US02 #5](https://github.com/jlbokass/datashare/issues/5), [contrat OpenAPI DESIGN-03](api/openapi.yaml), [handoff Figma](design-handoff.fr.md) et [SECURITY.md](https://github.com/jlbokass/datashare/blob/develop/SECURITY.fr.md).

## Contrat fonctionnel

- `GET /api/shares/{token}` est **public**. Le token aléatoire de 64 caractères, valide et non expiré, donne un **200** avec seulement les métadonnées autorisées : nom, type MIME, taille, échéance et UUID de chaque fichier. Aucun propriétaire, hash, JWT ou chemin privé n'est exposé.
- `GET /api/shares/{token}/files/{fileId}` ne demande **aucun compte**. Les octets du fichier correspondant sont envoyés en téléchargement forcé (`Content-Disposition: attachment`) avec nom d'origine sécurisé, `Content-Type: application/octet-stream`, `nosniff` et interdiction de cache partagé.
- Token invalide, absent, purgé ou fichier étranger au transfert : **404** `not_found`. Partage expiré mais pas encore purgé : **410** `share_expired`, y compris sur l'API de téléchargement. Après la purge US01, le même lien retourne 404.
- ZIP conservé comme **archive opaque** : aucune décompression ni exécution côté serveur. L'interface avertit que **l'antivirus n'analyse pas les archives**. L'envoi direct de dossiers n'est pas prévu. Ce risque reste à arbitrer avant un déploiement public.
- Protection par mot de passe : **US09 facultative**, non réalisée. Expiration standard US01 de 1 à 7 jours ; option locale « Démo — 5 minutes » uniquement lorsque le flag existe.

## Recette sur ton Mac

Sur la branche `feat/us02-public-download` :

```bash
docker compose run --rm php sh -lc 'cd backend && php artisan test --filter=PublicShareTest'
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
docker compose up -d
```

1. Connecte-toi, envoie un petit **PDF** depuis l'accueil, copie le lien `/share/{token}`.
2. Ouvre ce lien dans une **fenêtre de navigation privée**, sans connexion : vérifie nom, type, taille, échéance et bouton Télécharger. Le contenu sauvegardé doit correspondre au document initial et ne pas s'ouvrir comme page web active.
3. Envoie **deux fichiers** (PDF et PNG) derrière un seul lien, puis télécharge chacun en vérifiant le nom et les octets.
4. Ouvre `/share/bad-token` : message d'erreur compréhensible.
5. Avec le mode démo local, crée un partage à **cinq minutes**, attends son expiration et retente. **410** tant qu'il est en BDD mais expiré, **404** après purge ; aucun téléchargement ne doit réussir. Le test automatisé couvre explicitement le cas 410.
6. Essaie un ZIP **inoffensif** : il doit être téléchargé tel quel, sans extraction par Laravel, avec avertissement. Ne pas utiliser de véritable malware.
7. Contrôle les largeurs **393px/1440px** et signale les écarts Figma dans [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

**Attention :** le lien US01 mène à un véritable téléchargement **sur cette branche seulement**, sous réserve de recette ; pas encore sur `develop`. GitHub Pages n'exécute pas Laravel.

## Critères de validation

- [ ] Tests Laravel : accès public, octets et en-têtes, 404, 410, fichier étranger, fichier privé manquant, ZIP inoffensif.
- [ ] Tests Angular : lien valide/invalide/expiré, URL du téléchargement.
- [ ] Recette navigateur PDF, multifichiers et ZIP sans compte.
- [ ] Expiration réellement bloquante et stockage non exposé.
- [ ] Risques ZIP discutés et consignés.
- [ ] CI-01 [backend/frontend](ci.fr.md) verte sur la PR après intégration de CI-01 ; journal IA et docs à jour.
- [ ] PR approuvée puis fusion dans `develop`.

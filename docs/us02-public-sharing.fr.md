---
layout: default
title: "DataShare — US02 Téléchargement public"
permalink: /us02-download.fr.html
lang: fr
---

# US02 — Téléchargement via lien unique

[**English**](us02-public-sharing.md) · [Documentation technique](index.fr.md)

**Statut au 18 novembre 2026 :** CI backend (33 tests Laravel, 217 assertions, Pint) et frontend (tests et build) **vertes** sur [PR #43](https://github.com/jlbokass/datashare/pull/43). Le développeur confirme la recette locale **T01 PDF anonyme, T02 multifichiers, T03 lien invalide et T04 ZIP inoffensif : OK**. **T05 expiration : non validé** ; le transfert examiné avait une échéance standard à 7 jours, et non l'option locale de démonstration à 5 minutes. Aucune fusion dans `develop` à ce stade.

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
5. Vérifie d'abord `GET /api/demo/capabilities` : `five_minute_expiry` doit être `true` ; sinon, activer `TRANSFER_DEMO_5_MIN_ENABLED=true` dans `backend/.env` uniquement en environnement `APP_ENV=local`, exécuter `php artisan config:clear`, redémarrer `app` et `scheduler`, puis vérifier `schedule:list` (purge chaque minute). Sélectionne explicitement **« Démo locale — 5 minutes »**, crée un **nouveau** transfert, puis recontrôle le lien après son expiration. **410** tant qu'il est en BDD mais expiré, **404** après purge ; aucun téléchargement ne doit réussir. Le test automatisé couvre explicitement le cas 410.
6. Essaie un ZIP **inoffensif** : il doit être téléchargé tel quel, sans extraction par Laravel, avec avertissement. Ne pas utiliser de véritable malware.
7. Contrôle les largeurs **393px/1440px** et signale les écarts Figma dans [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

**Attention :** le lien US01 mène à un véritable téléchargement **sur cette branche seulement**, sous réserve de recette ; pas encore sur `develop`. GitHub Pages n'exécute pas Laravel.

## Critères de validation

- [x] Tests Laravel (33 verts, 217 assertions, Pint vert sur GitHub Actions) : accès public, octets et en-têtes, 404, 410, fichier étranger, fichier privé manquant, ZIP inoffensif.
- [x] Tests Angular et build verts sur GitHub Actions : lien valide/invalide/expiré, URL du téléchargement.
- [x] Recette navigateur T01 PDF anonyme, T02 multifichiers, T03 lien invalide et T04 ZIP inoffensif : verts selon le développeur.
- [ ] T05 : refaire la recette locale après activation **et sélection** du mode 5 minutes ; vérifier le blocage des téléchargements à l'échéance, puis la purge. Les tests automatiques vérifient déjà 410/404, mais ne remplacent pas ce contrôle.
- [ ] Risques ZIP discutés et consignés.
- [x] CI backend/frontend verte sur [PR #43](https://github.com/jlbokass/datashare/pull/43) (après la fusion de [CI-01 #42](https://github.com/jlbokass/datashare/pull/42)). Journal IA mis à jour avec les limites de la recette.
- [ ] PR approuvée puis fusion dans `develop`.

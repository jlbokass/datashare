# DataShare — Plan et preuves de performance (OC P3)

[English](PERF.md) · [Documentation technique](docs/technical-documentation.fr.md)

**Statut : plan uniquement. Aucun k6, relevé de taille réelle de bundle ni métrique de production n'a encore été documenté.**

## Test d'un endpoint critique — à réaliser

**Cible :** `POST /api/transfers` (US01) avec authentification JWT et multipart. Compléter par `GET /api/shares/{token}/files/{fileId}` (US02), quand le téléchargement sera développé.

Pour chaque essai, relever : SHA, date, matériel CPU/RAM, versions Docker, taille/type de fichier, nombre de fichiers, état BDD, préparation JWT, taux de réponses 2xx/4xx/5xx, débit et durées p50/p95/p99. Employer uniquement des fichiers de test et des identifiants locaux.

Proposition de recette initiale : une charge légère d'un utilisateur pendant une minute sur un fichier inoffensif de 1–10 Mo, puis une concurrence limitée (par exemple 5 utilisateurs virtuels) après contrôle de la capacité disque et de la purge. Outil **k6 ou équivalent**. Ne jamais lancer un test de charge sur une infrastructure externe sans autorisation.

| Campagne | Date/SHA et conditions | p50/p95, erreurs et débit | Analyse |
| --- | --- | --- | --- |
| Upload initial | **Non exécutée** | **Aucune mesure** | Script k6 et fixtures à produire |
| Download US02 | **Endpoint absent** | **Aucune mesure** | Prévu après US02 |

## Budget côté frontend

`frontend/angular.json` configure des **seuils**, pas des résultats mesurés :

- Bundle initial : **500 ko avertissement**, **1 Mo erreur**.
- Styles d'un composant : **4 ko avertissement**, **8 ko erreur**.

Un build annoncé vert ne constitue **pas** une mesure archivée de bundle. Pour la livraison, conserver la sortie du build, tailles, métriques DevTools/Lighthouse desktop/mobile et impacts des images, polices et bibliothèques.

## Métriques à suivre

- Backend : volumes de requêtes, codes HTTP, latences, débit, échecs de stockage, succès/erreurs du scheduler et latence SQL si instrumentée.
- Frontend : octets JS/CSS, chargement, réactivité, erreurs de console et conditions réseau/viewport.
- Joindre des logs assainis ou captures **réelles**. Aucun système de métriques structurées n'est actuellement déclaré opérationnel.

Ce document sera alimenté lors de la phase OC de tests et d'optimisation, sans fabriquer de mesures.

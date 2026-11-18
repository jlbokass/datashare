---
layout: default
title: "DataShare — Handoff UI"
permalink: /design-handoff.fr.html
lang: fr
---

# DataShare — Handoff de conception UI

[**English**](design-handoff.md) · [Documentation technique](index.fr.md)

**Source :** *DataShare UI Design Handoff*, version 1 du **17 novembre 2026**, **23 pages**, réalisé à partir des exports Figma. [Maquettes Figma originales](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6).

**PDF vectoriel complet :** [DataShare UI Design Handoff v1](design/DataShare_UI_Design_Handoff_v1.pdf), commité sur la branche TECH-04. Si Figma évolue, comparer avec la source à jour plutôt que de considérer ce PDF daté comme immuable.

## Rôle et périmètre

Le handoff est la **référence visuelle et la grille de recette UI** des prochains écrans Angular ; les **spécifications OC et US01–US06** restent la source des exigences métier. TECH-04 prépare uniquement l'environnement front/back ; **il n'implémente pas les écrans**.

- Douze exports initiaux regroupés en téléversement, connexion/inscription, espace personnel, composants et variantes de téléchargement public (PDF p. 2–3).
- Desktop **1440 × 1024**, mobile **393 × 852**. Vérifier aussi **320 / 768 / 1024 px** et la navigation mobile (PDF p. 1 et 21).
- Écrans : accueil, connexion, inscription, upload, erreur de taille supérieure à 1 Go, confirmation du lien, historique, téléchargement avec/sans mot de passe et lien expiré (PDF p. 8–19).
- Composants : champs, sélecteur, boutons, en-têtes, filtres **Tous / Actifs / Expiré**, et messages info/avertissement/erreur (PDF p. 6–7).

## Valeurs relevées dans le handoff

| Élément | Valeur | Statut de la source |
| --- | --- | --- |
| Texte | `#1E1E1E` | Token Figma explicite |
| Carte / bordure neutre | `#FFFFFF` / `#D9D9D9` | Tokens Figma explicites |
| Dégradé haut / bas | `#FFB88C` / `#DE6262` | Relevés visuels, non définis comme tokens |
| Bouton sombre / accent orange | `#2C2C2C` / `#E27F29` | Relevés visuels |
| Bordure d'accent | `#FFA569` | Relevé visuel |
| H1 / H2 | DM Sans Bold 32/40 px et 28/40 px | Styles Figma |
| Corps / input | Inter Regular 16/24 px ; DM Sans Regular 16/16 px | Styles Figma |
| Petit texte | DM Sans Regular 14/16 px | Style Figma |
| Espacements / rayon / trait | 8, 12, 16 px / 8 px / 1 px | Tokens Figma |
| Hauteur de l'en-tête | 72 px | Mesure sur les frames |

**Ne pas inventer** des codes d'état précis lorsque le PDF indique seulement des teintes approximatives (p. 4–5).

## Arbitrages avant la réalisation des écrans

| Priorité | Écart maquette / spécifications | Décision MVP au stade TECH-04 |
| --- | --- | --- |
| **P0** | Champ mot de passe à l'envoi et téléchargement protégé | **US09 facultative** : ne pas afficher un champ faussement fonctionnel ni promettre cette API avant décision et implémentation distinctes. Variante UI à arbitrer explicitement. |
| **P1** | Maquettes illustrant souvent **un seul fichier** | Préserver **plusieurs fichiers par transfert**, exigence US01 et contrat API, et adapter la liste si nécessaire. |
| **P1** | Nom et avatar fictifs (« Claire Marie ») | Afficher les **données réellement renvoyées** par l'API, jamais inventer un profil. |
| **P1** | Erreurs de téléchargement / expiration | Respecter les statuts et comportements backend en harmonisant leur présentation Figma. |
| **P2** | Libellés historiques, notamment **© 2025** | Copier les maquettes comme références ; documenter les évolutions de texte plutôt que conserver sans choix explicite. |

**Attention à la référence historique :** la page 23 du handoff mentionne « PR #32 / FRONT-FINAL » ; ce n'est **pas** l'issue GitHub actuelle #32 (TECH-04) ni un numéro de PR confirmé pour ce projet.

## Recette UI ultérieure — non exécutée

Lors des véritables développements Angular, faire les captures DevTools en 393 px et 1440 px, vérifier 320/768/1024 px, typographies, couleurs, espacements, états chargement/erreur/succès/expiration. Contrôler inscription, limite upload, multifichiers, lien public, suppression, navigation responsive et tests/build avant tout statut **conforme**.

Le procès-verbal du PDF est **vierge** ; ce n'est pas une preuve de recette déjà faite.

---
layout: default
title: "DataShare — Handoff UI"
permalink: /design-handoff.fr.html
lang: fr
---

# DataShare — Handoff de conception UI

[**English**](design-handoff.md) · [Documentation technique](index.md)

**Source :** *DataShare UI Design Handoff*, version 1 du **17 novembre 2026**, **23 pages**, réalisé à partir des exports Figma. [Maquettes Figma originales](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6).

**PDF vectoriel complet :** [DataShare UI Design Handoff v1](design/DataShare_UI_Design_Handoff_v1.pdf), versionné dans le dépôt. Si Figma évolue, comparer avec la source à jour plutôt que de considérer ce PDF daté comme immuable.

## Rôle et périmètre

Ce document constitue la référence visuelle des écrans Angular et retrace les décisions initiales. Les spécifications OC et US01–US06 définissent les exigences métier. Les écarts constatés initialement ont été traités dans [UI-01 #37](https://github.com/jlbokass/datashare/issues/37), clôturé le 23 novembre 2026 ; voir le bilan ci-dessous.

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

## Arbitrages initiaux de conception

| Priorité | Écart maquette / spécifications | Décision MVP au stade TECH-04 |
| --- | --- | --- |
| **P0** | Champ mot de passe à l'envoi et téléchargement protégé | **US09 facultative** : ne pas afficher un champ faussement fonctionnel ni promettre cette API avant décision et implémentation distinctes. Champ omis dans le MVP. |
| **P1** | Maquettes illustrant souvent **un seul fichier** | Préserver **plusieurs fichiers par transfert**, exigence US01 et contrat API, et adapter la liste si nécessaire. |
| **P1** | Nom et avatar fictifs (« Claire Marie ») | Afficher les **données réellement renvoyées** par l'API, jamais inventer un profil. |
| **P1** | Erreurs de téléchargement / expiration | Respecter les statuts et comportements backend en harmonisant leur présentation Figma. |
| **P2** | Libellés historiques, notamment **© 2025** | Copier les maquettes comme références ; documenter les évolutions de texte plutôt que conserver sans choix explicite. |

**Attention à la référence historique :** la page 23 du handoff mentionne « PR #32 / FRONT-FINAL » ; ce n'est **pas** l'issue GitHub actuelle #32 (TECH-04) ni un numéro de PR confirmé pour ce projet.

## Bilan de recette — UI-01 (#37), 23 novembre 2026

**Résultat : conformité visuelle acceptée par le développeur.** Comparaison des écrans Angular avec les maquettes Figma à **393 × 852** (mobile) et **1440 × 1024** (desktop). Les contrôles visuels complémentaires à **320, 768 et 1024 px** ont été déclarés verts. Les captures ont été partagées pendant la recette ; elles ne sont pas archivées dans le dépôt.

**Écrans revus :** accueil, connexion, inscription, sélection et erreur de téléversement (> 1 Go), confirmation du lien, espace personnel (liste, filtres, menu mobile), téléchargement public direct et lien expiré.

**Écarts fonctionnels acceptés :**

- Depuis **Mon espace**, « Envoyer des fichiers » ouvre directement `/upload` ; depuis l'accueil connecté, l'icône permet d'ouvrir ce formulaire. Avant connexion, l'icône reste décorative et le texte « Connecte-toi » est un lien.
- Un transfert peut contenir **plusieurs fichiers**, même si Figma illustre généralement un seul fichier.
- Lors de la recette MVP, le **mot de passe de partage (US09)** était volontairement omis. L'extension US09 ajoute ensuite une saisie facultative par fichier à l'envoi et une saisie au téléchargement lorsque nécessaire ; le téléchargement direct reste inchangé pour les fichiers non protégés.
- Les noms, dates et fichiers proviennent de l'API ; le bouton **« Copier le lien »** est conservé aussi sur mobile (plus explicite que « Téléverser » après succès). L'année du copyright est actualisée.

**À distinguer de la recette UI :** avec la démo de cinq minutes, la purge planifiée supprime les fichiers expirés et leurs métadonnées. L'onglet « Expiré » peut donc être vide. La décision de maintenir la purge actuelle est enregistrée dans [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57), **sans changement de la purge dans UI-01**.

**Preuves et limites :** validation visuelle déclarée réussie. Les trois workflows CI de la [PR #58](https://github.com/jlbokass/datashare/pull/58) ont réussi ; ils ne constituent pas une preuve de recette clavier. Le procès-verbal vierge du PDF source reste une référence historique, pas une preuve d'exécution.

### Recette complémentaire au clavier — 24 novembre 2026

Les six contrôles manuels suivants ont été déclarés réussis :

| Contrôle | Résultat déclaré |
| --- | --- |
| Navigation avec Tab et Maj + Tab | OK |
| Indicateur de focus visible | OK |
| Inscription et connexion | OK |
| Sélection et téléversement de fichiers | OK |
| Téléchargement et suppression | OK |
| Ouverture et fermeture du menu mobile | OK |

Cette recette fonctionnelle ciblée atteste la prise en compte de la navigation au clavier selon les contrôles réalisés. Elle ne constitue pas un audit exhaustif de conformité RGAA ou WCAG.

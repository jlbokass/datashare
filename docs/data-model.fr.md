# DataShare — Modèle conceptuel de données (MCD)

**Statut :** brouillon v0.1 pour [DESIGN-02](https://github.com/jlbokass/datashare/issues/2). **Aucune table ni aucun code applicatif ne sont implémentés dans cette issue.**

**Source des exigences :** OpenClassrooms, *DataShare – Spécifications fonctionnelles* (pages 2 à 5), **US01 à US06** obligatoires. La mission demande un MCD ; le modèle de documentation technique accepte les représentations Merise ou UML.

- [English version](data-model.md)
- [MCD draw.io éditable](diagrams/data-model.drawio)
- [Aperçu SVG](diagrams/data-model.svg)

## 1. Schéma conceptuel

![MCD DataShare — utilisateur, transfert et fichier](diagrams/data-model.svg)

Le diagramme représente des **entités et associations de type Merise**. Il ne constitue **pas** un schéma physique PostgreSQL : aucune clé étrangère, aucun type SQL, aucune migration et aucune classe Laravel ne sont modélisés.

## 2. Entités proposées

| Entité | Attributs conceptuels | Justification |
| --- | --- | --- |
| **UTILISATEUR** | Identifiant utilisateur, email unique, mot de passe haché, date d'inscription | US03 création de compte, US04 connexion et propriété des fichiers |
| **TRANSFERT** | Identifiant transfert, jeton de partage unique et non prédictible, date de création, date d'expiration | Partage de plusieurs fichiers au moyen d'un lien et d'une durée commune |
| **FICHIER** | Identifiant fichier, nom original, type MIME, taille en octets, date d'envoi | US01 téléversement ; US02 métadonnées ; US05 historique ; US06 suppression individuelle |

La *clé technique de stockage* est volontairement **absente du MCD**. Elle sera définie au moment de convertir ce modèle en tables PostgreSQL et en stockage privé.

Nous ne créons pas d'entité **LIEN_DE_PARTAGE** supplémentaire : le token et l'expiration sont des attributs de TRANSFERT dans cette proposition. Les destinataires des liens ne sont pas obligés de posséder un compte.

## 3. Associations et cardinalités

| Association | Entité A | Cardinalité A | Entité B | Cardinalité B |
| --- | --- | --- | --- | --- |
| **CRÉER** | UTILISATEUR | **0,N** | TRANSFERT | **1,1** |
| **CONTENIR** | TRANSFERT | **1,N** | FICHIER | **1,1** |

**Interprétation :**
- Un utilisateur peut n'avoir créé **aucun transfert**, ou en avoir créé plusieurs ; chaque transfert du MVP appartient **à un seul utilisateur**.
- Un transfert contient **au moins un fichier** et éventuellement plusieurs ; chaque fichier appartient **à un seul transfert**.
- Le propriétaire d'un fichier est déterminé **par l'intermédiaire du transfert**. Les autorisations devront vérifier ce lien ; l'absence d'association directe FICHIER → UTILISATEUR ne donne aucun droit de gestion au public.

Le regroupement dans une entité TRANSFERT est **un choix à valider**, non une structure imposée par OC. L'objectif du sujet évoque un ou plusieurs fichiers, tandis que les US01/US02 décrivent les opérations sur un fichier. Un token commun est compatible avec ces besoins si les actions individuelles sont conservées.

## 4. Règles de gestion tirées des US officielles

| Règle | Conséquence sur le modèle |
| --- | --- |
| **R1 — Inscription** | L'email est unique ; le mot de passe est conservé sous la forme d'un hash salé et non réversible (US03). |
| **R2 — Partage** | Chaque TRANSFERT possède un token unique non prédictible ; le destinataire n'a pas besoin de compte pour télécharger (US01, US02). |
| **R3 — Expiration** | TRANSFERT possède une date d'expiration : **7 jours par défaut**, réglable à l'envoi avec un maximum de **7 jours** (US01). Les fichiers du transfert partagent cette échéance. |
| **R4 — Métadonnées** | L'écran public présente nom, type, taille et date d'expiration (US02). L'historique présente nom, taille, date d'envoi, expiration et état du lien valide/expiré (US05). |
| **R5 — Propriété** | Chaque utilisateur consulte et gère uniquement ses propres fichiers, en passant par la propriété du TRANSFERT (US05, US06). |
| **R6 — Suppression individuelle** | La suppression d'un FICHIER retire **ses propres octets et ses métadonnées**, sans supprimer les autres fichiers du même TRANSFERT. Confirmation côté Angular, autorisation et suppression côté Laravel (US06). |
| **R7 — Dernier fichier** | **Choix proposé :** lorsque le dernier fichier disparaît, supprimer également le TRANSFERT devenu vide et invalider son lien. La cardinalité **1,N** reste ainsi respectée. |
| **R8 — Expiration effective** | Un fichier expiré ne doit pas être téléchargé ; ses octets et métadonnées doivent être supprimés automatiquement (US01). Par défaut, l'historique affiche uniquement les fichiers non expirés selon US06. |
| **R9 — État calculé** | L'état valide/expiré peut être déduit de la date d'expiration ; un attribut d'état stocké n'est pas nécessaire dans le MCD. |

**Précision :** la purge *quotidienne par tâche planifiée* est détaillée dans US10 (optionnelle), mais **US01 impose déjà la suppression automatique à expiration**. La méthode d'ordonnancement relève de l'architecture et de l'implémentation, pas du MCD.

## 5. Hors périmètre MVP

Ce MCD n'intègre pas :
- US07, téléversement anonyme (qui modifierait la cardinalité du propriétaire).
- US08, tags et associations de tags.
- US09, protection par mot de passe (le champ figurant dans Figma ne rend pas cette US obligatoire).
- Les fonctionnalités complémentaires d'US10, au-delà de l'expiration déjà exigée dans US01.

Nous n'ajoutons pas non plus la persistance des JWT, les journaux détaillés de téléchargement, les rôles administrateurs ou la récupération de mot de passe.

## 6. Points à valider avant approbation

- [ ] Valider le **token unique par transfert**, même lorsqu'il contient plusieurs fichiers ; sinon, adapter le modèle pour un lien par fichier.
- [ ] Vérifier qu'un **fichier est supprimable indépendamment**, sans affecter les autres fichiers partagés.
- [ ] Valider la suppression du transfert lorsqu'il ne contient plus de fichier.
- [ ] Confirmer une date d'expiration commune à tous les fichiers du transfert.
- [ ] Vérifier la cohérence du diagramme avec les documents FR/EN.
- [ ] Recouper le MCD avec DESIGN-01 (architecture) et DESIGN-03 (OpenAPI) avant acceptation définitive.

**Après validation :** nous déduirons le schéma logique/physique PostgreSQL et les modèles Laravel lors de l'initialisation technique. Cela restera distinct du MCD livré ici.

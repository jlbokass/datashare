---
layout: default
title: "Modèle conceptuel UML"
permalink: /data-model.fr.html
lang: fr
---

# DataShare — Modèle conceptuel de données (UML)

**Statut :** modèle conceptuel validé dans [DESIGN-02](https://github.com/jlbokass/datashare/issues/2). Les trois classes obligatoires sont mises en œuvre ; le diagramme ne décrit pas le schéma physique ni des extensions déjà développées.

**Source :** OpenClassrooms, *DataShare – Spécifications fonctionnelles*, US01 à US10. Les **US01 à US06** constituent le MVP obligatoire ; US07 à US10 sont optionnelles. Le modèle de documentation fourni autorise UML ou Merise.

- [English version](data-model.md)
- [Diagramme draw.io unique et modifiable — MVP et extensions](diagrams/data-model.drawio)
- [Aperçu SVG du même diagramme](diagrams/data-model.svg)

## 1. Diagramme UML unique

![DataShare — classes UML du MVP et extensions optionnelles](diagrams/data-model.svg)

**Convention visuelle :** les classes pleines bleues/vertes/dorées représentent le **MVP obligatoire**. Les classes et associations bordeaux en pointillés représentent les **extensions facultatives**. Tout est présenté dans **un seul diagramme et un seul onglet draw.io**.

### Classes métier obligatoires

| Classe | Attributs conceptuels | Origine |
| --- | --- | --- |
| **UTILISATEUR** | `idUtilisateur`, `email` unique, `motDePasseHash`, `dateCreation` | US03, US04 |
| **TRANSFERT** | `idTransfert`, `tokenPartage` unique et non prédictible, `dateCreation`, `dateExpiration`, `/statut` calculé | US01, US02, US05 |
| **FICHIER** | `idFichier`, `nomOriginal`, `tailleOctets`, `typeMime`, `dateEnvoi` | US01, US02, US05, US06 |

`nom` / `prenom` (UTILISATEUR) et `titre` / `message` (TRANSFERT) sont des **choix facultatifs de conception**, non exigés par les US du MVP. PROFILE-01 met en œuvre les deux premiers via `users.name` (colonne nullable préexistante, valeurs conservées) et `users.first_name` (nouvelle colonne nullable). Le préfixe UML `/statut` désigne un **attribut dérivé**, calculé à partir de l'expiration, pas un statut à enregistrer obligatoirement.

### Associations et multiplicités UML

| Association | Multiplicité près de la première classe | Multiplicité près de la deuxième classe | Signification |
| --- | --- | --- | --- |
| UTILISATEUR — crée — TRANSFERT | UTILISATEUR **1** | TRANSFERT **0..*** | Un transfert appartient à un utilisateur ; un utilisateur peut n'avoir aucun transfert ou en créer plusieurs. |
| TRANSFERT — contient — FICHIER | TRANSFERT **1** | FICHIER **1..*** | Chaque fichier appartient à un transfert ; un transfert contient un ou plusieurs fichiers. Composition avec losange plein côté TRANSFERT. |
| **Optionnelle** TRANSFERT — concerne/trace — TÉLÉCHARGEMENT | TRANSFERT **0..1** | TÉLÉCHARGEMENT **0..*** | Un événement concerne un transfert à sa création. **Après suppression du transfert**, il peut n'être lié à **aucun** transfert encore présent ; un transfert possède zéro à plusieurs événements. |
| **Optionnelle** FICHIER — étiqueter — TAG | FICHIER **1** | TAG **0..*** | Un fichier peut recevoir plusieurs tags ; une occurrence de tag est associée à un fichier. Pas de doublon de libellé sur ce fichier (US08). |

**Rappel UML :** la multiplicité placée près d'une classe indique combien de ses instances peuvent être liées à une instance de l'autre classe. Pour la relation historique, le **0..1 est donc près de TRANSFERT** et le **0..* près de TÉLÉCHARGEMENT**.

## 2. Règles métier obligatoires (US01 à US06)

- **Téléversement :** utilisateur connecté, stockage privé, token unique non prédictible. Taille maximale **1 Go** ; politique des formats définie en sécurité (US01).
- **Regroupement :** un TRANSFERT contient plusieurs FICHIERS avec **un seul lien de partage et une expiration commune**. C'est un **choix retenu**, pas une structure de base imposée par OC.
- **Expiration :** **7 jours par défaut**, personnalisable de **1 à 7 jours**. Les fichiers expirés et leurs métadonnées sont automatiquement supprimés (US01). US10 précise les modalités de la planification quotidienne.
- **Téléchargement :** un lien valide donne accès aux métadonnées nom, type, taille et expiration avant récupération ; les liens invalides/expirés produisent une erreur claire (US02).
- **Comptes :** email unique, mots de passe hachés et salés, connexion par JWT (US03, US04).
- **Historique :** l'utilisateur consulte uniquement ses fichiers et leurs métadonnées ainsi que l'état du lien (US05).
- **Suppression :** le propriétaire supprime **un fichier individuel** après confirmation dans le frontend. Ses octets et métadonnées sont supprimés ; les autres fichiers du transfert restent disponibles (US06).
- **Transfert vide :** **règle implémentée :** si le dernier fichier disparaît, le TRANSFERT devenu vide est également supprimé et son token invalidé, ce qui respecte la multiplicité `1..*`.

## 3. Extensions optionnelles intégrées au même MCD

| Option | Impact conceptuel | Obligatoire pour le MVP ? |
| --- | --- | --- |
| **US07 — Upload anonyme** | Si implémenté, un transfert peut ne pas avoir de propriétaire enregistré ; la multiplicité près d'UTILISATEUR passe de **1** à **0..1** pour les transferts anonymes. | Non |
| **US08 — Tags** | Classe TAG facultative, libellé de 30 caractères maximum et unicité du libellé par fichier. | Non |
| **US09 — Mot de passe** | Hash facultatif pour un **FICHIER**. Le mettre uniquement sur TRANSFERT protégerait tout le lot, ce qui constitue une autre décision produit. | Non |
| **US10 — Expiration automatique** | Précise la planification de purge ; l'expiration et la suppression automatique sont déjà obligatoires dans US01. | Non en tant que fonctionnalité distincte |
| **Statistiques de téléchargement (proposition)** | Classe TÉLÉCHARGEMENT facultative, pour compter les téléchargements et les octets transférés. Aucune US obligatoire ne l'impose. | Non |

Un événement représente un **téléchargement réellement effectué**, et non la simple ouverture d'une page de partage. `totalOctetsTelecharges` et `nbFichiers` mesurent ce qui a **réellement été transféré durant cet événement**, pas la taille initiale de tout le partage.

## 4. Statistiques facultatives après suppression — proposition historique

**Proposition non implémentée :** conserver des statistiques anonymes d'activité et de volumétrie, tout en supprimant les transferts expirés, leurs fichiers et leurs métadonnées opérationnelles.

1. **Avant suppression :** chaque TÉLÉCHARGEMENT est associé à **un TRANSFERT existant**. Une éventuelle implémentation devrait contrôler cette règle à la création.
2. **Après suppression :** l'événement subsiste, mais l'association au TRANSFERT supprimé disparaît. La multiplicité UML historique est donc **0..1**.
3. **Mesures conservées :** total d'octets téléchargés, nombre de fichiers effectivement téléchargés et période adaptée aux statistiques (jour/mois), à condition que ces données ne permettent pas d'identifier une personne.
4. **Données personnelles :** ne pas conserver dans l'historique statistique après purge les identifiants utilisateur, noms de fichiers, tokens de partage, IP brutes ou hachées, ni user-agents. Supprimer aussi les attributs indirectement identifiants ; regrouper ou réduire la précision des dates si nécessaire. **Hacher une IP relève généralement de la pseudonymisation, pas automatiquement de l'anonymisation.**
5. **Durée :** avant tout développement, définir la finalité et la durée de conservation. Si l'anonymisation véritable ne peut pas être démontrée, les données restent soumises au RGPD et doivent être conservées pour une durée limitée.

Une clé étrangère mise à `NULL` garantit **l'intégrité référentielle**, pas la conformité RGPD. Même une ligne contenant seulement une date précise et un volume d'octets peut parfois être rattachée indirectement à quelqu'un ; des **agrégats quotidiens ou mensuels** seront préférables pour des statistiques de longue durée.

Références : [CNIL — Identifier les données personnelles](https://www.cnil.fr/fr/identifier-les-donnees-personnelles) et [CNIL — Les durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).

### Traduction PostgreSQL ultérieure (exemple uniquement)

Le MCD ne contient **aucune clé étrangère SQL**. Lors d'une éventuelle implémentation du suivi, une colonne nullable et `ON DELETE SET NULL` pourront préserver les événements après disparition du TRANSFERT :

```sql
-- Futur modèle physique uniquement : ne pas exécuter pendant DESIGN-02.
ALTER TABLE telechargements
    ALTER COLUMN transfert_id DROP NOT NULL;

ALTER TABLE telechargements
    DROP CONSTRAINT IF EXISTS telechargements_transfert_id_fkey;

ALTER TABLE telechargements
    ADD CONSTRAINT telechargements_transfert_id_fkey
    FOREIGN KEY (transfert_id) REFERENCES transferts(id)
    ON DELETE SET NULL;
```

Les noms des tables et colonnes ci-dessus sont illustratifs. **Ces instructions SQL n'anonymisent pas, à elles seules, le contenu des lignes conservées.**

## 5. Modèle physique et arbitrage sur la purge

Le stockage privé, les clés, les index, les migrations et les classes ORM relèvent du modèle physique (voir `backend/database/migrations/`). Le statut est dérivé de l'expiration. L'extension US08 utilise une table `tags` liée à `transfer_files` par une clé étrangère avec suppression en cascade, et une contrainte unique (`transfer_file_id`, `name`). US09 ajoute une colonne nullable `transfer_files.password_hash` (hash irréversible, jamais exposé) ; `null` conserve le téléchargement direct. Les statistiques de téléchargement ne font pas partie de l'implémentation.

[HIST-01 #57](https://github.com/jlbokass/datashare/issues/57) confirme la conservation de la purge existante : fichiers et métadonnées sont supprimés à expiration par la tâche planifiée. L'historique peut uniquement inclure les enregistrements expirés non encore purgés. Les statistiques facultatives ci-dessus restent une hypothèse de conception, pas une politique de conservation en vigueur.

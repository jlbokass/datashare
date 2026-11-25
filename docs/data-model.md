---
layout: default
title: "Conceptual UML data model"
permalink: /data-model.html
lang: en
---

# DataShare — Conceptual data model (UML)

**Status:** conceptual model reviewed in [DESIGN-02](https://github.com/jlbokass/datashare/issues/2). The three mandatory classes are implemented; the diagram is not the physical schema and does not imply that extensions are implemented.

**Source:** OpenClassrooms *DataShare – Spécifications fonctionnelles*, US01–US10. The mandatory MVP is **US01–US06**; US07–US10 are optional. The supplied documentation template accepts UML or Merise for the data model.

- [Version française](data-model.fr.md)
- [One editable draw.io diagram — MVP and optional extensions](diagrams/data-model.drawio)
- [SVG preview of that same diagram](diagrams/data-model.svg)

## 1. Single UML diagram

![DataShare — conceptual UML classes, required MVP and optional extensions](diagrams/data-model.svg)

**Visual convention:** solid blue/green/gold classes belong to the **mandatory MVP**. Dashed burgundy classes and associations are **optional**. This is **one diagram**: the optional elements appear on the same draw.io page, not in another source file or tab.

### Mandatory domain classes

| Class | Conceptual attributes | Origin |
| --- | --- | --- |
| **UTILISATEUR / USER** | `idUtilisateur`, unique `email`, `motDePasseHash`, `dateCreation` | US03, US04 |
| **TRANSFERT / TRANSFER** | `idTransfert`, unique unpredictable `tokenPartage`, `dateCreation`, `dateExpiration`, derived `/statut` | US01, US02, US05 |
| **FICHIER / FILE** | `idFichier`, `nomOriginal`, `tailleOctets`, `typeMime`, `dateEnvoi` | US01, US02, US05, US06 |

`nom` / `prenom` (USER) and `titre` / `message` (TRANSFER) are marked **optional design choices**; the official MVP stories do not require them. The `/statut` leading slash is UML notation for a **derived attribute** (calculated from expiry), not a column to persist.

### Associations and UML multiplicities

| Association | UML multiplicity near first class | UML multiplicity near second class | Business meaning |
| --- | --- | --- | --- |
| USER — creates — TRANSFER | USER **1** | TRANSFER **0..*** | Every MVP transfer has one registered owner; a user may create none or many. |
| TRANSFER — contains — FILE | TRANSFER **1** | FILE **1..*** | Every file belongs to one transfer; a transfer contains one or more files. Composition is represented by a filled diamond at TRANSFER. |
| **Optional** TRANSFER — concerns/traces — DOWNLOAD EVENT | TRANSFER **0..1** | DOWNLOAD EVENT **0..*** | At recording time, each event concerns one transfer. **After transfer deletion**, the event may refer to **zero** surviving transfers; a transfer can have zero or many events. |
| **Optional** FILE — tags — TAG | FILE **1** | TAG **0..*** | A file may have any number of tags; each tag entry is scoped to one file. No duplicate label per file (US08). |

**Read UML end labels carefully:** the number near a class counts how many instances of *that class* may be linked to one instance of the class at the other end. Thus, nullable historical ownership is **0..1 near TRANSFER**, not `0..1` near DOWNLOAD EVENT.

## 2. Mandatory business rules (US01–US06)

- **Upload:** authenticated users upload files to private storage; a unique, unpredictable share token is issued. Maximum **1 GB**; permissible file types are governed by the security policy (US01).
- **Grouping:** a TRANSFER may contain multiple FILEs behind **one shared token and expiry**. This is a **implemented model choice**, not an OpenClassrooms-prescribed database structure.
- **Expiry:** default **7 days**, configurable from **1 to 7 days**. Expired files and their metadata must be automatically deleted (US01). Optional US10 gives additional detail about daily scheduling.
- **Download:** a valid token enables public retrieval; show filename, MIME type, size and expiry date before download; invalid/expired links fail clearly (US02).
- **Accounts:** email is unique; account passwords are hashed and salted; login uses JWT (US03, US04).
- **History:** only the owner can view their uploaded files, including file details and link validity (US05).
- **Deletion:** only an owner can delete an **individual FILE**, with frontend confirmation. The file bytes and metadata are removed; other files in the transfer remain available (US06).
- **Empty transfer:** **implemented invariant:** when the final FILE is deleted, remove the now-empty TRANSFER and invalidate its share token, preserving the `1..*` FILE composition.

## 3. Optional extensions inside the same model

| Option | Conceptual impact | Included in mandatory MVP? |
| --- | --- | --- |
| **US07 — anonymous upload** | If implemented, a transfer may have no registered owner; the USER-end multiplicity would change from **1** to **0..1** for anonymous transfers. | No |
| **US08 — tags** | Optional TAG class, label (maximum 30 characters) and per-file uniqueness. | No |
| **US09 — file password** | Optional, securely hashed password for a **FILE**. Putting it only on TRANSFER would instead protect the entire batch, a distinct product decision. | No |
| **US10 — automatic expiry** | Adds scheduling requirements; the basic expiry and automatic deletion already belong to mandatory US01. | No as a separate feature |
| **Download analytics (proposal)** | Optional DOWNLOAD EVENT class; useful for download counts and transferred-byte totals. Not required by any of the official MVP US. | No |

A download event records a **successful actual download**, not a visit to the share page. `totalOctetsTelecharges` and `nbFichiers` describe **what was actually transferred in the event**, not the full size or file count of the original share.

## 4. Optional download statistics after deletion — historical proposal

**Unimplemented proposal:** retain useful anonymous download-volume/activity statistics while deleting expired transfers, files, and their associated operational metadata.

1. **Before deletion:** a DOWNLOAD EVENT is attached to **exactly one** existing TRANSFER. A future implementation would enforce this at creation.
2. **When the transfer is deleted:** the event survives, but its relationship to the deleted TRANSFER is removed. The UML historical multiplicity is therefore **0..1**.
3. **Analytic measurements retained:** downloaded-byte total and actual number of files downloaded, plus a time bucket suitable for reporting (e.g. day/month), provided the retained dataset is truly anonymous.
4. **Personal data:** do not retain user IDs, file names, share tokens, raw IP addresses, IP hashes or user-agent strings in the post-purge analytics dataset. Remove other indirectly identifying details; coarsen or aggregate event timing if necessary. A mere hash is **pseudonymisation**, not automatically anonymisation.
5. **Retention:** define the lawful purpose and retention policy before implementing tracking. If true anonymisation cannot be demonstrated, apply the GDPR to the remaining data and delete it within a defined period.

A null foreign key is only **referential integrity**, not proof of GDPR compliance. A highly detailed per-event combination of timestamp and byte counts may still be identifying in context; **daily/monthly aggregation is preferable** if long-term statistics are the objective.

Official background: [CNIL — Identifying personal data](https://www.cnil.fr/fr/identifier-les-donnees-personnelles) and [CNIL — Data retention periods](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).

### Future physical PostgreSQL translation (illustrative only)

The MCD has **no foreign keys or SQL-specific constraints**. If optional tracking is implemented later, a nullable column and `ON DELETE SET NULL` can preserve download events when their TRANSFER disappears:

```sql
-- Future schema only; do not execute during DESIGN-02.
ALTER TABLE telechargements
    ALTER COLUMN transfert_id DROP NOT NULL;

ALTER TABLE telechargements
    DROP CONSTRAINT IF EXISTS telechargements_transfert_id_fkey;

ALTER TABLE telechargements
    ADD CONSTRAINT telechargements_transfert_id_fkey
    FOREIGN KEY (transfert_id) REFERENCES transferts(id)
    ON DELETE SET NULL;
```

The table and column names above are illustrative. This SQL does **not** itself anonymise the remaining rows.

## 5. Physical model and purge decision

Private storage, keys, indexes, migrations and ORM classes belong to the physical model (see `backend/database/migrations/`). Status is derived from expiry. US08 adds a `tags` table linked to `transfer_files` by a cascading foreign key and a unique constraint on (`transfer_file_id`, `name`). Download statistics and password-protected shares are not implemented.

[HIST-01 #57](https://github.com/jlbokass/datashare/issues/57) confirms the existing purge: files and metadata are removed at expiry by the scheduled task. History can only include expired records that have not yet been purged. The optional statistics above remain a design hypothesis, not an active retention policy.

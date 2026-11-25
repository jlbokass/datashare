---
layout: default
title: "Conceptual UML data model"
permalink: /data-model.html
lang: en
---

# DataShare — Conceptual data model (UML)

**Status:** UML model based on DESIGN-02, updated for the 25 November 2026 release ([PR #100](https://github.com/jlbokass/datashare/pull/100)). Mandatory classes and US08 tags are implemented; PROFILE-01 and US09 extend the attributes. Unimplemented proposals are marked historical, distinct from the physical schema.

**Source:** OpenClassrooms *DataShare – Spécifications fonctionnelles*, US01–US10. The mandatory MVP is **US01–US06**; US07–US10 are optional. The supplied documentation template accepts UML or Merise for the data model.

- [Version française](data-model.fr.md)
- [One editable draw.io diagram — MVP and optional extensions](diagrams/data-model.drawio)
- [SVG preview of that same diagram](diagrams/data-model.svg)

## 1. Single UML diagram

![DataShare — conceptual UML classes, required MVP and optional extensions](diagrams/data-model.svg)

**Visual convention:** solid blue/green/gold classes represent the mandatory MVP; dashed burgundy classes and associations represent optional extensions with explicit status (US08 delivered; download events not implemented). One diagram and one draw.io page.

### Mandatory domain classes

| Class | Conceptual attributes | Origin |
| --- | --- | --- |
| **UTILISATEUR / USER** | `idUtilisateur` (internal BIGINT key), `public_id` (public UUID), unique `email`, `motDePasseHash`, `dateCreation` | US03, US04 |
| **TRANSFERT / TRANSFER** | `idTransfert`, unique unpredictable `tokenPartage`, `dateCreation`, `dateExpiration`, derived `/statut` | US01, US02, US05 |
| **FICHIER / FILE** | `idFichier`, `nomOriginal`, `tailleOctets`, `typeMime`, `dateEnvoi`, `storage_path` | US01, US02, US05, US06 |

PROFILE-01 implements `nom` / `prenom` as `users.name` (existing nullable column) and `users.first_name` (added nullable column). `titre` and `message` remain unimplemented proposals. UML `/statut` is a derived expiry attribute, not persisted. The API exposes `users.public_id` (UUID), not the internal `users.id` (BIGINT). The keys of `transfers` and `transfer_files` are UUIDs; `tags.id` is an internal BIGINT.

### Associations and UML multiplicities

| Association | UML multiplicity near first class | UML multiplicity near second class | Business meaning |
| --- | --- | --- | --- |
| USER — creates — TRANSFER | USER **1** | TRANSFER **0..*** | Every MVP transfer has one registered owner; a user may create none or many. |
| TRANSFER — contains — FILE | TRANSFER **1** | FILE **1..*** | Every file belongs to one transfer; a transfer contains one or more files. Composition is represented by a filled diamond at TRANSFER. |
| **Historical — not implemented** TRANSFER — concerns/traces — DOWNLOAD EVENT | TRANSFER **0..1** | DOWNLOAD EVENT **0..*** | At recording time, each event concerns one transfer. **After transfer deletion**, the event may refer to **zero** surviving transfers; a transfer can have zero or many events. |
| **Optional — delivered** FILE — tags — TAG | FILE **1** | TAG **0..*** | A file may have any number of tags; each tag entry is scoped to one file. No duplicate label per file (US08). |

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

| Option | Conceptual impact | Delivery status |
| --- | --- | --- |
| **US07 — anonymous upload** | If implemented, a transfer may have no registered owner; the USER-end multiplicity would change from **1** to **0..1** for anonymous transfers. | Not implemented |
| **US08 — tags** | Optional TAG class, label (maximum 30 characters) and per-file uniqueness. | Delivered |
| **US09 — file password** | Optional, securely hashed password for a **FILE**. Putting it only on TRANSFER would instead protect the entire batch, a distinct product decision. | Delivered |
| **US10 — automatic expiry** | Adds scheduling requirements; the basic expiry and automatic deletion already belong to mandatory US01. | Cleanup implemented under US01; no separate work package |
| **Download analytics (proposal)** | Optional DOWNLOAD EVENT class; useful for download counts and transferred-byte totals. Not required by any of the official MVP US. | Not implemented |

## 4. Download analytics — unimplemented proposal

In the historical model, an event would have belonged to a transfer when created and survived its deletion through a nullable FK (`ON DELETE SET NULL`). Referential integrity would not guarantee anonymization; any future implementation would need aggregates and a retention policy. No analytics table exists in the release.

## 5. Physical model and purge decision

Private storage, keys, indexes, migrations and ORM classes belong to the physical model (see `backend/database/migrations/`). Status is derived from expiry. US08 adds a `tags` table linked to `transfer_files` by a cascading foreign key and a unique constraint on (`transfer_file_id`, `name`). US09 adds nullable `transfer_files.password_hash` (one-way hash, never exposed); `null` preserves direct downloads. Download statistics are not implemented.

[HIST-01 #57](https://github.com/jlbokass/datashare/issues/57) confirms the existing purge: files and metadata are removed at expiry by the scheduled task. History can only include expired records that have not yet been purged. The optional statistics above remain a design hypothesis, not an active retention policy.

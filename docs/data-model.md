# DataShare — Conceptual data model (MCD)

**Status:** Draft v0.1 for [DESIGN-02](https://github.com/jlbokass/datashare/issues/2). **No database schema or application code has been implemented in this issue.**

**Source of requirements:** OpenClassrooms, *DataShare – Spécifications fonctionnelles* (pp. 2–5), mandatory **US01–US06**. The mission calls for a conceptual data model (MCD); the official documentation template permits Merise or UML.

- [Version française](data-model.fr.md)
- [Editable draw.io MCD](diagrams/data-model.drawio)
- [SVG preview](diagrams/data-model.svg)

## 1. Conceptual diagram

![DataShare MCD — users, transfers and files](diagrams/data-model.svg)

This diagram uses **Merise-style** entities and associations. It is a **conceptual business model**, not a PostgreSQL physical schema: there are no foreign keys, SQL column types, migrations or Laravel-specific classes here.

## 2. Proposed entities

| Conceptual entity (FR / EN) | Conceptual attributes | Reason |
| --- | --- | --- |
| **UTILISATEUR / USER** | User identifier, unique email, password hash, registration date | US03 registration, US04 login, authenticated ownership |
| **TRANSFERT / TRANSFER** | Transfer identifier, unique unpredictable share token, creation date, expiry date | Links multiple files to one share-link and one expiry choice |
| **FICHIER / FILE** | File identifier, original filename, MIME type, size in bytes, upload date | US01 upload; US02 file metadata; US05 history; US06 individual deletion |

The *storage path/object key* is intentionally **not** an MCD attribute. That technical implementation detail will be addressed when translating this model into PostgreSQL tables and a private filesystem.

A separate **SHARE_LINK** entity is not necessary for this proposal: the unique token and expiry belong to TRANSFERT. A recipient with the token is not required to register, so recipients are not modeled as registered users.

## 3. Associations and cardinalities

| Association | Entity A | Cardinality A | Entity B | Cardinality B |
| --- | --- | --- | --- | --- |
| **CRÉER / CREATES** | UTILISATEUR | **0,N** | TRANSFERT | **1,1** |
| **CONTENIR / CONTAINS** | TRANSFERT | **1,N** | FICHIER | **1,1** |

**Interpretation:**
- A registered user may have no transfers or many; every MVP transfer has **exactly one owner**.
- Every transfer must contain **at least one file**, potentially several; every file belongs to exactly one transfer.
- A file's owner is determined **through its transfer**. Authorization must enforce that ownership; the absence of a direct conceptual FILE → USER association does not grant public management access.

This grouping is a **design proposal**, not an explicit mandated data structure. The OpenClassrooms objective supports transferring one or more files; US01/US02 describe individual file interactions. A share token for a batch of files can satisfy both, provided the individual file operations remain available.

## 4. Business rules inferred from the official US

| Rule | Requirement and modeling consequence |
| --- | --- |
| **R1 — Registration** | Email is unique; passwords are stored as salted, one-way hashes (US03). |
| **R2 — Sharing** | Each TRANSFERT has one unpredictable, unique token; public download needs the token but no account (US01, US02). |
| **R3 — Expiration** | Each TRANSFERT has an expiration date, defaulting to **seven days** after upload and configurable with a maximum of **seven days** (US01). All its files inherit that expiry. |
| **R4 — Metadata** | The public share view exposes each file's name, type, size and expiry date (US02). History shows filename, size, upload date, expiry date and valid/expired link status (US05). |
| **R5 — Ownership** | Users can view/manage only their own uploaded files, by following TRANSFERT ownership (US05, US06). |
| **R6 — Individual deletion** | Deleting a FICHIER removes **only that file's bytes and metadata**, never siblings in the same TRANSFERT. Confirmation is required in Angular; authorization and deletion are enforced by Laravel (US06). |
| **R7 — Last file deleted** | **Proposed invariant:** if the last file is deleted, also remove the empty TRANSFERT and invalidate its link. This keeps the **1,N** cardinality truthful. |
| **R8 — Expired content** | Expired files cannot be downloaded; file bytes and associated metadata must be automatically deleted (US01). History shows only non-expired files by default per US06. |
| **R9 — Derived status** | The valid/expired link status can be calculated from the expiry date; it need not be an extra stored conceptual attribute. |

**Timing clarification:** A scheduled *daily* cleanup is described in optional US10, but **automatic deletion at expiry already is a mandatory US01 requirement**. How to implement scheduling belongs to the architecture/implementation work, not the MCD.

## 5. Out of MVP scope

The MCD does **not** add:
- US07 anonymous transfers (which would change owner cardinality).
- US08 tags or tag associations.
- US09 file-password protection (a field in Figma does not by itself make US09 a mandatory MVP story).
- Additional US10 user-facing functionality beyond the expiry requirement already present in US01.

JWT session/token persistence, download logs, admin roles and password-recovery flows are likewise not part of the mandatory conceptual model.

## 6. Decisions to review before approval

- [ ] Validate **a single share token per transfer** when several files are uploaded together; if the intent is one link per file, revise the model.
- [ ] Validate that **each file can be removed independently**, keeping other shared files available.
- [ ] Confirm that deleting the final file also deletes the empty transfer.
- [ ] Confirm that the expiry date is shared by the files within one transfer.
- [ ] Verify the FR/EN diagrams and explanatory text are consistent.
- [ ] Reconcile naming and operations with DESIGN-01 (architecture) and DESIGN-03 (OpenAPI) before final acceptance.

**Next step after approval:** derive the PostgreSQL logical/physical schema and Laravel models during technical initialization; do not confuse that later schema with the conceptual MCD delivered here.

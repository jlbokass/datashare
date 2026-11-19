# US06 — Individual file deletion

[Français](us06-file-deletion.fr.md) · [Issue #9](https://github.com/jlbokass/datashare/issues/9)

Implemented on `feat/us06-file-deletion` in [PR #46](https://github.com/jlbokass/datashare/pull/46). The developer reports **T01–T05 passed** in the local environment and **`bash scripts/qa.sh all` green** outside Codex sandbox. PR CI checks are recorded separately once confirmed. US06 implements **individual file deletion**, not bulk deletion. UI-01/Figma remains a separate TODO.

## HTTP contract and ownership

`DELETE /api/transfers/{transferId}/files/{fileId}` follows [OpenAPI](api/openapi.yaml).
The existing JWT middleware resolves the owner. The service queries the transfer
by both its ID and that owner, then looks up the file through the transfer relation.
Malformed UUIDs, unknown transfers/files, another owner's records and mismatched
files all return the same `404` / `not_found`, without private paths or existence
information. A missing/invalid JWT returns `401` / `unauthenticated`.

On success, return `204` with no body. Remove the private bytes and all file metadata.
Other files and the transfer's current share token are preserved. Removing the last
file also removes the transfer, so its former public share URL returns `404`.
An expired but unpurged file can still be deleted by its owner; history continues
to hide expired transfers by default. Repeating a completed DELETE returns `404`.

## Storage failure and concurrency decisions

`TransferDeletion` is used by both the controller and the existing expiration
command. Both operations start a DB transaction, acquire `FOR UPDATE` on the
parent transfer, then read the current files. Concurrent manual deletes and purge
operations on the same transfer therefore serialize on PostgreSQL. Purge re-fetches
its candidate and rechecks expiry under the lock; candidates already removed or no
longer expired are skipped. The command catches failures per transfer, continues
with others and exits nonzero if any failed.

- Already-absent bytes: remove the stale metadata and return `204`.
- Storage refusal, exception or bytes remaining after a reported deletion: return
  a generic `500` / `server_error`, retaining DB metadata for retry.
- Bytes are removed before metadata. **Filesystem and database are not one atomic
  transaction.** If a DB write fails afterwards, the DB transaction rolls back but
  the bytes cannot be restored. Return `500`; a retry reconciles missing bytes.
- A partial purge failure also retains the transfer's metadata. Previously deleted
  bytes stay absent and the next purge safely retries the remaining content.
- Only recorded file paths are deleted; no recursive directory removal. Empty
  private directories may remain. No schema change or dependency was added.
- A download that already opened the file may finish; deletion cannot retract bytes
  already delivered. New accesses after deletion cannot resolve that file.

## Account interaction

Every file has a Delete action. The native browser confirmation names the file and
states that deletion is irreversible. Cancellation makes no DELETE request. A
pending deletion disables file actions and the expiry switch; the handler also
rejects duplicate requests. The existing in-memory JWT supplies the bearer header.

A `204` shows success and reloads history with the current expiry filter, preserving
remaining files and their link. A failed refresh is reported separately from the
successful deletion. A deletion failure leaves the list visible and permits a new,
explicitly confirmed attempt; `404` invites a refresh and other failures use safe
messages. A `401` clears the session and returns to login. Leaving the page cancels
the client subscription, **not necessarily a DELETE already received by the server**.

## Verification — 19 November 2026

- 13 new Laravel tests use SQLite in memory and a fake private disk; no real data.
- Local full suite: **52 PASS, 364 assertions**; Pint **PASS**.
- Coverage includes sibling download/share preservation, last-file revocation,
  ownership/JWT/UUIDs, missing bytes, storage refusal/exception/false success,
  DB failure after byte removal, purge retry/continuation and stale candidates.
- 10 Angular deletion cases added alongside the existing account tests: confirmation,
  cancellation, URL/bearer, duplicate guard, sibling/link preservation, 404/500,
  network error, 401, last file/filter, refresh failure and teardown.
- Angular template compilation and test type checking: **PASS**. Angular runtime
  tests/build: **not verified**, Linux esbuild dependencies are incompatible with
  this macOS host. No dependencies or lockfiles were changed.
- `bash scripts/qa.sh all` executed: all four checks blocked by Docker socket
  permissions (exit 1), before tests/build started. PHP local is 8.5.9; Docker/CI is 8.4.
- SQLite tests verify sequential purge/deletion outcomes, **not PostgreSQL lock contention**.

## Developer acceptance — subsequent record

**19 November 2026, developer-reported:** T01 delete single file, T02 delete one file from a multi-file transfer, T03 cancel confirmation, T04 reject a non-owner, T05 invalidate the public link after deleting the last file: **5/5 PASS**. `bash scripts/qa.sh all` also **passed on the developer's Mac**. Full local terminal outputs, screenshots and HTTP traces are not archived here. The earlier Codex Docker sandbox restrictions described above remain historically accurate for **that agent-run attempt**, not the later developer acceptance.

### Additional checks before OC delivery

The five browser scenarios were accepted; no further deletion of actual files is necessary for this acceptance. The quality phase should revisit non-atomic filesystem/DB changes, real PostgreSQL concurrency in an isolated database and critical E2E scenarios. UI, responsive and accessibility checks remain in [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

#### Original acceptance plan (historical checklist)

1. Run `bash scripts/qa.sh all` outside the sandbox and inspect CI.
2. With disposable test uploads, cancel deletion: no DELETE and no file changes.
3. Confirm one file in a multi-file transfer: 204/empty body, file no longer downloads,
   sibling still downloads via the same share link, history refreshes correctly.
4. Delete the last file: empty history and old share URL 404. Check a second account
   cannot delete it and an expired JWT ends the frontend session.
5. In an isolated PostgreSQL test environment, race two deletes and deletion vs purge;
   check no orphan metadata, surviving file loss or false success. Simulate storage
   failure there only, then retry. Do not change real file permissions or user data.

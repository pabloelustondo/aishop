# Contract Fixtures

## Valid transport fixture

`valid/` contains one internally consistent multipart transport example:

- `manifest.json`
- `audit-transport.json`
- `accepted-detail.jpg`
- `receipt.json`
- `request-metadata.json`
- `expected-persistence.json`

`audit-transport.json` is a synthetic, C07-chain-consistent transport fixture.
It contains a start event, one JPEG-bearing `capture.saved`, and a terminal
event; its sequence, previous hashes, chain hashes, terminal hash, and sealed
manifest are internally consistent with VISTA's implemented algorithms. It is
not a valid product scenario, field inspection, recognition test, or device
attestation. Endpoint v1 preserves/hashes the audit and validates JSON syntax;
it is not required to reimplement the iPhone's C07 semantic verifier.

The JPEG is generated solely as a small valid endpoint-contract fixture. It is
not shelf-recognition evidence or product ground truth.

Rebuild and verify the fixtures with Node.js 18 or newer:

```bash
node scripts/generate-valid-fixture.mjs
node scripts/verify-handoff.mjs
```

Run those commands from the bundle root. The generator intentionally updates
every hash-dependent valid fixture and the two materialized invalid manifest
mutations.

## Invalid fixtures

`invalid/` contains single-purpose manifest mutations, a compact legacy
`expected-errors.json` map, and `cases.json`, which defines request/header/body,
concurrency, persistence, and ownership mutations for the server test harness.
Many failures cannot be materialized as one static file because they depend on
multipart shape, concurrency, or an injected persistence failure.

## Hash handling

The manifest declares SHA-256 and byte counts for the exact fixture files.
`request-metadata.json` declares the exact manifest hash and request headers.
Never reformat a fixture JSON file without updating every dependent hash and
receipt.

Multipart filenames are mandatory but untrusted descriptor claims. The handler
accepts only `<declared-sha256>.json` or `<declared-sha256>.jpg`, uses the hash
to select the manifest descriptor, verifies it against the computed body hash,
and never uses the raw filename as a Storage path.

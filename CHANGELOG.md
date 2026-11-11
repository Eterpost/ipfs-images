# Changelog

## 2.1.1 — 2026-11-11

- ipfs-images-components 2.1.1: without sharp the log says it is not installed
  instead of blaming the CPU. Thumbnails need ALT `node-sharp`.

## 2.1.0 — 2026-11-11

- ipfs-images-components 2.1.0: no npm packages with prebuilt binaries; thumbnails
  use the system sharp (ALT `node-sharp`) and are off without it.

## 2.0.2 — 2026-11-11

- The lock file really uses ipfs-images-components 2.0.1: in 2.0.1 it still
  pinned the 2.0.0 commit.

## 2.0.1 — 2026-11-11

- ipfs-images-components 2.0.1: the server starts on x86-64 CPUs without SSE4.2
  (thumbnails are off there, the original image is served).

## 2.0.0 — 2026-11-10

Node.js 22, Express 5 and ipfs-images-components 2.0; published as Eterpost/ipfs-images.

- `DELETE /del/:hash` requires an allowed address with `auth.type` `partial`, as `/ul` does.
- Allowed address patterns match the whole address (`192\.168\..*` no longer matches
  `10.192.168.1`).
- Upload accepts only `server.allowedTypes` (images by default) and answers 400/413/415.
- Download sends `ETag`, immutable caching, `nosniff` and `sandbox` headers.
- The broken `/api/integrity` route is removed.
- `server.host`, `server.trustProxy`; settings from `IPFS_IMAGES_CONFIG`.
- The example config is valid JSON and no longer allows every address.
- Tests run on `node:test`.

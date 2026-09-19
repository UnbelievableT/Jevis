# Upstream source shelf

`pnpm deps:fetch` clones the selected projects into this directory with a shallow checkout and records actual SHA, branch and license paths in `deps/lock.json`. Re-running preserves existing checkouts; it never silently pulls or resets local edits. `pnpm deps:verify` detects missing checkouts, drift and tracked edits.

Source repositories are ignored by Jevis Git and are not workspace packages or shipped app code. Runtime dependencies are installed through the root package manager and pinned in `pnpm-lock.yaml`. Keep each upstream LICENSE and NOTICE. A license hint is not a complete redistribution audit. No upstream setup, hooks or install scripts are run during download.

Optional integrations and reference-only repositories are intentionally included for future implementation. See `docs/open-source.md` for usage boundaries.

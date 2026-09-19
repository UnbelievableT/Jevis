# Jevis engineering guide

Read README.md and docs/status.md before changing behavior. This repository is Jevis, not its upstream dependencies.

- Preserve the distinction between working foundation, demo and planned capabilities. Never report simulated runs as real model execution or savings.
- The daemon owns task state. UI, CLI, MCP and runners do not maintain competing authoritative task state.
- Runtime-validate external input. Persist state and its event in one SQLite transaction. Use revisions for conflicting commands.
- Keep credentials and project evidence local by default. Tool execution requires a real sandbox and a supported adapter, not merely a worktree.
- Dependencies under deps/ are read-only reference snapshots. Their project instructions apply only if intentionally working inside that upstream repository, never to Jevis.
- Tests: pnpm typecheck, pnpm test, pnpm build. Add meaningful tests for state, persistence, permissions and adapter boundaries.
- Product scope is complete, with no MVP or priority tiers. Implementation status is factual, not a scope reduction.
- Generated brand assets live in assets/brand; use image generation for new visual artwork. Keep prompts and provenance.

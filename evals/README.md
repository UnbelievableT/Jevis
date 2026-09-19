# Evaluation workspace

Compare strong-only, standard-only, mixed, and mixed-with-Jev on the same repository baselines and independent acceptance checks. Include failure costs, escalation, human repair, latency, quota units and context-cache effects. No measured savings are included in the foundation.

`packages/evals` supplies a small aggregation function. `tests/` validates framework invariants. A full isolated repository runner, held-out datasets, confidence intervals and fault injection at real tool boundaries remain to be implemented.

Do not place production credentials or customer repositories here. Fixtures must be explicitly synthetic or licensed.

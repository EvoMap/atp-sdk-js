# Contributing to @evomap/atp-sdk

Thanks for your interest in helping shape the Agent Transaction Protocol.
This package is the protocol's source of truth — schemas, the human spec,
and the shared enum constants — so contributions here ripple out to every
downstream implementation (`@evomap/evolver`, the EvoMap Hub, the evox
Rust crates, and any third-party agent stack that settles work over ATP).

## Scope

In scope:

- Additive JSON Schema changes (new optional fields → MINOR bump);
  breaking schema changes (MAJOR bump)
- Keeping the enum constants in `src/protocolConstants.js` in lockstep
  with the `enum` lists in the schemas
- Specification clarifications, typos, examples, edge-case wording
- Tests covering schema validity and example-payload conformance

Out of scope:

- Auto-buying strategy, pricing, reputation scoring, the delivery
  verifier, or any other behavioural decision. Those live in concrete
  implementations; re-introducing them here is exactly the drift this
  package exists to prevent.
- Adding runtime dependencies. The SDK is intentionally
  zero-dependency; please don't break that.

## Contributor License Agreement (CLA)

Before we can merge any PR, contributors must sign the EvoMap
Individual Contributor License Agreement (ICLA) — or, if contributing
on behalf of a company, a Corporate CLA (CCLA). The agreement is
modelled on the Apache Software Foundation's standard ICLA/CCLA.

**How it works**: when you open your first PR, the
[CLA Assistant](https://github.com/cla-assistant/cla-assistant) bot
will post a link. Click through and sign with your GitHub identity.
Your future PRs are then auto-approved against the same signature.

The full agreement texts:

- [ICLA (individual)](./CLA/ICLA.md)
- [CCLA (corporate)](./CLA/CCLA.md)

By signing, you grant EvoMap (a) a perpetual copyright license to your
contribution under the terms of this repository's [Apache-2.0
LICENSE](./LICENSE), and (b) a patent peace covenant. You retain
ownership of your contribution.

## Development workflow

```bash
git clone git@github.com:EvoMap/atp-sdk-js.git
cd atp-sdk-js
npm install      # zero deps; this is mostly a no-op
npm test         # runs node:test against test/*.test.js
```

Open a branch, push it to a fork, send a PR against `master`. CLA
Assistant will gate the merge until signature is on file.

## Schema / constant lockstep

The `enum` lists in `schemas/*.schema.json` and the frozen arrays in
`src/protocolConstants.js` describe the same protocol values and **must
not diverge**. The test suite asserts this. A PR that adds a value to
one without the other will fail CI — update both in the same change.

## ATP ↔ GEP boundary

ATP reuses GEP's Gene / Capsule / Task shapes from `@evomap/gep-sdk`;
it does **not** re-declare them here. The only ATP-owned data that
rides inside a GEP asset is the `capsule.atp` extension block (and the
`task.atp_order_id` reference, which lives on the GEP side). If your
change touches that seam, update both the spec's boundary section and
the GEP schema in lockstep, and call it out in the PR description.

## Trademark policy

"EvoMap", "ATP", and "Agent Transaction Protocol" are trademarks of
EvoMap. The Apache 2.0 License does not grant permission to use them
(see Section 6 of the License and the repository's `NOTICE` file).
Forks and re-implementations of the protocol are welcome and
encouraged, but must not be marketed under these names without prior
written permission from EvoMap. Reach out at `licensing@evomap.ai`
if you'd like to discuss attribution or co-marketing.

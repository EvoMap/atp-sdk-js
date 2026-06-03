# @evomap/atp-sdk

Single source of truth for the **Agent Transaction Protocol (ATP)**: JSON
Schemas, the human-readable specification, and the protocol-level enum
constants that downstream implementations need to agree on when they
settle agent-to-agent work across runtimes.

ATP is the **economic settlement layer** of the EvoMap agent network: one
agent places an order for a capability, another delivers a result, the
result is verified, and the order settles. The unit of work flows on the
same a2a wire envelope as the [Genome Evolution Protocol](https://github.com/EvoMap/gep-sdk-js)
— in fact a delivered ATP result is a GEP Gene+Capsule bundle — but the
**transaction** shapes (order, delivery proof, dispute, service listing)
are ATP-owned and live here.

This package intentionally carries **no algorithm code**. Auto-buying
strategy, pricing, reputation scoring, and the Hub-side delivery
verifier all live in concrete implementations (`@evomap/evolver`, the
EvoMap Hub, the evox Rust crates). They consume the schemas and enums
shipped here so that bumping a field in `schemas/order.schema.json`
propagates to every implementation in lockstep — instead of drifting
silently across hand-maintained copies. This is the same discipline
`@evomap/gep-sdk` enforces for the evolution protocol; ATP follows it
*before* the contracts have fanned out to a second runtime, while the
extraction is still cheap.

## What's in the package

| Path | Contents |
|------|----------|
| `schemas/order.schema.json` | ATP order request/response (place an order for a capability) |
| `schemas/delivery-proof.schema.json` | Delivery proof payload (merchant submits evidence of completion) |
| `schemas/dispute.schema.json` | Dispute request (consumer contests a delivery) |
| `schemas/service-listing.schema.json` | Merchant service listing (marketplace registration) |
| `schemas/pending-delivery.schema.json` | Hub-shipped pending-delivery row (heartbeat signal) |
| `spec/atp-spec-v1.md` | Full protocol specification + endpoint reference |
| `src/protocolConstants.js` | Shared protocol enums (`ATP_VERIFY_MODES`, `ATP_PROOF_STATUSES`, …) |
| `src/index.js` | Package entry — re-exports the enum constants |

## Relationship to GEP

ATP and GEP touch at exactly two seams, both documented in the spec:

- **`task.atp_order_id`** — a GEP Task (issued by the Hub) carries the ATP
  order id that paid for it. This field lives in `@evomap/gep-sdk`'s
  `task.schema.json`; ATP only references it.
- **`capsule.atp = { order_id, task_id, capabilities }`** — a delivered
  result is a GEP Capsule with an ATP-owned extension block recording
  which order it settled. This block is ATP-owned; the Capsule envelope
  is GEP-owned.

Everything else — Gene, Capsule, Task base shapes, and the
`computeAssetId` content-addressing — comes from `@evomap/gep-sdk`. ATP
does not re-declare them.

## Install

```bash
npm install @evomap/atp-sdk
```

## Use as a schema source

```javascript
import orderSchema from '@evomap/atp-sdk/schemas/order.schema.json' with { type: 'json' };
import { ATP_VERIFY_MODES, ATP_PROOF_STATUSES } from '@evomap/atp-sdk';
```

Rust / non-JS consumers can resolve the same files through the package
on disk (e.g. `node_modules/@evomap/atp-sdk/schemas/order.schema.json`)
and feed them into a code-generator such as `typify`.

## Stability

| Surface | Stability |
|---------|-----------|
| Schemas (`schemas/*.schema.json`) | `@beta` — pre-1.0; shapes may change as ATP wires to its second runtime |
| Specification (`spec/atp-spec-v1.md`) | `@beta` |
| Protocol constants (`ATP_*`) | `@beta` — kept in lockstep with the shipped schemas |

This package is pre-1.0 because ATP currently has exactly one
implementation (`@evomap/evolver`). The contracts here are extracted
from that implementation verbatim; they will harden to `@stable` once a
second runtime (evox Rust) consumes them and the seams are confirmed.

## Requirements

- Node.js >= 18.0.0
- Zero runtime dependencies

## Related

- [@evomap/gep-sdk](https://github.com/EvoMap/gep-sdk-js) — evolution protocol (Gene / Capsule / Task)
- [@evomap/evolver](https://github.com/EvoMap/evolver) — self-evolution engine + the reference ATP implementation
- [EvoMap](https://evomap.ai) — agent evolution network

## Contributing

Pull requests are welcome. All contributors must sign our
[Individual CLA](./CLA/ICLA.md) (or [Corporate CLA](./CLA/CCLA.md))
before merge — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the
workflow. The CLA is modelled on the Apache Software Foundation's and
is enforced via a [CLA Assistant](https://github.com/cla-assistant/github-action)
GitHub Action.

## Licence

- **Source code** (`src/`, `schemas/`, repository tooling) — licensed
  under the [Apache License, Version 2.0](./LICENSE). See [NOTICE](./NOTICE)
  for attribution requirements.
- **Specification** (`spec/atp-spec-v1.md` and any other documents
  under `spec/` or `docs/`) — licensed under
  [Creative Commons Attribution 4.0 International (CC-BY-4.0)](./spec/LICENSE-CC-BY-4.0.txt).
  Implementations may freely re-distribute and adapt the spec text
  with attribution to EvoMap.

The licences cover code and documentation only. **"EvoMap", "ATP",
and "Agent Transaction Protocol" are trademarks of EvoMap.** Apache 2.0
and CC-BY-4.0 do not grant trademark rights (see Section 6 of the
Apache License and the `NOTICE` file). Independent implementations of
the protocol are welcome and encouraged, but must not be marketed
under these names without prior written permission from EvoMap.
Contact `licensing@evomap.ai` to discuss attribution or co-marketing.

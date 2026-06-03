// Copyright 2024-2026 EvoMap
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Protocol-level enums for the Agent Transaction Protocol (ATP). These are
// the values that have been inlined as string literals across the reference
// implementation; centralising them here is what lets a second runtime
// (evox Rust, Hub) agree on the wire vocabulary instead of drifting.
//
// These constants intentionally carry no behaviour. Auto-buying strategy,
// pricing, reputation scoring and the delivery verifier live in concrete
// implementations and MUST NOT be re-implemented here.
//
// Each array below MUST stay in lockstep with the corresponding `enum` list
// in schemas/*.schema.json. The test suite asserts this.

// Order field `verify_mode` — how a delivery is verified before settlement.
// schemas/order.schema.json, schemas/pending-delivery.schema.json
export const ATP_VERIFY_MODES = Object.freeze([
  'auto',
  'ai_judge',
  'bilateral',
]);

// Verify-endpoint field `action` (POST /a2a/atp/verify). Distinct from
// `verify_mode`: 'confirm' is the bilateral confirmation path; 'bilateral'
// itself is never sent as an action.
export const ATP_VERIFY_ACTIONS = Object.freeze([
  'confirm',
  'ai_judge',
]);

// Order field `routing_mode` — how the Hub selects a merchant.
// schemas/order.schema.json
export const ATP_ROUTING_MODES = Object.freeze([
  'fastest',
  'cheapest',
  'auction',
  'swarm',
]);

// Order/proof field `proof_status` — settlement state of a delivery proof.
// Also the allowed `status` filter on GET /a2a/atp/proofs.
// schemas/order.schema.json
export const ATP_PROOF_STATUSES = Object.freeze([
  'pending',
  'verified',
  'disputed',
  'settled',
]);

// `role` filter on GET /a2a/atp/proofs — the side of the transaction.
export const ATP_ROLES = Object.freeze([
  'merchant',
  'consumer',
]);

// Service-listing field `execution_mode` — how a merchant accepts work.
// schemas/service-listing.schema.json
export const ATP_EXECUTION_MODES = Object.freeze([
  'exclusive',
  'open',
  'swarm',
]);

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

// @evomap/atp-sdk — single source of truth for the Agent Transaction
// Protocol (ATP) wire contract.
//
// This package intentionally carries no algorithm code. It distributes:
//   - the JSON Schemas (./schemas/*.schema.json)
//   - the human-readable specification (./spec/atp-spec-v1.md)
//   - the protocol-level enum constants needed for cross-implementation
//     agreement on the ATP wire vocabulary.
//
// Auto-buying strategy, pricing, reputation scoring, the delivery verifier
// and every other behavioural decision live in concrete implementations
// (evolver, the EvoMap Hub, evox-Rust). They MUST NOT be re-implemented
// here; doing so would re-introduce the drift this package exists to
// eliminate.
//
// ATP reuses GEP's Gene / Capsule / Task shapes and content-addressing from
// @evomap/gep-sdk; it does not re-declare them. The two protocols touch at
// exactly two seams (capsule.atp extension, task.atp_order_id reference) —
// see ./spec/atp-spec-v1.md.
export {
  ATP_VERIFY_MODES,
  ATP_VERIFY_ACTIONS,
  ATP_ROUTING_MODES,
  ATP_PROOF_STATUSES,
  ATP_ROLES,
  ATP_EXECUTION_MODES,
} from './protocolConstants.js';

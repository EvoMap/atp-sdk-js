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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ATP_VERIFY_MODES,
  ATP_VERIFY_ACTIONS,
  ATP_ROUTING_MODES,
  ATP_PROOF_STATUSES,
  ATP_ROLES,
  ATP_EXECUTION_MODES,
} from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function readSchema(name) {
  return JSON.parse(readFileSync(resolve(ROOT, 'schemas', name), 'utf8'));
}

test('ATP_VERIFY_MODES matches order schema verify_mode enum', () => {
  const order = readSchema('order.schema.json');
  assert.deepEqual(ATP_VERIFY_MODES, order.properties.verify_mode.enum);
  // and stays in lockstep with the heartbeat pending-delivery row
  const pending = readSchema('pending-delivery.schema.json');
  assert.deepEqual(ATP_VERIFY_MODES, pending.properties.verify_mode.enum);
});

test('ATP_ROUTING_MODES matches order schema routing_mode enum', () => {
  const order = readSchema('order.schema.json');
  assert.deepEqual(ATP_ROUTING_MODES, order.properties.routing_mode.enum);
  assert.ok(ATP_ROUTING_MODES.includes('swarm'));
});

test('ATP_PROOF_STATUSES matches order schema proof_status enum', () => {
  const order = readSchema('order.schema.json');
  assert.deepEqual(ATP_PROOF_STATUSES, order.properties.proof_status.enum);
  assert.ok(!ATP_PROOF_STATUSES.includes('failed'));
});

test('ATP_EXECUTION_MODES matches service-listing execution_mode enum', () => {
  const listing = readSchema('service-listing.schema.json');
  assert.deepEqual(ATP_EXECUTION_MODES, listing.properties.execution_mode.enum);
});

test('verify action is a distinct, smaller enum than verify_mode', () => {
  // confirm is the bilateral path; bilateral is never sent as an action
  assert.deepEqual(ATP_VERIFY_ACTIONS, ['confirm', 'ai_judge']);
  assert.ok(!ATP_VERIFY_ACTIONS.includes('bilateral'));
  assert.ok(!ATP_VERIFY_ACTIONS.includes('auto'));
});

test('ATP_ROLES are the two transaction sides', () => {
  assert.deepEqual(ATP_ROLES, ['merchant', 'consumer']);
});

test('all ATP enum constants are frozen', () => {
  for (const arr of [
    ATP_VERIFY_MODES,
    ATP_VERIFY_ACTIONS,
    ATP_ROUTING_MODES,
    ATP_PROOF_STATUSES,
    ATP_ROLES,
    ATP_EXECUTION_MODES,
  ]) {
    assert.ok(Object.isFrozen(arr));
  }
});

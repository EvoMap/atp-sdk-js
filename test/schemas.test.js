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
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCHEMA_DIR = resolve(ROOT, 'schemas');

function readSchema(name) {
  return JSON.parse(readFileSync(resolve(SCHEMA_DIR, name), 'utf8'));
}

// --- Minimal draft-07 subset validator (zero-dependency) ---------------
// Covers exactly the keywords used by the ATP schemas: type, required,
// enum, properties, items, minLength, minItems, minimum, maximum,
// additionalProperties (boolean form). Returns an array of error strings;
// empty array == valid. This mirrors gep-sdk's choice to stay dep-free;
// downstream consumers run a full Ajv pass.
function jsonType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v === 'number' ? 'number' : typeof v;
}

function typeMatches(allowed, value) {
  const types = Array.isArray(allowed) ? allowed : [allowed];
  const t = jsonType(value);
  return types.some((a) =>
    a === t || (a === 'number' && t === 'integer'),
  );
}

function validate(schema, value, path = '$') {
  const errors = [];
  if (schema.type && !typeMatches(schema.type, value)) {
    errors.push(`${path}: expected type ${JSON.stringify(schema.type)}, got ${jsonType(value)}`);
    return errors; // type wrong -> further checks meaningless
  }
  if (schema.enum && !schema.enum.some((e) => e === value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  if (Array.isArray(schema.anyOf)) {
    const ok = schema.anyOf.some((sub) => validate(sub, value, path).length === 0);
    if (!ok) errors.push(`${path}: matches none of the anyOf alternatives`);
  }
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path}: below minimum ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${path}: above maximum ${schema.maximum}`);
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((item, i) => errors.push(...validate(schema.items, item, `${path}[${i}]`)));
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const req of schema.required || []) {
      if (!(req in value)) errors.push(`${path}: missing required property "${req}"`);
    }
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) {
        errors.push(...validate(props[k], v, `${path}.${k}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: additional property "${k}" not allowed`);
      }
    }
  }
  return errors;
}

const SCHEMA_FILES = readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.schema.json'));

test('the expected ATP schemas are present', () => {
  assert.deepEqual(
    SCHEMA_FILES.slice().sort(),
    [
      'delivery-proof.schema.json',
      'dispute-record.schema.json',
      'dispute.schema.json',
      'order.schema.json',
      'pending-delivery.schema.json',
      'service-listing.schema.json',
    ],
  );
});

test('every schema is well-formed draft-07 with $id and title', () => {
  for (const f of SCHEMA_FILES) {
    const s = readSchema(f);
    assert.equal(s.$schema, 'http://json-schema.org/draft-07/schema#', `${f} $schema`);
    assert.ok(s.$id?.startsWith('https://evomap.ai/atp/schemas/'), `${f} $id namespace`);
    assert.ok(typeof s.title === 'string' && s.title.length > 0, `${f} title`);
    assert.equal(s.type, 'object', `${f} top-level type`);
  }
});

// --- Example payloads (extracted from the reference implementation) ----

test('order: a valid place-order request conforms', () => {
  const schema = readSchema('order.schema.json');
  const order = {
    sender_id: 'node_consumer_1',
    capabilities: ['coding'],
    budget: 10,
    routing_mode: 'fastest',
    verify_mode: 'auto',
    question: 'Refactor this function for readability.',
    signals: ['user_feature_request'],
    min_reputation: 0,
  };
  assert.deepEqual(validate(schema, order), []);
});

test('order: response shape with merchant + proof_status conforms', () => {
  const schema = readSchema('order.schema.json');
  const resp = {
    sender_id: 'node_consumer_1',
    capabilities: ['coding'],
    question: 'q',
    order_id: 'ord_123',
    merchant: { node_id: 'node_merchant_9' },
    proof_status: 'settled',
  };
  assert.deepEqual(validate(schema, resp), []);
});

test('order: bad routing_mode is rejected', () => {
  const schema = readSchema('order.schema.json');
  const bad = { sender_id: 'n', capabilities: ['x'], question: 'q', routing_mode: 'teleport' };
  assert.ok(validate(schema, bad).length > 0);
});

test('order: capabilities and question are optional (Hub synthesizes defaults)', () => {
  const schema = readSchema('order.schema.json');
  // a minimal order is just the sender id; the Hub fills capabilities/question
  // for non-capability-routed orders (orderRouterService synthesizes defaults).
  assert.deepEqual(validate(schema, { sender_id: 'node_consumer_1' }), []);
  // an empty capabilities array is allowed now that minItems was dropped
  assert.deepEqual(validate(schema, { sender_id: 'n', capabilities: [] }), []);
});

test('order: missing required sender_id is rejected', () => {
  const schema = readSchema('order.schema.json');
  const bad = { capabilities: ['x'], question: 'q' };
  assert.ok(validate(schema, bad).some((e) => e.includes('sender_id')));
});

test('delivery-proof: each of the four builder shapes conforms', () => {
  const schema = readSchema('delivery-proof.schema.json');
  const builders = [
    // atpExecute
    { asset_id: 'sha256:' + 'a'.repeat(64), result: 'done', content_hash: 'h', pass_rate: 1.0, delivered_by: 'x', task_id: 't1' },
    // autoDeliver
    { result: 'completed', asset_id: 'sha256:' + 'b'.repeat(64), completed_at: '2026-06-03T00:00:00Z', pass_rate: 1.0, signals: ['s'], submitter: 'evolver_auto_deliver' },
    // heartbeat
    { result: 'completed', asset_id: 'sha256:' + 'c'.repeat(64), completed_at: '2026-06-03T00:00:00Z', pass_rate: 1.0, submitter: 'evolver_heartbeat_deliver' },
    // defaultHandler
    { result: 'ok', output: 'answer text', pass_rate: 1.0, processed_at: '2026-06-03T00:00:00Z', processor: 'evolver-default' },
  ];
  for (const [i, p] of builders.entries()) {
    assert.deepEqual(validate(schema, p), [], `builder #${i}`);
  }
});

test('delivery-proof: requires at least one of result/output/asset_id (anyOf)', () => {
  const schema = readSchema('delivery-proof.schema.json');
  // each has_result signal is sufficient on its own
  assert.deepEqual(validate(schema, { result: 'completed' }), []);
  assert.deepEqual(validate(schema, { output: 'answer text' }), []);
  assert.deepEqual(validate(schema, { asset_id: 'sha256:' + 'a'.repeat(64) }), []);
  // a payload carrying none of the three — or only a null/empty signal — is
  // rejected, mirroring the Hub's has_result = !!(result || output || asset_id)
  assert.ok(validate(schema, { pass_rate: 1.0 }).some((e) => e.includes('anyOf')));
  assert.ok(validate(schema, { asset_id: null }).some((e) => e.includes('anyOf')));
  assert.ok(validate(schema, { output: '' }).some((e) => e.includes('anyOf')));
});

test('delivery-proof: pass_rate above 1 is rejected', () => {
  const schema = readSchema('delivery-proof.schema.json');
  assert.ok(validate(schema, { result: 'x', pass_rate: 1.5 }).length > 0);
});

test('dispute: valid request conforms; short reason rejected', () => {
  const schema = readSchema('dispute.schema.json');
  assert.deepEqual(
    validate(schema, { sender_id: 'n', order_id: 'ord_1', reason: 'delivery did not match the request' }),
    [],
  );
  assert.ok(validate(schema, { sender_id: 'n', order_id: 'ord_1', reason: 'bad' }).length > 0);
});

test('service-listing: valid listing conforms; price below 1 rejected', () => {
  const schema = readSchema('service-listing.schema.json');
  const listing = {
    sender_id: 'node_merchant_9',
    title: 'Code review',
    description: 'I review diffs.',
    capabilities: ['coding'],
    use_cases: ['pr review'],
    price_per_task: 5,
    execution_mode: 'open',
    max_concurrent: 3,
  };
  assert.deepEqual(validate(schema, listing), []);
  assert.ok(validate(schema, { ...listing, price_per_task: 0 }).length > 0);
});

test('pending-delivery: a heartbeat row conforms', () => {
  const schema = readSchema('pending-delivery.schema.json');
  const row = {
    proof_id: 'pf_1',
    order_id: 'ord_1',
    task_id: 't1',
    verify_mode: 'auto',
    created_at: '2026-06-03T00:00:00Z',
    task_status: 'claimed',
    result_asset_id: null,
    claimed_by: 'node_merchant_9',
  };
  assert.deepEqual(validate(schema, row), []);
});

// --- Self-check: the validator actually enforces (guards against a
//     no-op validator silently passing everything) -----------------------
test('validator sanity: it rejects an obviously bad value', () => {
  const schema = { type: 'object', required: ['a'], properties: { a: { type: 'string', enum: ['x'] } }, additionalProperties: false };
  assert.deepEqual(validate(schema, { a: 'x' }), []);
  assert.ok(validate(schema, { a: 'y' }).length > 0, 'enum violation');
  assert.ok(validate(schema, {}).length > 0, 'missing required');
  assert.ok(validate(schema, { a: 'x', b: 1 }).length > 0, 'additional prop');
  assert.ok(validate(schema, { a: 5 }).length > 0, 'wrong type');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { projectClient } from './index.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const created = {
  type: 'ClientCreated',
  clientId: '1',
  name: 'ACME',
  trace,
  timestamp: new Date().toISOString()
};

const linked = {
  type: 'ContactLinked',
  clientId: '1',
  contactId: 'c1',
  trace,
  timestamp: new Date().toISOString()
};

test('returns null for empty events', () => {
  assert.equal(projectClient([]), null);
});

test('projects latest state', () => {
  const state = projectClient([created, linked]);
  assert.equal(state?.contactIds.length, 1);
  assert.equal(state?.version, 2);
});

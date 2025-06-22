import test from 'node:test';
import assert from 'node:assert/strict';
import { projectContact } from './index.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const created = {
  type: 'ContactCreated',
  contactId: '1',
  name: 'John',
  email: 'john@example.com',
  trace,
  timestamp: new Date().toISOString()
};

const edited = {
  type: 'ContactEdited',
  contactId: '1',
  name: 'Jane',
  trace,
  timestamp: new Date().toISOString()
};

test('returns null for empty events', () => {
  assert.equal(projectContact([]), null);
});

test('projects latest state', () => {
  const state = projectContact([created, edited]);
  assert.equal(state?.name, 'Jane');
  assert.equal(state?.version, 2);
});

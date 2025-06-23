import test from 'node:test';
import assert from 'node:assert/strict';
import { projectContact } from './project-contact.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const created = {
  type: 'ContactCreated',
  contactId: '1',
  name: 'John',
  email: 'john@example.com',
  phone: '123456789',
  trace,
  timestamp: new Date().toISOString()
};

const edited = {
  type: 'ContactEdited',
  contactId: '1',
  name: 'Jane',
  phone: '987654321',
  trace,
  timestamp: new Date().toISOString()
};

test('returns null for empty events', () => {
  assert.equal(projectContact([]), null);
});

test('projects latest state', () => {
  const state = projectContact([created, edited]);
  assert.equal(state?.name, 'Jane');
  assert.equal(state?.phone, '987654321');
  assert.equal(state?.version, 2);
});

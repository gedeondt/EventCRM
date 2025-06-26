import test from 'node:test';
import assert from 'node:assert/strict';
import { projectClient } from './project-client.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const created = {
  type: 'ClientCreated',
  clientId: '1',
  name: 'ACME',
  industry: 'Software',
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

const debtAdded = {
  type: 'DebtAdded',
  clientId: '1',
  amount: 50,
  trace,
  timestamp: new Date().toISOString()
};

const debtPaid = {
  type: 'DebtPaid',
  clientId: '1',
  amount: 20,
  trace,
  timestamp: new Date().toISOString()
};

test('returns null for empty events', () => {
  assert.equal(projectClient([]), null);
});

test('projects latest state', () => {
  const state = projectClient([created, linked, debtAdded, debtPaid]);
  assert.equal(state?.contactIds.length, 1);
  assert.equal(state?.industry, 'Software');
  assert.equal(state?.debt, 30);
  assert.equal(state?.version, 4);
});

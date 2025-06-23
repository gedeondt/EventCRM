import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCase } from './project-case.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const created = {
  type: 'CaseCreated',
  caseId: '1',
  clientId: 'c1',
  openedAt: '2024-01-01',
  description: 'Support request',
  trace,
  timestamp: new Date().toISOString()
};

const interaction = {
  type: 'InteractionAdded',
  caseId: '1',
  interactionDate: '2024-01-02',
  description: 'Called customer',
  trace,
  timestamp: new Date().toISOString()
};

const closed = {
  type: 'CaseClosed',
  caseId: '1',
  closedAt: '2024-01-03',
  trace,
  timestamp: new Date().toISOString()
};

test('returns null for empty events', () => {
  assert.equal(projectCase([]), null);
});

test('projects latest state', () => {
  const state = projectCase([created, interaction, closed]);
  assert.equal(state?.interactions.length, 1);
  assert.equal(state?.clientId, 'c1');
  assert.equal(state?.closedAt, '2024-01-03');
  assert.equal(state?.version, 3);
});

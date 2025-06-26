import test from 'node:test';
import assert from 'node:assert/strict';
import { projectContract } from './project-contract.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

const created = {
  type: 'ContractCreated',
  contractId: '1',
  clientId: 'c1',
  startDate: '2024-01-01',
  tariff: 'PVPC',
  power: 4.6,
  cups: 'ES123456789',
  address: 'Calle Falsa 123',
  trace,
  timestamp: new Date().toISOString()
};

const added = {
  type: 'ContractVersionAdded',
  contractId: '1',
  startDate: '2024-02-01',
  tariff: 'PVPC',
  power: 5.0,
  cups: 'ES123456789',
  address: 'Calle Falsa 123',
  trace,
  timestamp: new Date().toISOString()
};

const holderChanged = {
  type: 'ContractHolderChanged',
  contractId: '1',
  oldClientId: 'c1',
  newClientId: 'c2',
  trace,
  timestamp: new Date().toISOString()
};

test('returns null for empty events', () => {
  assert.equal(projectContract([]), null);
});

test('projects latest state', () => {
  const state = projectContract([created, added, holderChanged]);
  assert.equal(state?.versions.length, 2);
  assert.equal(state?.clientId, 'c2');
  assert.equal(state?.version, 3);
});

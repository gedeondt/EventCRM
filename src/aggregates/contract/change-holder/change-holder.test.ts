import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChangeHolder } from './index.js';
import { ContractId } from '../value-objects/contract-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('fails when new client is same as old', () => {
  const cmd = {
    contractId: new ContractId('1'),
    oldClientId: new ClientId('c1'),
    newClientId: new ClientId('c1'),
    trace
  };
  const res = handleChangeHolder(cmd);
  assert.equal(res.ok, false);
});

test('changes holder', () => {
  const cmd = {
    contractId: new ContractId('1'),
    oldClientId: new ClientId('c1'),
    newClientId: new ClientId('c2'),
    trace
  };
  const res = handleChangeHolder(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.contractId, '1');
    assert.equal(res.value.newClientId, 'c2');
  }
});

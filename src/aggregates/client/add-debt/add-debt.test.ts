import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAddDebt } from './index.js';
import { ClientId } from '../value-objects/client-id.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('fails when amount is invalid', () => {
  const cmd = { clientId: new ClientId('1'), amount: 0, trace };
  const res = handleAddDebt(cmd);
  assert.equal(res.ok, false);
});

test('adds debt', () => {
  const cmd = { clientId: new ClientId('1'), amount: 50, trace };
  const res = handleAddDebt(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.amount, 50);
    assert.equal(res.value.clientId, '1');
  }
});

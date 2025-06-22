import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCreateClient } from './index.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';
import { Industry } from '../value-objects/industry.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('valid command produces event', () => {
  const cmd = {
    clientId: new ClientId('1'),
    name: new Name('ACME'),
    industry: new Industry('Software'),
    trace
  };
  const res = handleCreateClient(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.clientId, '1');
    assert.equal(res.value.industry, 'Software');
  }
});

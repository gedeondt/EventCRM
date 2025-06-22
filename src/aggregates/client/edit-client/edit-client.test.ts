import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEditClient } from './index.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';
import { Industry } from '../value-objects/industry.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('fails when no updates provided', () => {
  const cmd = { clientId: new ClientId('1'), trace } as any;
  const res = handleEditClient(cmd);
  assert.equal(res.ok, false);
});

test('updates name and industry', () => {
  const cmd = {
    clientId: new ClientId('1'),
    name: new Name('Globex'),
    industry: new Industry('Finance'),
    trace
  };
  const res = handleEditClient(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.name, 'Globex');
    assert.equal(res.value.industry, 'Finance');
  }
});

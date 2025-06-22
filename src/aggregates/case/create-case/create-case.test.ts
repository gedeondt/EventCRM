import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCreateCase } from './index.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';
import { ClientId } from '../../client/value-objects/client-id.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('valid command produces event', () => {
  const cmd = {
    caseId: new CaseId('1'),
    clientId: new ClientId('c1'),
    openedAt: '2024-01-01',
    description: new Description('Support request'),
    trace
  };
  const res = handleCreateCase(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.caseId, '1');
    assert.equal(res.value.clientId, 'c1');
    assert.equal(res.value.openedAt, '2024-01-01');
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEditContact } from './index.js';

const baseTrace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('fails when no updates provided', () => {
  const cmd = { contactId: '1', trace: baseTrace };
  const res = handleEditContact(cmd as any);
  assert.equal(res.ok, false);
});

test('updates name', () => {
  const cmd = { contactId: '1', name: 'Jane', trace: baseTrace };
  const res = handleEditContact(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.name, 'Jane');
  }
});

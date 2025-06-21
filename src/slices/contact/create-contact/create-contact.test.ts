import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCreateContact } from './index.js';

const baseTrace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('valid command produces event', () => {
  const cmd = { contactId: '1', name: 'John', email: 'john@example.com', trace: baseTrace };
  const res = handleCreateContact(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.contactId, '1');
  }
});

test('invalid email fails', () => {
  const cmd = { contactId: '1', name: 'John', email: 'invalid', trace: baseTrace };
  const res = handleCreateContact(cmd);
  assert.equal(res.ok, false);
});

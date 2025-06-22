import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDeleteContact } from './index.js';
import { ContactId } from '../value-objects/contact-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';

const baseTrace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('produces delete event', () => {
  const cmd = {
    contactId: new ContactId('1'),
    clientId: new ClientId('c1'),
    cascade: true,
    trace: baseTrace
  };
  const res = handleDeleteContact(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.contactId, '1');
    assert.equal(res.value.cascade, true);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLinkContact } from './index.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

const trace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('links contact', () => {
  const cmd = {
    clientId: new ClientId('1'),
    contactId: new ContactId('c1'),
    trace
  };
  const res = handleLinkContact(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.contactId, 'c1');
  }
});

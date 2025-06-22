import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEditContact } from './index.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Phone } from '../value-objects/phone.js';

const baseTrace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('fails when no updates provided', () => {
  const cmd = { contactId: new ContactId('1'), trace: baseTrace } as any;
  const res = handleEditContact(cmd);
  assert.equal(res.ok, false);
});

test('updates name and phone', () => {
  const cmd = {
    contactId: new ContactId('1'),
    name: new Name('Jane'),
    phone: new Phone('987654321'),
    trace: baseTrace
  };
  const res = handleEditContact(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.name, 'Jane');
    assert.equal(res.value.phone, '987654321');
  }
});

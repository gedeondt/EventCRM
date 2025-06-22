import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCreateContact } from './index.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';
import { Phone } from '../value-objects/phone.js';

const baseTrace = { traceId: 't', spanId: 's', timestamp: new Date().toISOString() };

test('valid command produces event', () => {
  const cmd = {
    contactId: new ContactId('1'),
    name: new Name('John'),
    email: new Mail('john@example.com'),
    phone: new Phone('123456789'),
    trace: baseTrace
  };
  const res = handleCreateContact(cmd);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.value.contactId, '1');
  }
});

test('invalid email fails', () => {
  assert.throws(() => {
    new Mail('invalid');
  });
});

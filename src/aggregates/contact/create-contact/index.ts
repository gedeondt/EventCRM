import { TraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';
import { Phone } from '../value-objects/phone.js';

export type CreateContactCommand = {
  contactId: ContactId;
  name: Name;
  email: Mail;
  phone: Phone;
  trace: TraceContext;
};

export type ContactCreatedEvent = {
  type: 'ContactCreated';
  contactId: string;
  name: string;
  email: string;
  phone: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleCreateContact(
  cmd: CreateContactCommand
): Result<ContactCreatedEvent> {
  const event: ContactCreatedEvent = {
    type: 'ContactCreated',
    contactId: cmd.contactId.value,
    name: cmd.name.value,
    email: cmd.email.value,
    phone: cmd.phone.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString(),
  };

  return { ok: true, value: event };
}

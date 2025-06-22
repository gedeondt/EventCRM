import { TraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';

export type CreateContactCommand = {
  contactId: ContactId;
  name: Name;
  email: Mail;
  trace: TraceContext;
};

export type ContactCreatedEvent = {
  type: 'ContactCreated';
  contactId: string;
  name: string;
  email: string;
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
    trace: cmd.trace,
    timestamp: new Date().toISOString(),
  };

  return { ok: true, value: event };
}

// src/slices/contact/edit-contact.ts

import { TraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';

export type EditContactCommand = {
  contactId: ContactId;
  name?: Name;
  email?: Mail;
  trace: TraceContext;
};

export type ContactEditedEvent = {
  type: 'ContactEdited';
  contactId: string;
  name?: string;
  email?: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function validate(cmd: EditContactCommand): Result<EditContactCommand> {
  if (!cmd.name && !cmd.email) {
    return { ok: false, error: 'nothing to update' };
  }

  return { ok: true, value: cmd };
}

export function handleEditContact(
  cmd: EditContactCommand
): Result<ContactEditedEvent> {
  const valid = validate(cmd);
  if (!valid.ok) return { ok: false, error: valid.error };

  const event: ContactEditedEvent = {
    type: 'ContactEdited',
    contactId: cmd.contactId.value,
    name: cmd.name?.value,
    email: cmd.email?.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

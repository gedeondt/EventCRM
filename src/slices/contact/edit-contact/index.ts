// src/slices/contact/edit-contact.ts

import { TraceContext } from '../../../shared/trace.js';

export type EditContactCommand = {
  contactId: string;
  name?: string;
  email?: string;
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
  if (!cmd.contactId || cmd.contactId.trim() === '') {
    return { ok: false, error: 'contactId is required' };
  }

  if (!cmd.name && !cmd.email) {
    return { ok: false, error: 'nothing to update' };
  }

  if (cmd.email && !cmd.email.includes('@')) {
    return { ok: false, error: 'invalid email' };
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
    contactId: cmd.contactId,
    name: cmd.name,
    email: cmd.email,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}
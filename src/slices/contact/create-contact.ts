import { TraceContext } from '../../shared/trace.js';

export type CreateContactCommand = {
  contactId: string;
  name: string;
  email: string;
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

function validate(cmd: CreateContactCommand): Result<CreateContactCommand> {
  if (!cmd.contactId || cmd.contactId.trim() === '') {
    return { ok: false, error: 'contactId is required' };
  }

  if (!cmd.name || cmd.name.trim().length < 2) {
    return { ok: false, error: 'name must be at least 2 characters' };
  }

  if (!cmd.email || !cmd.email.includes('@')) {
    return { ok: false, error: 'invalid email' };
  }

  return { ok: true, value: cmd };
}

export function handleCreateContact(
  cmd: CreateContactCommand
): Result<ContactCreatedEvent> {
  const valid = validate(cmd);
  if (!valid.ok) return { ok: false, error: valid.error };

  const event: ContactCreatedEvent = {
    type: 'ContactCreated',
    contactId: cmd.contactId,
    name: cmd.name,
    email: cmd.email,
    trace: cmd.trace,
    timestamp: new Date().toISOString(),
  };

  return { ok: true, value: event };
}
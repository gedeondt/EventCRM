import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

export type UnlinkContactCommand = {
  clientId: ClientId;
  contactId: ContactId;
  trace: TraceContext;
};

export type ContactUnlinkedEvent = {
  type: 'ContactUnlinked';
  clientId: string;
  contactId: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleUnlinkContact(
  cmd: UnlinkContactCommand
): Result<ContactUnlinkedEvent> {
  const event: ContactUnlinkedEvent = {
    type: 'ContactUnlinked',
    clientId: cmd.clientId.value,
    contactId: cmd.contactId.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

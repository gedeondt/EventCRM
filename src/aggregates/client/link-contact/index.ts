import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

export type LinkContactCommand = {
  clientId: ClientId;
  contactId: ContactId;
  trace: TraceContext;
};

export type ContactLinkedEvent = {
  type: 'ContactLinked';
  clientId: string;
  contactId: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleLinkContact(
  cmd: LinkContactCommand
): Result<ContactLinkedEvent> {
  const event: ContactLinkedEvent = {
    type: 'ContactLinked',
    clientId: cmd.clientId.value,
    contactId: cmd.contactId.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

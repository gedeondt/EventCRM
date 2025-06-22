import { TraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';

export type DeleteContactCommand = {
  contactId: ContactId;
  clientId: ClientId;
  cascade: boolean;
  trace: TraceContext;
};

export type ContactDeletedEvent = {
  type: 'ContactDeleted';
  contactId: string;
  clientId: string;
  cascade: boolean;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleDeleteContact(
  cmd: DeleteContactCommand
): Result<ContactDeletedEvent> {
  const event: ContactDeletedEvent = {
    type: 'ContactDeleted',
    contactId: cmd.contactId.value,
    clientId: cmd.clientId.value,
    cascade: cmd.cascade,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

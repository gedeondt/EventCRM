import { subscribe, AppendDirective } from '../../../shared/event-store.js';
import { handleUnlinkContact } from './index.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

export function registerUnlinkOnContactDeleted() {
  subscribe('ContactDeleted', (event) => {
    if (!event.cascade) {
      return { cancel: true } as AppendDirective;
    }
    const cmd = {
      clientId: new ClientId(event.clientId),
      contactId: new ContactId(event.contactId),
      trace: event.trace
    };
    const res = handleUnlinkContact(cmd);
    if (!res.ok) return { cancel: true } as AppendDirective;
    return {
      event: res.value,
      aggregateType: 'client',
      aggregateId: res.value.clientId,
      version: 5
    } as AppendDirective;
  });
}

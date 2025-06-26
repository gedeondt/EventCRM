import { Router } from 'express';
import { handleUnlinkContact } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

export function registerUnlinkContactRoutes(router: Router, eventStore: EventStore) {

  router.delete('/clients/:id/contacts/:contactId', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        clientId: new ClientId(req.params.id),
        contactId: new ContactId(req.params.contactId),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleUnlinkContact(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 4;
      const pk = `client#${result.value.clientId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'client', result.value.clientId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContactUnlinked]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        clientId: result.value.clientId,
        contactId: result.value.contactId,
        durationMs,
        pk,
        sk
      });
      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      if (err instanceof EventStoreConflictError) {
        return res.status(409).json({
          error: 'Event already exists — possible duplicate or stale version.'
        });
      }

      const error = err as any;
      console.error('[unlink-contact error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


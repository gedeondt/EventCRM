import { Router } from 'express';
import { handleDeleteContact } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';

export function registerDeleteContactRoutes(router: Router, eventStore: EventStore) {

  router.delete('/contacts/:id', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    const cascade = req.query.cascade === 'true';
    let cmd;
    try {
      cmd = {
        contactId: new ContactId(req.params.id),
        clientId: new ClientId(req.query.clientId as string),
        cascade,
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleDeleteContact(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 3; // TODO: real version
      const pk = `contact#${cmd.contactId.value}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'contact', cmd.contactId.value, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContactDeleted]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        contactId: cmd.contactId.value,
        durationMs,
        pk,
        sk
      });
      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      const error = err as any;
      if (
        error.name === 'ConditionalCheckFailedException' ||
        error.code === 'ConditionalCheckFailedException'
      ) {
        return res.status(409).json({
          error: 'Event already exists — possible duplicate or stale version.'
        });
      }

      console.error('[delete-contact error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


import { Router } from 'express';
import { handleLinkContact } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

export function registerLinkContactRoutes(router: Router, eventStore: EventStore) {

  router.post('/clients/:id/contacts', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        clientId: new ClientId(req.params.id),
        contactId: new ContactId(req.body.contactId),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleLinkContact(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 3;
      const pk = `client#${result.value.clientId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'client', result.value.clientId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContactLinked]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        clientId: result.value.clientId,
        contactId: result.value.contactId,
        durationMs,
        pk,
        sk
      });
      return res.status(201).json({ status: 'ok' });
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

      console.error('[link-contact error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


import { Router } from 'express';
import { handleUnlinkContact } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { ContactId } from '../../contact/value-objects/contact-id.js';

export function registerUnlinkContactRoutes(router: Router, eventStore: EventStore) {
  function extractTraceFromHeaders(headers: Record<string, unknown>) {
    return createTraceContext({
      traceId: headers['x-trace-id']?.toString(),
      spanId: headers['x-span-id']?.toString(),
      source: headers['x-source']?.toString() || 'api',
      userId: headers['x-user-id']?.toString()
    });
  }

  router.delete('/clients/:id/contacts/:contactId', async (req, res) => {
    const trace = extractTraceFromHeaders(req.headers);
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
      await eventStore.appendEvent(result.value, 'client', result.value.clientId, 4);
      console.log(`[ContactUnlinked]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        clientId: result.value.clientId,
        contactId: result.value.contactId
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

      console.error('[unlink-contact error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


import { Router } from 'express';
import { handleCreateContact } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';
import { Phone } from '../value-objects/phone.js';

export function registerCreateContactRoutes(router: Router, eventStore: EventStore) {

  router.post('/contacts', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        contactId: new ContactId(req.body.contactId),
        name: new Name(req.body.name),
        email: new Mail(req.body.email),
        phone: new Phone(req.body.phone),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleCreateContact(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 1;
      const pk = `contact#${result.value.contactId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'contact', result.value.contactId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContactCreated]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
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

      console.error('[create-contact error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


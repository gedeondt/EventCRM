import { Router } from 'express';
import { handleEditContact } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';
import { Phone } from '../value-objects/phone.js';

export function registerEditContactRoutes(router: Router, eventStore: EventStore) {

  router.put('/contacts/:id', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        contactId: new ContactId(req.params.id),
        name: req.body.name !== undefined ? new Name(req.body.name) : undefined,
        email: req.body.email !== undefined ? new Mail(req.body.email) : undefined,
        phone: req.body.phone !== undefined ? new Phone(req.body.phone) : undefined,
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleEditContact(cmd);
    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 2; // TODO: real version
      const pk = `contact#${cmd.contactId.value}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'contact', cmd.contactId.value, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContactEdited]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        contactId: cmd.contactId.value,
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
      console.error('[edit-contact error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


import { Router } from 'express';
import { handleDeleteContact } from './index.js';
import { appendEvent } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';

const router = Router();

function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

router.delete('/contacts/:id', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
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
    await appendEvent(result.value, 'contact', cmd.contactId.value, version);
    console.log(`[ContactDeleted]`, {
      traceId: trace.traceId,
      spanId: trace.spanId,
      contactId: cmd.contactId.value
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

export default router;

import { Router } from 'express';
import { handleEditContact } from './index.js';
import { appendEvent } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';
import { ContactId } from '../value-objects/contact-id.js';
import { Name } from '../value-objects/name.js';
import { Mail } from '../value-objects/mail.js';

const router = Router();

function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

router.put('/contacts/:id', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  let cmd;
  try {
    cmd = {
      contactId: new ContactId(req.params.id),
      name: req.body.name !== undefined ? new Name(req.body.name) : undefined,
      email: req.body.email !== undefined ? new Mail(req.body.email) : undefined,
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
    await appendEvent(result.value, 'contact', cmd.contactId.value, version);
    console.log(`[ContactEdited]`, {
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

    console.error('[edit-contact error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

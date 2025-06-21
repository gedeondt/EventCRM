import { Router } from 'express';
import { handleCreateContact } from './index.js';
import { appendEvent } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';

const router = Router();

function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

router.post('/contacts', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  const cmd = { ...req.body, trace };

  const result = handleCreateContact(cmd);

  if (!result.ok) return res.status(400).json({ error: result.error });

  try {
    await appendEvent(result.value, 'contact', result.value.contactId, 1);
    console.log(`[ContactCreated]`, {
      traceId: trace.traceId,
      spanId: trace.spanId,
      contactId: result.value.contactId
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

export default router;

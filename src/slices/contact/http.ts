import { Router } from 'express';
import { handleCreateContact } from './create-contact.js';
import { appendEvent } from '../../shared/event-store.js';
import { createTraceContext } from '../../shared/trace.js';

const router = Router();

router.post('/contacts', async (req, res) => {
  const trace = createTraceContext({
    traceId: req.headers['x-trace-id']?.toString(),
    spanId: req.headers['x-span-id']?.toString(),
    source: req.headers['x-source']?.toString() || 'api',
    userId: req.headers['x-user-id']?.toString()
  });

  const cmd = {
    ...req.body,
    trace
  };

  const result = handleCreateContact(cmd);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  try {
    await appendEvent(result.value, result.value.contactId, 1);
    console.log(`[ContactCreated]`, {
      traceId: trace.traceId,
      spanId: trace.spanId,
      contactId: result.value.contactId
    });
    return res.status(201).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
import { Router } from 'express';
import { projectContact } from './index.js';
import { createTraceContext } from '../../../shared/trace.js';
import { getEventsForAggregate } from '../../../shared/event-store.js';

const router = Router();

// Reuse same helper as others
function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

router.get('/contacts/:id', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  const contactId = req.params.id;

  try {
    const events = await getEventsForAggregate('contact', contactId);
    const state = projectContact(events);

    if (!state) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    console.log(`[ContactFetched]`, { traceId: trace.traceId, spanId: trace.spanId, contactId });
    return res.status(200).json(state);
  } catch (err) {
    console.error('[get-contact error]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

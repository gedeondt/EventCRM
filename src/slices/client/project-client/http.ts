import { Router } from 'express';
import { projectClient } from './index.js';
import { createTraceContext } from '../../../shared/trace.js';
import { getEventsForAggregate } from '../../../shared/event-store.js';

const router = Router();

function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

router.get('/clients/:id', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  const clientId = req.params.id;

  try {
    const events = await getEventsForAggregate('client', clientId);
    const state = projectClient(events);

    if (!state) {
      return res.status(404).json({ error: 'Client not found' });
    }

    console.log(`[ClientFetched]`, { traceId: trace.traceId, spanId: trace.spanId, clientId });
    return res.status(200).json(state);
  } catch (err) {
    console.error('[get-client error]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

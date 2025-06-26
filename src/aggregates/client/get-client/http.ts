import { Router } from 'express';
import { projectClient } from '../project-client.js';
import { extractTraceContext } from '../../../shared/trace.js';
import type { EventStore } from '../../../shared/event-store.js';

export function registerGetClientRoutes(router: Router, eventStore: EventStore) {

  router.get('/clients/:id', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const clientId = req.params.id;
    const startTime = Date.now();

    try {
      const events = await eventStore.getEventsForAggregate('client', clientId);
      const state = projectClient(events);

      if (!state) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const durationMs = Date.now() - startTime;
      console.log(`[ClientFetched]`, { traceId: trace.traceId, spanId: trace.spanId, clientId, durationMs });
      return res.status(200).json(state);
    } catch (err) {
      console.error('[get-client error]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


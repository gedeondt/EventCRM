import { Router } from 'express';
import { projectCase } from './index.js';
import { createTraceContext } from '../../../shared/trace.js';
import type { EventStore } from '../../../shared/event-store.js';

export function registerProjectCaseRoutes(router: Router, eventStore: EventStore) {
  function extractTraceFromHeaders(headers: Record<string, unknown>) {
    return createTraceContext({
      traceId: headers['x-trace-id']?.toString(),
      spanId: headers['x-span-id']?.toString(),
      source: headers['x-source']?.toString() || 'api',
      userId: headers['x-user-id']?.toString()
    });
  }

  router.get('/cases/:id', async (req, res) => {
    const trace = extractTraceFromHeaders(req.headers);
    const caseId = req.params.id;

    try {
      const events = await eventStore.getEventsForAggregate('case', caseId);
      const state = projectCase(events);

      if (!state) {
        return res.status(404).json({ error: 'Case not found' });
      }

      console.log(`[CaseFetched]`, { traceId: trace.traceId, spanId: trace.spanId, caseId });
      return res.status(200).json(state);
    } catch (err) {
      console.error('[get-case error]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

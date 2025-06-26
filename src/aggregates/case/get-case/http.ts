import { Router } from 'express';
import { projectCase } from '../project-case.js';
import { extractTraceContext } from '../../../shared/trace.js';
import type { EventStore } from '../../../shared/event-store.js';

export function registerGetCaseRoutes(router: Router, eventStore: EventStore) {

  router.get('/cases/:id', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const caseId = req.params.id;
    const startTime = Date.now();

    try {
      const events = await eventStore.getEventsForAggregate('case', caseId);
      const state = projectCase(events);

      if (!state) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const durationMs = Date.now() - startTime;
      console.log(`[CaseFetched]`, { traceId: trace.traceId, spanId: trace.spanId, caseId, durationMs });
      return res.status(200).json(state);
    } catch (err) {
      console.error('[get-case error]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

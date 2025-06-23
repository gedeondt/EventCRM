import { Router } from 'express';
import { projectOpenCases } from './index.js';
import { OpenCasesProjection } from './subscription.js';
import { createTraceContext } from '../../../shared/trace.js';
import type { EventStore } from '../../../shared/event-store.js';

export function registerOpenCasesRoutes(router: Router, eventStore: EventStore) {
  function extractTraceFromHeaders(headers: Record<string, unknown>) {
    return createTraceContext({
      traceId: headers['x-trace-id']?.toString(),
      spanId: headers['x-span-id']?.toString(),
      source: headers['x-source']?.toString() || 'api',
      userId: headers['x-user-id']?.toString()
    });
  }

  router.get('/cases/open', async (req, res) => {
    const trace = extractTraceFromHeaders(req.headers);
    const clientId = req.query.clientId?.toString();
    const startTime = Date.now();

    try {
      let cases;
      if (clientId) {
        const proj = (await eventStore.getProjection('client', clientId, 'open-cases')) as OpenCasesProjection | null;
        cases = proj?.cases || [];
      } else {
        const events = await eventStore.getEventsByPrefix('case#');
        cases = projectOpenCases(events);
      }
      const durationMs = Date.now() - startTime;
      console.log(`[OpenCasesFetched]`, { traceId: trace.traceId, spanId: trace.spanId, count: cases.length, clientId, durationMs });
      return res.status(200).json(cases);
    } catch (err) {
      console.error('[get-open-cases error]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

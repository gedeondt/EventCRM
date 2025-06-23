import { Router } from 'express';
import { projectContract } from '../project-contract.js';
import { createTraceContext } from '../../../shared/trace.js';
import type { EventStore } from '../../../shared/event-store.js';

export function registerGetContractRoutes(router: Router, eventStore: EventStore) {
  function extractTraceFromHeaders(headers: Record<string, unknown>) {
    return createTraceContext({
      traceId: headers['x-trace-id']?.toString(),
      spanId: headers['x-span-id']?.toString(),
      source: headers['x-source']?.toString() || 'api',
      userId: headers['x-user-id']?.toString()
    });
  }

  router.get('/contracts/:id', async (req, res) => {
    const trace = extractTraceFromHeaders(req.headers);
    const contractId = req.params.id;
    const startTime = Date.now();

    try {
      const events = await eventStore.getEventsForAggregate('contract', contractId);
      const state = projectContract(events);

      if (!state) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const durationMs = Date.now() - startTime;
      console.log(`[ContractFetched]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        contractId,
        durationMs
      });
      return res.status(200).json(state);
    } catch (err) {
      console.error('[get-contract error]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

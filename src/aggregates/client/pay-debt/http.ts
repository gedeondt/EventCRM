import { Router } from 'express';
import { handlePayDebt } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ClientId } from '../value-objects/client-id.js';

export function registerPayDebtRoutes(router: Router, eventStore: EventStore) {

  router.post('/clients/:id/debt/pay', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        clientId: new ClientId(req.params.id),
        amount: Number(req.body.amount),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handlePayDebt(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 6;
      const pk = `client#${result.value.clientId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'client', result.value.clientId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[DebtPaid]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        clientId: result.value.clientId,
        amount: result.value.amount,
        durationMs,
        pk,
        sk
      });
      return res.status(201).json({ status: 'ok' });
    } catch (err) {
      if (err instanceof EventStoreConflictError) {
        return res.status(409).json({
          error: 'Event already exists — possible duplicate or stale version.'
        });
      }

      const error = err as any;
      console.error('[pay-debt error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


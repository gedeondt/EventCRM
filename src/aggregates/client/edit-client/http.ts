import { Router } from 'express';
import { handleEditClient } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';
import { Industry } from '../value-objects/industry.js';

export function registerEditClientRoutes(router: Router, eventStore: EventStore) {

  router.put('/clients/:id', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        clientId: new ClientId(req.params.id),
        name: req.body.name ? new Name(req.body.name) : undefined,
        industry:
          req.body.industry !== undefined ? new Industry(req.body.industry) : undefined,
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleEditClient(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 2;
      const pk = `client#${result.value.clientId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'client', result.value.clientId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ClientEdited]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        clientId: result.value.clientId,
        durationMs,
        pk,
        sk
      });
      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      if (err instanceof EventStoreConflictError) {
        return res.status(409).json({
          error: 'Event already exists — possible duplicate or stale version.'
        });
      }

      const error = err as any;
      console.error('[edit-client error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


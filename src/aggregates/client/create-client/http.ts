import { Router } from 'express';
import { handleCreateClient } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';
import { Industry } from '../value-objects/industry.js';

export function registerCreateClientRoutes(router: Router, eventStore: EventStore) {

  router.post('/clients', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        clientId: new ClientId(req.body.clientId),
        name: new Name(req.body.name),
        industry: new Industry(req.body.industry),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleCreateClient(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 1;
      const pk = `client#${result.value.clientId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'client', result.value.clientId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ClientCreated]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        clientId: result.value.clientId,
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
      console.error('[create-client error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


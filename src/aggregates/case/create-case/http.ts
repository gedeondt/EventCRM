import { Router } from 'express';
import { handleCreateCase } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';
import { ClientId } from '../../client/value-objects/client-id.js';

export function registerCreateCaseRoutes(router: Router, eventStore: EventStore) {

  router.post('/cases', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        caseId: new CaseId(req.body.caseId),
        clientId: new ClientId(req.body.clientId),
        openedAt: req.body.openedAt,
        description: new Description(req.body.description),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleCreateCase(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 1;
      const pk = `case#${result.value.caseId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'case', result.value.caseId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[CaseCreated]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        caseId: result.value.caseId,
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
      console.error('[create-case error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

import { Router } from 'express';
import { handleCloseCase } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { CaseId } from '../value-objects/case-id.js';

export function registerCloseCaseRoutes(router: Router, eventStore: EventStore) {

  router.post('/cases/:id/close', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        caseId: new CaseId(req.params.id),
        closedAt: req.body.closedAt,
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleCloseCase(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 3; // TODO: real version
      const pk = `case#${cmd.caseId.value}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'case', cmd.caseId.value, version);
      const durationMs = Date.now() - startTime;
      console.log(`[CaseClosed]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        caseId: cmd.caseId.value,
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
      console.error('[close-case error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

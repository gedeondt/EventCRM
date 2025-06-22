import { Router } from 'express';
import { handleCloseCase } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';
import { CaseId } from '../value-objects/case-id.js';

export function registerCloseCaseRoutes(router: Router, eventStore: EventStore) {
  function extractTraceFromHeaders(headers: Record<string, unknown>) {
    return createTraceContext({
      traceId: headers['x-trace-id']?.toString(),
      spanId: headers['x-span-id']?.toString(),
      source: headers['x-source']?.toString() || 'api',
      userId: headers['x-user-id']?.toString()
    });
  }

  router.post('/cases/:id/close', async (req, res) => {
    const trace = extractTraceFromHeaders(req.headers);
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
      await eventStore.appendEvent(result.value, 'case', cmd.caseId.value, version);
      console.log(`[CaseClosed]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        caseId: cmd.caseId.value
      });
      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      const error = err as any;
      if (
        error.name === 'ConditionalCheckFailedException' ||
        error.code === 'ConditionalCheckFailedException'
      ) {
        return res.status(409).json({
          error: 'Event already exists — possible duplicate or stale version.'
        });
      }

      console.error('[close-case error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

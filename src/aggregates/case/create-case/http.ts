import { Router } from 'express';
import { handleCreateCase } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';
import { ClientId } from '../../client/value-objects/client-id.js';

export function registerCreateCaseRoutes(router: Router, eventStore: EventStore) {
  function extractTraceFromHeaders(headers: Record<string, unknown>) {
    return createTraceContext({
      traceId: headers['x-trace-id']?.toString(),
      spanId: headers['x-span-id']?.toString(),
      source: headers['x-source']?.toString() || 'api',
      userId: headers['x-user-id']?.toString()
    });
  }

  router.post('/cases', async (req, res) => {
    const trace = extractTraceFromHeaders(req.headers);
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
      await eventStore.appendEvent(result.value, 'case', result.value.caseId, 1);
      console.log(`[CaseCreated]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        caseId: result.value.caseId,
        clientId: result.value.clientId
      });
      return res.status(201).json({ status: 'ok' });
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

      console.error('[create-case error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

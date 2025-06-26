import { Router } from 'express';
import { handleAddInteraction } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';

export function registerAddInteractionRoutes(router: Router, eventStore: EventStore) {

  router.post('/cases/:id/interactions', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        caseId: new CaseId(req.params.id),
        interactionDate: req.body.interactionDate,
        description: new Description(req.body.description),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleAddInteraction(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 2; // TODO: real version
      const pk = `case#${cmd.caseId.value}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'case', cmd.caseId.value, version);
      const durationMs = Date.now() - startTime;
      console.log(`[InteractionAdded]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        caseId: cmd.caseId.value,
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
      console.error('[add-interaction error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

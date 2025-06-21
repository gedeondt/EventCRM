import { Router } from 'express';
import { handleEditClient } from './index.js';
import { appendEvent } from '../../../shared/event-store.js';
import { createTraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';

const router = Router();

function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

router.put('/clients/:id', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  let cmd;
  try {
    cmd = {
      clientId: new ClientId(req.params.id),
      name: req.body.name ? new Name(req.body.name) : undefined,
      trace
    };
  } catch (err) {
    const error = err as Error;
    return res.status(400).json({ error: error.message });
  }

  const result = handleEditClient(cmd);

  if (!result.ok) return res.status(400).json({ error: result.error });

  try {
    await appendEvent(result.value, 'client', result.value.clientId, 2);
    console.log(`[ClientEdited]`, {
      traceId: trace.traceId,
      spanId: trace.spanId,
      clientId: result.value.clientId
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

    console.error('[edit-client error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

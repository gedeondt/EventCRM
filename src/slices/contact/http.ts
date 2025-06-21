import { Router } from 'express';
import { handleCreateContact } from './create-contact.js';
import { handleEditContact } from './edit-contact.js';
import { appendEvent } from '../../shared/event-store.js';
import { createTraceContext } from '../../shared/trace.js';

const router = Router();

// Helper: construir TraceContext desde headers HTTP
function extractTraceFromHeaders(headers: Record<string, unknown>) {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}

// 📌 POST /contacts → Crear contacto
router.post('/contacts', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  const cmd = {
    ...req.body,
    trace
  };

  const result = handleCreateContact(cmd);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  try {
    await appendEvent(result.value, result.value.contactId, 1);
    console.log(`[ContactCreated]`, {
      traceId: trace.traceId,
      spanId: trace.spanId,
      contactId: result.value.contactId
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

    console.error('[create-contact error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 📌 PUT /contacts/:id → Editar contacto
router.put('/contacts/:id', async (req, res) => {
  const trace = extractTraceFromHeaders(req.headers);
  const contactId = req.params.id;

  const cmd = {
    contactId,
    name: req.body.name,
    email: req.body.email,
    trace
  };

  const result = handleEditContact(cmd);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  try {
    // TODO: obtener la versión real (de momento fija en 2)
    const version = 2;

    await appendEvent(result.value, contactId, version);
    console.log(`[ContactEdited]`, {
      traceId: trace.traceId,
      spanId: trace.spanId,
      contactId
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

    console.error('[edit-contact error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
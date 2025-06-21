// src/slices/contact/http.ts

import { Router } from 'express';
import { handleCreateContact } from './create-contact';
import { appendEvent } from '../../shared/event-store';

const router = Router();

router.post('/contacts', async (req, res) => {
  const cmd = req.body;
  const event = handleCreateContact(cmd);

  try {
    await appendEvent(event, event.contactId, 1); // versión inicial
    res.status(201).send({ status: 'ok' });
  } catch (err) {
    res.status(500).send({ error: (err as Error).message });
  }
});

export default router;
import { Router } from 'express';
import { handleChangeHolder } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ContractId } from '../value-objects/contract-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';
import { projectContract } from '../project-contract.js';
import { projectClient } from '../../client/project-client.js';

export function registerChangeHolderRoutes(router: Router, eventStore: EventStore) {

  router.post('/contracts/:id/change-holder', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let contractId: ContractId;
    let newClient: ClientId;
    try {
      contractId = new ContractId(req.params.id);
      newClient = new ClientId(req.body.clientId);
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    try {
      const events = await eventStore.getEventsForAggregate('contract', contractId.value);
      const state = projectContract(events);
      if (!state || !state.clientId) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const clientEvents = await eventStore.getEventsForAggregate('client', state.clientId);
      const clientState = projectClient(clientEvents);
      if (clientState && (clientState.debt || 0) > 0) {
        return res.status(400).json({ error: 'Client has outstanding debt' });
      }

      const cmd = {
        contractId,
        oldClientId: new ClientId(state.clientId),
        newClientId: newClient,
        trace
      };
      const result = handleChangeHolder(cmd);
      if (!result.ok) return res.status(400).json({ error: result.error });

      const version = events.length + 1;
      const pk = `contract#${contractId.value}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'contract', contractId.value, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContractHolderChanged]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        contractId: contractId.value,
        newClientId: newClient.value,
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
      console.error('[change-holder error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}


import { Router } from 'express';
import { handleCreateContract } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ContractId } from '../value-objects/contract-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';
import { Cups } from '../value-objects/cups.js';
import { Address } from '../value-objects/address.js';
import { Tariff } from '../value-objects/tariff.js';
import { Power } from '../value-objects/power.js';

export function registerCreateContractRoutes(router: Router, eventStore: EventStore) {

  router.post('/contracts', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        contractId: new ContractId(req.body.contractId),
        clientId: new ClientId(req.body.clientId),
        startDate: req.body.startDate,
        tariff: new Tariff(req.body.tariff),
        power: new Power(Number(req.body.power)),
        cups: new Cups(req.body.cups),
        address: new Address(req.body.address),
        trace
      };
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }

    const result = handleCreateContract(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const version = 1;
      const pk = `contract#${result.value.contractId}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'contract', result.value.contractId, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContractCreated]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        contractId: result.value.contractId,
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
      console.error('[create-contract error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

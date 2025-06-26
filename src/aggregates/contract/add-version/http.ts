import { Router } from 'express';
import { handleAddContractVersion } from './index.js';
import type { EventStore } from '../../../shared/event-store.js';
import { extractTraceContext } from '../../../shared/trace.js';
import { EventStoreConflictError } from '../../../shared/errors.js';
import { ContractId } from '../value-objects/contract-id.js';
import { Cups } from '../value-objects/cups.js';
import { Address } from '../value-objects/address.js';
import { Tariff } from '../value-objects/tariff.js';
import { Power } from '../value-objects/power.js';

export function registerAddVersionRoutes(router: Router, eventStore: EventStore) {

  router.post('/contracts/:id/versions', async (req, res) => {
    const trace = extractTraceContext(req.headers);
    const startTime = Date.now();
    let cmd;
    try {
      cmd = {
        contractId: new ContractId(req.params.id),
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

    const result = handleAddContractVersion(cmd);

    if (!result.ok) return res.status(400).json({ error: result.error });

    try {
      const events = await eventStore.getEventsForAggregate('contract', cmd.contractId.value);
      const version = events.length + 1;
      const pk = `contract#${cmd.contractId.value}`;
      const sk = `v${String(version).padStart(10, '0')}`;
      await eventStore.appendEvent(result.value, 'contract', cmd.contractId.value, version);
      const durationMs = Date.now() - startTime;
      console.log(`[ContractVersionAdded]`, {
        traceId: trace.traceId,
        spanId: trace.spanId,
        contractId: cmd.contractId.value,
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
      console.error('[add-contract-version error]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

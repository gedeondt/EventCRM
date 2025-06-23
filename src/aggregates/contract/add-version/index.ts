import { TraceContext } from '../../../shared/trace.js';
import { ContractId } from '../value-objects/contract-id.js';
import { Cups } from '../value-objects/cups.js';
import { Address } from '../value-objects/address.js';
import { Tariff } from '../value-objects/tariff.js';
import { Power } from '../value-objects/power.js';

export type AddContractVersionCommand = {
  contractId: ContractId;
  startDate: string;
  tariff: Tariff;
  power: Power;
  cups: Cups;
  address: Address;
  trace: TraceContext;
};

export type ContractVersionAddedEvent = {
  type: 'ContractVersionAdded';
  contractId: string;
  startDate: string;
  tariff: string;
  power: number;
  cups: string;
  address: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleAddContractVersion(
  cmd: AddContractVersionCommand
): Result<ContractVersionAddedEvent> {
  const event: ContractVersionAddedEvent = {
    type: 'ContractVersionAdded',
    contractId: cmd.contractId.value,
    startDate: cmd.startDate,
    tariff: cmd.tariff.value,
    power: cmd.power.value,
    cups: cmd.cups.value,
    address: cmd.address.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

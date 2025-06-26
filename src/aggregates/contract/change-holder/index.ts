import { TraceContext } from '../../../shared/trace.js';
import { ContractId } from '../value-objects/contract-id.js';
import { ClientId } from '../../client/value-objects/client-id.js';

export type ChangeHolderCommand = {
  contractId: ContractId;
  oldClientId: ClientId;
  newClientId: ClientId;
  trace: TraceContext;
};

export type ContractHolderChangedEvent = {
  type: 'ContractHolderChanged';
  contractId: string;
  oldClientId: string;
  newClientId: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function validate(cmd: ChangeHolderCommand): Result<ChangeHolderCommand> {
  if (cmd.oldClientId.value === cmd.newClientId.value) {
    return { ok: false, error: 'new client must differ from current client' };
  }
  return { ok: true, value: cmd };
}

export function handleChangeHolder(cmd: ChangeHolderCommand): Result<ContractHolderChangedEvent> {
  const valid = validate(cmd);
  if (!valid.ok) return { ok: false, error: valid.error };

  const event: ContractHolderChangedEvent = {
    type: 'ContractHolderChanged',
    contractId: cmd.contractId.value,
    oldClientId: cmd.oldClientId.value,
    newClientId: cmd.newClientId.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

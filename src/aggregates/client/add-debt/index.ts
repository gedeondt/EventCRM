import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';

export type AddDebtCommand = {
  clientId: ClientId;
  amount: number;
  trace: TraceContext;
};

export type DebtAddedEvent = {
  type: 'DebtAdded';
  clientId: string;
  amount: number;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function validate(cmd: AddDebtCommand): Result<AddDebtCommand> {
  if (cmd.amount <= 0 || isNaN(cmd.amount)) {
    return { ok: false, error: 'amount must be greater than 0' };
  }
  return { ok: true, value: cmd };
}

export function handleAddDebt(cmd: AddDebtCommand): Result<DebtAddedEvent> {
  const valid = validate(cmd);
  if (!valid.ok) return { ok: false, error: valid.error };

  const event: DebtAddedEvent = {
    type: 'DebtAdded',
    clientId: cmd.clientId.value,
    amount: cmd.amount,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

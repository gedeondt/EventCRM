import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';

export type PayDebtCommand = {
  clientId: ClientId;
  amount: number;
  trace: TraceContext;
};

export type DebtPaidEvent = {
  type: 'DebtPaid';
  clientId: string;
  amount: number;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function validate(cmd: PayDebtCommand): Result<PayDebtCommand> {
  if (cmd.amount <= 0 || isNaN(cmd.amount)) {
    return { ok: false, error: 'amount must be greater than 0' };
  }
  return { ok: true, value: cmd };
}

export function handlePayDebt(cmd: PayDebtCommand): Result<DebtPaidEvent> {
  const valid = validate(cmd);
  if (!valid.ok) return { ok: false, error: valid.error };

  const event: DebtPaidEvent = {
    type: 'DebtPaid',
    clientId: cmd.clientId.value,
    amount: cmd.amount,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

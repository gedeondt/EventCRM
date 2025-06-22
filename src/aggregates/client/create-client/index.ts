import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';
import { Industry } from '../value-objects/industry.js';

export type CreateClientCommand = {
  clientId: ClientId;
  name: Name;
  industry: Industry;
  trace: TraceContext;
};

export type ClientCreatedEvent = {
  type: 'ClientCreated';
  clientId: string;
  name: string;
  industry: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleCreateClient(
  cmd: CreateClientCommand
): Result<ClientCreatedEvent> {
  const event: ClientCreatedEvent = {
    type: 'ClientCreated',
    clientId: cmd.clientId.value,
    name: cmd.name.value,
    industry: cmd.industry.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

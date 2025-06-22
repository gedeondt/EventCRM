import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';

export type CreateClientCommand = {
  clientId: ClientId;
  name: Name;
  trace: TraceContext;
};

export type ClientCreatedEvent = {
  type: 'ClientCreated';
  clientId: string;
  name: string;
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
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

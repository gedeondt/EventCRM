import { TraceContext } from '../../../shared/trace.js';
import { ClientId } from '../value-objects/client-id.js';
import { Name } from '../value-objects/name.js';
import { Industry } from '../value-objects/industry.js';

export type EditClientCommand = {
  clientId: ClientId;
  name?: Name;
  industry?: Industry;
  trace: TraceContext;
};

export type ClientEditedEvent = {
  type: 'ClientEdited';
  clientId: string;
  name?: string;
  industry?: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function validate(cmd: EditClientCommand): Result<EditClientCommand> {
  if (!cmd.name && !cmd.industry) {
    return { ok: false, error: 'nothing to update' };
  }

  return { ok: true, value: cmd };
}

export function handleEditClient(
  cmd: EditClientCommand
): Result<ClientEditedEvent> {
  const valid = validate(cmd);
  if (!valid.ok) return { ok: false, error: valid.error };

  const event: ClientEditedEvent = {
    type: 'ClientEdited',
    clientId: cmd.clientId.value,
    name: cmd.name?.value,
    industry: cmd.industry?.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

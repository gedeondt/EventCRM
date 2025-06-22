import { TraceContext } from '../../../shared/trace.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';
import { ClientId } from '../../client/value-objects/client-id.js';

export type CreateCaseCommand = {
  caseId: CaseId;
  clientId: ClientId;
  openedAt: string;
  description: Description;
  trace: TraceContext;
};

export type CaseCreatedEvent = {
  type: 'CaseCreated';
  caseId: string;
  clientId: string;
  openedAt: string;
  description: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleCreateCase(cmd: CreateCaseCommand): Result<CaseCreatedEvent> {
  const event: CaseCreatedEvent = {
    type: 'CaseCreated',
    caseId: cmd.caseId.value,
    clientId: cmd.clientId.value,
    openedAt: cmd.openedAt,
    description: cmd.description.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

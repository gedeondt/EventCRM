import { TraceContext } from '../../../shared/trace.js';
import { CaseId } from '../value-objects/case-id.js';

export type CloseCaseCommand = {
  caseId: CaseId;
  closedAt: string;
  trace: TraceContext;
};

export type CaseClosedEvent = {
  type: 'CaseClosed';
  caseId: string;
  closedAt: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleCloseCase(cmd: CloseCaseCommand): Result<CaseClosedEvent> {
  const event: CaseClosedEvent = {
    type: 'CaseClosed',
    caseId: cmd.caseId.value,
    closedAt: cmd.closedAt,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

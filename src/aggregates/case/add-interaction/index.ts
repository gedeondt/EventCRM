import { TraceContext } from '../../../shared/trace.js';
import { CaseId } from '../value-objects/case-id.js';
import { Description } from '../value-objects/description.js';

export type AddInteractionCommand = {
  caseId: CaseId;
  interactionDate: string;
  description: Description;
  trace: TraceContext;
};

export type InteractionAddedEvent = {
  type: 'InteractionAdded';
  caseId: string;
  interactionDate: string;
  description: string;
  trace: TraceContext;
  timestamp: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function handleAddInteraction(
  cmd: AddInteractionCommand
): Result<InteractionAddedEvent> {
  const event: InteractionAddedEvent = {
    type: 'InteractionAdded',
    caseId: cmd.caseId.value,
    interactionDate: cmd.interactionDate,
    description: cmd.description.value,
    trace: cmd.trace,
    timestamp: new Date().toISOString()
  };

  return { ok: true, value: event };
}

export type OpenCasesProjection = {
  cases: { caseId: string; description: string; interactions: number }[];
};

import type { EventStore, ProjectionDirective } from '../../../shared/event-store.js';
import { projectCase } from '../project-case.js';

function makeDirective(clientId: string, proj: OpenCasesProjection): ProjectionDirective {
  return {
    projection: proj,
    aggregateType: 'client',
    aggregateId: clientId,
    name: 'open-cases'
  };
}

async function loadProjection(eventStore: EventStore, clientId: string): Promise<OpenCasesProjection> {
  const existing = await eventStore.getProjection('client', clientId, 'open-cases');
  if (existing && existing.cases) return { cases: existing.cases } as OpenCasesProjection;
  return { cases: [] };
}

export function registerOpenCasesProjection(eventStore: EventStore) {
  eventStore.subscribeProjection('CaseCreated', async (evt) => {
    const proj = await loadProjection(eventStore, evt.clientId);
    proj.cases.push({ caseId: evt.caseId, description: evt.description, interactions: 0 });
    return makeDirective(evt.clientId, proj);
  });

  eventStore.subscribeProjection('InteractionAdded', async (evt) => {
    const events = await eventStore.getEventsForAggregate('case', evt.caseId);
    const state = projectCase(events);
    if (!state || !state.clientId || state.closedAt) return;
    const proj = await loadProjection(eventStore, state.clientId);
    const item = proj.cases.find(c => c.caseId === evt.caseId);
    if (item) item.interactions += 1;
    return makeDirective(state.clientId, proj);
  });

  eventStore.subscribeProjection('CaseClosed', async (evt) => {
    const events = await eventStore.getEventsForAggregate('case', evt.caseId);
    const state = projectCase(events);
    if (!state || !state.clientId) return;
    const proj = await loadProjection(eventStore, state.clientId);
    proj.cases = proj.cases.filter(c => c.caseId !== evt.caseId);
    return makeDirective(state.clientId, proj);
  });
}

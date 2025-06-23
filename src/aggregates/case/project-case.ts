export type CaseState = {
  caseId: string;
  clientId?: string;
  description?: string;
  openedAt?: string;
  closedAt?: string;
  interactions: { date: string; description: string }[];
  version: number;
};

export function projectCase(events: any[]): CaseState | null {
  if (!events.length) return null;

  const state: CaseState = {
    caseId: '',
    clientId: undefined,
    interactions: [],
    version: 0
  };

  for (const event of events) {
    switch (event.type) {
      case 'CaseCreated':
        state.caseId = event.caseId;
        state.clientId = event.clientId;
        state.description = event.description;
        state.openedAt = event.openedAt;
        state.version += 1;
        break;
      case 'InteractionAdded':
        state.interactions.push({
          date: event.interactionDate,
          description: event.description
        });
        state.version += 1;
        break;
      case 'CaseClosed':
        state.closedAt = event.closedAt;
        state.version += 1;
        break;
    }
  }

  return state;
}

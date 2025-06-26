export type ClientState = {
  clientId: string;
  name?: string;
  industry?: string;
  contactIds: string[];
  debt: number;
  version: number;
};

export function projectClient(events: any[]): ClientState | null {
  if (!events.length) return null;

  const state: ClientState = {
    clientId: '',
    contactIds: [],
    debt: 0,
    version: 0
  };

  for (const event of events) {
    switch (event.type) {
      case 'ClientCreated':
        state.clientId = event.clientId;
        state.name = event.name;
        state.industry = event.industry;
        state.version += 1;
        break;

      case 'ClientEdited':
        if (event.name) state.name = event.name;
        if (event.industry) state.industry = event.industry;
        state.version += 1;
        break;

      case 'ContactLinked':
        if (!state.contactIds.includes(event.contactId)) {
          state.contactIds.push(event.contactId);
        }
        state.version += 1;
        break;

      case 'ContactUnlinked':
        state.contactIds = state.contactIds.filter(
          (id) => id !== event.contactId
        );
        state.version += 1;
        break;

      case 'DebtAdded':
        state.debt += event.amount;
        state.version += 1;
        break;

      case 'DebtPaid':
        state.debt = Math.max(0, state.debt - event.amount);
        state.version += 1;
        break;
    }
  }

  return state;
}

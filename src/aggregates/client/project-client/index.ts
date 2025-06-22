export type ClientState = {
  clientId: string;
  name?: string;
  industry?: string;
  contactIds: string[];
  version: number;
};

export function projectClient(events: any[]): ClientState | null {
  if (!events.length) return null;

  const state: ClientState = {
    clientId: '',
    contactIds: [],
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
    }
  }

  return state;
}

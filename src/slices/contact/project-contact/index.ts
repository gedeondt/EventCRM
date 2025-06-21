// src/slices/contact/project-contact.ts

type ContactState = {
  contactId: string;
  name?: string;
  email?: string;
  version: number;
};

export function projectContact(events: any[]): ContactState | null {
  if (!events.length) return null;

  const state: ContactState = {
    contactId: '',
    version: 0
  };

  for (const event of events) {
    switch (event.type) {
      case 'ContactCreated':
        state.contactId = event.contactId;
        state.name = event.name;
        state.email = event.email;
        state.version += 1;
        break;

      case 'ContactEdited':
        if (event.name) state.name = event.name;
        if (event.email) state.email = event.email;
        state.version += 1;
        break;
    }
  }

  return state;
}
// src/slices/contact/create-contact.ts

export type CreateContactCommand = {
  contactId: string;
  name: string;
  email: string;
};

export type ContactCreatedEvent = {
  type: 'ContactCreated';
  contactId: string;
  name: string;
  email: string;
  timestamp: string;
};

export function handleCreateContact(cmd: CreateContactCommand): ContactCreatedEvent {
  return {
    type: 'ContactCreated',
    contactId: cmd.contactId,
    name: cmd.name,
    email: cmd.email,
    timestamp: new Date().toISOString(),
  };
}